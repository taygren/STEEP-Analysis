const OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.STEEP_DEFAULT_MODEL || 'llama3.1:8b';

/**
 * POST /api/analyze
 * Body: { systemPrompt, userMessage, model }
 *
 * Proxies a chat completion request to Ollama and streams the response
 * back as NDJSON. Each line is a partial Ollama chat chunk:
 *   { model, message: { role, content }, done }
 *
 * The client accumulates content tokens until done=true, then parses JSON.
 */
export async function POST(request) {
  const { systemPrompt, userMessage, model } = await request.json();

  if (!systemPrompt || !userMessage) {
    return Response.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 });
  }

  const selectedModel = model || DEFAULT_MODEL;

  try {
    const ollamaRes = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage   },
        ],
        stream: true,
        format: 'json',       // Force Ollama JSON output mode
        options: {
          temperature:  0.1,  // Low temperature for consistent structured output
          num_ctx:      8192, // Context window
          num_predict:  3000, // Max tokens in response
          top_p:        0.9,
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return Response.json({ error: text }, { status: ollamaRes.status });
    }

    // Stream Ollama's NDJSON response directly to the client
    return new Response(ollamaRes.body, {
      headers: {
        'Content-Type':     'application/x-ndjson',
        'Cache-Control':    'no-cache',
        'X-Accel-Buffering':'no',           // Disable Nginx buffering if behind proxy
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 503 });
  }
}
