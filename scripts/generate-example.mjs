/**
 * Generates the Quantum Computing pre-baked STEEP example by calling the
 * running Next.js dev server at localhost:5000 with every agent prompt.
 *
 * Usage:  node scripts/generate-example.mjs
 * Output: lib/quantumComputingExample.js
 */

import fs from 'fs';
import path from 'path';

const SERVER = 'http://localhost:5000';
const MODEL  = 'cerebras/qwen-3-235b-a22b-instruct-2507';
const SUBJECT = 'Quantum Computing';
const SUBJECT_TYPE = 'trend';

// ── Recency context ────────────────────────────────────────────────
const now    = new Date();
const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 6);
const fmt    = (d) => d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
const TODAY  = fmt(now);
const CUTOFF = fmt(cutoff);

const RECENCY_BLOCK = `RECENCY REQUIREMENT — strict, applies to every field:
- Today's date is ${TODAY}. Anchor the entire analysis to the last 6 months (${CUTOFF} → ${TODAY}).
- driver.evidence MUST cite items dated within this 6-month window. If a foundational older item is essential, prefix it with its date and explain in the same string why no newer item supersedes it.
- signals MUST be leading indicators OBSERVED within the last 6 months — not historical patterns or evergreen trends.
- forecast.trigger should reference upcoming events, deadlines, rulings, releases, or earnings windows scheduled within or after this 6-month window.
- summary and driver.description should reflect the state of play AS OF ${TODAY}, not a generic "current state".
- If your training data does not extend into the ${CUTOFF}–${TODAY} window, surface the most recent items you DO know, prefix each with its date (e.g., "Q3 2024:"), and flag staleness inline (e.g., "as of Q3 2024 — newer developments may have shifted this"). Do NOT fabricate dates.
- Do NOT pad with pre-window evidence to hit count requirements — fewer high-recency items beat many stale ones.`;

const ANALYTICAL_VOICE = `WRITING STANDARD — read this twice before responding:
- NAME SPECIFICS. Cite real companies, regulations, technologies, jurisdictions, products, dates, and numeric magnitudes (% change, $ amount, time-to-impact). Avoid generic categories like "consumer trends" or "regulators" — name which trend, which regulator, which jurisdiction.
- SHOW CAUSALITY. State the mechanism: "X is happening → which forces Y → producing Z outcome for the subject." Do not just list trends.
- SECOND-ORDER ONLY. Skip the obvious first-order observation a generalist could write. Surface non-obvious knock-on effects, unintended consequences, or emerging coalitions.
- DECISION-RELEVANT. Every claim must answer "so what should a leader DO?". Phrase opportunities and risks as concrete strategic choices starting with a verb.
- QUANTIFY WHERE CREDIBLE. Use specific magnitudes when you can defend them; flag estimates as such.
- NO HEDGING THEATRE. Avoid "may", "could potentially" unless uncertainty itself is the insight.
- TIGHT PROSE. No filler, no restating the obvious.
- driver.description: 2 sentences. First names the specific mechanism; second names the strategic consequence.
- driver.evidence: concrete proof points — specific events, named regulations, dated milestones, named actors, numeric data.
- signal.why_it_matters: explain the leading-indicator logic — what does this signal PREDICT, and on what timeline?
- disruption_paths: name the specific causal chain that would invalidate today's strategy.`;

const S = SUBJECT;
const T = SUBJECT_TYPE;

