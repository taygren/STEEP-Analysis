// ─────────────────────────────────────────────────────────────────────────────
// GET /api/models
//
// Returns the curated multi-provider catalog of models the app supports,
// filtered to only those whose provider has an API key configured.
// Also returns a per-provider configured map so the UI can disable provider
// options that have no key.
// ─────────────────────────────────────────────────────────────────────────────

const ALL_MODELS = [
  // Groq
  { id: 'llama-3.3-70b-versatile', provider: 'groq', label: 'Llama 3.3 70B',        note: 'Best quality on Groq · 100k tokens/day free' },
  { id: 'llama-3.1-8b-instant',    provider: 'groq', label: 'Llama 3.1 8B Instant', note: 'Fastest on Groq · separate daily quota from 70B' },

  // Cerebras (separate daily quota — great fallback when Groq is exhausted)
  { id: 'llama-3.3-70b',                   provider: 'cerebras', label: 'Llama 3.3 70B',     note: 'Cerebras · ~2,000 tok/sec · separate daily quota' },
  { id: 'llama-4-scout-17b-16e-instruct',  provider: 'cerebras', label: 'Llama 4 Scout 17B', note: 'Cerebras · newest Llama 4, fast and capable' },
  { id: 'llama3.1-8b',                     provider: 'cerebras', label: 'Llama 3.1 8B',      note: 'Cerebras · fastest, lowest token cost' },
];

export async function GET() {
  const configured = {
    groq:     !!process.env.GROQ_API_KEY,
    cerebras: !!process.env.CEREBRAS_API_KEY,
  };

  const models = ALL_MODELS
    .filter(m => configured[m.provider])
    .map(m => ({ name: m.id, ...m }));

  return Response.json({ providers: configured, models });
}
