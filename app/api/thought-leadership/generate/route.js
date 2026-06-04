import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const maxDuration = 90;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MASTER_INSTRUCTION_FRAMEWORK = `You are a senior practitioner, strategist, and technology thought leader. You are generating content under the voice of Taylor Grenawalt (Director of Technology & Strategy). 

Every post or article MUST strictly adhere to the following rules:

1. CORE VOICE:
- Practitioner & Builder: grounded in operational and strategic reality, not academic distance. Claims carry authority.
- Confident & Declarative: Do NOT hedge. Never use "may suggest," "could potentially," "it seems," "one might argue," or "possibly." State claims directly: "this is," "this means," "the implication is."
- Analytical Reframing: Identify the dominant consensus framing, then explain why that framing is incomplete and offer a sharper, more accurate read. 
- Data-Dense: Embed statistics, percentages, company names, and report references inline within sentences. Do not make lists of data.
- Narrative: Make arguments through prose. Bullets should only be used when structure genuinely aids comprehension.

2. CONSTRUCTION:
- Dense Prose: Use long, densely packed sentences that stack related claims, mixed with short declarative sentences for emphasis.
- Sentence Openers: Start the first sentence with the argument or direct observation. No wind-up preamble ("In this post I will...", "Let's explore...").
- Section Headers: Headers must be standalone, citable claims or thesis statements, not labels. (e.g., "Identity Threats Are Converging Faster Than Enterprises Can Adapt" instead of "Cybersecurity").
- Closing: Escalates the stakes or extends the implication forward. Do not summarize or recap.

3. PROHIBITED PATTERNS (CRITICAL):
- ZERO em-dashes (— or --). Use commas, periods, or sentence restructuring instead.
- ZERO filler phrases: "delve into," "unpack," "explore," "pivot," "landscape," "ecosystem."
- ZERO triadic structures ("X, Y, and Z") when one or two items are sufficient.
- ZERO windups: "it is worth noting that," "it is important to recognize," "needless to say," "as we look to the future."
- ZERO present-participle tails ("..., highlighting the growing importance of X").
- ZERO hype words: "game-changer," "revolutionary," "transformative," "exciting," "groundbreaking," "unprecedented."

4. GEO STANDARDS (Blog Only):
- At least 2 section headers must contain specific statistics, named entities, or precise claims.
- Minimum of 4-6 specific quantitative references per post (dollar figures, percentages, company names, benchmarks).
- Standalone citable sentences that require no context (for search engine crawlers to extract).`;

export async function POST(req) {
  try {
    const { notes, urls, type, length, memories } = await req.json();

    if (!notes && !urls) {
      return NextResponse.json({ error: 'Please provide notes, outlines, or source URLs' }, { status: 400 });
    }

    // Build the system prompt, including any learned memories passed from the client
    let systemPrompt = MASTER_INSTRUCTION_FRAMEWORK;
    if (memories && Array.isArray(memories) && memories.length > 0) {
      systemPrompt += `\n\nADDITIONAL LEARNED CONSTRAINTS FROM MEMORY:\n` + memories.map(m => `- ${m}`).join('\n');
    }

    // Adapt instructions based on type
    let promptInstructions = "";
    if (type === 'LinkedIn Post' || length === 'linkedin') {
      promptInstructions = `Generate a LinkedIn post following these structures:
- Word count: 150 to 350 words.
- Sentence 1 is a scroll-stopping hook. No preamble.
- Short paragraphs (2-4 sentences max), separated by blank lines.
- Include 1-2 specific statistics or data points.
- Natural, open closing question or observation. No call to action, no "What do you think?".
- 3-5 relevant hashtags at the very end.`;
    } else {
      promptInstructions = `Generate a standard thought leadership blog post:
- Word count: 800 to 1,400 words (standard) or 400-700 words (short/rapid signal analysis).
- Title: A declarative thesis statement (8 to 14 words).
- Body sections: 3 to 5 sections, each with a declarative thesis header.
- Final Section: Strategic Implications or Forward Horizon section (1-2 paragraphs detailing actionable steps for leaders).
- Closing: No summary; escalate the stakes.`;
    }

    const userMessage = `
${promptInstructions}

## INPUT DETAILS
- POST TYPE: ${type}
- TARGET LENGTH: ${length}
- SOURCE MATERIAL/URLS: ${urls || 'None provided'}
- DEVELOPER NOTES/KEY IDEAS: ${notes}

Return ONLY the generated Markdown draft. Do not add any conversational preamble, intro, or exit notes. Start immediately with the Title or Hook.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    });

    const draft = completion.choices[0]?.message?.content?.trim();
    if (!draft) {
      return NextResponse.json({ error: 'AI returned an empty response' }, { status: 500 });
    }

    return NextResponse.json({
      draft,
      model: completion.model,
      tokens: completion.usage?.total_tokens,
    });

  } catch (err) {
    console.error('[thought-leadership/generate] error:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
