import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_REFINE = `You are a senior strategic editor and thought leadership writer for a geopolitical and macro-intelligence firm. Your role is to take raw article content and transform it into a polished, publication-ready piece.

Guidelines:
- Preserve every substantive insight, fact, and argument from the original
- Restructure for maximum clarity and impact: strong lead, clear sections, compelling close
- Format in clean Markdown (## headers, **bold** for key terms, - bullet lists where appropriate)
- Write in a confident, precise, executive tone — no filler, no hedging
- Ideal length: keep tight; do not pad with generic conclusions
- Return ONLY the refined Markdown article, no preamble or explanation`;

const SYSTEM_INTEGRATE = `You are a senior strategic analyst and thought leadership writer for a geopolitical and macro-intelligence firm. You are integrating STEEP (Social, Technological, Economic, Environmental, Political) analysis data into an existing article.

Guidelines:
- Weave the STEEP insights naturally into the article's argument — do not just append them
- Use specific data points, drivers, and signals from the STEEP report to support claims
- Add a "Strategic Intelligence Brief" or equivalent section that highlights the most relevant STEEP findings
- If the STEEP report contains roadmap milestones, cite the relevant ones as forward-looking indicators
- If investment thesis or Big Cycle data is present, incorporate the strategic posture and key risks/opportunities
- Maintain the article's voice and tone throughout
- Format in clean Markdown with proper structure
- Return ONLY the final integrated article in Markdown, no preamble or meta-commentary`;

export async function POST(req) {
  try {
    const { content, reportText, mode } = await req.json();

    if (!content && !reportText) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    let systemPrompt, userMessage;

    if (mode === 'integrate' && reportText) {
      systemPrompt = SYSTEM_INTEGRATE;
      userMessage = `## ARTICLE TO ENHANCE\n\n${content || '(No article text yet — draft the article using the STEEP report data below, structured as a strategic thought leadership piece.)'}\n\n---\n\n## STEEP INTELLIGENCE REPORT DATA\n\n${reportText}`;
    } else {
      systemPrompt = SYSTEM_REFINE;
      userMessage = `## RAW ARTICLE CONTENT\n\n${content}`;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    });

    const refined = completion.choices[0]?.message?.content?.trim();
    if (!refined) return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 });

    return NextResponse.json({ refined, model: completion.model, tokens: completion.usage?.total_tokens });

  } catch (err) {
    console.error('[refine-content]', err);
    return NextResponse.json({ error: err.message || 'Refinement failed' }, { status: 500 });
  }
}
