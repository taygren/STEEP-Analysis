/** Strip accidental "GROQ_API_KEY=..." or surrounding quotes from the secret value. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/**
 * GET /api/health
 * Verifies the Groq API key is present and reachable.
 */
export async function GET() {
  const apiKey = cleanApiKey(process.env.GROQ_API_KEY);

  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'GROQ_API_KEY environment variable is not set' },
      { status: 503 },
    );
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json(
        { ok: false, error: `Groq API responded ${res.status}` },
        { status: 503 },
      );
    }

    return Response.json({ ok: true, provider: 'groq' });
  } catch (err) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 503 },
    );
  }
}
