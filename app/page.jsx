'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { QUANTUM_COMPUTING_EXAMPLE } from '../lib/quantumComputingExample';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const RECOMMENDED_MODEL = 'llama-3.3-70b-versatile';

const CATALOG = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',             note: 'Recommended — best quality, fast on Groq' },
  { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant',      note: 'Fastest — separate daily quota from 70B' },
  { id: 'llama3-8b-8192',          label: 'Llama 3 8B',                note: 'Solid baseline, 8k context' },
  { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8×7B',              note: 'Strong reasoning, 32k context' },
  { id: 'gemma2-9b-it',            label: 'Gemma 2 9B',                note: 'Good instruction following' },
  { id: 'cerebras/qwen-3-235b-a22b-instruct-2507', label: 'Qwen 3 235B Instruct (Cerebras)', note: 'Top-tier reasoning — separate daily quota from Groq' },
  { id: 'cerebras/llama3.1-8b',                    label: 'Llama 3.1 8B (Cerebras)',         note: 'Fastest Cerebras option — good for quick tests' },
];

const SUGGESTED_SUBJECTS = {
  trends: [
    'Artificial Intelligence', 'Quantum Computing', 'Climate Change',
    'Blockchain & Web3', 'Electric Vehicles', 'Remote Work', 'Gene Therapy',
    '5G Networks', 'Renewable Energy', 'Autonomous Vehicles', 'Cybersecurity',
    'Space Commercialization', 'Synthetic Biology', 'Digital Health',
  ],
  companies: [
    'Apple', 'Google', 'Microsoft', 'Tesla', 'Amazon',
    'Nvidia', 'Meta', 'Netflix', 'Stripe', 'SpaceX',
    'TSMC', 'Samsung', 'OpenAI', 'Anthropic', 'Walmart',
  ],
};

const COLORS = {
  Social:        '#3B82F6',
  Technological: '#8B5CF6',
  Economic:      '#10B981',
  Environmental: '#14B8A6',
  Political:     '#F97316',
};

const DIR_CLS = {
  ACCELERATING:  'bg-green-900  text-green-300  border border-green-700',
  EMERGING:      'bg-yellow-900 text-yellow-300 border border-yellow-700',
  STABLE:        'bg-blue-900   text-blue-300   border border-blue-700',
  DECELERATING:  'bg-red-900    text-red-300    border border-red-700',
  'net positive':'bg-green-900  text-green-300  border border-green-700',
  'net negative':'bg-red-900    text-red-300    border border-red-700',
  mixed:         'bg-yellow-900 text-yellow-300 border border-yellow-700',
  uncertain:     'bg-slate-700  text-slate-300  border border-slate-600',
  positive:      'bg-green-900  text-green-300  border border-green-700',
  negative:      'bg-red-900    text-red-300    border border-red-700',
};

const IMPACT_CLS = {
  high:   'bg-red-900    text-red-300',
  medium: 'bg-yellow-900 text-yellow-300',
  low:    'bg-slate-700  text-slate-400',
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// Tuned for Groq Llama 3.3 70B — push for senior-analyst quality:
// named specifics, causal mechanisms, quantification, second-order
// effects, decision orientation. Output JSON schema is unchanged.
// ═══════════════════════════════════════════════════════════════════

// Dynamic 6-month recency window — recomputed per analysis run
function buildRecencyContext() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const today  = fmt(now);
  const cutoffStr = fmt(cutoff);
  return {
    today,
    cutoff: cutoffStr,
    block: `RECENCY REQUIREMENT — strict, applies to every field:
- Today's date is ${today}. Anchor the entire analysis to the last 6 months (${cutoffStr} → ${today}).
- driver.evidence MUST cite items dated within this 6-month window. If a foundational older item is essential, prefix it with its date and explain in the same string why no newer item supersedes it.
- signals MUST be leading indicators OBSERVED within the last 6 months — not historical patterns or evergreen trends.
- forecast.trigger should reference upcoming events, deadlines, rulings, releases, or earnings windows scheduled within or after this 6-month window.
- summary and driver.description should reflect the state of play AS OF ${today}, not a generic "current state".
- If your training data does not extend into the ${cutoffStr}–${today} window, surface the most recent items you DO know, prefix each with its date (e.g., "Q3 2024:"), and flag staleness inline (e.g., "as of Q3 2024 — newer developments may have shifted this"). Do NOT fabricate dates.
- Do NOT pad with pre-window evidence to hit count requirements — fewer high-recency items beat many stale ones. If a count is unattainable with recent evidence, fill remaining slots with the most recent dated items available and flag them as such.`,
  };
}

const ANALYTICAL_VOICE = `WRITING STANDARD — read this twice before responding:
- NAME SPECIFICS. Cite real companies, regulations, technologies, jurisdictions, products, dates, and numeric magnitudes (% change, $ amount, time-to-impact). Avoid generic categories like "consumer trends" or "regulators" — name which trend, which regulator, which jurisdiction.
- SHOW CAUSALITY. State the mechanism: "X is happening → which forces Y → producing Z outcome for the subject." Do not just list trends.
- SECOND-ORDER ONLY. Skip the obvious first-order observation a generalist could write. Surface non-obvious knock-on effects, unintended consequences, or emerging coalitions.
- DECISION-RELEVANT. Every claim must answer "so what should a leader DO?". Phrase opportunities and risks as concrete strategic choices starting with a verb (e.g. "Pre-position supply in...", "Hedge FX exposure to...", "License IP from...", "Lobby for carve-out on...").
- QUANTIFY WHERE CREDIBLE. Use specific magnitudes when you can defend them; flag estimates as such ("~", "est.").
- NO HEDGING THEATRE. Avoid "may", "could potentially", "some experts believe" — unless the uncertainty itself is the insight, in which case explain the bifurcation.
- TIGHT PROSE. Each text field carries information. No filler, no restating the obvious, no boilerplate.
- driver.description: 2 sentences. First names the specific mechanism; second names the strategic consequence for the subject.
- driver.evidence: concrete proof points — specific events, named regulations, dated milestones, named actors, numeric data. Never "studies show".
- signal.why_it_matters: explain the leading-indicator logic — what does this signal PREDICT, and on what timeline?
- disruption_paths: name the specific causal chain that would invalidate today's strategy ("If X, then Y collapses because Z").`;

const SOCIAL_PROMPT = (subj, type, rc) => `You are a senior STEEP Social-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${subj}" (${type}).

Cover: demographics with named cohorts, consumer behavior with named segments and brands, labor/work trends with named professions and unions, cultural and identity dynamics, public trust and brand perception, digital literacy gaps, and social license (named NGOs, advocacy groups, communities).

${ANALYTICAL_VOICE}

${rc.block}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Social","summary":"2-3 sentences. Lead with the single most consequential social force and its strategic implication for ${subj}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "drivers":[{"name":"specific named force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"mechanism + strategic consequence","evidence":["specific dated event or named actor","quantified data point"],"confidence":0.8}],
  "signals":[{"signal":"observable leading indicator","confidence":0.7,"why_it_matters":"what this signal predicts and on what timeline"}],
  "opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's strategy"],
  "forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${subj} and why"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "social_license_status":"strong|stable|at risk|contested|absent"
}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${subj} — generic boilerplate will be rejected.`;

const TECH_PROMPT = (subj, type, rc) => `You are a senior STEEP Technological-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${subj}" (${type}).

Cover: tech maturity with named platforms and stacks, AI/automation with specific model families and capabilities, infrastructure (compute, networks, energy), standards and interoperability, IP landscape (named patents, suits, licensing regimes), cybersecurity (named threat actors, CVEs, regulations), R&D pipeline (named labs, grants, milestones), and convergence effects between adjacent technologies.

${ANALYTICAL_VOICE}

${rc.block}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Technological","summary":"2-3 sentences. Lead with the single most consequential technological inflection and what it forces ${subj} to decide.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "technology_maturity_stage":"emerging|growth|mature|declining",
  "drivers":[{"name":"specific named technology or shift","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","description":"mechanism + strategic consequence for ${subj}","evidence":["named product/release/benchmark","quantified data point"],"confidence":0.8,"nonlinearity_flag":"none|convergence jump|platform tipping point|commoditization collapse|substitution inflection"}],
  "signals":[{"signal":"observable leading indicator (named benchmark, release, talent move)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],
  "opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's stack/strategy"],
  "forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${subj}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "ip_position":"strong|moderate|weak|unknown"
}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${subj}.`;

const ECON_PROMPT = (subj, type, rc) => `You are a senior STEEP Economic-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${subj}" (${type}).

Cover: macro regime (rates, inflation, growth — named regions), capital markets (cost of capital, IPO/M&A windows, named funds), market structure and competitive intensity (named competitors, market share shifts), pricing power and margin trajectory, demand elasticity by segment, labor cost and availability, supply chain (named bottlenecks, suppliers, logistics chokepoints), trade policy (named tariffs, FTAs, sanctions), and FX exposure.

${ANALYTICAL_VOICE}

${rc.block}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Economic","summary":"2-3 sentences. Lead with the single most consequential economic force and what margin/growth lever it moves for ${subj}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "macro_regime":"expansion|late cycle|contraction|recovery|uncertain",
  "drivers":[{"name":"specific named economic force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","cyclicality":"cyclical|structural|cycle-amplified structural","description":"mechanism + P&L/balance-sheet consequence for ${subj}","evidence":["named index/data point/transaction","quantified magnitude"],"confidence":0.8}],
  "signals":[{"signal":"observable leading indicator (named release, earnings line, spread)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],
  "opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's economic thesis"],
  "forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${subj}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "investment_attractiveness":"high|moderate|low|uncertain"
}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${subj}.`;

const ENV_PROMPT = (subj, type, rc) => `You are a senior STEEP Environmental-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${subj}" (${type}).

Cover: physical climate risk (named regions, perils, asset exposure), energy use and intensity (kWh/unit, named energy sources), carbon and emissions (Scope 1/2/3, named carbon prices and ETS regimes), water and resource scarcity (named basins and inputs), sustainability mandates (named regulations: CSRD, SEC Climate, EU Taxonomy), ESG compliance and capital access, circular-economy pressure, and reputational/litigation exposure.

${ANALYTICAL_VOICE}

${rc.block}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Environmental","summary":"2-3 sentences. Lead with the single most consequential environmental force and what asset, cost, or license-to-operate it puts at stake for ${subj}.","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "energy_intensity":"very high|high|moderate|low|minimal|unknown",
  "drivers":[{"name":"specific named environmental force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","risk_type":"physical|transition|regulatory|resource|reputational","description":"mechanism + cost/asset/license consequence for ${subj}","evidence":["named regulation/event/disclosure","quantified magnitude"],"confidence":0.8}],
  "signals":[{"signal":"observable leading indicator (named filing, satellite data, agency action)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],
  "opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's environmental position"],
  "forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${subj}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "sustainability_commitment":"leading|on track|lagging|absent|unknown"
}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${subj}.`;

const POL_PROMPT = (subj, type, rc) => `You are a senior STEEP Political-dimension analyst at a top strategy firm, advising the C-suite of an organization weighing exposure to "${subj}" (${type}).

Cover: regulation and compliance (named agencies, named rulemakings, enforcement posture), legislation and policy (named bills, named legislators/coalitions), antitrust and competition policy (named investigations, named jurisdictions), trade tariffs and industrial policy (named acts, named subsidies), sanctions and export controls (named entity lists, named end-use controls), geopolitics (named flashpoints, alliance dynamics), data sovereignty and digital governance (named data localization rules, named platforms), and lobbying/coalition dynamics.

${ANALYTICAL_VOICE}

${rc.block}

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "dimension":"Political","summary":"2-3 sentences. Lead with the single most consequential political force and the strategic decision it forces on ${subj} (timing, geography, structure).","dominant_direction":"ACCELERATING|STABLE|DECELERATING|EMERGING","dimension_confidence":0.75,
  "regulatory_stability":"stable and predictable|evolving actively|volatile and uncertain|absent/nascent",
  "drivers":[{"name":"specific named political force","direction":"positive|negative|mixed","impact":"high|medium|low","velocity":"HIGH|MEDIUM|LOW","political_risk_type":"regulatory|legislative|geopolitical|policy continuity|enforcement|reputational/political","jurisdiction":"named jurisdiction(s)","description":"mechanism + strategic consequence for ${subj}","evidence":["named bill/ruling/agency action","named actor or coalition"],"confidence":0.8}],
  "signals":[{"signal":"observable leading indicator (named hearing, leak, coalition shift)","confidence":0.7,"why_it_matters":"what this predicts and timeline"}],
  "opportunities":["actionable choice starting with a verb"],"risks":["concrete risk naming the mechanism"],"disruption_paths":["specific causal chain that would invalidate today's political/regulatory position"],
  "forecast":[{"time_horizon":"0-12 months","trigger":"specific observable event","description":"what changes for ${subj}"},{"time_horizon":"1-3 years","trigger":"","description":""},{"time_horizon":"3-7 years","trigger":"","description":""}],
  "geopolitical_exposure":"high|medium|low|none|unknown"
}
Exactly 3-5 drivers, 3 signals, 3 opportunities, 3 risks, 2 disruption_paths. Every entry must be specific to ${subj}.`;

const SYNTHESIS_PROMPT = (subj, type, data, rc) => {
  const s = (d) => d ? `${d.dominant_direction} — ${d.summary}` : 'unavailable';
  const drivers = (d) => (d?.drivers || []).slice(0, 3).map(dr => `${dr.name} (${dr.direction}, ${dr.impact})`).join('; ');
  return `You are the senior synthesis partner integrating five STEEP dimension briefings into a single executive intelligence report for "${subj}" (${type}), AS OF ${rc.today}. Your audience is the CEO and board; they will use this to decide where to invest, where to retreat, and what to monitor over the next 12-36 months.

DIMENSION BRIEFINGS:
- Social:        ${s(data.social)}        | Top drivers: ${drivers(data.social)}
- Technological: ${s(data.technological)} | Top drivers: ${drivers(data.technological)}
- Economic:      ${s(data.economic)}      | Top drivers: ${drivers(data.economic)}
- Environmental: ${s(data.environmental)} | Top drivers: ${drivers(data.environmental)}
- Political:     ${s(data.political)}     | Top drivers: ${drivers(data.political)}

${rc.block}

SYNTHESIS STANDARD — read this twice before responding:
- Do NOT restate the dimension summaries. Your job is to integrate, weight, and find the cross-dimension story the individual analysts could not see alone.
- executive_summary: 4-5 sentences. Sentence 1: the overall verdict and posture. Sentence 2-3: name the 2-3 dominant crosscurrents (which dimensions are pulling in the same direction, which are colliding). Sentence 4: the specific strategic decision this assessment forces. Sentence 5: the single most important question leaders must answer next.
- posture_rationale: 2-3 sentences. Identify the 1-2 dimensions that dominate the assessment and explain WHY their interaction sets the posture (not just "Political is high impact" — explain the causal weighting).
- cross_dimension_insights: each entry must name a real causal mechanism BETWEEN the named dimensions, not a generic observation. Pattern: "[Specific event or shift in Dim A] is [forcing/enabling/eroding] [specific outcome in Dim B], which means [strategic consequence for ${subj}]." The strategic_implication must be a single concrete action starting with a verb.
- roadmap milestones: each milestone is a specific decision point or inflection — NOT a generic trend description. Title is the inflection itself ("Permitting fast-track passes Senate", "First plant reaches break-even", "EU localization deadline binds"). Trigger is a specific OBSERVABLE event a leader can monitor for. Risks are specific things that derail this milestone. Accelerants are specific things a leader can DO to speed it up. Description names the second-order consequences if it lands as expected.
- Be specific. Name companies, regulations, technologies, jurisdictions, dates. Avoid hedging language unless the uncertainty is itself the insight.

Return ONLY a valid JSON object — no prose, no markdown fences. Fill every field with real, ${subj}-specific content.

{
  "roadmap":{
    "near":[
      {"id":"n1","title":"specific decision point or inflection","dimension":"Social","trigger":"specific observable event","risks":["specific risk","specific risk"],"accelerants":["specific lever a leader can pull","specific lever"],"description":"second-order consequences if this lands as expected","direction":"positive|negative|mixed","confidence":0.7},
      {"id":"n2","title":"","dimension":"Technological","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.7}
    ],
    "mid":[
      {"id":"m1","title":"","dimension":"Economic","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65},
      {"id":"m2","title":"","dimension":"Political","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.65}
    ],
    "long":[
      {"id":"l1","title":"","dimension":"Environmental","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6},
      {"id":"l2","title":"","dimension":"Social","trigger":"","risks":["",""],"accelerants":["",""],"description":"","direction":"positive|negative|mixed","confidence":0.6}
    ]
  },
  "overall_posture":"net positive|net negative|mixed|uncertain",
  "posture_rationale":"2-3 sentences naming dominant dimensions and the causal weighting",
  "executive_summary":"4-5 sentence strategic assessment as specified above",
  "cross_dimension_insights":[{"insight":"named causal mechanism between dimensions","dimensions_involved":["Social","Political"],"type":"reinforcing|countervailing|emerging","strategic_implication":"single actionable verb-led implication"}]
}
Requirements:
- roadmap: exactly 2 milestones per horizon — all 6 must be ${subj}-specific decision points, not generic trends
- cross_dimension_insights: 2-3 entries — each must name a real cross-dimension causal mechanism, not a single-dimension observation`;
};

const INVESTMENT_THESIS_PROMPT = (ticker, companyName, fund) => {
  const fmt = (v, prefix = '', suffix = '', decimals = 2) =>
    v != null ? `${prefix}${typeof v === 'number' ? v.toFixed(decimals) : v}${suffix}` : 'N/A';
  const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A';
  const bn  = (v) => v != null ? `$${(v / 1e9).toFixed(1)}B` : 'N/A';
  const usd = (v) => v != null ? `$${v.toFixed(2)}` : 'N/A';

  const technicalContext = (() => {
    const lines = [];
    if (fund.current_price != null && fund.ma50 != null) {
      const diff50 = ((fund.current_price - fund.ma50) / fund.ma50 * 100).toFixed(1);
      lines.push(`Price vs 50-day MA: ${diff50 > 0 ? '+' : ''}${diff50}% (${usd(fund.current_price)} vs ${usd(fund.ma50)})`);
    }
    if (fund.current_price != null && fund.ma200 != null) {
      const diff200 = ((fund.current_price - fund.ma200) / fund.ma200 * 100).toFixed(1);
      lines.push(`Price vs 200-day MA: ${diff200 > 0 ? '+' : ''}${diff200}% (${usd(fund.current_price)} vs ${usd(fund.ma200)})`);
    }
    if (fund.week52_high != null && fund.week52_low != null) {
      lines.push(`52-week range: ${usd(fund.week52_low)} – ${usd(fund.week52_high)}`);
    }
    if (fund.tech_support != null || fund.tech_resistance != null) {
      lines.push(`Technical support: ${usd(fund.tech_support)}  |  Resistance: ${usd(fund.tech_resistance)}  |  Stop-loss: ${usd(fund.tech_stop_loss)}`);
    }
    if (fund.tech_trend_short || fund.tech_trend_mid || fund.tech_trend_long) {
      lines.push(`Trend signals (Trading Central): short-term ${fund.tech_trend_short || 'N/A'}, mid-term ${fund.tech_trend_mid || 'N/A'}, long-term ${fund.tech_trend_long || 'N/A'}`);
    }
    return lines.join('\n');
  })();

  return `You are a senior equity research analyst and portfolio manager at a top-tier investment firm. Generate a disciplined, data-grounded investment thesis for ${ticker} (${companyName}).

LIVE FUNDAMENTAL DATA (as of today):
Valuation:
  P/E (TTM):          ${fmt(fund.pe_ratio)}x
  Forward P/E:        ${fmt(fund.forward_pe)}x
  P/B:                ${fmt(fund.price_to_book)}x
  P/S:                ${fmt(fund.price_to_sales)}x
  EV/EBITDA:          ${fmt(fund.ev_to_ebitda)}x
  PEG:                ${fmt(fund.peg_ratio)}
  Market Cap:         ${bn(fund.market_cap)}
  Current Price:      ${usd(fund.current_price)}
  Sector:             ${fund.sector || 'N/A'} / ${fund.industry || 'N/A'}
  Valuation Signal:   ${fund.valuation_signal || 'N/A'}${fund.valuation_description ? ` (${fund.valuation_description} ${fund.valuation_relative || ''})`.trim() : ''}
  Upside to Consensus Target: ${fund.upside_pct != null ? (fund.upside_pct * 100).toFixed(1) + '%' : 'N/A'}

Profitability & Quality:
  Revenue (TTM):      ${bn(fund.revenue)}
  Revenue Growth YoY: ${pct(fund.revenue_growth)}
  Gross Margin:       ${pct(fund.gross_margin)}
  Operating Margin:   ${pct(fund.operating_margin)}
  Net Margin:         ${pct(fund.profit_margin)}
  ROE:                ${pct(fund.return_on_equity)}
  Free Cash Flow:     ${bn(fund.free_cashflow)}
  Debt/Equity:        ${fmt(fund.debt_to_equity)}
  Beta:               ${fmt(fund.beta)}
  Dividend Yield:     ${pct(fund.dividend_yield)}

Technical Setup:
${technicalContext}

Analyst Consensus:
  Rating:             ${fund.analyst_rating}
  Target (Mean):      ${usd(fund.analyst_target_mean)}
  Target Range:       ${usd(fund.analyst_target_low)} – ${usd(fund.analyst_target_high)}
  Analysts Covering:  ${fund.analyst_count ?? 'N/A'}
  Buy / Hold / Sell:  ${fund.buy_count ?? '?'} / ${fund.hold_count ?? '?'} / ${fund.sell_count ?? '?'}

WRITING STANDARD — apply strictly:
- Every claim must be specific and grounded in the data above or the STEEP context.
- Show causality: "X metric/trend → forces Y → producing Z outcome for the investment case."
- Bull and bear cases must be DISTINCT, non-overlapping drivers — not just rephrased versions of each other.
- Valuation assessment must comment on relative attractiveness vs peers and vs history if you can credibly do so.
- time_horizon must be a specific range (e.g. "12–18 months") not a generic label.
- NO hedging theatre ("may", "could potentially") — take a clear stance.
- key_catalysts: specific, observable events (earnings beats, product launches, regulatory decisions, macro pivots) not generic trends.
- entry_strategy: specific about price levels relative to the current price and technical levels above.

Return ONLY a valid JSON object — no prose, no markdown fences.

{
  "stance": "bullish|neutral|bearish",
  "confidence": 0.7,
  "thesis": "3 crisp sentences. Sentence 1: the core investment case in one line. Sentence 2: the primary value driver and its mechanism. Sentence 3: the primary risk and why the bull case still holds (or doesn't).",
  "bull_case": ["specific driver naming the mechanism and magnitude", "second driver", "third driver"],
  "bear_case": ["specific risk naming the causal chain", "second risk", "third risk"],
  "valuation_assessment": "2 sentences. Is the stock cheap, fair, or expensive on key multiples relative to peers/history? What must materialize for the multiple to expand?",
  "time_horizon": "e.g. 12-24 months",
  "key_catalysts": ["specific observable event or milestone"],
  "key_risks": ["specific risk with named causal mechanism"],
  "entry_strategy": "Specific guidance: levels, conditions, or events that would represent an attractive entry point given the current price and technicals."
}`;
};

// ═══════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

const blankDims  = () => ({ social: null, technological: null, economic: null, environmental: null, political: null });
const blankStats = () => ({ social: 'idle', technological: 'idle', economic: 'idle', environmental: 'idle', political: 'idle', synthesis: 'idle' });

const initialState = {
  subject: '',
  subjectType: null,
  ticker: null,             // NYSE/NASDAQ ticker if publicly-traded company (e.g. 'AAPL')
  fundamentals: null,       // fetched from /api/fundamentals
  investmentThesis: null,   // AI-generated thesis
  thesisStatus: 'idle',     // idle | loading | complete | error
  status: 'idle',           // idle | classifying | researching | synthesizing | complete | error
  agentStatuses: blankStats(),
  steepData: blankDims(),
  synthesis: null,
  activeTab: 'overview',
  roadmapFilter: [],
  error: null,
  errorType: null,
  // Groq
  groqStatus: 'checking', // checking | online | offline
  availableModels: [],
  selectedModel: RECOMMENDED_MODEL,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SUBJECT':       return { ...state, subject: action.payload };
    case 'SET_SELECTED_MODEL':return { ...state, selectedModel: action.payload };
    case 'SET_GROQ_STATUS':   return { ...state, groqStatus: action.status };
    case 'SET_MODELS':        return { ...state, availableModels: action.payload };
    case 'START_ANALYSIS':    return { ...state, status: 'classifying', error: null, steepData: blankDims(), synthesis: null, agentStatuses: blankStats(), ticker: null, fundamentals: null, investmentThesis: null, thesisStatus: 'idle' };
    case 'SET_SUBJECT_TYPE':  return { ...state, subjectType: action.payload, status: 'researching' };
    case 'SET_TICKER':        return { ...state, ticker: action.payload };
    case 'SET_FUNDAMENTALS':  return { ...state, fundamentals: action.data };
    case 'SET_INVESTMENT_THESIS': return { ...state, investmentThesis: action.data };
    case 'SET_THESIS_STATUS': return { ...state, thesisStatus: action.payload };
    case 'SET_AGENT_STATUS':  return { ...state, agentStatuses: { ...state.agentStatuses, [action.dimension]: action.status } };
    case 'SET_STEEP_DATA':    return { ...state, steepData: { ...state.steepData, [action.dimension]: action.data } };
    case 'SET_SYNTHESIS':     return { ...state, synthesis: action.data, status: 'complete' };
    case 'SET_STATUS':        return { ...state, status: action.payload };
    case 'SET_ACTIVE_TAB':    return { ...state, activeTab: action.payload };
    case 'TOGGLE_ROADMAP_FILTER': {
      const f = state.roadmapFilter, d = action.payload;
      return { ...state, roadmapFilter: f.includes(d) ? f.filter(x => x !== d) : [...f, d] };
    }
    case 'SET_ERROR': return { ...state, status: 'error', error: action.payload, errorType: action.errorType || null };
    case 'LOAD_EXAMPLE': {
      const ex = action.payload;
      const allComplete = { social:'complete', technological:'complete', economic:'complete', environmental:'complete', political:'complete', synthesis:'complete' };
      return { ...state, subject: ex.subject, subjectType: ex.subjectType, status:'complete', error:null, errorType:null, steepData: ex.steepData, synthesis: ex.synthesis, agentStatuses: allComplete, activeTab:'overview' };
    }
    default: return state;
  }
}

