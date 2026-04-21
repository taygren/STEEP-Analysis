/** Strip accidental "TAVILY_API_KEY=..." or surrounding quotes from the secret value. */
function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eqIdx = key.indexOf('=');
  if (eqIdx !== -1) key = key.slice(eqIdx + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

/**
 * POST /api/research
 * Body: { query: string, max_results?: number, days?: number }
 * Calls Tavily and returns a normalized list of recent sources.
 *
 * Always responds 200 with { ok, sources, error? } so the orchestrator
 * can degrade gracefully when the key is missing or the API is down.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, sources: [], error: 'invalid JSON' });
  }
  const { query, max_results = 4, days = 180 } = body || {};

  if (!query || typeof query !== 'string') {
    return Response.json({ ok: false, sources: [], error: 'query is required' });
  }

  const apiKey = cleanApiKey(process.env.TAVILY_API_KEY);
  if (!apiKey) {
    return Response.json({ ok: false, sources: [], error: 'TAVILY_API_KEY not configured' });
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        max_results: Math.min(Math.max(max_results, 1), 10),
        days: Math.min(Math.max(days, 1), 365),
        include_answer: false,
        topic: 'news',
      }),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return Response.json({
        ok: false,
        sources: [],
        error: `Tavily ${res.status}: ${t.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    const sources = (data.results || [])
      .map((r) => ({
        title:     (r.title || '').toString().slice(0, 200),
        url:       (r.url || '').toString(),
        snippet:   (r.content || '').toString().replace(/\s+/g, ' ').trim().slice(0, 400),
        published: r.published_date || null,
      }))
      .filter((s) => s.url);

    return Response.json({ ok: true, sources });
  } catch (err) {
    return Response.json({
      ok: false,
      sources: [],
      error: err.message || 'fetch failed',
    });
  }
}
