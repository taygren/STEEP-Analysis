'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { QUANTUM_COMPUTING_EXAMPLE } from '../lib/quantumComputingExample';
import { APPLE_EXAMPLE } from '../lib/appleExample';
import { WALMART_EXAMPLE } from '../lib/walmartExample';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  Legend,
} from 'recharts';
import { INSTRUMENT_ATTRIBUTES, GEOECONOMIC_CAPACITIES, STRATEGIC_UTILITY_CLASSES, computeSeverityScore, classifySeverity } from '../lib/bigCycle/engine';
import AboutPanel from './components/AboutPanel';

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
  sentimentData: null,      // Adanos sentiment signals (null when key absent or non-public company)
  macroData: null,          // Live macro indicators (Yahoo Finance + BLS)
  snapshotData: null,       // AI-generated time-bound snapshot
  snapshotStatus: 'idle',   // idle | loading | complete | error
  bigCycleData: null,       // Big Cycle Decision Engine assessment
  bigCycleStatus: 'idle',   // idle | loading | complete | error
  predictionMarkets: null,       // Polymarket contracts relevant to subject
  predictionStatus: 'idle',      // idle | loading | complete | error
  predictionTags: [],            // Keyword aliases used for the Polymarket fetch
  predictionFetchedAt: null,     // ISO timestamp of last successful fetch
  predictionLowConfidence: false,// true when no high-confidence matches found
  status: 'idle',           // idle | classifying | researching | synthesizing | complete | error
  agentStatuses: blankStats(),
  steepData: blankDims(),
  synthesis: null,
  activeTab: 'home',
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
    case 'START_ANALYSIS':    return { ...state, status: 'classifying', error: null, steepData: blankDims(), synthesis: null, agentStatuses: blankStats(), ticker: null, fundamentals: null, investmentThesis: null, thesisStatus: 'idle', sentimentData: null, macroData: null, snapshotData: null, snapshotStatus: 'idle', bigCycleData: null, bigCycleStatus: 'idle', predictionMarkets: null, predictionStatus: 'idle', predictionTags: [], predictionFetchedAt: null, predictionLowConfidence: false };
    case 'SET_SUBJECT_TYPE':  return { ...state, subjectType: action.payload, status: 'researching' };
    case 'SET_TICKER':        return { ...state, ticker: action.payload };
    case 'SET_FUNDAMENTALS':  return { ...state, fundamentals: action.data };
    case 'SET_INVESTMENT_THESIS': return { ...state, investmentThesis: action.data };
    case 'SET_THESIS_STATUS': return { ...state, thesisStatus: action.payload };
    case 'SET_SENTIMENT_DATA':  return { ...state, sentimentData: action.data };
    case 'SET_MACRO_DATA':      return { ...state, macroData: action.data };
    case 'SET_SNAPSHOT_DATA':   return { ...state, snapshotData: action.data, snapshotStatus: 'complete' };
    case 'SET_SNAPSHOT_STATUS': return { ...state, snapshotStatus: action.payload };
    case 'SET_BIG_CYCLE_DATA':  return { ...state, bigCycleData: action.data, bigCycleStatus: 'complete' };
    case 'SET_BIG_CYCLE_STATUS':return { ...state, bigCycleStatus: action.payload };
    case 'SET_PREDICTION_MARKETS': return { ...state, predictionMarkets: action.data, predictionStatus: 'complete', predictionFetchedAt: action.fetchedAt ?? new Date().toISOString(), predictionLowConfidence: action.lowConfidence ?? false };
    case 'SET_PREDICTION_STATUS':  return { ...state, predictionStatus: action.payload };
    case 'SET_PREDICTION_TAGS':    return { ...state, predictionTags: action.payload };
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
      return {
        ...state,
        subject: ex.subject,
        subjectType: ex.subjectType,
        status: 'complete',
        error: null,
        errorType: null,
        steepData: ex.steepData,
        synthesis: ex.synthesis,
        agentStatuses: allComplete,
        activeTab: 'overview',
        ticker: ex.ticker ?? null,
        fundamentals: ex.fundamentals ?? null,
        investmentThesis: ex.investmentThesis ?? null,
        thesisStatus: ex.investmentThesis ? 'complete' : 'idle',
        sentimentData: ex.sentimentData ?? null,
        macroData: ex.macroData ?? null,
        snapshotData: ex.snapshotData ?? null,
        snapshotStatus: ex.snapshotData ? 'complete' : 'idle',
        bigCycleData: ex.bigCycleData ?? null,
        bigCycleStatus: ex.bigCycleData ? 'complete' : 'idle',
        predictionMarkets: null,
        predictionStatus: 'idle',
        predictionTags: [],
        predictionFetchedAt: null,
        predictionLowConfidence: false,
      };
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

/** Build a [LIVE SENTIMENT DATA] prompt block from Adanos payload. */
function buildSentimentBlock(s) {
  if (!s?.found) return '';
  const sign = s.composite_sentiment_score >= 0 ? '+' : '';
  const trend = (s.composite_trend || 'stable').toUpperCase();
  const platformLines = (s.platforms || []).map(p =>
    `  ${p.name.padEnd(7)} buzz=${p.buzz?.toFixed(0) ?? 'N/A'}  sentiment=${p.sentiment_score >= 0 ? '+' : ''}${p.sentiment_score?.toFixed(2) ?? 'N/A'}  bullish=${p.bullish_pct?.toFixed(0) ?? '?'}%  bearish=${p.bearish_pct?.toFixed(0) ?? '?'}%  mentions=${p.mentions ?? '?'}`
  ).join('\n');
  return `[LIVE SENTIMENT DATA — ${s.ticker} as of today]
Composite buzz score:  ${s.composite_buzz?.toFixed(0) ?? 'N/A'} / 100
Trend:                 ${trend}
Sentiment score:       ${sign}${s.composite_sentiment_score?.toFixed(2) ?? 'N/A'} (−1 bearish → +1 bullish)
Bullish / Bearish:     ${s.composite_bullish_pct?.toFixed(0) ?? '?'}% / ${s.composite_bearish_pct?.toFixed(0) ?? '?'}%
Platform breakdown:
${platformLines}

Instructions: Treat this sentiment data as a leading social indicator. Integrate buzz trend and sentiment direction as evidence for or against consumer/investor sentiment drivers. Cite it explicitly (e.g. "Reddit sentiment +0.4, bullish 62%").`;
}