// ═══════════════════════════════════════════════════════════════════
// GROQ API UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Read a Groq SSE stream (OpenAI-compatible format).
 * Lines are prefixed with "data: "; final line is "data: [DONE]".
 * Each chunk: { choices: [{ delta: { content } }] }
 */
async function readGroqStream(response) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop(); // hold incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return content;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      } catch {}
    }
  }

  return content;
}

/** Robustly extract a JSON object from raw LLM text. */
function extractJSON(text) {
  // Strip markdown fences if present
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Find outermost JSON object
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output');
  return JSON.parse(clean.slice(start, end + 1));
}

/**
 * Coerce any value the model might return into a plain string.
 * Handles objects like {name, description}, arrays, numbers, etc.
 */
function toStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(toStr).filter(Boolean).join('; ');
  if (typeof v === 'object') {
    // Common model patterns: {name, description}, {title, description}, {text}, {value}
    const s = v.name || v.title || v.text || v.value || v.content || v.signal || v.description || '';
    if (s) return toStr(s);
    return Object.values(v).filter(x => x != null && typeof x !== 'object').join(': ') || JSON.stringify(v);
  }
  return String(v);
}

/** Ensure an array field contains only strings. */
function toStrArr(arr) {
  if (!Array.isArray(arr)) return arr == null ? [] : [toStr(arr)];
  return arr.map(item => (typeof item === 'string' ? item : toStr(item)));
}

