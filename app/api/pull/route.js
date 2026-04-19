const OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * POST /api/pull  { model: "llama3.1:8b" }
 * Streams Ollama's pull progress as NDJSON lines to the client.
 * Each line: { status, completed, total, digest }
 */
export async function POST(request) {
  const { model } = await request.json();

  if (!model) {
    return Response.json({ error: 'model name is required' }, { status: 400 });
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: true }),
      // No timeout — pulls can take minutes for large models
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      return Response.json({ error: text }, { status: ollamaRes.status });
    }

    return new Response(ollamaRes.body, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 503 });
  }
}
