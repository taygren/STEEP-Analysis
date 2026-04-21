/** Strip accidental "GROQ_API_KEY=..." or surrounding quotes from the secret value. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/** Probe a provider's /models endpoint to confirm the API key works and the service is reachable. */
async function probe(name, url, apiKey) {
  if (!apiKey) return { name, ok: false, error: 'API key not configured' };
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return { name, ok: false, error: `${res.status}` };
    return { name, ok: true };
  } catch (err) {
    return { name, ok: false, error: err.message };
  }
}

/**
 * GET /api/health
 * Probes every configured provider in parallel and returns the aggregate status.
 * The app is considered "online" if at least one provider is reachable.
 */
export async function GET() {
  const results = await Promise.all([
    probe('groq',     'https://api.groq.com/openai/v1/models',  cleanApiKey(process.env.GROQ_API_KEY)),
    probe('cerebras', 'https://api.cerebras.ai/v1/models',      cleanApiKey(process.env.CEREBRAS_API_KEY)),
  ]);

  const anyOk = results.some(r => r.ok);
  return Response.json(
    { ok: anyOk, providers: results },
    { status: anyOk ? 200 : 503 },
  );
}