/**
 * Normalize agent/synthesis JSON so all leaf fields that should be strings
 * actually are — regardless of what the model returns.
 */
function normalizeAgentData(data) {
  if (!data || typeof data !== 'object') return data;
  const d = { ...data };

  // Top-level string fields
  ['summary', 'executive_summary', 'posture_rationale', 'strategic_headline',
   'dominant_direction', 'overall_posture', 'macro_regime', 'technology_maturity_stage',
   'social_license_status', 'ip_position', 'investment_attractiveness'].forEach(k => {
    if (k in d) d[k] = toStr(d[k]);
  });

  // Top-level string-array fields
  ['opportunities', 'risks', 'disruption_paths', 'key_themes',
   'top_takeaways', 'cross_dimensional_risks', 'convergence_opportunities'].forEach(k => {
    if (k in d) d[k] = toStrArr(d[k]);
  });

  // Drivers
  if (Array.isArray(d.drivers)) {
    d.drivers = d.drivers.map(dr => ({
      ...dr,
      name:        toStr(dr.name),
      description: toStr(dr.description),
      evidence:    toStrArr(dr.evidence || []),
    }));
  }

  // Signals
  if (Array.isArray(d.signals)) {
    d.signals = d.signals.map(sig => ({
      ...sig,
      signal:         toStr(sig.signal),
      why_it_matters: toStr(sig.why_it_matters),
    }));
  }

  // Per-dimension forecasts
  if (Array.isArray(d.forecast)) {
    d.forecast = d.forecast.map(fc => ({
      ...fc,
      trigger:     toStr(fc.trigger),
      description: toStr(fc.description),
    }));
  }

  // Synthesis: cross-dimension insights
  if (Array.isArray(d.cross_dimension_insights)) {
    d.cross_dimension_insights = d.cross_dimension_insights.map(ins => ({
      ...ins,
      insight:               toStr(ins.insight),
      strategic_implication: toStr(ins.strategic_implication),
    }));
  }

  // Synthesis: macro forces
  if (Array.isArray(d.macro_forces)) {
    d.macro_forces = d.macro_forces.map(f => ({
      ...f,
      name:        toStr(f.name),
      description: toStr(f.description),
    }));
  }

  // Synthesis: roadmap — ensure all 3 horizon arrays exist
  if (d.roadmap && typeof d.roadmap === 'object') {
    ['near', 'mid', 'long'].forEach(horizon => {
      if (!Array.isArray(d.roadmap[horizon])) d.roadmap[horizon] = [];
      d.roadmap[horizon] = d.roadmap[horizon].map(m => ({
        ...m,
        title:       toStr(m.title),
        trigger:     toStr(m.trigger),
        description: toStr(m.description),
        risks:       Array.isArray(m.risks)       ? m.risks.map(toStr).filter(Boolean)       : [],
        accelerants: Array.isArray(m.accelerants) ? m.accelerants.map(toStr).filter(Boolean) : [],
      })).filter(m => m.title); // drop empty placeholder entries
    });
  } else if (d.roadmap == null) {
    d.roadmap = { near: [], mid: [], long: [] };
  }

  return d;
}

/**
 * Fetch fresh sources from Tavily for a given query.
 * Returns [] silently on any failure so the orchestrator can degrade gracefully.
 */
async function fetchResearch(query, max_results = 4) {
  try {
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results, days: 180 }),
    });
    const data = await res.json().catch(() => ({}));
    return data.ok && Array.isArray(data.sources) ? data.sources : [];
  } catch {
    return [];
  }
}

/** Format an array of {title, url, snippet, published} into a compact prompt-injection block. */
function formatSourcesBlock(sources, label = 'RECENT SOURCES') {
  if (!sources || !sources.length) {
    return `${label}: NO LIVE SOURCES — use training-data evidence and flag staleness per RECENCY REQUIREMENT.`;
  }
  const items = sources.map((s, i) => {
    const date = s.published ? ` (${s.published.slice(0, 10)})` : '';
    const snip = (s.snippet || '').slice(0, 200);
    return `[${i + 1}] ${s.title}${date} — ${s.url}\n    ${snip}`;
  }).join('\n');
  return `${label} (last 6 mo, live). Ground driver.evidence in these; cite the URL inline. Defer to sources over priors.

${items}`;
}

/** Call the /api/analyze proxy and return parsed JSON. */
async function callAgent(systemPrompt, userMessage, model, onStatus, numPredict) {
  onStatus('researching');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userMessage, model, numPredict }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const e = new Error(err.error || `Agent responded ${res.status}`);
    e.errorType   = err.errorType   || null;
    e.waitSeconds = err.waitSeconds || null;
    e.modelUsed   = err.model       || null;
    throw e;
  }

  const raw = await readGroqStream(res);
  if (!raw.trim()) throw new Error('Model returned empty response');

  const parsed = normalizeAgentData(extractJSON(raw));
  onStatus('complete');
  return parsed;
}

/**
 * Classify the subject and extract its stock ticker if it is a publicly-traded company.
 * Returns { type: 'company' | 'trend', ticker: string | null }
 */
async function classifySubject(subject, model) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: `You are a financial classifier. Classify the input and return ONLY a valid JSON object — no prose, no markdown fences.
Schema: {"type":"company","ticker":"AAPL"} or {"type":"trend","ticker":null}
- type: "company" if the input is a specific named company, brand, or organization. "trend" if it is a technology trend, movement, industry phenomenon, or concept.
- ticker: The PRIMARY US stock exchange ticker symbol if the company is publicly traded (NYSE, NASDAQ, NYSE American). Examples: Apple → AAPL, Microsoft → MSFT, Google → GOOGL, Tesla → TSLA, Netflix → NFLX, Amazon → AMZN, Nvidia → NVDA, Meta → META, JPMorgan → JPM, Walmart → WMT, TSMC → TSM, Samsung → SSNLF.
- Set ticker to null if the company is private (e.g. SpaceX, Stripe, OpenAI, Anthropic), non-profit, a government entity, or if type is "trend".`,
        userMessage: `Classify: "${subject}"`,
        model,
        numPredict: 60,
      }),
    });
    const raw = await readGroqStream(res);
    // Try JSON parse first, then fallback to text heuristics
    try {
      const obj = extractJSON(raw);
      if (obj && (obj.type === 'company' || obj.type === 'trend')) {
        return { type: obj.type, ticker: obj.ticker || null };
      }
    } catch {}
    // Text fallback
    const text = raw.toLowerCase().trim();
    const type = text.includes('company') ? 'company' : 'trend';
    // Use the tickerMatch extracted from the raw text — filter common English words
    const tickerMatch = raw.match(/\b[A-Z]{2,5}\b/g);
    const COMMON = new Set(['AN','AS','AT','BE','BY','IF','IN','IS','IT','OF','ON','OR','TO','THE','AND','FOR','NOT','BUT','YES','NULL','TYPE','TREND','COMPANY','TICKER','SET','API','LLM','CEO','CTO','CFO','IPO','ETF','SP','US','EU']);
    const potentialTicker = tickerMatch?.find(t => !COMMON.has(t)) ?? null;
    return { type, ticker: potentialTicker };
  } catch {
    const corps = ['inc','corp','ltd','llc','apple','google','microsoft','amazon','meta','nvidia','tesla','anthropic','openai','samsung','boeing','walmart','jpmorgan','netflix','spotify','uber','airbnb','stripe','spacex'];
    const isCompany = corps.some(w => subject.toLowerCase().includes(w));
    return { type: isCompany ? 'company' : 'trend', ticker: null };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

function Spinner({ size = 16 }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

function Badge({ children, className = '' }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

function DirBadge({ direction }) {
  const cls = DIR_CLS[direction] || DIR_CLS.uncertain;
  return <Badge className={cls}>{direction}</Badge>;
}

function DimChip({ dim }) {
  const color = COLORS[dim] || '#94a3b8';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: color + '28', color, border: `1px solid ${color}55` }}
    >
      {dim}
    </span>
  );
}

