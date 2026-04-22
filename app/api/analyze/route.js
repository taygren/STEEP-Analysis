const GROQ_API_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const DEFAULT_MODEL    = process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
const MAX_RETRIES      = 6;

/**
 * Resolve which provider to use based on the model id.
 * Cerebras models are prefixed with "cerebras/" in the catalog (e.g. "cerebras/llama-3.3-70b").
 * Everything else falls through to Groq.
 */
function resolveProvider(modelId) {
  if (modelId && modelId.startsWith('cerebras/')) {
    return {
      name:    'cerebras',
      url:     CEREBRAS_API_URL,
      apiKey:  cleanApiKey(process.env.CEREBRAS_API_KEY),
      keyName: 'CEREBRAS_API_KEY',
      model:   modelId.slice('cerebras/'.length),
    };
  }
  return {
    name:    'groq',
    url:     GROQ_API_URL,
    apiKey:  cleanApiKey(process.env.GROQ_API_KEY),
    keyName: 'GROQ_API_KEY',
    model:   modelId,
  };
}

/** Strip accidental "GROQ_API_KEY=..." or surrounding quotes from the secret value. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/** Parse Groq's "try again in 8m18.528s" / "1h2m3.4s" / "5.2s" format. Returns ms. */
function parseRetryAfterMs(errorText) {
  const m = errorText.match(/try again in\s+(?:(\d+)h)?(?:(\d+)m)?([\d.]+)?s/i);
  if (!m) return 5000;
  const hours   = parseInt(m[1] || '0', 10);
  const minutes = parseInt(m[2] || '0', 10);
  const seconds = parseFloat(m[3] || '0');
  return Math.ceil((hours * 3600 + minutes * 60 + seconds) * 1000) + 500;
}

/** Detect whether a Groq 429 is a per-day (TPD) cap vs a per-minute (TPM) cap. */
function classifyRateLimit(errorText) {
  if (/tokens per day|TPD/i.test(errorText))    return 'daily';
  if (/tokens per minute|TPM/i.test(errorText)) return 'minute';
  return 'unknown';
}

/** Maximum we're willing to wait inside a single request before failing fast. */
const MAX_RETRY_WAIT_MS = 90_000;

/** Sleep for ms milliseconds. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/analyze
 * Body: { systemPrompt, userMessage, model, numPredict }
 *
 * Calls Groq's chat completions API with automatic retry on 429 rate-limit errors.
 * Streams the SSE response (OpenAI format) back to the client.
 * Each data line: { choices: [{ delta: { content } }] }
 * Final line:     data: [DONE]
 */
export async function POST(request) {
  const { systemPrompt, userMessage, model, numPredict } = await request.json();

  if (!systemPrompt || !userMessage) {
    return Response.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 });
  }

  const selectedModel = model || DEFAULT_MODEL;
  const provider      = resolveProvider(selectedModel);

  if (!provider.apiKey) {
    return Response.json({ error: `${provider.keyName} is not configured` }, { status: 503 });
  }

  // Cerebras models tend to be more verbose (especially Qwen 235B), so the same
  // max_tokens that fits Groq's Llama can truncate the JSON mid-array on Cerebras.
  // We double the budget for Cerebras since the daily token cap is far larger there.
  const baseMaxTokens = numPredict || 1200;
  const effectiveMaxTokens = provider.name === 'cerebras' ? baseMaxTokens * 2 : baseMaxTokens;

  const body = JSON.stringify({
    model: provider.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage   },
    ],
    stream: true,
    temperature: 0.1,
    max_tokens: effectiveMaxTokens,
    response_format: { type: 'json_object' },
  });

  let lastError = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const groqRes = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body,
      });

      if (groqRes.status === 429) {
        const errText  = await groqRes.text();
        const waitMs   = parseRetryAfterMs(errText);
        const limitKind = classifyRateLimit(errText);
        lastError = errText;

        // FAIL FAST when retrying is hopeless or wasteful:
        //  - Per-day cap (TPD): only the daily reset clears it; retrying burns more quota.
        //  - Per-minute cap with a wait longer than MAX_RETRY_WAIT_MS.
        if (limitKind === 'daily' || waitMs > MAX_RETRY_WAIT_MS) {
          console.warn(`[analyze] ${limitKind} rate limit — failing fast (would need to wait ${Math.round(waitMs/1000)}s)`);
          return Response.json(
            {
              error: errText,
              errorType: limitKind === 'daily' ? 'rate_limit_daily' : 'rate_limit_long_wait',
              waitSeconds: Math.round(waitMs / 1000),
              model: selectedModel,
              provider: provider.name,
            },
            { status: 429 },
          );
        }

        console.warn(`[analyze] minute rate limit — waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        await sleep(waitMs);
        continue; // retry
      }

      if (!groqRes.ok) {
        const text = await groqRes.text();
        return Response.json({ error: text }, { status: groqRes.status });
      }

      // Success — stream through
      return new Response(groqRes.body, {
        headers: {
          'Content-Type':      'text/event-stream',
          'Cache-Control':     'no-cache',
          'X-Accel-Buffering': 'no',
        },
      });

    } catch (err) {
      lastError = err.message;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(2000 * (attempt + 1));
      }
    }
  }

  return Response.json(
    { error: `Rate limit exceeded after ${MAX_RETRIES} retries: ${lastError}`, errorType: 'rate_limit_minute' },
    { status: 429 },
  );
}
