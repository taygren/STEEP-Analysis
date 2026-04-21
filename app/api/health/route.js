// ─────────────────────────────────────────────────────────────────────────────
// Multi-provider health check.
// GET /api/health                — checks the default provider (groq).
// GET /api/health?provider=NAME  — checks a specific provider.
// GET /api/health?all=1          — returns status for every configured provider.
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDERS = {
  groq:     { url: 'https://api.groq.com/openai/v1/models',  envKey: 'GROQ_API_KEY' },
  cerebras: { url: 'https://api.cerebras.ai/v1/models',      envKey: 'CEREBRAS_API_KEY' },
};

function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

async function probe(provider) {
  const cfg = PROVIDERS[provider];
  if (!cfg) return { ok: false, provider, error: 'Unknown provider' };

  const apiKey = cleanApiKey(process.env[cfg.envKey]);
  if (!apiKey) return { ok: false, provider, error: `${cfg.envKey} is not set` };

  try {
    const res = await fetch(cfg.url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal:  AbortSignal.timeout(8000),
      cache:   'no-store',
    });
    if (!res.ok) return { ok: false, provider, error: `${provider} API responded ${res.status}` };
    return { ok: true, provider };
  } catch (err) {
    return { ok: false, provider, error: err.message };
  }
}

export async function GET(request) {
  const url = new URL(request.url);

  if (url.searchParams.get('all') === '1') {
    const results = await Promise.all(Object.keys(PROVIDERS).map(probe));
    const byProvider = Object.fromEntries(results.map(r => [r.provider, r]));
    const anyOk = results.some(r => r.ok);
    return Response.json({ ok: anyOk, providers: byProvider }, { status: anyOk ? 200 : 503 });
  }

  const provider = url.searchParams.get('provider') || 'groq';
  const result = await probe(provider);
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
