const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';

/**
 * POST /api/analyze
 * Body: { systemPrompt, userMessage, model, numPredict }
 *
 * Calls the Groq chat completions API and streams the SSE response
 * back to the client as-is (OpenAI SSE format).
 * Each data line: { choices: [{ delta: { content } }] }
 * Final line:     data: [DONE]
 */
export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 });
  }

  const { systemPrompt, userMessage, model, numPredict } = await request.json();

  if (!systemPrompt || !userMessage) {
    return Response.json({ error: 'systemPrompt and userMessage are required' }, { status: 400 });
  }

  const selectedModel = model || DEFAULT_MODEL;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage   },
        ],
        stream: true,
        temperature: 0.1,
        max_tokens: numPredict || 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      return Response.json({ error: text }, { status: groqRes.status });
    }

    return new Response(groqRes.body, {
      headers: {
        'Content-Type':      'text/event-stream',
        'Cache-Control':     'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 503 });
  }
}
