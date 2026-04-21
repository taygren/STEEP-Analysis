// ─────────────────────────────────────────────────────────────────────────────
// Multi-provider analyze proxy (OpenAI-compatible chat completions)
//
// All supported providers expose an OpenAI-style /chat/completions endpoint with
// SSE streaming, JSON-object response_format, and Bearer auth. To add another
// provider, append an entry to PROVIDERS — no other code change required.
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  groq: {
    label:   'Groq',
    url:     'https://api.groq.com/openai/v1/chat/completions',
    envKey:  'GROQ_API_KEY',
    default: 'llama-3.3-70b-versatile',
  },
  cerebras: {
    label:   'Cerebras',
    url:     'https://api.cerebras.ai/v1/chat/completions',
    envKey:  'CEREBRAS_API_KEY',
    default: 'llama-3.3-70b',
  },
};

const MAX_RETRIES       = 6;
const MAX_RETRY_WAIT_MS = 90_000;

/** Strip accidental "NAME=..." prefix or surrounding quotes from secret values. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/** Parse "try again in 8m18.528s" / "1h2m3.4s" / "5.2s" — returns ms. */
function parseRetryAfterMs(errorText) {
  const m = errorText.match(/try again in\s+(?:(\d+)h)?(?:(\d+)m)?([\d.]+)?s/i);
  if (!m) return 5000;
  const hours   = parseInt(m[1] || '0', 10);
  const minutes = parseInt(m[2] || '0', 10);
  const seconds = parseFloat(m[3] || '0');
  return Math.ceil((hours * 3600 + minutes * 60 + seconds) * 1000) + 500;
}

/** Detect whether a 429 is a per-day cap vs per-minute cap. */
function classifyRateLimit(errorText) {
  if (/tokens per day|requests per day|TPD|RPD|daily/i.test(errorText))     return 'daily';
  if (/tokens per minute|requests per minute|TPM|RPM|per minute/i.test(errorText)) return 'minute';
  return 'unknown';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/analyze
 * Body: { systemPrompt, userMessage, model, numPredict, provider? }
 *
 * Routes to the requested provider (default: groq), retries transient
 * per-minute rate limits, and fails fast on per-day caps so the daily
 * quota isn't burned on hopeless retries. Streams the SSE response back.
 */
export async function POST(request) {
  const { systemPrompt, userMessage, model, numPredict, provider = 'groq' } = await request.json();

  const cfg = PROVIDERS[provider];
  if (!cfg) {
    return Response.json(
      { error: `Unknown provider: ${provider}. Supported: ${Object.keys(PROVIDERS).join(', ')}` },
      { status: 400 },
    );
  }

  const apiKey = cleanApiKey(process.env[cfg.envKey]);
  if (!apiKey) {
    return Response.json(
      { error: `${cfg.envKey} is not configured for provider "${provider}"`, provider },
      { status: 503 },
    );
  }

  if (!systemPrompt || !userMessage) {
    return Response.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 });
  }

  const selectedModel = model || cfg.default;
  const body = JSON.stringify({
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage   },
    ],
    stream: true,
    temperature: 0.1,
    max_tokens: numPredict || 1200,
    response_format: { type: 'json_object' },
  });

  let lastError = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const upstream = await fetch(cfg.url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body,
      });

      if (upstream.status === 429) {
        const errText   = await upstream.text();
        const waitMs    = parseRetryAfterMs(errText);
        const limitKind = classifyRateLimit(errText);
        lastError = errText;

        // Fail fast when retrying is hopeless or wasteful:
        //   - Per-day cap: only the daily reset clears it; retrying burns more quota.
        //   - Any wait longer than MAX_RETRY_WAIT_MS.
        if (limitKind === 'daily' || waitMs > MAX_RETRY_WAIT_MS) {
          console.warn(`[analyze:${provider}] ${limitKind} rate limit — failing fast (would need ${Math.round(waitMs/1000)}s)`);
          return Response.json(
            {
              error: errText,
              errorType: limitKind === 'daily' ? 'rate_limit_daily' : 'rate_limit_long_wait',
              waitSeconds: Math.round(waitMs / 1000),
              model: selectedModel,
              provider,
            },
            { status: 429 },
          );
        }

        console.warn(`[analyze:${provider}] minute rate limit — waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        await sleep(waitMs);
        continue;
      }

      if (!upstream.ok) {
        const text = await upstream.text();
        return Response.json({ error: text, provider, model: selectedModel }, { status: upstream.status });
      }

      // Success — stream OpenAI-format SSE through to the client unchanged
      return new Response(upstream.body, {
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
    {
      error: `Rate limit exceeded after ${MAX_RETRIES} retries: ${lastError}`,
      errorType: 'rate_limit_minute',
      provider,
    },
    { status: 429 },
  );
}
