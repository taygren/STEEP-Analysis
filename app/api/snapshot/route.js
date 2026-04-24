/**
 * POST /api/snapshot
 *
 * Generates (or returns cached) a time-bound Snapshot overview for a company or trend.
 * Uses the existing /api/analyze pipeline with a compact SNAPSHOT_PROMPT.
 * Persists results to KV: snapshot:{subjectHash}:{asOfDate}
 *
 * Body: { subject, subjectType, asOfDate?, model?, forceRefresh? }
 * Returns: { found, snapshot, cached, generatedAt }
 */

import { kvGet, kvSet } from '../../../lib/kv';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildSnapshotPrompt(subject, subjectType, asOfDate) {
  return `You are a senior strategic analyst producing a concise "snapshot" intelligence brief for "${subject}" (${subjectType}) as of ${asOfDate}.

This snapshot is designed for fast recall — it is NOT a full STEEP analysis. Focus on the current state of play, the single most important driver in each dimension, and the top near-term catalysts.

Return ONLY valid JSON:
{
  "subject": "${subject}",
  "subjectType": "${subjectType}",
  "asOfDate": "${asOfDate}",
  "overallPosture": "Opportunistic|Cautious|Defensive|Transformative",
  "postureRationale": "1-2 sentences on the current risk/opportunity balance",
  "executiveSummary": "3-4 sentences: what is the current strategic situation, the most important force shaping it, and the critical decision facing leaders today",
  "dimensionSnapshots": {
    "social":        { "headline": "one sentence — the defining social dynamic right now", "direction": "positive|negative|mixed", "topDriver": "name of the #1 social driver" },
    "technological": { "headline": "one sentence", "direction": "positive|negative|mixed", "topDriver": "name of the #1 tech driver" },
    "economic":      { "headline": "one sentence", "direction": "positive|negative|mixed", "topDriver": "name of the #1 economic driver" },
    "environmental": { "headline": "one sentence", "direction": "positive|negative|mixed", "topDriver": "name of the #1 environmental driver" },
    "political":     { "headline": "one sentence", "direction": "positive|negative|mixed", "topDriver": "name of the #1 political driver" }
  },
  "topCatalysts": [
    { "event": "specific named upcoming event or milestone", "timeframe": "e.g. Q3 2026", "impact": "high|medium|low", "direction": "positive|negative|uncertain" }
  ],
  "watchItems": ["specific thing to monitor", "second watch item"],
  "confidenceNote": "1 sentence on data recency / uncertainty"
}

Include exactly 3 topCatalysts and 2 watchItems. Be specific — cite real events, regulations, earnings windows, or product cycles.`;
}

async function callLlm(systemPrompt, userMessage, model) {
  const isGroq = !model.includes('cerebras') && !model.startsWith('qwen') && !model.startsWith('llama3.2');
  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.CEREBRAS_API_KEY;
  const apiUrl = isGroq ? GROQ_API_URL : CEREBRAS_API_URL;

  if (!apiKey) throw new Error('No API key configured for model: ' + model);

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      max_tokens: 1000,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `LLM returned HTTP ${res.status}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in LLM response');
  return JSON.parse(match[0]);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { subject, subjectType = 'company', forceRefresh = false } = body;
    const model = body.model || process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';

    if (!subject?.trim()) {
      return Response.json({ error: 'subject is required' }, { status: 400 });
    }

    const asOfDate = body.asOfDate || new Date().toISOString().slice(0, 10);
    const cacheKey = `snapshot:${slugify(subject)}:${asOfDate}`;

    if (!forceRefresh) {
      const cached = await kvGet(cacheKey);
      if (cached) {
        return Response.json({ found: true, snapshot: cached, cached: true, generatedAt: cached.generatedAt });
      }
    }

    const systemPrompt = buildSnapshotPrompt(subject, subjectType, asOfDate);
    const userMessage  = `Generate the snapshot brief for "${subject}" (${subjectType}) as of ${asOfDate}.`;

    const snapshot = await callLlm(systemPrompt, userMessage, model);
    snapshot.generatedAt = new Date().toISOString();
    snapshot.model = model;

    await kvSet(cacheKey, snapshot);

    return Response.json({ found: true, snapshot, cached: false, generatedAt: snapshot.generatedAt });

  } catch (err) {
    console.error('[snapshot] Error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
