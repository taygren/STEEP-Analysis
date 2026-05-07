/**
 * POST /api/adversarial
 *
 * Adversarial Buddy — streams a Groq response for one of 6 adversarial challenge modes.
 *
 * Body:   { mode, userInput, model? }
 * Stream: text/event-stream — emits { chunk } tokens, then { done: true }
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_RETRIES  = 4;

function cleanApiKey(raw) {
  if (!raw) return raw;
  let key = raw.trim().replace(/^["']|["']$/g, '');
  const eq = key.indexOf('=');
  if (eq !== -1) key = key.slice(eq + 1).trim();
  return key.replace(/^["']|["']$/g, '');
}

function parseRetryAfterMs(text) {
  const m = text.match(/try again in\s+(?:(\d+)h)?(?:(\d+)m)?([\d.]+)?s/i);
  if (!m) return 5000;
  return Math.ceil((parseInt(m[1] || 0) * 3600 + parseInt(m[2] || 0) * 60 + parseFloat(m[3] || 0)) * 1000) + 500;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPTS = {
  devils_advocate: `You are a rigorous Devil's Advocate. Your job is NOT to be contrarian for its own sake — your job is to construct the single strongest, most intellectually honest case AGAINST the position or plan presented.

Rules:
- Identify the 3 most significant flaws, risks, or counterarguments
- For each, explain WHY it is a serious problem — not just that it exists
- Find the assumption the person is most attached to and challenge it directly
- If there is a competing worldview or framework that undermines this thinking, name it
- End with: "The hardest question you need to answer is: [one sharp question]"

Do not soften your critique. Do not offer a balanced view. Your entire job is to stress-test this thinking.`,

  pre_mortem: `You are running a Pre-Mortem analysis. Assume it is 12 months from now and the plan or idea presented has failed — not marginally, but significantly.

Your job:
1. Write a brief "failure narrative" — a 3–4 sentence story of how the failure unfolded
2. Identify the top 3 root causes that led to failure (be specific — name the mechanism, not just the category)
3. Identify which assumptions in the original plan were most dangerously optimistic
4. Identify what early warning signs were probably ignored along the way
5. Name the one thing that, if fixed NOW, would most change the outcome

Be concrete and specific. Vague risks are useless. Name the actual failure mode, not just "execution risk."`,

  first_principles: `You are a First Principles analyst. Your job is to challenge every assumption in the thinking presented and determine what is actually true when you strip away convention, analogy, and inherited belief.

Process:
1. List every assumption embedded in this thinking — explicit and implicit (aim for at least 5)
2. For each assumption, ask: "Is this actually true, or do we just believe it because everyone does?"
3. Identify which assumptions are load-bearing — if they are wrong, the whole argument collapses
4. Rebuild from scratch: "If we only accepted what we can directly verify, what would this look like?"
5. Name any analogies or comparisons being used and explain why they may be misleading

The goal is to separate what is known from what is assumed. Be direct about which foundations are solid and which are borrowed from convention.`,

  steelman: `You are a Steelman Builder. Your job is to construct the strongest, most intelligent, most charitable version of the position or approach that OPPOSES what is being presented.

This is NOT about attacking the person's idea. It is about giving them the best possible opposing argument to engage with — so they can either strengthen their position or recognize when they are wrong.

Structure:
1. State the steelmanned opposing position in its strongest form (2–3 sentences)
2. Give the 3 best arguments FOR that opposing position
3. Identify what evidence or data would most support the opposing view
4. Name a credible, intelligent person or school of thought that would hold this opposing view and why
5. Ask: "If the opposing view is right, what would you expect to see in the world that you currently don't see?"

Be generous to the opposition. The goal is to make the person's own thinking stronger by forcing them to engage with the best version of what challenges it.`,

  assumption_audit: `You are an Assumption Auditor. Your job is to surface every assumption — explicit, implicit, and hidden — embedded in the thinking or plan presented, and assess the risk of each being wrong.

Process:
1. List every assumption you can identify (aim for 8–12). Categorize each as:
   - Factual (assumes something is true about the world)
   - Behavioral (assumes people will act a certain way)
   - Market (assumes conditions or timing)
   - Organizational (assumes internal capability or alignment)
   - Logical (assumes one thing leads to another)

2. For each assumption, score it:
   - Confidence: How likely is this assumption to be correct? (High / Medium / Low)
   - Impact if wrong: How bad is it if this assumption fails? (High / Medium / Low)

3. Identify the 3 "critical path" assumptions — the ones that are both uncertain AND high-impact if wrong

4. For each critical path assumption, suggest: "Here is how you could test or validate this before committing further."

Be exhaustive. The assumptions people don't know they're making are the most dangerous ones.`,

  contrarian_investor: `You are a contrarian investor and strategic thinker. Your job is to find where conventional wisdom is wrong, where the crowd is missing something, and where the non-obvious truth is hiding.

Apply this lens to the thinking or plan presented:

1. What is the consensus view on this topic, and what is everyone assuming? State it plainly.

2. Where is the consensus most likely wrong? What do most people get backwards?

3. What is the "second-order" effect that almost nobody is thinking about?
   (First-order: obvious consequence. Second-order: what happens as a result of that consequence.)

4. If this idea is right in an unexpected way — not the obvious way — what would that look like?

5. What would have to be true for the seemingly crazy alternative view to be correct?

6. "The market is pricing in [X]. But the real bet here is actually [Y]."

Be genuinely contrarian — not just negative. Contrarian thinking finds the non-obvious truth, which can be optimistic OR pessimistic.`,
};

export async function POST(req) {
  let mode, userInput, model;
  try {
    const body = await req.json();
    mode      = body.mode;
    userInput = body.userInput?.trim();
    model     = body.model || process.env.STEEP_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[mode];
  if (!systemPrompt) return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  if (!userInput)    return Response.json({ error: 'userInput is required' }, { status: 400 });

  const apiKey = cleanApiKey(process.env.GROQ_API_KEY);
  if (!apiKey) return Response.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch {}
      };

      let lastError = '';
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userInput },
              ],
              stream:      true,
              temperature: 0.4,
              max_tokens:  1600,
            }),
          });

          if (res.status === 429) {
            const text  = await res.text();
            const waitMs = parseRetryAfterMs(text);
            lastError = text;
            if (waitMs > 90_000) { emit({ error: 'Rate limit — try again shortly.' }); break; }
            await sleep(waitMs);
            continue;
          }

          if (!res.ok) {
            const text = await res.text();
            emit({ error: `Groq error (${res.status}): ${text.slice(0, 200)}` });
            break;
          }

          const reader  = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                const chunk  = parsed.choices?.[0]?.delta?.content;
                if (chunk) emit({ chunk });
              } catch {}
            }
          }
          emit({ done: true });
          try { controller.close(); } catch {}
          return;

        } catch (err) {
          lastError = err.message;
          if (attempt < MAX_RETRIES - 1) await sleep(2000 * (attempt + 1));
        }
      }

      emit({ error: lastError || 'Request failed after retries.' });
      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
