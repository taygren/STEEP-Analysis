/**
 * POST /api/prediction-markets/proxy
 *
 * Server-side proxy to the Polymarket Gamma API with AI relevance scoring.
 *
 * Methodology (inspired by Jon-Becker/prediction-market-analysis):
 *   fetch broadly → filter analytically locally → never rely on _q search
 *
 * The Gamma API _q parameter does NOT search question text — empirically
 * proven to return completely unrelated results. It is NOT used here.
 *
 * Pipeline:
 *   1. Fetch top-active markets by volume (limit=100)
 *   2. Fetch markets from 6-8 subject-domain tags (limit=60 each)
 *   3. Deduplicate → up to 300 raw candidates
 *   4. Keyword pre-filter: keep only markets whose question text contains
 *      at least one keywordAlias (subject name, ticker, key entities)
 *      Fallback relaxation: full aliases (≥8) → subject-name-only (≥3) → unfiltered (cap 60)
 *   5. AI scoring via Groq llama-3.3-70b-versatile: each candidate gets
 *      relevanceScore (0-1) + steepAngle (one sentence)
 *   6. Threshold filter: ≥ 0.65 (strict); fallback to ≥ 0.45 if empty
 *   7. Return scored, filtered markets
 */

import { NextResponse } from 'next/server';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
export const maxDuration = 45;

const GAMMA_BASE          = 'https://gamma-api.polymarket.com/markets';
const GROQ_URL            = 'https://api.groq.com/openai/v1/chat/completions';
const SCORE_MODEL         = 'llama-3.3-70b-versatile'; // accuracy >> speed for scoring
const RELEVANCE_THRESHOLD = 0.65;
const FALLBACK_THRESHOLD  = 0.45;
const MAX_RAW_MARKETS     = 300;
const MAX_SCORE_POOL      = 80;  // max markets sent to Groq
const SCORE_BATCH_SIZE    = 30;  // smaller batch — 70b needs more tokens per market

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

