const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
const MAX_RETRIES   = 4;

/** Strip accidental "GROQ_API_KEY=..." or surrounding quotes from the secret value. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/** Parse "Please try again in X.XXXs" from a Groq 429 error message. Returns ms. */
function parseRetryAfterMs(errorText) {
  const match = errorText.match(/try again in\s+([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 5000;
}

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
  const apiKey = cleanApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 });
  }

  const { systemPrompt, userMessage, model, numPredict } = await request.json();

  if (!systemPrompt || !userMessage) {
    return Response.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 });
  }

  const selectedModel = model || DEFAULT_MODEL;
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
      const groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body,
      });

      if (groqRes.status === 429) {
        const errText = await groqRes.text();
        const waitMs  = parseRetryAfterMs(errText);
        lastError = errText;
        console.warn(`[analyze] 429 rate limit — waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
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

  return Response.json({ error: `Rate limit exceeded after ${MAX_RETRIES} retries: ${lastError}` }, { status: 429 });
}
