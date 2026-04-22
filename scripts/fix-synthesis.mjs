/**
 * Re-runs only synthesis using the dim data already in lib/quantumComputingExample.js.
 * Outputs flat fields (posture, summary, insights) FIRST so they are never truncated.
 */
import fs from 'fs';

const SERVER  = 'http://localhost:5000';
const MODEL   = 'cerebras/qwen-3-235b-a22b-instruct-2507';
const SUBJECT = 'Quantum Computing';
const TYPE    = 'trend';

const now    = new Date();
const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 6);
const fmt    = (d) => d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
const TODAY  = fmt(now);
const CUTOFF = fmt(cutoff);

const RECENCY = `RECENCY REQUIREMENT: Today is ${TODAY}. Analysis window: ${CUTOFF} → ${TODAY}. Surface the most recent evidence you know; flag staleness inline. Do not fabricate dates.`;

// Load existing dim data
const src = fs.readFileSync('./lib/quantumComputingExample.js','utf8');
const code = src.replace('export const QUANTUM_COMPUTING_EXAMPLE = ', 'module.exports = ');
fs.writeFileSync('/tmp/qc_load.js', code);
const existing = (await import('/tmp/qc_load.js')).default;
const data = existing.steepData;

const s  = (d) => d ? `${d.dominant_direction} — ${d.summary}` : 'unavailable';
const dr = (d) => (d?.drivers||[]).slice(0,3).map(x=>`${x.name} (${x.direction}, ${x.impact})`).join('; ');

const SYSTEM = `You are the senior synthesis partner integrating five STEEP dimension briefings into a single executive intelligence report for "${SUBJECT}" (${TYPE}), AS OF ${TODAY}.

DIMENSION BRIEFINGS:
- Social:        ${s(data.social)}        | Top drivers: ${dr(data.social)}
- Technological: ${s(data.technological)} | Top drivers: ${dr(data.technological)}
- Economic:      ${s(data.economic)}      | Top drivers: ${dr(data.economic)}
- Environmental: ${s(data.environmental)} | Top drivers: ${dr(data.environmental)}
- Political:     ${s(data.political)}     | Top drivers: ${dr(data.political)}

${RECENCY}

SYNTHESIS STANDARD:
- Do NOT restate dimension summaries. Integrate, weight, find the cross-dimension story.
- executive_summary: 4-5 sentences. Verdict; 2-3 dominant crosscurrents; specific strategic decision forced; most important question leaders must answer.
- posture_rationale: 2-3 sentences naming the 1-2 dominant dimensions and WHY their interaction sets posture.
- cross_dimension_insights: each entry names a real causal mechanism BETWEEN named dimensions.
- roadmap milestones: specific decision points, not generic trends. Title = the inflection itself. Trigger = specific observable event. Accelerants = actions a leader can take.
- Name companies, regulations, technologies, jurisdictions, dates throughout.

Return ONLY a valid JSON object — no prose, no markdown fences.
CRITICAL: Output the short fields FIRST in this exact order, then roadmap last.

{
  "overall_posture": "net positive|net negative|mixed|uncertain",
  "posture_rationale": "2-3 sentences naming dominant dimensions and causal weighting",
  "executive_summary": "4-5 sentence strategic assessment",
  "cross_dimension_insights": [
    {"insight": "named causal mechanism between dimensions", "dimensions_involved": ["Dim A","Dim B"], "type": "reinforcing|countervailing|emerging", "strategic_implication": "single actionable verb-led implication"}
  ],
  "roadmap": {
    "near": [
      {"id":"n1","title":"specific decision point or inflection","dimension":"Social","trigger":"specific observable event","risks":["specific risk","specific risk"],"accelerants":["specific lever","specific lever"],"description":"second-order consequences","direction":"positive|negative|mixed","confidence":0.7},
      {"id":"n2","title":"","dimension":"Technological","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.7}
    ],
    "mid": [
      {"id":"m1","title":"","dimension":"Economic","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65},
      {"id":"m2","title":"","dimension":"Political","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65}
    ],
    "long": [
      {"id":"l1","title":"","dimension":"Environmental","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6},
      {"id":"l2","title":"","dimension":"Social","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6}
    ]
  }
}
Requirements: exactly 2 milestones per horizon (6 total); 2-3 cross_dimension_insights; all ${SUBJECT}-specific.`;

async function readStream(response) {
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let content = ''; let buffer = '';
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop();
    for (const line of lines) {
      const t = line.trim(); if (!t || !t.startsWith('data:')) continue;
      const p = t.slice(5).trim(); if (p === '[DONE]') return content;
      try { const c = JSON.parse(p); const d = c.choices?.[0]?.delta?.content; if (d) content += d; } catch {}
    }
  }
  return content;
}

function extractJSON(text) {
  let clean = text.replace(/```json\s*/gi,'').replace(/```\s*/g,'').replace(/<think>[\s\S]*?<\/think>/gi,'').trim();
  const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  return JSON.parse(clean.slice(start, end + 1));
}

async function run() {
  console.log('Re-running synthesis with reordered schema...');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) { console.log(`  Retry ${attempt}...`); await new Promise(r => setTimeout(r, 4000)); }
    const res = await fetch(`${SERVER}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt: SYSTEM, userMessage: `Synthesize the STEEP analysis for "${SUBJECT}". Return only valid JSON.`, model: MODEL, numPredict: 4000 }),
    });
    if (!res.ok) { console.warn(`HTTP ${res.status}`); continue; }
    const raw = await readStream(res);
    let synth;
    try { synth = extractJSON(raw); } catch(e) { console.warn('Parse error:', e.message); continue; }

    console.log('Keys:', Object.keys(synth));
    console.log('posture:', synth.overall_posture);
    console.log('exec_summary snippet:', (synth.executive_summary||'').slice(0,100));
    console.log('cross_dim count:', synth.cross_dimension_insights?.length);
    console.log('roadmap.near:', synth.roadmap?.near?.length);

    if (!synth.overall_posture || !synth.executive_summary) {
      console.warn('Missing critical fields, retrying...'); continue;
    }

    // Merge into existing file
    existing.synthesis = synth;
    const outPath = './lib/quantumComputingExample.js';
    fs.writeFileSync(outPath,
      `// Auto-generated by scripts/generate-example.mjs — do not edit by hand.\n// Generated: ${TODAY} | Model: ${MODEL}\nexport const QUANTUM_COMPUTING_EXAMPLE = ${JSON.stringify(existing, null, 2)};\n`
    );
    console.log('\n✅ lib/quantumComputingExample.js updated with complete synthesis.');
    return;
  }
  throw new Error('Failed to get valid synthesis after 3 attempts');
}

run().catch(e => { console.error(e); process.exit(1); });