function SectionHdr({ children }) {
  return <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{children}</h3>;
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR: GROQ STATUS + MODEL SELECTOR
// ═══════════════════════════════════════════════════════════════════

function GroqPanel({ state, dispatch }) {
  const { groqStatus, selectedModel } = state;

  return (
    <div className="px-4 py-4 border-b border-slate-800 space-y-3">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Groq</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${groqStatus === 'online' ? 'bg-green-400' : groqStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs ${groqStatus === 'online' ? 'text-green-400' : groqStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'}`}>
            {groqStatus === 'online' ? 'Connected' : groqStatus === 'checking' ? 'Checking…' : 'No API Key'}
          </span>
        </div>
      </div>

      {groqStatus === 'offline' && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-2">
          <p className="text-red-300 text-xs leading-relaxed">Set <code className="font-mono bg-red-900 px-1 rounded">GROQ_API_KEY</code> in your environment variables.</p>
        </div>
      )}

      {/* Model selector */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Model</label>
        <select
          value={selectedModel}
          onChange={e => dispatch({ type: 'SET_SELECTED_MODEL', payload: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-blue-500 transition-colors appearance-none"
        >
          {CATALOG.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <p className="text-slate-600 text-xs mt-1">
          {CATALOG.find(m => m.id === selectedModel)?.note || ''}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROGRESS PANEL
// ═══════════════════════════════════════════════════════════════════

function ProgressPanel({ agentStatuses, status }) {
  const rows = [
    { key: 'social',        label: 'Social',        color: COLORS.Social },
    { key: 'technological', label: 'Technological',  color: COLORS.Technological },
    { key: 'economic',      label: 'Economic',       color: COLORS.Economic },
    { key: 'environmental', label: 'Environmental',  color: COLORS.Environmental },
    { key: 'political',     label: 'Political',      color: COLORS.Political },
    { key: 'synthesis',     label: 'Synthesis',      color: '#e2e8f0' },
  ];
  const done = Object.values(agentStatuses).filter(s => s === 'complete').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-white">
          {status === 'synthesizing' ? 'Synthesizing…' : 'Analyzing…'}
        </span>
        <span className="text-xs text-slate-500">{done}/6</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full mb-4">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(done / 6) * 100}%`, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)' }}
        />
      </div>
      <div className="space-y-2">
        {rows.map(({ key, label, color }) => {
          const s = agentStatuses[key];
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="flex-1 text-slate-300">{label}</span>
              {s === 'idle'        && <span className="text-slate-600">Queued</span>}
              {s === 'researching' && <div className="flex items-center gap-1"><Spinner size={12} /><span className="text-blue-400">Running</span></div>}
              {s === 'complete'    && <span className="text-green-400">✓ Done</span>}
              {s === 'error'       && <span className="text-red-400">✗ Error</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1 — EXECUTIVE OVERVIEW
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ state }) {
  const { steepData, synthesis, subject, subjectType } = state;
  const [openEvidence, setOpenEvidence] = useState({});
  if (!synthesis) return null;
  const dims = [
    { key: 'social', label: 'Social' }, { key: 'technological', label: 'Technological' },
    { key: 'economic', label: 'Economic' }, { key: 'environmental', label: 'Environmental' },
    { key: 'political', label: 'Political' },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-white">{subject}</h2>
        <Badge className={subjectType === 'company' ? 'bg-purple-900 text-purple-300 border border-purple-700' : 'bg-sky-900 text-sky-300 border border-sky-700'}>
          {(subjectType || '').toUpperCase()}
        </Badge>
        <DirBadge direction={synthesis.overall_posture} />
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-4xl">{synthesis.posture_rationale}</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHdr>Executive Summary</SectionHdr>
        <p className="text-slate-200 leading-relaxed text-sm">{synthesis.executive_summary}</p>
      </div>

      <div>
        <SectionHdr>STEEP Dimension Assessments</SectionHdr>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dims.map(({ key, label }) => {
            const d = steepData[key];
            if (!d) return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[label] }} />
                  <span className="font-semibold text-white text-sm">{label}</span>
                  <Badge className="bg-red-900 text-red-400 border border-red-800">Error</Badge>
                </div>
                <p className="text-slate-600 text-xs">Data unavailable</p>
              </div>
            );
            return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-4" style={{ borderLeft: `3px solid ${COLORS[label]}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[label] }} />
                    <span className="font-semibold text-white text-sm">{label}</span>
                  </div>
                  <DirBadge direction={d.dominant_direction} />
                </div>
                <p className="text-slate-300 text-xs leading-relaxed mb-3">{d.summary}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(d.drivers || []).slice(0, 3).map((dr, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: COLORS[label] + '25', color: COLORS[label] }}>
                      {dr.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">✓ {(d.opportunities || []).length} opp</span>
                  <span className="text-red-400">⚠ {(d.risks || []).length} risk</span>
                  {d.dimension_confidence != null && (
                    <span className="text-slate-600 ml-auto">{Math.round(d.dimension_confidence * 100)}% conf</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(synthesis.cross_dimension_insights || []).length > 0 && (
        <div>
          <SectionHdr>Cross-Dimension Insights</SectionHdr>
          <div className="space-y-3">
            {synthesis.cross_dimension_insights.map((ins, i) => {
              const bc = ins.type === 'reinforcing' ? '#10B981' : ins.type === 'countervailing' ? '#EF4444' : '#F59E0B';
              return (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4" style={{ borderLeft: `3px solid ${bc}` }}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-wrap gap-1 flex-shrink-0 mt-0.5">
                      {(ins.dimensions_involved || []).map(d => <DimChip key={d} dim={d} />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm">{ins.insight}</p>
                      {ins.strategic_implication && <p className="text-slate-500 text-xs mt-1">→ {ins.strategic_implication}</p>}
                    </div>
                    <Badge className={ins.type === 'reinforcing' ? 'bg-green-900 text-green-300 border border-green-700' : ins.type === 'countervailing' ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-yellow-900 text-yellow-300 border border-yellow-700'}>
                      {ins.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <SectionHdr>Evidence by Dimension</SectionHdr>
        <div className="space-y-2">
          {dims.map(({ key, label }) => {
            const d = steepData[key];
            const isOpen = openEvidence[key];
            return (
              <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-750 transition-colors" onClick={() => setOpenEvidence(p => ({ ...p, [key]: !p[key] }))}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[label] }} />
                    <span className="font-semibold text-white">{label}</span>
                    {d ? <DirBadge direction={d.dominant_direction} /> : <Badge className="bg-red-900 text-red-400 border border-red-800">Unavailable</Badge>}
                    {d?.dimension_confidence && <span className="text-xs text-slate-600">{Math.round(d.dimension_confidence * 100)}% conf</span>}
                  </div>
                  <span className="text-slate-500">{isOpen ? '↑' : '↓'}</span>
                </button>

                {isOpen && d && (
                  <div className="border-t border-slate-700 px-5 py-4 space-y-5">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{d.summary}</p>
                    </div>

                    {(d.drivers || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Drivers & Evidence</p>
                        <div className="space-y-3">
                          {d.drivers.map((dr, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-white font-semibold text-sm">{dr.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                  <Badge className={IMPACT_CLS[dr.impact] || IMPACT_CLS.low}>{dr.impact}</Badge>
                                  <Badge className={dr.direction === 'positive' ? 'bg-green-900 text-green-300' : dr.direction === 'negative' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}>{dr.direction}</Badge>
                                  {dr.velocity && <Badge className="bg-slate-700 text-slate-400">{dr.velocity}</Badge>}
                                </div>
                              </div>
                              {dr.description && <p className="text-slate-400 text-xs leading-relaxed mb-2">{dr.description}</p>}
                              {(dr.evidence || []).map((ev, j) => <p key={j} className="text-slate-500 text-xs">• {ev}</p>)}
                              {dr.confidence != null && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-slate-600 w-16">Confidence</span>
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                                    <div className="h-1.5 rounded-full" style={{ width: `${dr.confidence * 100}%`, backgroundColor: dr.confidence > 0.7 ? '#10b981' : dr.confidence > 0.5 ? '#f59e0b' : '#ef4444' }} />
                                  </div>
                                  <span className="text-xs text-slate-600 w-8 text-right">{Math.round(dr.confidence * 100)}%</span>
                                </div>
                              )}
                              {dr.nonlinearity_flag && dr.nonlinearity_flag !== 'none' && (
                                <div className="mt-2"><Badge className="bg-purple-950 text-purple-300 border border-purple-800">⚡ {dr.nonlinearity_flag}</Badge></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(d.signals || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Forward Signals</p>
                        {d.signals.map((sig, i) => (
                          <div key={i} className="bg-slate-900 rounded-xl p-3 flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <p className="text-white text-sm">{sig.signal}</p>
                              {sig.why_it_matters && <p className="text-slate-500 text-xs mt-1">{sig.why_it_matters}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <div className="w-20 h-1.5 bg-slate-700 rounded-full">
                                <div className="h-1.5 rounded-full" style={{ width: `${(sig.confidence || 0) * 100}%`, backgroundColor: (sig.confidence || 0) > 0.7 ? '#10b981' : (sig.confidence || 0) > 0.5 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                              <span className="text-xs text-slate-600">{Math.round((sig.confidence || 0) * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(d.forecast || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dimension Forecast</p>
                        {d.forecast.map((fc, i) => (
                          <div key={i} className="bg-slate-900 rounded-xl p-3 mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-slate-700 text-slate-300 border border-slate-600">{fc.time_horizon}</Badge>
                              {fc.trigger && <span className="text-slate-500 text-xs">Trigger: {fc.trigger}</span>}
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">{fc.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[['Opportunities', d.opportunities, 'text-green-400', 'bg-green-500'], ['Risks', d.risks, 'text-red-400', 'bg-red-500']].map(([lbl, items, tc, dc]) => (
                        (items || []).length > 0 && (
                          <div key={lbl}>
                            <p className={`text-xs font-semibold ${tc} uppercase tracking-wider mb-2`}>{lbl}</p>
                            {items.slice(0, 5).map((item, i) => (
                              <div key={i} className="flex items-start gap-2 mb-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${dc} mt-1.5 flex-shrink-0`} />
                                <p className="text-slate-400 text-xs leading-relaxed">{item}</p>
                              </div>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 — 3D FORCE MAP
// ═══════════════════════════════════════════════════════════════════

function ForceMapTab({ state }) {
  const canvasRef      = useRef(null);
  const cleanupRef     = useRef(null);
  const nodesRef       = useRef([]);
  const [tooltip, setTooltip]       = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef  = useRef(true);

  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.steepData) return;

    const W = canvas.offsetWidth  || 800;
    const H = canvas.offsetHeight || 600;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f172a, 1);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 2, 22);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(10, 10, 10);
    scene.add(dl);

    // Starfield
    const starVerts = [];
    for (let i = 0; i < 600; i++) starVerts.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x334466, size: 0.15 })));

    const group = new THREE.Group();
    scene.add(group);

    const mkLabel = (text, color = '#ffffff') => {
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 64;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'rgba(15,23,42,0.88)';
      ctx.beginPath(); ctx.roundRect(4, 4, 248, 56, 8); ctx.fill();
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text.slice(0, 22), 128, 32);
      const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false });
      const sp  = new THREE.Sprite(mat);
      sp.scale.set(3.5, 0.88, 1);
      return sp;
    };

    const addLine = (p1, p2, hex, op = 0.3) => {
      const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      group.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: op })));
    };

    const nodes = [];

    // Center node
    const cM = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 24, 24),
      new THREE.MeshPhongMaterial({ color: 0xd1d5db, emissive: 0x334155, shininess: 100 })
    );
    group.add(cM);
    const cL = mkLabel(state.subject);
    cL.position.set(0, 1.6, 0);
    group.add(cL);
    nodes.push({ mesh: cM, label: state.subject, type: 'center', description: `${state.subjectType === 'company' ? 'Company' : 'Trend'}: ${state.subject}` });

    const dimPositions = [
      new THREE.Vector3(-5.5, 2.5,  1.5),
      new THREE.Vector3( 5.5, 2.5, -1.5),
      new THREE.Vector3( 0,  -5.5,  1.0),
      new THREE.Vector3(-4,  -2.0,  5.0),
      new THREE.Vector3( 4,  -2.0, -5.0),
    ];
    const dimKeys = ['Social', 'Technological', 'Economic', 'Environmental', 'Political'];
    const dimPosMap = {};

    dimKeys.forEach((dim, di) => {
      const dimData = state.steepData[dim.toLowerCase()];
      const pos     = dimPositions[di];
      dimPosMap[dim] = pos;
      const hex     = parseInt(COLORS[dim].replace('#', ''), 16);
      const tc      = new THREE.Color(hex);

      const dM = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshPhongMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.2, shininess: 70 })
      );
      dM.position.copy(pos);
      group.add(dM);
      const dL = mkLabel(dim, COLORS[dim]);
      dL.position.copy(pos).add(new THREE.Vector3(0, 1.25, 0));
      group.add(dL);
      nodes.push({ mesh: dM, label: dim, type: 'dimension', dimension: dim, description: dimData?.summary || `${dim} dimension` });
      addLine(new THREE.Vector3(0, 0, 0), pos, hex, 0.3);

      (dimData?.drivers || []).slice(0, 3).forEach((driver, dri) => {
        const angle    = (dri / 3) * Math.PI * 2 + di * 1.1;
        const driverPos = new THREE.Vector3(pos.x + Math.cos(angle) * 1.8, pos.y + Math.sin(angle) * 1.6, pos.z + (dri - 1) * 1.4);
        const r        = driver.impact === 'high' ? 0.38 : driver.impact === 'medium' ? 0.27 : 0.18;
        const dc       = driver.direction === 'positive' ? 0x10b981 : driver.direction === 'negative' ? 0xef4444 : 0xf59e0b;
        const drM      = new THREE.Mesh(
          new THREE.SphereGeometry(r, 10, 10),
          new THREE.MeshPhongMaterial({ color: dc, emissive: dc, emissiveIntensity: 0.15 })
        );
        drM.position.copy(driverPos);
        group.add(drM);
        nodes.push({ mesh: drM, label: driver.name, type: 'driver', dimension: dim, description: driver.description || driver.name, evidence: driver.evidence, impact: driver.impact, velocity: driver.velocity, direction: driver.direction, confidence: driver.confidence });
        addLine(pos, driverPos, hex, 0.18);
      });
    });

    // ── Cross-dimension insight arcs ──────────────────────────────────
    const INSIGHT_COLORS = { reinforcing: 0x10b981, countervailing: 0xef4444, emerging: 0x8b5cf6 };
    const INSIGHT_HEX    = { reinforcing: '#10b981', countervailing: '#ef4444', emerging: '#8b5cf6' };

    (state.synthesis?.cross_dimension_insights || []).forEach((insight) => {
      const dims = (insight.dimensions_involved || []).filter(d => dimPosMap[d]);
      if (dims.length < 2) return;

      const typeKey = (insight.type || 'emerging').toLowerCase().replace(/[^a-z]/g, '');
      const arcHex  = INSIGHT_COLORS[typeKey] ?? INSIGHT_COLORS.emerging;

      // Draw an arc between every pair of involved dimensions
      for (let a = 0; a < dims.length - 1; a++) {
        for (let b = a + 1; b < dims.length; b++) {
          const p1  = dimPosMap[dims[a]].clone();
          const p2  = dimPosMap[dims[b]].clone();
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          // Push control point outward from the scene centre to create a visible arc
          const ctrl = mid.clone().add(mid.clone().normalize().multiplyScalar(4.5));
          const curve = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
          const pts   = curve.getPoints(40);
          const geom  = new THREE.BufferGeometry().setFromPoints(pts);
          const mat   = new THREE.LineDashedMaterial({ color: arcHex, dashSize: 0.45, gapSize: 0.28, transparent: true, opacity: 0.7 });
          const line  = new THREE.Line(geom, mat);
          line.computeLineDistances();
          group.add(line);

          // Visible glow bead at arc midpoint — clickable indicator
          const midPt  = curve.getPoint(0.5);
          const bead   = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 12, 12),
            new THREE.MeshPhongMaterial({ color: arcHex, emissive: arcHex, emissiveIntensity: 0.7, shininess: 120 })
          );
          bead.position.copy(midPt);
          group.add(bead);

          nodes.push({
            mesh:                 bead,
            label:                insight.insight?.slice(0, 50) || 'Cross-dimension Insight',
            type:                 'insight',
            insightType:          typeKey,
            insightHex:           INSIGHT_HEX[typeKey] ?? INSIGHT_HEX.emerging,
            insight:              insight.insight,
            strategic_implication: insight.strategic_implication,
            dimensions_involved:  insight.dimensions_involved,
          });
        }
      }
    });

    nodesRef.current = nodes;

    const raycaster = new THREE.Raycaster();
    const mouse     = { down: false, lastX: 0, lastY: 0 };

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!mouse.down && autoRotateRef.current) group.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    const onDown = e => { mouse.down = true; mouse.lastX = e.clientX; mouse.lastY = e.clientY; };
    const onMove = e => {
      if (!mouse.down) return;
      group.rotation.y += (e.clientX - mouse.lastX) * 0.009;
      group.rotation.x += (e.clientY - mouse.lastY) * 0.009;
      mouse.lastX = e.clientX; mouse.lastY = e.clientY;
    };
    const onUp    = () => { mouse.down = false; };
    const onWheel = e => { camera.position.z = Math.max(8, Math.min(35, camera.position.z + e.deltaY * 0.04)); };
    const onClick = e => {
      const rect = canvas.getBoundingClientRect();
      const m2   = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(m2, camera);
      const hits = raycaster.intersectObjects(nodesRef.current.map(n => n.mesh));
      if (hits.length) {
        const nd = nodesRef.current.find(n => n.mesh === hits[0].object);
        setTooltip(t => (t?.mesh === nd?.mesh ? null : nd));
      } else setTooltip(null);
    };
    const onResize = () => {
      const W2 = canvas.offsetWidth, H2 = canvas.offsetHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    canvas.addEventListener('wheel',     onWheel, { passive: true });
    canvas.addEventListener('click',     onClick);
    window.addEventListener('resize',    onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('click',      onClick);
      window.removeEventListener('resize',     onResize);
      renderer.dispose();
    };

    return cleanupRef.current;
  }, [state.steepData, state.subject, state.subjectType]);

  return (
    <div className="flex gap-0" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>
      {/* 3-D canvas */}
      <div className="relative flex-1 min-w-0">
        <canvas ref={canvasRef} className="w-full h-full rounded-xl" />

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-slate-950 bg-opacity-90 border border-slate-700 rounded-xl p-3 text-xs space-y-1">
          <p className="text-slate-500 font-semibold uppercase tracking-wider mb-2">Dimensions</p>
          {Object.entries(COLORS).map(([d, c]) => (
            <div key={d} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
              <span className="text-slate-300">{d}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            <p className="text-slate-500 font-semibold uppercase tracking-wider">Drivers</p>
            {[['#10b981','Positive'],['#ef4444','Negative'],['#f59e0b','Mixed']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                <span className="text-slate-400">{l}</span>
              </div>
            ))}
            <p className="text-slate-600 mt-1">Node size = impact</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            <p className="text-slate-500 font-semibold uppercase tracking-wider">Cross-dim Arcs</p>
            {[['#10b981','Reinforcing'],['#ef4444','Countervailing'],['#8b5cf6','Emerging']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-4 h-px flex-shrink-0" style={{ background: `repeating-linear-gradient(90deg,${c} 0px,${c} 4px,transparent 4px,transparent 7px)` }} />
                <span className="text-slate-400">{l}</span>
              </div>
            ))}
            <p className="text-slate-600 mt-1">Click bead for insight</p>
          </div>
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="bg-slate-950 bg-opacity-80 border border-slate-700 rounded-lg px-3 py-1.5">
            <p className="text-slate-600 text-xs">Drag to rotate · Scroll to zoom · Click nodes</p>
          </div>
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${autoRotate ? 'bg-blue-900 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
          >
            {autoRotate ? '⏸ Auto-Rotate' : '▶ Auto-Rotate'}
          </button>
        </div>
      </div>

      {/* Right side panel — shown when a node is selected */}
      <div
        className="flex-shrink-0 overflow-y-auto transition-all duration-300 bg-slate-950 border-l border-slate-800"
        style={{ width: tooltip ? 280 : 0, opacity: tooltip ? 1 : 0, pointerEvents: tooltip ? 'auto' : 'none' }}
      >
        {tooltip && (
          <div className="p-4 space-y-4 text-xs fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                {tooltip.type === 'insight' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: tooltip.insightHex + '22', color: tooltip.insightHex, border: `1px solid ${tooltip.insightHex}44` }}>
                    {tooltip.insightType || 'insight'}
                  </span>
                ) : (
                  <>
                    {tooltip.dimension && <DimChip dim={tooltip.dimension} />}
                    {tooltip.type === 'driver' && (
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tooltip.direction === 'positive' ? 'bg-emerald-900 text-emerald-300' : tooltip.direction === 'negative' ? 'bg-red-900 text-red-300' : 'bg-amber-900 text-amber-300'}`}>
                        {tooltip.direction}
                      </span>
                    )}
                  </>
                )}
                <p className="text-white font-bold text-sm leading-snug">{tooltip.label}</p>
                <p className="text-slate-500 capitalize">{tooltip.type === 'insight' ? 'Cross-dimension insight' : tooltip.type}</p>
              </div>
              <button onClick={() => setTooltip(null)} className="text-slate-600 hover:text-white text-base ml-2 mt-1">✕</button>
            </div>

            {/* Insight: dimensions involved */}
            {tooltip.type === 'insight' && tooltip.dimensions_involved?.length > 0 && (
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Dimensions</p>
                <div className="flex flex-wrap gap-1.5">
                  {tooltip.dimensions_involved.map(d => <DimChip key={d} dim={d} />)}
                </div>
              </div>
            )}

            {/* Insight: insight text */}
            {tooltip.type === 'insight' && tooltip.insight && (
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Insight</p>
                <p className="text-slate-300 leading-relaxed">{tooltip.insight}</p>
              </div>
            )}

            {/* Insight: strategic implication */}
            {tooltip.type === 'insight' && tooltip.strategic_implication && (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Strategic implication</p>
                <p className="text-slate-300 leading-relaxed">{tooltip.strategic_implication}</p>
              </div>
            )}

            {/* Impact / Velocity chips */}
            {tooltip.type === 'driver' && (
              <div className="flex flex-wrap gap-1.5">
                {tooltip.impact && (
                  <span className={`px-2 py-0.5 rounded font-semibold ${tooltip.impact === 'high' ? 'bg-red-900 text-red-300' : tooltip.impact === 'medium' ? 'bg-amber-900 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>
                    {tooltip.impact} impact
                  </span>
                )}
                {tooltip.velocity && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                    {tooltip.velocity} velocity
                  </span>
                )}
              </div>
            )}

            {/* Confidence bar */}
            {tooltip.confidence != null && (
              <div>
                <div className="flex justify-between mb-1 text-slate-500">
                  <span>Confidence</span>
                  <span className="text-slate-300">{Math.round((tooltip.confidence || 0) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((tooltip.confidence || 0) * 100)}%`, backgroundColor: COLORS[tooltip.dimension] || '#94a3b8' }} />
                </div>
              </div>
            )}

            {/* Description (driver / dimension) */}
            {tooltip.type !== 'insight' && tooltip.description && (
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-slate-300 leading-relaxed">{tooltip.description}</p>
              </div>
            )}

            {/* Evidence */}
            {tooltip.evidence?.length > 0 && (
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Evidence</p>
                <ul className="space-y-1.5">
                  {tooltip.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2 text-slate-300 leading-relaxed">
                      <span className="text-slate-600 flex-shrink-0 mt-0.5">•</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dimension summary (for dimension nodes) */}
            {tooltip.type === 'dimension' && tooltip.description && (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-400 leading-relaxed italic">&ldquo;{tooltip.description}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3 — FORECAST ROADMAP
// ═══════════════════════════════════════════════════════════════════

function RoadmapTab({ state, dispatch }) {
  const { synthesis, roadmapFilter } = state;
  const [viewMode, setViewMode] = useState('cards');
  const [expanded, setExpanded] = useState({});
  if (!synthesis) return null;
  const totalMilestones = ['near','mid','long'].reduce((s, k) => s + (synthesis.roadmap?.[k]?.length || 0), 0);
  if (!synthesis.roadmap || totalMilestones === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center fade-in">
      <p className="text-slate-500 text-sm">No roadmap data was generated.</p>
      <p className="text-slate-600 text-xs mt-1">The synthesis agent may have run out of tokens. Try running the analysis again.</p>
    </div>
  );

  const horizons = [
    { key: 'near', label: 'Near Term',   sub: '0–12 months', color: '#3B82F6' },
    { key: 'mid',  label: 'Medium Term', sub: '1–3 years',   color: '#8B5CF6' },
    { key: 'long', label: 'Long Term',   sub: '3–7 years',   color: '#F97316' },
  ];
  const dims = Object.keys(COLORS);

  const icon = (type) => {
    if (!type) return '◆';
    const t = type.toLowerCase();
    if (t.includes('polic') || t.includes('election') || t.includes('legislat')) return '⚖️';
    if (t.includes('tech') || t.includes('product') || t.includes('bench'))     return '⚡';
    if (t.includes('market') || t.includes('demand') || t.includes('capital'))  return '📈';
    if (t.includes('consumer') || t.includes('social') || t.includes('behav'))  return '👥';
    if (t.includes('regul') || t.includes('compliance'))                         return '📋';
    if (t.includes('climate') || t.includes('environ'))                          return '🌿';
    return '◆';
  };

  const filtered = ms => roadmapFilter.length ? ms.filter(m => roadmapFilter.includes(m.dimension)) : ms;
  const clearAll = () => dims.forEach(d => { if (roadmapFilter.includes(d)) dispatch({ type: 'TOGGLE_ROADMAP_FILTER', payload: d }); });
  const toggleExpanded = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const horizonInsight = (key) => {
    const ms = filtered(synthesis.roadmap[key] || []);
    const activeDims = new Set(ms.map(m => m.dimension));
    return (synthesis.cross_dimension_insights || []).find(ins =>
      (ins.dimensions_involved || []).some(d => activeDims.has(d))
    );
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-slate-800 border border-slate-700 rounded-lg overflow-hidden mr-2">
          {[['cards', '▦ Cards'], ['timeline', '↕ Timeline']].map(([v, l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === v ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">Filter:</span>
        <button onClick={clearAll} className={`px-3 py-1 rounded-lg text-xs transition-colors ${!roadmapFilter.length ? 'bg-slate-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'}`}>All</button>
        {dims.map(d => (
          <button key={d} className="px-3 py-1 rounded-lg text-xs border transition-all"
            style={{ backgroundColor: roadmapFilter.includes(d) ? COLORS[d] + '28' : 'transparent', borderColor: roadmapFilter.includes(d) ? COLORS[d] + '88' : '#334155', color: roadmapFilter.includes(d) ? COLORS[d] : '#94a3b8' }}
            onClick={() => dispatch({ type: 'TOGGLE_ROADMAP_FILTER', payload: d })}
          >{d.slice(0, 4)}</button>
        ))}
      </div>

      {horizons.map(({ key, label, sub, color }) => {
        const ms = filtered(synthesis.roadmap[key] || []);
        const insight = horizonInsight(key);
        return (
          <div key={key} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="font-bold text-white">{label}</span>
              <span className="text-slate-500 text-xs">{sub}</span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">{ms.length} milestone{ms.length !== 1 ? 's' : ''}</span>
            </div>

            {insight && (
              <div className="mx-4 mt-3 mb-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex gap-3 items-start">
                <span className="text-blue-400 flex-shrink-0 text-sm mt-0.5">⟳</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cross-Dim Context</span>
                    {(insight.dimensions_involved || []).map(d => <DimChip key={d} dim={d} />)}
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${insight.type === 'reinforcing' ? 'bg-emerald-900 text-emerald-300' : insight.type === 'countervailing' ? 'bg-red-900 text-red-300' : 'bg-amber-900 text-amber-300'}`}>{insight.type}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{insight.insight}</p>
                  {insight.strategic_implication && <p className="text-slate-500 text-xs mt-1 italic">→ {insight.strategic_implication}</p>}
                </div>
              </div>
            )}

            {ms.length === 0 ? (
              <p className="text-slate-600 text-sm px-5 py-4">No milestones match current filter.</p>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {ms.map((m, i) => {
                  const uid = m.id || `${key}-${i}`;
                  const isOpen = expanded[uid];
                  const hasDetail = m.description || m.risks?.length || m.accelerants?.length;
                  return (
                    <div key={uid} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition-colors">
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <DimChip dim={m.dimension} />
                          <Badge className={m.direction === 'positive' ? 'bg-green-900 text-green-300 border border-green-800' : m.direction === 'negative' ? 'bg-red-900 text-red-300 border border-red-800' : 'bg-yellow-900 text-yellow-300 border border-yellow-800'}>
                            {m.direction}
                          </Badge>
                        </div>
                        <p className="text-white text-sm font-semibold leading-tight mb-2">{m.title}</p>
                        {m.trigger && (
                          <div className="flex gap-1.5 items-start mb-1.5">
                            <span className="text-blue-400 text-xs flex-shrink-0 mt-0.5">⚡</span>
                            <p className="text-slate-400 text-xs leading-snug"><span className="text-slate-500 font-medium">Trigger: </span>{m.trigger}</p>
                          </div>
                        )}
                        {m.confidence != null && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                              <span>Confidence</span><span>{Math.round(m.confidence * 100)}%</span>
                            </div>
                            <div className="h-1 bg-slate-700 rounded-full">
                              <div className="h-1 rounded-full" style={{ width: `${m.confidence * 100}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        )}
                        {hasDetail && (
                          <button onClick={() => toggleExpanded(uid)} className="mt-2 text-xs text-slate-500 hover:text-blue-400 transition-colors">
                            {isOpen ? '▲ Collapse' : '▼ Risks & Accelerants'}
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <div className="border-t border-slate-700 bg-slate-900 divide-y divide-slate-800">
                          {m.description && (
                            <div className="px-3 py-2.5">
                              <p className="text-slate-300 text-xs leading-relaxed">{m.description}</p>
                            </div>
                          )}
                          {m.risks?.length > 0 && (
                            <div className="px-3 py-2.5">
                              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1.5">⚠ Risks</p>
                              <ul className="space-y-1">
                                {m.risks.map((r, ri) => (
                                  <li key={ri} className="flex gap-1.5 items-start">
                                    <span className="text-red-600 text-xs flex-shrink-0 mt-0.5">•</span>
                                    <span className="text-slate-400 text-xs leading-snug">{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {m.accelerants?.length > 0 && (
                            <div className="px-3 py-2.5">
                              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">▲ Accelerants</p>
                              <ul className="space-y-1">
                                {m.accelerants.map((a, ai) => (
                                  <li key={ai} className="flex gap-1.5 items-start">
                                    <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5">•</span>
                                    <span className="text-slate-400 text-xs leading-snug">{a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-4 space-y-0 relative">
                <div className="absolute" style={{ left: 28, top: 16, bottom: 16, width: 1, backgroundColor: '#334155' }} />
                {ms.map((m, i) => {
                  const uid = m.id || `${key}-${i}`;
                  const isOpen = expanded[uid];
                  const hasDetail = m.description || m.risks?.length || m.accelerants?.length;
                  return (
                    <div key={uid} className="flex gap-4 pb-4 relative">
                      <div className="flex-shrink-0 z-10" style={{ width: 20, paddingTop: 6 }}>
                        <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: color + '22', borderColor: color }}>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition-colors">
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <DimChip dim={m.dimension} />
                              <Badge className={m.direction === 'positive' ? 'bg-green-900 text-green-300 border border-green-800' : m.direction === 'negative' ? 'bg-red-900 text-red-300 border border-red-800' : 'bg-yellow-900 text-yellow-300 border border-yellow-800'}>{m.direction}</Badge>
                            </div>
                            {hasDetail && <button onClick={() => toggleExpanded(uid)} className="text-slate-600 hover:text-slate-300 text-xs ml-2">{isOpen ? '▲' : '▼'}</button>}
                          </div>
                          <p className="text-white text-sm font-semibold leading-tight">{m.title}</p>
                          {m.trigger && (
                            <p className="text-slate-500 text-xs mt-1 flex gap-1.5">
                              <span className="text-blue-400 flex-shrink-0">⚡</span>
                              <span><span className="text-slate-600">Trigger: </span>{m.trigger}</span>
                            </p>
                          )}
                          {m.confidence != null && (
                            <div className="mt-1.5 h-1 bg-slate-700 rounded-full">
                              <div className="h-1 rounded-full" style={{ width: `${m.confidence * 100}%`, backgroundColor: color }} />
                            </div>
                          )}
                        </div>
                        {isOpen && (
                          <div className="border-t border-slate-700 bg-slate-900 divide-y divide-slate-800">
                            {m.description && (
                              <div className="px-3 py-2.5">
                                <p className="text-slate-300 text-xs leading-relaxed">{m.description}</p>
                              </div>
                            )}
                            {m.risks?.length > 0 && (
                              <div className="px-3 py-2.5">
                                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">⚠ Risks</p>
                                <ul className="space-y-0.5">
                                  {m.risks.map((r, ri) => <li key={ri} className="text-slate-400 text-xs">• {r}</li>)}
                                </ul>
                              </div>
                            )}
                            {m.accelerants?.length > 0 && (
                              <div className="px-3 py-2.5">
                                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">▲ Accelerants</p>
                                <ul className="space-y-0.5">
                                  {m.accelerants.map((a, ai) => <li key={ai} className="text-slate-400 text-xs">• {a}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════
// INVESTMENT THESIS TAB
// ═══════════════════════════════════════════════════════════════════

function fmtNum(v, opts = {}) {
  if (v == null) return 'N/A';
  const { prefix = '', suffix = '', decimals = 2, pct = false } = opts;
  const n = pct ? v * 100 : v;
  return `${prefix}${n.toFixed(decimals)}${pct ? '%' : suffix}`;
}

function fmtBn(v) {
  if (v == null) return 'N/A';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

function fmtUsd(v) {
  if (v == null) return 'N/A';
  return `$${v.toFixed(2)}`;
}

function MetricRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-xs font-semibold tabular-nums ${highlight ? highlight : 'text-white'}`}>{value}</span>
    </div>
  );
}

function MetricCard({ title, icon, children }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

const STANCE_CLS = {
  bullish: 'bg-emerald-900 text-emerald-300 border border-emerald-700',
  neutral: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
  bearish: 'bg-red-900 text-red-300 border border-red-700',
};

const STANCE_ICON = { bullish: '▲', neutral: '◈', bearish: '▼' };

function TechnicalSetupCard({ fund }) {
  const {
    current_price: cp, ma50, ma200, week52_high: hi, week52_low: lo,
    tech_trend_short, tech_trend_mid, tech_trend_long,
    tech_support, tech_resistance, tech_stop_loss,
    valuation_signal, valuation_description, valuation_relative,
  } = fund;

  const RangeBar = ({ label, value, lo: rangeL, hi: rangeH }) => {
    if (value == null || rangeL == null || rangeH == null) return null;
    const pct = Math.max(0, Math.min(100, ((value - rangeL) / (rangeH - rangeL)) * 100));
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span className="text-white font-semibold">{fmtUsd(value)}</span>
        </div>
        <div className="relative h-1.5 bg-slate-700 rounded-full">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-900 shadow" style={{ left: `calc(${pct}% - 5px)` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-0.5">
          <span>{fmtUsd(rangeL)}</span>
          <span>{fmtUsd(rangeH)}</span>
        </div>
      </div>
    );
  };

  const maRow = (label, ma) => {
    if (cp == null || ma == null) return null;
    const diff = ((cp - ma) / ma * 100);
    const pos = diff >= 0;
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
        <span className="text-slate-400 text-xs">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs tabular-nums">{fmtUsd(ma)}</span>
          <span className={`text-xs font-semibold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
            {pos ? '+' : ''}{diff.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const trendIcon = (dir) => dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
  const trendCls  = (dir) => dir === 'up' ? 'text-emerald-400' : dir === 'down' ? 'text-red-400' : 'text-slate-500';

  const hasTrends = tech_trend_short || tech_trend_mid || tech_trend_long;
  const hasSR     = tech_support != null || tech_resistance != null;

  const valSignalCls = valuation_signal?.toLowerCase().includes('under')
    ? 'text-emerald-400'
    : valuation_signal?.toLowerCase().includes('over')
      ? 'text-red-400'
      : 'text-yellow-400';

  return (
    <MetricCard title="Technical Setup" icon="📈">
      <RangeBar label="52-Week Range" value={cp} lo={lo} hi={hi} />
      {maRow('vs 50-Day MA', ma50)}
      {maRow('vs 200-Day MA', ma200)}

      {hasSR && (
        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
          {tech_support    != null && <div className="flex justify-between text-xs"><span className="text-slate-500">Support</span><span className="text-emerald-400 font-semibold tabular-nums">{fmtUsd(tech_support)}</span></div>}
          {tech_resistance != null && <div className="flex justify-between text-xs"><span className="text-slate-500">Resistance</span><span className="text-red-400 font-semibold tabular-nums">{fmtUsd(tech_resistance)}</span></div>}
          {tech_stop_loss  != null && <div className="flex justify-between text-xs"><span className="text-slate-500">Stop-Loss</span><span className="text-slate-400 tabular-nums">{fmtUsd(tech_stop_loss)}</span></div>}
        </div>
      )}

      {hasTrends && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-600 mb-1">Trend (Trading Central)</p>
          <div className="flex gap-3">
            {[['S', tech_trend_short], ['M', tech_trend_mid], ['L', tech_trend_long]].map(([lbl, dir]) => (
              <div key={lbl} className="flex flex-col items-center gap-0.5">
                <span className={`text-sm font-bold ${trendCls(dir)}`}>{trendIcon(dir)}</span>
                <span className="text-slate-600 text-xs">{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {valuation_signal && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs">Valuation Signal</span>
            <span className={`text-xs font-semibold ${valSignalCls}`}>
              {valuation_signal}
              {valuation_description ? ` · ${valuation_description}` : ''}
            </span>
          </div>
        </div>
      )}
    </MetricCard>
  );
}

function AnalystConsensusCard({ fund }) {
  const { buy_count: buys, hold_count: holds, sell_count: sells, analyst_target_mean, analyst_target_high, analyst_target_low, analyst_count, analyst_rating, current_price: cp, upside_pct } = fund;
  const total = (buys || 0) + (holds || 0) + (sells || 0);

  const RatingBar = ({ label, count, color }) => {
    if (count == null || total === 0) return null;
    const w = (count / total * 100).toFixed(0);
    return (
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-slate-400 text-xs w-10 text-right">{label}</span>
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-2 rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
        </div>
        <span className="text-slate-400 text-xs w-4">{count}</span>
      </div>
    );
  };

  const ratingColor = analyst_rating?.toLowerCase().includes('buy') ? 'text-emerald-400' :
    analyst_rating?.toLowerCase().includes('hold') ? 'text-yellow-400' : 'text-red-400';

  return (
    <MetricCard title="Analyst Consensus" icon="👥">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className={`text-lg font-bold ${ratingColor}`}>{analyst_rating || 'N/A'}</span>
          <span className="text-slate-500 text-xs ml-2">{analyst_count ? `${analyst_count} analysts` : ''}</span>
        </div>
        {upside_pct != null && (
          <div className={`text-sm font-bold ${upside_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {upside_pct >= 0 ? '▲' : '▼'} {Math.abs(upside_pct * 100).toFixed(1)}% upside
          </div>
        )}
      </div>
      <RatingBar label="Buy"  count={buys}  color="#10b981" />
      <RatingBar label="Hold" count={holds} color="#f59e0b" />
      <RatingBar label="Sell" count={sells} color="#ef4444" />
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Low</span><span className="text-slate-300 font-semibold">Consensus Target</span><span>High</span>
        </div>
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-400">{fmtUsd(analyst_target_low)}</span>
          <span className="text-white text-sm">{fmtUsd(analyst_target_mean)}</span>
          <span className="text-slate-400">{fmtUsd(analyst_target_high)}</span>
        </div>
      </div>
    </MetricCard>
  );
}

function InvestmentThesisTab({ state }) {
  const { fundamentals: fund, investmentThesis: thesis, thesisStatus, ticker, subject } = state;

  if (thesisStatus === 'loading' || (!fund && thesisStatus !== 'error')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Spinner size={32} />
          <p className="text-slate-400 text-sm mt-4">Fetching market data &amp; building thesis…</p>
          <p className="text-slate-600 text-xs mt-1">{ticker}</p>
        </div>
      </div>
    );
  }

  if (thesisStatus === 'error' || !fund) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-semibold">Couldn't build investment thesis</p>
          <p className="text-slate-500 text-xs mt-2">Data may be unavailable for this ticker, or a rate limit was hit. The STEEP analysis above is still complete.</p>
        </div>
      </div>
    );
  }

  const stance = thesis?.stance || 'neutral';
  const stanceCls = STANCE_CLS[stance] || STANCE_CLS.neutral;
  const stanceIcon = STANCE_ICON[stance] || '◈';

  const priceDayChange = fund.price_change_pct;
  const priceChangeColor = priceDayChange >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Company header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-white">{fund.company_name}</h1>
            <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm font-mono font-bold">{fund.ticker}</span>
            <span className="text-slate-500 text-sm">{fund.exchange}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-3xl font-black text-white tabular-nums">{fmtUsd(fund.current_price)}</span>
            {priceDayChange != null && (
              <span className={`text-sm font-semibold ${priceChangeColor}`}>
                {priceDayChange >= 0 ? '+' : ''}{(priceDayChange * 100).toFixed(2)}% today
              </span>
            )}
          </div>
        </div>
        {thesis && (
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide ${stanceCls}`}>
              {stanceIcon} {stance}
            </span>
            {thesis.confidence != null && (
              <span className="text-slate-500 text-xs">Confidence: {(thesis.confidence * 100).toFixed(0)}%</span>
            )}
          </div>
        )}
      </div>

      {/* AI Thesis — full width */}
      {thesis && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span>◈</span>Investment Thesis
          </h3>
          <p className="text-slate-200 text-sm leading-relaxed mb-4">{thesis.thesis}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">▲ Bull Case</p>
              <ul className="space-y-2">
                {(thesis.bull_case || []).map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                    <span className="text-slate-300 text-xs leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">▼ Bear Case</p>
              <ul className="space-y-2">
                {(thesis.bear_case || []).map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-red-600 text-xs flex-shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                    <span className="text-slate-300 text-xs leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {thesis.valuation_assessment && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valuation Assessment</p>
              <p className="text-slate-300 text-xs leading-relaxed">{thesis.valuation_assessment}</p>
            </div>
          )}
          {(thesis.key_catalysts?.length > 0 || thesis.entry_strategy) && (
            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              {thesis.key_catalysts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1.5">⚡ Key Catalysts</p>
                  <ul className="space-y-1">
                    {thesis.key_catalysts.map((c, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-blue-600 text-xs flex-shrink-0">•</span>
                        <span className="text-slate-300 text-xs leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {thesis.entry_strategy && (
                <div>
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1.5">⏱ Entry Strategy</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{thesis.entry_strategy}</p>
                  {thesis.time_horizon && (
                    <p className="text-slate-500 text-xs mt-1">Time horizon: {thesis.time_horizon}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valuation */}
        <MetricCard title="Valuation" icon="⚖️">
          <MetricRow label="P/E (TTM)"      value={fund.pe_ratio      != null ? `${fund.pe_ratio.toFixed(1)}×`       : 'N/A'} />
          <MetricRow label="Forward P/E"    value={fund.forward_pe    != null ? `${fund.forward_pe.toFixed(1)}×`     : 'N/A'} />
          <MetricRow label="Price / Book"   value={fund.price_to_book != null ? `${fund.price_to_book.toFixed(1)}×`  : 'N/A'} />
          <MetricRow label="Price / Sales"  value={fund.price_to_sales != null ? `${fund.price_to_sales.toFixed(1)}×` : 'N/A'} />
          <MetricRow label="EV / EBITDA"    value={fund.ev_to_ebitda  != null ? `${fund.ev_to_ebitda.toFixed(1)}×`  : 'N/A'} />
          <MetricRow label="Market Cap"     value={fmtBn(fund.market_cap)} />
          <MetricRow label="EPS (TTM)"      value={fund.eps           != null ? `$${fund.eps.toFixed(2)}`            : 'N/A'} />
        </MetricCard>

        {/* Financial quality */}
        <MetricCard title="Financial Quality" icon="📊">
          <MetricRow label="Revenue (TTM)"   value={fmtBn(fund.revenue)} />
          <MetricRow label="Revenue Growth"  value={fund.revenue_growth != null ? `${(fund.revenue_growth * 100).toFixed(1)}%` : 'N/A'}
            highlight={fund.revenue_growth > 0.1 ? 'text-emerald-400' : fund.revenue_growth < 0 ? 'text-red-400' : 'text-white'} />
          <MetricRow label="Gross Margin"    value={fund.gross_margin  != null ? `${(fund.gross_margin * 100).toFixed(1)}%` : 'N/A'} />
          <MetricRow label="Net Margin"      value={fund.profit_margin != null ? `${(fund.profit_margin * 100).toFixed(1)}%` : 'N/A'}
            highlight={fund.profit_margin > 0.15 ? 'text-emerald-400' : fund.profit_margin < 0 ? 'text-red-400' : 'text-white'} />
          <MetricRow label="ROE"             value={fund.return_on_equity != null ? `${(fund.return_on_equity * 100).toFixed(1)}%` : 'N/A'} />
          <MetricRow label="Free Cash Flow"  value={fmtBn(fund.free_cashflow)} />
          <MetricRow label="Debt / Equity"   value={fund.debt_to_equity != null ? fund.debt_to_equity.toFixed(2) : 'N/A'}
            highlight={fund.debt_to_equity > 2 ? 'text-red-400' : fund.debt_to_equity < 0.5 ? 'text-emerald-400' : 'text-white'} />
        </MetricCard>

        {/* Technical setup */}
        <TechnicalSetupCard fund={fund} />

        {/* Analyst consensus */}
        <AnalystConsensusCard fund={fund} />
      </div>

      <p className="text-slate-700 text-xs text-center pb-2">
        Data from Yahoo Finance · Not financial advice · For research purposes only
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { subject, status, agentStatuses, steepData, synthesis, activeTab, selectedModel, groqStatus, availableModels,
          ticker, fundamentals, investmentThesis, thesisStatus } = state;

  const isRunning  = ['classifying', 'researching', 'synthesizing'].includes(status);
  const isComplete = status === 'complete';

  // ── On mount: check Ollama health and list models ──
  useEffect(() => {
    (async () => {
      try {
        const hRes  = await fetch('/api/health');
        const hData = await hRes.json();
        dispatch({ type: 'SET_GROQ_STATUS', status: hData.ok ? 'online' : 'offline' });

        const mRes  = await fetch('/api/models');
        const mData = await mRes.json();
        dispatch({ type: 'SET_MODELS', payload: mData.models || [] });
      } catch {
        dispatch({ type: 'SET_GROQ_STATUS', status: 'offline' });
      }
    })();
  }, []);

  // ── ANALYSIS ORCHESTRATOR ──
  const handleAnalysis = useCallback(async () => {
    if (!subject.trim() || groqStatus !== 'online') return;
    dispatch({ type: 'START_ANALYSIS' });

    try {
      // Step 1: classify (returns { type, ticker })
      const classification  = await classifySubject(subject, selectedModel);
      const subjectType = classification.type;
      let   activeTicker = classification.ticker;
      dispatch({ type: 'SET_SUBJECT_TYPE', payload: subjectType });
      if (activeTicker) dispatch({ type: 'SET_TICKER', payload: activeTicker });

      // Step 2: run 5 dimension agents sequentially
      // (local GPU handles one request at a time; sequential shows clear progress)
      const results = { social: null, technological: null, economic: null, environmental: null, political: null };

      const rc = buildRecencyContext();

      // Per-dimension search angles — keep tight so Tavily returns relevant hits
      const dimQueries = {
        Social:        `${subject} consumer behavior demographics workforce culture public trust 2025 2026`,
        Technological: `${subject} technology AI infrastructure platform breakthroughs 2025 2026`,
        Economic:      `${subject} market financials revenue margins supply chain trade policy 2025 2026`,
        Environmental: `${subject} sustainability climate carbon emissions ESG regulation 2025 2026`,
        Political:     `${subject} regulation legislation antitrust policy geopolitics 2025 2026`,
      };

      const agents = [
        { key: 'social',        dim: 'Social',        prompt: SOCIAL_PROMPT(subject, subjectType, rc) },
        { key: 'technological', dim: 'Technological', prompt: TECH_PROMPT(subject, subjectType, rc) },
        { key: 'economic',      dim: 'Economic',      prompt: ECON_PROMPT(subject, subjectType, rc) },
        { key: 'environmental', dim: 'Environmental', prompt: ENV_PROMPT(subject, subjectType, rc) },
        { key: 'political',     dim: 'Political',     prompt: POL_PROMPT(subject, subjectType, rc) },
      ];

      // Aggregate sources for synthesis to reference cross-dim themes
      const allSources = [];

      let dailyLimitHit = false;
      for (const { key, dim, prompt } of agents) {
        if (dailyLimitHit) {
          dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: 'error' });
          continue;
        }
        try {
          dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: 'researching' });
          const sources = await fetchResearch(dimQueries[dim], 4);
          allSources.push(...sources.map(s => ({ ...s, dimension: dim })));
          const sourcesBlock = formatSourcesBlock(sources, `RECENT ${dim.toUpperCase()} SOURCES`);

          const data = await callAgent(
            prompt,
            `Conduct a senior-analyst ${dim} dimension STEEP analysis on: "${subject}" (classified as: ${subjectType}). Apply the WRITING STANDARD strictly: name specifics, show causality, surface second-order effects, be decision-relevant, no boilerplate. Ground every driver.evidence entry in the live sources below where relevant — cite the source URL inside the evidence string. Return only valid JSON matching the schema exactly.

${sourcesBlock}`,
            selectedModel,
            (s) => dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: s }),
            1500, // room for richer per-driver descriptions and concrete evidence
          );
          results[key] = data;
          dispatch({ type: 'SET_STEEP_DATA', dimension: key, data });
        } catch (err) {
          console.error(`${dim} agent error:`, err.message);
          dispatch({ type: 'SET_AGENT_STATUS', dimension: key, status: 'error' });
          if (err.errorType === 'rate_limit_daily') {
            dailyLimitHit = true;
            dispatch({
              type: 'SET_ERROR',
              errorType: 'rate_limit_daily',
              payload: `Groq daily token limit reached on ${err.modelUsed || selectedModel}. The free tier allows 100,000 tokens per day on this model. Switch to "llama-3.1-8b-instant" (separate daily quota, faster) from the model dropdown, wait until your daily reset, or upgrade to Groq's Dev tier.`,
            });
          }
        }
        // Inter-agent pacing — lets Groq's per-minute token bucket partially refill
        // between heavy calls, sharply reducing 429 retries on the free tier.
        await new Promise(r => setTimeout(r, 4000));
      }

      // Skip synthesis if we already exhausted the daily quota — it would just fail again.
      if (dailyLimitHit) {
        dispatch({ type: 'SET_AGENT_STATUS', dimension: 'synthesis', status: 'error' });
        return;
      }

      // Step 3: synthesis — longer pause lets the TPM bucket recover before
      // the heaviest call (synthesis = 5 dim summaries + cross-dim sources + 2200 tok output)
      await new Promise(r => setTimeout(r, 10000));
      dispatch({ type: 'SET_STATUS', payload: 'synthesizing' });
      try {
        const synthData = await callAgent(
          SYNTHESIS_PROMPT(subject, subjectType, results, rc),
          `Synthesize the five STEEP dimension briefings for "${subject}" into a board-grade executive intelligence report. Apply the SYNTHESIS STANDARD strictly: integrate (do not restate), name causal mechanisms between dimensions, make every roadmap milestone a specific decision point with observable triggers and verb-led accelerants. Use the cross-dimension live sources below to anchor cross_dimension_insights and roadmap triggers in real, dated events. Return only valid JSON matching the schema.

${formatSourcesBlock(allSources.slice(0, 6), 'CROSS-DIMENSION LIVE SOURCES')}`,
          selectedModel,
          (s) => dispatch({ type: 'SET_AGENT_STATUS', dimension: 'synthesis', status: s }),
          2200, // room for full roadmap, richer cross-dimension insights, and executive summary
        );
        dispatch({ type: 'SET_SYNTHESIS', data: synthData });

        // Step 4: Investment Thesis (runs after synthesis, only when we have a ticker)
        if (activeTicker) {
          dispatch({ type: 'SET_THESIS_STATUS', payload: 'loading' });
          try {
            const fundRes = await fetch(`/api/fundamentals?ticker=${encodeURIComponent(activeTicker)}`);
            const fundData = await fundRes.json();
            if (fundData.found) {
              dispatch({ type: 'SET_FUNDAMENTALS', data: fundData });
              // Build a compact STEEP context block for the thesis agent
              const steepContext = Object.entries(results)
                .filter(([, d]) => d)
                .map(([dim, d]) => `${dim}: ${d.dominant_direction} — ${(d.summary || '').slice(0, 150)}`)
                .join('\n');
              const thesisData = await callAgent(
                INVESTMENT_THESIS_PROMPT(activeTicker, fundData.company_name, fundData),
                `Generate the investment thesis for ${activeTicker} (${fundData.company_name}).

STEEP ANALYSIS CONTEXT (from 5 specialist agents):
${steepContext}

Integrate the STEEP context where relevant — especially macro tailwinds/headwinds from Economic, regulatory risks from Political, and demand signals from Social. Return only valid JSON matching the schema.`,
                selectedModel,
                (s) => dispatch({ type: 'SET_THESIS_STATUS', payload: s === 'complete' ? 'complete' : 'loading' }),
                1600,
              );
              dispatch({ type: 'SET_INVESTMENT_THESIS', data: thesisData });
              dispatch({ type: 'SET_THESIS_STATUS', payload: 'complete' });
            } else {
              // Ticker not found in Yahoo Finance — treat as private
              activeTicker = null;
              dispatch({ type: 'SET_TICKER', payload: null });
              dispatch({ type: 'SET_THESIS_STATUS', payload: 'idle' });
            }
          } catch (err) {
            console.error('Investment thesis error:', err.message);
            dispatch({ type: 'SET_THESIS_STATUS', payload: 'error' });
          }
        }

        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'overview' });
      } catch (err) {
        console.error('Synthesis error:', err.message);
        dispatch({ type: 'SET_AGENT_STATUS', dimension: 'synthesis', status: 'error' });
        if (err.errorType === 'rate_limit_daily') {
          dispatch({
            type: 'SET_ERROR',
            errorType: 'rate_limit_daily',
            payload: `Groq daily token limit reached during synthesis on ${err.modelUsed || selectedModel}. The five dimension briefings completed — switch to "llama-3.1-8b-instant" or wait for the daily reset to generate the executive synthesis.`,
          });
        } else {
          dispatch({ type: 'SET_STATUS', payload: 'complete' });
          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'evidence' });
        }
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, [subject, selectedModel, groqStatus]);

  const hasTicker = Boolean(ticker && isComplete && thesisStatus !== 'idle');
  const tabs = [
    { key: 'overview',  label: 'Overview',  icon: '◉' },
    { key: 'forcemap',  label: 'Force Map', icon: '◈' },
    { key: 'roadmap',   label: 'Roadmap',   icon: '→' },
    ...(hasTicker ? [{ key: 'thesis', label: 'Investment Thesis', icon: '◎', badge: thesisStatus }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto">
        {/* Branding */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black text-white">S</div>
            <span className="font-bold text-white">STEEP Platform</span>
          </div>
          <p className="text-slate-600 text-xs">Groq Cloud · Fast inference</p>
        </div>

        {/* Groq panel */}
        <GroqPanel state={state} dispatch={dispatch} />

        {/* Subject + Run */}
        <div className="px-4 py-4 border-b border-slate-800 space-y-2">
          <label className="block text-xs text-slate-500 font-medium">Subject to Analyze</label>
          <input
            type="text"
            value={subject}
            onChange={e => dispatch({ type: 'SET_SUBJECT', payload: e.target.value })}
            placeholder="e.g. quantum computing"
            disabled={isRunning}
            onKeyDown={e => e.key === 'Enter' && !isRunning && subject.trim() && handleAnalysis()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          {/* Quick-pick dropdown */}
          <div className="relative">
            <select
              value=""
              onChange={e => { if (e.target.value) dispatch({ type: 'SET_SUBJECT', payload: e.target.value }); }}
              disabled={isRunning}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 pr-6 py-1.5 text-xs text-slate-400 focus:border-blue-500 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
            >
              <option value="">— quick-pick a subject —</option>
              <optgroup label="Trends">
                {SUGGESTED_SUBJECTS.trends.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Companies">
                {SUGGESTED_SUBJECTS.companies.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">▾</span>
          </div>
          <button
            onClick={handleAnalysis}
            disabled={isRunning || !subject.trim() || groqStatus !== 'online'}
            className="w-full py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: isRunning ? 'linear-gradient(135deg,#1e3a5f,#3730a3)' : 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            {isRunning
              ? <span className="flex items-center justify-center gap-2"><Spinner size={12} />Analyzing…</span>
              : groqStatus !== 'online' ? 'Groq Not Connected' : 'Run STEEP Analysis'}
          </button>
          {groqStatus === 'online' && (
            <p className="text-slate-600 text-xs text-center">
              6 agents · {CATALOG.find(m => m.id === selectedModel)?.label || selectedModel}
            </p>
          )}
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="px-4 py-4 border-b border-slate-800">
            <ProgressPanel agentStatuses={agentStatuses} status={status} />
          </div>
        )}

        {/* Tab nav */}
        {isComplete && (
          <nav className="flex-1 px-3 py-3">
            <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Dashboard</p>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === tab.key ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            ))}
          </nav>
        )}

        {/* Examples */}
        <div className="px-3 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Examples</p>
          <button
            onClick={() => dispatch({ type: 'LOAD_EXAMPLE', payload: QUANTUM_COMPUTING_EXAMPLE })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${status === 'complete' && subject === QUANTUM_COMPUTING_EXAMPLE.subject ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <span className="text-base leading-none">⚛</span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-medium">Quantum Computing</span>
              <span className="block text-slate-600 text-xs">Pre-run example</span>
            </span>
            {status === 'complete' && subject === QUANTUM_COMPUTING_EXAMPLE.subject && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        </div>

        {/* Error */}
        {status === 'error' && state.error && (
          <div className={`mx-3 mb-3 p-3 rounded-xl border ${state.errorType === 'rate_limit_daily' ? 'bg-amber-950 border-amber-800' : 'bg-red-950 border-red-800'}`}>
            <p className={`text-xs font-semibold mb-1 ${state.errorType === 'rate_limit_daily' ? 'text-amber-400' : 'text-red-400'}`}>
              {state.errorType === 'rate_limit_daily' ? 'Daily token limit reached' : 'Error'}
            </p>
            <p className={`text-xs leading-relaxed break-words ${state.errorType === 'rate_limit_daily' ? 'text-amber-200' : 'text-red-300'}`}>
              {state.error}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.errorType === 'rate_limit_daily' && availableModels.some(m => m.id === 'llama-3.1-8b-instant') && selectedModel !== 'llama-3.1-8b-instant' && (
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_SELECTED_MODEL', payload: 'llama-3.1-8b-instant' });
                    dispatch({ type: 'SET_STATUS', payload: 'idle' });
                  }}
                  className="text-xs px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-amber-50 font-medium"
                >
                  Switch to 8B model
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'SET_STATUS', payload: 'idle' })}
                className={`text-xs underline ${state.errorType === 'rate_limit_daily' ? 'text-amber-400 hover:text-amber-200' : 'text-red-400 hover:text-red-200'}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-800 mt-auto">
          <p className="text-slate-700 text-xs">Groq · {selectedModel}</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Idle */}
        {status === 'idle' && (
          <div className="overflow-y-auto px-8 py-10">
            <div className="max-w-4xl mx-auto">

              {/* Hero */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 mx-auto mb-6 flex items-center justify-center text-3xl font-black text-white shadow-2xl">S</div>
                <h1 className="text-3xl font-black text-white mb-3">STEEP Analysis Platform</h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto mb-1">
                  Powered by <span className="text-white font-semibold">Groq</span> — fast cloud inference, no GPU needed.
                </p>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto">
                  Enter any company, trend, or technology in the sidebar to run a six-agent intelligence analysis and generate a 3D force map, forecast roadmap, and full per-dimension evidence report.
                </p>
              </div>

              {/* What is STEEP */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                <h2 className="text-white font-bold text-base mb-2">What is STEEP analysis?</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  STEEP is a structured strategic-intelligence framework used by analysts, executives, and policy makers to map the macro-environmental forces shaping an organisation, industry, or trend. By examining five distinct dimensions — Social, Technological, Economic, Environmental, and Political — it surfaces both the threats and opportunities that lie outside a subject's direct control, enabling better long-range planning and risk management.
                </p>
              </div>

              {/* Dimension cards */}
              <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-4 opacity-50">The five dimensions + synthesis agent</h2>
              <div className="grid grid-cols-1 gap-4 mb-8">

                {/* Social */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#3B82F620', color: '#3B82F6', border: '2px solid #3B82F640' }}>S</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Social</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#3B82F620', color: '#3B82F6' }}>Agent 1</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Examines human and societal forces that influence demand, talent, and public perception.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Demographics & population', 'Cultural shifts', 'Consumer behaviour', 'Workforce trends', 'Public health', 'Education & skills'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Technological */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#8B5CF620', color: '#8B5CF6', border: '2px solid #8B5CF640' }}>T</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Technological</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>Agent 2</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Maps emerging technologies, R&D momentum, and the pace of digital disruption affecting the subject.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['AI & automation', 'R&D breakthroughs', 'Digital infrastructure', 'Cybersecurity', 'IP landscape', 'Platform dynamics'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Economic */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#10B98120', color: '#10B981', border: '2px solid #10B98140' }}>E</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Economic</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#10B98120', color: '#10B981' }}>Agent 3</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Analyses macroeconomic conditions, market structures, and financial forces shaping viability and growth.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Market conditions', 'Trade & tariffs', 'Investment flows', 'Inflation & rates', 'Supply chains', 'Competitive landscape'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Environmental */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#14B8A620', color: '#14B8A6', border: '2px solid #14B8A640' }}>E</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Environmental</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#14B8A620', color: '#14B8A6' }}>Agent 4</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Assesses climate risk, natural resource constraints, sustainability expectations, and ecological regulation.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Climate risk', 'Energy transition', 'Resource scarcity', 'ESG pressure', 'Carbon regulation', 'Circular economy'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Political */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#F9731620', color: '#F97316', border: '2px solid #F9731640' }}>P</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Political</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F9731620', color: '#F97316' }}>Agent 5</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Evaluates government policy, regulatory direction, geopolitical instability, and legislative trends.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Government policy', 'Regulation & compliance', 'Geopolitical risk', 'Elections & stability', 'International relations', 'Lobbying dynamics'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Synthesis */}
                <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 flex gap-5" style={{ borderColor: '#6366f140' }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: '#6366f120', color: '#818cf8', border: '2px solid #6366f140' }}>✦</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-sm">Synthesis</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#6366f120', color: '#818cf8' }}>Agent 6</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2">Runs after all five dimension agents complete. Integrates findings into a unified executive report with an overall strategic posture, cross-dimension insights, and a forecast roadmap.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Overall posture', 'Executive summary', 'Cross-dimension insights', 'Near-term milestones', 'Mid-term milestones', 'Long-term milestones'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Output summary */}
              <h2 className="text-white font-bold text-sm uppercase tracking-widest mb-4 opacity-50">What you get</h2>
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-lg mb-2">📋</div>
                  <p className="text-white font-semibold text-sm mb-1">Overview</p>
                  <p className="text-slate-500 text-xs leading-relaxed">Strategic posture badge, executive summary, dimension driver cards, cross-dimension insights, and a full evidence accordion.</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-lg mb-2">🌐</div>
                  <p className="text-white font-semibold text-sm mb-1">3D Force Map</p>
                  <p className="text-slate-500 text-xs leading-relaxed">Interactive Three.js globe with force-directed driver nodes. Click any node for a full detail panel with confidence, impact, and evidence.</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="text-lg mb-2">🗺️</div>
                  <p className="text-white font-semibold text-sm mb-1">Forecast Roadmap</p>
                  <p className="text-slate-500 text-xs leading-relaxed">Near / mid / long-term milestones with trigger points, risks, accelerants, and confidence ratings. Toggle Card or Timeline view.</p>
                </div>
              </div>

              {/* Status / CTA */}
              {groqStatus === 'offline' && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4">
                  <p className="text-red-300 font-semibold text-sm mb-1">Groq API key not found</p>
                  <p className="text-red-400 text-xs">Set <code className="font-mono bg-red-900 px-1 rounded">GROQ_API_KEY</code> in your environment variables and restart the app.</p>
                </div>
              )}
              {groqStatus === 'online' && (
                <p className="text-center text-slate-600 text-xs pb-4">Enter a subject in the sidebar to begin your analysis.</p>
              )}

            </div>
          </div>
        )}

        {/* Running */}
        {isRunning && (
          <div className="h-full flex items-center justify-center px-8">
            <div className="text-center max-w-lg">
              <div className="relative w-20 h-20 mx-auto mb-7">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 animate-spin" style={{ borderTopColor: '#3B82F6', borderRightColor: '#8B5CF6', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">S</div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {status === 'classifying' ? 'Classifying Subject' : status === 'researching' ? 'Running Dimension Agents' : 'Synthesizing Intelligence'}
              </h2>
              <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">
                {status === 'classifying' ? `Classifying "${subject}"…`
                  : status === 'researching' ? `Running agents on ${CATALOG.find(m => m.id === selectedModel)?.label || selectedModel}…`
                  : 'Producing your executive intelligence report…'}
              </p>
              <p className="text-slate-600 text-xs mb-8">Each dimension agent takes 5–20 seconds on Groq.</p>
              <div className="flex justify-center gap-3">
                {Object.entries(COLORS).map(([dim, color]) => {
                  const k = dim.toLowerCase();
                  const s = agentStatuses[k];
                  return (
                    <div key={dim} className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all text-xs"
                        style={{ borderColor: s === 'complete' ? '#10b981' : s === 'researching' ? color : s === 'error' ? '#ef4444' : '#1e293b', backgroundColor: s === 'complete' ? '#10b98120' : s === 'researching' ? color + '20' : 'transparent', color: s === 'complete' ? '#10b981' : s === 'error' ? '#ef4444' : '#94a3b8' }}>
                        {s === 'complete' ? '✓' : s === 'researching' ? <Spinner size={12} /> : s === 'error' ? '✗' : '·'}
                      </div>
                      <span className="text-xs text-slate-600">{dim.slice(0, 4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isComplete && (
          <div className="min-h-full flex flex-col">
            <div className="flex items-center gap-1 px-6 pt-5 pb-0 border-b border-slate-800 flex-shrink-0 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === tab.key ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge === 'loading' && <Spinner size={10} />}
                  {tab.badge === 'complete' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {tab.badge === 'error'   && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </button>
              ))}
            </div>
            <div className={`flex-1 ${activeTab === 'forcemap' ? 'p-4' : 'p-6'}`}>
              {activeTab === 'overview' && <OverviewTab state={state} />}
              {activeTab === 'forcemap' && <ForceMapTab state={state} />}
              {activeTab === 'roadmap'  && <RoadmapTab  state={state} dispatch={dispatch} />}
              {activeTab === 'thesis'   && <InvestmentThesisTab state={state} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return <App />;
}
