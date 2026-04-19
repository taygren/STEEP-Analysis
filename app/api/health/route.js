const OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA}/api/version`, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json({ ok: false, error: `Ollama responded ${res.status}` }, { status: 503 });
    }

    const data = await res.json();
    return Response.json({ ok: true, version: data.version, base: OLLAMA });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message, hint: 'Make sure Ollama is running: `ollama serve`' },
      { status: 503 }
    );
  }
}