/** Build a [LIVE MACRO CONTEXT] prompt block from macro payload. */
function buildMacroBlock(m) {
  if (!m?.found) return '';
  const ind = m.indicators ?? {};
  const fmt = (k, decimals = 2) => {
    const v = ind[k]?.value;
    const d = ind[k]?.delta;
    const u = ind[k]?.unit ?? '';
    if (v == null) return 'N/A';
    const dStr = d != null ? ` (${d >= 0 ? '+' : ''}${d.toFixed(decimals)}${u} vs prior)` : '';
    return `${v.toFixed(decimals)}${u}${dStr}`;
  };
  return `[LIVE MACRO CONTEXT — as of ${m.fetched_at?.slice(0,10) ?? 'today'}]
10Y Treasury Yield:   ${fmt('yield_10y')}
Short-term rates:     ${fmt('rates_short')} (13W T-Bill)
Unemployment rate:    ${fmt('unemployment')}  ${ind.unemployment?.period ?? ''}
CPI YoY:              ${fmt('cpi_yoy')}
S&P 500:              ${fmt('sp500', 0)} ${ind.sp500?.delta != null ? `(${ind.sp500.delta >= 0 ? '+' : ''}${ind.sp500.delta?.toFixed(0)} vs 1mo prior)` : ''}
VIX (Volatility):     ${fmt('vix', 1)}

Instructions: Use these live macro readings as the empirical baseline for the Economic dimension analysis. Reference specific values (e.g. "with the 10Y at ${ind.yield_10y?.value?.toFixed(2) ?? 'X'}%, discount rates compress growth multiples"). Flag whether the macro regime is tightening, easing, or neutral.`;
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
      className="inline-block rounded-full border-2 border-slate-700 border-t-violet-400 animate-spin"
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
    <div className="px-4 py-4 border-b border-violet-500/10 space-y-3">
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
          className="w-full bg-slate-900/80 border border-violet-500/20 rounded-lg px-2 py-1.5 text-xs text-white focus:border-violet-500 transition-colors appearance-none"
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
    <div className="bg-violet-950/20 border border-violet-500/20 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-white">
          {status === 'synthesizing' ? 'Synthesizing…' : 'Analyzing…'}
        </span>
        <span className="text-xs text-slate-500">{done}/6</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${(done / 6) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
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
              {s === 'researching' && <div className="flex items-center gap-1"><Spinner size={12} /><span className="text-violet-400">Running</span></div>}
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

// ─────────────────────────────────────────────────────────────────
// SENTIMENT PULSE — Social card subsection (Adanos data)
// ─────────────────────────────────────────────────────────────────
function SentimentPulseSection({ sentiment }) {
  if (!sentiment?.found) return null;
  const { composite_buzz, composite_trend, composite_sentiment_score, composite_bullish_pct, composite_bearish_pct, platforms } = sentiment;

  const trendIcon  = composite_trend === 'rising' ? '▲' : composite_trend === 'falling' ? '▼' : '—';
  const trendColor = composite_trend === 'rising' ? 'text-emerald-400' : composite_trend === 'falling' ? 'text-red-400' : 'text-slate-400';
  const sentColor  = (composite_sentiment_score ?? 0) >= 0.1 ? 'text-emerald-400' : (composite_sentiment_score ?? 0) <= -0.1 ? 'text-red-400' : 'text-yellow-400';

  const buzz = Math.min(100, Math.max(0, composite_buzz ?? 0));
  const bullPct = composite_bullish_pct ?? 50;
  const bearPct = composite_bearish_pct ?? 50;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>📡</span>Sentiment Pulse
      </p>

      {/* Buzz gauge + trend */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-500 mb-0.5">
            <span>Buzz</span>
            <span className="text-white font-semibold">{buzz.toFixed(0)}/100</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full" style={{ width: `${buzz}%` }} />
          </div>
        </div>
        <span className={`text-sm font-bold ${trendColor} flex-shrink-0`}>{trendIcon} {composite_trend || 'stable'}</span>
      </div>

      {/* Bull / Bear bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-emerald-400">▲ {bullPct.toFixed(0)}% bullish</span>
          <span className={`font-semibold ${sentColor}`}>{(composite_sentiment_score ?? 0) >= 0 ? '+' : ''}{(composite_sentiment_score ?? 0).toFixed(2)}</span>
          <span className="text-red-400">{bearPct.toFixed(0)}% bearish ▼</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
          <div className="h-full bg-emerald-600" style={{ width: `${bullPct}%` }} />
          <div className="h-full bg-red-600" style={{ width: `${bearPct}%` }} />
        </div>
      </div>

      {/* Platform chips */}
      {(platforms || []).length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {platforms.map(p => (
            <div key={p.name} className="px-2 py-1 rounded-lg bg-slate-900 text-xs flex items-center gap-1.5">
              <span className="text-slate-400">{p.name}</span>
              <span className={p.sentiment_score >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {p.sentiment_score >= 0 ? '+' : ''}{p.sentiment_score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LIVE MACRO STRIP — Economic card subsection (Yahoo Finance + BLS)
// ─────────────────────────────────────────────────────────────────
function LiveMacroStrip({ macro }) {
  if (!macro?.found) return null;
  const ind = macro.indicators ?? {};

  const chips = [
    { key: 'yield_10y',   label: '10Y',    decimals: 2 },
    { key: 'rates_short', label: 'T-Bill', decimals: 2 },
    { key: 'unemployment',label: 'Unemp',  decimals: 1 },
    { key: 'cpi_yoy',     label: 'CPI YoY',decimals: 1 },
    { key: 'sp500',       label: 'S&P 500', decimals: 0 },
    { key: 'vix',         label: 'VIX',    decimals: 1 },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-slate-700">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>📊</span>Live Macro Signals
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {chips.map(({ key, label, decimals }) => {
          const ind2 = ind[key];
          if (!ind2) return null;
          const v = ind2.value;
          const d = ind2.delta;
          const u = ind2.unit ?? '';
          if (v == null) return null;
          const up = d != null && d > 0;
          const dn = d != null && d < 0;
          const arrow = up ? '▲' : dn ? '▼' : '—';
          const arrowCls = up ? 'text-emerald-400' : dn ? 'text-red-400' : 'text-slate-500';
          return (
            <div key={key} className="bg-slate-900 rounded-lg px-2 py-1.5">
              <div className="text-slate-500 text-xs mb-0.5">{label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-white text-sm font-semibold tabular-nums">
                  {v.toFixed(decimals)}{u}
                </span>
                <span className={`text-xs ${arrowCls}`}>{arrow}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MARKET SENTIMENT CARD — Investment Thesis tab (Adanos data)
// ─────────────────────────────────────────────────────────────────
function MarketSentimentCard({ sentiment }) {
  if (!sentiment?.found) return null;
  const { composite_buzz, composite_trend, composite_sentiment_score, composite_bullish_pct, composite_bearish_pct, trend_history, platforms } = sentiment;

  const trendIcon  = composite_trend === 'rising' ? '▲' : composite_trend === 'falling' ? '▼' : '—';
  const trendColor = composite_trend === 'rising' ? 'text-emerald-400' : composite_trend === 'falling' ? 'text-red-400' : 'text-slate-400';
  const sentScore  = composite_sentiment_score ?? 0;
  const sentPct    = Math.round((sentScore + 1) / 2 * 100); // map -1..+1 → 0..100%

  // CSS sparkline from trend_history (newest first → reverse for left-to-right)
  const sparkVals = [...(trend_history || [])].reverse().slice(-7);
  const sparkMax  = Math.max(...sparkVals, 1);

  return (
    <MetricCard title="Market Sentiment" icon="📡">
      {/* Composite score bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Bearish</span>
          <span className="text-white font-semibold">
            {sentScore >= 0 ? '+' : ''}{sentScore.toFixed(2)} composite score
          </span>
          <span>Bullish</span>
        </div>
        <div className="relative h-2 bg-slate-700 rounded-full">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-yellow-500 to-emerald-500 rounded-full w-full opacity-30" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-slate-800 shadow"
            style={{ left: `calc(${sentPct}% - 6px)` }}
          />
        </div>
      </div>

      {/* Buzz + trend */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-slate-400 text-xs">Buzz: </span>
          <span className="text-white font-semibold text-sm">{(composite_buzz ?? 0).toFixed(0)}/100</span>
        </div>
        <span className={`text-sm font-bold ${trendColor}`}>{trendIcon} {composite_trend || 'stable'}</span>
      </div>

      {/* Bull / Bear split */}
      <div className="flex justify-between text-xs mb-3">
        <span className="text-emerald-400 font-semibold">▲ {(composite_bullish_pct ?? 50).toFixed(0)}% bull</span>
        <span className="text-red-400 font-semibold">{(composite_bearish_pct ?? 50).toFixed(0)}% bear ▼</span>
      </div>

      {/* Sparkline from trend history */}
      {sparkVals.length > 1 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">7-day buzz trend</p>
          <div className="flex items-end gap-0.5 h-8">
            {sparkVals.map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-sm opacity-70"
                style={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
                title={`${v.toFixed(0)}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Per-platform breakdown */}
      {(platforms || []).length > 0 && (
        <div className="space-y-1.5 border-t border-slate-700 pt-2 mt-1">
          {platforms.map(p => (
            <div key={p.name} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 w-14">{p.name}</span>
              <div className="flex-1 mx-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={p.sentiment_score >= 0 ? 'h-full bg-emerald-500 rounded-full' : 'h-full bg-red-500 rounded-full ml-auto'}
                  style={{ width: `${Math.min(100, Math.abs(p.sentiment_score) * 100)}%` }}
                />
              </div>
              <span className={p.sentiment_score >= 0 ? 'text-emerald-400 font-semibold tabular-nums' : 'text-red-400 font-semibold tabular-nums'}>
                {p.sentiment_score >= 0 ? '+' : ''}{p.sentiment_score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </MetricCard>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SNAPSHOT PANEL — compact time-bound brief inside OverviewTab
// ═══════════════════════════════════════════════════════════════════
function SnapshotPanel({ state, dispatch }) {
  const { subject, subjectType, selectedModel, snapshotData, snapshotStatus } = state;
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  const generate = async (force = false) => {
    dispatch({ type: 'SET_SNAPSHOT_STATUS', payload: 'loading' });
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, subjectType, asOfDate, model: selectedModel, forceRefresh: force }),
      });
      const json = await res.json();
      if (json.found && json.snapshot) {
        dispatch({ type: 'SET_SNAPSHOT_DATA', data: json.snapshot });
      } else {
        dispatch({ type: 'SET_SNAPSHOT_STATUS', payload: 'error' });
      }
    } catch {
      dispatch({ type: 'SET_SNAPSHOT_STATUS', payload: 'error' });
    }
  };

  const dirColor = (d) => d === 'positive' ? 'text-emerald-400' : d === 'negative' ? 'text-red-400' : 'text-yellow-400';
  const dirArrow = (d) => d === 'positive' ? '▲' : d === 'negative' ? '▼' : '—';

  const postureColors = { Opportunistic: '#10b981', Cautious: '#f59e0b', Defensive: '#ef4444', Transformative: '#8b5cf6' };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <SectionHdr>Intelligence Snapshot</SectionHdr>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
          />
          {snapshotStatus === 'loading' ? (
            <div className="px-3 py-1.5 rounded-lg bg-slate-700 flex items-center gap-2 text-xs text-slate-400">
              <Spinner size={12} /><span>Generating…</span>
            </div>
          ) : (
            <button
              onClick={() => generate(false)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-colors"
            >
              {snapshotData ? 'Refresh' : 'Generate Snapshot'}
            </button>
          )}
        </div>
      </div>

      {!snapshotData && snapshotStatus !== 'loading' && (
        <p className="text-slate-500 text-sm text-center py-4">
          Generate a concise intelligence brief for a specific date — useful for comparing posture over time.
        </p>
      )}

      {snapshotStatus === 'error' && (
        <p className="text-red-400 text-sm">Snapshot generation failed. Please try again.</p>
      )}

      {snapshotData && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: (postureColors[snapshotData.overallPosture] || '#64748b') + '25', color: postureColors[snapshotData.overallPosture] || '#94a3b8' }}
            >
              {snapshotData.overallPosture}
            </span>
            <span className="text-slate-500 text-xs">As of {snapshotData.asOfDate}</span>
            {snapshotData.model && <span className="text-slate-600 text-xs ml-auto">via {snapshotData.model.split('/').pop()}</span>}
          </div>

          {/* Executive summary */}
          <p className="text-slate-200 text-sm leading-relaxed">{snapshotData.executiveSummary}</p>

          {/* Dimension snapshot grid */}
          {snapshotData.dimensionSnapshots && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(snapshotData.dimensionSnapshots).map(([dim, snap]) => (
                <div key={dim} className="bg-slate-900 rounded-lg px-3 py-2.5" style={{ borderLeft: `3px solid ${COLORS[dim.charAt(0).toUpperCase() + dim.slice(1)] || '#64748b'}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400 text-xs font-semibold capitalize">{dim}</span>
                    <span className={`text-xs font-bold ${dirColor(snap.direction)}`}>{dirArrow(snap.direction)}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-snug">{snap.headline}</p>
                  {snap.topDriver && <p className="text-slate-600 text-xs mt-0.5 truncate">{snap.topDriver}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Catalysts */}
          {(snapshotData.topCatalysts || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Top Catalysts</p>
              <div className="space-y-1.5">
                {snapshotData.topCatalysts.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <span className="text-slate-500 mt-0.5 flex-shrink-0">⚡</span>
                    <div>
                      <span className="text-slate-200">{c.event}</span>
                      {c.timeframe && <span className="text-slate-500 ml-1.5">{c.timeframe}</span>}
                    </div>
                    <span className={`ml-auto flex-shrink-0 font-semibold ${dirColor(c.direction)}`}>{c.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch items */}
          {(snapshotData.watchItems || []).length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {snapshotData.watchItems.map((w, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-slate-900 text-slate-400 text-xs border border-slate-700">👁 {w}</span>
              ))}
            </div>
          )}

          {snapshotData.confidenceNote && (
            <p className="text-slate-600 text-xs italic">{snapshotData.confidenceNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DATA VISUALIZATION TAB
// ═══════════════════════════════════════════════════════════════════
const DIRECTION_SCORE = { ACCELERATING: 9, EMERGING: 7, STABLE: 5, DECELERATING: 3 };

function DataVizTab({ state }) {
  const { steepData, synthesis, fundamentals, sentimentData, subject } = state;
  if (!synthesis) return <div className="text-slate-600 text-center py-20">Run an analysis to see visualizations.</div>;

  // ── Data preparation ────────────────────────────────────────────
  const dims = ['social', 'technological', 'economic', 'environmental', 'political'];
  const dimLabels = { social: 'Social', technological: 'Tech', economic: 'Economic', environmental: 'Enviro', political: 'Political' };

  // Radar: direction score × confidence
  const radarData = dims.map(d => {
    const data = steepData[d];
    const dirScore = DIRECTION_SCORE[data?.dominant_direction] ?? 5;
    const conf = data?.dimension_confidence ?? 0.5;
    const value = Math.round(dirScore * conf * 10) / 10;
    return { dim: dimLabels[d], value, fullMark: 10 };
  });

  // Bar: opportunities vs risks per dimension
  const oppRiskData = dims.map(d => {
    const data = steepData[d];
    return {
      dim: dimLabels[d],
      opportunities: (data?.opportunities || []).length,
      risks: (data?.risks || []).length,
      drivers: (data?.drivers || []).length,
    };
  });

  // Driver impact distribution
  const impactData = dims.map(d => {
    const drivers = steepData[d]?.drivers || [];
    return {
      dim: dimLabels[d],
      High: drivers.filter(dr => dr.impact === 'high').length,
      Medium: drivers.filter(dr => dr.impact === 'medium').length,
      Low: drivers.filter(dr => dr.impact === 'low').length,
    };
  });

  // Confidence bars
  const confData = dims.map(d => ({
    dim: dimLabels[d],
    confidence: Math.round((steepData[d]?.dimension_confidence ?? 0) * 100),
    color: COLORS[dimLabels[d]],
  }));

  const CHART_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981', opportunities: '#10b981', risks: '#ef4444', drivers: '#3b82f6' };

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">{subject} — Data Visualization</h2>
        <p className="text-slate-500 text-sm">Interactive charts from the current analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* STEEP Momentum Radar */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">STEEP Momentum Scores</h3>
          <p className="text-xs text-slate-500 mb-4">Direction × confidence — higher = stronger positive momentum</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar name="Momentum" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Opportunities vs Risks */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Opportunities vs Risks</h3>
          <p className="text-xs text-slate-500 mb-4">Count per dimension identified by agents</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={oppRiskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="dim" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="opportunities" name="Opportunities" fill={CHART_COLORS.opportunities} radius={[3, 3, 0, 0]} />
              <Bar dataKey="risks"         name="Risks"         fill={CHART_COLORS.risks}         radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Impact Distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Driver Impact Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">High / Medium / Low impact drivers per dimension</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={impactData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="dim" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="High"   name="High"   stackId="a" fill={CHART_COLORS.High}   />
              <Bar dataKey="Medium" name="Medium" stackId="a" fill={CHART_COLORS.Medium} />
              <Bar dataKey="Low"    name="Low"    stackId="a" fill={CHART_COLORS.Low}    radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension Confidence */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Agent Confidence by Dimension</h3>
          <p className="text-xs text-slate-500 mb-4">Self-reported confidence from each dimension agent (0–100%)</p>
          <div className="space-y-3 mt-2">
            {confData.map(({ dim, confidence, color }) => (
              <div key={dim}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{dim}</span>
                  <span className="text-white font-semibold">{confidence}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${confidence}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Market KPIs (company only) */}
      {fundamentals && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Market Snapshot</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Price', value: fundamentals.current_price != null ? `$${fundamentals.current_price.toFixed(2)}` : 'N/A' },
              { label: 'P/E', value: fundamentals.pe_ratio != null ? `${fundamentals.pe_ratio.toFixed(1)}×` : 'N/A' },
              { label: 'Mkt Cap', value: fundamentals.market_cap != null ? `$${(fundamentals.market_cap / 1e9).toFixed(0)}B` : 'N/A' },
              { label: 'Rev Growth', value: fundamentals.revenue_growth != null ? `${(fundamentals.revenue_growth * 100).toFixed(1)}%` : 'N/A' },
              { label: 'Net Margin', value: fundamentals.profit_margin != null ? `${(fundamentals.profit_margin * 100).toFixed(1)}%` : 'N/A' },
              { label: 'FCF', value: fundamentals.free_cashflow != null ? `$${(fundamentals.free_cashflow / 1e9).toFixed(0)}B` : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                <div className="text-slate-500 text-xs mb-1">{label}</div>
                <div className="text-white font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment widget */}
      {sentimentData?.found && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Social Sentiment Overview</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{(sentimentData.composite_buzz ?? 0).toFixed(0)}</div>
              <div className="text-slate-500 text-xs">Buzz / 100</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-black ${(sentimentData.composite_sentiment_score ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(sentimentData.composite_sentiment_score ?? 0) >= 0 ? '+' : ''}{(sentimentData.composite_sentiment_score ?? 0).toFixed(2)}
              </div>
              <div className="text-slate-500 text-xs">Sentiment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">{(sentimentData.composite_bullish_pct ?? 50).toFixed(0)}%</div>
              <div className="text-slate-500 text-xs">Bullish</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-red-400">{(sentimentData.composite_bearish_pct ?? 50).toFixed(0)}%</div>
              <div className="text-slate-500 text-xs">Bearish</div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-600" style={{ width: `${sentimentData.composite_bullish_pct ?? 50}%` }} />
                <div className="h-full bg-red-600" style={{ width: `${sentimentData.composite_bearish_pct ?? 50}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BIG CYCLE DECISION ENGINE TAB
// ═══════════════════════════════════════════════════════════════════
function BigCycleTab({ state, dispatch }) {
  const { subject, subjectType, steepData, synthesis, selectedModel, bigCycleData, bigCycleStatus } = state;

  const runAssessment = async () => {
    dispatch({ type: 'SET_BIG_CYCLE_STATUS', payload: 'loading' });
    try {
      const res = await fetch('/api/big-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, subjectType, steepData, synthesis, model: selectedModel }),
      });
      const json = await res.json();
      if (json.found && json.assessment) {
        dispatch({ type: 'SET_BIG_CYCLE_DATA', data: json.assessment });
      } else {
        dispatch({ type: 'SET_BIG_CYCLE_STATUS', payload: 'error' });
      }
    } catch {
      dispatch({ type: 'SET_BIG_CYCLE_STATUS', payload: 'error' });
    }
  };

  const ScoreBar = ({ score, color = '#3b82f6' }) => (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (score / 10) * 100))}%`, backgroundColor: color }} />
      </div>
      <span className="text-white text-xs font-bold tabular-nums w-5 text-right">{score}</span>
    </div>
  );

  const a = bigCycleData;
  const utilityClass = a ? STRATEGIC_UTILITY_CLASSES.find(c => c.key === a.strategicUtility?.class) : null;
  const severity = a ? classifySeverity(a.overallSeverityScore) : null;
  const cyclePhaseColors = { expansion: '#10b981', late_cycle: '#f59e0b', peak: '#ef4444', contraction: '#ef4444', transition: '#8b5cf6', uncertain: '#64748b' };

  if (!synthesis) {
    return <div className="text-slate-600 text-center py-20">Complete a STEEP analysis first, then run the Big Cycle assessment.</div>;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Big Cycle Decision Engine</h2>
          <p className="text-slate-500 text-sm mt-0.5">Geoeconomic instrument assessment • Strategic utility • Cycle positioning</p>
        </div>
        {bigCycleStatus !== 'loading' && (
          <button onClick={runAssessment} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors flex items-center gap-2">
            <span>⬡</span>
            {bigCycleData ? 'Re-run Assessment' : 'Run Big Cycle Assessment'}
          </button>
        )}
        {bigCycleStatus === 'loading' && (
          <div className="flex items-center gap-2 text-slate-400 text-sm px-4 py-2">
            <Spinner size={16} /><span>Running assessment…</span>
          </div>
        )}
      </div>

      {bigCycleStatus === 'error' && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-400 text-sm">Assessment failed. Please try again.</div>
      )}

      {!bigCycleData && bigCycleStatus === 'idle' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-4">⬡</div>
          <h3 className="text-white font-semibold mb-2">Geoeconomic Intelligence Layer</h3>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            The Big Cycle engine scores geoeconomic instruments, classifies strategic utility, and assesses US capacity positions — grounded in your STEEP analysis context.
          </p>
        </div>
      )}

      {a && (
        <div className="space-y-6">

          {/* Cycle phase + severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Cycle Phase</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-bold capitalize" style={{ color: cyclePhaseColors[a.cyclePhase] || '#64748b' }}>
                  {(a.cyclePhase || 'Unknown').replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{a.cyclePhaseRationale}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Overall Severity Score</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl font-black" style={{ color: severity?.color }}>{a.overallSeverityScore ?? 'N/A'}</span>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ color: severity?.color, backgroundColor: (severity?.color || '#64748b') + '20' }}>{severity?.label}</span>
              </div>
              <ScoreBar score={a.overallSeverityScore ?? 0} color={severity?.color || '#64748b'} />
            </div>
          </div>

          {/* Primary instruments */}
          {(a.primaryInstruments || []).length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHdr>Geoeconomic Instruments</SectionHdr>
              <div className="space-y-5 mt-2">
                {a.primaryInstruments.map((inst, i) => {
                  const scores = inst.attributeScores || {};
                  return (
                    <div key={i} className={i > 0 ? 'pt-5 border-t border-slate-700' : ''}>
                      <h4 className="text-white font-semibold mb-1">{inst.name}</h4>
                      <p className="text-slate-400 text-xs mb-3 leading-relaxed">{inst.relevance}</p>
                      <div className="space-y-2">
                        {INSTRUMENT_ATTRIBUTES.map(attr => (
                          <div key={attr.key} className="flex items-center gap-3">
                            <span className="text-slate-500 text-xs w-28 flex-shrink-0">{attr.icon} {attr.label}</span>
                            <ScoreBar score={scores[attr.key] ?? 0} color="#3b82f6" />
                          </div>
                        ))}
                      </div>
                      {inst.scoreRationale && <p className="text-slate-600 text-xs mt-2 leading-relaxed italic">{inst.scoreRationale}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategic utility + capacities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {a.strategicUtility && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <SectionHdr>Strategic Utility</SectionHdr>
                {utilityClass && (
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: utilityClass.color + '20', color: utilityClass.color }}>
                      {utilityClass.label}
                    </span>
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{a.strategicUtility.rationale}</p>
              </div>
            )}
            {a.capacities && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <SectionHdr>US Geoeconomic Capacities</SectionHdr>
                <div className="space-y-3 mt-2">
                  {GEOECONOMIC_CAPACITIES.map(cap => {
                    const c = a.capacities[cap.key];
                    if (!c) return null;
                    return (
                      <div key={cap.key}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-400 text-xs flex-1">{cap.label}</span>
                          <ScoreBar score={c.score ?? 0} color="#8b5cf6" />
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">{c.rationale}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Company positioning */}
          {a.companyPositioning && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <SectionHdr>Positioning & Adaptation</SectionHdr>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Exposure Channels</p>
                  <ul className="space-y-1">
                    {(a.companyPositioning.exposureChannels || []).map((ch, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2"><span className="text-slate-600 mt-0.5">→</span>{ch}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {a.companyPositioning.primaryRisk && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Primary Risk</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{a.companyPositioning.primaryRisk}</p>
                    </div>
                  )}
                  {a.companyPositioning.primaryOpportunity && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Primary Opportunity</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{a.companyPositioning.primaryOpportunity}</p>
                    </div>
                  )}
                </div>
              </div>
              {a.companyPositioning.cycleAdaptation && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Cycle Adaptation</p>
                  <p className="text-slate-200 text-sm leading-relaxed">{a.companyPositioning.cycleAdaptation}</p>
                </div>
              )}
            </div>
          )}

          {/* Watch items */}
          {(a.keyWatchItems || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {a.keyWatchItems.map((w, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-slate-800 border border-purple-800 text-purple-300 text-xs">👁 {w}</span>
              ))}
            </div>
          )}

          <p className="text-slate-700 text-xs text-center">
            Assessment via {a.model?.split('/').pop()} · {a.generatedAt ? new Date(a.generatedAt).toLocaleString() : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PREDICTION MARKETS TAB
// ═══════════════════════════════════════════════════════════════════

const SPORTS_EXCLUDE_RE = /\b(nba|nfl|nhl|mlb|nascar|mls|ufc|mma|boxing|wrestling|soccer.*score|cricket|rugby|tennis|golf|poker|chess|esports?|fortnite|minecraft|fifa|call of duty|oscar|grammy|emmy|golden globe|tony award|celebrity|kardashian|taylor swift|beyonc|kanye|drake|bieber|harry styles|super bowl|world cup|stanley cup|world series|march madness|fantasy (sport|football|basket|base)|playoff|championship (game|series)|survivor|bachelor|big brother|american idol|reality show|box office|billboard chart|music chart|spotify chart|tiktok follower)\b/i;

function getMarketProb(m) {
  try {
    const prices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : (m.outcomePrices || []);
    if (Array.isArray(prices) && prices.length > 0) return Math.max(0, Math.min(1, parseFloat(prices[0]) || 0.5));
  } catch {}
  return Math.max(0, Math.min(1, parseFloat(m.probability ?? m.lastTradePrice ?? 0.5) || 0.5));
}
function getMarketVol(m) { return parseFloat(m.volume24hr ?? m.volume24h ?? 0) || 0; }
function getMarketLiq(m) { return parseFloat(m.liquidity ?? 0) || 0; }
function fmtMarketUsd(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}
function pmMarketUrl(m) {
  if (m.url) return m.url;
  if (m.slug) return `https://polymarket.com/event/${m.slug}`;
  return 'https://polymarket.com';
}
function passesMarketFilter(m) {
  if (!m.active || m.closed || m.archived) return false;
  if (SPORTS_EXCLUDE_RE.test(m.question || '')) return false;
  const vol = getMarketVol(m);
  const divergence = Math.abs(getMarketProb(m) - 0.5);
  return vol >= 10000 || divergence >= 0.15;
}
function groupPredictionMarkets(markets) {
  const highConviction = [], arbitrage = [], emerging = [];
  for (const m of markets) {
    const prob = getMarketProb(m);
    const vol  = getMarketVol(m);
    const div  = Math.abs(prob - 0.5);
    if (div > 0.25 && vol > 50000)       highConviction.push(m);
    else if (div < 0.10 && vol > 50000)  arbitrage.push(m); // prob 40–60%
    else                                  emerging.push(m);
  }
  return { highConviction, arbitrage, emerging };
}
function isPredictionEarlyWarning(m) {
  // Use actual 24h price delta reported by the Gamma API when available.
  // Polymarket returns oneDayPriceChange as a decimal (e.g. 0.08 = +8pp in 24h).
  const raw = m.oneDayPriceChange ?? m.change24h ?? m.priceChange24h ?? null;
  if (raw === null || raw === undefined) return false;
  const delta = parseFloat(raw);
  return !isNaN(delta) && Math.abs(delta) > 0.05; // >5pp move in 24h
}

function PmMarketCard({ m }) {
  const prob = getMarketProb(m);
  const vol  = getMarketVol(m);
  const liq  = getMarketLiq(m);
  const pct  = Math.round(prob * 100);
  const warn = isPredictionEarlyWarning(m);
  const barColor = prob > 0.70 ? '#10b981' : prob < 0.30 ? '#ef4444' : '#f59e0b';
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-white text-sm font-medium leading-snug flex-1">{m.question}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {warn && <span title="Early-warning: probability moved >5pp in the last 24h — rapidly shifting market signal" className="text-yellow-400 text-sm">⚡</span>}
          <a href={pmMarketUrl(m)} target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors text-base leading-none" title="View on Polymarket">↗</a>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-bold tabular-nums" style={{ color: barColor }}>Yes {pct}¢</span>
          <span className="text-slate-500 tabular-nums">No {100 - pct}¢</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>
      </div>
      {m.steepAngle && (
        <p className="text-slate-500 text-xs leading-snug mb-2 italic">{m.steepAngle}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span><span className="text-slate-400">Vol 24h</span> {fmtMarketUsd(vol)}</span>
        <span><span className="text-slate-400">Liq</span> {fmtMarketUsd(liq)}</span>
        {m.endDate && (
          <span className="ml-auto text-slate-600">
            {new Date(m.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

function PmMarketGroup({ title, icon, description, accent, markets, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (markets.length === 0) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800 transition-colors text-left">
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold text-sm">{title}</span>
          <span className="text-slate-500 text-xs ml-2">{description}</span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: accent, backgroundColor: accent + '20' }}>{markets.length}</span>
        <span className="text-slate-500 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {markets.map(m => <PmMarketCard key={m.id || m.conditionId} m={m} />)}
        </div>
      )}
    </div>
  );
}

// ── Module-level fetch helper (called from App post-synthesis and from the tab's Retry button) ──
async function runPredictionFetch(subject, subjectType, synthesis, dispatch) {
  dispatch({ type: 'SET_PREDICTION_STATUS', payload: 'loading' });

  // Step 1: Generate subject-domain tags + keyword aliases via Groq (fast model)
  // Tags → broad Polymarket tag-based fetches
  // keywordAliases → cheap regex pre-filter before expensive AI scoring
  let keywordAliases = [subject].filter(Boolean);
  let tags           = ['politics', 'world', 'economy', 'ai', 'technology'];
  try {
    const tagRes = await fetch('/api/prediction-markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, subjectType, synthesis }),
    });
    if (tagRes.ok) {
      const tagData = await tagRes.json();
      if (Array.isArray(tagData.keywordAliases) && tagData.keywordAliases.length >= 1) keywordAliases = tagData.keywordAliases;
      if (Array.isArray(tagData.tags)           && tagData.tags.length >= 1)           tags           = tagData.tags;
    }
  } catch { /* fall through to defaults */ }

  // Show keyword aliases in the header so user sees what we're filtering by
  dispatch({ type: 'SET_PREDICTION_TAGS', payload: keywordAliases });

  // Step 2: Fetch broadly by volume + tags, then filter and AI-score server-side
  // Approach: broad fetch → keyword pre-filter → AI relevance scoring (70B model)
  // This replaces the broken _q search approach — Gamma _q does NOT search question text.
  let proxyLowConfidence = false;

  const doProxyFetch = async () => {
    const dedupe = new Map();

    // ── Primary: server-side proxy (volume-pull + keyword pre-filter + AI scoring) ──
    // Fall through to browser-direct ONLY on network error or non-OK status.
    // A successful 200 with zero markets means "no relevant markets found" — honour it.
    try {
      const proxyRes = await fetch('/api/prediction-markets/proxy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ keywordAliases, tags, subject, synthesis }),
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        const markets   = proxyData.markets || [];
        proxyLowConfidence = proxyData.lowConfidence === true;
        for (const m of markets) {
          if (m.id && !dedupe.has(m.id)) dedupe.set(m.id, m);
        }
        // Always return after a successful proxy response — even if markets is empty.
        // Zero markets is a valid "no relevant contracts" signal, not a retry trigger.
        return dedupe;
      }
    } catch { /* fall through to browser-direct on network/parse error only */ }

    // ── Fallback: browser-direct tag fetch (no AI scoring available from browser) ──
    const GAMMA    = 'https://gamma-api.polymarket.com/markets';
    const usedTags = tags.slice(0, 4);
    const results  = await Promise.allSettled(
      usedTags.map(tag =>
        fetch(`${GAMMA}?tag=${encodeURIComponent(tag)}&limit=40&active=true&closed=false`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      )
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        for (const m of r.value) {
          if (m.id && !dedupe.has(m.id)) dedupe.set(m.id, m);
        }
      }
    }
    proxyLowConfidence = true;

    if (dedupe.size === 0) throw new Error('no markets returned from Gamma API');
    return dedupe;
  };

  let dedupe;
  try {
    dedupe = await doProxyFetch();
  } catch {
    // Retry once after 3 seconds on first failure
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
      dedupe = await doProxyFetch();
    } catch {
      dispatch({ type: 'SET_PREDICTION_STATUS', payload: 'error' });
      return;
    }
  }

  const filtered = [...dedupe.values()].filter(passesMarketFilter);
  // Sort by relevanceScore desc (AI-scored), then volume desc as tiebreaker
  filtered.sort((a, b) => {
    const scoreDiff = (b.relevanceScore ?? -1) - (a.relevanceScore ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    return getMarketVol(b) - getMarketVol(a);
  });
  dispatch({ type: 'SET_PREDICTION_MARKETS', data: filtered, fetchedAt: new Date().toISOString(), lowConfidence: proxyLowConfidence });
}

function PredictionMarketsTab({ state, dispatch }) {
  const { subject, subjectType, synthesis, predictionMarkets, predictionStatus, predictionTags, predictionFetchedAt, predictionLowConfidence } = state;

  const fetchMarkets = useCallback(
    () => runPredictionFetch(subject, subjectType, synthesis, dispatch),
    [subject, subjectType, synthesis, dispatch]
  );

  // Safety net: auto-fetch if the tab is opened while status is still idle
  // (the primary trigger is the App-level post-synthesis effect below)
  useEffect(() => {
    if (predictionStatus === 'idle') fetchMarkets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { highConviction, arbitrage, emerging } = predictionMarkets
    ? groupPredictionMarkets(predictionMarkets)
    : { highConviction: [], arbitrage: [], emerging: [] };

  const fetchedLabel = predictionFetchedAt
    ? new Date(predictionFetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Prediction Markets</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Live Polymarket contracts related to <span className="text-slate-300 font-medium">{subject}</span>
            {predictionTags?.length > 0 && (
              <> · <span className="text-slate-600 text-xs">filtering by: {predictionTags.slice(0, 5).join(', ')}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {predictionStatus === 'complete' && predictionMarkets?.length > 0 && (
            <span className="text-slate-600 text-xs">{predictionMarkets.length} markets</span>
          )}
          {fetchedLabel && <span className="text-slate-600 text-xs">· Updated {fetchedLabel}</span>}
          {predictionStatus !== 'loading' && (
            <button onClick={fetchMarkets}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1.5">
              <span>↻</span> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {predictionStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size={28} />
          <p className="text-slate-500 text-sm">Scanning Polymarket for relevant contracts…</p>
          <p className="text-slate-700 text-xs">Broad volume pull · keyword filter · AI relevance scoring</p>
        </div>
      )}

      {/* Error */}
      {predictionStatus === 'error' && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">◎</div>
          <h3 className="text-white font-semibold mb-2">Could not reach Polymarket</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Polymarket's Gamma API uses browser-direct connection (bypasses Cloudflare JA3). If you're on a restrictive network or VPN, the API may be unreachable.
          </p>
          <button onClick={fetchMarkets}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* No results */}
      {predictionStatus === 'complete' && predictionMarkets?.length === 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">◎</div>
          <h3 className="text-white font-semibold mb-2">No relevant markets found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No active Polymarket contracts match this subject with sufficient volume or price conviction. Try refreshing or check back when more contracts are active.
          </p>
        </div>
      )}

      {/* Results */}
      {predictionStatus === 'complete' && predictionMarkets?.length > 0 && (
        <>
          {predictionLowConfidence && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>No high-confidence matches found for this subject on Polymarket. Showing closest available markets — treat signals with caution.</span>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span><span className="text-yellow-400">⚡</span> Price moved &gt;5pp in 24h — rapidly shifting signal</span>
            <span><span className="text-emerald-400">■</span> Green = Yes &gt;70%</span>
            <span><span className="text-red-400">■</span> Red = No &gt;70%</span>
            <span><span className="text-yellow-500">■</span> Amber = contested</span>
          </div>

          <PmMarketGroup
            title="High Conviction"
            icon="◉"
            description="Strong price signal · vol > $50K"
            accent="#10b981"
            markets={highConviction}
            defaultOpen={true}
          />
          <PmMarketGroup
            title="Arbitrage Watch"
            icon="⇄"
            description="Near 50/50 but heavily traded — market is contested"
            accent="#f59e0b"
            markets={arbitrage}
            defaultOpen={true}
          />
          <PmMarketGroup
            title="Emerging Signals"
            icon="◈"
            description="Lower volume · strong directional pricing"
            accent="#8b5cf6"
            markets={emerging}
            defaultOpen={false}
          />

          <p className="text-slate-700 text-xs text-center pt-2">
            {predictionMarkets.length} markets after filtering · Sports &amp; entertainment excluded · Min $10K vol or |p−50%| ≥ 15%
          </p>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// THOUGHT LEADERSHIP — Blog / Repository Panel
// ═══════════════════════════════════════════════════════════════════

// Inline text: bold, italic, code, links
function tlInlineHtml(raw) {
  return raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#1e293b;padding:.15em .4em;border-radius:4px;font-size:.82em;color:#94a3b8;font-family:monospace">$1</code>')
    // Inline images must come before links so ![alt](url) is not partially consumed as [alt](url)
    .replace(/!\[([^\]]*)\]\(([^)\s"]+)[^)]*\)/g,
      (_, alt, url) => `<img src="${url}" alt="${alt || 'Image'}" style="max-width:100%;border-radius:8px;display:block;margin:10px auto" />`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:underline">$1</a>');
}

// Block-level markdown → React elements (handles images, headings, lists, code, quotes, hr)
function TLMarkdown({ md }) {
  if (!md) return null;
  // Normalise Windows / old-Mac line endings so the parser works on any source
  const normalised = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalised.split('\n');
  const out = [];
  let i = 0, k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      out.push(
        <pre key={k++} className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-xs text-slate-300 font-mono overflow-x-auto my-5 leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Standalone image: ![alt](url)  — use trimmed so indented images are caught
    const imgM = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
      const [, alt, url] = imgM;
      out.push(
        <figure key={k++} className="my-7">
          <img
            src={url}
            alt={alt || ''}
            className="w-full rounded-2xl object-cover shadow-lg"
            style={{ maxHeight: 420 }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          {alt && <figcaption className="text-center text-xs text-slate-500 mt-2 italic">{alt}</figcaption>}
        </figure>
      );
      i++; continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      out.push(<hr key={k++} className="border-slate-800 my-8" />);
      i++; continue;
    }

    // GFM Table — lines that start with |
    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const isSep = (row) => /^\|[\s|:-]+\|$/.test(row);
      const parseRow = (row) =>
        row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

      const dataRows = tableLines.filter(r => !isSep(r));
      if (dataRows.length > 0) {
        const headers = parseRow(dataRows[0]);
        const bodyRows = dataRows.slice(1).map(parseRow);
        out.push(
          <div key={k++} className="my-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800/70">
                  {headers.map((h, idx) => (
                    <th key={idx} className="text-left px-4 py-2.5 text-slate-300 font-semibold text-xs uppercase tracking-wider border-b border-slate-700"
                      dangerouslySetInnerHTML={{ __html: tlInlineHtml(h) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ridx) => (
                  <tr key={ridx} className={ridx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/20'}>
                    {headers.map((_, cidx) => (
                      <td key={cidx} className="px-4 py-2 text-slate-300 text-xs border-b border-slate-800/60"
                        dangerouslySetInnerHTML={{ __html: tlInlineHtml(row[cidx] ?? '') }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Headings — use trimmed so any leading whitespace doesn't break detection
    if (trimmed.startsWith('#### ')) {
      out.push(<h4 key={k++} className="text-slate-300 text-sm font-bold mt-5 mb-1.5" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(5)) }} />);
      i++; continue;
    }
    if (trimmed.startsWith('### ')) {
      out.push(<h3 key={k++} className="text-slate-200 text-base font-bold mt-6 mb-2" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(4)) }} />);
      i++; continue;
    }
    if (trimmed.startsWith('## ')) {
      out.push(<h2 key={k++} className="text-white text-xl font-bold mt-8 mb-3 leading-snug pb-2 border-b border-slate-800" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(3)) }} />);
      i++; continue;
    }
    if (trimmed.startsWith('# ')) {
      out.push(<h1 key={k++} className="text-white text-2xl font-black mt-8 mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: tlInlineHtml(trimmed.slice(2)) }} />);
      i++; continue;
    }

    // Blockquote — use trimmed for detection, strip the leading "> "
    if (trimmed.startsWith('> ')) {
      const ql = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        ql.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(
        <blockquote key={k++} className="border-l-4 border-blue-500 pl-5 py-0.5 my-5">
          <p className="text-slate-300 italic text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(ql.join(' ')) }} />
        </blockquote>
      );
      continue;
    }

    // Bullet list — use trimmed so indented bullets are caught
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const t = lines[i].trim();
        items.push(<li key={i} className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(t.slice(2)) }} />);
        i++;
      }
      out.push(<ul key={k++} className="my-4 pl-5 space-y-1.5 list-disc marker:text-slate-600">{items}</ul>);
      continue;
    }

    // Numbered list — use trimmed
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(<li key={i} className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: tlInlineHtml(lines[i].trim().replace(/^\d+\.\s/, '')) }} />);
        i++;
      }
      out.push(<ol key={k++} className="my-4 pl-5 space-y-1.5 list-decimal marker:text-slate-500">{items}</ol>);
      continue;
    }

    // Paragraph — aggregate consecutive prose lines (stop at any block-level token)
    const para = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;                                    // blank line → new paragraph
      if (t.startsWith('#')) break;                     // heading
      if (t.startsWith('- ') || t.startsWith('* ')) break; // bullet
      if (/^\d+\.\s/.test(t)) break;                   // numbered list
      if (t.startsWith('> ')) break;                    // blockquote
      if (t.startsWith('```')) break;                   // code fence
      if (t.startsWith('|')) break;                     // table
      if (/^!\[/.test(t)) break;                        // standalone image
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) break;    // hr
      para.push(lines[i]);
      i++;
    }

    if (para.length) {
      out.push(<p key={k++} className="text-slate-300 text-sm leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: tlInlineHtml(para.join('\n')) }} />);
    }
  }
  return <>{out}</>;
}

// ── Parse extracted markdown into structured fields ─────────────
function parseDocContent(md, images) {
  const lines = md.split('\n');
  let title = '';
  let titleIdx = -1;

  // First H1 → title
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].slice(2).trim();
      titleIdx = i;
      break;
    }
  }

  // Remove the title line from body
  const bodyLines = titleIdx >= 0 ? [...lines.slice(0, titleIdx), ...lines.slice(titleIdx + 1)] : lines;
  const body = bodyLines.join('\n').replace(/^\n+/, '').trim();

  // First prose paragraph as dek candidate
  let dek = '';
  for (const l of bodyLines) {
    const t = l.trim();
    if (t && !t.startsWith('#') && !t.startsWith('!') && !t.startsWith('-') && !t.startsWith('*') && !t.startsWith('>')) {
      dek = t.slice(0, 220);
      break;
    }
  }

  // First extracted image as hero
  const heroImageUrl = images[0] || '';

  return { title, dek, content: body, heroImageUrl };
}

// ── Publish Modal (3-step: auth → upload → review) ──────────────
function TLPublishModal({ onClose, onPublished }) {
  const [step, setStep]           = useState('auth');   // 'auth' | 'upload' | 'review'
  const [token, setToken]         = useState('');
  const [authChecking, setAuthChecking] = useState(false);
  const [authErr, setAuthErr]     = useState('');

  const [dragOver, setDragOver]   = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState('');
  const [extractedImages, setExtractedImages] = useState([]);

  const [form, setForm] = useState({ title: '', dek: '', geoKeywords: '', contentMarkdown: '', heroImageUrl: '' });
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState('');

  const fileInputRef      = useRef(null);
  const heroImgInputRef   = useRef(null);
  const inlineImgInputRef = useRef(null);
  const contentRef        = useRef(null);
  const [heroUploading, setHeroUploading]     = useState(false);
  const [heroUploadErr, setHeroUploadErr]     = useState('');
  const [inlineUploading, setInlineUploading] = useState(false);
  const [inlineUploadErr, setInlineUploadErr] = useState('');

  // Clear any previously cached token the moment the modal opens
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('tl_admin_token');
  }, []);

  // ── Auth ────────────────────────────────────────────────────────
  const verifyToken = async () => {
    if (!token.trim()) { setAuthErr('Enter your admin publishing key.'); return; }
    setAuthChecking(true); setAuthErr('');
    try {
      const res = await fetch('/api/thought-leadership/admin', { headers: { 'x-admin-token': token } });
      if (res.ok || res.status === 200) {
        setStep('upload');
      } else {
        setAuthErr('Invalid key — please check and try again.');
      }
    } catch { setAuthErr('Could not verify — check your connection.'); }
    setAuthChecking(false);
  };

  // ── Extract ─────────────────────────────────────────────────────
  const extractFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      setExtractErr('Please upload a Word document (.docx or .doc).');
      return;
    }
    setExtracting(true); setExtractErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      const images = data.images || [];
      const parsed = parseDocContent(data.text || '', images);
      setExtractedImages(images);
      setForm({
        title: parsed.title,
        dek: parsed.dek,
        geoKeywords: '',
        contentMarkdown: parsed.content,
        heroImageUrl: parsed.heroImageUrl,
      });
      setStep('review');
    } catch (e) { setExtractErr(e.message); }
    setExtracting(false);
  };

  // ── Hero image upload ────────────────────────────────────────────
  const uploadHeroImage = async (file) => {
    if (!file) return;
    setHeroUploading(true); setHeroUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, heroImageUrl: data.url }));
      setExtractedImages(prev => prev.includes(data.url) ? prev : [data.url, ...prev]);
    } catch (e) { setHeroUploadErr(e.message); }
    setHeroUploading(false);
  };

  // ── Inline image upload (insert at cursor) ──────────────────────
  const uploadInlineImage = async (file) => {
    if (!file) return;
    setInlineUploading(true); setInlineUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const snippet = `\n\n![${label}](${data.url})\n\n`;
      const ta = contentRef.current;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const before = form.contentMarkdown.slice(0, start);
        const after  = form.contentMarkdown.slice(start);
        setForm(f => ({ ...f, contentMarkdown: before + snippet + after }));
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + snippet.length; ta.focus(); }, 30);
      } else {
        setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown + snippet }));
      }
      setExtractedImages(prev => prev.includes(data.url) ? prev : [...prev, data.url]);
    } catch (e) { setInlineUploadErr(e.message); }
    setInlineUploading(false);
  };

  // ── Publish ─────────────────────────────────────────────────────
  const publish = async () => {
    if (!form.title.trim()) { setPublishErr('A title is required.'); return; }
    setPublishing(true); setPublishErr('');
    try {
      const payload = {
        title: form.title.trim(),
        dek: form.dek.trim(),
        contentMarkdown: form.contentMarkdown,
        heroImageUrl: form.heroImageUrl || '',
        geoKeywords: form.geoKeywords.split(',').map(s => s.trim()).filter(Boolean),
        status: 'published',
      };
      const res = await fetch('/api/thought-leadership/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      onPublished(token);  // pass token so parent can enter admin mode
      onClose();
    } catch (e) { setPublishErr(e.message); }
    setPublishing(false);
  };

  // ── Drag-and-drop ───────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractFile(file);
  };

  // ── Step labels ─────────────────────────────────────────────────
  const STEPS = ['Authenticate', 'Import Document', 'Review & Publish'];
  const stepIdx = { auth: 0, upload: 1, review: 2 }[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">Publish Article</h2>
            <p className="text-slate-500 text-xs mt-0.5">Upload a Word document to publish as a blog post</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-4 border-b border-slate-800 flex-shrink-0">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 text-xs font-semibold ${idx === stepIdx ? 'text-white' : idx < stepIdx ? 'text-emerald-400' : 'text-slate-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === stepIdx ? 'bg-blue-600 text-white' : idx < stepIdx ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-600'}`}>
                  {idx < stepIdx ? '✓' : idx + 1}
                </div>
                <span className="hidden sm:block">{label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`w-8 h-px mx-3 ${idx < stepIdx ? 'bg-emerald-700' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── Step 1: Auth ── */}
          {step === 'auth' && (
            <div className="space-y-5 max-w-sm mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto">🔑</div>
                <p className="text-white font-semibold">Enter your admin publishing key</p>
                <p className="text-slate-500 text-xs">This is the <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded text-xs">ADMIN_PUBLISH_TOKEN</code> set in your environment.</p>
              </div>
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setAuthErr(''); }}
                onKeyDown={e => e.key === 'Enter' && verifyToken()}
                placeholder="Paste your admin key…"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {authErr && <p className="text-red-400 text-xs text-center">{authErr}</p>}
              <button
                onClick={verifyToken}
                disabled={authChecking}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
              >
                {authChecking ? 'Verifying…' : 'Continue →'}
              </button>
            </div>
          )}

          {/* ── Step 2: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-white font-semibold">Upload your Word document</p>
                <p className="text-slate-500 text-xs">Text and embedded graphics will be extracted automatically</p>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !extracting && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 py-14 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  extracting ? 'border-blue-600 bg-blue-950/20' : dragOver ? 'border-blue-500 bg-blue-950/10' : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                }`}
              >
                {extracting ? (
                  <>
                    <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <p className="text-blue-400 text-sm font-semibold">Extracting content &amp; graphics…</p>
                    <p className="text-slate-600 text-xs">This may take a moment for large documents</p>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">📄</span>
                    <div className="text-center">
                      <p className="text-white text-sm font-semibold">{dragOver ? 'Drop to import' : 'Drop your .docx here'}</p>
                      <p className="text-slate-500 text-xs mt-1">or click to browse · .docx / .doc</p>
                    </div>
                  </>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept=".docx,.doc" className="sr-only" onChange={e => { if (e.target.files?.[0]) extractFile(e.target.files[0]); e.target.value = ''; }} />
              {extractErr && <p className="text-red-400 text-xs text-center">{extractErr}</p>}
            </div>
          )}

          {/* ── Step 3: Review & Publish ── */}
          {step === 'review' && (
            <div className="space-y-5">

              {/* Cover image — hidden file input */}
              <input
                ref={heroImgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadHeroImage(e.target.files[0]); e.target.value = ''; }}
              />

              {/* Cover image preview */}
              {form.heroImageUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={form.heroImageUrl} alt="Cover" className="w-full object-cover rounded-xl" style={{ maxHeight: 220 }} />
                  <div className="absolute top-2 right-2 flex gap-2">
                    {extractedImages.filter(u => u !== form.heroImageUrl).map((url, idx) => (
                      <button key={idx} onClick={() => setForm(f => ({ ...f, heroImageUrl: url }))}
                        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-400 transition-colors">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      onClick={() => heroImgInputRef.current?.click()}
                      title="Replace cover image"
                      className="w-8 h-8 rounded-lg bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">↑</button>
                    <button onClick={() => setForm(f => ({ ...f, heroImageUrl: '' }))}
                      className="w-8 h-8 rounded-lg bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">✕</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {extractedImages.length > 0 && (
                    <>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Extracted images — pick a cover</p>
                      <div className="flex gap-2 flex-wrap">
                        {extractedImages.map((url, idx) => (
                          <button key={idx} onClick={() => setForm(f => ({ ...f, heroImageUrl: url }))}
                            className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-blue-400 transition-colors">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => heroImgInputRef.current?.click()}
                    disabled={heroUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 w-full justify-center"
                  >
                    {heroUploading ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M3 6l4-4 4 4M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {heroUploading ? 'Uploading…' : 'Upload cover image'}
                  </button>
                  {heroUploadErr && <p className="text-red-400 text-xs">{heroUploadErr}</p>}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Article title…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Dek */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Subtitle</label>
                <input
                  value={form.dek}
                  onChange={e => setForm(f => ({ ...f, dek: e.target.value }))}
                  placeholder="A short sentence that hooks the reader…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">GEO Tags <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
                <input
                  value={form.geoKeywords}
                  onChange={e => setForm(f => ({ ...f, geoKeywords: e.target.value }))}
                  placeholder="e.g. tariffs, China, supply chain"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Content */}
              <div>
                {/* hidden input for inline image picker */}
                <input
                  ref={inlineImgInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) uploadInlineImage(e.target.files[0]); e.target.value = ''; }}
                />

                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Content</label>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs">{form.contentMarkdown.split(/\s+/).filter(Boolean).length} words · {extractedImages.length} image{extractedImages.length !== 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      onClick={() => inlineImgInputRef.current?.click()}
                      disabled={inlineUploading}
                      title="Upload an image and insert it at cursor position"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                    >
                      {inlineUploading ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4.5" cy="4.5" r="1.2" fill="currentColor"/><path d="M1 9.5l3-3 2.5 2.5 2-2L13 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                      {inlineUploading ? 'Uploading…' : 'Insert image'}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={contentRef}
                  value={form.contentMarkdown}
                  onChange={e => setForm(f => ({ ...f, contentMarkdown: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-slate-600 font-mono leading-loose resize-none transition-colors"
                  style={{ minHeight: 260 }}
                />
                {inlineUploadErr && <p className="text-red-400 text-xs mt-1">{inlineUploadErr}</p>}
              </div>

              {publishErr && <p className="text-red-400 text-xs">{publishErr}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 flex-shrink-0 gap-3">
            <button onClick={() => setStep('upload')} className="text-slate-500 hover:text-white text-sm transition-colors">← Re-upload</button>
            <button
              onClick={publish}
              disabled={publishing || !form.title.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
            >
              {publishing ? 'Publishing…' : 'Publish Article'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Innovator Illumination publish modal ──────────────────────────
function IIPublishModal({ onClose, onPublished, initialToken = '', initialPost = null }) {
  const isEdit = !!initialPost;
  const [step, setStep]               = useState(initialToken ? 'form' : 'auth');
  const [token, setToken]             = useState(initialToken);
  const [authChecking, setAuthChecking] = useState(false);
  const [authErr, setAuthErr]         = useState('');

  const [form, setForm] = useState({
    title:           initialPost?.title           || '',
    logoUrl:         initialPost?.logoUrl         || '',
    techSegment:     initialPost?.techSegment     || '',
    solutionOverview: initialPost?.solutionOverview || '',
    contentMarkdown: initialPost?.contentMarkdown  || '',
    heroImageUrl:    initialPost?.heroImageUrl     || '',
    geoKeywords:     (initialPost?.geoKeywords || []).join(', '),
  });
  const [publishing, setPublishing]   = useState(false);
  const [publishErr, setPublishErr]   = useState('');

  const inlineImgInputRef = useRef(null);
  const contentRef      = useRef(null);
  const [logoUploading, setLogoUploading]     = useState(false);
  const [logoUploadErr, setLogoUploadErr]     = useState('');
  const [heroUploading, setHeroUploading]     = useState(false);
  const [heroUploadErr, setHeroUploadErr]     = useState('');
  const [inlineUploading, setInlineUploading] = useState(false);
  const [inlineUploadErr, setInlineUploadErr] = useState('');

  const [showDocImport, setShowDocImport]     = useState(false);
  const [docUploading, setDocUploading]       = useState(null); // 'word' | 'report' | null
  const [extractedWord, setExtractedWord]     = useState('');
  const [extractedReport, setExtractedReport] = useState('');
  const [docExtractErr, setDocExtractErr]     = useState('');
  const [refining, setRefining]               = useState(false);
  const [refineMsg, setRefineMsg]             = useState('');
  const [refineMsgType, setRefineMsgType]     = useState('success');

  // ── Auth ─────────────────────────────────────────────────────────
  const verifyToken = async () => {
    if (!token.trim()) { setAuthErr('Enter your admin publishing key.'); return; }
    setAuthChecking(true); setAuthErr('');
    try {
      const res = await fetch('/api/innovator-illumination/admin', { headers: { 'x-admin-token': token } });
      if (res.ok) { setStep('form'); }
      else { setAuthErr('Invalid key — please check and try again.'); }
    } catch { setAuthErr('Could not verify — check your connection.'); }
    setAuthChecking(false);
  };

  // ── Image uploads ────────────────────────────────────────────────
  const uploadImage = async (file, field, setUploading, setErr) => {
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, [field]: data.url }));
    } catch (e) { setErr(e.message); }
    setUploading(false);
  };

  const uploadInlineImage = async (file) => {
    if (!file) return;
    setInlineUploading(true); setInlineUploadErr('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', headers: { 'x-admin-token': token }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      const label = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const snippet = `\n\n![${label}](${data.url})\n\n`;
      const ta = contentRef.current;
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const before = form.contentMarkdown.slice(0, start);
        const after  = form.contentMarkdown.slice(start);
        setForm(f => ({ ...f, contentMarkdown: before + snippet + after }));
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + snippet.length; ta.focus(); }, 30);
      } else {
        setForm(f => ({ ...f, contentMarkdown: f.contentMarkdown + snippet }));
      }
    } catch (e) { setInlineUploadErr(e.message); }
    setInlineUploading(false);
  };

  // ── Document extraction ──────────────────────────────────────────
  const extractDocFile = async (file, key) => {
    setDocUploading(key); setDocExtractErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      if (key === 'word') setExtractedWord(data.text || '');
      else setExtractedReport(data.text || '');
    } catch (e) { setDocExtractErr(e.message); }
    setDocUploading(null);
  };

  // ── AI content refinement ─────────────────────────────────────────
  const refineIIContent = async (mode) => {
    const articleText = mode === 'refine' ? (extractedWord || form.contentMarkdown) : form.contentMarkdown;
    if (!articleText && !extractedReport) { setRefineMsg('No content to optimise'); setRefineMsgType('error'); return; }
    setRefining(true); setRefineMsg('');
    try {
      const res = await fetch('/api/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: articleText, reportText: mode === 'integrate' ? extractedReport : undefined, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refinement failed');
      setForm(f => ({ ...f, contentMarkdown: data.refined }));
      setRefineMsg(mode === 'integrate' ? `STEEP data integrated — ${data.tokens?.toLocaleString() || '—'} tokens` : `Content optimised — ${data.tokens?.toLocaleString() || '—'} tokens`);
      setRefineMsgType('success');
    } catch (e) { setRefineMsg(e.message); setRefineMsgType('error'); }
    setRefining(false);
  };

  // ── Publish / Update ─────────────────────────────────────────────
  const publish = async () => {
    if (!form.title.trim()) { setPublishErr('A company name is required.'); return; }
    setPublishing(true); setPublishErr('');
    try {
      const payload = {
        ...(isEdit && initialPost?.id ? { id: initialPost.id } : {}),
        title:           form.title.trim(),
        dek:             form.solutionOverview.trim(),
        logoUrl:         form.logoUrl.trim(),
        techSegment:     form.techSegment.trim(),
        solutionOverview: form.solutionOverview.trim(),
        contentMarkdown: form.contentMarkdown,
        heroImageUrl:    form.heroImageUrl.trim(),
        geoKeywords:     form.geoKeywords.split(',').map(s => s.trim()).filter(Boolean),
        status:          'published',
      };
      const res = await fetch('/api/innovator-illumination/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      onPublished(token, data.post);
      onClose();
    } catch (e) { setPublishErr(e.message); }
    setPublishing(false);
  };

  const STEPS = ['Authenticate', 'Enter Details', 'Preview & Publish'];
  const stepIdx = step === 'auth' ? 0 : step === 'form' ? 1 : 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">{isEdit ? 'Edit Innovator' : 'Add Innovator'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{isEdit ? 'Update this solution provider profile' : 'Showcase an innovative solution provider'}</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-4 border-b border-slate-800 flex-shrink-0">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 text-xs font-semibold ${idx === stepIdx ? 'text-white' : idx < stepIdx ? 'text-emerald-400' : 'text-slate-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === stepIdx ? 'bg-blue-600 text-white' : idx < stepIdx ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-600'}`}>
                  {idx < stepIdx ? '✓' : idx + 1}
                </div>
                <span className="hidden sm:block">{label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`w-8 h-px mx-3 ${idx < stepIdx ? 'bg-emerald-700' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Auth step */}
          {step === 'auth' && (
            <div className="space-y-5 max-w-sm mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto">💡</div>
                <p className="text-white font-semibold">Enter your admin publishing key</p>
                <p className="text-slate-500 text-xs">This is the <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded text-xs">ADMIN_PUBLISH_TOKEN</code> set in your environment.</p>
              </div>
              <input
                type="password"
                value={token}
                onChange={e => { setToken(e.target.value); setAuthErr(''); }}
                onKeyDown={e => e.key === 'Enter' && verifyToken()}
                placeholder="Paste your admin key…"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {authErr && <p className="text-red-400 text-xs text-center">{authErr}</p>}
              <button
                onClick={verifyToken}
                disabled={authChecking}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}
              >
                {authChecking ? 'Verifying…' : 'Continue →'}
              </button>
            </div>
          )}

          {/* Form step */}
          {step === 'form' && (
            <div className="space-y-5">

              {/* Hidden inline-image input (cursor-position aware) */}
              <input ref={inlineImgInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="sr-only"
                onChange={e => { if (e.target.files?.[0]) uploadInlineImage(e.target.files[0]); e.target.value = ''; }} />

              {/* Logo + preview */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Company Logo</label>
                <div className="flex items-center gap-3">
                  {/* Logo preview */}
                  <div className="w-14 h-14 rounded-xl border border-slate-700 flex-shrink-0 overflow-hidden bg-slate-900 flex items-center justify-center">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                    ) : (
                      <span className="text-slate-600 text-xl font-black">{form.title ? form.title[0].toUpperCase() : '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      value={form.logoUrl}
                      onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png or upload below"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                    />
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors cursor-pointer ${logoUploading ? 'opacity-40 pointer-events-none' : ''}`}>
                      {logoUploading ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M3 6l4-4 4 4M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {logoUploading ? 'Uploading…' : 'Upload logo file'}
                      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="sr-only" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'logoUrl', setLogoUploading, setLogoUploadErr); e.target.value = ''; }} />
                    </label>
                    {logoUploadErr && <p className="text-red-400 text-xs">{logoUploadErr}</p>}
                  </div>
                </div>
              </div>

              {/* Company name */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Company Name <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Acme Technologies"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Technology segment */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Technology Segment</label>
                <input
                  value={form.techSegment}
                  onChange={e => setForm(f => ({ ...f, techSegment: e.target.value }))}
                  placeholder="e.g. AI Infrastructure, Quantum Computing, Climate Tech…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Solution overview */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">Solution Overview <span className="normal-case font-normal text-slate-600">(tagline)</span></label>
                <input
                  value={form.solutionOverview}
                  onChange={e => setForm(f => ({ ...f, solutionOverview: e.target.value }))}
                  placeholder="One-line description of what this company does…"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* Hero image */}
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5">Hero / Cover Image <span className="normal-case font-normal text-slate-600">(optional)</span></p>
                {form.heroImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden group">
                    <img src={form.heroImageUrl} alt="Cover" className="w-full object-cover rounded-xl" style={{ maxHeight: 160 }} />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="w-7 h-7 rounded-lg bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 cursor-pointer" title="Replace cover image">
                        ↑
                        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'heroImageUrl', setHeroUploading, setHeroUploadErr); e.target.value = ''; }} />
                      </label>
                      <button type="button" onClick={() => setForm(f => ({ ...f, heroImageUrl: '' }))} className="w-7 h-7 rounded-lg bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">✕</button>
                    </div>
                    {heroUploading && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div>}
                  </div>
                ) : (
                  <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors w-full cursor-pointer ${heroUploading ? 'opacity-40 pointer-events-none' : ''}`}>
                    {heroUploading ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M3 6l4-4 4 4M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {heroUploading ? 'Uploading…' : 'Upload cover image'}
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'heroImageUrl', setHeroUploading, setHeroUploadErr); e.target.value = ''; }} />
                  </label>
                )}
                {heroUploadErr && <p className="text-red-400 text-xs mt-1">{heroUploadErr}</p>}
              </div>

              {/* GEO keywords */}
              <div>
                <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1.5 block">GEO Tags <span className="normal-case font-normal text-slate-600">(comma-separated)</span></label>
                <input
                  value={form.geoKeywords}
                  onChange={e => setForm(f => ({ ...f, geoKeywords: e.target.value }))}
                  placeholder="e.g. AI, semiconductor, defence tech"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              {/* ── Document Import & AI Optimization ── */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDocImport(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">📎</span>
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Document Import &amp; AI Optimization</span>
                    {(extractedWord || extractedReport) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700 font-semibold">
                        {[extractedWord && 'Doc', extractedReport && 'STEEP'].filter(Boolean).join(' + ')} ready
                      </span>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`text-slate-500 transition-transform flex-shrink-0 ml-2 ${showDocImport ? 'rotate-180' : ''}`}>
                    <path d="M2 4l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {showDocImport && (
                  <div className="px-4 py-4 space-y-4 bg-slate-950 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1.5">Company Doc / Profile</p>
                        <label className={`flex flex-col items-center gap-1.5 border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors text-center ${docUploading === 'word' ? 'border-blue-600 bg-blue-950/20 pointer-events-none' : extractedWord ? 'border-emerald-700 bg-emerald-950/20' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'}`}>
                          <span className="text-xl">{extractedWord ? '✅' : '📄'}</span>
                          <span className="text-xs text-slate-400 px-2 leading-snug">{docUploading === 'word' ? 'Reading…' : extractedWord ? 'Loaded — click to replace' : '.docx / .doc'}</span>
                          <input type="file" accept=".docx,.doc" className="sr-only" onChange={e => { if (e.target.files?.[0]) extractDocFile(e.target.files[0], 'word'); e.target.value = ''; }} />
                        </label>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1.5">STEEP Report PDF</p>
                        <label className={`flex flex-col items-center gap-1.5 border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors text-center ${docUploading === 'report' ? 'border-blue-600 bg-blue-950/20 pointer-events-none' : extractedReport ? 'border-emerald-700 bg-emerald-950/20' : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'}`}>
                          <span className="text-xl">{extractedReport ? '✅' : '📊'}</span>
                          <span className="text-xs text-slate-400 px-2 leading-snug">{docUploading === 'report' ? 'Reading…' : extractedReport ? 'Loaded — click to replace' : '.pdf'}</span>
                          <input type="file" accept=".pdf" className="sr-only" onChange={e => { if (e.target.files?.[0]) extractDocFile(e.target.files[0], 'report'); e.target.value = ''; }} />
                        </label>
                      </div>
                    </div>

                    {docExtractErr && <p className="text-red-400 text-xs">{docExtractErr}</p>}

                    <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => refineIIContent('refine')}
                        disabled={refining || (!extractedWord && !form.contentMarkdown) || !!docUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)' }}
                      >
                        {refining ? <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : null}
                        {refining ? 'Optimising…' : 'Optimise Format'}
                      </button>
                      <button
                        type="button"
                        onClick={() => refineIIContent('integrate')}
                        disabled={refining || !extractedReport || !!docUploading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                        style={{ background: 'linear-gradient(135deg,#065f46,#1e3a5f)' }}
                      >
                        {refining ? <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : null}
                        {refining ? 'Integrating…' : 'Integrate STEEP Data'}
                      </button>
                      {refineMsg && !refining && (
                        <span className={`text-xs font-medium ${refineMsgType === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {refineMsgType === 'success' ? '✓ ' : '✗ '}{refineMsg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Full Profile / Content <span className="normal-case font-normal text-slate-600">(markdown)</span></label>
                  <button
                    type="button"
                    onClick={() => inlineImgInputRef.current?.click()}
                    disabled={inlineUploading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    {inlineUploading
                      ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4.5" cy="4.5" r="1.2" fill="currentColor"/><path d="M1 9.5l3-3 2.5 2.5 2-2L13 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {inlineUploading ? 'Uploading…' : 'Insert image'}
                  </button>
                </div>
                <textarea
                  ref={contentRef}
                  value={form.contentMarkdown}
                  onChange={e => setForm(f => ({ ...f, contentMarkdown: e.target.value }))}
                  placeholder="Detailed company profile, capabilities, key differentiators… (supports Markdown)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-slate-600 font-mono leading-loose resize-none transition-colors"
                  style={{ minHeight: 200 }}
                />
                {inlineUploadErr && <p className="text-red-400 text-xs mt-1">{inlineUploadErr}</p>}
              </div>

              {publishErr && <p className="text-red-400 text-xs">{publishErr}</p>}
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-white font-semibold">Card preview</p>
                <p className="text-slate-500 text-xs">This is how the innovator will appear in the directory grid</p>
              </div>

              {/* Live card preview */}
              <div className="flex justify-center">
                <div className="w-72 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
                  {form.heroImageUrl && (
                    <div className="h-24 overflow-hidden bg-slate-800">
                      <img src={form.heroImageUrl} alt={form.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.parentElement.style.display='none'; }} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {form.logoUrl
                          ? <img src={form.logoUrl} alt={form.title} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                          : <span className="text-white text-sm font-black">{(form.title||'?')[0].toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight truncate">{form.title || 'Company Name'}</h3>
                        {form.techSegment && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block" style={{ background: '#0891b215', color: '#22d3ee' }}>{form.techSegment}</span>
                        )}
                      </div>
                    </div>
                    {form.solutionOverview && <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2">{form.solutionOverview}</p>}
                    {form.geoKeywords && (
                      <div className="flex flex-wrap gap-1">
                        {form.geoKeywords.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map((t, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {publishErr && <p className="text-red-400 text-xs text-center">{publishErr}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'form' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 flex-shrink-0 gap-3">
            <button onClick={() => setStep('auth')} className="text-slate-500 hover:text-white text-sm transition-colors">← Back</button>
            <button
              onClick={() => { if (!form.title.trim()) { setPublishErr('A company name is required.'); return; } setPublishErr(''); setStep('preview'); }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
              style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}
            >
              Preview →
            </button>
          </div>
        )}
        {step === 'preview' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 flex-shrink-0 gap-3">
            <button onClick={() => setStep('form')} className="text-slate-500 hover:text-white text-sm transition-colors">← Edit Details</button>
            <button
              onClick={publish}
              disabled={publishing}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}
            >
              {publishing ? 'Publishing…' : 'Publish Innovator'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ThoughtLeadershipPanel() {
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [search, setSearch]           = useState('');
  const [activeTag, setActiveTag]     = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [tlShareToast, setTlShareToast] = useState('');

  // Admin state — token lives only in memory (never persisted to localStorage)
  const [adminToken, setAdminToken]         = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminInput, setAdminInput]         = useState('');
  const [adminErr, setAdminErr]             = useState('');
  const [adminChecking, setAdminChecking]   = useState(false);

  const doAdminLogin = async () => {
    if (!adminInput.trim()) return;
    setAdminChecking(true); setAdminErr('');
    try {
      const res = await fetch('/api/thought-leadership/admin', { headers: { 'x-admin-token': adminInput.trim() } });
      if (res.ok) {
        const tok = adminInput.trim();
        setAdminToken(tok);
        // Store in sessionStorage so /admin is pre-authenticated when we redirect there
        sessionStorage.setItem('steep_admin_token', tok);
        setShowAdminLogin(false);
        setAdminInput('');
      } else {
        setAdminErr('Invalid key — try again.');
      }
    } catch { setAdminErr('Connection error.'); }
    setAdminChecking(false);
  };

  const openAdminEditor = (post) => {
    if (adminToken) sessionStorage.setItem('steep_admin_token', adminToken);
    window.open(`/admin?postId=${post.id}`, '_blank');
  };

  useEffect(() => {
    fetch('/api/thought-leadership?limit=50')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openPost = async (post) => {
    setSelectedPost(post);
    setContentLoading(true);

    // The list API now returns full contentMarkdown — use it immediately so
    // the reader never sees the truncated excerpt, even before any network call.
    if (post.contentMarkdown) {
      setPostContent(post.contentMarkdown);
      setContentLoading(false);
      return;
    }

    // Fallback: fetch from the [id] route (e.g. for legacy cached list responses).
    try {
      const res = await fetch(`/api/thought-leadership/${post.id}`);
      const data = await res.json();
      if (res.ok && data.contentMarkdown) {
        setPostContent(data.contentMarkdown);
      } else {
        setPostContent(post.excerpt || '');
      }
    } catch {
      setPostContent(post.excerpt || '');
    }
    setContentLoading(false);
  };

  const readingTime = (text) => Math.max(1, Math.ceil((text || '').split(/\s+/).filter(Boolean).length / 200));

  const allTags = [...new Set(posts.flatMap(p => p.geoKeywords || []))].slice(0, 14);

  const filtered = posts.filter(p => {
    if (activeTag && !(p.geoKeywords || []).includes(activeTag)) return false;
    if (search) {
      const hay = [p.title, p.dek, p.excerpt].join(' ').toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // ── Single article view ────────────────────────────────────────
  if (selectedPost) {
    return (
      <div className="max-w-3xl mx-auto fade-in">
        {/* Sticky back bar */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur py-3 mb-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
          <button
            onClick={() => { setSelectedPost(null); setPostContent(''); setTlShareToast(''); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All articles
          </button>

          {/* Share strip */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={`/thought-leadership/${selectedPost.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open as standalone page"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="hidden sm:inline">Page</span>
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/thought-leadership/${selectedPost.id}`;
                navigator.clipboard.writeText(url).then(() => { setTlShareToast('copied'); setTimeout(() => setTlShareToast(''), 2200); });
              }}
              title="Copy link"
              className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${tlShareToast === 'copied' ? 'bg-emerald-900 border-emerald-700 text-emerald-300' : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              {tlShareToast === 'copied' ? '✓ Copied' : 'Copy link'}
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedPost.title)}&url=${encodeURIComponent(window.location.origin + '/thought-leadership/' + selectedPost.id)}`, '_blank', 'noopener')}
              title="Share on X"
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >𝕏</button>
            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/thought-leadership/' + selectedPost.id)}`, '_blank', 'noopener')}
              title="Share on LinkedIn"
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >in</button>
            {adminToken && (
              <button
                onClick={() => openAdminEditor(selectedPost)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Hero image */}
        {selectedPost.heroImageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={selectedPost.heroImageUrl}
              alt={selectedPost.title}
              className="w-full object-cover"
              style={{ maxHeight: 380 }}
            />
          </div>
        )}

        {/* Meta */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(selectedPost.geoKeywords || []).map(k => (
              <span key={k} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/70">{k}</span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">{selectedPost.title}</h1>
          {selectedPost.dek && <p className="text-slate-400 text-base leading-relaxed mb-4">{selectedPost.dek}</p>}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {selectedPost.publishedAt && (
              <span>{new Date(selectedPost.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
            <span>·</span>
            <span>{readingTime(postContent || selectedPost.excerpt)} min read</span>
          </div>
        </div>

        {/* Content */}
        <div className="border-t border-slate-800 pt-8 pb-16">
          {contentLoading ? (
            <div className="flex items-center gap-2 text-slate-600 text-sm py-8">
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading article…
            </div>
          ) : (
            <TLMarkdown md={postContent} />
          )}
        </div>
      </div>
    );
  }

  const refreshPosts = () => {
    setLoading(true);
    fetch('/api/thought-leadership?limit=50')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // ── Blog index ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto fade-in">

      {/* Publish modal */}
      {showPublish && (
        <TLPublishModal
          onClose={() => setShowPublish(false)}
          onPublished={(tok) => {
            if (tok) { setAdminToken(tok); sessionStorage.setItem('steep_admin_token', tok); }
            setShowPublish(false);
            refreshPosts();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Thought Leadership</h1>
          <p className="text-slate-500 text-sm">Strategic intelligence briefs — macro, geopolitical &amp; sector analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Admin toggle */}
          {adminToken ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800">Admin</span>
              <button
                onClick={() => { setAdminToken(''); setShowAdminLogin(false); setAdminInput(''); }}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >Sign out</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminLogin(v => !v)}
              title="Admin sign-in"
              className={`p-2 rounded-lg border transition-colors ${showAdminLogin ? 'border-slate-600 bg-slate-800 text-white' : 'border-slate-800 bg-slate-900 text-slate-600 hover:text-slate-400 hover:border-slate-700'}`}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="2" y="5.5" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 5.5V4a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowPublish(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Publish
          </button>
        </div>
      </div>

      {/* Inline admin login form */}
      {showAdminLogin && !adminToken && (
        <form
          onSubmit={e => { e.preventDefault(); doAdminLogin(); }}
          className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <p className="text-xs text-slate-400 font-semibold whitespace-nowrap">Admin key</p>
          <input
            type="password"
            value={adminInput}
            onChange={e => setAdminInput(e.target.value)}
            placeholder="Paste ADMIN_PUBLISH_TOKEN…"
            autoFocus
            className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-colors"
          />
          {adminErr && <p className="text-red-400 text-xs whitespace-nowrap">{adminErr}</p>}
          <button
            type="submit"
            disabled={adminChecking || !adminInput.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-opacity whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}
          >
            {adminChecking ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="space-y-3 mb-7">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white text-xs leading-none">✕</button>
          )}
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTag('')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${!activeTag ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'}`}
            >All</button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${activeTag === tag ? 'bg-blue-900 text-blue-200 border border-blue-700' : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'}`}
              >{tag}</button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading…
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mx-auto">✍️</div>
          <p className="text-slate-500 text-sm">{search || activeTag ? 'No articles match your filter.' : 'No published articles yet.'}</p>
          {(search || activeTag) && (
            <button onClick={() => { setSearch(''); setActiveTag(''); }} className="text-blue-400 text-xs hover:underline">Clear filters</button>
          )}
        </div>
      )}

      {/* Magazine card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(post => (
          <article
            key={post.id}
            onClick={() => openPost(post)}
            className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40"
          >
            {/* Thumbnail or accent bar */}
            {post.heroImageUrl ? (
              <div className="h-44 overflow-hidden bg-slate-800">
                <img
                  src={post.heroImageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="h-1.5 bg-gradient-to-r from-blue-700 via-violet-700 to-purple-700" />
            )}

            <div className="p-5">
              {/* Tags */}
              {(post.geoKeywords || []).length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {(post.geoKeywords || []).slice(0, 3).map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-900/60">{k}</span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">{post.title}</h2>

              {/* Dek */}
              {post.dek && (
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">{post.dek}</p>
              )}

              {/* Card footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-slate-600 text-xs">
                  {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className="mx-1.5 text-slate-700">·</span>
                  {readingTime(post.excerpt)} min read
                </span>
                <div className="flex items-center gap-2">
                  {adminToken && (
                    <button
                      onClick={e => { e.stopPropagation(); openAdminEditor(post); }}
                      className="text-slate-500 hover:text-slate-300 text-xs font-medium px-2 py-0.5 rounded border border-slate-800 hover:border-slate-600 transition-colors"
                    >Edit</button>
                  )}
                  <span className="text-blue-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Read
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Footer link to admin */}
      {!loading && posts.length > 0 && (
        <div className="text-center pt-10 pb-4 text-xs text-slate-700">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          <span className="mx-2">·</span>
          <a href="/admin" className="text-slate-600 hover:text-slate-400 transition-colors">Manage in Admin →</a>
        </div>
      )}
    </div>
  );
}

// ── PDF Report Generator ──────────────────────────────────────────
function generatePdfReport(state) {
  const { synthesis, steepData, subject, subjectType, fundamentals: fund, investmentThesis: thesis, bigCycleData } = state;
  if (!synthesis) return;

  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const pct = (n) => n != null ? `${n > 0 ? '+' : ''}${Number(n).toFixed(1)}%` : '—';

  const POSTURE_BG  = { Bullish:'#064e3b', Bearish:'#450a0a', Neutral:'#1c1917', Cautious:'#1c1917', Expansionary:'#064e3b' };
  const POSTURE_CLR = { Bullish:'#6ee7b7', Bearish:'#fca5a5', Neutral:'#d4d4d8', Cautious:'#fcd34d', Expansionary:'#6ee7b7' };
  const postBg  = POSTURE_BG[synthesis.overall_posture] || '#1c1917';
  const postClr = POSTURE_CLR[synthesis.overall_posture] || '#d4d4d8';

  const dims = [
    { key: 'social', label: 'Social' },
    { key: 'technological', label: 'Technological' },
    { key: 'economic', label: 'Economic' },
    { key: 'environmental', label: 'Environmental' },
    { key: 'political', label: 'Political' },
  ];

  const dimCard = (dim) => {
    const d = (steepData || {})[dim.key];
    if (!d) return `<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;"><p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px">${esc(dim.label)}</p><p style="color:#475569;font-size:12px;margin:0">No data</p></div>`;
    const drivers = (d.drivers || []).slice(0, 4).map(dr => `<li style="color:#94a3b8;font-size:11px;margin:2px 0">• ${esc(dr.name)}${dr.impact ? ` <span style="color:#64748b">(${esc(dr.impact)} impact)</span>` : ''}</li>`).join('');
    const opRisk = `<span style="color:#6ee7b7;font-size:10px;font-weight:600">${(d.opportunities||[]).length} opps</span> <span style="color:#94a3b8;font-size:10px">·</span> <span style="color:#fca5a5;font-size:10px;font-weight:600">${(d.risks||[]).length} risks</span>`;
    return `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;break-inside:avoid;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <p style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0">${esc(dim.label)}</p>
          <span style="background:#0f172a;border:1px solid #334155;border-radius:6px;padding:2px 8px;font-size:10px;color:#cbd5e1;font-weight:600">${esc(d.dominant_direction || '—')}</span>
        </div>
        <p style="color:#cbd5e1;font-size:12px;line-height:1.5;margin:0 0 10px">${esc(d.summary || '')}</p>
        ${drivers ? `<ul style="margin:0 0 8px;padding:0;list-style:none">${drivers}</ul>` : ''}
        <div style="margin-top:4px">${opRisk}</div>
      </div>`;
  };

  const roadmapSection = () => {
    if (!synthesis.roadmap) return '';
    const horizons = [
      { key:'near', label:'Near Term',   sub:'0–12 months', clr:'#3B82F6' },
      { key:'mid',  label:'Medium Term', sub:'1–3 years',   clr:'#8B5CF6' },
      { key:'long', label:'Long Term',   sub:'3–7 years',   clr:'#F97316' },
    ];
    return horizons.map(h => {
      const items = (synthesis.roadmap[h.key] || []);
      if (!items.length) return '';
      const rows = items.map(m => `
        <tr style="border-bottom:1px solid #1e293b">
          <td style="padding:8px 12px;color:#94a3b8;font-size:10px;font-weight:600;text-transform:uppercase;white-space:nowrap">${esc(m.dimension||'')}</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;font-weight:600">${esc(m.title||'')}</td>
          <td style="padding:8px 12px;color:#94a3b8;font-size:11px;line-height:1.4">${esc(m.description||m.trigger||'')}</td>
        </tr>`).join('');
      return `
        <div style="margin-bottom:24px;break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:4px;height:32px;background:${h.clr};border-radius:2px;flex-shrink:0"></div>
            <div>
              <p style="color:#f1f5f9;font-size:13px;font-weight:700;margin:0">${h.label}</p>
              <p style="color:#64748b;font-size:10px;margin:0">${h.sub} · ${items.length} milestone${items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden;border:1px solid #334155;">
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');
  };

  const thesisSection = () => {
    if (!fund || !thesis) return '';
    const stanceColor = thesis.stance === 'bullish' ? '#6ee7b7' : thesis.stance === 'bearish' ? '#fca5a5' : '#fcd34d';
    const bulls = (thesis.bull_case || []).map(b => `<li style="color:#6ee7b7;font-size:11px;margin:3px 0">▲ ${esc(b)}</li>`).join('');
    const bears = (thesis.bear_case || []).map(b => `<li style="color:#fca5a5;font-size:11px;margin:3px 0">▼ ${esc(b)}</li>`).join('');
    const metrics = [
      ['Market Cap', fund.market_cap ? `$${(fund.market_cap/1e9).toFixed(1)}B` : '—'],
      ['P/E Ratio', fund.pe_ratio ?? '—'],
      ['Fwd P/E', fund.forward_pe ?? '—'],
      ['Revenue Gro.', fund.revenue_growth ? pct(fund.revenue_growth * 100) : '—'],
      ['Gross Margin', fund.gross_margin ? pct(fund.gross_margin * 100) : '—'],
      ['Analyst Rating', fund.analyst_rating ?? '—'],
      ['Analyst Target', fund.analyst_target_mean ? `$${fund.analyst_target_mean}` : '—'],
      ['Upside', fund.upside_pct != null ? pct(fund.upside_pct) : '—'],
    ];
    const metricHtml = metrics.map(([k,v]) => `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px 12px;">
        <p style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 3px">${esc(k)}</p>
        <p style="color:#f1f5f9;font-size:13px;font-weight:700;margin:0">${esc(v)}</p>
      </div>`).join('');
    return `
      <section style="margin-bottom:40px;break-before:page;">
        <h2 style="font-size:18px;font-weight:800;color:#f8fafc;margin:0 0 4px">Investment Thesis</h2>
        <p style="color:#475569;font-size:11px;margin:0 0 16px">${esc(fund.company_name || subject)} · ${esc(fund.ticker||'')} ${esc(fund.exchange||'')}</p>
        <div style="background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="background:${stanceColor}22;color:${stanceColor};border:1px solid ${stanceColor}55;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;text-transform:uppercase">${esc(thesis.stance||'')}</span>
            ${thesis.confidence != null ? `<span style="color:#64748b;font-size:11px">Confidence: ${Math.round((thesis.confidence||0)*100)}%</span>` : ''}
          </div>
          <p style="color:#cbd5e1;font-size:12px;line-height:1.6;margin:0 0 16px">${esc(thesis.thesis||'')}</p>
          ${thesis.valuation_assessment ? `<p style="color:#94a3b8;font-size:11px;font-style:italic;border-top:1px solid #334155;padding-top:12px;margin:0">${esc(thesis.valuation_assessment)}</p>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          ${bulls ? `<div style="background:#052e16;border:1px solid #14532d;border-radius:10px;padding:14px;"><p style="color:#6ee7b7;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Bull Case</p><ul style="margin:0;padding:0;list-style:none">${bulls}</ul></div>` : ''}
          ${bears ? `<div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:10px;padding:14px;"><p style="color:#fca5a5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Bear Case</p><ul style="margin:0;padding:0;list-style:none">${bears}</ul></div>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">${metricHtml}</div>
      </section>`;
  };

  const bigCycleSection = () => {
    if (!bigCycleData) return '';
    const a = bigCycleData;
    const sev = a.overallSeverityScore ?? 0;
    const sevClr = sev >= 7 ? '#fca5a5' : sev >= 4 ? '#fcd34d' : '#6ee7b7';
    const instruments = (a.primaryInstruments || []).slice(0, 4).map(inst => `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;break-inside:avoid;">
        <p style="color:#f1f5f9;font-size:12px;font-weight:700;margin:0 0 4px">${esc(inst.name||'')}</p>
        <p style="color:#94a3b8;font-size:11px;margin:0">${esc(inst.relevance||'')}</p>
      </div>`).join('');
    const capacities = a.capacities ? Object.entries(a.capacities).slice(0, 4).map(([k, v]) => `
      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px 12px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:capitalize">${esc(k.replace(/_/g,' '))}</td>
        <td style="padding:8px 12px;text-align:center">
          <div style="background:#0f172a;border-radius:4px;overflow:hidden;height:6px;width:80px;display:inline-block;vertical-align:middle;">
            <div style="height:100%;width:${Math.round(((v.score||0)/10)*100)}%;background:#3b82f6;border-radius:4px;"></div>
          </div>
          <span style="color:#cbd5e1;font-size:11px;margin-left:8px">${v.score ?? '—'}/10</span>
        </td>
        <td style="padding:8px 12px;color:#64748b;font-size:11px;line-height:1.4">${esc((v.rationale||'').slice(0,120))}${(v.rationale||'').length > 120 ? '…' : ''}</td>
      </tr>`).join('') : '';
    return `
      <section style="margin-bottom:40px;break-before:page;">
        <h2 style="font-size:18px;font-weight:800;color:#f8fafc;margin:0 0 16px">Big Cycle Assessment</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;">
            <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px">Cycle Phase</p>
            <p style="color:#f1f5f9;font-size:14px;font-weight:700;margin:0 0 8px">${esc(a.cyclePhase||'—')}</p>
            <p style="color:#94a3b8;font-size:11px;line-height:1.5;margin:0">${esc((a.cyclePhaseRationale||'').slice(0,200))}</p>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;">
            <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px">Overall Severity</p>
            <p style="color:${sevClr};font-size:28px;font-weight:800;margin:0 0 4px">${sev}<span style="font-size:14px;color:#64748b">/10</span></p>
            ${a.strategicUtility ? `<p style="color:#94a3b8;font-size:11px;margin:0">Utility class: <strong style="color:#cbd5e1">${esc(a.strategicUtility.class||'')}</strong></p>` : ''}
          </div>
        </div>
        ${instruments ? `<div style="margin-bottom:20px;"><p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px">Geoeconomic Instruments</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${instruments}</div></div>` : ''}
        ${capacities ? `<div><p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px">US Geoeconomic Capacities</p><table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden;border:1px solid #334155;"><tbody>${capacities}</tbody></table></div>` : ''}
      </section>`;
  };

  const insightsSection = () => {
    const ins = synthesis.cross_dimension_insights || [];
    if (!ins.length) return '';
    const rows = ins.map(i => `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
          ${(i.dimensions_involved||[]).map(d => `<span style="background:#0f172a;border:1px solid #334155;border-radius:4px;padding:1px 7px;font-size:9px;color:#94a3b8;text-transform:capitalize">${esc(d)}</span>`).join('')}
          ${i.type ? `<span style="color:#64748b;font-size:9px;margin-left:auto">${esc(i.type)}</span>` : ''}
        </div>
        <p style="color:#e2e8f0;font-size:12px;font-weight:600;margin:0 0 4px">${esc(i.insight||'')}</p>
        ${i.strategic_implication ? `<p style="color:#94a3b8;font-size:11px;margin:0">${esc(i.strategic_implication)}</p>` : ''}
      </div>`).join('');
    return `
      <section style="margin-bottom:32px;">
        <h3 style="font-size:14px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">Cross-Dimension Insights</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${rows}</div>
      </section>`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>STEEP Report — ${esc(subject)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @media print{
      body{background:#fff;color:#1e293b}
      .no-print{display:none!important}
      section,div{break-inside:avoid}
    }
    .page{max-width:860px;margin:0 auto;padding:40px 32px}
    h1{font-size:22px;font-weight:800;color:#f8fafc;margin-bottom:4px}
    h2{font-size:18px;font-weight:800;color:#f8fafc;margin-bottom:16px}
    section{margin-bottom:40px}
  </style>
</head>
<body>
<div class="page">

  <!-- Print button -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:99;display:flex;gap:8px;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">⬇ Save / Print PDF</button>
    <button onclick="window.close()" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;">✕ Close</button>
  </div>

  <!-- Cover -->
  <section>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px">STEEP Strategic Intelligence Report</p>
        <h1>${esc(subject)}</h1>
        <p style="color:#64748b;font-size:12px;margin-top:4px">${esc(subjectType||'')}</p>
      </div>
      <div style="text-align:right">
        <p style="color:#64748b;font-size:10px;margin-bottom:4px">Generated</p>
        <p style="color:#94a3b8;font-size:11px;font-weight:600">${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
      </div>
    </div>

    <!-- Posture banner -->
    <div style="background:${postBg};border:1px solid ${postClr}33;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <p style="color:${postClr};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0">Strategic Posture</p>
        <span style="background:${postClr}22;color:${postClr};border:1px solid ${postClr}55;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700">${esc(synthesis.overall_posture||'')}</span>
      </div>
      <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 14px">${esc(synthesis.posture_rationale||'')}</p>
      <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:0 0 6px">Executive Summary</p>
      <p style="color:#e2e8f0;font-size:12px;line-height:1.65;margin:0">${esc(synthesis.executive_summary||'')}</p>
    </div>

    <!-- STEEP grid -->
    <h3 style="font-size:14px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px">STEEP Dimension Assessments</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
      ${dims.map(d => dimCard(d)).join('')}
    </div>

    ${insightsSection()}
  </section>

  <!-- Roadmap -->
  ${synthesis.roadmap ? `
  <section style="break-before:page;">
    <h2>Forecast Roadmap</h2>
    ${roadmapSection()}
  </section>` : ''}

  <!-- Investment Thesis -->
  ${thesisSection()}

  <!-- Big Cycle -->
  ${bigCycleSection()}

  <!-- Footer -->
  <div style="border-top:1px solid #1e293b;padding-top:16px;margin-top:32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <p style="color:#334155;font-size:10px">STINT Studio · Applied Strategy & Intelligence</p>
    <p style="color:#334155;font-size:10px">Confidential — Not for distribution</p>
  </div>
</div>
<script>
  // Auto-trigger print after fonts load
  window.addEventListener('load', () => {
    // Small delay so styles render
    setTimeout(() => document.title = 'STEEP Report — ${esc(subject)}', 100);
  });
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { alert('Pop-up blocked — please allow pop-ups for this site to export PDF.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── InnovatorIlluminationPanel ────────────────────────────────────
function InnovatorIlluminationPanel() {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [search, setSearch]             = useState('');
  const [activeTag, setActiveTag]       = useState('');
  const [showPublish, setShowPublish]   = useState(false);
  const [editingPost, setEditingPost]   = useState(null);
  const [iiShareToast, setIiShareToast] = useState('');

  const [adminToken, setAdminToken]         = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminInput, setAdminInput]         = useState('');
  const [adminErr, setAdminErr]             = useState('');
  const [adminChecking, setAdminChecking]   = useState(false);

  const doAdminLogin = async () => {
    if (!adminInput.trim()) return;
    setAdminChecking(true); setAdminErr('');
    try {
      const res = await fetch('/api/innovator-illumination/admin', { headers: { 'x-admin-token': adminInput.trim() } });
      if (res.ok) {
        setAdminToken(adminInput.trim());
        setShowAdminLogin(false);
        setAdminInput('');
      } else {
        setAdminErr('Invalid key');
      }
    } catch { setAdminErr('Could not verify — check your connection.'); }
    setAdminChecking(false);
  };

  const doDelete = async (id) => {
    if (!window.confirm('Delete this innovator profile?')) return;
    await fetch('/api/innovator-illumination/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ id }),
    });
    loadPosts();
  };

  const doUnpublish = async (id) => {
    await fetch('/api/innovator-illumination/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ id, status: 'draft' }),
    });
    loadPosts();
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '50' });
      if (activeTag) qs.set('tag', activeTag);
      if (search.trim()) qs.set('q', search.trim());
      const res = await fetch(`/api/innovator-illumination?${qs}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch { setPosts([]); }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, [activeTag, search]);

  // Gather all geo keywords from posts
  const allTags = [...new Set(posts.flatMap(p => p.geoKeywords || []))].sort();

  if (selectedPost) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Back + share strip */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button onClick={() => { setSelectedPost(null); setIiShareToast(''); }} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Innovators
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={`/innovator-illumination/${selectedPost.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open as standalone page"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="hidden sm:inline">Page</span>
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/innovator-illumination/${selectedPost.id}`;
                navigator.clipboard.writeText(url).then(() => { setIiShareToast('copied'); setTimeout(() => setIiShareToast(''), 2200); });
              }}
              title="Copy link"
              className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${iiShareToast === 'copied' ? 'bg-emerald-900 border-emerald-700 text-emerald-300' : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              {iiShareToast === 'copied' ? '✓ Copied' : 'Copy link'}
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedPost.title)}&url=${encodeURIComponent(window.location.origin + '/innovator-illumination/' + selectedPost.id)}`, '_blank', 'noopener')}
              title="Share on X"
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >𝕏</button>
            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/innovator-illumination/' + selectedPost.id)}`, '_blank', 'noopener')}
              title="Share on LinkedIn"
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >in</button>
          </div>
        </div>

        {/* Article header */}
        {selectedPost.heroImageUrl && (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ maxHeight: 280 }}>
            <img src={selectedPost.heroImageUrl} alt={selectedPost.title} className="w-full object-cover" style={{ maxHeight: 280 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-900 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {selectedPost.logoUrl ? (
              <img src={selectedPost.logoUrl} alt={selectedPost.title} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
            ) : (
              <span className="text-white text-xl font-black">{(selectedPost.title||'?')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {selectedPost.techSegment && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mb-2" style={{ background: '#0891b220', color: '#22d3ee', border: '1px solid #0891b240' }}>{selectedPost.techSegment}</span>
            )}
            <h1 className="text-2xl font-black text-white leading-tight">{selectedPost.title}</h1>
            {selectedPost.solutionOverview && <p className="text-slate-400 text-sm mt-1 leading-relaxed">{selectedPost.solutionOverview}</p>}
          </div>
        </div>

        {selectedPost.geoKeywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {selectedPost.geoKeywords.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
            ))}
          </div>
        )}

        <div className="prose-like">
          <TLMarkdown md={selectedPost.contentMarkdown || ''} />
        </div>

        {adminToken && (
          <div className="mt-8 pt-6 border-t border-slate-800 flex gap-3">
            <button onClick={() => setEditingPost(selectedPost)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-400 transition-colors">Edit</button>
            <button onClick={() => doUnpublish(selectedPost.id)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">Unpublish</button>
            <button onClick={() => { doDelete(selectedPost.id); setSelectedPost(null); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 transition-colors">Delete</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>💡</div>
          <div>
            <h1 className="text-2xl font-black text-white mb-0.5">Innovator Illumination</h1>
            <p className="text-slate-500 text-xs">Spotlighting breakthrough technology solution providers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {adminToken ? (
            <>
              <button onClick={() => setShowPublish(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Add Innovator
              </button>
              <button onClick={() => setAdminToken('')} className="text-xs px-2 py-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-colors">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAdminLogin(v => !v)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">Admin</button>
          )}
        </div>
      </div>

      {/* Admin login inline */}
      {showAdminLogin && !adminToken && (
        <div className="mb-5 p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex gap-3 items-center">
          <input
            type="password"
            value={adminInput}
            onChange={e => { setAdminInput(e.target.value); setAdminErr(''); }}
            onKeyDown={e => e.key === 'Enter' && doAdminLogin()}
            placeholder="Admin key…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500"
          />
          <button onClick={doAdminLogin} disabled={adminChecking} className="px-3 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#0891b2,#6d28d9)' }}>
            {adminChecking ? '…' : 'Login'}
          </button>
          {adminErr && <p className="text-red-400 text-xs">{adminErr}</p>}
        </div>
      )}

      {/* Search + tag filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search innovators…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-slate-700 transition-colors"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <button onClick={() => setActiveTag('')} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? 'border-cyan-700 bg-cyan-900/30 text-cyan-400' : 'border-slate-700 bg-slate-900 text-slate-500 hover:text-slate-300'}`}>All</button>
            {allTags.map(t => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? '' : t)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === t ? 'border-cyan-700 bg-cyan-900/30 text-cyan-400' : 'border-slate-700 bg-slate-900 text-slate-500 hover:text-slate-300'}`}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-600">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">💡</div>
          <p className="text-slate-500 text-sm">{search || activeTag ? 'No innovators match your search.' : 'No innovator profiles published yet.'}</p>
          {adminToken && !search && !activeTag && (
            <button onClick={() => setShowPublish(true)} className="mt-4 text-sm text-cyan-500 hover:text-cyan-300 underline transition-colors">Add the first innovator →</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <div key={post.id}
              className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all cursor-pointer flex flex-col"
              onClick={() => setSelectedPost(post)}
            >
              {/* Hero image strip */}
              {post.heroImageUrl && (
                <div className="h-28 overflow-hidden flex-shrink-0 bg-slate-800">
                  <img src={post.heroImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { e.currentTarget.parentElement.style.display='none'; }} />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                {/* Logo + name row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {post.logoUrl ? (
                      <img src={post.logoUrl} alt={post.title} className="w-full h-full object-contain p-1" onError={e => { e.currentTarget.style.display='none'; }} />
                    ) : (
                      <span className="text-white text-sm font-black">{(post.title||'?')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm leading-tight truncate">{post.title}</h3>
                    {post.techSegment && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block" style={{ background: '#0891b215', color: '#22d3ee' }}>{post.techSegment}</span>
                    )}
                  </div>
                </div>

                {/* Solution overview tagline */}
                {post.solutionOverview && (
                  <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">{post.solutionOverview}</p>
                )}

                {/* GEO tags */}
                {post.geoKeywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {post.geoKeywords.slice(0, 3).map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{t}</span>
                    ))}
                    {post.geoKeywords.length > 3 && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-600">+{post.geoKeywords.length - 3}</span>}
                  </div>
                )}
              </div>

              {/* Admin actions */}
              {adminToken && (
                <div className="px-4 pb-3 flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditingPost(post)} className="text-xs px-2 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-400 transition-colors">Edit</button>
                  <button onClick={() => doUnpublish(post.id)} className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">Unpublish</button>
                  <button onClick={() => doDelete(post.id)} className="text-xs px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-400 transition-colors">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Innovator modal */}
      {showPublish && (
        <IIPublishModal
          onClose={() => setShowPublish(false)}
          onPublished={(tok) => { setAdminToken(tok); loadPosts(); }}
        />
      )}

      {/* Edit Innovator modal */}
      {editingPost && (
        <IIPublishModal
          initialToken={adminToken}
          initialPost={editingPost}
          onClose={() => setEditingPost(null)}
          onPublished={(tok, updatedPost) => {
            setEditingPost(null);
            loadPosts();
            if (updatedPost && selectedPost && selectedPost.id === updatedPost.id) {
              setSelectedPost(updatedPost);
            }
          }}
        />
      )}
    </div>
  );
}

// ── OverviewTab ───────────────────────────────────────────────────
function OverviewTab({ state, dispatch }) {
  const { steepData, synthesis, subject, subjectType, sentimentData, macroData } = state;
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
        <div className="flex-1" />
        <button
          onClick={() => generatePdfReport(state)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white border border-blue-700/50 hover:border-blue-500 transition-colors"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2e1065)' }}
          title="Export PDF report covering Overview, Roadmap, Thesis & Big Cycle"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M3.5 5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Export Report
        </button>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed max-w-4xl">{synthesis.posture_rationale}</p>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <SectionHdr>Executive Summary</SectionHdr>
        <p className="text-slate-200 leading-relaxed text-sm">{synthesis.executive_summary}</p>
      </div>

      <SnapshotPanel state={state} dispatch={dispatch} />

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
                {key === 'social' && <SentimentPulseSection sentiment={sentimentData} />}
                {key === 'economic' && <LiveMacroStrip macro={macroData} />}
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
    <div className="relative" style={{ height: 'calc(100vh - 140px)', minHeight: 400 }}>
      {/* 3-D canvas — fills full container */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full rounded-xl" />

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-slate-950 bg-opacity-90 border border-slate-700 rounded-xl p-2.5 text-xs space-y-1">
          <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Dimensions</p>
          {Object.entries(COLORS).map(([d, c]) => (
            <div key={d} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
              <span className="text-slate-300">{d}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 hidden md:block">
            <p className="text-slate-500 font-semibold uppercase tracking-wider">Drivers</p>
            {[['#10b981','Positive'],['#ef4444','Negative'],['#f59e0b','Mixed']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                <span className="text-slate-400">{l}</span>
              </div>
            ))}
            <p className="text-slate-600 mt-1">Node size = impact</p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1 hidden md:block">
            <p className="text-slate-500 font-semibold uppercase tracking-wider">Cross-dim Arcs</p>
            {[['#10b981','Reinforcing'],['#ef4444','Countervailing'],['#8b5cf6','Emerging']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-4 h-px flex-shrink-0" style={{ background: `repeating-linear-gradient(90deg,${c} 0px,${c} 4px,transparent 4px,transparent 7px)` }} />
                <span className="text-slate-400">{l}</span>
              </div>
            ))}
            <p className="text-slate-600 mt-1">Tap bead for insight</p>
          </div>
        </div>

        {/* Controls bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="bg-slate-950 bg-opacity-80 border border-slate-700 rounded-lg px-3 py-1.5">
            <p className="text-slate-600 text-xs hidden md:block">Drag to rotate · Scroll to zoom · Click nodes</p>
            <p className="text-slate-600 text-xs md:hidden">Touch to rotate · Pinch to zoom · Tap nodes</p>
          </div>
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${autoRotate ? 'bg-blue-900 border-blue-600 text-blue-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
          >
            {autoRotate ? '⏸ Auto-Rotate' : '▶ Auto-Rotate'}
          </button>
        </div>
      </div>

      {/* Detail panel — bottom sheet on mobile, right panel on desktop */}
      <div
        className={`absolute z-20 overflow-y-auto transition-opacity duration-300 bg-slate-950/95 backdrop-blur-sm border-slate-800
          bottom-0 left-0 right-0 max-h-[55%] rounded-t-2xl border-t
          md:inset-y-0 md:right-0 md:left-auto md:w-72 md:max-h-none md:rounded-none md:rounded-l-xl md:border-t-0 md:border-l
          ${tooltip ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
  const { fundamentals: fund, investmentThesis: thesis, thesisStatus, ticker, subject, sentimentData } = state;

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

        {/* Market sentiment (Adanos — only shown when data is available) */}
        <MarketSentimentCard sentiment={sentimentData} />
      </div>

      <p className="text-slate-700 text-xs text-center pb-2">
        Data from Yahoo Finance · Not financial advice · For research purposes only
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS — RASCEF PROMPT GENERATOR
// ═══════════════════════════════════════════════════════════════════

const RASCEF_ELEMENTS = [
  { key: 'R', label: 'Role',    color: '#3B82F6', desc: 'Who the AI persona is — expertise, seniority, and depth of knowledge.' },
  { key: 'A', label: 'Actions', color: '#8B5CF6', desc: 'Specific, verb-driven tasks the AI should perform on your behalf.' },
  { key: 'S', label: 'Style',   color: '#06B6D4', desc: 'Tone, vocabulary register, and communication approach for your audience.' },
  { key: 'C', label: 'Context', color: '#F59E0B', desc: 'Operational environment, industry norms, and relevant constraints.' },
  { key: 'E', label: 'Example', color: '#10B981', desc: 'A concrete input/response scenario that calibrates the AI\'s output.' },
  { key: 'F', label: 'Format',  color: '#F97316', desc: 'Output structure, length, formality, and standing elements to include.' },
];

// ── GeoEconomic Instrument Assessment static data ────────────────────────────
const GEO_ATTRIBUTES = [
  { key: 'precision',     label: 'Precision',                weight: 20 },
  { key: 'impact',        label: 'Impact',                   weight: 30 },
  { key: 'circumvention', label: 'Circumvention Resistance', weight: 20 },
  { key: 'visibility',    label: 'Visibility',               weight: 15 },
  { key: 'speed',         label: 'Speed of Effect',          weight: 15 },
];
const GEO_UTILITY = {
  coercive_leverage:      { label: 'Coercive Leverage',        c: '#ef4444', b: '#ef444415' },
  structural_dependency:  { label: 'Structural Dependency',    c: '#f97316', b: '#f9731615' },
  alliance_management:    { label: 'Alliance Management',      c: '#3b82f6', b: '#3b82f615' },
  strategic_deterrence:   { label: 'Strategic Deterrence',     c: '#8b5cf6', b: '#8b5cf615' },
  domestic_protection:    { label: 'Domestic Protection',      c: '#10b981', b: '#10b98115' },
  retaliation_escalation: { label: 'Retaliation / Escalation', c: '#f59e0b', b: '#f59e0b15' },
};
const GEO_SEV = {
  CRITICAL: { c: '#ef4444', b: '#ef444415' },
  HIGH:     { c: '#f97316', b: '#f9731615' },
  MODERATE: { c: '#f59e0b', b: '#f59e0b15' },
  LOW:      { c: '#10b981', b: '#10b98115' },
  MINIMAL:  { c: '#64748b', b: '#64748b15' },
};
const GEO_FLAG = {
  HIGH_SEVERITY:        { c: '#ef4444', b: '#ef444415' },
  RETALIATION_RISK:     { c: '#f97316', b: '#f9731615' },
  CIRCUMVENTION_LIKELY: { c: '#f59e0b', b: '#f59e0b15' },
  WAR_ECONOMY_TRIGGER:  { c: '#ef4444', b: '#ef444415' },
};
const GEO_SIG = {
  BUY:     { c: '#10b981', b: '#10b98115' },
  SELL:    { c: '#ef4444', b: '#ef444415' },
  HEDGE:   { c: '#f59e0b', b: '#f59e0b15' },
  MONITOR: { c: '#64748b', b: '#64748b15' },
};
const GEO_DIR = {
  POSITIVE: { c: '#10b981', label: '▲' },
  NEGATIVE: { c: '#ef4444', label: '▼' },
  NEUTRAL:  { c: '#64748b', label: '→' },
};
const GEO_MAG = { HIGH: 'font-bold', MODERATE: 'font-medium', LOW: 'font-normal' };
const GEO_CONV_C = { HIGH: '#10b981', MODERATE: '#f59e0b', LOW: '#94a3b8' };
const GEO_PIPELINE_PARALLEL = ['agent5a', 'agent5b', 'agent5c'];
const GEO_PIPELINE_DEFS = [
  { key: 'agent5a',     label: 'Agent 5A — Attribute Scorer',             sub: 'Five attributes · Severity score', parallel: true },
  { key: 'agent5b',     label: 'Agent 5B — Capacity Assessor',            sub: 'Bilateral leverage · Chokepoints',  parallel: true },
  { key: 'agent5c',     label: 'Agent 5C — Strategic Utility Classifier', sub: 'Utility class · Escalation risk',   parallel: true },
  { key: 'convergence', label: 'Convergence Supervisor',                  sub: 'Risk synthesis · Active flags',     parallel: false },
  { key: 'agent5d',     label: 'Agent 5D — Investment Translation',       sub: 'Market signals · Portfolio signals', parallel: false },
];
const GEO_EXAMPLES = [
  { instrument: 'Semiconductor export controls',    sender: 'United States',       target: 'China' },
  { instrument: 'SWIFT financial sanctions',         sender: 'United States / EU',  target: 'Russia' },
  { instrument: 'Rare earth export quotas',          sender: 'China',               target: 'United States' },
  { instrument: 'Steel tariffs Section 232',         sender: 'United States',       target: 'European Union' },
];
// ─────────────────────────────────────────────────────────────────────────────

function GeoInstrumentTool() {
  const [giStep, setGiStep] = useState('form');
  const [giForm, setGiForm] = useState({ instrument: '', sender: '', target: '', context: '' });
  const [giErrors, setGiErrors] = useState({});
  const [giError, setGiError] = useState('');
  const [giAgents, setGiAgents] = useState({ agent5a: 'pending', agent5b: 'pending', agent5c: 'pending', convergence: 'pending', agent5d: 'pending' });
  const [giResult, setGiResult] = useState(null);

  const setGiField = (k, v) => { setGiForm(f => ({ ...f, [k]: v })); if (giErrors[k]) setGiErrors(e => ({ ...e, [k]: '' })); };

  const validateGi = () => {
    const e = {};
    if (!giForm.instrument.trim()) e.instrument = 'Instrument name is required.';
    if (!giForm.sender.trim())     e.sender = 'Sender is required.';
    if (!giForm.target.trim())     e.target = 'Target is required.';
    return e;
  };

  const runGi = async () => {
    const errs = validateGi();
    if (Object.keys(errs).length) { setGiErrors(errs); return; }
    setGiStep('running');
    setGiError('');
    setGiErrors({});
    setGiAgents({ agent5a: 'running', agent5b: 'running', agent5c: 'running', convergence: 'pending', agent5d: 'pending' });
    setGiResult(null);
    try {
      const res = await fetch('/api/geoinstrument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument: giForm.instrument.trim(), sender: giForm.sender.trim(), target: giForm.target.trim(), context: giForm.context.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let ev;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }
          if (ev.event === 'agent_start') {
            setGiAgents(s => ({ ...s, [ev.agent]: 'running' }));
          } else if (ev.event === 'agent_complete') {
            setGiAgents(s => ({ ...s, [ev.agent]: 'complete' }));
          } else if (ev.event === 'complete') {
            setGiResult(ev.result);
            setGiAgents({ agent5a: 'complete', agent5b: 'complete', agent5c: 'complete', convergence: 'complete', agent5d: 'complete' });
            setGiStep('result');
          } else if (ev.event === 'error') {
            throw new Error(ev.message);
          }
        }
      }
    } catch (err) {
      setGiError(err.message);
      setGiStep('form');
    }
  };

  const resetGi = () => {
    setGiStep('form');
    setGiResult(null);
    setGiError('');
    setGiErrors({});
    setGiAgents({ agent5a: 'pending', agent5b: 'pending', agent5c: 'pending', convergence: 'pending', agent5d: 'pending' });
  };

  const canRun = giForm.instrument.trim() && giForm.sender.trim() && giForm.target.trim();

  if (giStep === 'form') return (
    <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center text-xl font-black text-white shadow-xl">◈</div>
          <h1 className="text-2xl font-black text-white mb-2">GeoEconomic Instrument Assessment</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Five-agent pipeline based on the Farrell & Newman Triangular Framework. Score a geoeconomic instrument across five attributes, assess bilateral leverage, classify strategic utility, and translate the risk profile into investment signals.
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Instrument <span className="text-red-400">*</span></label>
              <input type="text" value={giForm.instrument} onChange={e => setGiField('instrument', e.target.value)}
                placeholder="e.g. Semiconductor export controls, SWIFT sanctions, Steel tariffs"
                className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${giErrors.instrument ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-teal-500/60'}`} />
              {giErrors.instrument && <p className="text-red-400 text-xs mt-1">{giErrors.instrument}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Sender <span className="text-red-400">*</span></label>
                <input type="text" value={giForm.sender} onChange={e => setGiField('sender', e.target.value)}
                  placeholder="e.g. United States, EU, China"
                  className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${giErrors.sender ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-teal-500/60'}`} />
                {giErrors.sender && <p className="text-red-400 text-xs mt-1">{giErrors.sender}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target <span className="text-red-400">*</span></label>
                <input type="text" value={giForm.target} onChange={e => setGiField('target', e.target.value)}
                  placeholder="e.g. China, Russia, sector"
                  className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${giErrors.target ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-teal-500/60'}`} />
                {giErrors.target && <p className="text-red-400 text-xs mt-1">{giErrors.target}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Context <span className="text-slate-600 font-normal normal-case">(optional)</span></label>
              <textarea value={giForm.context} onChange={e => setGiField('context', e.target.value)} rows={2}
                placeholder="Any relevant context — policy timeline, sectoral focus, investor perspective…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-teal-500/60 focus:outline-none transition-colors resize-none" />
            </div>
          </div>
          <div className="mt-4 mb-4">
            <p className="text-xs text-slate-600 mb-2">Quick-fill examples</p>
            <div className="flex flex-wrap gap-1.5">
              {GEO_EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => { setGiField('instrument', ex.instrument); setGiField('sender', ex.sender); setGiField('target', ex.target); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                  {ex.instrument}
                </button>
              ))}
            </div>
          </div>
          <button onClick={runGi} disabled={!canRun}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#0d9488,#059669)' }}>
            Run Assessment
          </button>
          {giError && <div className="mt-4 bg-red-950/50 border border-red-800 rounded-xl p-3"><p className="text-red-300 text-xs">{giError}</p></div>}
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Pipeline</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {GEO_PIPELINE_DEFS.filter(a => a.parallel).map(a => (
              <div key={a.key} className="bg-slate-800/60 rounded-xl p-2.5 text-center">
                <p className="text-teal-400 text-xs font-semibold">{a.key.replace('agent', 'Agent ').toUpperCase()}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-tight">{a.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mb-2"><div className="w-px h-4 bg-slate-700" /></div>
          {GEO_PIPELINE_DEFS.filter(a => !a.parallel).map(a => (
            <div key={a.key} className="bg-slate-800/60 rounded-xl p-2.5 mb-2 text-center last:mb-0">
              <p className="text-slate-300 text-xs font-medium">{a.label.split(' — ')[0]}</p>
              <p className="text-slate-500 text-xs">{a.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (giStep === 'running') {
    const parallelComplete = GEO_PIPELINE_PARALLEL.filter(k => giAgents[k] === 'complete').length;
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mx-auto mb-4 flex items-center justify-center text-xl font-black text-white shadow-xl animate-pulse">◈</div>
            <h2 className="text-white font-bold text-lg">Running Assessment</h2>
            <p className="text-slate-400 text-sm mt-1 truncate max-w-xs mx-auto">{giForm.instrument}</p>
            <p className="text-slate-600 text-xs mt-0.5">{giForm.sender} → {giForm.target}</p>
          </div>
          {/* Parallel tier */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {GEO_PIPELINE_DEFS.filter(a => a.parallel).map(a => {
              const st = giAgents[a.key];
              return (
                <div key={a.key} className={`rounded-xl border p-2.5 transition-all ${st === 'complete' ? 'bg-green-950/25 border-green-900/40' : st === 'running' ? 'bg-teal-950/25 border-teal-800/50' : 'bg-slate-800/30 border-slate-800'}`}>
                  <div className={`w-5 h-5 rounded-full mx-auto mb-1.5 flex items-center justify-center text-xs ${st === 'complete' ? 'bg-green-500/20 text-green-400' : st === 'running' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-600'}`}>
                    {st === 'complete' ? '✓' : st === 'running' ? '◌' : '○'}
                  </div>
                  <p className={`text-xs font-semibold text-center ${st === 'running' ? 'text-teal-300' : st === 'complete' ? 'text-green-300' : 'text-slate-600'}`}>{a.key.replace('agent', 'Agent ').toUpperCase()}</p>
                  <p className="text-slate-600 text-xs text-center leading-tight mt-0.5">{a.sub.split(' · ')[0]}</p>
                </div>
              );
            })}
          </div>
          {parallelComplete === 3 && <div className="flex justify-center mb-2"><div className="w-px h-4 bg-slate-700" /></div>}
          {/* Sequential tier */}
          <div className="space-y-2">
            {GEO_PIPELINE_DEFS.filter(a => !a.parallel).map(a => {
              const st = giAgents[a.key];
              if (st === 'pending' && parallelComplete < 3) return null;
              return (
                <div key={a.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${st === 'complete' ? 'bg-green-950/25 border-green-900/40' : st === 'running' ? 'bg-teal-950/25 border-teal-800/50' : 'bg-slate-800/30 border-slate-800'}`}>
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${st === 'complete' ? 'bg-green-500/20 text-green-400' : st === 'running' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-600'}`}>
                    {st === 'complete' ? '✓' : st === 'running' ? '◌' : '○'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${st === 'running' ? 'text-teal-300' : st === 'complete' ? 'text-green-300' : 'text-slate-500'}`}>{a.label}</p>
                    <p className="text-slate-600 text-xs truncate">{a.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!giResult) return null;
  const { synthesis: syn, agents } = giResult;
  const { agent5a, agent5b, agent5c, agent5d } = agents || {};
  const sevTier  = syn?.unified_severity_tier || agent5a?.severity_tier || 'MODERATE';
  const sevScore = syn?.unified_severity ?? agent5a?.severity_score ?? 0;
  const sevStyle = GEO_SEV[sevTier] || GEO_SEV.MODERATE;
  const utilCls  = agent5c?.strategic_utility_class;
  const utilDef  = GEO_UTILITY[utilCls] || { label: utilCls, c: '#94a3b8', b: '#94a3b815' };
  const confColor = GEO_CONV_C[syn?.convergence_confidence] || '#94a3b8';

  return (
    <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0d9488,#059669)' }}>◈</div>
              <h1 className="text-lg font-black text-white truncate">{giResult.instrument}</h1>
            </div>
            <p className="text-slate-500 text-xs pl-10">{giResult.sender} → {giResult.target} · {new Date(giResult.generatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {syn?.convergence_confidence && <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: confColor + '20', color: confColor }}>{syn.convergence_confidence} confidence</span>}
            <button onClick={resetGi} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">New assessment</button>
          </div>
        </div>

        {/* Active flags */}
        {syn?.active_flags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {syn.active_flags.map(f => {
              const fs = GEO_FLAG[f] || { c: '#94a3b8', b: '#94a3b815' };
              return <span key={f} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: fs.b, color: fs.c }}>⚑ {f.replace(/_/g, ' ')}</span>;
            })}
          </div>
        )}

        {/* Severity + Strategic Utility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-5" style={{ background: sevStyle.b, border: `1px solid ${sevStyle.c}30` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: sevStyle.c + 'aa' }}>Severity Score</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black tabular-nums" style={{ color: sevStyle.c }}>{Number(sevScore).toFixed(1)}</span>
              <div>
                <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: sevStyle.b, color: sevStyle.c, border: `1px solid ${sevStyle.c}40` }}>{sevTier}</span>
                <p className="text-slate-500 text-xs mt-1">out of 10</p>
              </div>
            </div>
            {agent5a?.score_rationale && <p className="text-slate-400 text-xs leading-relaxed">{agent5a.score_rationale}</p>}
          </div>
          <div className="rounded-2xl p-5" style={{ background: utilDef.b, border: `1px solid ${utilDef.c}30` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: utilDef.c + 'aa' }}>Strategic Utility</p>
            <p className="text-white font-bold text-sm mb-3">{utilDef.label}</p>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Time horizon</span><span className="text-slate-300 font-medium capitalize">{(agent5c?.time_horizon || '—').replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Escalation probability</span><span className="text-slate-300 font-medium">{agent5c?.escalation_probability ?? '—'}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Classification</span><span className="text-slate-300 font-medium capitalize">{agent5c?.structural_vs_transient ?? '—'}</span></div>
            </div>
            {agent5c?.class_rationale && <p className="text-slate-400 text-xs leading-relaxed">{agent5c.class_rationale}</p>}
          </div>
        </div>

        {/* Attribute Breakdown */}
        {agent5a?.attribute_scores && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold text-sm mb-4">Attribute Breakdown</h2>
            <div className="space-y-3">
              {GEO_ATTRIBUTES.map(attr => {
                const score  = parseFloat(agent5a.attribute_scores[attr.key]) || 0;
                const isDom  = attr.key === agent5a.dominant_attribute;
                const isLow  = attr.key === agent5a.lowest_attribute;
                const col    = score >= 7 ? '#ef4444' : score >= 5 ? '#f97316' : score >= 3 ? '#f59e0b' : '#10b981';
                return (
                  <div key={attr.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{attr.label}</span>
                        {isDom && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-400 font-medium">dominant</span>}
                        {isLow && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-500 font-medium">lowest</span>}
                        <span className="text-xs text-slate-600">{attr.weight}%</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: col }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bilateral Leverage */}
        {agent5b && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-sm">Bilateral Leverage</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${agent5b.leverage_holder === 'sender' ? 'bg-blue-900/30 text-blue-400' : agent5b.leverage_holder === 'target' ? 'bg-orange-900/30 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                {agent5b.leverage_holder === 'sender' ? giResult.sender : agent5b.leverage_holder === 'target' ? giResult.target : 'Balanced'} holds leverage
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-blue-300 text-xs font-semibold">Sender: {giResult.sender}</p>
                  <span className="text-xs font-bold text-blue-300">{agent5b.sender_capacity?.score ?? '—'}/10</span>
                </div>
                {agent5b.sender_capacity?.dominant_advantage && <p className="text-slate-400 text-xs mb-1.5"><span className="text-slate-500">Key advantage: </span>{agent5b.sender_capacity.dominant_advantage}</p>}
                {agent5b.sender_capacity?.rationale && <p className="text-slate-500 text-xs leading-relaxed">{agent5b.sender_capacity.rationale}</p>}
              </div>
              <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-orange-300 text-xs font-semibold">Target: {giResult.target}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold ${agent5b.target_capacity?.vulnerability_level === 'HIGH' ? 'bg-red-900/30 text-red-400' : agent5b.target_capacity?.vulnerability_level === 'MODERATE' ? 'bg-orange-900/30 text-orange-400' : 'bg-green-900/30 text-green-400'}`}>{agent5b.target_capacity?.vulnerability_level || '?'} vulnerability</span>
                </div>
                {agent5b.target_capacity?.rationale && <p className="text-slate-500 text-xs leading-relaxed">{agent5b.target_capacity.rationale}</p>}
              </div>
            </div>
            {agent5b.chokepoints_identified?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Chokepoints identified</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent5b.chokepoints_identified.map((cp, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{cp}</span>)}
                </div>
              </div>
            )}
            {agent5b.retaliation_vectors?.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Retaliation vectors <span className={`ml-1 px-1.5 py-0.5 rounded ${agent5b.retaliation_capacity === 'HIGH' ? 'bg-red-900/30 text-red-400' : agent5b.retaliation_capacity === 'MODERATE' ? 'bg-orange-900/30 text-orange-400' : 'bg-green-900/30 text-green-400'}`}>{agent5b.retaliation_capacity}</span></p>
                <div className="space-y-1">
                  {agent5b.retaliation_vectors.map((rv, i) => <div key={i} className="flex items-start gap-1.5"><span className="text-orange-400 text-xs flex-shrink-0">•</span><p className="text-slate-400 text-xs leading-relaxed">{rv}</p></div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investment Signals */}
        {agent5d && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold text-sm mb-4">Investment Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { key: 'first_order_shocks',  label: 'First-Order Shocks',  color: '#ef4444' },
                { key: 'second_order_shocks', label: 'Second-Order Shocks', color: '#f59e0b' },
                { key: 'beneficiaries',       label: 'Beneficiaries',       color: '#10b981' },
              ].map(({ key, label, color }) => {
                const items = agent5d[key] || [];
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>{label}</p>
                    <div className="space-y-2">
                      {items.map((item, i) => {
                        const isShock = key !== 'beneficiaries';
                        const dir = isShock ? GEO_DIR[item.direction] : null;
                        return (
                          <div key={i} className="bg-slate-900/50 rounded-xl p-2.5">
                            <div className="flex items-start gap-1.5 mb-1">
                              {dir && <span className="text-xs font-bold flex-shrink-0" style={{ color: dir.c }}>{dir.label}</span>}
                              <p className="text-slate-200 text-xs font-medium leading-snug">{isShock ? item.sector : item.name}</p>
                              {isShock && item.magnitude && <span className="text-slate-600 text-xs flex-shrink-0 ml-auto">{item.magnitude}</span>}
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed">{isShock ? item.rationale : item.thesis}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Portfolio Signals */}
            {agent5d.portfolio_signals?.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">Portfolio Signals</p>
                <div className="space-y-2">
                  {agent5d.portfolio_signals.map((sig, i) => {
                    const ss = GEO_SIG[sig.type] || { c: '#94a3b8', b: '#94a3b815' };
                    return (
                      <div key={i} className="bg-slate-900/40 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-xs font-medium flex-1 min-w-0">{sig.signal}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0" style={{ background: ss.b, color: ss.c }}>{sig.type}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: GEO_CONV_C[sig.conviction] || '#94a3b8' }}>{sig.conviction}</span>
                        </div>
                        {sig.rationale && <p className="text-slate-500 text-xs leading-relaxed">{sig.rationale}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Hedging Recommendations */}
            {agent5d.hedging_recommendations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Hedging Recommendations</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent5d.hedging_recommendations.map((h, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300">{h}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strategic Summary */}
        {(syn?.strategic_summary || syn?.key_risks?.length > 0) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold text-sm mb-3">Strategic Assessment</h2>
            {syn.strategic_summary && <p className="text-slate-400 text-xs leading-relaxed mb-4">{syn.strategic_summary}</p>}
            {syn.key_risks?.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Key risks</p>
                <div className="space-y-1">
                  {syn.key_risks.map((r, i) => <div key={i} className="flex items-start gap-1.5"><span className="text-red-400 text-xs flex-shrink-0 mt-0.5">⚑</span><p className="text-slate-400 text-xs leading-relaxed">{r}</p></div>)}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center pb-4">
          <button onClick={resetGi} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">New assessment</button>
        </div>

      </div>
    </div>
  );
}

// ── Big Cycle Engine static data ─────────────────────────────────────────────
const EMPIRE_STAGES_DATA = [
  { n: 1, label: 'New Order / Rising',  c: '#10b981', b: '#10b98112', p: 'Aggressive long' },
  { n: 2, label: 'Building Power',      c: '#3b82f6', b: '#3b82f612', p: 'Growth' },
  { n: 3, label: 'Peak Power',          c: '#06b6d4', b: '#06b6d412', p: 'Balanced / selective' },
  { n: 4, label: 'Overextension',       c: '#eab308', b: '#eab30812', p: 'Defensive rotation begins' },
  { n: 5, label: 'Decline',            c: '#f97316', b: '#f9731612', p: 'Wealth preservation priority' },
  { n: 6, label: 'Crisis / Reset',     c: '#ef4444', b: '#ef444412', p: 'Maximum defensive posture' },
];
const BCE_PIPELINE = [
  { key: 'agent1',     label: 'Five Forces Diagnostician', sub: 'Empire stage · Force dimension scoring' },
  { key: 'agent2',     label: 'Debt & Bubble Analyst',     sub: 'Debt sustainability · Bubble detection' },
  { key: 'agent3',     label: 'Scenario Architect',        sub: 'Currency regime · Historical analogy' },
  { key: 'agent4',     label: 'Decision Matrix Executor',  sub: "Allocation matrix · The Spider's Move" },
  { key: 'supervisor', label: 'Supervisor Synthesis',      sub: 'Conflict resolution · Unified report' },
];
const BCE_REC_STYLE = {
  LONG:     { c: '#10b981', b: '#10b98115' },
  SHORT:    { c: '#ef4444', b: '#ef444415' },
  HOLD:     { c: '#64748b', b: '#64748b15' },
  AVOID:    { c: '#ef4444', b: '#ef444415' },
  REDUCE:   { c: '#f97316', b: '#f9731615' },
  INCREASE: { c: '#10b981', b: '#10b98115' },
};
const BCE_CONV  = { HIGH: '#10b981', MODERATE: '#f59e0b', LOW: '#94a3b8' };
const BCE_FORCE = { debt: 'Debt / Money', internal_order: 'Internal Order', external_order: 'External Order', nature: 'Nature / Climate', technology: 'Technology' };
const BCE_WGHT  = { debt: 30, internal_order: 25, external_order: 20, technology: 15, nature: 10 };
const BCE_FLAG_STYLE = {
  CRITICAL_DEBT:     { c: '#ef4444', b: '#ef444415' },
  WAR_ECONOMY:       { c: '#f97316', b: '#f9731615' },
  JURISDICTION_RISK: { c: '#eab308', b: '#eab30815' },
  BUBBLE_ALERT:      { c: '#f97316', b: '#f9731615' },
};
const BCE_EXAMPLES = ['United States', 'China', 'Eurozone', 'Japan', 'United Kingdom', 'Emerging Markets'];
// ─────────────────────────────────────────────────────────────────────────────

function BigCycleEngineTool() {
  const [step, setStep] = useState('form');
  const [bceSubject, setBceSubject] = useState('');
  const [bceError, setBceError] = useState('');
  const [bceAgents, setBceAgents] = useState({ agent1: 'pending', agent2: 'pending', agent3: 'pending', agent4: 'pending', supervisor: 'pending' });
  const [bceResult, setBceResult] = useState(null);

  const runBce = async () => {
    if (!bceSubject.trim()) return;
    setStep('running');
    setBceError('');
    setBceAgents({ agent1: 'running', agent2: 'pending', agent3: 'pending', agent4: 'pending', supervisor: 'pending' });
    setBceResult(null);
    try {
      const res = await fetch('/api/big-cycle-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: bceSubject.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let ev;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }
          if (ev.event === 'agent_start') {
            setBceAgents(s => ({ ...s, [ev.agent]: 'running' }));
          } else if (ev.event === 'agent_complete') {
            setBceAgents(s => { const n = { ...s, [ev.agent]: 'complete' }; if (ev.next) n[ev.next] = 'running'; return n; });
          } else if (ev.event === 'complete') {
            setBceResult(ev.result);
            setBceAgents({ agent1: 'complete', agent2: 'complete', agent3: 'complete', agent4: 'complete', supervisor: 'complete' });
            setStep('result');
          } else if (ev.event === 'error') {
            throw new Error(ev.message);
          }
        }
      }
    } catch (err) {
      setBceError(err.message);
      setStep('form');
    }
  };

  const resetBce = () => {
    setStep('form');
    setBceResult(null);
    setBceError('');
    setBceAgents({ agent1: 'pending', agent2: 'pending', agent3: 'pending', agent4: 'pending', supervisor: 'pending' });
  };

  if (step === 'form') return (
    <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-4 flex items-center justify-center text-xl font-black text-white shadow-xl">⊕</div>
          <h1 className="text-2xl font-black text-white mb-2">Big Cycle Engine</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Five-agent sequential pipeline based on the Dalio Big Cycle framework. Enter a country or economic entity to run empire stage classification, debt sustainability analysis, scenario architecture, and allocation matrix generation.
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
          <input
            type="text"
            value={bceSubject}
            onChange={e => setBceSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && bceSubject.trim() && runBce()}
            placeholder="e.g. United States, China, Eurozone"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-amber-500/60 focus:outline-none transition-colors mb-4"
          />
          <div className="mb-4">
            <p className="text-xs text-slate-600 mb-2">Quick-pick</p>
            <div className="flex flex-wrap gap-1.5">
              {BCE_EXAMPLES.map(s => (
                <button key={s} onClick={() => setBceSubject(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                >{s}</button>
              ))}
            </div>
          </div>
          <button
            onClick={runBce}
            disabled={!bceSubject.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#d97706,#ea580c)' }}
          >Run Big Cycle Engine</button>
          {bceError && (
            <div className="mt-4 bg-red-950/50 border border-red-800 rounded-xl p-3">
              <p className="text-red-300 text-xs">{bceError}</p>
            </div>
          )}
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Pipeline</h2>
          <div className="space-y-3">
            {BCE_PIPELINE.map((a, i) => (
              <div key={a.key} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0 font-mono mt-0.5">{i + 1}</div>
                <div>
                  <p className="text-white text-xs font-medium">{a.label}</p>
                  <p className="text-slate-600 text-xs">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 'running') return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-4 flex items-center justify-center text-xl font-black text-white shadow-xl animate-pulse">⊕</div>
          <h2 className="text-white font-bold text-lg">Running Big Cycle Engine</h2>
          <p className="text-slate-500 text-sm mt-1">{bceSubject}</p>
        </div>
        <div className="space-y-2">
          {BCE_PIPELINE.map(a => {
            const st = bceAgents[a.key];
            return (
              <div key={a.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${st === 'complete' ? 'bg-green-950/25 border-green-900/40' : st === 'running' ? 'bg-amber-950/25 border-amber-800/50' : 'bg-slate-800/30 border-slate-800'}`}>
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${st === 'complete' ? 'bg-green-500/20 text-green-400' : st === 'running' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-600'}`}>
                  {st === 'complete' ? '✓' : st === 'running' ? '◌' : '○'}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${st === 'running' ? 'text-amber-300' : st === 'complete' ? 'text-green-300' : 'text-slate-500'}`}>{a.label}</p>
                  <p className="text-slate-600 text-xs truncate">{a.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!bceResult) return null;
  const { synthesis: syn, layers } = bceResult;
  const { layer1, layer2, layer3, layer4 } = layers || {};
  const stg = EMPIRE_STAGES_DATA.find(s => s.n === syn?.empire_stage) || EMPIRE_STAGES_DATA[2];
  const confColor = BCE_CONV[syn?.confidence] || '#94a3b8';
  const alloc = syn?.allocation_summary?.length ? syn.allocation_summary : (layer4?.allocation_matrix || []);

  return (
    <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#d97706,#ea580c)' }}>⊕</div>
              <h1 className="text-xl font-black text-white truncate">{bceResult.subject}</h1>
            </div>
            <p className="text-slate-500 text-xs pl-10">Big Cycle Engine · {new Date(bceResult.generatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {syn?.confidence && <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: confColor + '20', color: confColor }}>{syn.confidence} confidence</span>}
            {syn?.agent_agreement != null && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-400">{syn.agent_agreement}/4 agents agree</span>}
            <button onClick={resetBce} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">New analysis</button>
          </div>
        </div>

        {/* Active flags */}
        {syn?.active_flags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {syn.active_flags.map(f => {
              const fs = BCE_FLAG_STYLE[f] || { c: '#94a3b8', b: '#94a3b815' };
              return <span key={f} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: fs.b, color: fs.c }}>⚑ {f.replace(/_/g, ' ')}</span>;
            })}
          </div>
        )}

        {/* Empire Stage + Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-5" style={{ background: stg.b, border: `1px solid ${stg.c}30` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-black" style={{ background: stg.c + '25', color: stg.c }}>{syn?.empire_stage ?? '?'}</div>
              <div>
                <p className="text-white font-bold text-sm">{stg.label}</p>
                <p className="text-xs" style={{ color: stg.c + 'bb' }}>Empire Stage {syn?.empire_stage}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Investment posture</span><span className="text-slate-300 font-medium">{stg.p}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Composite score</span><span className="text-slate-300 font-medium">{layer1?.composite_score != null ? Number(layer1.composite_score).toFixed(1) : '—'} / 10</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Power trajectory</span><span className="text-slate-300 font-medium capitalize">{layer1?.power_trajectory ?? '—'}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Dominant force</span><span className="text-slate-300 font-medium">{BCE_FORCE[layer1?.dominant_force] ?? layer1?.dominant_force ?? '—'}</span></div>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col">
            <h2 className="text-white font-bold text-sm mb-2">Executive Summary</h2>
            <p className="text-slate-400 text-xs leading-relaxed flex-1">{syn?.executive_summary || layer1?.stage_rationale || '—'}</p>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700">
              <div><p className="text-slate-600 text-xs">Printing probability</p><p className="text-white font-bold text-sm">{syn?.printing_probability ?? layer2?.printing_probability ?? '—'}%</p></div>
              <div><p className="text-slate-600 text-xs">Rerun cadence</p><p className="text-white font-bold text-sm capitalize">{(syn?.rerun_cadence || '—').toLowerCase()}</p></div>
            </div>
          </div>
        </div>

        {/* Five Forces */}
        {layer1?.force_scores && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold text-sm mb-4">Five Forces</h2>
            <div className="space-y-3">
              {Object.entries(layer1.force_scores).map(([key, score]) => {
                const s = parseFloat(score) || 0;
                const isDom = key === layer1.dominant_force;
                const col = s >= 7 ? '#ef4444' : s >= 5 ? '#f97316' : s >= 3 ? '#f59e0b' : '#10b981';
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-300">{BCE_FORCE[key] || key}</span>
                        {isDom && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 font-medium">dominant</span>}
                        <span className="text-xs text-slate-600">{BCE_WGHT[key]}%</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: col }}>{s.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s / 10) * 100}%`, background: col }} />
                    </div>
                    {layer1.force_rationales?.[key] && <p className="text-slate-600 text-xs mt-1 leading-relaxed">{layer1.force_rationales[key]}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Debt & Bubble */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-3">Debt Sustainability</h2>
            {layer2 ? <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${layer2.debt_status === 'PONZI_FINANCE' ? 'bg-red-900/30 text-red-400' : layer2.debt_status === 'UNSUSTAINABLE' ? 'bg-orange-900/30 text-orange-400' : layer2.debt_status === 'BORDERLINE' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>{(layer2.debt_status || '').replace(/_/g, ' ')}</span>
                {layer2.critical_debt_flag && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 font-semibold">⚑ CRITICAL</span>}
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs"><span className="text-slate-500">MP Stage</span><span className="text-slate-300 font-medium">{layer2.mp_stage || '—'}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">i − g differential</span><span className="text-slate-300 font-medium">{layer2.i_minus_g != null ? Number(layer2.i_minus_g).toFixed(1) : '—'}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Printing probability</span><span className="text-slate-300 font-medium">{layer2.printing_probability ?? '—'}%</span></div>
              </div>
              {layer2.debt_rationale && <p className="text-slate-500 text-xs leading-relaxed">{layer2.debt_rationale}</p>}
            </> : <p className="text-slate-600 text-xs">No data</p>}
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-3">Bubble Detection</h2>
            {layer2 ? <>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-2xl font-black ${layer2.bubble_alert ? 'text-orange-400' : 'text-slate-400'}`}>{layer2.bubble_score ?? 0}/7</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${layer2.bubble_severity === 'EXTREME' ? 'bg-red-900/30 text-red-400' : layer2.bubble_severity === 'HIGH' ? 'bg-orange-900/30 text-orange-400' : layer2.bubble_severity === 'MODERATE' ? 'bg-yellow-900/30 text-yellow-400' : layer2.bubble_severity === 'LOW' ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-700 text-slate-500'}`}>{layer2.bubble_severity || 'NONE'}</span>
                {layer2.bubble_alert && <span className="text-xs text-orange-400 font-semibold">⚠ ALERT</span>}
              </div>
              {layer2.bubble_conditions_met?.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <span className="text-orange-400 text-xs mt-0.5 flex-shrink-0">•</span>
                  <p className="text-slate-500 text-xs leading-relaxed">{c}</p>
                </div>
              ))}
              {layer2.bubble_rationale && <p className="text-slate-500 text-xs leading-relaxed mt-2">{layer2.bubble_rationale}</p>}
            </> : <p className="text-slate-600 text-xs">No data</p>}
          </div>
        </div>

        {/* Scenario */}
        {layer3 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-white font-bold text-sm mb-1.5">Scenario</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${layer3.scenario_type === 'DEFLATIONARY_DEPRESSION' ? 'bg-blue-900/30 text-blue-400' : layer3.scenario_type === 'INFLATIONARY_DEPRESSION' ? 'bg-orange-900/30 text-orange-400' : 'bg-red-900/30 text-red-400'}`}>{layer3.scenario_label || (layer3.scenario_type || '').replace(/_/g, ' ')}</span>
                  <span className="text-slate-600 text-xs capitalize">{layer3.phase} phase</span>
                  {layer3.war_economy_flag && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-400 font-semibold">⚑ WAR ECONOMY</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Historical analogy</p>
                <p className="text-slate-200 text-sm font-bold">{layer3.analogy_label || (layer3.analogy_id || '').replace(/_/g, ' ')}</p>
                <p className="text-xs" style={{ color: BCE_CONV[layer3.analogy_confidence] || '#94a3b8' }}>{layer3.analogy_confidence} confidence</p>
              </div>
            </div>
            {layer3.mechanism && <p className="text-slate-400 text-xs leading-relaxed mb-4">{layer3.mechanism}</p>}
            {layer3.warning_signals?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Warning signals</p>
                <div className="space-y-1">
                  {layer3.warning_signals.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5"><span className="text-yellow-500 text-xs mt-0.5 flex-shrink-0">⚠</span><p className="text-slate-400 text-xs leading-relaxed">{w}</p></div>
                  ))}
                </div>
              </div>
            )}
            {(layer3.arb_signals?.pre_print || layer3.arb_signals?.post_print) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['pre_print', 'Pre-print signals'], ['post_print', 'Post-print signals']].map(([key, lbl]) => {
                  const sig = layer3.arb_signals?.[key];
                  if (!sig) return null;
                  return (
                    <div key={key} className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{lbl}</p>
                      {sig.long?.length > 0 && <p className="text-xs mb-1"><span className="text-green-400 font-medium">Long: </span><span className="text-slate-400">{sig.long.join(', ')}</span></p>}
                      {sig.short?.length > 0 && <p className="text-xs"><span className="text-red-400 font-medium">Short: </span><span className="text-slate-400">{sig.short.join(', ')}</span></p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* The Spider's Move */}
        {(syn?.primary_action || layer4?.primary_action) && (
          <div className="mb-6 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#d9770618,#ea580c18)', border: '1px solid #d9770635' }}>
            <p className="text-xs text-orange-400/70 uppercase tracking-wider mb-2 font-semibold">The Spider's Move</p>
            <p className="text-white font-bold text-base leading-snug">{syn?.primary_action || layer4?.primary_action}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {layer4?.cycle_stage && <div className="text-xs"><span className="text-slate-500">Cycle stage </span><span className="text-slate-300 font-medium">{layer4.cycle_stage.replace(/_/g, ' ')}</span></div>}
              {layer4?.position_sizing && <div className="text-xs"><span className="text-slate-500">Position sizing </span><span className="text-slate-300 font-medium">{layer4.position_sizing.replace(/_/g, ' ')}</span></div>}
              {layer4?.jurisdiction_risk_score != null && <div className="text-xs"><span className="text-slate-500">Jurisdiction risk </span><span className="text-slate-300 font-medium">{Number(layer4.jurisdiction_risk_score).toFixed(1)}/10</span></div>}
            </div>
            {layer4?.jurisdiction_override && layer4?.jurisdiction_action && (
              <div className="mt-3 flex items-start gap-2 pt-3 border-t border-orange-800/30">
                <span className="text-yellow-400 text-xs flex-shrink-0">⚑</span>
                <p className="text-yellow-400 text-xs font-medium">{layer4.jurisdiction_action}</p>
              </div>
            )}
          </div>
        )}

        {/* Allocation Matrix */}
        {alloc.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold text-sm mb-4">Allocation Matrix</h2>
            <div className="space-y-2">
              {alloc.map((item, i) => {
                const rs = BCE_REC_STYLE[item.recommendation] || { c: '#94a3b8', b: '#94a3b815' };
                return (
                  <div key={i} className="bg-slate-900/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-xs font-medium flex-1 min-w-0">{item.asset_class}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0" style={{ background: rs.b, color: rs.c }}>{item.recommendation}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: BCE_CONV[item.conviction] || '#94a3b8' }}>{item.conviction}</span>
                    </div>
                    {item.rationale && <p className="text-slate-500 text-xs leading-relaxed">{item.rationale}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback loops */}
        {syn?.feedback_loops_active && (syn.feedback_loops_active.wealth_confiscation || syn.feedback_loops_active.war_economy) && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 mb-6">
            <h2 className="text-red-300 font-bold text-sm mb-3">Active Feedback Loops</h2>
            <div className="space-y-2">
              {syn.feedback_loops_active.wealth_confiscation && (
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs flex-shrink-0">⊗</span>
                  <div>
                    <p className="text-red-300 text-xs font-semibold">Wealth Confiscation Loop</p>
                    <p className="text-red-400/60 text-xs leading-relaxed">Debt unmanageable → taxes and capital controls rise → capital flight accelerates → more printing required</p>
                  </div>
                </div>
              )}
              {syn.feedback_loops_active.war_economy && (
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 text-xs flex-shrink-0">⊗</span>
                  <div>
                    <p className="text-orange-300 text-xs font-semibold">War Economy Loop</p>
                    <p className="text-orange-400/60 text-xs leading-relaxed">External conflict → supply chains fragment → import prices spike → CB cannot tighten (debt too high) → stagflation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center pb-4">
          <button onClick={resetBce} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">New analysis</button>
        </div>

      </div>
    </div>
  );
}

function RASCEFTool() {
  const [step, setStep] = useState('form'); // 'form' | 'result'
  const [form, setForm] = useState({ role: '', usecase: '', audience: '', goals: '', outputFormat: 'structured' });
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [tokens, setTokens] = useState(null);

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.role.trim()) e.role = 'Role or function is required.';
    if (!form.usecase.trim()) e.usecase = 'Use case is required.';
    return e;
  };

  const generate = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/rascef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: form.role, usecase: form.usecase, audience: form.audience, goals: form.goals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setResult(data.result);
      setTokens(data.tokens);
      setStep('result');
    } catch (err) {
      setGenError(err.message);
    }
    setGenerating(false);
  };

  const reset = () => { setStep('form'); setResult(null); setGenError(''); setTokens(null); };

  const copyText = async (text, key) => {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const buildFullStructured = () => {
    if (!result) return '';
    return RASCEF_ELEMENTS.map(el => `[${el.key}] ${el.label.toUpperCase()}\n${result[el.key]}`).join('\n\n');
  };

  // ── Result view ────────────────────────────────────────────────
  if (step === 'result' && result) {
    const isStructured = form.outputFormat === 'structured';
    return (
      <div className="min-h-full bg-[#07070e] text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#09090f]/95 backdrop-blur-xl border-b border-violet-500/10">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
            <button onClick={reset} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              New prompt
            </button>
            <div className="flex-1" />
            {/* Format toggle */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button onClick={() => setForm(f => ({...f, outputFormat: 'structured'}))} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${form.outputFormat === 'structured' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Structured</button>
              <button onClick={() => setForm(f => ({...f, outputFormat: 'single'}))} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${form.outputFormat === 'single' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Single prompt</button>
            </div>
            {tokens && <span className="text-xs text-slate-600">{tokens.toLocaleString()} tokens</span>}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4 pb-12">
          {/* Context recap */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap gap-3 text-xs">
            <span className="text-slate-600 font-semibold uppercase tracking-wider">Generated for</span>
            <span className="text-white font-semibold">{form.role}</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400 truncate max-w-xs">{form.usecase}</span>
            {form.audience && <><span className="text-slate-700">·</span><span className="text-slate-500">Audience: {form.audience}</span></>}
          </div>

          {isStructured ? (
            <>
              {/* Copy all */}
              <div className="flex justify-end">
                <button onClick={() => copyText(buildFullStructured(), 'all')} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700">
                  {copied === 'all' ? '✓ Copied all' : 'Copy all sections'}
                </button>
              </div>

              {/* 6 RASCEF cards */}
              {RASCEF_ELEMENTS.map(el => (
                <div key={el.key} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800" style={{ background: `${el.color}10` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: `${el.color}20`, color: el.color, border: `1.5px solid ${el.color}40` }}>{el.key}</div>
                      <div>
                        <span className="text-white font-bold text-sm">{el.label}</span>
                        <span className="text-slate-600 text-xs ml-2">{el.desc.split(' — ')[0]}</span>
                      </div>
                    </div>
                    <button onClick={() => copyText(result[el.key], el.key)} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 flex-shrink-0">
                      {copied === el.key ? <><span>✓</span> Copied</> : <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v5a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> Copy</>}
                    </button>
                  </div>
                  {/* Card body */}
                  <div className="px-5 py-4">
                    {el.key === 'A' ? (
                      <ul className="space-y-1.5">
                        {result[el.key].split('\n- ').filter(Boolean).map((line, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-200 leading-relaxed">
                            <span style={{ color: el.color }} className="flex-shrink-0 mt-0.5">▸</span>
                            <span>{line.replace(/^- /, '')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : el.key === 'E' ? (
                      <div className="space-y-2">
                        {result[el.key].split(' | ').map((part, i) => {
                          const [label, ...rest] = part.split(': ');
                          return (
                            <div key={i} className={`rounded-xl px-4 py-3 text-sm ${i === 0 ? 'bg-slate-800 border border-slate-700' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                              <span className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: el.color }}>{label}</span>
                              <span className="text-slate-300 leading-relaxed">{rest.join(': ')}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-200 text-sm leading-relaxed">{result[el.key]}</p>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* Single one-liner view */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-violet-950/30">
                <div>
                  <p className="text-white font-bold text-sm">Ready-to-paste System Prompt</p>
                  <p className="text-slate-500 text-xs mt-0.5">Copy and paste directly into any AI tool as the system prompt</p>
                </div>
                <button onClick={() => copyText(result.oneLiner, 'oneLiner')} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity border border-violet-700/50 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4c1d95,#1e3a5f)' }}>
                  {copied === 'oneLiner' ? '✓ Copied!' : '⎘ Copy prompt'}
                </button>
              </div>
              <div className="px-5 py-5">
                <p className="text-slate-200 text-sm leading-loose font-mono">{result.oneLiner}</p>
              </div>
            </div>
          )}

          {/* Also show one-liner beneath structured */}
          {isStructured && result.oneLiner && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Single copy-paste prompt</p>
                <button onClick={() => copyText(result.oneLiner, 'oneLiner')} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700">
                  {copied === 'oneLiner' ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-slate-400 text-sm leading-relaxed font-mono">{result.oneLiner}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center pt-2">
            <button onClick={reset} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white border border-slate-700 hover:border-slate-500 transition-colors bg-slate-800 hover:bg-slate-700">
              ↩ Generate another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form / Landing view ────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#07070e] text-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 pb-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl font-black" style={{ background: 'linear-gradient(135deg,#4c1d95,#1e3a5f)', border: '1px solid #4c1d9540' }}>⚡</div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-3">RASCEF Prompt Generator</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
            Enter your role and use case. Get a fully structured AI prompt — calibrated to your audience, goals, and working context — ready to paste into any AI tool.
          </p>
        </div>

        {/* What is RASCEF */}
        <div className="bg-[#0f0f1b]/80 border border-violet-500/10 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">What is RASCEF?</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-900 text-violet-300 border border-violet-700 font-semibold">Framework</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-5">
            RASCEF is a six-element prompt engineering framework that produces AI instructions far more precise than a generic system prompt. Instead of telling an AI "be helpful," RASCEF defines exactly who the AI is, what it does, how it communicates, what context it operates in, what good output looks like, and how to structure its responses.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {RASCEF_ELEMENTS.map(el => (
              <div key={el.key} className="rounded-xl p-3 border" style={{ background: `${el.color}08`, borderColor: `${el.color}25` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${el.color}20`, color: el.color }}>{el.key}</div>
                  <span className="text-white text-xs font-bold">{el.label}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{el.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-start gap-0 mb-8">
          {[
            { n: '1', label: 'Describe your role and use case', sub: 'Two required fields — everything else sharpens the output' },
            { n: '2', label: 'Choose your output format', sub: 'Full structured breakdown or a single ready-to-paste prompt' },
            { n: '3', label: 'Copy and use immediately', sub: 'Paste into any AI tool — ChatGPT, Claude, Gemini, or your own' },
          ].map((s, i) => (
            <div key={s.n} className="flex-1 flex gap-2 px-2">
              <div className="flex flex-col items-center gap-0">
                <div className="w-7 h-7 rounded-full bg-violet-900 border border-violet-700 flex items-center justify-center text-xs font-black text-violet-300 flex-shrink-0">{s.n}</div>
                {i < 2 && <div className="w-px flex-1 bg-slate-800 mt-1" style={{ minHeight: 24 }} />}
              </div>
              <div className="pb-5">
                <p className="text-white text-xs font-semibold leading-snug mb-0.5">{s.label}</p>
                <p className="text-slate-600 text-xs">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your details</h2>

          {/* Role */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              Role or function
              <span className="text-red-500">*</span>
              <span className="text-slate-600 font-normal ml-auto">e.g. Sales Engineer · HR Business Partner · Financial Analyst</span>
            </label>
            <input
              type="text"
              value={form.role}
              onChange={e => setField('role', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('rascef-usecase').focus()}
              placeholder="Your job title, team, or functional area…"
              className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${errors.role ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-violet-500'}`}
            />
            {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
          </div>

          {/* Use case */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              Use case
              <span className="text-red-500">*</span>
              <span className="text-slate-600 font-normal ml-auto">The more specific, the better</span>
            </label>
            <textarea
              id="rascef-usecase"
              value={form.usecase}
              onChange={e => setField('usecase', e.target.value)}
              placeholder={"What do you need the AI to help you do?\n\nExamples:\n• Drafting executive briefings before client calls\n• Summarizing competitive intel from analyst reports\n• Turning raw data into board-ready slide narratives"}
              rows={5}
              className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors resize-none ${errors.usecase ? 'border-red-700 focus:border-red-500' : 'border-slate-700 focus:border-violet-500'}`}
            />
            {errors.usecase && <p className="text-red-400 text-xs mt-1">{errors.usecase}</p>}
          </div>

          {/* Audience + Goals — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                Audience
                <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.audience}
                onChange={e => setField('audience', e.target.value)}
                placeholder="e.g. C-suite · External clients · My team"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                Goals
                <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.goals}
                onChange={e => setField('goals', e.target.value)}
                placeholder="e.g. Save 2 hrs/week · Exec-ready output"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Output format */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Output format</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'structured', label: 'Structured (R/A/S/C/E/F)', sub: 'Six labeled sections — ideal for reviewing and customizing each element' },
                { val: 'single',     label: 'Single copy-paste prompt', sub: 'One paragraph, ready to drop into any AI tool as-is' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setForm(f => ({ ...f, outputFormat: opt.val }))}
                  className={`text-left rounded-xl p-4 border transition-colors ${form.outputFormat === opt.val ? 'border-violet-600 bg-violet-950/40' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.outputFormat === opt.val ? 'border-violet-500 bg-violet-500' : 'border-slate-600'}`}>
                      {form.outputFormat === opt.val && <div className="w-full h-full rounded-full bg-white scale-50 block" />}
                    </div>
                    <span className="text-white text-xs font-semibold">{opt.label}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed pl-6">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {genError && (
            <div className="p-4 rounded-xl bg-red-950 border border-red-800">
              <p className="text-red-300 text-sm">{genError}</p>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#4c1d95,#1e3a5f)' }}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                Generating your RASCEF prompt…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4H13L9.5 7.5 11 12 7 9.5 3 12l1.5-4.5L1 5h4.5L7 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                Generate RASCEF Prompt
              </>
            )}
          </button>

          <p className="text-center text-slate-700 text-xs">Powered by Groq · Each generation is a fresh, stateless API call</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { subject, status, agentStatuses, steepData, synthesis, activeTab, selectedModel, groqStatus, availableModels,
          ticker, fundamentals, investmentThesis, thesisStatus,
          predictionMarkets, predictionStatus } = state;

  const isRunning  = ['classifying', 'researching', 'synthesizing'].includes(status);
  const isComplete = status === 'complete';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  // ── Auto-trigger Prediction Markets fetch immediately after synthesis ──
  useEffect(() => {
    if (status === 'complete' && predictionStatus === 'idle') {
      runPredictionFetch(state.subject, state.subjectType, state.synthesis, dispatch);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // ── Pre-fetch live data in parallel before agents run ─────────────────
      // Macro data (always; no key required)
      let macroPayload = null;
      try {
        const macroRes = await fetch('/api/macro');
        const macroJson = await macroRes.json();
        if (macroJson.found) {
          macroPayload = macroJson;
          dispatch({ type: 'SET_MACRO_DATA', data: macroJson });
        }
      } catch { /* non-fatal — economic agent runs without live macro */ }

      // Sentiment data (only when ticker is known and key may be set)
      let sentimentPayload = null;
      if (activeTicker) {
        try {
          const sentRes = await fetch(`/api/sentiment?ticker=${encodeURIComponent(activeTicker)}`);
          const sentJson = await sentRes.json();
          if (sentJson.found) {
            sentimentPayload = sentJson;
            dispatch({ type: 'SET_SENTIMENT_DATA', data: sentJson });
          }
        } catch { /* non-fatal — social agent runs without sentiment grounding */ }
      }

      // ── Per-dimension search angles — keep tight so Tavily returns relevant hits
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

          // Build live-data injection blocks for Social and Economic agents
          let liveDataBlock = '';
          if (key === 'social' && sentimentPayload) {
            liveDataBlock = buildSentimentBlock(sentimentPayload) + '\n\n';
          } else if (key === 'economic' && macroPayload) {
            liveDataBlock = buildMacroBlock(macroPayload) + '\n\n';
          }

          const data = await callAgent(
            prompt,
            `${liveDataBlock}Conduct a senior-analyst ${dim} dimension STEEP analysis on: "${subject}" (classified as: ${subjectType}). Apply the WRITING STANDARD strictly: name specifics, show causality, surface second-order effects, be decision-relevant, no boilerplate. Ground every driver.evidence entry in the live sources below where relevant — cite the source URL inside the evidence string. Return only valid JSON matching the schema exactly.

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

  const coreTabs = [
    { key: 'overview', label: 'Overview',  icon: '◉' },
    { key: 'forcemap', label: 'Force Map', icon: '◈' },
    { key: 'roadmap',  label: 'Roadmap',   icon: '→' },
    ...(hasTicker ? [{ key: 'thesis', label: 'Thesis', icon: '◎', badge: thesisStatus }] : []),
  ];
  const topOnlyTabs = isComplete ? [
    { key: 'dataviz',  label: 'Data Viz',  icon: '▦' },
    { key: 'bigcycle', label: 'Big Cycle', icon: '⬡' },
    { key: 'markets',  label: 'Prediction Markets', icon: '◎', badge: predictionStatus === 'loading' ? 'loading' : predictionStatus === 'complete' && predictionMarkets?.length > 0 ? 'complete' : undefined },
  ] : [];
  const tabs = [...coreTabs, ...topOnlyTabs];

  return (
    <div className="flex h-screen bg-[#07070e] overflow-hidden">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={closeSidebar} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#09090f]/95 backdrop-blur-xl border-r border-violet-500/10 flex flex-col overflow-y-auto transition-transform duration-300 md:relative md:z-auto md:w-64 md:flex-shrink-0 md:translate-x-0 sidebar-glow ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Branding */}
        <div className="px-5 py-4 border-b border-violet-500/10">
          <div className="flex items-center gap-2.5 mb-1">
            <button
              onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'home' }); closeSidebar(); }}
              className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left"
            >
              <img src="/stint-logo.png" alt="STINT Studio" className="h-7 w-auto object-contain flex-shrink-0 mix-blend-screen" />
              <span className="font-bold text-white">STINT Studio</span>
            </button>
            <button onClick={closeSidebar} className="ml-auto md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Close menu">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          <p className="text-slate-600 text-xs">Applied Strategy & Intelligence</p>
        </div>

        {/* Groq panel */}
        <GroqPanel state={state} dispatch={dispatch} />

        {/* Subject + Run */}
        <div className="px-4 py-4 border-b border-violet-500/10 space-y-2">
          <label className="block text-xs text-slate-500 font-medium">Subject to Analyze</label>
          <input
            type="text"
            value={subject}
            onChange={e => dispatch({ type: 'SET_SUBJECT', payload: e.target.value })}
            placeholder="e.g. quantum computing"
            disabled={isRunning}
            onKeyDown={e => e.key === 'Enter' && !isRunning && subject.trim() && handleAnalysis()}
            className="w-full bg-slate-900/80 border border-violet-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={() => { handleAnalysis(); closeSidebar(); }}
            disabled={isRunning || !subject.trim() || groqStatus !== 'online'}
            className="w-full py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: isRunning ? 'linear-gradient(135deg,#2e1065,#4c1d95)' : 'linear-gradient(135deg,#6d28d9,#7c3aed)' }}
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
          <div className="px-4 py-4 border-b border-violet-500/10">
            <ProgressPanel agentStatuses={agentStatuses} status={status} />
          </div>
        )}

        {/* Tab nav */}
        {isComplete && (
          <nav className="flex-1 px-3 py-3">
            <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Dashboard</p>
            {coreTabs.map(tab => (
              <button key={tab.key} onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key }); closeSidebar(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === tab.key ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}>
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
              </button>
            ))}
          </nav>
        )}

        {/* Toolkit — STEEP Analysis + RASCEF Generator */}
        <div className="px-3 py-3 border-t border-violet-500/10">
          <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Toolkit</p>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: null }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === null ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">📊</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">STEEP Analysis</span>
              <span className="block text-slate-600 text-xs">Six-agent intelligence framework</span>
            </span>
            {activeTab === null && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'rascef' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'rascef' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">⚡</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">RASCEF Generator</span>
              <span className="block text-slate-600 text-xs">AI prompt engineering</span>
            </span>
            {activeTab === 'rascef' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'bigcycleengine' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'bigcycleengine' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">⊕</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">Big Cycle Engine</span>
              <span className="block text-slate-600 text-xs">Dalio Big Cycle pipeline</span>
            </span>
            {activeTab === 'bigcycleengine' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoinstrument' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'geoinstrument' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">◈</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">GeoEcon Instrument</span>
              <span className="block text-slate-600 text-xs">Farrell & Newman framework</span>
            </span>
            {activeTab === 'geoinstrument' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Insights — Thought Leadership + Innovator Illumination */}
        <div className="px-3 py-3 border-t border-violet-500/10">
          <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Insights</p>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'thoughtleadership' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'thoughtleadership' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">✍</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">Thought Leadership</span>
              <span className="block text-slate-600 text-xs">Intelligence briefs</span>
            </span>
            {activeTab === 'thoughtleadership' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'innovatorillumination' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'innovatorillumination' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">💡</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">Innovator Illumination</span>
              <span className="block text-slate-600 text-xs">Technology spotlights</span>
            </span>
            {activeTab === 'innovatorillumination' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Studio — About */}
        <div className="px-3 py-3 border-t border-violet-500/10">
          <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Studio</p>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'about' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'about' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">◎</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">About</span>
              <span className="block text-slate-600 text-xs">Studio & Taylor Grenawalt</span>
            </span>
            {activeTab === 'about' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Examples */}
        <div className="px-3 py-3 border-t border-violet-500/10">
          <p className="text-xs text-slate-600 px-2 mb-2 uppercase tracking-widest font-semibold">Examples</p>
          <button
            onClick={() => { dispatch({ type: 'LOAD_EXAMPLE', payload: QUANTUM_COMPUTING_EXAMPLE }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${status === 'complete' && subject === QUANTUM_COMPUTING_EXAMPLE.subject ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">⚛</span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-medium">Quantum Computing</span>
              <span className="block text-slate-600 text-xs">Pre-run example</span>
            </span>
            {status === 'complete' && subject === QUANTUM_COMPUTING_EXAMPLE.subject && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
            )}
          </button>
          <button
            onClick={() => { dispatch({ type: 'LOAD_EXAMPLE', payload: APPLE_EXAMPLE }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${status === 'complete' && subject === APPLE_EXAMPLE.subject ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">🍎</span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-medium">Apple</span>
              <span className="block text-slate-600 text-xs">Pre-run example</span>
            </span>
            {status === 'complete' && subject === APPLE_EXAMPLE.subject && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
            )}
          </button>
          <button
            onClick={() => { dispatch({ type: 'LOAD_EXAMPLE', payload: WALMART_EXAMPLE }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${status === 'complete' && subject === WALMART_EXAMPLE.subject ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">🛒</span>
            <span className="text-left leading-tight">
              <span className="block text-xs font-medium">Walmart</span>
              <span className="block text-slate-600 text-xs">Pre-run example</span>
            </span>
            {status === 'complete' && subject === WALMART_EXAMPLE.subject && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
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

        <div className="px-5 py-3 border-t border-violet-500/10 mt-auto">
          <p className="text-slate-700 text-xs">Groq · {selectedModel}</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto min-w-0">

        {/* Mobile header bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#09090f]/95 backdrop-blur-xl border-b border-violet-500/10 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-violet-950/40 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <img src="/stint-logo.png" alt="STINT Studio" className="h-5 w-auto object-contain flex-shrink-0 mix-blend-screen" />
            <span className="text-white font-semibold text-sm truncate">
              {subject ? subject : 'STINT Studio'}
            </span>
            {isComplete && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-400 font-medium flex-shrink-0">Done</span>
            )}
            {isRunning && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900 text-violet-400 font-medium flex-shrink-0 flex items-center gap-1"><Spinner size={9} />Running</span>
            )}
          </div>
        </div>

        {/* Thought Leadership — accessible at any time from sidebar */}
        {activeTab === 'thoughtleadership' && (
          <div className="h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            <ThoughtLeadershipPanel />
          </div>
        )}

        {/* Innovator Illumination — accessible at any time from sidebar */}
        {activeTab === 'innovatorillumination' && (
          <div className="h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            <InnovatorIlluminationPanel />
          </div>
        )}

        {/* RASCEF Tool — accessible at any time from sidebar */}
        {activeTab === 'rascef' && (
          <div className="h-full overflow-y-auto">
            <RASCEFTool />
          </div>
        )}

        {/* About — Studio, Taylor bio, Studio Updates */}
        {activeTab === 'about' && (
          <div className="h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            <AboutPanel />
          </div>
        )}

        {/* Big Cycle Engine — standalone Dalio pipeline tool */}
        {activeTab === 'bigcycleengine' && (
          <div className="h-full overflow-y-auto">
            <BigCycleEngineTool />
          </div>
        )}

        {/* GeoEconomic Instrument Assessment — Farrell & Newman framework */}
        {activeTab === 'geoinstrument' && (
          <div className="h-full overflow-y-auto">
            <GeoInstrumentTool />
          </div>
        )}

        {/* Home — portfolio landing */}
        {activeTab === 'home' && (
          <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
            <div className="max-w-4xl mx-auto">

              {/* Studio header */}
              <div className="mb-10">
                <div className="flex items-center gap-4 mb-4">
                  <img src="/stint-logo.png" alt="STINT Studio" className="h-14 w-auto object-contain flex-shrink-0 mix-blend-screen" />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-1">STINT.Studio</h1>
                    <p className="text-slate-500 text-sm font-medium">Applied Strategy & Intelligence</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                  Practitioner instruments for structured intelligence, applied foresight, and organisational decision-making.
                </p>
              </div>

              {/* Toolkit section */}
              <section className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Toolkit</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#7c3aed18', color: '#a78bfa', border: '1.5px solid #7c3aed25' }}>S</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">STEEP Analysis</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Six-agent intelligence framework</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Structured analysis across Social, Technological, Economic, Environmental, and Political dimensions. Produces a 3D force map, near/mid/long-term roadmap, and — for public companies — an AI-generated investment thesis with geoeconomic Big Cycle assessment.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['STEEP dimensions', '3D force map', 'Forecast roadmap', 'Investment thesis', 'Big Cycle', 'Prediction markets'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: null })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-violet-300 border border-violet-900/60 bg-violet-950/30 hover:bg-violet-900/30 hover:text-violet-200 transition-colors"
                    >
                      Open STEEP Analysis →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#7c3aed18', color: '#a78bfa', border: '1.5px solid #7c3aed25' }}>R</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">RASCEF Generator</h3>
                        <p className="text-slate-500 text-xs mt-0.5">AI prompt engineering framework</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      A six-element prompt architecture — Role, Action, Situation, Context, Expectation, Format — that replaces vague AI instructions with precise, structured analytical direction. Produces deployable system prompts for any analytical task.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Role', 'Action', 'Situation', 'Context', 'Expectation', 'Format'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'rascef' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-violet-300 border border-violet-900/60 bg-violet-950/30 hover:bg-violet-900/30 hover:text-violet-200 transition-colors"
                    >
                      Open RASCEF Generator →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#d9770618', color: '#fbbf24', border: '1.5px solid #d9770625' }}>⊕</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">Big Cycle Engine</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Dalio Big Cycle multi-agent pipeline</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Five-agent sequential pipeline that classifies empire stage, diagnoses debt sustainability, detects bubble conditions, architects a macro scenario with historical analogy, and produces an allocation matrix with "The Spider's Move" primary signal.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Empire Stage', 'Debt Sustainability', 'Bubble Detection', 'Scenario', 'Allocation Matrix', "The Spider's Move"].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'bigcycleengine' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/30 hover:text-amber-200 transition-colors"
                    >
                      Open Big Cycle Engine →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#0d948818', color: '#2dd4bf', border: '1.5px solid #0d948825' }}>◈</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">GeoEcon Instrument Assessment</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Farrell & Newman geoeconomic instrument framework</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Five-agent pipeline that scores a geoeconomic instrument on precision, impact, circumvention resistance, visibility, and speed — then assesses bilateral leverage, classifies strategic utility, and translates the risk profile into portfolio signals.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Severity Score', 'Bilateral Leverage', 'Strategic Utility', 'Investment Signals', 'Escalation Risk'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoinstrument' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-teal-300 border border-teal-900/60 bg-teal-950/30 hover:bg-teal-900/30 hover:text-teal-200 transition-colors"
                    >
                      Open Instrument Assessment →
                    </button>
                  </div>
                </div>
              </section>

              {/* Insights section */}
              <section className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: '#0f766e18', color: '#2dd4bf', border: '1.5px solid #0f766e25' }}>TL</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">Thought Leadership</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Intelligence briefs & analysis</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Structured intelligence briefs on geopolitics, technology adoption, macroeconomic conditions, and organisational strategy. Each brief draws on the same analytical rigour as the STEEP framework.
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'thoughtleadership' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-teal-300 border border-teal-900/60 bg-teal-950/30 hover:bg-teal-900/30 hover:text-teal-200 transition-colors"
                    >
                      View Intelligence Briefs →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0" style={{ background: '#0891b218', color: '#22d3ee', border: '1.5px solid #0891b225' }}>II</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">Innovator Illumination</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Technology solution provider directory</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Curated profiles of technology solution providers shaping enterprise digital transformation. Organised by segment, with solution overviews and geoeconomic context.
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'innovatorillumination' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-cyan-300 border border-cyan-900/60 bg-cyan-950/30 hover:bg-cyan-900/30 hover:text-cyan-200 transition-colors"
                    >
                      View Innovator Directory →
                    </button>
                  </div>
                </div>
              </section>

              {/* Studio section */}
              <section className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Studio</h2>
                <div className="bg-[#0f0f1b]/80 border border-violet-500/10 rounded-2xl p-5">
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Applied Strategy & Intelligence is a personal portfolio of practitioner instruments for strategic analysis, applied foresight, and organisational decision-making. Built by Taylor Grenawalt — strategist, applied researcher, and framework designer.
                  </p>
                  <button
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'about' })}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    About the Studio →
                  </button>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* Idle — STEEP Overview */}
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'rascef' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && status === 'idle' && (
          <div className="overflow-y-auto px-4 py-6 md:px-8 md:py-10">
            <div className="max-w-4xl mx-auto">

              {/* Hero */}
              <div className="text-center mb-10">
                <img src="/stint-logo.png" alt="STINT Studio" className="h-14 w-auto object-contain mx-auto mb-5 mix-blend-screen" />
                <h1 className="text-2xl md:text-3xl font-black text-white mb-3">STEEP Analysis</h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
                  Six-agent structured intelligence across Social, Technological, Economic, Environmental, and Political dimensions. Enter a subject in the sidebar to begin, or pick one below.
                </p>
              </div>

              {/* What is STEEP */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                <h2 className="text-white font-bold text-sm mb-2">What is STEEP analysis?</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  STEEP is a structured strategic-intelligence framework used by analysts, executives, and policy makers to map the macro-environmental forces shaping an organisation, industry, or trend. By examining five distinct dimensions — Social, Technological, Economic, Environmental, and Political — it surfaces both the threats and opportunities that lie outside a subject's direct control, enabling better long-range planning and risk management.
                </p>
              </div>

              {/* Dimension cards */}
              <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 opacity-50">The five dimensions + synthesis agent</h2>
              <div className="grid grid-cols-1 gap-3 mb-8">
                {[
                  { key:'S', label:'Social',        agent:'Agent 1', color:'#3B82F6', desc:'Examines human and societal forces that influence demand, talent, and public perception.',                                                         tags:['Demographics & population','Cultural shifts','Consumer behaviour','Workforce trends','Public health','Education & skills'] },
                  { key:'T', label:'Technological',  agent:'Agent 2', color:'#8B5CF6', desc:'Maps emerging technologies, R&D momentum, and the pace of digital disruption affecting the subject.',                                              tags:['AI & automation','R&D breakthroughs','Digital infrastructure','Cybersecurity','IP landscape','Platform dynamics'] },
                  { key:'E', label:'Economic',       agent:'Agent 3', color:'#10B981', desc:'Analyses macroeconomic conditions, market structures, and financial forces shaping viability and growth.',                                        tags:['Market conditions','Trade & tariffs','Investment flows','Inflation & rates','Supply chains','Competitive landscape'] },
                  { key:'E', label:'Environmental',  agent:'Agent 4', color:'#14B8A6', desc:'Assesses climate risk, natural resource constraints, sustainability expectations, and ecological regulation.',                                    tags:['Climate risk','Energy transition','Resource scarcity','ESG pressure','Carbon regulation','Circular economy'] },
                  { key:'P', label:'Political',      agent:'Agent 5', color:'#F97316', desc:'Evaluates government policy, regulatory direction, geopolitical instability, and legislative trends.',                                           tags:['Government policy','Regulation & compliance','Geopolitical risk','Elections & stability','International relations','Lobbying dynamics'] },
                  { key:'✦', label:'Synthesis',      agent:'Agent 6', color:'#818cf8', desc:'Runs after all five dimension agents complete. Integrates findings into a unified executive report with overall strategic posture and roadmap.', tags:['Overall posture','Executive summary','Cross-dimension insights','Near-term milestones','Mid-term milestones','Long-term milestones'], border:'#6366f140' },
                ].map(d => (
                  <div key={d.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex gap-4" style={d.border ? { borderColor: d.border } : {}}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base font-black" style={{ background: d.color + '20', color: d.color, border: `2px solid ${d.color}40` }}>{d.key}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-sm">{d.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: d.color + '20', color: d.color }}>{d.agent}</span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-2">{d.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Output summary */}
              <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 opacity-50">What you get</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                {[
                  { icon:'📋', title:'Overview',        desc:'Strategic posture badge, executive summary, dimension driver cards, cross-dimension insights, and a full evidence accordion.' },
                  { icon:'🌐', title:'3D Force Map',    desc:'Interactive Three.js globe with force-directed driver nodes. Click any node for a full detail panel with confidence, impact, and evidence.' },
                  { icon:'🗺️', title:'Forecast Roadmap',desc:'Near / mid / long-term milestones with trigger points, risks, accelerants, and confidence ratings. Toggle Card or Timeline view.' },
                ].map(o => (
                  <div key={o.title} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                    <div className="text-lg mb-2">{o.icon}</div>
                    <p className="text-white font-semibold text-sm mb-1">{o.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{o.desc}</p>
                  </div>
                ))}
              </div>

              {/* Quick-pick subjects */}
              <div className="mb-8">
                <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 opacity-50">Quick-pick a subject</h2>
                <div className="mb-4">
                  <p className="text-slate-600 text-xs font-medium mb-2 uppercase tracking-wider">Trends</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SUBJECTS.trends.map(s => (
                      <button
                        key={s}
                        onClick={() => dispatch({ type: 'SET_SUBJECT', payload: s })}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-xs font-medium mb-2 uppercase tracking-wider">Companies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SUBJECTS.companies.map(s => (
                      <button
                        key={s}
                        onClick={() => dispatch({ type: 'SET_SUBJECT', payload: s })}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {groqStatus === 'offline' && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-4">
                  <p className="text-red-300 font-semibold text-sm mb-1">Groq API key not found</p>
                  <p className="text-red-400 text-xs">Set <code className="font-mono bg-red-900 px-1 rounded">GROQ_API_KEY</code> in your environment variables and restart the app.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Running */}
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'rascef' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && isRunning && (
          <div className="h-full flex items-center justify-center px-4 md:px-8">
            <div className="text-center max-w-lg">
              <div className="relative w-20 h-20 mx-auto mb-7">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 animate-spin" style={{ borderTopColor: '#8B5CF6', borderRightColor: '#a78bfa', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center"><img src="/stint-logo.png" alt="" className="h-5 w-auto object-contain mix-blend-screen" /></div>
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
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'rascef' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && isComplete && (
          <div className="min-h-full flex flex-col">
            <div className="flex items-center gap-1 px-3 pt-4 pb-0 md:px-6 md:pt-5 border-b border-violet-500/10 flex-shrink-0 overflow-x-auto scrollbar-none">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.key })}
                  className={`flex items-center gap-1.5 px-3 py-3 md:px-4 text-xs md:text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === tab.key ? 'border-violet-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-violet-700/50'}`}>
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.badge === 'loading' && <Spinner size={10} />}
                  {tab.badge === 'complete' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {tab.badge === 'error'   && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </button>
              ))}
            </div>
            <div className={`flex-1 overflow-y-auto ${activeTab === 'forcemap' ? 'p-3 md:p-4' : 'p-3 md:p-6'}`}>
              {activeTab === 'overview'         && <OverviewTab          state={state} dispatch={dispatch} />}
              {activeTab === 'forcemap'         && <ForceMapTab          state={state} />}
              {activeTab === 'roadmap'          && <RoadmapTab           state={state} dispatch={dispatch} />}
              {activeTab === 'thesis'           && <InvestmentThesisTab  state={state} />}
              {activeTab === 'dataviz'          && <DataVizTab           state={state} />}
              {activeTab === 'bigcycle'         && <BigCycleTab          state={state} dispatch={dispatch} />}
              {activeTab === 'markets'          && <PredictionMarketsTab  state={state} dispatch={dispatch} />}
              {activeTab === 'thoughtleadership'    && <ThoughtLeadershipPanel />}
              {activeTab === 'innovatorillumination' && <InnovatorIlluminationPanel />}
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
