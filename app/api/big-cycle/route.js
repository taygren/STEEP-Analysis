/**
 * POST /api/big-cycle
 *
 * Runs a Big Cycle Decision Engine assessment using the existing LLM proxy.
 * Accepts the full analysis context and returns geoeconomic instrument scores,
 * strategic utility class, capacity assessments, and company positioning.
 *
 * Body: { subject, subjectType, steepData?, synthesis?, model? }
 * Returns: { found, assessment }
 */

import { buildBigCycleSystemPrompt, computeSeverityScore, BIG_CYCLE_OUTPUT_TOKENS } from '../../../lib/bigCycle/engine';

const GROQ_API_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

async function callLlm(systemPrompt, userMessage, model) {
  const isGroq = !model.includes('cerebras') && !model.startsWith('qwen');
  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.CEREBRAS_API_KEY;
  const apiUrl = isGroq ? GROQ_API_URL : CEREBRAS_API_URL;

  if (!apiKey) throw new Error('No API key for model: ' + model);

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      max_tokens: BIG_CYCLE_OUTPUT_TOKENS,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `LLM returned HTTP ${res.status}`);
  }

  const json = await res.json();
  const raw  = json.choices?.[0]?.message?.content ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in LLM response');
  return JSON.parse(match[0]);
}

function buildContextBlock(steepData, synthesis) {
  if (!steepData && !synthesis) return '';
  const lines = [];
  if (synthesis?.executive_summary) {
    lines.push(`STEEP EXECUTIVE SUMMARY:\n${synthesis.executive_summary}`);
  }
  if (steepData) {
    for (const [dim, data] of Object.entries(steepData)) {
      if (!data?.summary) continue;
      lines.push(`${dim.toUpperCase()}: ${data.summary}`);
      const topDrivers = (data.drivers || []).slice(0, 2).map(d => `  - ${d.name}: ${d.description || ''}`).join('\n');
      if (topDrivers) lines.push(topDrivers);
    }
  }
  return lines.length ? `\n\nSTEEP CONTEXT (use to ground the assessment):\n${lines.join('\n\n')}` : '';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { subject, subjectType = 'company', steepData, synthesis } = body;
    const model = body.model || process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';

    if (!subject?.trim()) {
      return Response.json({ error: 'subject is required' }, { status: 400 });
    }

    const systemPrompt = buildBigCycleSystemPrompt(subject, subjectType);
    const contextBlock = buildContextBlock(steepData, synthesis);
    const userMessage  = `Run the Big Cycle Decision Engine assessment for "${subject}" (${subjectType}).${contextBlock}`;

    const raw = await callLlm(systemPrompt, userMessage, model);

    // Compute overall severity from the first instrument's attribute scores if not provided
    if (raw.overallSeverityScore == null || raw.overallSeverityScore === 0) {
      const firstInstrument = raw.primaryInstruments?.[0];
      if (firstInstrument?.attributeScores) {
        raw.overallSeverityScore = computeSeverityScore(firstInstrument.attributeScores);
      }
    }

    raw.generatedAt = new Date().toISOString();
    raw.model = model;

    return Response.json({ found: true, assessment: raw });

  } catch (err) {
    console.error('[big-cycle] Error:', err.message);
    return Response.json({ found: false, error: err.message }, { status: 500 });
  }
}
