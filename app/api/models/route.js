const OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json({ models: [], error: `Ollama responded ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      // Convert bytes to GB for display
      sizeGb: m.size ? (m.size / 1e9).toFixed(1) : null,
      modified: m.modified_at,
      details: m.details || {},
    }));

    return Response.json({ models });
  } catch (err) {
    return Response.json({ models: [], error: err.message }, { status: 503 });
  }
}
