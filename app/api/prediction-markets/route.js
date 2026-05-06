/**
 * POST /api/prediction-markets
 *
 * Accepts { subject, subjectType, synthesis } and uses Groq to generate:
 *   searchTerms – 3-5 specific phrases for Gamma API _q full-text search
 *   tags        – 2-3 broad Polymarket topic tags for supplementary coverage
 *
 * Falls back to a static subject-aware map when Groq is unavailable.
 */

import { NextResponse } from 'next/server';

export const dynamic     = 'force-dynamic';
export const runtime     = 'nodejs';
export const maxDuration = 20;

const GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const TAG_MODEL = 'llama-3.1-8b-instant';

const STATIC_TAGS = {
  tech:    ['ai', 'technology', 'crypto'],
  geo:     ['politics', 'world', 'ukraine'],
  company: ['business', 'markets', 'economy'],
  climate: ['climate', 'energy', 'environment'],
  finance: ['economy', 'fed', 'inflation'],
  default: ['politics', 'world', 'economy'],
};

const TECH_RE    = /\bai\b|tech|software|cyber|quantum|crypto|blockchain|chip|semiconductor|saas|cloud|robotics|autonomous/i;
const GEO_RE     = /russia|china|ukraine|middle.?east|nato|europe|asia|africa|latin america|war|conflict|sanction|geopolit/i;
const CLIMATE_RE = /climate|carbon|energy|renewable|fossil|coal|oil|gas|nuclear|solar|wind/i;
const FINANCE_RE = /\bfed\b|interest rate|inflation|gdp|recession|bank|finance|forex|currency|bond|yield/i;

function getStatic(subject = '', subjectType = '') {
  let tagBucket = STATIC_TAGS.default;
  if (TECH_RE.test(subject))         tagBucket = STATIC_TAGS.tech;
  else if (GEO_RE.test(subject))     tagBucket = STATIC_TAGS.geo;
  else if (CLIMATE_RE.test(subject)) tagBucket = STATIC_TAGS.climate;
  else if (FINANCE_RE.test(subject)) tagBucket = STATIC_TAGS.finance;
  else if (subjectType === 'company') tagBucket = STATIC_TAGS.company;
  const name = subject.trim();
  return { searchTerms: name ? [name] : [], tags: tagBucket };
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

    const summarySlice = (synthesis?.executive_summary || synthesis?.summary || '').slice(0, 400);

    const prompt = `You are a Polymarket research assistant. For the subject below, return TWO things:

1. searchTerms: 3-5 short, specific phrases that would appear verbatim (or near-verbatim) in relevant Polymarket market question text.
   - Include the subject name itself, key related entities, and specific events from the STEEP context.
   - Good examples for "Nvidia": ["Nvidia", "Nvidia revenue", "Nvidia stock price", "H100 chip", "chip export ban"]
   - Good examples for "US-China trade war": ["US China tariffs", "trade war", "semiconductor export", "China tariff deal", "bilateral trade"]
   - Each term must be 1-5 words. Avoid generic terms like "technology" or "economy" alone.

2. tags: 2-3 broad Polymarket topic tag identifiers (lowercase, hyphen-separated) for supplementary coverage.
   - Valid tags include: "ai", "politics", "ukraine", "crypto", "economy", "middle-east", "china", "elections", "fed", "technology", "space", "energy", "climate", "israel", "iran", "india", "europe", "business"
   - NEVER include sports, entertainment, or pop-culture tags.

SUBJECT: "${subject}" (type: ${subjectType || 'general'})
STEEP SUMMARY: ${summarySlice || '(not provided)'}

Return ONLY valid JSON: { "searchTerms": ["..."], "tags": ["..."], "rationale": "one sentence" }`;

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           TAG_MODEL,
        messages:        [{ role: 'user', content: prompt }],
        max_tokens:      300,
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

    const searchTerms = Array.isArray(parsed.searchTerms) && parsed.searchTerms.length >= 1
      ? parsed.searchTerms.slice(0, 5).map(t => String(t).trim()).filter(Boolean)
      : fallback.searchTerms;

    const tags = Array.isArray(parsed.tags) && parsed.tags.length >= 1
      ? parsed.tags.slice(0, 3).map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : fallback.tags;

    return NextResponse.json({
      found: true,
      searchTerms,
      tags,
      rationale: parsed.rationale || '',
      source: 'groq',
    });

  } catch (err) {
    console.error('[prediction-markets]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