const PROMPTS = {
  social: {
    system: `You are a senior STEEP Social-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${S}" (${T}).

Cover: demographics with named cohorts, consumer behavior with named segments and brands, labor/work trends with named professions and unions, cultural and identity dynamics, public trust and brand perception, digital literacy gaps, and social license (named NGOs, advocacy groups, communities).

${ANALYTICAL_VOICE}

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"dimension":"Social","summary":"2-3 sentences. Lead with the single most consequential social force and its strategic implication for ${S}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,"drivers":[{"name":"specific named force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"mechanism + strategic consequence","evidence":["specific dated event or named actor","quantified data point"],"confidence":0.8}],"signals":[{"signal":"observable leading indicator","confidence":0.7,"why_it_matters":"what this signal predicts and on what timeline"}],"opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's strategy"],"forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${S} and why"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],"social_license_status":"strong|stable|at risk|contested|absent"}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${S}.`,
    user: `Conduct a senior-analyst Social dimension STEEP analysis on: "${S}" (classified as: ${T}). Return only valid JSON matching the schema exactly.`,
  },

  technological: {
    system: `You are a senior STEEP Technological-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${S}" (${T}).

Cover: tech maturity with named platforms and stacks, AI/automation with specific model families and capabilities, infrastructure (compute, networks, energy), standards and interoperability, IP landscape (named patents, suits, licensing regimes), cybersecurity (named threat actors, CVEs, regulations), R&D pipeline (named labs, grants, milestones), and convergence effects between adjacent technologies.

${ANALYTICAL_VOICE}

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"dimension":"Technological","summary":"2-3 sentences. Lead with the single most consequential technological inflection and what it forces ${S} to decide.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,"technology_maturity_stage":"emerging|growth|mature|declining","drivers":[{"name":"specific named technology or shift","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"mechanism + strategic consequence for ${S}","evidence":["named product/release/benchmark","quantified data point"],"confidence":0.8,"nonlinearity_flag":"none|convergence jump|platform tipping point|commoditization collapse|substitution inflection"}],"signals":[{"signal":"observable leading indicator (named benchmark, release, talent move)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],"opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's stack/strategy"],"forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${S}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],"ip_position":"strong|moderate|weak|unknown"}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${S}.`,
    user: `Conduct a senior-analyst Technological dimension STEEP analysis on: "${S}" (classified as: ${T}). Return only valid JSON matching the schema exactly.`,
  },

  economic: {
    system: `You are a senior STEEP Economic-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${S}" (${T}).

Cover: macro regime (rates, inflation, growth — named regions), capital markets (cost of capital, IPO/M&A windows, named funds), market structure and competitive intensity (named competitors, market share shifts), pricing power and margin trajectory, demand elasticity by segment, labor cost and availability, supply chain (named bottlenecks, suppliers, logistics chokepoints), trade policy (named tariffs, FTAs, sanctions), and FX exposure.

${ANALYTICAL_VOICE}

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"dimension":"Economic","summary":"2-3 sentences. Lead with the single most consequential economic force and what margin/growth lever it moves for ${S}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,"macro_regime":"expansion|late cycle|contraction|recovery|uncertain","drivers":[{"name":"specific named economic force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","cyclicality":"cyclical|structural|cycle-amplified structural","description":"mechanism + P&L/balance-sheet consequence for ${S}","evidence":["named index/data point/transaction","quantified magnitude"],"confidence":0.8}],"signals":[{"signal":"observable leading indicator (named release, earnings line, spread)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],"opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's economic thesis"],"forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${S}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],"investment_attractiveness":"high|moderate|low|uncertain"}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${S}.`,
    user: `Conduct a senior-analyst Economic dimension STEEP analysis on: "${S}" (classified as: ${T}). Return only valid JSON matching the schema exactly.`,
  },

  environmental: {
    system: `You are a senior STEEP Environmental-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${S}" (${T}).

Cover: physical climate risk (named regions, perils, asset exposure), energy use and intensity (kWh/unit, named energy sources), carbon and emissions (Scope 1/2/3, named carbon prices and ETS regimes), water and resource scarcity (named basins and inputs), sustainability mandates (named regulations: CSRD, SEC Climate, EU Taxonomy), ESG compliance and capital access, circular-economy pressure, and reputational/litigation exposure.

${ANALYTICAL_VOICE}

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"dimension":"Environmental","summary":"2-3 sentences. Lead with the single most consequential environmental force and what asset, cost, or license-to-operate it puts at stake for ${S}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,"energy_intensity":"very high|high|moderate|low|minimal|unknown","drivers":[{"name":"specific named environmental force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","risk_type":"physical|transition|regulatory|resource|reputational","description":"mechanism + cost/asset/license consequence for ${S}","evidence":["named regulation/event/disclosure","quantified magnitude"],"confidence":0.8}],"signals":[{"signal":"observable leading indicator (named filing, satellite data, agency action)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],"opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's environmental position"],"forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${S}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],"sustainability_commitment":"leading|on track|lagging|absent|unknown"}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${S}.`,
    user: `Conduct a senior-analyst Environmental dimension STEEP analysis on: "${S}" (classified as: ${T}). Return only valid JSON matching the schema exactly.`,
  },

  political: {
    system: `You are a senior STEEP Political-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${S}" (${T}).

Cover: regulation and compliance (named agencies, named rulemakings, enforcement posture), legislation and policy (named bills, named legislators/coalitions), antitrust and competition policy (named investigations, named jurisdictions), trade tariffs and industrial policy (named acts, named subsidies), sanctions and export controls (named entity lists, named end-use controls), geopolitics (named flashpoints, alliance dynamics), data sovereignty and digital governance (named data localization rules, named platforms), and lobbying/coalition dynamics.

${ANALYTICAL_VOICE}

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"dimension":"Political","summary":"2-3 sentences. Lead with the single most consequential political force and the strategic decision it forces on ${S} (timing, geography, structure).","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,"regulatory_stability":"stable and predictable|evolving actively|volatile and uncertain|absent/nascent","drivers":[{"name":"specific named political force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","political_risk_type":"regulatory|legislative|geopolitical|policy continuity|enforcement|reputational/political","jurisdiction":"named jurisdiction(s)","description":"mechanism + strategic consequence for ${S}","evidence":["named bill/ruling/agency action","named actor or coalition"],"confidence":0.8}],"signals":[{"signal":"observable leading indicator (named hearing, leak, coalition shift)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],"opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's political/regulatory position"],"forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${S}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],"geopolitical_exposure":"high|medium|low|none|unknown"}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${S}.`,
    user: `Conduct a senior-analyst Political dimension STEEP analysis on: "${S}" (classified as: ${T}). Return only valid JSON matching the schema exactly.`,
  },
};