/** Fetch the most-active markets globally by volume */
async function fetchTopByVolume(limit = 100) {
  const url = `${GAMMA_BASE}?limit=${limit}&active=true&closed=false`;
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch markets by Polymarket topic tag */
async function fetchByTag(tag, limit = 60) {
  const url = `${GAMMA_BASE}?tag=${encodeURIComponent(tag)}&limit=${limit}&active=true&closed=false`;
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
 * Keyword pre-filter — keeps only markets whose question text contains
 * at least one alias from keywordAliases. Applies three levels of relaxation:
 *   1. Full alias set match (used if ≥ 8 results)
 *   2. Subject-name-only match (used if full match < 8 but ≥ 3 results)
 *   3. No keyword filter — fall back to top-volume cap of 60 (if still < 3)
 */
function keywordPreFilter(markets, keywordAliases, subject) {
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Always union the subject name into the alias set so a server-only miss in the
  // upstream prompt never silently drops the most obvious keyword.
  const subjectName = (subject || '').trim();
  const allAliases  = subjectName.length >= 2
    ? [...new Set([subjectName, ...keywordAliases])]
    : keywordAliases;

  // Level 1 — full alias set (subject name always included)
  if (allAliases.length > 0) {
    const fullRe = new RegExp(allAliases.map(escapeRe).join('|'), 'i');
    const fullMatch = markets.filter(m => fullRe.test(m.question || ''));
    if (fullMatch.length >= 8) return { markets: fullMatch, level: 'full' };
  }

  // Level 2 — subject name only
  if (subjectName.length >= 2) {
    const nameRe = new RegExp(escapeRe(subjectName), 'i');
    const nameMatch = markets.filter(m => nameRe.test(m.question || ''));
    if (nameMatch.length >= 3) return { markets: nameMatch, level: 'name-only' };
  }

  // Level 3 — no keyword filter; cap at 60 most-active markets
  return {
    markets: markets.slice(0, 60),
    level: 'unfiltered',
  };
}

/**
 * Extract a compact STEEP context string from the synthesis object.
 * Priority: synthesis.dimensions.{dim} → synthesis.{dim} → executive_summary.
 * Emits up to 3 concise sub-bullets per dimension (summary + key_opportunities + key_risks).
 */
function buildSteepContext(synthesis) {
  if (!synthesis) return '';

  const dims = ['social', 'technological', 'economic', 'environmental', 'political'];
  const sections = [];

  for (const dim of dims) {
    // 1. Check nested dimensions object (e.g. synthesis.dimensions.social)
    const nested = synthesis.dimensions?.[dim]
                || synthesis.dimensions?.[dim.charAt(0).toUpperCase() + dim.slice(1)];
    // 2. Flat top-level keys (e.g. synthesis.social or synthesis.Social)
    const flat   = synthesis[dim] || synthesis[dim.charAt(0).toUpperCase() + dim.slice(1)];
    const d      = nested || flat;
    if (!d) continue;

    const label  = dim.charAt(0).toUpperCase() + dim.slice(1);
    const lines  = [];

    if (d.summary)           lines.push(String(d.summary).slice(0, 150));
    if (d.key_opportunities) lines.push(`Opp: ${String(Array.isArray(d.key_opportunities) ? d.key_opportunities[0] : d.key_opportunities).slice(0, 120)}`);
    if (d.key_risks)         lines.push(`Risk: ${String(Array.isArray(d.key_risks) ? d.key_risks[0] : d.key_risks).slice(0, 120)}`);

    if (lines.length > 0) sections.push(`${label}:\n  ${lines.join('\n  ')}`);
  }

  if (sections.length >= 2) return sections.join('\n');

  // Fallback to executive summary
  return (synthesis.executive_summary || synthesis.summary || '').slice(0, 600);
}

/**
 * Score a batch of pre-filtered markets via Groq.
 * Returns Map<id, { relevanceScore, steepAngle }>
 */
async function scoreMarkets(markets, subject, steepContext, apiKey) {
  if (!apiKey || markets.length === 0) return new Map();

  const marketList = markets.map((m, i) =>
    `${i + 1}. [ID:${m.id}] ${(m.question || '').slice(0, 130)}`
  ).join('\n');

  const prompt = `You are a senior strategic intelligence analyst. Score each Polymarket prediction market for its relevance to a STEEP analysis.

SUBJECT: "${subject}"

STEEP ANALYSIS CONTEXT:
${steepContext || '(not provided)'}

SCORING INSTRUCTIONS — be STRICT and CONSERVATIVE:
- relevanceScore 0.85-1.0: Market question is directly about "${subject}" by name, or its immediate product/outcome (e.g. "Will Nvidia's revenue exceed $X?")
- relevanceScore 0.65-0.84: Market closely tracks a causal force that directly impacts "${subject}" (e.g. "Will US ban chip exports to China?" is highly relevant to Nvidia)
- relevanceScore 0.45-0.64: Market is thematically related but does not directly affect "${subject}"'s specific prospects (tangential)
- relevanceScore 0.0-0.44: Market is NOT meaningfully about "${subject}" — generic politics, unrelated sectors, entertainment, sports → score 0.0

IMPORTANT: If the market question makes no direct reference to "${subject}" and no clear causal link exists, score it 0.0. Do not give partial credit for vague thematic overlap.

WORKED EXAMPLE (subject = "Nvidia"):
  "Will Nvidia's stock exceed $200 by end of 2025?" → 0.92 (directly names Nvidia, immediate financial outcome)
  "Will the US impose new semiconductor export controls on China?" → 0.78 (causal: export controls directly constrain Nvidia's China revenue)
  "Will AI investment double in 2025?" → 0.52 (thematic: AI investment benefits Nvidia but no direct causal link)
  "Will Trump win the 2026 midterms?" → 0.0 (no meaningful connection to Nvidia's prospects)
  "Will Rihanna release an album before GTA VI?" → 0.0 (completely unrelated — score 0.0 immediately)

For each market also provide:
- steepAngle: One sentence starting with a STEEP dimension label ("Technological:", "Economic:", "Social:", "Political:", "Environmental:", or "Cross-cutting:") explaining WHY this market is a signal for "${subject}". Only write this if relevanceScore ≥ 0.45; otherwise leave it empty string.

MARKETS TO SCORE:
${marketList}

Return ONLY valid JSON:
{ "scores": [ { "id": "MARKET_ID", "relevanceScore": 0.0, "steepAngle": "..." }, ... ] }
Include ALL ${markets.length} entries. Use the exact ID string from [ID:...] above.`;

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
        max_tokens:      2400,
        temperature:     0.05,
        response_format: { type: 'json_object' },
        stream:          false,
      }),
    });

    if (!res.ok) {
      console.warn('[prediction-markets/proxy] Groq scoring HTTP error:', res.status);
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
          // Normalise id — model sometimes echoes "[ID:xxx]" or "ID:xxx"
          const normId = String(s.id).trim().replace(/^\[?ID:/i, '').replace(/\]$/, '').trim();
          scoreMap.set(normId, {
            relevanceScore: typeof s.relevanceScore === 'number'
              ? Math.max(0, Math.min(1, s.relevanceScore))
              : 0,
            steepAngle: typeof s.steepAngle === 'string' ? s.steepAngle.trim() : '',
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
    const { keywordAliases, tags, subject, synthesis } = body;

    // Also accept legacy 'searchTerms' field name for backward compat
    const aliases  = Array.isArray(keywordAliases) ? keywordAliases
                   : Array.isArray(body.searchTerms) ? body.searchTerms
                   : [];
    const hasTags  = Array.isArray(tags) && tags.length > 0;

    if (!hasTags && !subject) {
      return NextResponse.json({ error: 'tags or subject required' }, { status: 400 });
    }

    // ── 1. Parallel fetch: top-volume globals + subject-domain tags ────────────
    const tagFetches  = hasTags ? tags.slice(0, 8).map(t => fetchByTag(t, 60)) : [];
    const allFetches  = [fetchTopByVolume(100), ...tagFetches];
    const allResults  = await Promise.allSettled(allFetches);

    // ── 2. Deduplicate — volume fetch first, then tags ─────────────────────────
    const dedupe = new Map();
    outer: for (const r of allResults) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (m.id && !dedupe.has(m.id)) dedupe.set(m.id, m);
          if (dedupe.size >= MAX_RAW_MARKETS) break outer;
        }
      }
    }

    const rawMarkets = [...dedupe.values()];
    console.log(`[prediction-markets/proxy] raw pool: ${rawMarkets.length} markets`);

    // ── 3. Keyword pre-filter ──────────────────────────────────────────────────
    const { markets: preFiltered, level: filterLevel } =
      keywordPreFilter(rawMarkets, aliases, subject || '');
    console.log(`[prediction-markets/proxy] keyword filter (${filterLevel}): ${preFiltered.length} candidates`);

    // ── 4. AI relevance scoring via Groq 70B ──────────────────────────────────
    const apiKey      = cleanApiKey(process.env.GROQ_API_KEY);
    const steepContext = buildSteepContext(synthesis);

    // Cap scoring pool to MAX_SCORE_POOL to stay within token budget
    const scorePool = preFiltered.slice(0, MAX_SCORE_POOL);

    let scoreMap = new Map();
    if (apiKey && scorePool.length > 0) {
      const batches = [];
      for (let i = 0; i < scorePool.length; i += SCORE_BATCH_SIZE) {
        batches.push(scorePool.slice(i, i + SCORE_BATCH_SIZE));
      }
      const batchResults = await Promise.allSettled(
        batches.map(batch => scoreMarkets(batch, subject || '', steepContext, apiKey))
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          for (const [id, score] of r.value) scoreMap.set(id, score);
        }
      }
    }

    console.log(`[prediction-markets/proxy] scored ${scoreMap.size} of ${scorePool.length} markets`);

    // ── 5. Merge scores → filter → optional fallback ───────────────────────────
    const scored = scorePool.map(m => {
      const s = scoreMap.get(String(m.id)) ?? scoreMap.get(m.id);
      return {
        ...m,
        relevanceScore: s?.relevanceScore ?? null,
        steepAngle:     s?.steepAngle ?? '',
      };
    });

    const scoringWorked = scoreMap.size > 0;
    let lowConfidence   = false;
    let filtered;

    if (scoringWorked) {
      // Primary threshold
      filtered = scored.filter(m => (m.relevanceScore ?? 0) >= RELEVANCE_THRESHOLD);

      // Fallback: relax threshold if nothing cleared the bar
      if (filtered.length === 0) {
        filtered = scored.filter(m => (m.relevanceScore ?? 0) >= FALLBACK_THRESHOLD);
        lowConfidence = true;
      }
    } else {
      // Groq unavailable — keyword-only filter
      if (aliases.length > 0 && filterLevel !== 'unfiltered') {
        filtered = scored; // already keyword-filtered above
      } else {
        // No scoring, no keyword filter — return empty so tab shows "no results"
        // rather than unrelated noise
        filtered = [];
      }
      lowConfidence = true;
    }

    return NextResponse.json({
      markets:            filtered,
      scoringWorked,
      rawCount:           rawMarkets.length,
      keywordFilterCount: preFiltered.length,
      filterLevel,
      lowConfidence,
    });

  } catch (err) {
    console.error('[prediction-markets/proxy]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
