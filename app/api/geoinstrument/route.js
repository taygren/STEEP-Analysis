/**
 * POST /api/geoinstrument
 *
 * Farrell & Newman Triangular Framework — five-agent GeoEconomic Instrument Assessment.
 * Agents 5A, 5B, 5C run sequentially; output feeds Convergence supervisor, then Agent 5D.
 * Returns a final unified risk + investment signal report via SSE streaming.
 *
 * Body:   { instrument, sender, target, context?, model? }
 * Stream: text/event-stream — emits agent_start / agent_complete / complete / error
 */

import {
  buildAgent5APrompt,
  buildAgent5BPrompt,
  buildAgent5CPrompt,
  buildConvergencePrompt,
  buildAgent5DPrompt,
  computeGeoSeverity,
  GEO_AGENT_TOKENS,
  GEO_CONVERGENCE_TOKENS,
  GEO_5D_TOKENS,
} from '../../../lib/geoInstrument/engine';

const GROQ_API_URL     = 'https://api.groq.com/openai/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

function cleanKey(raw) {
  if (!raw) return raw;
  const m = raw.match(/^[A-Za-z_][A-Za-z0-9_]*=(.+)$/);
  if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  return raw.trim().replace(/^["']|["']$/g, '');
}

async function callLlm(systemPrompt, userMessage, model, maxTokens) {
  const isGroq = !model.includes('cerebras') && !model.startsWith('qwen');
  const apiKey = isGroq ? cleanKey(process.env.GROQ_API_KEY) : cleanKey(process.env.CEREBRAS_API_KEY);
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
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `LLM returned HTTP ${res.status}`);
  }

  const json  = await res.json();
  const raw   = json.choices?.[0]?.message?.content ?? '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in LLM response');
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error('Failed to parse LLM JSON: ' + e.message);
  }
}

export async function POST(req) {
  const encoder = new TextEncoder();

  let instrument, sender, target, context, model;
  try {
    const body  = await req.json();
    instrument  = body.instrument?.trim();
    sender      = body.sender?.trim();
    target      = body.target?.trim();
    context     = body.context?.trim() || '';
    model       = body.model || process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
    if (!instrument) return Response.json({ error: 'instrument is required' }, { status: 400 });
    if (!sender)     return Response.json({ error: 'sender is required' },     { status: 400 });
    if (!target)     return Response.json({ error: 'target is required' },     { status: 400 });
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event, data = {}) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
        } catch {}
      };

      try {
        // Agent 5A — Attribute Scorer
        emit('agent_start', { agent: 'agent5a' });
        const agent5a = await callLlm(
          buildAgent5APrompt(instrument, sender, target, context),
          `Score the geoeconomic instrument: "${instrument}" | ${sender} → ${target}`,
          model,
          GEO_AGENT_TOKENS
        );
        // Compute severity from attribute scores if not set
        if (!agent5a.severity_score) {
          agent5a.severity_score = computeGeoSeverity(agent5a.attribute_scores) ?? 0;
        }
        emit('agent_complete', { agent: 'agent5a', data: agent5a });

        // Agent 5B — Capacity Assessor
        emit('agent_start', { agent: 'agent5b' });
        const agent5b = await callLlm(
          buildAgent5BPrompt(instrument, sender, target, context, agent5a),
          `Assess bilateral leverage for: "${instrument}" | ${sender} → ${target}`,
          model,
          GEO_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent5b', data: agent5b });

        // Agent 5C — Strategic Utility Classifier
        emit('agent_start', { agent: 'agent5c' });
        const agent5c = await callLlm(
          buildAgent5CPrompt(instrument, sender, target, context, agent5a, agent5b),
          `Classify strategic utility for: "${instrument}" | ${sender} → ${target}`,
          model,
          GEO_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent5c', data: agent5c });

        // Convergence Supervisor
        emit('agent_start', { agent: 'convergence' });
        const convergence = await callLlm(
          buildConvergencePrompt(instrument, sender, target, context, agent5a, agent5b, agent5c),
          `Synthesize instrument assessment for: "${instrument}" | ${sender} → ${target}`,
          model,
          GEO_CONVERGENCE_TOKENS
        );
        emit('agent_complete', { agent: 'convergence', data: convergence });

        // Agent 5D — Investment Translation
        emit('agent_start', { agent: 'agent5d' });
        const agent5d = await callLlm(
          buildAgent5DPrompt(instrument, sender, target, context, agent5a, agent5b, agent5c, convergence),
          `Generate investment signals for: "${instrument}" | ${sender} → ${target}`,
          model,
          GEO_5D_TOKENS
        );
        emit('agent_complete', { agent: 'agent5d', data: agent5d });

        emit('complete', {
          result: {
            instrument,
            sender,
            target,
            context,
            synthesis: convergence,
            agents: { agent5a, agent5b, agent5c, agent5d },
            generatedAt: new Date().toISOString(),
          },
        });

      } catch (err) {
        console.error('[geoinstrument] Pipeline error:', err.message);
        emit('error', { message: err.message });
      }

      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
