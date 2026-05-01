import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a RASCEF prompt architect. RASCEF is a structured AI prompt framework with six elements: Role (R), Actions (A), Style (S), Context (C), Example (E), Format (F).

Given a user's role, use case, audience, and goals, produce a complete RASCEF configuration.

Respond ONLY with valid JSON. No markdown, no backticks, no preamble.

Return this exact structure:
{
  "R": "2-4 sentences. Who the AI persona is — expertise, seniority, depth. Written in second person: You are...",
  "A": "4-6 specific action bullets as a single string separated by \\n- (start with \\n- on the first one). Use strong verbs: analyze, draft, synthesize, flag, recommend, compare.",
  "S": "2-3 sentences. Tone, vocabulary register, and communication approach appropriate for the stated audience.",
  "C": "3-5 sentences. Operational context — industry norms, relevant constraints, what this person navigates day to day, terminology they use.",
  "E": "One concrete scenario: INPUT: [realistic prompt] | RESPONSE: [how the AI approaches and structures it]",
  "F": "Specify output structure, length guidance, formality, and any standing elements (e.g. always include next steps, always flag risks).",
  "oneLiner": "A single ready-to-paste system prompt synthesizing all six elements into one cohesive paragraph. 150-200 words."
}`;

export async function POST(req) {
  try {
    const { role, usecase, audience, goals } = await req.json();

    if (!role?.trim() || !usecase?.trim()) {
      return NextResponse.json({ error: 'Role and use case are required.' }, { status: 400 });
    }

    const userContent = [
      `Role: ${role.trim()}`,
      `Use case: ${usecase.trim()}`,
      `Audience: ${audience?.trim() || 'Not specified'}`,
      `Goals: ${goals?.trim() || 'Not specified'}`,
    ].join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.65,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from model');

    const result = JSON.parse(text);

    const required = ['R', 'A', 'S', 'C', 'E', 'F', 'oneLiner'];
    const missing = required.filter(k => !result[k]);
    if (missing.length) throw new Error(`Incomplete response — missing: ${missing.join(', ')}`);

    return NextResponse.json({ result, model: completion.model, tokens: completion.usage?.total_tokens });

  } catch (err) {
    console.error('[rascef]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
