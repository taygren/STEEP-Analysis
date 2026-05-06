/**
 * POST /api/prediction-markets/proxy
 *
 * Server-side proxy to the Polymarket Gamma API with AI relevance scoring.
 *
 * Accepts { searchTerms, tags, subject, synthesis } and:
 *   1. Runs each searchTerm as a parallel _q full-text search against Gamma API
 *   2. Runs supplementary tag-based fetches for additional coverage
 *   3. Deduplicates across all results (up to ~150 raw markets)
 *   4. Calls Groq (llama-3.1-8b-instant) to score each market for relevance
 *      and generate a one-sentence STEEP angle per market
 *   5. Filters out markets with relevanceScore < 0.45
 *   6. Returns scored, sorted markets
 *
 * Running server-side avoids browser CORS restrictions. Browser-like headers
 * are sent to minimise Cloudflare JA3 friction.
 */

import { NextResponse } from 'next/server';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
export const maxDuration = 40;

const GAMMA_BASE = 'https://gamma-api.polymarket.com/markets';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const SCORE_MODEL = 'llama-3.1-8b-instant';
const RELEVANCE_THRESHOLD = 0.45;
const MAX_RAW_MARKETS = 150;
const SCORE_BATCH_SIZE = 40;

const BROWSER_HEADERS = {
  'User-Agent':        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':            'application/json, text/plain, */*',
  'Accept-Language':   'en-US,en;q=0.9',
  'Accept-Encoding':   'gzip, deflate, br',
  'Referer':           'https://polymarket.com/',
  'Origin':            'https://polymarket.com',
  'sec-ch-ua':         '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile':  '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest':    'empty',
  'sec-fetch-mode':    'cors',
  'sec-fetch-site':    'same-site',
};

function cleanApiKey(raw) {
  if (!raw) return raw;
  let k = raw.trim().replace(/^["']|["']$/g, '');
  const eq = k.indexOf('=');
  if (eq !== -1) k = k.slice(eq + 1).trim();
  return k.replace(/^["']|["']$/g, '');
}

async function fetchBySearchTerm(term) {
  const url = `${GAMMA_BASE}?_q=${encodeURIComponent(term)}&limit=30&active=true&closed=false`;
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchByTag(tag) {
  const url = `${GAMMA_BASE}?tag=${encodeURIComponent(tag)}&limit=30&active=true&closed=false`;
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Call Groq to score a batch of markets for relevance to the STEEP subject.
 * Returns a map of market id -> { relevanceScore, steepAngle }
 */
async function scoreMarkets(markets, subject, summarySlice, apiKey) {
  if (!apiKey || markets.length === 0) return new Map();

  const marketList = markets.map((m, i) =>
    `${i + 1}. [ID:${m.id}] ${(m.question || '').slice(0, 120)}`
  ).join('\n');

  const prompt = `You are a strategic intelligence analyst scoring Polymarket prediction markets for relevance to a STEEP analysis subject.

SUBJECT: "${subject}"
STEEP CONTEXT: ${summarySlice || '(not provided)'}

For each market question below, provide:
- relevanceScore: 0.0-1.0 (how directly relevant this market is to the subject)
  - 0.9-1.0: directly about the subject or its immediate outcomes
  - 0.7-0.89: closely related (same sector, key competitor, direct policy impact)
  - 0.45-0.69: tangentially related (broader theme that affects the subject)
  - 0.0-0.44: not meaningfully related (generic politics, unrelated sectors)
- steepAngle: one concise sentence explaining which STEEP dimension this market signals and why it matters for "${subject}" (start with the dimension: "Technological:", "Economic:", "Social:", "Political:", "Environmental:", or "Cross-cutting:")

MARKETS:
${marketList}

Return ONLY valid JSON: { "scores": [ { "id": "...", "relevanceScore": 0.0, "steepAngle": "..." }, ... ] }
Include ALL ${markets.length} markets in your response.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           SCORE_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        max_tokens:      1800,
        temperature:     0.1,
        response_format: { type: 'json_object' },
        stream:          false,
      }),
    });

    if (!res.ok) {
      console.warn('[prediction-markets/proxy] Groq scoring error:', res.status);
      return new Map();
    }

    const json    = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { return new Map(); }

    const scoreMap = new Map();
    if (Array.isArray(parsed.scores)) {
      for (const s of parsed.scores) {
        if (s.id != null) {
          scoreMap.set(String(s.id), {
            relevanceScore: typeof s.relevanceScore === 'number' ? s.relevanceScore : 0,
            steepAngle:     typeof s.steepAngle === 'string' ? s.steepAngle.trim() : '',
          });
        }
      }
    }
    return scoreMap;
  } catch (err) {
    console.warn('[prediction-markets/proxy] scoring exception:', err.message);
    return new Map();
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { searchTerms, tags, subject, synthesis } = body;

    const hasTerms = Array.isArray(searchTerms) && searchTerms.length > 0;
    const hasTags  = Array.isArray(tags) && tags.length > 0;

    if (!hasTerms && !hasTags) {
      return NextResponse.json({ error: 'searchTerms or tags required' }, { status: 400 });
    }

    // ── 1. Fetch markets in parallel (_q searches + tag fetches) ──────────────
    const searchFetches = hasTerms
      ? searchTerms.slice(0, 5).map(t => fetchBySearchTerm(t))
      : [];
    const tagFetches = hasTags
      ? tags.slice(0, 3).map(t => fetchByTag(t))
      : [];

    const allResults = await Promise.allSettled([...searchFetches, ...tagFetches]);

    // ── 2. Deduplicate — _q results first (higher precision) ─────────────────
    const dedupe = new Map();
    for (const r of allResults) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (m.id && !dedupe.has(m.id)) dedupe.set(m.id, m);
          if (dedupe.size >= MAX_RAW_MARKETS) break;
        }
      }
    }

    const rawMarkets = [...dedupe.values()];

    // ── 3. AI relevance scoring via Groq ──────────────────────────────────────
    const apiKey      = cleanApiKey(process.env.GROQ_API_KEY);
    const summarySlice = (synthesis?.executive_summary || synthesis?.summary || '').slice(0, 500);

    let scoreMap = new Map();
    if (apiKey && rawMarkets.length > 0) {
      // Score in batches to stay within token limits
      const batches = [];
      for (let i = 0; i < rawMarkets.length; i += SCORE_BATCH_SIZE) {
        batches.push(rawMarkets.slice(i, i + SCORE_BATCH_SIZE));
      }
      const batchResults = await Promise.allSettled(
        batches.map(batch => scoreMarkets(batch, subject || '', summarySlice, apiKey))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          for (const [id, score] of r.value) scoreMap.set(id, score);
        }
      }
    }

    // ── 4. Merge scores into market objects & filter ──────────────────────────
    const scored = rawMarkets.map(m => {
      const s = scoreMap.get(String(m.id));
      return {
        ...m,
        relevanceScore: s?.relevanceScore ?? null,
        steepAngle:     s?.steepAngle ?? '',
      };
    });

    // If we got no scores (Groq unavailable), return all markets unfiltered
    // so the tab still shows something; client-side filtering already exists.
    const scoringWorked = scoreMap.size > 0;
    const filtered = scoringWorked
      ? scored.filter(m => (m.relevanceScore ?? 0) >= RELEVANCE_THRESHOLD)
      : scored;

    return NextResponse.json({
      markets: filtered,
      scoringWorked,
      rawCount: rawMarkets.length,
    });

  } catch (err) {
    console.error('[prediction-markets/proxy]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
