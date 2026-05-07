/**
 * POST /api/big-cycle-engine
 *
 * Standalone Dalio Big Cycle Engine — five-agent sequential SSE pipeline.
 * Runs without any prior STEEP analysis context.
 *
 * Body:   { subject, model? }
 * Stream: text/event-stream — emits agent_start / agent_complete / complete / error events
 */

import {
  buildFiveForcesPrompt,
  buildDebtBubblePrompt,
  buildScenarioPrompt,
  buildDecisionMatrixPrompt,
  buildSupervisorSynthesisPrompt,
  BCE_AGENT_TOKENS,
  BCE_SUPERVISOR_TOKENS,
} from '../../../lib/bigCycle/engine';

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

  let subject, model;
  try {
    const body = await req.json();
    subject = body.subject?.trim();
    model   = body.model || process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
    if (!subject) return Response.json({ error: 'subject is required' }, { status: 400 });
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
        // Agent 1 — Five Forces Diagnostician
        emit('agent_start', { agent: 'agent1' });
        const layer1 = await callLlm(
          buildFiveForcesPrompt(subject),
          `Run Five Forces Diagnostician for: "${subject}"`,
          model,
          BCE_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent1', next: 'agent2', data: layer1 });

        // Agent 2 — Debt Sustainability + Bubble Detector
        emit('agent_start', { agent: 'agent2' });
        const layer2 = await callLlm(
          buildDebtBubblePrompt(subject, layer1),
          `Run Debt Sustainability and Bubble Detector for: "${subject}"`,
          model,
          BCE_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent2', next: 'agent3', data: layer2 });

        // Agent 3 — Scenario Architect
        emit('agent_start', { agent: 'agent3' });
        const layer3 = await callLlm(
          buildScenarioPrompt(subject, layer1, layer2),
          `Run Scenario Architect for: "${subject}"`,
          model,
          BCE_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent3', next: 'agent4', data: layer3 });

        // Agent 4 — Decision Matrix Executor
        emit('agent_start', { agent: 'agent4' });
        const layer4 = await callLlm(
          buildDecisionMatrixPrompt(subject, layer1, layer2, layer3),
          `Run Decision Matrix Executor for: "${subject}"`,
          model,
          BCE_AGENT_TOKENS
        );
        emit('agent_complete', { agent: 'agent4', next: 'supervisor', data: layer4 });

        // Supervisor — Synthesis
        emit('agent_start', { agent: 'supervisor' });
        const synthesis = await callLlm(
          buildSupervisorSynthesisPrompt(subject, layer1, layer2, layer3, layer4),
          `Run Supervisor Synthesis for: "${subject}"`,
          model,
          BCE_SUPERVISOR_TOKENS
        );
        emit('agent_complete', { agent: 'supervisor', data: synthesis });

        emit('complete', {
          result: {
            subject,
            synthesis,
            layers: { layer1, layer2, layer3, layer4 },
            generatedAt: new Date().toISOString(),
          },
        });

      } catch (err) {
        console.error('[big-cycle-engine] Pipeline error:', err.message);
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
