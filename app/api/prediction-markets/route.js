/**
 * POST /api/prediction-markets
 *
 * Accepts { subject, subjectType, synthesis } and uses Groq to generate
 * 6-10 Polymarket-compatible tag strings for the browser-direct Gamma API fetch.
 * Falls back to a static subject-aware tag map when Groq is unavailable.
 *
 * NOTE: This route does NOT proxy to Polymarket — that fetch must happen
 * browser-side to bypass Cloudflare JA3 TLS fingerprinting.
 */

import { NextResponse } from 'next/server';

export const dynamic  = 'force-dynamic';
export const runtime  = 'nodejs';
export const maxDuration = 20;

const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const TAG_MODEL    = 'llama-3.1-8b-instant'; // fast, low-token — sufficient for tag generation

// ── Static fallback tag map ───────────────────────────────────────
const STATIC_MAP = {
  tech:       ['ai', 'technology', 'crypto', 'business', 'science'],
  geo:        ['politics', 'world', 'ukraine', 'middle-east', 'economy'],
  company:    ['business', 'markets', 'economy', 'finance', 'technology'],
  climate:    ['climate', 'energy', 'environment', 'politics', 'economy'],
  finance:    ['economy', 'markets', 'fed', 'inflation', 'finance'],
  default:    ['politics', 'world', 'economy', 'ai', 'technology'],
};

const TECH_RE    = /\bai\b|tech|software|cyber|quantum|crypto|blockchain|chip|semiconductor|saas|cloud|robotics|autonomous/i;
const GEO_RE     = /russia|china|ukraine|middle.?east|nato|europe|asia|africa|latin america|war|conflict|sanction|geopolit/i;
const CLIMATE_RE = /climate|carbon|energy|renewable|fossil|coal|oil|gas|nuclear|solar|wind/i;
const FINANCE_RE = /\bfed\b|interest rate|inflation|gdp|recession|bank|finance|forex|currency|bond|yield/i;

function getStaticTags(subject = '', subjectType = '') {
  if (TECH_RE.test(subject))    return STATIC_MAP.tech;
  if (GEO_RE.test(subject))     return STATIC_MAP.geo;
  if (CLIMATE_RE.test(subject)) return STATIC_MAP.climate;
  if (FINANCE_RE.test(subject)) return STATIC_MAP.finance;
  if (subjectType === 'company') return STATIC_MAP.company;
  return STATIC_MAP.default;
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
        tags: getStaticTags(subject, subjectType),
        rationale: 'Static tag map (Groq not configured)',
        source: 'static',
      });
    }

    const summarySlice = (synthesis?.executive_summary || synthesis?.summary || '').slice(0, 350);

    const prompt = `You are a Polymarket research assistant. Generate 6-10 concise tag strings to search Polymarket prediction markets that are directly relevant to the subject below.

SUBJECT: "${subject}" (type: ${subjectType || 'general'})
STEEP SUMMARY: ${summarySlice || '(not provided)'}

Rules:
- Tags must be real Polymarket tag identifiers (lowercase, hyphen-separated where needed)
- Examples of valid tags: "ai", "politics", "ukraine", "crypto", "economy", "middle-east", "china", "elections", "fed", "technology", "space", "energy", "climate", "israel", "iran", "india", "europe"
- Prefer specific geographic or thematic tags over broad ones
- Include both tech and geopolitical tags when both are relevant to the subject
- NEVER include sports, entertainment, or pop-culture tags
- Return ONLY valid JSON: { "tags": ["tag1","tag2",...], "rationale": "one sentence why these tags" }`;

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           TAG_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        max_tokens:      220,
        temperature:     0.15,
        response_format: { type: 'json_object' },
        stream:          false,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        found: true,
        tags: getStaticTags(subject, subjectType),
        rationale: `Groq error ${res.status} — using static tags`,
        source: 'static',
      });
    }

    const json    = await res.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const tags = Array.isArray(parsed.tags) && parsed.tags.length >= 2
      ? parsed.tags.slice(0, 10).map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : getStaticTags(subject, subjectType);

    return NextResponse.json({
      found:     true,
      tags,
      rationale: parsed.rationale || '',
      source:    'groq',
    });

  } catch (err) {
    console.error('[prediction-markets]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
