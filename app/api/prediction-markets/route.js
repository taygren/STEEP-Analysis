/**
 * POST /api/prediction-markets
 *
 * Accepts { subject, subjectType, synthesis } and uses Groq to generate:
 *   tags           – 6-8 Polymarket topic tags covering the subject's domain
 *   keywordAliases – 3-6 short keywords/phrases used for cheap question-text
 *                    pre-filtering before AI scoring (subject name, ticker,
 *                    key entities, related events)
 *
 * NOTE: The old "searchTerms" / "_q" approach has been removed.
 * The Gamma API _q parameter does NOT search question text — it returns
 * completely unrelated results. We now fetch broadly by tag + volume and
 * filter using keywordAliases + AI scoring.
 *
 * Falls back to a static subject-aware map when Groq is unavailable.
 */

import { NextResponse } from 'next/server';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
export const maxDuration = 20;

const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const TAG_MODEL = 'llama-3.1-8b-instant';

// ── Static fallback tag map ────────────────────────────────────────────────
const STATIC = {
  tech:    { tags: ['ai', 'technology', 'crypto', 'science', 'business', 'stocks', 'usa'],             keywordAliases: [] },
  geo:     { tags: ['politics', 'world', 'ukraine', 'middle-east', 'china', 'europe', 'elections'],    keywordAliases: [] },
  company: { tags: ['business', 'markets', 'economy', 'finance', 'ai', 'stocks', 'usa'],               keywordAliases: [] },
  climate: { tags: ['climate', 'energy', 'environment', 'politics', 'economy', 'usa', 'science'],      keywordAliases: [] },
  finance: { tags: ['economy', 'fed', 'inflation', 'markets', 'finance', 'stocks', 'usa'],             keywordAliases: [] },
  default: { tags: ['politics', 'world', 'economy', 'ai', 'technology', 'business', 'usa'],            keywordAliases: [] },
};

const TECH_RE    = /\bai\b|tech|software|cyber|quantum|crypto|blockchain|chip|semiconductor|saas|cloud|robotics|autonomous/i;
const GEO_RE     = /russia|china|ukraine|middle.?east|nato|europe|asia|africa|latin america|war|conflict|sanction|geopolit/i;
const CLIMATE_RE = /climate|carbon|energy|renewable|fossil|coal|oil|gas|nuclear|solar|wind/i;
const FINANCE_RE = /\bfed\b|interest rate|inflation|gdp|recession|bank|finance|forex|currency|bond|yield/i;

function getStatic(subject = '', subjectType = '') {
  let bucket = STATIC.default;
  if (TECH_RE.test(subject))          bucket = STATIC.tech;
  else if (GEO_RE.test(subject))      bucket = STATIC.geo;
  else if (CLIMATE_RE.test(subject))  bucket = STATIC.climate;
  else if (FINANCE_RE.test(subject))  bucket = STATIC.finance;
  else if (subjectType === 'company') bucket = STATIC.company;
  const name = subject.trim();
  return {
    tags:           bucket.tags,
    keywordAliases: name ? [name] : [],
  };
}

function cleanApiKey(raw) {
  if (!raw) return raw;
  let k = raw.trim().replace(/^["']|["']$/g, '');
  const eq = k.indexOf('=');
  if (eq !== -1) k = k.slice(eq + 1).trim();
  return k.replace(/^["']|["']$/g, '');
}

export async function POST(req) {
  try {
    const { subject, subjectType, synthesis } = await req.json();
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'subject required' }, { status: 400 });
    }

    const apiKey = cleanApiKey(process.env.GROQ_API_KEY);
    if (!apiKey) {
      return NextResponse.json({
        found: true,
        ...getStatic(subject, subjectType),
        rationale: 'Static map (Groq not configured)',
        source: 'static',
      });
    }

    const summarySlice = (synthesis?.executive_summary || synthesis?.summary || '').slice(0, 500);

    const prompt = `You are a Polymarket research assistant. For the subject below, return TWO things:

1. tags: 6-8 Polymarket topic tag identifiers (lowercase, hyphen-separated) that cover the subject's domain broadly. These are used to fetch batches of candidate markets from Polymarket's tag-based API.
   Valid tag examples: "ai", "politics", "ukraine", "crypto", "economy", "middle-east", "china", "elections", "fed", "technology", "space", "energy", "climate", "israel", "iran", "india", "europe", "business", "finance", "usa", "stocks", "science"
   - Choose tags relevant to the subject's industry, geography, and regulatory context
   - Include both thematic tags (e.g. "ai") and geographic tags (e.g. "china") when both apply
   - NEVER include sports, entertainment, celebrities, or pop-culture tags

2. keywordAliases: 3-6 short keywords or phrases that, if found ANYWHERE in a Polymarket market question, suggest that market could be about this subject. These are used for fast text filtering before expensive AI scoring.
   - MUST include the subject name itself (e.g. "Nvidia")
   - Include common abbreviations (e.g. "NVDA"), product names (e.g. "H100", "Blackwell"), and key related entities
   - Include 1-2 key thematic phrases (e.g. "chip export ban", "semiconductor tariff") that would appear in a relevant question
   - Keep each alias short: 1-4 words maximum
   - Do NOT include generic words like "technology", "economy", "stock" alone

Examples:
  Subject "Nvidia" → keywordAliases: ["Nvidia", "NVDA", "H100", "Blackwell", "chip export", "GPU"]
  Subject "US-China trade war" → keywordAliases: ["China tariff", "US tariff", "trade war", "semiconductor export", "trade deal"]
  Subject "Federal Reserve" → keywordAliases: ["Federal Reserve", "Fed rate", "interest rate cut", "FOMC", "rate hike"]

SUBJECT: "${subject}" (type: ${subjectType || 'general'})
STEEP CONTEXT: ${summarySlice || '(not provided)'}

Return ONLY valid JSON: { "tags": ["..."], "keywordAliases": ["..."], "rationale": "one sentence" }`;

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           TAG_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        max_tokens:      350,
        temperature:     0.15,
        response_format: { type: 'json_object' },
        stream:          false,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        found: true,
        ...getStatic(subject, subjectType),
        rationale: `Groq error ${res.status} — static fallback`,
        source: 'static',
      });
    }

    const json    = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const fallback = getStatic(subject, subjectType);

    const tags = Array.isArray(parsed.tags) && parsed.tags.length >= 2
      ? parsed.tags.slice(0, 8).map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : fallback.tags;

    const keywordAliases = Array.isArray(parsed.keywordAliases) && parsed.keywordAliases.length >= 1
      ? parsed.keywordAliases.slice(0, 6).map(t => String(t).trim()).filter(Boolean)
      : fallback.keywordAliases;

    return NextResponse.json({
      found: true,
      tags,
      keywordAliases,
      rationale: parsed.rationale || '',
      source: 'groq',
    });

  } catch (err) {
    console.error('[prediction-markets]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