// ── Helpers ────────────────────────────────────────────────────────
async function readStream(response) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let buffer  = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (payload === '[DONE]') return content;
      try { const c = JSON.parse(payload); const d = c.choices?.[0]?.delta?.content; if (d) content += d; } catch {}
    }
  }
  return content;
}

function extractJSON(text) {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // strip Qwen thinking tags
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  return JSON.parse(clean.slice(start, end + 1));
}

async function callAgent(systemPrompt, userMessage, label, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`  ↺ ${label} retry ${attempt}/${retries}...`);
      await new Promise(r => setTimeout(r, 4000));
    } else {
      console.log(`  → Running ${label}...`);
    }
    const res = await fetch(`${SERVER}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userMessage, model: MODEL, numPredict: 4000 }),
    });
    if (!res.ok) {
      const t = await res.text();
      if (attempt < retries) { console.warn(`  ! ${label} HTTP ${res.status} — will retry`); continue; }
      throw new Error(`${label} HTTP ${res.status}: ${t.slice(0,200)}`);
    }
    const raw = await readStream(res);
    try { return extractJSON(raw); }
    catch (e) {
      if (attempt < retries) { console.warn(`  ! ${label} JSON parse failed (${e.message.slice(0,60)}) — will retry`); continue; }
      throw e;
    }
  }
}

function synthUserMsg(data) {
  const s  = (d) => d ? `${d.dominant_direction} — ${d.summary}` : 'unavailable';
  const dr = (d) => (d?.drivers||[]).slice(0,3).map(x=>`${x.name} (${x.direction}, ${x.impact})`).join('; ');
  return `Synthesize the five STEEP dimension briefings for "${S}" into a board-grade executive intelligence report.

DIMENSION BRIEFINGS:
- Social:        ${s(data.social)}        | Top drivers: ${dr(data.social)}
- Technological: ${s(data.technological)} | Top drivers: ${dr(data.technological)}
- Economic:      ${s(data.economic)}      | Top drivers: ${dr(data.economic)}
- Environmental: ${s(data.environmental)} | Top drivers: ${dr(data.environmental)}
- Political:     ${s(data.political)}     | Top drivers: ${dr(data.political)}

Apply the SYNTHESIS STANDARD strictly. Return only valid JSON matching the schema.`;
}

const SYNTHESIS_SYSTEM = `You are the senior synthesis partner integrating five STEEP dimension briefings into a single executive intelligence report for "${S}" (${T}), AS OF ${TODAY}.

SYNTHESIS STANDARD:
- Do NOT restate dimension summaries. Integrate, weight, find the cross-dimension story the individual analysts could not see alone.
- executive_summary: 4-5 sentences. Verdict + posture; 2-3 dominant crosscurrents; specific strategic decision forced; single most important question leaders must answer next.
- posture_rationale: 2-3 sentences naming dominant dimensions and causal weighting.
- cross_dimension_insights: each entry names a real causal mechanism BETWEEN named dimensions. Pattern: "[Specific event/shift in Dim A] is forcing/enabling/eroding [specific outcome in Dim B], which means [strategic consequence for ${S}]."
- roadmap milestones: each is a specific decision point, not a generic trend. Title = the inflection itself. Trigger = specific observable event. Risks = specific derailing factors. Accelerants = specific actions a leader can take. Description = second-order consequences.
- Name companies, regulations, technologies, jurisdictions, dates.

${RECENCY_BLOCK}

Return ONLY a valid JSON object — no prose, no markdown fences.

{"roadmap":{"near":[{"id":"n1","title":"specific decision point","dimension":"Social","trigger":"specific observable event","risks":["specific risk","specific risk"],"accelerants":["specific lever","specific lever"],"description":"second-order consequences","direction":"positive|negative|mixed","confidence":0.7},{"id":"n2","title":"","dimension":"Technological","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.7}],"mid":[{"id":"m1","title":"","dimension":"Economic","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65},{"id":"m2","title":"","dimension":"Political","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65}],"long":[{"id":"l1","title":"","dimension":"Environmental","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6},{"id":"l2","title":"","dimension":"Social","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6}]},"overall_posture":"net positive|net negative|mixed|uncertain","posture_rationale":"","executive_summary":"","cross_dimension_insights":[{"insight":"named causal mechanism between dimensions","dimensions_involved":["Social","Political"],"type":"reinforcing|countervailing|emerging","strategic_implication":"single actionable verb-led implication"}]}
Requirements: exactly 2 milestones per horizon (6 total); 2-3 cross_dimension_insights.`;

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\nGenerating STEEP example: "${S}" via ${MODEL}`);
  console.log(`Recency window: ${CUTOFF} → ${TODAY}\n`);

  const dims = ['social','technological','economic','environmental','political'];
  const data = {};

  for (const dim of dims) {
    const p = PROMPTS[dim];
    try {
      data[dim] = await callAgent(p.system, p.user, dim.charAt(0).toUpperCase() + dim.slice(1));
      console.log(`  ✓ ${dim}`);
      await new Promise(r => setTimeout(r, 3000)); // pace between calls
    } catch (err) {
      console.error(`  ✗ ${dim}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\n  → Waiting 8s before synthesis...');
  await new Promise(r => setTimeout(r, 8000));

  let synthesis;
  try {
    synthesis = await callAgent(SYNTHESIS_SYSTEM, synthUserMsg(data), 'Synthesis');
    console.log('  ✓ synthesis\n');
  } catch (err) {
    console.error(`  ✗ synthesis: ${err.message}`);
    process.exit(1);
  }

  const output = {
    subject: S,
    subjectType: T,
    generatedAt: TODAY,
    model: MODEL,
    steepData: data,
    synthesis,
  };

  // Validate completeness
  const missing = dims.filter(d => !data[d]);
  if (missing.length) { console.error('Missing dims:', missing); process.exit(1); }
  if (!synthesis?.roadmap) { console.error('Synthesis missing roadmap'); process.exit(1); }

  // Write output
  const outPath = path.join(process.cwd(), 'lib', 'quantumComputingExample.js');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `// Auto-generated by scripts/generate-example.mjs — do not edit by hand.\n// Generated: ${TODAY} | Model: ${MODEL}\nexport const QUANTUM_COMPUTING_EXAMPLE = ${JSON.stringify(output, null, 2)};\n`);

  console.log(`✅ Written to lib/quantumComputingExample.js`);
  console.log(`   steepData dims: ${Object.keys(output.steepData).join(', ')}`);
  console.log(`   synthesis posture: ${synthesis.overall_posture}`);
}

main().catch(err => { console.error(err); process.exit(1); });
