'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { QUANTUM_COMPUTING_EXAMPLE } from '../lib/quantumComputingExample';
import { APPLE_EXAMPLE } from '../lib/appleExample';
import { WALMART_EXAMPLE } from '../lib/walmartExample';
import { BCE_EXAMPLE } from '../lib/bigCycleExample';
import { GI_EXAMPLE } from '../lib/geoEconExample';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  Legend,
} from 'recharts';
import { INSTRUMENT_ATTRIBUTES, GEOECONOMIC_CAPACITIES, STRATEGIC_UTILITY_CLASSES, computeSeverityScore, classifySeverity } from '../lib/bigCycle/engine';
import AboutPanel from './components/AboutPanel';
import GeoPolicyLabTool from './components/GeoPolicyLabTool';

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
  bcePreload: null,         // pre-loaded BCE example result; consumed on mount by BigCycleEngineTool
  giPreload: null,          // pre-loaded GeoEcon example result; consumed on mount by GeoInstrumentTool
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
    case 'LOAD_BCE_EXAMPLE': return { ...state, bcePreload: action.payload, activeTab: 'bigcycleengine' };
    case 'LOAD_GI_EXAMPLE':  return { ...state, giPreload: action.payload, activeTab: 'geoinstrument' };
    case 'CLEAR_PRELOAD':
      if (action.key === 'bce') return { ...state, bcePreload: null };
      if (action.key === 'gi')  return { ...state, giPreload: null };
      return state;
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

// ── Big Cycle Engine PDF Report ───────────────────────────────────
function generateBcePdfReport(bceResult) {
  if (!bceResult) return;
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const { synthesis: syn, layers } = bceResult;
  const { layer1, layer2, layer3, layer4 } = layers || {};
  const stgData = [
    { n: 1, label: 'New Order / Rising', c: '#10b981', p: 'Aggressive long' },
    { n: 2, label: 'Building Power', c: '#3b82f6', p: 'Growth' },
    { n: 3, label: 'Peak Power', c: '#06b6d4', p: 'Balanced / selective' },
    { n: 4, label: 'Overextension', c: '#eab308', p: 'Defensive rotation begins' },
    { n: 5, label: 'Decline', c: '#f97316', p: 'Wealth preservation priority' },
    { n: 6, label: 'Crisis / Reset', c: '#ef4444', p: 'Maximum defensive posture' },
  ];
  const stg = stgData.find(s => s.n === syn?.empire_stage) || stgData[2];
  const forceNames = { debt: 'Debt / Money', internal_order: 'Internal Order', external_order: 'External Order', nature: 'Nature / Climate', technology: 'Technology' };
  const forceWeights = { debt: 30, internal_order: 25, external_order: 20, technology: 15, nature: 10 };
  const recColors = { LONG: '#10b981', SHORT: '#ef4444', HOLD: '#64748b', AVOID: '#ef4444', REDUCE: '#f97316', INCREASE: '#10b981' };
  const alloc = syn?.allocation_summary?.length ? syn.allocation_summary : (layer4?.allocation_matrix || []);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Big Cycle — ${esc(bceResult.subject)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#07070e;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px 32px;max-width:900px;margin:0 auto;font-size:13px;line-height:1.6}h1{font-size:26px;font-weight:900;color:#fff;margin-bottom:4px}h2{font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:4px}.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:16px;break-inside:avoid}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.pill{display:inline-block;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}.row{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #0f172a}.row:last-child{border-bottom:none}.bar-track{height:6px;background:#334155;border-radius:3px;overflow:hidden;margin-top:4px}
@media print{body{background:#fff!important;color:#1e293b!important}.no-print{display:none!important}.card{background:#f8fafc!important;border-color:#e2e8f0!important}h2,h1{color:#1e293b!important}.label{color:#475569!important}.row{border-color:#e2e8f0!important}}</style></head><body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:99;display:flex;gap:8px;"><button onclick="window.print()" style="background:linear-gradient(135deg,#d97706,#ea580c);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">⬇ Save / Print PDF</button><button onclick="window.close()" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;">✕ Close</button></div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
  <div><p class="label">Big Cycle Intelligence Report</p><h1>${esc(bceResult.subject)}</h1><p style="color:#64748b;font-size:12px;margin-top:6px">Empire Stage ${syn?.empire_stage ?? '?'} — ${esc(stg.label)}</p></div>
  <div style="text-align:right"><p class="label">Generated</p><p style="color:#94a3b8;font-size:11px;font-weight:600">${new Date(bceResult.generatedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>${syn?.confidence ? `<p style="font-size:11px;color:#10b981;font-weight:700;margin-top:4px">${esc(syn.confidence)} confidence · ${syn.agent_agreement ?? '?'}/4 agents agree</p>` : ''}</div>
</div>
${syn?.active_flags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">${syn.active_flags.map(f => `<span class="pill" style="background:#ef444420;color:#ef4444">⚑ ${esc(f.replace(/_/g, ' '))}</span>`).join('')}</div>` : ''}
<div class="grid2">
  <div class="card" style="border-color:${stg.c}30;background:${stg.c}0d;"><p class="label">Empire Stage</p><p style="font-size:28px;font-weight:900;color:${stg.c};margin:6px 0">${syn?.empire_stage ?? '?'}</p><p style="font-weight:700;color:#fff;margin-bottom:12px">${esc(stg.label)}</p><div class="row"><span style="color:#64748b">Investment posture</span><span style="font-weight:600">${esc(stg.p)}</span></div><div class="row"><span style="color:#64748b">Composite score</span><span style="font-weight:600">${layer1?.composite_score != null ? Number(layer1.composite_score).toFixed(1) : '—'} / 10</span></div><div class="row"><span style="color:#64748b">Power trajectory</span><span style="font-weight:600;text-transform:capitalize">${esc(layer1?.power_trajectory ?? '—')}</span></div><div class="row"><span style="color:#64748b">Printing probability</span><span style="font-weight:600">${syn?.printing_probability ?? layer2?.printing_probability ?? '—'}%</span></div></div>
  <div class="card"><h2>Executive Summary</h2><p style="color:#94a3b8;font-size:12px;line-height:1.8">${esc(syn?.executive_summary || layer1?.stage_rationale || '—')}</p></div>
</div>
${layer1?.force_scores ? `<div class="card"><h2>Five Forces</h2>${Object.entries(layer1.force_scores).map(([k, s]) => { const sc = parseFloat(s) || 0; const col = sc >= 7 ? '#ef4444' : sc >= 5 ? '#f97316' : sc >= 3 ? '#f59e0b' : '#10b981'; return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-weight:600;color:#e2e8f0">${esc(forceNames[k] || k)} <span style="color:#64748b;font-size:10px">${forceWeights[k] || 0}%</span></span><span style="font-weight:700;color:${col}">${sc.toFixed(1)}</span></div><div class="bar-track"><div style="width:${(sc / 10 * 100).toFixed(0)}%;height:100%;background:${col};border-radius:3px"></div></div>${layer1.force_rationales?.[k] ? `<p style="color:#64748b;font-size:11px;margin-top:4px;line-height:1.5">${esc(layer1.force_rationales[k])}</p>` : ''}</div>`; }).join('')}</div>` : ''}
${layer2 ? `<div class="grid2"><div class="card"><h2>Debt Sustainability</h2><span class="pill" style="background:${layer2.debt_status === 'UNSUSTAINABLE' || layer2.debt_status === 'PONZI_FINANCE' ? '#ef444420' : '#f59e0b20'};color:${layer2.debt_status === 'UNSUSTAINABLE' || layer2.debt_status === 'PONZI_FINANCE' ? '#ef4444' : '#f59e0b'};margin-bottom:12px;display:inline-block">${esc((layer2.debt_status || '').replace(/_/g, ' '))}</span><div class="row"><span style="color:#64748b">MP Stage</span><span style="font-weight:600">${esc(layer2.mp_stage || '—')}</span></div><div class="row"><span style="color:#64748b">i − g differential</span><span style="font-weight:600">${layer2.i_minus_g != null ? Number(layer2.i_minus_g).toFixed(1) : '—'}</span></div><div class="row"><span style="color:#64748b">Printing probability</span><span style="font-weight:600">${layer2.printing_probability ?? '—'}%</span></div>${layer2.debt_rationale ? `<p style="color:#64748b;font-size:11px;margin-top:10px;line-height:1.6">${esc(layer2.debt_rationale)}</p>` : ''}</div><div class="card"><h2>Bubble Detection</h2><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="font-size:24px;font-weight:900;color:${layer2.bubble_alert ? '#f97316' : '#94a3b8'}">${layer2.bubble_score ?? 0}/7</span><span class="pill" style="background:#f9731620;color:#f97316">${esc(layer2.bubble_severity || 'NONE')}</span></div>${(layer2.bubble_conditions_met || []).map(c => `<div style="display:flex;gap:6px;margin-bottom:4px"><span style="color:#f97316;flex-shrink:0">•</span><p style="color:#94a3b8;font-size:11px;line-height:1.5">${esc(c)}</p></div>`).join('')}</div></div>` : ''}
${layer3 ? `<div class="card"><h2>Scenario</h2><div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:12px"><span class="pill" style="background:#f9731620;color:#f97316">${esc(layer3.scenario_label || (layer3.scenario_type || '').replace(/_/g, ' '))}</span><span style="color:#94a3b8;font-size:12px;text-transform:capitalize">${esc(layer3.phase)} phase</span><span style="color:#64748b;font-size:12px">Analogy: <strong style="color:#e2e8f0">${esc(layer3.analogy_label || '')}</strong></span></div>${layer3.mechanism ? `<p style="color:#94a3b8;font-size:12px;line-height:1.7;margin-bottom:12px">${esc(layer3.mechanism)}</p>` : ''}${layer3.warning_signals?.length ? `<p class="label" style="margin-top:8px;margin-bottom:6px">Warning signals</p>${layer3.warning_signals.map(w => `<div style="display:flex;gap:6px;margin-bottom:4px"><span style="color:#eab308;flex-shrink:0">⚠</span><p style="color:#94a3b8;font-size:11px;line-height:1.5">${esc(w)}</p></div>`).join('')}` : ''}</div>` : ''}
${syn?.primary_action || layer4?.primary_action ? `<div class="card" style="border-color:#d9770635;background:#d9770608;"><p class="label" style="color:#f97316;margin-bottom:6px">The Spider's Move</p><p style="font-weight:700;color:#fff;font-size:14px;line-height:1.6">${esc(syn?.primary_action || layer4?.primary_action || '')}</p></div>` : ''}
${alloc.length ? `<div class="card"><h2>Allocation Matrix</h2>${alloc.map(item => { const c = recColors[item.recommendation] || '#94a3b8'; return `<div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:8px;break-inside:avoid"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-weight:600;color:#fff;flex:1">${esc(item.asset_class)}</span><span class="pill" style="background:${c}20;color:${c}">${esc(item.recommendation)}</span><span style="font-size:11px;color:${item.conviction === 'HIGH' ? '#10b981' : '#f59e0b'}">${esc(item.conviction || '')}</span></div>${item.rationale ? `<p style="color:#64748b;font-size:11px;line-height:1.5">${esc(item.rationale)}</p>` : ''}</div>`; }).join('')}</div>` : ''}
<p style="color:#334155;font-size:10px;text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #1e293b">STINT Studio — Applied Strategy &amp; Intelligence — Big Cycle Engine · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</body></html>`;
  const win = window.open('', '_blank', 'width=920,height=720');
  if (!win) { alert('Pop-up blocked — please allow pop-ups for this site to export PDF.'); return; }
  win.document.write(html);
  win.document.close();
}

// ── GeoEcon Instrument PDF Report ────────────────────────────────
function generateGiPdfReport(giResult) {
  if (!giResult) return;
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const { synthesis: syn, agents } = giResult;
  const { agent5a, agent5b, agent5c, agent5d } = agents || {};
  const sevTier = syn?.unified_severity_tier || agent5a?.severity_tier || 'MODERATE';
  const sevScore = syn?.unified_severity ?? agent5a?.severity_score ?? 0;
  const sevColors = { CRITICAL: '#ef4444', HIGH: '#f97316', MODERATE: '#f59e0b', LOW: '#10b981', MINIMAL: '#64748b' };
  const sevColor = sevColors[sevTier] || '#f59e0b';
  const utilLabels = { coercive_leverage: 'Coercive Leverage', structural_dependency: 'Structural Dependency', alliance_management: 'Alliance Management', strategic_deterrence: 'Strategic Deterrence', domestic_protection: 'Domestic Protection', retaliation_escalation: 'Retaliation / Escalation' };
  const utilColors = { coercive_leverage: '#ef4444', structural_dependency: '#f97316', alliance_management: '#3b82f6', strategic_deterrence: '#8b5cf6', domestic_protection: '#10b981', retaliation_escalation: '#f59e0b' };
  const utilCls = agent5c?.strategic_utility_class;
  const utilColor = utilColors[utilCls] || '#94a3b8';
  const attrKeys = [{ key: 'precision', label: 'Precision', w: 20 }, { key: 'impact', label: 'Impact', w: 30 }, { key: 'circumvention', label: 'Circumvention Resistance', w: 20 }, { key: 'visibility', label: 'Visibility', w: 15 }, { key: 'speed', label: 'Speed of Effect', w: 15 }];
  const sigColors = { BUY: '#10b981', SELL: '#ef4444', HEDGE: '#f59e0b', MONITOR: '#64748b' };
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GeoEcon Assessment — ${esc(giResult.instrument)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#07070e;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px 32px;max-width:900px;margin:0 auto;font-size:13px;line-height:1.6}h1{font-size:22px;font-weight:900;color:#fff;margin-bottom:4px}h2{font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}.label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:4px}.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:16px;break-inside:avoid}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px}.pill{display:inline-block;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}.row{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #0f172a}.row:last-child{border-bottom:none}.bar-track{height:6px;background:#334155;border-radius:3px;overflow:hidden;margin-top:4px}
@media print{body{background:#fff!important;color:#1e293b!important}.no-print{display:none!important}.card{background:#f8fafc!important;border-color:#e2e8f0!important}h2,h1{color:#1e293b!important}}</style></head><body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:99;display:flex;gap:8px;"><button onclick="window.print()" style="background:linear-gradient(135deg,#0d9488,#059669);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">⬇ Save / Print PDF</button><button onclick="window.close()" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:10px;padding:10px 16px;font-size:13px;cursor:pointer;">✕ Close</button></div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
  <div><p class="label">GeoEconomic Instrument Assessment</p><h1>${esc(giResult.instrument)}</h1><p style="color:#64748b;font-size:12px;margin-top:6px">${esc(giResult.sender)} → ${esc(giResult.target)}</p></div>
  <div style="text-align:right"><p class="label">Generated</p><p style="color:#94a3b8;font-size:11px;font-weight:600">${new Date(giResult.generatedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>${syn?.convergence_confidence ? `<p style="font-size:11px;color:#10b981;font-weight:700;margin-top:4px">${esc(syn.convergence_confidence)} confidence</p>` : ''}</div>
</div>
${syn?.active_flags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">${syn.active_flags.map(f => `<span class="pill" style="background:#ef444420;color:#ef4444">⚑ ${esc(f.replace(/_/g, ' '))}</span>`).join('')}</div>` : ''}
<div class="grid2">
  <div class="card" style="border-color:${sevColor}30;background:${sevColor}0d;"><p class="label" style="color:${sevColor}aa">Severity Score</p><div style="display:flex;align-items:flex-end;gap:12px;margin:8px 0 12px"><span style="font-size:36px;font-weight:900;color:${sevColor}">${Number(sevScore).toFixed(1)}</span><span class="pill" style="background:${sevColor}20;color:${sevColor};border:1px solid ${sevColor}40">${esc(sevTier)}</span></div>${agent5a?.score_rationale ? `<p style="color:#94a3b8;font-size:12px;line-height:1.7">${esc(agent5a.score_rationale)}</p>` : ''}</div>
  <div class="card" style="border-color:${utilColor}30;background:${utilColor}0d;"><p class="label" style="color:${utilColor}aa">Strategic Utility</p><p style="font-weight:700;color:#fff;font-size:14px;margin:8px 0 12px">${esc(utilLabels[utilCls] || utilCls || '—')}</p><div class="row"><span style="color:#64748b">Time horizon</span><span style="font-weight:600;text-transform:capitalize">${esc((agent5c?.time_horizon || '—').replace(/_/g, ' '))}</span></div><div class="row"><span style="color:#64748b">Escalation probability</span><span style="font-weight:600">${agent5c?.escalation_probability ?? '—'}%</span></div><div class="row"><span style="color:#64748b">Classification</span><span style="font-weight:600;text-transform:capitalize">${esc(agent5c?.structural_vs_transient ?? '—')}</span></div>${agent5c?.class_rationale ? `<p style="color:#94a3b8;font-size:11px;margin-top:10px;line-height:1.6">${esc(agent5c.class_rationale)}</p>` : ''}</div>
</div>
${agent5a?.attribute_scores ? `<div class="card"><h2>Attribute Breakdown</h2>${attrKeys.map(attr => { const sc = parseFloat(agent5a.attribute_scores[attr.key]) || 0; const col = sc >= 7 ? '#ef4444' : sc >= 5 ? '#f97316' : sc >= 3 ? '#f59e0b' : '#10b981'; return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-weight:600;color:#e2e8f0">${esc(attr.label)} <span style="color:#64748b;font-size:10px">${attr.w}%</span>${attr.key === agent5a.dominant_attribute ? `<span style="background:#0d948820;color:#2dd4bf;border-radius:4px;padding:1px 6px;font-size:10px;margin-left:6px">dominant</span>` : attr.key === agent5a.lowest_attribute ? `<span style="background:#33415520;color:#64748b;border-radius:4px;padding:1px 6px;font-size:10px;margin-left:6px">lowest</span>` : ''}</span><span style="font-weight:700;color:${col}">${sc.toFixed(1)}</span></div><div class="bar-track"><div style="width:${(sc / 10 * 100).toFixed(0)}%;height:100%;background:${col};border-radius:3px"></div></div></div>`; }).join('')}</div>` : ''}
${agent5b ? `<div class="card"><h2>Bilateral Leverage</h2><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><span style="font-weight:700;color:#fff">Leverage holder:</span><span class="pill" style="background:${agent5b.leverage_holder === 'sender' ? '#3b82f620' : '#f9731620'};color:${agent5b.leverage_holder === 'sender' ? '#3b82f6' : '#f97316'}">${esc(agent5b.leverage_holder === 'sender' ? giResult.sender : agent5b.leverage_holder === 'target' ? giResult.target : 'Balanced')}</span></div><div class="grid2" style="margin-bottom:12px"><div style="background:#1e3a5f30;border:1px solid #3b82f630;border-radius:10px;padding:12px"><p style="color:#3b82f6;font-size:11px;font-weight:700;margin-bottom:6px">Sender: ${esc(giResult.sender)} — ${agent5b.sender_capacity?.score ?? '—'}/10</p>${agent5b.sender_capacity?.dominant_advantage ? `<p style="color:#94a3b8;font-size:11px;margin-bottom:4px"><em>Key advantage:</em> ${esc(agent5b.sender_capacity.dominant_advantage)}</p>` : ''}${agent5b.sender_capacity?.rationale ? `<p style="color:#64748b;font-size:11px;line-height:1.5">${esc(agent5b.sender_capacity.rationale)}</p>` : ''}</div><div style="background:#7c1d1320;border:1px solid #f9731630;border-radius:10px;padding:12px"><p style="color:#f97316;font-size:11px;font-weight:700;margin-bottom:6px">Target: ${esc(giResult.target)} — <span class="pill" style="background:#ef444420;color:#ef4444;font-size:10px">${esc(agent5b.target_capacity?.vulnerability_level || '?')} vulnerability</span></p>${agent5b.target_capacity?.rationale ? `<p style="color:#64748b;font-size:11px;line-height:1.5">${esc(agent5b.target_capacity.rationale)}</p>` : ''}</div></div>${agent5b.chokepoints_identified?.length ? `<p class="label" style="margin-bottom:6px">Chokepoints identified</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${agent5b.chokepoints_identified.map(cp => `<span class="pill" style="background:#33415550;color:#cbd5e1">${esc(cp)}</span>`).join('')}</div>` : ''}${agent5b.retaliation_vectors?.length ? `<p class="label" style="margin-bottom:6px">Retaliation vectors — <span style="background:${agent5b.retaliation_capacity === 'HIGH' ? '#ef444420' : '#f59e0b20'};color:${agent5b.retaliation_capacity === 'HIGH' ? '#ef4444' : '#f59e0b'};border-radius:10px;padding:2px 8px;font-size:10px">${esc(agent5b.retaliation_capacity)}</span></p>${agent5b.retaliation_vectors.map(rv => `<div style="display:flex;gap:6px;margin-bottom:4px"><span style="color:#f97316;flex-shrink:0">•</span><p style="color:#94a3b8;font-size:11px;line-height:1.5">${esc(rv)}</p></div>`).join('')}` : ''}</div>` : ''}
${agent5d ? `<div class="card"><h2>Investment Signals</h2><div class="grid3" style="margin-bottom:16px">${[{ key: 'first_order_shocks', label: 'First-Order Shocks', c: '#ef4444' }, { key: 'second_order_shocks', label: 'Second-Order Shocks', c: '#f59e0b' }, { key: 'beneficiaries', label: 'Beneficiaries', c: '#10b981' }].map(({ key, label, c }) => { const items = agent5d[key] || []; const isShock = key !== 'beneficiaries'; return `<div><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${c};margin-bottom:8px">${esc(label)}</p>${items.map(item => `<div style="background:#0f172a;border-radius:8px;padding:8px;margin-bottom:6px;break-inside:avoid"><p style="font-weight:600;color:#e2e8f0;font-size:11px;margin-bottom:3px">${esc(isShock ? item.sector : item.name)}</p><p style="color:#64748b;font-size:11px;line-height:1.5">${esc(isShock ? item.rationale : item.thesis)}</p></div>`).join('')}</div>`; }).join('')}</div>${agent5d.portfolio_signals?.length ? `<p class="label" style="margin-bottom:8px">Portfolio Signals</p>${agent5d.portfolio_signals.map(sig => { const sc = sigColors[sig.type] || '#94a3b8'; return `<div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:8px;break-inside:avoid"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-weight:600;color:#fff;flex:1;font-size:12px">${esc(sig.signal)}</span><span class="pill" style="background:${sc}20;color:${sc}">${esc(sig.type)}</span><span style="font-size:11px;color:${sig.conviction === 'HIGH' ? '#10b981' : '#f59e0b'}">${esc(sig.conviction)}</span></div>${sig.rationale ? `<p style="color:#64748b;font-size:11px;line-height:1.5">${esc(sig.rationale)}</p>` : ''}</div>`; }).join('')}` : ''}${agent5d.hedging_recommendations?.length ? `<p class="label" style="margin-top:12px;margin-bottom:6px">Hedging Recommendations</p><div style="display:flex;flex-wrap:wrap;gap:6px">${agent5d.hedging_recommendations.map(h => `<span class="pill" style="background:#33415550;color:#cbd5e1">${esc(h)}</span>`).join('')}</div>` : ''}</div>` : ''}
${syn?.strategic_summary || syn?.key_risks?.length ? `<div class="card"><h2>Strategic Assessment</h2>${syn.strategic_summary ? `<p style="color:#94a3b8;font-size:12px;line-height:1.7;margin-bottom:12px">${esc(syn.strategic_summary)}</p>` : ''}${syn.key_risks?.length ? `<p class="label" style="margin-bottom:6px">Key risks</p>${syn.key_risks.map(r => `<div style="display:flex;gap:6px;margin-bottom:4px"><span style="color:#ef4444;flex-shrink:0">⚑</span><p style="color:#94a3b8;font-size:11px;line-height:1.5">${esc(r)}</p></div>`).join('')}` : ''}</div>` : ''}
<p style="color:#334155;font-size:10px;text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #1e293b">STINT Studio — Applied Strategy &amp; Intelligence — GeoEconomic Instrument Assessment · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</body></html>`;
  const win = window.open('', '_blank', 'width=920,height=720');
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

function GeoInstrumentTool({ preload = null, onPreloadConsumed, onResult }) {
  const [giStep, setGiStep] = useState(preload ? 'result' : 'form');
  const [giForm, setGiForm] = useState(preload ? { instrument: preload.instrument, sender: preload.sender, target: preload.target, context: '' } : { instrument: '', sender: '', target: '', context: '' });
  const [giErrors, setGiErrors] = useState({});
  const [giError, setGiError] = useState('');
  const [giAgents, setGiAgents] = useState({ agent5a: 'pending', agent5b: 'pending', agent5c: 'pending', convergence: 'pending', agent5d: 'pending' });
  const [giResult, setGiResult] = useState(preload ?? null);

  useEffect(() => { if (preload) onPreloadConsumed?.(); }, []);

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
            onResult?.(ev.result);
            try { localStorage.setItem('stint-gi-context', JSON.stringify(ev.result)); } catch {}
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
    <div className="px-4 py-6 md:px-8 md:py-10">
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
    <div className="px-4 py-6 md:px-8 md:py-10">
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

        <div className="flex items-center justify-center gap-3 pb-4">
          <button onClick={resetGi} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">New assessment</button>
          <button onClick={() => generateGiPdfReport(giResult)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-teal-300 border border-teal-800/50 bg-teal-950/30 hover:bg-teal-900/40 hover:text-teal-200 transition-colors">⬇ Export PDF</button>
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

// ── Prompt Engineering Package static data ────────────────────────────────────
const ADVERSARIAL_MODES = [
  {
    key: 'devils_advocate',
    label: "Devil's Advocate",
    icon: '⚔',
    color: '#ef4444',
    bg: '#ef444415',
    border: '#ef444430',
    bestFor: 'Any position or argument you plan to defend',
    description: 'Constructs the strongest, most intellectually honest case against your position.',
    systemPrompt: `You are a rigorous Devil's Advocate. Your job is NOT to be contrarian for its own sake — your job is to construct the single strongest, most intellectually honest case AGAINST the position or plan presented.\n\nRules:\n- Identify the 3 most significant flaws, risks, or counterarguments\n- For each, explain WHY it is a serious problem — not just that it exists\n- Find the assumption the person is most attached to and challenge it directly\n- If there is a competing worldview or framework that undermines this thinking, name it\n- End with: "The hardest question you need to answer is: [one sharp question]"\n\nDo not soften your critique. Do not offer a balanced view. Your entire job is to stress-test this thinking.`,
  },
  {
    key: 'pre_mortem',
    label: 'Pre-Mortem',
    icon: '⏱',
    color: '#f97316',
    bg: '#f9731615',
    border: '#f9731630',
    bestFor: 'Plans or decisions you are about to commit to',
    description: 'Assumes it is 12 months from now and the plan has failed. Works backward to identify how and why.',
    systemPrompt: `You are running a Pre-Mortem analysis. Assume it is 12 months from now and the plan or idea presented has failed — not marginally, but significantly.\n\nYour job:\n1. Write a brief "failure narrative" — a 3–4 sentence story of how the failure unfolded\n2. Identify the top 3 root causes that led to failure (be specific — name the mechanism, not just the category)\n3. Identify which assumptions in the original plan were most dangerously optimistic\n4. Identify what early warning signs were probably ignored along the way\n5. Name the one thing that, if fixed NOW, would most change the outcome\n\nBe concrete and specific. Vague risks are useless. Name the actual failure mode, not just "execution risk."`,
  },
  {
    key: 'first_principles',
    label: 'First Principles',
    icon: '⬡',
    color: '#3b82f6',
    bg: '#3b82f615',
    border: '#3b82f630',
    bestFor: 'Beliefs or strategies built on inherited assumptions',
    description: 'Strips away every assumption and analogy. Rebuilds the argument from what can be directly verified.',
    systemPrompt: `You are a First Principles analyst. Your job is to challenge every assumption in the thinking presented and determine what is actually true when you strip away convention, analogy, and inherited belief.\n\nProcess:\n1. List every assumption embedded in this thinking — explicit and implicit (aim for at least 5)\n2. For each assumption, ask: "Is this actually true, or do we just believe it because everyone does?"\n3. Identify which assumptions are load-bearing — if they are wrong, the whole argument collapses\n4. Rebuild from scratch: "If we only accepted what we can directly verify, what would this look like?"\n5. Name any analogies or comparisons being used and explain why they may be misleading\n\nThe goal is to separate what is known from what is assumed. Be direct about which foundations are solid and which are borrowed from convention.`,
  },
  {
    key: 'steelman',
    label: 'Steelman Opposition',
    icon: '◉',
    color: '#8b5cf6',
    bg: '#8b5cf615',
    border: '#8b5cf630',
    bestFor: 'Before presenting or defending an argument',
    description: 'Builds the strongest possible version of the opposing view — not the weak version you prefer to argue against.',
    systemPrompt: `You are a Steelman Builder. Your job is to construct the strongest, most intelligent, most charitable version of the position or approach that OPPOSES what is being presented.\n\nThis is NOT about attacking the person's idea. It is about giving them the best possible opposing argument to engage with — so they can either strengthen their position or recognize when they are wrong.\n\nStructure:\n1. State the steelmanned opposing position in its strongest form (2–3 sentences)\n2. Give the 3 best arguments FOR that opposing position\n3. Identify what evidence or data would most support the opposing view\n4. Name a credible, intelligent person or school of thought that would hold this opposing view and why\n5. Ask: "If the opposing view is right, what would you expect to see in the world that you currently don't see?"\n\nBe generous to the opposition. The goal is to make the person's own thinking stronger by forcing them to engage with the best version of what challenges it.`,
  },
  {
    key: 'assumption_audit',
    label: 'Assumption Audit',
    icon: '◎',
    color: '#eab308',
    bg: '#eab30815',
    border: '#eab30830',
    bestFor: 'Early-stage thinking before significant resources are committed',
    description: 'Surfaces every hidden assumption and scores each by how dangerous it would be if wrong.',
    systemPrompt: `You are an Assumption Auditor. Your job is to surface every assumption — explicit, implicit, and hidden — embedded in the thinking or plan presented, and assess the risk of each being wrong.\n\nProcess:\n1. List every assumption you can identify (aim for 8–12). Categorize each as:\n   - Factual (assumes something is true about the world)\n   - Behavioral (assumes people will act a certain way)\n   - Market (assumes conditions or timing)\n   - Organizational (assumes internal capability or alignment)\n   - Logical (assumes one thing leads to another)\n\n2. For each assumption, score it:\n   - Confidence: How likely is this assumption to be correct? (High / Medium / Low)\n   - Impact if wrong: How bad is it if this assumption fails? (High / Medium / Low)\n\n3. Identify the 3 "critical path" assumptions — the ones that are both uncertain AND high-impact if wrong\n\n4. For each critical path assumption, suggest: "Here is how you could test or validate this before committing further."\n\nBe exhaustive. The assumptions people don't know they're making are the most dangerous ones.`,
  },
  {
    key: 'contrarian_investor',
    label: 'Contrarian Investor',
    icon: '◈',
    color: '#10b981',
    bg: '#10b98115',
    border: '#10b98130',
    bestFor: 'Market theses, strategic bets, competitive strategy',
    description: 'Finds where conventional wisdom is wrong, what the market is missing, where the non-obvious truth is hiding.',
    systemPrompt: `You are a contrarian investor and strategic thinker. Your job is to find where conventional wisdom is wrong, where the crowd is missing something, and where the non-obvious truth is hiding.\n\nApply this lens to the thinking or plan presented:\n\n1. What is the consensus view on this topic, and what is everyone assuming? State it plainly.\n\n2. Where is the consensus most likely wrong? What do most people get backwards?\n\n3. What is the "second-order" effect that almost nobody is thinking about?\n   (First-order: obvious consequence. Second-order: what happens as a result of that consequence.)\n\n4. If this idea is right in an unexpected way — not the obvious way — what would that look like?\n\n5. What would have to be true for the seemingly crazy alternative view to be correct?\n\n6. "The market is pricing in [X]. But the real bet here is actually [Y]."\n\nBe genuinely contrarian — not just negative. Contrarian thinking finds the non-obvious truth, which can be optimistic OR pessimistic.`,
  },
];

const PROMPTING_TECHNIQUES = [
  {
    key: 'zero_shot',
    label: 'Zero-Shot Prompting',
    difficulty: 'Beginner',
    type: 'Foundational',
    whatItIs: 'Ask the model to perform a task with no examples — just the instruction. Modern LLMs trained with instruction tuning can follow instructions on tasks they have never explicitly seen demonstrated.',
    whenToUse: {
      yes: ['Common, well-defined tasks: summarize, translate, classify, explain', 'Fast first drafts without setup overhead', 'Starting point before deciding if examples are needed'],
      no: ['Highly specific output formats the model does not default to'],
    },
    examplePrompt: 'Classify the sentiment of the following customer review as Positive, Neutral, or Negative.\n\nReview: "The onboarding took longer than expected, but once we were set up, the platform worked really well for our team."',
    expectedOutput: 'Sentiment: Neutral\n\nThe reviewer acknowledges a slow start (negative signal) but reports the platform worked well once configured (positive signal). The net assessment is neutral — neither a strong endorsement nor a rejection.',
    keyInsight: 'Adding "Think step by step" to a zero-shot prompt can dramatically improve results on reasoning tasks — this hybrid is called zero-shot CoT.',
    source: 'Wei et al. (2021) — Finetuned Language Models Are Zero-Shot Learners',
  },
  {
    key: 'few_shot',
    label: 'Few-Shot Prompting',
    difficulty: 'Beginner',
    type: 'Foundational',
    whatItIs: 'Provide a small number of worked examples within the prompt to show the model the desired input-output pattern. The model infers the task format from the examples and applies it to a new input.',
    whenToUse: {
      yes: ['Very specific output formats the model does not default to', 'Classification, extraction, or transformation tasks with clear patterns', 'When zero-shot results are inconsistent or off-style'],
      no: ['Complex multi-step reasoning — examples alone will not teach logic'],
    },
    examplePrompt: 'Extract the company name and deal size from each sales note. Format as: Company | Deal Size\n\nNote: "Spoke with Sarah at Acme Corp — $45K annual contract starting Q3."\nOutput: Acme Corp | $45K\n\nNote: "Follow-up with Meridian Health. Budget confirmed at $120,000 for enterprise tier."\nOutput: Meridian Health | $120,000\n\nNote: "Great call with Marcus at BlueWave Technologies. 3 seats at $8,500/year."\nOutput:',
    expectedOutput: 'BlueWave Technologies | $8,500/year',
    keyInsight: 'Label quality matters more than quantity. 3–5 examples is the sweet spot — more than 8 rarely helps and wastes tokens.',
    source: 'Brown et al. (2020) — Language Models are Few-Shot Learners (GPT-3)',
  },
  {
    key: 'chain_of_thought',
    label: 'Chain-of-Thought (CoT)',
    difficulty: 'Intermediate',
    type: 'Reasoning',
    whatItIs: 'Prompt the model to produce intermediate reasoning steps before arriving at a final answer. Like showing your work on a math problem. Triggered with examples (few-shot CoT) or just "Let\'s think step by step" (zero-shot CoT).',
    whenToUse: {
      yes: ['Multi-step math, logic, or analytical problems', 'Strategic decisions involving trade-off reasoning', 'Any task where the answer depends on getting intermediate steps right'],
      no: ['Simple factual lookups or tasks where the reasoning process is not valuable'],
    },
    examplePrompt: 'A sales rep closes deals at 22%. She makes 15 calls/day, 5 days/week. Average deal size: $8,500.\n\nHow much revenue can she generate in a 4-week month? Think through this step by step before giving a final answer.',
    expectedOutput: 'Step 1: Calls per month → 15 calls/day × 5 days × 4 weeks = 300 calls\nStep 2: Deals closed → 300 × 22% = 66 deals\nStep 3: Revenue → 66 × $8,500 = $561,000\n\nShe can generate $561,000 in a 4-week month.',
    keyInsight: 'The reasoning trace lets you catch errors mid-chain before they compound. CoT is most effective with larger models.',
    source: 'Wei et al. (2022) — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
  },
  {
    key: 'meta_prompting',
    label: 'Meta Prompting',
    difficulty: 'Intermediate',
    type: 'Reasoning',
    whatItIs: 'Use the model to generate, evaluate, or improve prompts — rather than directly executing a task. Describe what you want to accomplish and ask the model to construct the optimal prompt.',
    whenToUse: {
      yes: ['You know the goal but do not know how to prompt for it effectively', 'Building reusable prompt templates across teams or clients', 'Refining or critiquing a prompt you have already written'],
      no: ['Simple tasks where you already know the right prompt structure'],
    },
    examplePrompt: 'I need to prompt an AI to generate a weekly executive summary from project status updates. Audience: C-suite, 5 minutes to read. Tone: direct and outcome-focused.\n\nWrite me the best possible prompt for this task. Include placeholders for the input data. Briefly explain why you structured it the way you did.',
    expectedOutput: 'Prompt:\n\nYou are a senior executive communications specialist. Your task is to generate a concise weekly executive summary from the project status updates provided below.\n\nRules: maximum 250 words · lead with outcomes, not activities · flag one risk and one decision needed · no jargon\n\n[STATUS UPDATES]\n\nRationale: The role assignment calibrates depth and vocabulary. The word limit and output rules prevent over-generation. Leading with outcomes matches C-suite reading patterns.',
    keyInsight: 'Meta prompting scales prompting quality across teams without requiring everyone to become a prompting expert.',
    source: 'Reynolds & McDonell (2021) — Prompt Programming for Large Language Models',
  },
  {
    key: 'self_consistency',
    label: 'Self-Consistency',
    difficulty: 'Intermediate',
    type: 'Reasoning',
    whatItIs: 'Run the same prompt multiple times, generate diverse reasoning paths, and select the most consistent answer across runs. Works by sampling multiple outputs and taking the majority vote.',
    whenToUse: {
      yes: ['High-stakes reasoning where accuracy matters more than speed', 'Math or logic problems where errors are common in single runs', 'When you need to estimate model confidence on a claim'],
      no: ['Tasks with no objectively correct answer', 'Time-sensitive workflows where one answer is sufficient'],
    },
    examplePrompt: 'Answer the following question. Show your reasoning step by step.\n\nQuestion: A store sells 3 types of gift sets. Type A costs $25, Type B costs $40, Type C costs $60. If 40% of sales are Type A, 35% are Type B, and 25% are Type C, what is the average revenue per gift set sold?',
    expectedOutput: 'Run 1: ($25×0.40) + ($40×0.35) + ($60×0.25) = $10 + $14 + $15 = $39.00\nRun 2: Weighted average = $39.00\nRun 3: $39.00\n\nMajority answer: $39.00 average revenue per gift set',
    keyInsight: 'Self-consistency is most valuable when the model\'s first answer on complex problems is likely to be wrong. The majority vote across 3–5 runs can significantly improve accuracy.',
    source: 'Wang et al. (2022) — Self-Consistency Improves Chain of Thought Reasoning in Language Models',
  },
  {
    key: 'generate_knowledge',
    label: 'Generate Knowledge Prompting',
    difficulty: 'Intermediate',
    type: 'Reasoning',
    whatItIs: 'First prompt the model to generate relevant facts or background knowledge about a topic, then use that generated knowledge as context for answering the actual question. A two-stage approach.',
    whenToUse: {
      yes: ['Questions requiring domain knowledge the model may underweight', 'Fact-grounded analysis where shallow answers are common', 'Any task where surface-level responses are insufficient'],
      no: ['Simple lookups or tasks with a narrow, well-defined scope'],
    },
    examplePrompt: 'Stage 1: Generate 5 key facts about the relationship between interest rate increases and commercial real estate valuations.\n\nStage 2: Using the facts you just generated, explain whether now is a good or bad time for a pension fund to increase its CRE allocation. Be specific.',
    expectedOutput: 'Stage 1 facts:\n1. Rising rates increase cap rates, compressing valuations.\n2. Office and retail face structural demand headwinds beyond rate effects.\n3. Industrial and data center CRE remain supply-constrained.\n4. Debt refinancing risk is acute for properties originated pre-2022.\n5. Distressed opportunities are emerging but require active management.\n\nStage 2: For a pension fund with long-duration liabilities, current conditions are mixed. Industrial and alternatives offer upside; broad CRE allocation carries refinancing and mark-to-market risk.',
    keyInsight: 'The model\'s generated knowledge acts as a self-constructed context window. It consistently outperforms single-stage prompting on commonsense reasoning tasks.',
    source: 'Liu et al. (2022) — Generated Knowledge Prompting for Commonsense Reasoning',
  },
  {
    key: 'prompt_chaining',
    label: 'Prompt Chaining',
    difficulty: 'Advanced',
    type: 'Workflow',
    whatItIs: 'Break a complex task into a sequence of simpler sub-tasks where the output of each prompt becomes the input to the next. Build incrementally, verify at each step.',
    whenToUse: {
      yes: ['Complex deliverables that require multiple distinct stages', 'Tasks where early errors compound downstream', 'Workflows where intermediate outputs need review before proceeding'],
      no: ['Simple tasks that can be completed in a single prompt without quality loss'],
    },
    examplePrompt: 'Chain Step 1: Summarize this earnings call transcript in 5 bullet points, focusing only on forward guidance statements.\n\n[TRANSCRIPT]\n\n---\nChain Step 2 (use Step 1 output): Based on these forward guidance statements, identify the 3 largest gaps between what management said and what analysts were expecting. Rate each gap as Bullish, Bearish, or Neutral for the stock.',
    expectedOutput: 'Step 1 output:\n• Management reaffirmed 12–14% revenue growth guidance\n• Q4 margin expansion target raised from 200bps to 250bps\n• $500M buyback authorized\n• Two new enterprise verticals announced for H2\n• Hiring freeze in non-revenue functions through year-end\n\nStep 2 output:\n1. Margin target raise vs. analyst model of 180bps — Bullish\n2. Hiring freeze not in any analyst forecast — Bearish\n3. Vertical launches 2 quarters earlier than consensus — Bullish',
    keyInsight: 'The power of chaining is that each step is small enough to verify before proceeding. This turns a risky long prompt into a reviewable pipeline.',
    source: 'Wu et al. (2022) — PromptChainer: Chaining Large Language Model Prompts through Visual Programming',
  },
  {
    key: 'tree_of_thoughts',
    label: 'Tree of Thoughts (ToT)',
    difficulty: 'Advanced',
    type: 'Reasoning',
    whatItIs: 'Prompt the model to explore multiple reasoning branches simultaneously, evaluate which branches are most promising, and pursue the best paths — like a search tree rather than a linear chain.',
    whenToUse: {
      yes: ['Complex planning problems with many possible paths', 'Creative tasks where exploring diverse directions improves output', 'Strategic decisions requiring genuine exploration of alternatives'],
      no: ['Straightforward tasks or time-constrained single-pass workflows'],
    },
    examplePrompt: 'I need to enter a new market. Explore 3 distinct market entry strategies (licensing, acquisition, organic build). For each:\n1. State the core thesis\n2. Rate it on speed (1–5), cost (1–5), and control (1–5)\n3. Identify the single biggest risk\n\nAfter exploring all three, recommend which path is most appropriate for a $50M revenue B2B SaaS company with 3 years of runway.',
    expectedOutput: 'Licensing: Speed 5, Cost 5, Control 2. Fastest path to revenue. Risk: partner misalignment dilutes brand.\n\nAcquisition: Speed 3, Cost 1, Control 4. Buys capability and market share. Risk: integration execution at $50M scale.\n\nOrganic build: Speed 1, Cost 3, Control 5. Maximum compounding. Risk: 18–24 month revenue gap.\n\nRecommendation: Licensing. Capital preservation and speed outweigh control given 3-year runway constraint.',
    keyInsight: 'ToT turns single-path generation into structured exploration. It is especially powerful when you suspect the obvious answer is not the best one.',
    source: 'Yao et al. (2023) — Tree of Thoughts: Deliberate Problem Solving with Large Language Models',
  },
  {
    key: 'react',
    label: 'ReAct (Reason + Act)',
    difficulty: 'Advanced',
    type: 'Agent',
    whatItIs: 'Interleave reasoning (think step by step) with actions (search, calculate, retrieve) in an alternating loop. The model reasons about what to do, does it, observes the result, then reasons again.',
    whenToUse: {
      yes: ['Tasks requiring external information retrieval mid-reasoning', 'Multi-step workflows that depend on real-world data', 'Agent systems where the model must decide what tools to call'],
      no: ['Self-contained reasoning tasks with no external dependencies'],
    },
    examplePrompt: 'Task: What is the current market cap of the largest semiconductor company, and how does it compare to its 5-year average P/E ratio?\n\nThink through what information you need, what you would search for, what you would calculate, and how you would arrive at a final comparison. Walk through each Thought → Action → Observation step before giving your final answer.',
    expectedOutput: 'Thought: I need market cap and P/E data for the largest semiconductor company — likely NVIDIA.\nAction: Search "NVIDIA market cap current"\nObservation: ~$2.4T as of late 2024.\nThought: Now I need 5-year average P/E.\nAction: Search "NVIDIA P/E ratio 5-year average"\nObservation: 5-year average ~55×; current ~65×.\nConclusion: NVIDIA trades at ~18% premium to its 5-year average P/E despite 8× market cap growth over the same period.',
    keyInsight: 'ReAct dramatically reduces hallucination on fact-dependent tasks by grounding reasoning in observations rather than memory alone.',
    source: 'Yao et al. (2022) — ReAct: Synergizing Reasoning and Acting in Language Models',
  },
];

const PROMPTING_PRINCIPLES = [
  { n: 1, title: 'Be specific, not smart.', body: 'Precise instructions outperform clever ones. "Write a 150-word summary with one statistic per paragraph" beats "write a compelling summary."' },
  { n: 2, title: 'Show, don\'t just tell.', body: 'One example of what you want is worth more than any description. Include examples whenever possible — this is the E in RASCEF.' },
  { n: 3, title: 'Ask for reasoning first.', body: 'For complex tasks: "Think through this step by step before answering." Triggers chain-of-thought reasoning and reduces errors on multi-step problems.' },
  { n: 4, title: 'Define what you don\'t want.', body: '"Do not use jargon. Do not assume budget constraints." Negative constraints prevent common failure modes before they happen.' },
  { n: 5, title: 'Break complex tasks into steps.', body: 'A single long prompt often produces worse output than a structured multi-turn conversation. Build incrementally, verify at each step.' },
  { n: 6, title: 'Use delimiters for long inputs.', body: 'Wrap pasted content: --- [document] ---. Prevents the AI from confusing your instructions with the content you\'re providing.' },
  { n: 7, title: 'Assign expertise, not just tasks.', body: '"You are a senior financial analyst" outperforms "help me with finance." Role assignment calibrates depth, vocabulary, and analytical rigor.' },
  { n: 8, title: 'Specify length and format explicitly.', body: 'The model will fill whatever space you leave. "Max 300 words. Three numbered sections." prevents over-generation and keeps output usable.' },
  { n: 9, title: 'Iterate, don\'t restart.', body: 'Targeted refinement beats regeneration. "Keep everything else the same. Only revise the third paragraph — make it more specific." preserves what works.' },
  { n: 10, title: 'Test your prompt on edge cases.', body: 'A prompt that works on one input may fail on another. Run it against your 2–3 hardest cases before treating it as production-ready.' },
];

const CHECKPOINT_TYPES = [
  {
    label: 'Pre-Prompt Alignment',
    when: 'Before starting',
    purpose: 'Confirm objective, audience, and output format',
    prompt: 'Before you begin, confirm your understanding. In 2–3 sentences summarize: (1) what I\'m asking you to produce, (2) who it\'s for, and (3) what success looks like. Then ask any clarifying questions before proceeding.',
    advanced: false,
  },
  {
    label: 'Mid-Task Check-In',
    when: 'After each phase',
    purpose: 'Verify alignment before proceeding',
    prompt: 'Pause here. Summarize what you\'ve produced so far and confirm it aligns with my original objective. Flag anything that feels unclear or off-target.',
    advanced: false,
  },
  {
    label: 'Output Quality Review',
    when: 'After receiving output',
    purpose: 'Validate against the real objective',
    prompt: 'Review the output you just produced. Does it fully answer the original request? What\'s the weakest section, and how would you improve it if you rewrote it?',
    advanced: false,
  },
  {
    label: 'Targeted Refinement',
    when: 'When improving output',
    purpose: 'Sharpen specific sections without regenerating everything',
    prompt: 'Keep everything else the same. Only revise [section/element]. Make it more [concise / specific / data-backed / executive-facing]. Do not change any other part of the output.',
    advanced: false,
  },
  {
    label: 'Step-Back Prompting',
    when: 'Before tackling a specific question',
    purpose: 'Ground the answer in first principles before getting specific',
    prompt: 'Step back first. What are the core principles or frameworks that should govern [topic]? Once you\'ve established those, apply them to answer: [specific question].',
    advanced: true,
  },
  {
    label: 'Assumption Surfacing',
    when: 'Before committing to a direction',
    purpose: 'Make hidden model assumptions visible before they shape the output',
    prompt: 'Before answering, list the 3 most important assumptions you\'re making about this task. Then answer — and note where each assumption influenced your response.',
    advanced: true,
  },
  {
    label: "Devil's Advocate Check",
    when: 'After receiving a recommendation',
    purpose: 'Stress-test the output before acting on it',
    prompt: 'Now argue the opposite position as strongly as possible. What are the best 3 arguments against the recommendation you just made?',
    advanced: true,
  },
];
// ═══════════════════════════════════════════════════════════════════════════
// GAME THEORY SIMULATOR — constants & component
// ═══════════════════════════════════════════════════════════════════════════
const GT_DOMAIN = {
  A: { label: 'Cooperation',  bg: '#3730a318', color: '#818cf8', border: '#3730a340' },
  B: { label: 'Bargaining',   bg: '#d9770618', color: '#fbbf24', border: '#d9770640' },
  C: { label: 'Competition',  bg: '#dc262618', color: '#f87171', border: '#dc262640' },
  D: { label: 'Signaling',    bg: '#0d948818', color: '#2dd4bf', border: '#0d948840' },
  E: { label: 'GeoEcon', bg: '#7c2d1218', color: '#fb923c', border: '#7c2d1240' },
};
const GT_DIFF = {
  Entry:        { bg: '#10b98118', color: '#34d399' },
  Intermediate: { bg: '#f59e0b18', color: '#fbbf24' },
  Advanced:     { bg: '#ef444418', color: '#f87171' },
};
const GT_AI_LABELS = {
  random:                { name: 'Randomizer',             desc: 'Played each option with equal probability, making all patterns unexploitable.' },
  titfortat:             { name: 'Tit-for-Tat',            desc: 'Cooperated first, then mirrored your previous move. Rewards cooperation, punishes defection symmetrically.' },
  alwaysdefect:          { name: 'Always Defect',          desc: 'Defected every round regardless of your choices. Dominant in one-shot games, corrosive in repeated ones.' },
  grimtrigger:           { name: 'Grim Trigger',           desc: 'Cooperated until your first defection, then defected permanently. The harshest punishment strategy.' },
  coordinate:            { name: 'Coordinator',            desc: 'Leaned toward the payoff-dominant equilibrium, choosing Stag more often than not.' },
  mixed_hawk:            { name: 'Mixed Strategy (NE)',    desc: 'Played Hawk with exactly 62.5% probability, the Nash Equilibrium for Hawk-Dove.' },
  fair_threshold:        { name: 'Fairness Norm',          desc: 'Applied a rejection threshold, refusing offers below a minimum acceptable fraction.' },
  nash_bargaining:       { name: 'Nash Bargainer',         desc: 'Targeted the Nash Bargaining Solution: equal surplus above both BATNAs.' },
  counteroffers:         { name: 'Coalition Shifter',      desc: 'Evaluated coalition proposals by expected share, shifting alliance when a better deal emerged.' },
  aggressive_price:      { name: 'Aggressive Pricer',      desc: 'Systematically undercut your price each round, applying Bertrand competition logic.' },
  cooperative_price:     { name: 'Cooperative Pricer',     desc: 'Matched your price closely, testing whether tacit collusion could be sustained without communication.' },
  reactive_price:        { name: 'Reactive Pricer',        desc: 'Adjusted price based on the previous round\'s relative profit performance.' },
  cournot_best_response: { name: 'Cournot Best Responder', desc: 'Computed the theoretically optimal quantity given your production choice each round.' },
  poker_ai:              { name: 'Calibrated Bluffer',     desc: 'Called with strong hands and bluffed weak hands at the equilibrium frequency.' },
  skeptical_dm:          { name: 'Skeptical Decision-Maker', desc: 'Weighed your recommendation against the prior probability of alignment. Followed credible advice, discounted suspect advice.' },
  separating_employer:   { name: 'Sophisticated Employer', desc: 'Offered high wages to credentialed applicants and low wages to uncredentialed ones, consistent with a separating equilibrium.' },
  sovereign_rational:    { name: 'Sovereign Rational Actor', desc: 'Calibrated aggressiveness to the bilateral leverage ratio. Engaged diplomatically when outmatched; escalated when holding structural advantage.' },
  escalate_respond:      { name: 'Escalation Mirror',       desc: 'Matched your previous round posture. Cooperated initially, then responded to each escalation in kind.' },
  mercantilist:          { name: 'Mercantilist Defector',   desc: 'Defected from multilateral arrangements to capture bilateral surplus, treating every round as an independent trade-gain opportunity.' },
  debt_hawk:             { name: 'Debt Hawk',               desc: 'Held firm on restructuring terms, accepting concessions only when the offered haircut cleared the crisis threshold.' },
  devalue_trigger:       { name: 'Devalue Trigger',         desc: 'Maintained the peg under pressure, then devalued sharply when your restraint signaled an exploitable opportunity.' },
};
const GT_STORAGE_KEY = 'stint-gametheory-state';
const GT_SCENARIOS = [
  { id:'a1', title:"The Prisoner's Dilemma", domain:'A', difficulty:'Entry',
    premise:"Two suspects are interrogated separately. Each can stay silent (Cooperate) or betray the other (Defect). The outcome depends entirely on both choices simultaneously.",
    mechanic:"One-shot simultaneous choice. No communication permitted.",
    interfaceType:'binary', options:['Cooperate','Defect'],
    matrix:{ rows:['Cooperate','Defect'], cols:['Cooperate','Defect'], cells:[[[-1,-1],[-3,0]],[[0,-3],[-2,-2]]], unit:'yrs' },
    aiStrategies:['random'], ne:'Defect / Defect',
    concept:'Dominant Strategy, Nash Equilibrium',
    conceptDef:"Defecting produces a better outcome regardless of what the opponent does: if they cooperate, you go free; if they defect, you serve less time. This makes Defect a dominant strategy for both players, and (Defect, Defect) the unique Nash Equilibrium. Both are worse off than under mutual cooperation.",
    realWorldAnchor:"Firms in oligopolies undercutting each other, nations refusing arms limitation treaties, and teams free-riding on collective projects all reproduce this exact structure.",
    insight:"I learned that dominant strategies lead to equilibria that are collectively suboptimal. Individual rationality and collective welfare can systematically diverge.",
    neRow:1, neCol:1, scoreLogic:(ph,ah)=>ph===1?'ne':(ph===0&&ah===0)?'coop':'sub' },
  { id:'a2', title:"Repeated Prisoner's Dilemma", domain:'A', difficulty:'Intermediate',
    premise:"The same interrogation scenario plays out over five rounds. Your opponent's history is visible after each round. Reputation now has a price.",
    mechanic:"Five sequential rounds. The AI's strategy is hidden until the debrief.",
    interfaceType:'multiround', roundInterface:'binary', rounds:5,
    options:['Cooperate','Defect'],
    matrix:{ rows:['Cooperate','Defect'], cols:['Cooperate','Defect'], cells:[[[-1,-1],[-3,0]],[[0,-3],[-2,-2]]], unit:'yrs' },
    aiStrategies:['titfortat','alwaysdefect','grimtrigger','random'], ne:'Mutual cooperation via Tit-for-Tat',
    concept:'Folk Theorem, Reputation Effects',
    conceptDef:"In repeated games, the prospect of future interaction creates space for cooperation. The Folk Theorem shows mutual cooperation can be sustained when players are patient enough. Strategies like Tit-for-Tat reward cooperation and punish defection, sustaining better outcomes than the one-shot equilibrium predicts.",
    realWorldAnchor:"Trade agreements between nations, supplier relationships in supply chains, and ongoing competition between platforms all gain stability from the shadow of future retaliation.",
    insight:"I learned that repetition fundamentally changes strategic incentives. Reputation and the prospect of future interaction can sustain cooperation that a one-shot game destroys.",
    scoreLogic:(hist)=>{ const c=hist.filter(h=>h.playerChoice===0).length; return c>=4?'coop':c<=1?'ne':'sub'; } },
  { id:'a3', title:'The Stag Hunt', domain:'A', difficulty:'Entry',
    premise:"Two hunters can pursue a stag together for a large reward, but only if both commit. Or each can hunt a rabbit alone for a guaranteed smaller reward. Neither knows the other's choice.",
    mechanic:"Simultaneous choice. Two pure-strategy Nash Equilibria exist.",
    interfaceType:'binary', options:['Hunt Stag','Hunt Rabbit'],
    matrix:{ rows:['Hunt Stag','Hunt Rabbit'], cols:['Hunt Stag','Hunt Rabbit'], cells:[[[4,4],[0,2]],[[2,0],[2,2]]], unit:'pts' },
    aiStrategies:['coordinate','random'], ne:'Hunt Stag / Hunt Stag (payoff-dominant)',
    concept:'Coordination Game, Payoff-Dominant Equilibrium',
    conceptDef:"The Stag Hunt has two pure-strategy Nash Equilibria: (Stag, Stag) is payoff-dominant (both prefer it) but (Rabbit, Rabbit) is risk-dominant (it is safe regardless of the partner's choice). This tension between a better outcome requiring coordination and a safe outcome requiring nothing is the game's central lesson.",
    realWorldAnchor:"International climate commitments require simultaneous action by all major parties. Any nation that defects while others cooperate gains a free ride, creating exactly this stag hunt dynamic.",
    insight:"I learned that not all equilibria are equal. Payoff-dominance and risk-dominance can conflict, and coordination failures are rational when trust is absent.",
    neRow:0, neCol:0, scoreLogic:(ph,ah)=>(ph===0&&ah===0)?'ne':ph===1?'ne':'sub' },
  { id:'b1', title:'Ultimatum Game', domain:'B', difficulty:'Entry',
    premise:"You receive $100. Propose how to split it with a counterpart. They accept or reject. If rejected, neither player receives anything.",
    mechanic:"Slider: amount to offer (0-100). The counterpart's rejection threshold is hidden from you.",
    interfaceType:'slider', sliderMin:0, sliderMax:100, sliderDefault:40, sliderLabel:'dollars to offer counterpart',
    aiStrategies:['fair_threshold'], ne:'Offer $1 (subgame perfect equilibrium)',
    concept:'Subgame Perfect Equilibrium, Fairness Norms',
    conceptDef:"Rational analysis predicts the proposer should offer the minimum positive amount: the counterpart should accept any positive offer rather than receive nothing. In practice, offers below $25-30 are routinely rejected. People pay real money to punish unfair treatment, a systematic deviation from the rational actor model.",
    realWorldAnchor:"Salary offers, merger terms, and trade deal concessions are all shaped by fairness norms that constrain what is theoretically achievable, even when one party holds structural power.",
    insight:"I learned that subgame perfect equilibrium often fails because people value fairness, not just material outcomes. Behavioral deviations are systematic, not random.",
    scoreLogic:null },
  { id:'b2', title:'Nash Bargaining Problem', domain:'B', difficulty:'Advanced',
    premise:"Two parties negotiate a deal. The total surplus is $100. Your walk-away value (BATNA) is $20. The counterpart has their own hidden BATNA. Propose a split. If their share falls below their BATNA, they walk away.",
    mechanic:"Slider: your share of the $100 surplus (20-80). The counterpart's BATNA is hidden.",
    interfaceType:'slider', sliderMin:20, sliderMax:80, sliderDefault:50, sliderLabel:'your share of the surplus ($)',
    aiStrategies:['nash_bargaining'], ne:'Equal surplus split above both BATNAs',
    concept:'Nash Bargaining Solution, Pareto Efficiency',
    conceptDef:"The Nash Bargaining Solution maximizes the product of each party's gains above their disagreement point. With symmetric bargaining power, both parties split the surplus equally above their BATNAs. Demanding too much risks breakdown, destroying value for both parties and achieving a Pareto-inferior outcome.",
    realWorldAnchor:"Joint venture equity splits, labor contract negotiations, and licensing royalties are governed in theory by bargaining solutions that reflect each party's outside options.",
    insight:"I learned that efficient bargaining requires understanding both parties' BATNAs. The Nash Bargaining Solution formalizes the intuition that leverage flows from alternatives, not just table position.",
    scoreLogic:null },
  { id:'b3', title:'Divide the Surplus', domain:'B', difficulty:'Advanced',
    premise:"Three players divide $120. Any two can form a coalition and split the value, leaving the third with nothing. The excluded player can always counter-offer next round.",
    mechanic:"Choose which player to partner with. The excluded party always has an incentive to disrupt the coalition.",
    interfaceType:'binary', options:['Partner with Player A','Partner with Player B'],
    matrix:null, aiStrategies:['counteroffers'], ne:'No stable coalition (core is empty)',
    concept:'Coalition Games, Shapley Value',
    conceptDef:"In three-player coalition games, the core (the set of allocations no coalition can improve upon) is often empty. The Shapley value assigns each player their average marginal contribution across all coalition orderings, providing a unique fairness criterion. But no coalition can enforce it unilaterally: the excluded player always has a profitable deviation.",
    realWorldAnchor:"Legislative coalition building, cartel formation among firms, and three-way joint ventures all exhibit this instability. The excluded party always has an incentive to poach a coalition member by offering a slightly better deal.",
    insight:"I learned that three-player bargaining creates inherent instability. The strongest coalitions attract the most disruption, and the player with the weakest outside option is typically excluded.",
    scoreLogic:()=>'coop' },
  { id:'c1', title:'The Pricing War', domain:'C', difficulty:'Intermediate',
    premise:"Two firms sell the same product. Each quarter you set a price. Consumers buy from the cheaper firm. High prices mean better margins, but only if your competitor matches.",
    mechanic:"Slider: price per unit ($1-100). Four rounds. The AI's pricing strategy is hidden.",
    interfaceType:'multiround', roundInterface:'slider', rounds:4,
    sliderMin:1, sliderMax:100, sliderDefault:50, sliderLabel:'price per unit ($)',
    aiStrategies:['aggressive_price','cooperative_price','reactive_price'], ne:'Price = marginal cost (Bertrand paradox)',
    concept:'Bertrand Competition, Collusion Incentives',
    conceptDef:"Bertrand competition predicts two firms will undercut each other until price equals marginal cost, eliminating all profit. In practice, firms sustain higher prices through tacit collusion, product differentiation, or switching costs. The tension between theory and practice is the Bertrand paradox.",
    realWorldAnchor:"Airline pricing, retail fuel, and mobile data tariffs all exhibit the tension between Bertrand undercutting logic and the practical incentive to maintain price discipline through tacit coordination.",
    insight:"I learned that Bertrand competition is a race to the bottom. Sustaining margins requires differentiation or tacit coordination. Pure price competition allows neither.",
    scoreLogic:null },
  { id:'c2', title:'Cournot Duopoly', domain:'C', difficulty:'Intermediate',
    premise:"Two firms choose production quantities simultaneously. Market price falls as total supply rises. You maximize profit given your competitor's output, which you observe only after committing.",
    mechanic:"Slider: units to produce (0-80). Three rounds. Cost per unit: $20. Market price: 100 minus total quantity.",
    interfaceType:'multiround', roundInterface:'slider', rounds:3,
    sliderMin:0, sliderMax:80, sliderDefault:27, sliderLabel:'units to produce',
    aiStrategies:['cournot_best_response'], ne:'Each produces ~27 units (Cournot equilibrium)',
    concept:'Cournot Equilibrium, Best Response Functions',
    conceptDef:"Each firm's optimal quantity is a decreasing function of the competitor's quantity. Best-response functions intersect at the Cournot equilibrium: (100-cost)/3 units each. Output exceeds the monopoly quantity (bad for firms) but falls short of the competitive quantity.",
    realWorldAnchor:"Oil production decisions by OPEC members, spectrum allocation between telecoms, and capacity expansion in airline markets all approximate Cournot quantity competition.",
    insight:"I learned that quantity competition produces a middle ground between monopoly and perfect competition. Understanding the competitor's best-response function matters as much as knowing your own costs.",
    scoreLogic:null },
  { id:'c3', title:'The Auction', domain:'C', difficulty:'Entry',
    premise:"You are bidding in a second-price sealed auction (Vickrey auction). Your private value for the item is shown. The winner pays the second-highest bid, not their own.",
    mechanic:"Enter your bid. All bids are revealed after the auction closes.",
    interfaceType:'numbid', matrix:null, aiStrategies:['random'], ne:'Bid your true private value',
    concept:'Vickrey Auction, Dominant Strategy in Mechanism Design',
    conceptDef:"In a second-price auction, bidding your true value is a dominant strategy. If you win, you pay the second-highest bid regardless of your own bid, so overbidding risks overpaying without benefit and underbidding risks losing profitable deals. Truth-telling uniquely dominates all alternatives.",
    realWorldAnchor:"Google's ad auction system, eBay's proxy bidding mechanism, and spectrum license auctions apply Vickrey principles. Dominant-strategy incentive compatibility (making truth-telling individually rational) is the core design goal.",
    insight:"I learned that good mechanism design can make honesty the dominant strategy. The rules of the game determine whether deception or truth is individually rational.",
    scoreLogic:null },
  { id:'d1', title:'The Signaling Game', domain:'D', difficulty:'Advanced',
    premise:"You are a job applicant. Your ability type is known only to you. Education signals ability to employers, but it is costly. Do you invest in the credential?",
    mechanic:"One decision: invest in education or skip. Your type and education cost are shown. The employer's wage offer reveals the equilibrium.",
    interfaceType:'twostage', options:['Invest in education','Skip credential'],
    matrix:null, aiStrategies:['separating_employer'], ne:'Separating equilibrium: strong types invest, weak types do not',
    concept:'Spence Signaling Model, Separating Equilibrium',
    conceptDef:"In the Spence signaling model, education may add no direct productive value, yet it signals ability because it is cheaper for high-ability types to obtain. A separating equilibrium exists where strong types invest and weak types do not, making the signal credible: only strong types find it individually rational to pay the cost.",
    realWorldAnchor:"MBA programs, professional certifications, and elite university attendance are analyzed as signals rather than purely as human capital. Their value lies partly in what they communicate about who obtains them.",
    insight:"I learned that costly signals are credible precisely because they are costly. A signal cheap for everyone to send conveys no information.",
    scoreLogic:(ph,pt)=>((pt==='strong'&&ph===0)||(pt==='weak'&&ph===1))?'ne':'sub' },
  { id:'d2', title:'The Bluffing Game', domain:'D', difficulty:'Intermediate',
    premise:"A simplified poker variant. Each round you are dealt a hand (strong or weak), shown only to you. You can Bet or Fold. Your opponent can Call or Fold.",
    mechanic:"Three rounds. Your hand changes each round. Track your bluff frequency carefully.",
    interfaceType:'multiround', roundInterface:'binary', rounds:3,
    options:['Bet','Fold'], aiStrategies:['poker_ai'], ne:'Bluff at the equilibrium frequency: call cost divided by total pot',
    concept:'Mixed Strategy Nash Equilibrium, Credible Threats',
    conceptDef:"The equilibrium bluffing frequency makes your opponent exactly indifferent between calling and folding. Bluff too often and they should always call. Bluff never and they should always fold when you bet. The NE frequency eliminates both exploits, making your betting pattern unexploitable regardless of the opponent's response.",
    realWorldAnchor:"Military deterrence credibility, antitrust enforcement threats, and price war commitments all require calibrated commitment. Empty threats are called; unconditional threats escalate. The equilibrium is in between.",
    insight:"I learned that the optimal bluff frequency makes your opponent indifferent between responses. Strategic randomization is not impulsiveness: it is calculated unpredictability.",
    scoreLogic:null },
  { id:'d3', title:'Cheap Talk Game', domain:'D', difficulty:'Advanced',
    premise:"You are an expert advising a decision-maker. Your recommendation costs nothing to give. But your interests may or may not align with theirs. The decision-maker cannot verify your alignment.",
    mechanic:"Choose a recommendation. Whether your interests align with the decision-maker is probabilistic and hidden.",
    interfaceType:'binary', options:['Recommend Action A','Recommend Action B'],
    matrix:null, aiStrategies:['skeptical_dm'], ne:'Babbling equilibrium when interests are misaligned',
    concept:'Crawford-Sobel Model, Babbling Equilibrium',
    conceptDef:"When the expert's interests diverge sufficiently from the decision-maker's, no informative equilibrium exists. The expert has incentive to distort recommendations; the decision-maker knows this and discounts the message. This babbling equilibrium destroys all information content even though communication is costless.",
    realWorldAnchor:"Analyst recommendations from firms with investment banking conflicts, internal advisors pushing preferred strategies, and regulatory capture all produce babbling: messages that convey less than their apparent content.",
    insight:"I learned that credible communication requires aligned interests. When incentives diverge, words lose information, and the receiver knows it.",
    scoreLogic:()=>'coop' },
  { id:'e1', title:'The Sanctions Game', domain:'E', difficulty:'Intermediate',
    premise:"Two economic powers face a bilateral confrontation. Each simultaneously chooses to impose sanctions or to engage diplomatically. The structural leverage between the parties shapes how credible each threat is, but neither side observes the other's posture before committing.",
    mechanic:"One-shot simultaneous choice. No coordination mechanism exists. If the GeoEcon Instrument has been run, the bilateral leverage ratio adjusts the opponent's strategic calculus.",
    interfaceType:'binary', options:['Sanction','Engage'],
    ctxSource:'gi',
    matrix:{ rows:['Sanction','Engage'], cols:['Sanction','Engage'], cells:[[[-1,-1],[5,0]],[[0,5],[3,3]]], unit:'pts' },
    aiStrategies:['sovereign_rational','random'],
    ne:'Mixed strategy: sanctioning probability scales with leverage asymmetry',
    concept:'Coercive Bargaining, Outside Option Theory',
    conceptDef:"The Sanctions Game is a coordination-with-conflict structure. No pure-strategy Nash Equilibrium exists: each side's best response depends on the rival's choice, which cannot be observed before commitment. The mixed-strategy NE is parameterized by the relative cost of mutual sanctions and the size of coercive gains. A party with superior outside options (bilateral leverage) can credibly threaten sanctions at lower cost, shifting the equilibrium toward their preferred outcome. The key insight: leverage advantages are not decisive on their own -- they must be legible to the adversary to shift behavior.",
    realWorldAnchor:"US-China semiconductor controls, SWIFT exclusions, and OFAC designations all involve a simultaneous choice between escalatory and diplomatic postures before observing the target's response. The leverage ratio -- export dependencies, reserve holdings, alternative market access -- determines how much the threat alone shifts behavior without requiring execution.",
    insight:"I learned that sanctions threats work best when the target believes the cost to the sender is low relative to the cost imposed. Actual imposition signals credibility but also reveals that persuasion has failed. The leverage ratio is the prior on how that equilibrium probability is distributed.",
    neRow:1, neCol:1,
    scoreLogic:(ph,ah)=>ph===1?(ah===1?'coop':'sub'):'ne',
    contextBanner:(ctx)=>{
      const gi=ctx?.gi;
      if (!gi?.synthesis) return null;
      const sev=gi.synthesis.unified_severity_tier||'';
      const holder=gi.agents?.agent5b?.leverage_holder||'unknown';
      const lr=gi.agents?.agent5b?.leverage_ratio??gi.synthesis?.leverage_ratio??'?';
      return { title:`GeoInstrument Context: ${gi.instrument||'prior assessment'}`, text:`Severity tier: ${sev}. Leverage holder: ${holder}. Leverage ratio: ${lr}. The AI opponent's sanctioning probability has been calibrated to this leverage structure.` };
    }
  },
  { id:'e2', title:'The Arms Race', domain:'E', difficulty:'Advanced',
    premise:"Two rival powers allocate defense budgets over three planning cycles. Higher spending provides relative security advantage but is costly. In later imperial cycles, spending carries higher debt-service burden -- mutual arms competition extracts more from both economies without improving relative security.",
    mechanic:"Three rounds. Each round set your defense spending allocation (0-80%). The AI mirrors and slightly adjusts its spending each round. If the Big Cycle Engine has been run, the empire stage adjusts the cost multiplier for all spending.",
    interfaceType:'multiround', roundInterface:'slider', rounds:3,
    sliderMin:0, sliderMax:80, sliderDefault:25, sliderLabel:'defense allocation (%)',
    ctxSource:'bce',
    options:[], matrix:null, aiStrategies:['escalate_respond'],
    ne:'Symmetric spending at the level where marginal security return equals marginal cost',
    concept:'Security Dilemma, Action-Reaction Spiral',
    conceptDef:"An arms race is a continuous-action security dilemma where the Nash Equilibrium is mutual overspending relative to the cooperative outcome. Each party's dominant response is to increase spending whenever the rival increases, creating an action-reaction spiral. The cooperative outcome -- mutual restraint -- is Pareto-superior but individually unstable. In later imperial cycles, the cost multiplier rises because debt servicing competes with security spending, narrowing sustainable equilibria and raising the likelihood of fiscal crisis rather than military resolution.",
    realWorldAnchor:"US-Soviet military spending during the Cold War, China-US naval competition, and Gulf state defense procurement all follow action-reaction dynamics. The empire stage variable maps onto Dalio's observation that late-cycle empires continue military spending even as debt servicing crowds out investment, accelerating relative decline.",
    insight:"I learned that arms races are not won by spending more -- they are lost by spending more than the economic base can sustain. The security dilemma is not solved by capability; it is managed by making restraint credible. Mutual transparency about cost structures, not intentions, is the actual lever.",
    contextBanner:(ctx)=>{
      const bce=ctx?.bce;
      if (!bce?.synthesis) return null;
      const st=bce.synthesis.empire_stage??bce.layers?.layer1?.empire_stage??'?';
      const num=Number(st)||3;
      const mult=Math.min(2.0,Math.max(0.6,0.8+num*0.15)).toFixed(2);
      return { title:`Big Cycle Context: ${bce.subject||'prior analysis'}`, text:`Empire Stage ${st}. Spending cost multiplier: ${mult}x. Late-cycle debt burden increases the real cost of each unit of defense allocation in this scenario.` };
    }
  },
  { id:'e3', title:'The Currency War', domain:'E', difficulty:'Intermediate',
    premise:"Two trade rivals each manage their currency peg. Devaluing captures export competitiveness, but if both devalue, neither gains and both suffer inflationary and trade disruption costs. Holding the peg is mutually optimal but individually fragile.",
    mechanic:"One-shot simultaneous choice. Neither party observes the other's currency decision before committing. If the GeoEcon Instrument has been run, bilateral leverage shapes the probability the opponent devalues first.",
    interfaceType:'binary', options:['Devalue','Hold Peg'],
    ctxSource:'gi',
    matrix:{ rows:['Devalue','Hold Peg'], cols:['Devalue','Hold Peg'], cells:[[[-2,-2],[4,-3]],[[-3,4],[2,2]]], unit:'pts' },
    aiStrategies:['devalue_trigger','random'],
    ne:'(Devalue, Devalue): devaluation is the dominant strategy',
    concept:'Competitive Devaluation, Beggar-Thy-Neighbor Policy',
    conceptDef:"Currency competition is a Prisoner's Dilemma applied to exchange rates. Devaluation weakly dominates holding the peg: it performs better against a holder and better against a devaluer. The Nash Equilibrium is mutual devaluation, which produces a net loss for both relative to mutual peg-maintenance. The term 'beggar-thy-neighbor' reflects the one-sided gain in the asymmetric case. Enforcement of peg coordination requires a credible multilateral mechanism -- such as Bretton Woods or a currency board -- that removes the defection option or imposes sufficient punishment.",
    realWorldAnchor:"China's renminbi management, US-China currency manipulation disputes (2019), and competitive devaluations in emerging markets during dollar-tightening cycles all follow this structure. The G7/G20 framework attempts to sustain cooperative currency management by making devaluation internationally costly via reputational and diplomatic channels.",
    insight:"I learned that currency cooperation is fragile because the temptation to devalue is always present. Both sides prefer mutual peg maintenance, but neither side can trust the other to hold without an external enforcement mechanism. Leverage asymmetry shifts who devalues first, not whether someone does.",
    neRow:0, neCol:0,
    scoreLogic:(ph,ah)=>ph===1?(ah===1?'coop':'sub'):'ne',
    contextBanner:(ctx)=>{
      const gi=ctx?.gi;
      if (!gi?.agents?.agent5b) return null;
      const b=gi.agents.agent5b;
      const lr=b.sender_capacity?.score??b.leverage_ratio??'?';
      return { title:`GeoInstrument Context: ${gi.instrument||'prior assessment'}`, text:`Bilateral leverage ratio: ${lr}. Target circumvention capacity: ${b.target_capacity?.circumvention_score??'?'}. High circumvention capacity increases the probability the opponent devalues preemptively rather than holding the peg.` };
    }
  },
  { id:'e4', title:'Trade Coalition', domain:'E', difficulty:'Entry',
    premise:"A multilateral trade framework requires both major powers to participate in order to function. Each independently decides whether to join or defect. Defecting captures bilateral surplus outside the framework. If both defect, both lose the cooperative gains -- but defection still dominates individually.",
    mechanic:"One-shot simultaneous choice. Coalition benefits depend on both parties joining. If the GeoEcon Instrument has been run, the severity tier indicates how mercantilist the opponent's recent behavior has been.",
    interfaceType:'binary', options:['Join','Defect'],
    ctxSource:'gi',
    matrix:{ rows:['Join','Defect'], cols:['Join','Defect'], cells:[[[3,3],[0,4]],[[4,0],[1,1]]], unit:'pts' },
    aiStrategies:['mercantilist','coordinate','random'],
    ne:'(Defect, Defect): defection is the dominant strategy',
    concept:"Trade Prisoner's Dilemma, Coalition Fragility",
    conceptDef:"Trade coalition membership is a Prisoner's Dilemma. Defecting -- capturing bilateral surplus outside the framework -- weakly dominates joining regardless of the rival's choice. The Nash Equilibrium is mutual defection at (1,1), which is strictly worse than mutual cooperation at (3,3). Sustaining coalition membership requires either a repeated-game structure (tit-for-tat enforcement, shadow of the future) or an external mechanism that raises the cost of defection. In one-shot interactions, defection is individually rational and collectively destructive.",
    realWorldAnchor:"WTO compliance dynamics, TPP/CPTPP membership decisions, and OPEC+ production cut adherence all follow this structure. A mercantilist actor treats every trade round as an independent extraction opportunity, undermining framework stability. Effective trade architecture must alter the payoff structure, not rely on goodwill.",
    insight:"I learned that trade cooperation is not about goodwill -- it is about changing the payoff structure so defection is no longer dominant. The coalition fragility problem is structural, not dispositional. The institutional solution is to raise the cost of defection until the game no longer resembles a Prisoner's Dilemma.",
    neRow:1, neCol:1,
    scoreLogic:(ph,ah)=>ph===0?(ah===0?'coop':'sub'):'ne',
    contextBanner:(ctx)=>{
      const gi=ctx?.gi;
      if (!gi?.synthesis) return null;
      const sev=gi.synthesis.unified_severity_tier||'';
      const cls=gi.synthesis.strategic_utility_class||'';
      return { title:`GeoInstrument Context: ${gi.instrument||'prior assessment'}`, text:`Severity: ${sev}. Strategic utility class: ${cls}. A high-severity coercive instrument signals elevated defection probability in this trade game.` };
    }
  },
  { id:'e5', title:'Sovereign Debt Negotiation', domain:'E', difficulty:'Advanced',
    premise:"You are the creditor in a sovereign debt restructuring. You propose a haircut -- the percentage of face value forgiven. The debtor government has a minimum acceptable haircut below which they will pursue alternative financing or default, leaving you with nothing. The debtor's walk-away point is not disclosed.",
    mechanic:"Slider: debt haircut offered (0-80%). The debtor's minimum acceptable threshold is hidden. If the Big Cycle Engine has been run, the debt sustainability classification narrows or widens the debtor's likely reservation range.",
    interfaceType:'slider', sliderMin:0, sliderMax:80, sliderDefault:40, sliderLabel:'haircut offered (%)',
    ctxSource:'bce',
    aiStrategies:['debt_hawk','fair_threshold'],
    ne:'Offer at the debtor reservation point (minimum acceptable haircut)',
    concept:'Creditor-Debtor Bargaining, Debt Overhang',
    conceptDef:"Sovereign debt restructuring is an ultimatum game where the creditor proposes and the debtor accepts or walks away. The theoretically optimal creditor strategy is to offer exactly the debtor's reservation value. In practice, creditors over-hold because they cannot observe the debtor's true distress threshold, producing costly deadlocks. Debt overhang describes a condition where the outstanding debt stock is so large that the debtor cannot credibly commit to repayment, suppressing investment regardless of formal terms. The creditor's BATNA -- recovery rates, secondary market prices, alternative claims -- determines actual leverage.",
    realWorldAnchor:"IMF structural adjustment conditionality, China's Belt and Road renegotiations (Zambia, Sri Lanka), and Greek sovereign debt negotiations (2015) all exhibit this structure. Creditors that underestimate the debtor's outside options trigger strategic defaults that destroy value for both parties.",
    insight:"I learned that creditor leverage is bounded by the debtor's exit options, not by the nominal debt stock. Overreach triggers default, which destroys value for both parties. The strategic core of debt diplomacy is estimating the counterpart's walk-away point -- not ignoring it.",
    contextBanner:(ctx)=>{
      const bce=ctx?.bce;
      if (!bce?.layers?.layer2) return null;
      const l2=bce.layers.layer2;
      const ds=(l2.debt_status||'').replace(/_/g,' ');
      const pp=l2.printing_probability??'?';
      return { title:`Big Cycle Context: ${bce.subject||'prior analysis'}`, text:`Debt status: ${ds}. Printing probability: ${pp}%. The debtor's minimum acceptable haircut has been parameterized from this debt sustainability classification.` };
    }
  },
  { id:'e6', title:'The Escalation Ladder', domain:'E', difficulty:'Advanced',
    premise:"Two powers manage a four-round confrontation. Each round, each can de-escalate (reduce tension and costs) or escalate (apply additional pressure). Unilateral de-escalation is exploitable. Sustained mutual escalation triggers a war-economy threshold, imposing severe costs on both parties in the final round.",
    mechanic:"Four rounds. Each round choose to De-escalate or Escalate. The AI mirrors your previous posture. If the Big Cycle Engine has been run, a later empire stage lowers the war-economy threshold -- less escalation is required to trigger the final-round penalty.",
    interfaceType:'multiround', roundInterface:'binary', rounds:4,
    options:['De-escalate','Escalate'],
    ctxSource:'bce',
    matrix:null, aiStrategies:['escalate_respond','random'],
    ne:'De-escalation after credible threat demonstration (brinkmanship equilibrium)',
    concept:'Brinkmanship, Escalation Dynamics',
    conceptDef:"An escalation ladder is a sequential game where each step upward raises the probability of a war-economy outcome that is bad for both sides. The Nash Equilibrium -- given rational actors -- involves escalating to a credible threshold as a threat, then de-escalating before the threshold is reached. The strategic danger is that miscalculation, domestic political constraints, or reputation concerns push escalation beyond the rational stopping point. Brinkmanship theory predicts that the side with the lower war-economy tolerance should de-escalate first; the side that can credibly threaten to cross the threshold extracts concessions.",
    realWorldAnchor:"Cuban Missile Crisis escalation management, Taiwan Strait exercises, and Gaza ceasefire dynamics all involve explicit escalation ladder logic. The key variable is each party's war-economy threshold and the credibility of their willingness to cross it.",
    insight:"I learned that the value of a threat decreases once you execute it. The escalation ladder works because each step raises stakes without triggering the outcome -- the threat value is precisely that it has not yet been used. Managing the ladder requires knowing your own threshold before the game begins.",
    contextBanner:(ctx)=>{
      const bce=ctx?.bce;
      if (!bce?.synthesis) return null;
      const st=bce.synthesis.empire_stage??bce.layers?.layer1?.empire_stage??'?';
      const num=Number(st)||3;
      const thr=num>=5?2:num>=4?3:4;
      const note=num>=5?'Late-cycle fragility compresses the safe escalation window.':num>=4?'Mid-cycle stress applies standard brinkmanship constraints.':'Early-cycle resilience provides more room before threshold triggers.';
      return { title:`Big Cycle Context: ${bce.subject||'prior analysis'}`, text:`Empire Stage ${st}. War-economy threshold: ${thr} cumulative escalations before final-round penalty triggers. ${note}` };
    }
  },
];

function GameTheorySimulatorTool({ bceResult = null, giResult = null }) {
  const [gtView, setGtView]           = useState('hub');
  const [domFilter, setDomFilter]     = useState('all');
  const [diffFilter, setDiffFilter]   = useState('all');
  const [scenario, setScenario]       = useState(null);
  const [phase, setPhase]             = useState('brief');
  const [round, setRound]             = useState(0);
  const [roundHist, setRoundHist]     = useState([]);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [sliderVal, setSliderVal]     = useState(50);
  const [bidInput, setBidInput]       = useState('');
  const [revealCells, setRevealCells] = useState([]);
  const [debrief, setDebrief]         = useState(null);
  const [aiStrat, setAiStrat]         = useState(null);
  const [privVal, setPrivVal]         = useState(null);
  const [aiThreshold, setAiThreshold] = useState(null);
  const [aligned, setAligned]         = useState(null);
  const [playerType, setPlayerType]   = useState(null);
  const [currentHand, setCurrentHand] = useState(null);
  const [educCost, setEducCost]       = useState(null);
  const [inProgressId, setInProgressId] = useState(null);
  const [session, setSession]         = useState(() => {
    try { const s = localStorage.getItem(GT_STORAGE_KEY); return s ? JSON.parse(s) : { history:[], streak:0, totalScore:0, completionMap:{}, concepts:[] }; }
    catch { return { history:[], streak:0, totalScore:0, completionMap:{}, concepts:[] }; }
  });
  const [geoCtx, setGeoCtx] = useState(() => {
    try { const b=localStorage.getItem('stint-bce-context'); const g=localStorage.getItem('stint-gi-context'); return { bce:b?JSON.parse(b):null, gi:g?JSON.parse(g):null }; }
    catch { return { bce:null, gi:null }; }
  });
  const [ctxParams, setCtxParams] = useState({});

  useEffect(() => {
    try { localStorage.setItem(GT_STORAGE_KEY, JSON.stringify(session)); } catch {}
  }, [session]);
  useEffect(() => { if (bceResult) setGeoCtx(c=>({...c,bce:bceResult})); }, [bceResult]);
  useEffect(() => { if (giResult) setGeoCtx(c=>({...c,gi:giResult})); }, [giResult]);

  const streakMult = [1, 1.5, 2, 2.5][Math.min(session.streak, 3)];

  const startScenario = (sc) => {
    const strat = sc.aiStrategies[Math.floor(Math.random() * sc.aiStrategies.length)];
    setScenario(sc); setAiStrat(strat); setPhase('brief'); setRound(0);
    setRoundHist([]); setPlayerChoice(null); setSliderVal(sc.sliderDefault ?? 50);
    setBidInput(''); setRevealCells([]); setDebrief(null);
    if (sc.interfaceType === 'numbid') setPrivVal(50 + Math.floor(Math.random() * 51));
    if (sc.id === 'b1') setAiThreshold(22 + Math.floor(Math.random() * 19));
    if (sc.id === 'b2') setAiThreshold(25 + Math.floor(Math.random() * 16));
    if (sc.id === 'd3') setAligned(Math.random() < 0.6);
    if (sc.id === 'd1') setPlayerType(Math.random() < 0.6 ? 'strong' : 'weak');
    if (sc.id === 'd1') setEducCost(15 + Math.floor(Math.random() * 16));
    if (sc.id === 'd2') setCurrentHand(Math.random() < 0.5 ? 'strong' : 'weak');
    else setCurrentHand(null);
    setInProgressId(sc.id);
    if (sc.domain === 'E') {
      const bce=geoCtx.bce; const gi=geoCtx.gi; const p={};
      if (sc.id==='e1'||sc.id==='e3') p.leverageRatio=gi?.agents?.agent5b?.leverage_ratio??gi?.synthesis?.leverage_ratio??5;
      if (sc.id==='e2') { const st=Number(bce?.synthesis?.empire_stage??bce?.layers?.layer1?.empire_stage??3); p.armsCostMult=Math.min(2.0,Math.max(0.6,0.8+st*0.15)); p.empireStage=st; }
      if (sc.id==='e5') { const ds=bce?.layers?.layer2?.debt_status??'BORDERLINE'; const base=ds==='PONZI_FINANCE'?55:ds==='UNSUSTAINABLE'?42:ds==='BORDERLINE'?28:15; const thr=base+Math.floor(Math.random()*12); p.debtHawkThreshold=thr; setAiThreshold(thr); }
      if (sc.id==='e6') { const st=Number(bce?.synthesis?.empire_stage??bce?.layers?.layer1?.empire_stage??3); p.escThreshold=st>=5?2:st>=4?3:4; }
      setCtxParams(p);
    } else setCtxParams({});
    setGtView('sim');
  };

  const computeAi = (sc, strat, rnd, hist, pChoice, pSlider) => {
    switch (strat) {
      case 'random':                return Math.random() < 0.5 ? 0 : 1;
      case 'titfortat':             return rnd === 0 ? 0 : (hist[hist.length-1]?.playerChoice ?? 0);
      case 'alwaysdefect':          return 1;
      case 'grimtrigger':           return hist.some(h => h.playerChoice === 1) ? 1 : 0;
      case 'coordinate':            return Math.random() < 0.7 ? 0 : 1;
      case 'mixed_hawk':            return Math.random() < 0.625 ? 0 : 1;
      case 'poker_ai':              { const h = Math.random() < 0.5 ? 'strong' : 'weak'; return h === 'strong' ? 0 : Math.random() < 0.33 ? 0 : 1; }
      case 'counteroffers':         return Math.random() < 0.6 ? 0 : 1;
      case 'skeptical_dm':          return aligned ? 0 : 1;
      case 'separating_employer':   return playerType === 'strong' ? 0 : 1;
      case 'aggressive_price':      return Math.max(1, (pSlider ?? 50) - Math.floor(Math.random() * 6 + 3));
      case 'cooperative_price':     return Math.min(100, Math.max(1, (pSlider ?? 50) + Math.floor(Math.random() * 7) - 3));
      case 'reactive_price':        { const l = hist[hist.length-1]; if (!l) return 50; return l.aiChoice < l.playerChoice ? Math.max(1, l.aiChoice - 3) : Math.min(100, l.aiChoice + 3); }
      case 'cournot_best_response': return Math.max(0, Math.min(80, Math.round((80 - (pSlider ?? 27)) / 2)));
      case 'sovereign_rational':    { const lr=ctxParams?.leverageRatio??5; const sProb=lr>=7?0.2:lr>=4?0.45:0.70; return Math.random()<sProb?0:1; }
      case 'devalue_trigger':       { const lr=ctxParams?.leverageRatio??5; const dProb=lr>=7?0.55:lr>=4?0.40:0.25; return Math.random()<dProb?0:1; }
      case 'mercantilist':          return Math.random()<0.65?1:0;
      case 'debt_hawk':             return 0;
      case 'escalate_respond':      { const last=hist[hist.length-1]; if (sc.roundInterface==='slider') { if (!last) return 25; return Math.min(80,Math.max(0,Math.round((last.playerChoice??25)*(0.85+Math.random()*0.3)))); } if (!last) return 0; return last.playerChoice===1?(Math.random()<0.85?1:0):0; }
      default:                      return Math.random() < 0.5 ? 0 : 1;
    }
  };

  const triggerReveal = (nCells) => {
    setRevealCells([]);
    for (let i = 0; i < nCells; i++) setTimeout(() => setRevealCells(p => [...p, i]), i * 80 + 200);
  };

  const resolveSlider = (sc, pVal) => {
    if (sc.id === 'b1') {
      const thr = aiThreshold ?? 30; const ok = pVal >= thr;
      return { playerPay:ok?100-pVal:0, aiPay:ok?pVal:0, summary:ok?`Counterpart accepted $${pVal}. You keep $${100-pVal}.`:`Counterpart rejected $${pVal} (below their minimum of $${thr}). Both receive $0.`, scoreType:!ok?'sub':pVal<=25?'ne':'coop' };
    }
    if (sc.id === 'b2') {
      const thr = aiThreshold ?? 30; const aiSh = 100-pVal; const ok = aiSh >= thr;
      const nash = Math.round((100-thr+20)/2+20);
      return { playerPay:ok?pVal:0, aiPay:ok?aiSh:0, summary:ok?`Deal reached. You: $${pVal}, counterpart: $${aiSh}.`:`Counterpart walked away ($${aiSh} is below their BATNA of $${thr}).`, scoreType:!ok?'sub':Math.abs(pVal-nash)<=10?'ne':'coop' };
    }
    if (sc.id === 'e5') {
      const thr = ctxParams?.debtHawkThreshold ?? aiThreshold ?? 35; const ok = pVal >= thr;
      return { playerPay:ok?80-pVal:0, aiPay:ok?pVal:0, summary:ok?`Debtor accepted the ${pVal}% haircut. Creditor recovers ${80-pVal}% of face value. Restructuring agreed.`:`Debtor rejected ${pVal}% -- their minimum was ${thr}%. Restructuring collapsed. Both parties recover nothing from this negotiation.`, scoreType:!ok?'sub':Math.abs(pVal-thr)<=8?'ne':'coop' };
    }
    return { playerPay:0, aiPay:0, summary:'Outcome resolved.', scoreType:'sub' };
  };

  const resolveBinary = (sc, pChoice, aiChoice) => {
    if (sc.id === 'b3') {
      const ok = Math.random() < 0.65;
      return { playerPay:ok?60:0, aiPay:ok?60:0, summary:ok?`Coalition with ${sc.options[pChoice].split(' ').pop()} formed. Each member receives $60.`:`Proposed partner sought a better deal elsewhere. No coalition formed.`, scoreType:'coop' };
    }
    if (sc.id === 'd3') {
      const dmF = aiChoice === 0; const pay = aligned?(dmF?10:2):(dmF?-3:5);
      return { playerPay:pay, aiPay:0, summary:`You recommended ${sc.options[pChoice]}. Decision-maker ${dmF?'followed':'ignored'} your advice. Your interests were ${aligned?'aligned':'misaligned'}. Payoff: ${pay}.`, scoreType:'coop' };
    }
    if (sc.matrix) {
      const cell = sc.matrix.cells[pChoice]?.[aiChoice] ?? [0,0];
      let st;
      if (sc.id==='a1') st=sc.scoreLogic(pChoice,aiChoice);
      else if (sc.id==='a3') st=sc.scoreLogic(pChoice,aiChoice);
      else if (sc.id==='e1') st=sc.scoreLogic(pChoice,aiChoice);
      else if (sc.id==='e3') st=sc.scoreLogic(pChoice,aiChoice);
      else if (sc.id==='e4') st=sc.scoreLogic(pChoice,aiChoice);
      else st='sub';
      return { playerPay:cell[0], aiPay:cell[1], summary:`You chose ${sc.options[pChoice]}, opponent chose ${sc.options[aiChoice]}. Your payoff: ${cell[0]} ${sc.matrix.unit}.`, scoreType:st };
    }
    return { playerPay:0, aiPay:0, summary:'Outcome resolved.', scoreType:'sub' };
  };

  const resolveMultiRound = (sc, pChoice, aiChoice, rnd) => {
    if (sc.id==='d2') {
      const hand=currentHand??'weak';
      if (pChoice===1) return { playerPay:0, aiPay:1, playerChoice:pChoice, aiChoice, summary:'You folded.' };
      if (aiChoice===1) return { playerPay:1, aiPay:0, playerChoice:pChoice, aiChoice:1, summary:'You bet. AI folded. You win the pot.' };
      const aiH=Math.random()<0.5?'strong':'weak'; const w=hand==='strong';
      return { playerPay:w?2:-1, aiPay:w?-1:2, playerChoice:pChoice, aiChoice:0, summary:`You bet, AI called. Your hand: ${hand}. AI hand: ${aiH}. You ${w?'win +2':'lose -1'}.` };
    }
    if (sc.id==='a2' && sc.matrix) {
      const cell=sc.matrix.cells[pChoice]?.[aiChoice]??[0,0];
      return { playerPay:cell[0], aiPay:cell[1], playerChoice:pChoice, aiChoice, summary:`${sc.options[pChoice]} vs ${sc.options[aiChoice]}: ${cell[0]} ${sc.matrix.unit}.` };
    }
    if (sc.id==='e6') {
      const ppM=[[2,-1],[3,-2]]; const apM=[[2,3],[-1,-2]];
      const pp=ppM[pChoice]?.[aiChoice]??0; const ap=apM[pChoice]?.[aiChoice]??0;
      const thr=ctxParams?.escThreshold??3;
      const cumEsc=(roundHist.filter(h=>h.playerChoice===1).length)+(pChoice===1?1:0);
      const warPenalty=cumEsc>=thr&&rnd===sc.rounds-1?-5:0;
      const msg=pChoice===0&&aiChoice===0?'Both de-escalated. Tension reduced.':pChoice===0&&aiChoice===1?'You de-escalated, AI escalated. They gained leverage.':pChoice===1&&aiChoice===0?'You escalated, AI de-escalated. You gained leverage.':'Both escalated. Tension rising.';
      return { playerPay:pp+warPenalty, aiPay:ap+(roundHist.filter(h=>h.aiChoice===1).length+(aiChoice===1?1:0)>=thr&&rnd===sc.rounds-1?-5:0), playerChoice:pChoice, aiChoice, summary:`${msg}${warPenalty<0?' War-economy threshold triggered -- final-round penalty applied.':''} Round payoff: ${pp+warPenalty>=0?'+':''}${pp+warPenalty}.` };
    }
    if (sc.roundInterface==='slider') {
      if (sc.id==='e2') {
        const mult=ctxParams?.armsCostMult??1.0; const pp=pChoice, ai=aiChoice;
        const pSec=Math.round(100*pp/(pp+ai+1)); const pCost=Math.round(pp*mult);
        const aSec=Math.round(100*ai/(pp+ai+1)); const aCost=Math.round(ai);
        return { playerPay:pSec-pCost, aiPay:aSec-aCost, playerChoice:pp, aiChoice:ai, summary:`You: ${pp}%. AI: ${ai}%. Your security return: ${pSec}. Cost burden: ${pCost} (${mult.toFixed(2)}x multiplier). Net: ${(pSec-pCost)>=0?'+':''}${pSec-pCost}.` };
      }
    }
    if (sc.roundInterface==='slider') {
      const pp=pChoice, ai=aiChoice;
      if (sc.id==='c1') {
        const cost=20; let pP,aP;
        if (pp<ai){pP=(pp-cost)*100;aP=0;} else if(pp>ai){pP=0;aP=(ai-cost)*100;} else{pP=(pp-cost)*50;aP=pP;}
        return { playerPay:pP, aiPay:aP, playerChoice:pp, aiChoice:ai, summary:`You: $${pp}. AI: $${ai}. ${pp<ai?'You captured the market.':pp>ai?'AI captured the market.':'Market split.'} Your profit: $${pP.toLocaleString()}.` };
      }
      if (sc.id==='c2') {
        const total=pp+ai; const price=Math.max(0,100-total);
        const pP=pp*Math.max(0,price-20); const aP=ai*Math.max(0,price-20);
        return { playerPay:pP, aiPay:aP, playerChoice:pp, aiChoice:ai, summary:`You: ${pp} units. AI: ${ai} units. Price: $${price}. Your profit: $${pP.toLocaleString()}.` };
      }
    }
    return { playerPay:0, aiPay:0, playerChoice:pChoice, aiChoice, summary:'Round resolved.' };
  };

  const computeScore = (st) => {
    if (st==='ne')   return { pts:Math.round(100*streakMult), badge:null };
    if (st==='coop') return { pts:Math.round(75*streakMult), badge:'Cooperation Bonus' };
    return { pts:25, badge:null };
  };

  const finalize = (sc, outcome, pts, badge, pChoice, aiChoice) => {
    setInProgressId(null);
    const newConcept = !session.concepts.includes(sc.concept);
    setDebrief({ sc, outcome, pts, badge, pChoice, aiChoice, aiStratLabel:GT_AI_LABELS[aiStrat]??{ name:aiStrat, desc:'' }, newConcept });
    setPhase('debrief');
    setSession(s => ({
      ...s,
      streak: outcome.scoreType==='sub' ? 0 : s.streak+1,
      totalScore: s.totalScore+pts,
      completionMap: { ...s.completionMap, [sc.id]: outcome.scoreType==='ne'?'mastered':'complete' },
      concepts: newConcept ? [...s.concepts, sc.concept] : s.concepts,
      history: [...s.history, { id:sc.id, title:sc.title, domain:sc.domain, score:pts, concept:sc.concept, date:new Date().toLocaleDateString(), insight:sc.insight }],
    }));
  };

  const commitChoice = () => {
    const sc = scenario; if (!sc) return;

    if (sc.interfaceType === 'twostage') {
      if (playerChoice === null) return;
      const inv=playerChoice===0; const str=playerType==='strong'; const cost=educCost??20;
      const wage=inv?(str?80:25):25; const net=inv?wage-cost:wage;
      const outcome = { playerPay:net, aiPay:0, summary:inv?`You invested in education (cost: $${cost}). Employer offered $${wage} (${str?'recognizing strong type':'unable to distinguish type from credential alone'}). Net payoff: $${net}.`:`You skipped education. Employer offered baseline wage: $${wage}. Net payoff: $${wage}.`, scoreType:((str&&inv)||(!str&&!inv))?'ne':'sub' };
      const { pts, badge } = computeScore(outcome.scoreType);
      finalize(sc, outcome, pts, badge, playerChoice, null);
      return;
    }

    if (sc.interfaceType === 'binary') {
      if (playerChoice === null) return;
      const aiC = computeAi(sc, aiStrat, 0, [], playerChoice, sliderVal);
      const outcome = resolveBinary(sc, playerChoice, aiC);
      triggerReveal(sc.matrix ? sc.matrix.rows.length * sc.matrix.cols.length : 0);
      const { pts, badge } = computeScore(outcome.scoreType);
      finalize(sc, outcome, pts, badge, playerChoice, typeof aiC==='number'?aiC:null);
      return;
    }

    if (sc.interfaceType === 'slider') {
      const outcome = resolveSlider(sc, sliderVal);
      const { pts, badge } = computeScore(outcome.scoreType);
      finalize(sc, outcome, pts, badge, sliderVal, null);
      return;
    }

    if (sc.interfaceType === 'numbid') {
      const bid = parseInt(bidInput, 10); if (isNaN(bid)||bid<0) return;
      const pv = privVal ?? 70;
      const a1v=30+Math.floor(Math.random()*61), a2v=30+Math.floor(Math.random()*61);
      const a1b=sc.id==='c3'?a1v:Math.round(a1v*0.7), a2b=sc.id==='c3'?a2v:Math.round(a2v*0.7);
      const bids=[[bid,'You'],[a1b,'Bidder A'],[a2b,'Bidder B']].sort((a,b)=>b[0]-a[0]);
      const winner=bids[0][1]; let playerPay, summary, scoreType;
      if (sc.id==='c3') {
        const sb=bids[1][0];
        if (winner==='You'){playerPay=pv-sb;summary=`You won with bid $${bid}. You pay the second-highest bid: $${sb}. Net gain: $${playerPay} (value $${pv} minus $${sb}).`;}
        else{playerPay=0;summary=`${winner} won with $${bids[0][0]}. Your bid: $${bid}. Private value: $${pv}. No cost.`;}
        scoreType=Math.abs(bid-pv)<=5?'ne':bid>pv?'sub':'coop';
      } else {
        if (winner==='You'){playerPay=pv-bid;summary=`You won with bid $${bid}. You pay your own bid. Net gain: $${playerPay} (value $${pv} minus $${bid}).`;}
        else{playerPay=0;summary=`${winner} won with $${bids[0][0]}. Your bid: $${bid}. No payment.`;}
        const opt=Math.round(pv*2/3); scoreType=Math.abs(bid-opt)<=8?'ne':bid>pv*0.85?'sub':'coop';
      }
      const { pts, badge } = computeScore(scoreType);
      finalize(sc, { playerPay, aiPay:0, summary, scoreType }, pts, badge, bid, bids);
      return;
    }

    if (sc.interfaceType === 'multiround') {
      const pC = sc.roundInterface==='binary' ? playerChoice : sliderVal;
      if (pC===null||pC===undefined) return;
      if (sc.id==='d2') setCurrentHand(Math.random()<0.5?'strong':'weak');
      const aiC = computeAi(sc, aiStrat, round, roundHist, pC, sc.roundInterface==='slider'?sliderVal:null);
      const rr = resolveMultiRound(sc, pC, aiC, round);
      const newH = [...roundHist, rr];
      setRoundHist(newH); setPlayerChoice(null);
      if (sc.roundInterface==='slider') setSliderVal(sc.sliderDefault??50);
      if (rr.ended===true || round+1>=sc.rounds) {
        const tot = newH.reduce((s,h)=>s+(h.playerPay||0),0);
        let scoreType;
        if (sc.id==='d2') scoreType=tot>0?'coop':'sub';
        else if (sc.id==='a2') { const c=newH.filter(h=>h.playerChoice===0).length; scoreType=c>=4?'coop':c<=1?'ne':'sub'; }
        else if (sc.id==='c1') { const ad=newH.reduce((s,h)=>s+Math.abs((h.playerChoice||0)-(h.aiChoice||0)),0)/newH.length; scoreType=ad<=5?'coop':'ne'; }
        else if (sc.id==='c2') { const aq=newH.reduce((s,h)=>s+(h.playerChoice||0),0)/newH.length; scoreType=Math.abs(aq-27)<=5?'ne':'sub'; }
        else if (sc.id==='e2') { const aq=newH.reduce((s,h)=>s+(h.playerChoice||0),0)/newH.length; const opt=Math.round(25/(ctxParams?.armsCostMult??1.0)); scoreType=aq<opt*0.8?'coop':Math.abs(aq-opt)<=8?'ne':'sub'; }
        else if (sc.id==='e6') { const esc=newH.filter(h=>h.playerChoice===1).length; scoreType=esc>=3?'sub':esc<=1?'coop':'ne'; }
        else scoreType='coop';
        const outcome = { playerPay:tot, aiPay:newH.reduce((s,h)=>s+(h.aiPay||0),0), summary:`Completed ${newH.length} round${newH.length!==1?'s':''}. Total payoff: ${tot>=0?'+':''}${tot}.`, scoreType };
        const { pts, badge } = computeScore(scoreType);
        finalize(sc, outcome, pts, badge, newH, null);
      } else {
        setRound(r=>r+1);
      }
    }
  };

  const surpriseMe = () => {
    const pool = GT_SCENARIOS.filter(sc=>!session.completionMap[sc.id]);
    startScenario((pool.length?pool:GT_SCENARIOS)[Math.floor(Math.random()*(pool.length||GT_SCENARIOS.length))]);
  };

  const renderMatrix = (sc, pRow, aiCol) => {
    if (!sc?.matrix) return null;
    const { rows, cols, cells, unit } = sc.matrix;
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Payoff Matrix <span className="normal-case font-mono">(you, opponent: {unit})</span></p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr><th />{cols.map(c=><th key={c} className="text-slate-400 font-medium pb-2 px-2 text-center whitespace-nowrap">{c}</th>)}</tr></thead>
            <tbody>{rows.map((row,r)=>(
              <tr key={r}>
                <td className="text-slate-400 font-medium pr-3 whitespace-nowrap py-1">{row}</td>
                {cols.map((_,c)=>{
                  const idx=r*cols.length+c; const revealed=revealCells.includes(idx);
                  const isOut=phase==='debrief'&&pRow===r&&aiCol===c; const cell=cells[r][c];
                  return (
                    <td key={c} className="p-1"><div className={`rounded-lg p-2 text-center border transition-all duration-300 ${isOut?'border-amber-600/60':'border-slate-700/40'}`} style={{ background:isOut?'#92400e25':'#0f172050' }}>
                      <span className="text-xs font-mono" style={{ color:isOut?'#fbbf24':'#94a3b8' }}>{revealed?`${cell[0]}, ${cell[1]}`:phase==='decision'?`${cell[0]}, ?`:'?, ?'}</span>
                    </div></td>
                  );
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHub = () => {
    const filt = GT_SCENARIOS.filter(sc=>(domFilter==='all'||sc.domain===domFilter)&&(diffFilter==='all'||sc.difficulty===diffFilter));
    return (
      <div className="px-4 py-5 md:px-8 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
            {[['score',session.totalScore.toLocaleString()],['streak',session.streak],['concepts',session.concepts.length],['completed',`${Object.keys(session.completionMap).length}/${GT_SCENARIOS.length}`]].map(([k,v])=>(
              <div key={k} className="text-center min-w-[48px]"><p className="text-xl font-black text-white font-mono">{v}</p><p className="text-slate-500 text-xs">{k}</p></div>
            ))}
            <button onClick={surpriseMe} className="ml-auto px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>Surprise Me</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="flex flex-wrap gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1">
              {[['all','All Domains'],...Object.entries(GT_DOMAIN).map(([k,v])=>[k,v.label])].map(([d,label])=>(
                <button key={d} onClick={()=>setDomFilter(d)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${domFilter===d?'text-white bg-slate-700':'text-slate-500 hover:text-slate-300'}`} style={domFilter===d&&d!=='all'?{background:GT_DOMAIN[d]?.bg,color:GT_DOMAIN[d]?.color}:{}}>{label}</button>
              ))}
            </div>
            <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1">
              {['all','Entry','Intermediate','Advanced'].map(d=>(
                <button key={d} onClick={()=>setDiffFilter(d)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${diffFilter===d?'text-white bg-slate-700':'text-slate-500 hover:text-slate-300'}`} style={diffFilter===d&&d!=='all'?{background:GT_DIFF[d]?.bg,color:GT_DIFF[d]?.color}:{}}>{d==='all'?'All Levels':d}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filt.map(sc=>{
              const dom=GT_DOMAIN[sc.domain]; const diff=GT_DIFF[sc.difficulty]; const comp=session.completionMap[sc.id]; const isProg=inProgressId===sc.id;
              return (
                <button key={sc.id} onClick={()=>startScenario(sc)} className="text-left bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 flex flex-col transition-all hover:-translate-y-0.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{background:dom.bg,color:dom.color}}>{dom.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{background:diff.bg,color:diff.color}}>{sc.difficulty}</span>
                      {isProg&&<span className="text-teal-400 text-xs font-mono">▶</span>}
                      {!isProg&&comp==='mastered'&&<span className="text-amber-400 text-xs">★</span>}
                      {!isProg&&comp==='complete'&&<span className="text-slate-400 text-xs">✓</span>}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-violet-200 transition-colors leading-snug">{sc.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed flex-1 line-clamp-2">{sc.premise}</p>
                  <p className="text-xs mt-2.5 font-mono truncate" style={{color:dom.color}}>{sc.concept.split(',')[0]}</p>
                  {sc.ctxSource && geoCtx?.[sc.ctxSource] && <span className="text-xs px-1.5 py-0.5 mt-1.5 inline-block rounded bg-teal-900/40 text-teal-400 font-semibold">Live</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBrief = () => {
    const sc=scenario; if (!sc) return null;
    const dom=GT_DOMAIN[sc.domain]; const diff=GT_DIFF[sc.difficulty];
    return (
      <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto">
        <button onClick={()=>setGtView('hub')} className="text-slate-500 hover:text-slate-300 text-xs mb-5 transition-colors">← back to hub</button>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{background:dom.bg,color:dom.color}}>{dom.label}</span>
          <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{background:diff.bg,color:diff.color}}>{sc.difficulty}</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-3">{sc.title}</h1>
        <p className="text-slate-300 text-sm leading-relaxed mb-5">{sc.premise}</p>
        {sc.contextBanner && (() => { const b=sc.contextBanner(geoCtx); return b ? (
          <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-sky-400/70 uppercase tracking-wider mb-1 font-semibold">{b.title}</p>
            <p className="text-slate-300 text-xs leading-relaxed">{b.text}</p>
          </div>
        ) : null; })()}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mechanic</p>
          <p className="text-slate-300 text-xs leading-relaxed">{sc.mechanic}</p>
        </div>
        {sc.id==='d1'&&playerType&&(
          <div className="bg-violet-950/30 border border-violet-700/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-violet-400/70 uppercase tracking-wider mb-0.5">Your type (known only to you)</p>
            <p className="text-violet-200 text-lg font-black capitalize">{playerType}</p>
          </div>
        )}
        {sc.id==='d1'&&educCost&&(
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Education credential cost</p>
            <p className="text-white text-lg font-black font-mono">${educCost}</p>
          </div>
        )}
        {sc.id==='d2'&&currentHand&&(
          <div className="bg-violet-950/30 border border-violet-700/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs text-violet-400/70 uppercase tracking-wider mb-0.5">Your first hand</p>
            <p className="text-white text-lg font-black capitalize">{currentHand}</p>
          </div>
        )}
        <button onClick={()=>setPhase('decision')} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all" style={{background:`linear-gradient(135deg,${dom.color}90,${dom.color}55)`}}>Begin Simulation</button>
      </div>
    );
  };

  const renderDecision = () => {
    const sc=scenario; if (!sc) return null;
    const dom=GT_DOMAIN[sc.domain];
    const isMR=sc.interfaceType==='multiround';
    const isBin=sc.interfaceType==='binary'||sc.interfaceType==='twostage'||(isMR&&sc.roundInterface==='binary');
    const isSl=sc.interfaceType==='slider'||(isMR&&sc.roundInterface==='slider');
    const canGo=isBin?playerChoice!==null:sc.interfaceType==='numbid'?(bidInput!==''&&!isNaN(parseInt(bidInput,10))):true;
    const opts=sc.options??[];
    const cPots=[[4,1],[16,4],[64,16]];
    return (
      <div className="px-4 py-5 md:px-8 max-w-5xl mx-auto">
        <div className="flex items-center flex-wrap gap-2 mb-5">
          <button onClick={()=>setGtView('hub')} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">← hub</button>
          <h2 className="text-white font-bold text-sm flex-1 truncate">{sc.title}</h2>
          {isMR&&<span className="text-slate-500 text-xs font-mono">Round {round+1}/{sc.rounds}</span>}
          {session.streak>=2&&<span className="text-xs font-mono font-bold" style={{color:'#f59e0b'}}>{streakMult}x</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            {sc.id==='d2'&&currentHand&&(<div className="bg-violet-950/30 border border-violet-700/30 rounded-xl px-4 py-3"><p className="text-xs text-violet-400/70 uppercase tracking-wider mb-0.5">Your hand this round</p><p className="text-white font-black text-lg capitalize">{currentHand}</p><p className="text-slate-500 text-xs mt-0.5">{currentHand==='strong'?'Strong hand wins if the AI calls.':'Weak hand loses if called. Bluff or fold.'}</p></div>)}
            {sc.id==='c3'&&privVal&&(<div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3"><p className="text-xs text-amber-400/70 uppercase tracking-wider mb-0.5">Your private value</p><p className="text-amber-200 text-2xl font-black font-mono">${privVal}</p></div>)}
            {sc.id==='d1'&&(<div className="bg-violet-950/30 border border-violet-700/30 rounded-xl px-4 py-3"><p className="text-xs text-violet-400/70 uppercase tracking-wider mb-0.5">Your situation</p><p className="text-white text-sm font-semibold capitalize">{playerType} ability type</p>{educCost&&<p className="text-slate-500 text-xs mt-1">Credential cost: ${educCost}. High-ability types find signals cheaper to obtain.</p>}</div>)}
            {sc.matrix&&renderMatrix(sc,null,null)}
            {isMR&&roundHist.length>0&&(<div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3"><p className="text-xs text-slate-500 uppercase tracking-wider mb-2">History</p><div className="space-y-1 text-xs">{roundHist.map((rh,i)=>(<div key={i} className="flex justify-between"><span className="text-slate-400">R{i+1}: {sc.roundInterface==='binary'?(opts[rh.playerChoice]??rh.playerChoice):`$${rh.playerChoice}`} vs {sc.roundInterface==='binary'?(opts[rh.aiChoice]??rh.aiChoice):`$${rh.aiChoice}`}</span><span className="font-mono" style={{color:(rh.playerPay??0)>=0?'#34d399':'#f87171'}}>{(rh.playerPay??0)>=0?'+':''}{rh.playerPay??0}</span></div>))}</div></div>)}
          </div>
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              {isBin&&(<div className="space-y-2"><p className="text-xs text-slate-400 mb-3">{isMR?`Round ${round+1} action:`:'Choose your action:'}</p>{opts.map((opt,i)=>(<button key={i} onClick={()=>setPlayerChoice(i)} className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${playerChoice===i?'':'bg-slate-700/40 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'}`} style={playerChoice===i?{background:`linear-gradient(135deg,${dom.color}30,${dom.color}15)`,border:`1px solid ${dom.color}60`,color:dom.color}:{}}>{opt}</button>))}</div>)}
              {isSl&&(<div><p className="text-xs text-slate-400 mb-3">Set your {sc.sliderLabel}:</p><div className="flex items-center justify-between mb-2"><span className="text-slate-500 text-xs">{sc.sliderMin}</span><span className="text-white font-black text-xl font-mono">{sliderVal}</span><span className="text-slate-500 text-xs">{sc.sliderMax}</span></div><input type="range" min={sc.sliderMin??0} max={sc.sliderMax??100} value={sliderVal} onChange={e=>setSliderVal(Number(e.target.value))} className="w-full accent-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded" /><p className="text-xs text-center text-slate-600 mt-1">{sc.sliderLabel}</p></div>)}
              {sc.interfaceType==='numbid'&&(<div><p className="text-xs text-slate-400 mb-3">Enter your bid:</p><input type="number" min="0" value={bidInput} onChange={e=>setBidInput(e.target.value)} placeholder={`Bid (your value: $${privVal})`} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-violet-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors" /></div>)}
              <button onClick={commitChoice} disabled={!canGo} className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" style={{background:`linear-gradient(135deg,${dom.color}90,${dom.color}55)`}}>{isMR&&round<(sc.rounds??1)-1?`Confirm Round ${round+1}`:'Confirm Decision'}</button>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3"><p className="text-xs text-slate-500">AI opponent active. Strategy hidden until debrief.</p></div>
          </div>
        </div>
      </div>
    );
  };

  const renderDebrief = () => {
    const sc=scenario; if (!sc||!debrief) return null;
    const dom=GT_DOMAIN[sc.domain]; const { outcome, pts, badge, pChoice, aiChoice, aiStratLabel, newConcept } = debrief;
    const pRow=sc.interfaceType==='binary'&&typeof pChoice==='number'?pChoice:null;
    const aiCol=sc.interfaceType==='binary'&&typeof aiChoice==='number'?aiChoice:null;
    return (
      <div className="px-4 py-5 md:px-8 max-w-4xl mx-auto">
        <div className="flex items-center flex-wrap gap-2 mb-5">
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{background:dom.bg,color:dom.color}}>{dom.label}</span>
          <h2 className="text-white font-bold text-base flex-1 leading-snug">{sc.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono" style={{color:'#f59e0b'}}>+{pts}</span>
            {badge&&<span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">{badge}</span>}
          </div>
        </div>
        {newConcept&&(
          <div className="flex items-center gap-2 bg-teal-950/40 border border-teal-700/30 rounded-xl px-3 py-2 mb-4">
            <span className="text-teal-400 text-sm">◈</span>
            <div><p className="text-teal-300 text-xs font-semibold">New concept unlocked</p><p className="text-teal-400/70 text-xs">{sc.concept}</p></div>
          </div>
        )}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Outcome</p>
          <p className="text-white text-sm leading-relaxed">{outcome.summary}</p>
          {outcome.playerPay!==undefined&&(<div className="flex gap-5 mt-3 pt-3 border-t border-slate-700"><div><p className="text-slate-500 text-xs">Your payoff</p><p className="text-lg font-black font-mono" style={{color:outcome.playerPay>=0?'#34d399':'#f87171'}}>{outcome.playerPay>=0?'+':''}{outcome.playerPay}</p></div>{!!outcome.aiPay&&<div><p className="text-slate-500 text-xs">Opponent payoff</p><p className="text-lg font-bold font-mono text-slate-300">{outcome.aiPay}</p></div>}</div>)}
        </div>
        {sc.matrix&&<div className="mb-4">{renderMatrix(sc,pRow,aiCol)}</div>}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Nash Equilibrium prediction</p>
          <p className="text-slate-300 text-xs font-mono mb-3">{sc.ne}</p>
          <p className="text-xs font-semibold text-slate-200 mb-1">{sc.concept}</p>
          <p className="text-slate-400 text-xs leading-relaxed">{sc.conceptDef}</p>
        </div>
        <div className="rounded-2xl p-4 mb-4" style={{background:dom.bg,border:`1px solid ${dom.border}`}}>
          <p className="text-xs font-semibold mb-1" style={{color:dom.color}}>Real-world application</p>
          <p className="text-slate-300 text-xs leading-relaxed">{sc.realWorldAnchor}</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI strategy revealed: {aiStratLabel?.name}</p>
          <p className="text-slate-400 text-xs leading-relaxed">{aiStratLabel?.desc}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={()=>startScenario(sc)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors">Replay</button>
          <button onClick={()=>{const pool=GT_SCENARIOS.filter(s=>s.id!==sc.id&&!session.completionMap[s.id]);startScenario((pool.length?pool:GT_SCENARIOS.filter(s=>s.id!==sc.id))[Math.floor(Math.random()*(pool.length||GT_SCENARIOS.length-1))]);}} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{background:`linear-gradient(135deg,${dom.color}90,${dom.color}55)`}}>Next</button>
        </div>
        <div className="text-center mt-2">
          <button onClick={()=>setGtView('hub')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Back to Hub</button>
        </div>
      </div>
    );
  };

  const renderScoreboard = () => (
    <div className="px-4 py-5 md:px-8 max-w-4xl mx-auto">
      <h2 className="text-white font-bold text-base mb-5">Scoreboard & Insight Log</h2>
      {session.history.length===0 ? (
        <p className="text-slate-500 text-sm">No scenarios completed yet. Start with The Prisoner's Dilemma.</p>
      ) : (<>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-700">{['Scenario','Domain','Score','Concept','Date'].map(h=><th key={h} className="text-left text-slate-500 font-semibold uppercase tracking-wider pb-2 pr-4 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{[...session.history].reverse().map((h,i)=>{
              const dom=GT_DOMAIN[h.domain];
              return (<tr key={i} className="border-b border-slate-800/60">
                <td className="py-2.5 pr-4 text-white font-medium whitespace-nowrap">{h.title}</td>
                <td className="py-2.5 pr-4"><span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{background:dom?.bg,color:dom?.color}}>{dom?.label}</span></td>
                <td className="py-2.5 pr-4 font-mono font-bold text-amber-400">+{h.score}</td>
                <td className="py-2.5 pr-4 text-slate-400 max-w-xs truncate">{h.concept.split(',')[0]}</td>
                <td className="py-2.5 text-slate-600 whitespace-nowrap">{h.date}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-3">Insight Log</h3>
          <div className="space-y-2">{session.history.filter((h,i,arr)=>arr.findIndex(x=>x.id===h.id)===i).map((h,i)=>{
            const dom=GT_DOMAIN[h.domain];
            return (<div key={i} className="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3"><p className="text-slate-400 text-xs leading-relaxed mb-1">{h.insight}</p><p className="text-xs" style={{color:dom?.color}}>{h.title}</p></div>);
          })}</div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button onClick={()=>setSession({history:[],streak:0,totalScore:0,completionMap:{},concepts:[]})} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Reset session data</button>
        </div>
      </>)}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 pt-4 pb-0 md:px-8 md:pt-5 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>♟</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white leading-tight">Game Theory Simulator</h1>
            <p className="text-slate-500 text-xs">18 scenario-based simulations across cooperation, bargaining, competition, signaling, and geoeconomics</p>
          </div>
          <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 flex-shrink-0">
            {[['hub','Hub'],['scoreboard','Log']].map(([v,l])=>(
              <button key={v} onClick={()=>setGtView(v)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${gtView===v?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {gtView==='hub'&&renderHub()}
        {gtView==='sim'&&(phase==='brief'?renderBrief():phase==='decision'?renderDecision():renderDebrief())}
        {gtView==='scoreboard'&&renderScoreboard()}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// GEOECON SCENARIO EMULATOR — DATA & COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const GSE_COMPLETION_KEY = 'stint-geosim-completion';
const GSE_HISTORY_KEY = 'stint-geosim-history-v1';
const GSE_BIG_CYCLE_PHASES = ["Accumulation","Rise","Consolidation","Overextension","Decline","Reset","Transition","New-Cycle-Entry"];
const GSE_STEEP_DIMENSIONS = ["S","T","E","En","P"];

const GSE_CROSS_LINKS = [
  { fromScenario:"oil-shocks-1973",  fromNodeId:"os73-L4-strategic-reserves",         toScenario:"imf-energy-shock-2026", toNodeId:"ies26-L0-trigger",             linkLabel:"Fast-forward 50 years -- energy architecture tested again",             rationale:"Successful 1973 energy architecture did not prevent 2026 vulnerability. Model how the inherited system performs under new stress." },
  { fromScenario:"gfc-2008",         fromNodeId:"gfc08-L4-shadow-migration",           toScenario:"bipolar-economy",       toNodeId:"bpe-L0-trigger",               linkLabel:"Financial fragility meets geopolitical fracture",                       rationale:"Unresolved shadow banking risk intersects with hegemonic competition; dual vulnerability amplifies both crises." },
  { fromScenario:"asia-crisis-1997", fromNodeId:"afc97-L4-reserve-accumulation",       toScenario:"gfc-2008",              toNodeId:"gfc08-L0-trigger",             linkLabel:"Asian reserves fuel US credit bubble",                                 rationale:"Asian reserve accumulation suppresses US long rates; cheap money fuels housing bubble. The 1997 response seeds the 2008 crisis." },
  { fromScenario:"ai-bubble-burst",  fromNodeId:"aibb-L4-quantum-commercial",          toScenario:"ai-open-source-shock",  toNodeId:"aios-L0-trigger",             linkLabel:"Quantum-AI convergence reopens capability frontier",                   rationale:"Quantum-AI hybrid systems create new capability frontier; open-source quantum-AI models trigger new governance crisis." },
  { fromScenario:"bipolar-economy",  fromNodeId:"bpe-L4-digital-dollar-dominance",     toScenario:"imf-energy-shock-2026", toNodeId:"ies26-L1-severe",              linkLabel:"Dollar weaponization accelerates the Hormuz crisis impact",            rationale:"Digital dollar enforcement intensifies the energy shock by restricting sanctioned nations from hedging exposure." },
  { fromScenario:"ai-displacement",  fromNodeId:"aid-L4-independent-fund-governance",  toScenario:"bipolar-economy",       toNodeId:"bpe-L1-accommodation",         linkLabel:"AI wealth redistribution reduces hegemonic competition pressure",      rationale:"Domestic stability from AI wealth distribution reduces geopolitical confrontation pressure; accommodation becomes viable." },
  { fromScenario:"black-swan",       fromNodeId:"bsw-L4-nato-cyber-command",           toScenario:"ai-open-source-shock",  toNodeId:"aios-L2-international-treaty", linkLabel:"Cyber defense architecture extends to AI governance",                  rationale:"Allied cyber command provides institutional template for AI governance coalition." }
];

const GSE_LENS_META = {
  bigCycle:   { label:'Big Cycle',    color:'#f59e0b', shortLabel:'BC', desc:'Dalio macro-historical phase position' },
  steep:      { label:'STEEP',        color:'#a78bfa', shortLabel:'ST', desc:'Social, Technological, Economic, Environmental, Political intensity' },
  geoEcon:    { label:'GeoEcon',      color:'#2dd4bf', shortLabel:'GE', desc:'Geopolitical-economic tool deployment' },
  gameTheory: { label:'Game Theory',  color:'#60a5fa', shortLabel:'GT', desc:'Strategic interaction and cooperation/defection pattern' }
};

const GSE_COND_RULES = {
  "os73-L3-petrodollar-deal":              (dv)      => !dv.some(d => d.choiceId === "os73-L1-defend-peg"),
  "bpe-L2-aggressive-secondary-sanctions": (dv)      => dv.some(d => d.choiceId === "bpe-L1-containment"),
  "bpe-L2-economic-incentives":            (dv)      => dv.some(d => d.choiceId === "bpe-L1-accommodation"),
  "ies26-L4-imf-program":                  (_dv, ls) => ls.geoEcon.intensityScore > 40,
  "aid-L3-international-tax-coordination": (dv)      => dv.some(d => d.choiceId === "aid-L2-ubi-experiment"),
  "aid-L3-sovereign-wealth-fund":          (dv)      => dv.some(d => d.choiceId === "aid-L2-demand-collapse"),
  "aibb-L4-quantum-commercial":            (dv)      => dv.some(d => d.choiceId === "aibb-L1-strategic-pivot" || d.choiceId === "aibb-L2-state-industrial-policy"),
  "aios-L4-binding-treaty":               (_dv, ls) => ls.gameTheory.cooperateCount >= ls.gameTheory.defectCount,
  "os73-L2-volcker-shock":                 (dv)      => dv.some(d => d.choiceId === "os73-L1-lower-rates"),
  "os73-L3-premature-easing":              (dv)      => dv.some(d => d.choiceId === "os73-L2-volcker-shock"),
};

function gseInitLens() {
  return {
    bigCycle:   { phase:"Unknown", phaseIndex:-1, score:0, history:[], note:"" },
    steep:      { S:0, T:0, E:0, En:0, P:0, primary:null, secondary:null, activationCount:0 },
    geoEcon:    { toolsDeployed:[], dominantTool:null, intensityScore:0 },
    gameTheory: { moves:[], cooperateCount:0, defectCount:0, currentType:"Unknown", payoffLedger:{positive:0,negative:0,neutral:0}, dominantPattern:null }
  };
}

function gseUpdateLens(cur, snap) {
  const u = JSON.parse(JSON.stringify(cur));
  if (snap.bigCycle) {
    u.bigCycle.phase = snap.bigCycle.phase;
    u.bigCycle.note = snap.bigCycle.note || u.bigCycle.note;
    const pi = GSE_BIG_CYCLE_PHASES.indexOf((snap.bigCycle.phase||'').split('-')[0]);
    if (pi >= 0) u.bigCycle.phaseIndex = pi;
    u.bigCycle.score = Math.min(100, u.bigCycle.score + 10);
    u.bigCycle.history.push(snap.bigCycle.phase);
  }
  if (snap.steep) {
    const p = snap.steep.primary; const s = snap.steep.secondary;
    if (p && GSE_STEEP_DIMENSIONS.includes(p)) { u.steep[p] = Math.min(1.0,(u.steep[p]||0)+0.2); u.steep.primary = p; }
    if (s && GSE_STEEP_DIMENSIONS.includes(s)) { u.steep[s] = Math.min(1.0,(u.steep[s]||0)+0.1); u.steep.secondary = s; }
    u.steep.activationCount += 1;
  }
  if (snap.geoEcon && snap.geoEcon.tool) {
    const t = snap.geoEcon.tool;
    if (!u.geoEcon.toolsDeployed.includes(t)) u.geoEcon.toolsDeployed.push(t);
    u.geoEcon.dominantTool = t;
    u.geoEcon.intensityScore = Math.min(100, u.geoEcon.intensityScore + 15);
  }
  if (snap.gameTheory && snap.gameTheory.type) {
    const type = snap.gameTheory.type;
    u.gameTheory.currentType = type;
    u.gameTheory.moves.push(type);
    const coop = ["Cooperate","Coordinate","Positive-Sum","Cooperative","Coalition","Commitment"];
    const def  = ["Defect","Retaliate","Escalate","Zero-Sum","Coercion","Attacker"];
    if (coop.some(c => type.includes(c))) { u.gameTheory.cooperateCount++; u.gameTheory.payoffLedger.positive++; }
    else if (def.some(d => type.includes(d))) { u.gameTheory.defectCount++; u.gameTheory.payoffLedger.negative++; }
    else u.gameTheory.payoffLedger.neutral++;
    const c = u.gameTheory.cooperateCount; const dv = u.gameTheory.defectCount;
    u.gameTheory.dominantPattern = c > dv * 1.5 ? "Cooperative" : dv > c * 1.5 ? "Adversarial" : "Mixed";
  }
  return u;
}

function gseGetSteepDominant(steep) {
  let max = 0; let dom = "E";
  GSE_STEEP_DIMENSIONS.forEach(d => { if ((steep[d]||0) > max) { max = steep[d]; dom = d; } });
  return dom;
}

function gseEvalChoice(choiceId, decisionVector, lensScores) {
  const rule = GSE_COND_RULES[choiceId];
  if (!rule) return { available:true, lockReason:null };
  try {
    const ok = rule(decisionVector, lensScores);
    return { available:ok, lockReason: ok ? null : "Requires a prior path condition to unlock" };
  } catch { return { available:true, lockReason:null }; }
}

function gseGetCrossLinks(scenarioId, nodeId) {
  return GSE_CROSS_LINKS.filter(l => l.fromScenario === scenarioId && l.fromNodeId === nodeId);
}

function gseCalcTrajectory(lensScores, decisionVector) {
  if (!decisionVector.length) return { label:"Not Started", color:"#64748b" };
  const c = lensScores.gameTheory.cooperateCount;
  const d = lensScores.gameTheory.defectCount;
  const ratio = d / Math.max(1, c + d);
  const phase = lensScores.bigCycle.phase;
  if (ratio > 0.7) return { label:"Adversarial Escalation", color:"#ef4444" };
  if (ratio < 0.3) return { label:"Cooperative Resolution", color:"#22c55e" };
  if (phase.includes("Reset") || phase.includes("Transition")) return { label:"Managed Transition", color:"#f97316" };
  if (phase.includes("Overextension") || phase.includes("Decline")) return { label:"Systemic Fragility", color:"#a855f7" };
  return { label:"Uncertain Equilibrium", color:"#3b82f6" };
}

const GSE_CLUSTER_META = {
  historical:  { label:'Historical Archetypes',    accent:'#f59e0b', bg:'rgba(120,53,15,0.15)',  border:'rgba(146,64,14,0.3)',   icon:'⏳', desc:'Pivotal inflection points that redefined global economic and geopolitical architecture.',         scenarios:['oil-shocks-1973','asia-crisis-1997','gfc-2008'] },
  systemic:    { label:'Systemic Risk Typologies', accent:'#ef4444', bg:'rgba(127,29,29,0.15)',  border:'rgba(153,27,27,0.3)',   icon:'!',  desc:'Structural risk patterns that overwhelm institutional response capacity.',                       scenarios:['black-swan','gray-rhino','imf-energy-shock-2026'] },
  geoeconomic: { label:'Geoeconomic Orders',       accent:'#2dd4bf', bg:'rgba(15,118,110,0.15)', border:'rgba(13,148,136,0.3)',  icon:'O',  desc:'Structural futures for the global economic and geopolitical order.',                             scenarios:['bipolar-economy','fragmented-stagnation','tech-realignment','cislunar-geopolitics'] },
  'ai-tech':   { label:'AI & Tech Disruption',     accent:'#a78bfa', bg:'rgba(76,29,149,0.15)',  border:'rgba(91,33,182,0.3)',   icon:'*',  desc:'Five distinct trajectories for advanced AI development and its civilizational consequences.',     scenarios:['ai-open-source-shock','ai-displacement','agi-monopoly','ai-wild-west','ai-bubble-burst'] }
};

const GSE_SCENARIOS = [

  // ── CLUSTER A: HISTORICAL ────────────────────────────────────────────────

  { id:'oil-shocks-1973', cluster:'historical', title:'The 1973-1974 Oil Shocks', era:'1973-1974', timeHorizon:'near-term', primaryLens:'geoEcon',
    description:'OAPEC embargo quadruples oil prices, exposing Western economies to weaponized energy and stagflation that monetary frameworks were not designed to handle.',
    tags:['energy','stagflation','embargo','monetary policy'],
    aiPromptContext:'You are simulating the 1973-1974 oil crisis. Apply Dalio Big Cycle lens (US in late consolidation/early overextension phase), STEEP analysis (P and E dominant with S feedback), and game theory (OAPEC defection against Western importers; oligopolistic coordination among Arab states).',
    rootNodeId:'os73-L0-trigger',
    nodes:{
      'os73-L0-trigger':{ id:'os73-L0-trigger', layer:0, type:'trigger', title:'Arab Oil Embargo Declared', label:'Embargo Trigger',
        narrative:'October 1973: OAPEC member states announce a total oil embargo against the United States and Western supporters of Israel following the Yom Kippur War. Within weeks, oil prices quadruple from $2.90 to $11.65 per barrel. Western economies, built on cheap energy assumptions, face simultaneous inflation and economic contraction -- a combination monetary frameworks were not designed to handle.',
        lensSnapshot:{ bigCycle:{phase:'Overextension',note:'US post-Bretton Woods dollar stress'}, steep:{primary:'P',secondary:'E',note:'Political weaponization of energy; economic stagflation feedback'}, geoEcon:{tool:'Resource Nationalism',note:'First coordinated use of oil as geopolitical instrument'}, gameTheory:{type:'Coordination Game',note:'OAPEC members coordinate defection against Western bloc'} },
        choicePrompt:'How do Western central banks respond to simultaneous inflation and slowing growth?',
        choices:['os73-L1-lower-rates','os73-L1-defend-peg'] },
      'os73-L1-lower-rates':{ id:'os73-L1-lower-rates', layer:1, type:'decision', title:'Lower Interest Rates -- Prioritize Growth', label:'Stimulate the Economy',
        narrative:'Central banks prioritize employment and economic activity, holding or cutting rates despite surging inflation. The consequence: inflation expectations begin to de-anchor. Workers demand higher wages to offset rising costs; firms pass wage increases back into prices. The wage-price spiral activates.',
        lensSnapshot:{ bigCycle:{phase:'Overextension',note:'Debt monetization accelerates currency debasement'}, steep:{primary:'E',secondary:'S',note:'Inflation erodes purchasing power; social unrest builds'}, geoEcon:{tool:'Fiscal Statecraft',note:'Monetary loosening as de facto fiscal transfer'}, gameTheory:{type:"Prisoner's Dilemma",note:'Each nation loosens hoping others will tighten; collective outcome is worse'} },
        secondOrderEffects:['Dollar credibility erodes internationally','Oil exporters accumulate surpluses faster, accelerating Petrodollar recycling pressure','Political pressure mounts on incumbents as consumer prices rise monthly'],
        historicalAnalog:'US Federal Reserve 1973-1978 under Burns; persistent accommodation of inflation',
        choicePrompt:'With the wage-price spiral activating, the central bank faces a critical inflection. Administer a Volcker-style shock, or continue accommodating?',
        choices:['os73-L2-volcker-shock','os73-L2-chronic'] },
      'os73-L1-defend-peg':{ id:'os73-L1-defend-peg', layer:1, type:'decision', title:'Raise Interest Rates -- Prioritize Inflation Control', label:'Tighten Monetary Policy',
        narrative:'Central banks elect to front-load rate hikes. Credit tightens sharply. Mortgage markets seize; business investment contracts. Unemployment rises faster than models projected. Political pressure to reverse course builds immediately.',
        lensSnapshot:{ bigCycle:{phase:'Decline-entry',note:'Deliberate demand destruction to reset inflationary expectations'}, steep:{primary:'E',secondary:'S',note:'Recession deepens; social cost of unemployment accumulates'}, geoEcon:{tool:'Monetary Policy',note:'Rates as instrument of supply-side shock absorption'}, gameTheory:{type:'Chicken Game',note:'Who blinks first: central bank or political class?'} },
        secondOrderEffects:['Housing market contraction spreads to construction employment','Corporate bond spreads widen as refinancing becomes costly','Trading partners with dollar-pegged currencies face imported tightening'],
        historicalAnalog:'Bundesbank response 1973; German insistence on price stability over growth',
        choicePrompt:'With recession deepening, governments face a binary on fiscal policy. Expand deficit spending to offset the contraction, or pursue austerity?',
        choices:['os73-L2-expand','os73-L2-austerity'] },
      'os73-L2-volcker-shock':{ id:'os73-L2-volcker-shock', layer:2, type:'decision', title:'Induce Volcker-Style Rate Shock', label:'Abrupt Rate Hike',
        narrative:'After years of accommodation, the central bank reverses course with a brutal tightening cycle -- rates rising to double digits. Unemployment spikes, credit markets seize, and the housing sector collapses. But inflation expectations crack. The credibility of the central bank begins its slow reconstruction.',
        lensSnapshot:{ bigCycle:{phase:'Reset',note:'Controlled destruction to reset the debt/inflation cycle'}, steep:{primary:'E',secondary:'S',note:'Deep recession trades short-term pain for long-term stability'}, geoEcon:{tool:'Monetary Policy',note:'Extreme rate shock as credibility restoration mechanism'}, gameTheory:{type:'Commitment Device',note:'Central bank burns bridges to make low-inflation policy credible'} },
        secondOrderEffects:['Emerging market dollar-denominated debt becomes catastrophically expensive','Commodity exporters face demand collapse','Long-term bond yields reprice downward as inflation expectations anchor'],
        historicalAnalog:'Volcker Fed 1979-1981; federal funds rate to 20%, unemployment to 10.8%',
        choicePrompt:'With the shock administered, how does the government manage the immediate recession?',
        choices:['os73-L3-absorb','os73-L3-relief','os73-L3-premature-easing'] },
      'os73-L3-premature-easing':{ id:'os73-L3-premature-easing', layer:3, type:'decision', title:'Premature Policy Easing -- Abandon the Shock', label:'Premature Easing',
        narrative:'Political pressure becomes unbearable. The central bank, facing an unemployment rate above 10% and an incumbent government threatening its independence, begins easing before inflation expectations are fully anchored. The decision is politically rational and economically catastrophic: inflation re-accelerates within 12 months, forcing an even more painful second tightening cycle.',
        lensSnapshot:{ bigCycle:{phase:'Overextension-Extended',note:'Premature easing prolongs the cycle; reset deferred'}, steep:{primary:'P',secondary:'E',note:'Political interference in monetary policy; economic credibility destroyed'}, geoEcon:{tool:'Monetary Policy',note:'Premature retreat from tightening destroys credibility'}, gameTheory:{type:'Time Inconsistency',note:'Optimal plan abandoned under short-term pressure; classic credibility failure'} },
        secondOrderEffects:['Inflation re-accelerates to double-digit levels within 12 months','Central bank credibility damaged for a decade','Second tightening cycle required; more severe than the first'],
        historicalAnalog:'Arthur Burns Fed premature easing 1974-1977; stop-go monetary policy UK 1970s; multiple Latin American inflation stabilization failures',
        choicePrompt:'With premature easing restarting the inflation cycle, what emergency response prevents complete monetary credibility collapse?',
        choices:['os73-L4-strategic-reserves','os73-L4-export-led'] },
      'os73-L2-chronic':{ id:'os73-L2-chronic', layer:2, type:'decision', title:'Allow Chronic Inflation to Persist', label:'Continued Accommodation',
        narrative:'Policymakers allow inflation to become structural. Annual price increases of 8-12% become normalized. Real wages erode. The middle class saves less, borrows more, and begins to distrust institutions. International creditors quietly reduce dollar-denominated holdings.',
        lensSnapshot:{ bigCycle:{phase:'Overextension-peak',note:'Dollar reserve status questioned; Petrodollar system under strain'}, steep:{primary:'S',secondary:'E',note:'Social cohesion erodes as purchasing power collapses for fixed-income households'}, geoEcon:{tool:'Currency Manipulation',note:'Inflation as de facto debt reduction via debasement'}, gameTheory:{type:'Iterated Game -- Defection Cascade',note:'Each accommodation erodes credibility; commitment becomes impossible'} },
        secondOrderEffects:['Gold price surges as dollar alternatives are sought','OPEC continues production discipline as dollar purchasing power falls','Political radicalization accelerates among economically displaced populations'],
        historicalAnalog:'UK stagflation 1974-1979; pre-Thatcher period of chronic inflationary accommodation',
        choicePrompt:'With inflation entrenched and the currency under pressure, does the government pursue the Petrodollar deal or allow competitive devaluation?',
        choices:['os73-L3-petrodollar-deal','os73-L3-devalue'] },
      'os73-L2-expand':{ id:'os73-L2-expand', layer:2, type:'decision', title:'Deficit-Financed Fiscal Expansion', label:'Stimulus Spending',
        narrative:'Governments deploy large-scale deficit spending to offset the contractionary effect of rate hikes. The stimulus bridges the employment gap but adds significantly to sovereign debt loads at exactly the moment when borrowing is most expensive.',
        lensSnapshot:{ bigCycle:{phase:'Decline',note:'Debt accumulation during contraction; structural fiscal fragility rising'}, steep:{primary:'E',secondary:'P',note:'Political imperative to buffer social pain creates long-term fiscal constraints'}, geoEcon:{tool:'Fiscal Statecraft',note:'Domestic demand management as geopolitical stabilizer'}, gameTheory:{type:'Short-term vs. Long-term Tradeoff',note:'Stimulate now, pay later; debt overhang defers the reckoning'} },
        secondOrderEffects:['Sovereign debt-to-GDP ratios rise 15-25% across stimulating nations','Crowding out of private investment in medium term','International creditors demand higher yields on new issuances'],
        historicalAnalog:'US Ford/Carter era deficit spending 1974-1979; UK Labour government 1974-1976',
        choicePrompt:'With debt ballooning during a contraction, how does the government manage the growing sovereign debt burden?',
        choices:['os73-L3-monetize','os73-L3-growth'] },
      'os73-L2-austerity':{ id:'os73-L2-austerity', layer:2, type:'decision', title:'Pursue Austerity -- Clear Structural Imbalances', label:'Fiscal Austerity',
        narrative:'Rather than borrowing to cushion the blow, governments cut expenditures and reduce deficits. The immediate pain is severe and politically costly. But the structural imbalances begin to clear faster than under stimulus.',
        lensSnapshot:{ bigCycle:{phase:'Reset',note:'Forced deleveraging clears the cycle; painful but structurally necessary'}, steep:{primary:'S',secondary:'P',note:'Social cost of austerity; political instability as governments fall'}, geoEcon:{tool:'Fiscal Statecraft',note:'Austerity as credibility signal to international creditors'}, gameTheory:{type:'Cooperation with Future Self',note:'Short-term defection from current voters to benefit future stability'} },
        secondOrderEffects:['Government bond yields decline as fiscal credibility improves','Social safety net erosion increases poverty rates short-term','Structural reform opens space for private investment in medium term'],
        historicalAnalog:'West Germany 1974-1976; Netherlands 1975-1982 Wassenaar antecedents',
        choicePrompt:'With austerity clearing imbalances, what long-term energy security architecture is pursued?',
        choices:['os73-L3-iea','os73-L3-domestic-energy'] },
      'os73-L3-absorb':{ id:'os73-L3-absorb', layer:3, type:'decision', title:'Absorb the Recession -- No Immediate Stimulus', label:'Accept Short-Term Pain',
        narrative:'The government and central bank hold firm despite historic unemployment. The commitment is maintained. Inflation expectations crack. The recession is deep but its duration is compressed by the clarity of the commitment.',
        lensSnapshot:{ bigCycle:{phase:'Reset-completion',note:'Debt cycle cleansed; foundation for next expansion set'}, steep:{primary:'S',secondary:'E',note:'High unemployment temporary; productivity recovery begins'}, geoEcon:{tool:'Monetary Policy',note:'Credibility permanently restored'}, gameTheory:{type:'Commitment Device -- Successful',note:'Painful but credible; expectations permanently anchored'} },
        secondOrderEffects:['Long-term bond yields fall dramatically as inflation risk premium collapses','Productivity-led expansion follows within 2-3 years','Dollar regains reserve currency confidence'],
        historicalAnalog:'US 1981-1983 recession; Volcker holds firm despite 10.8% unemployment',
        choicePrompt:'With inflation broken, what long-term energy architecture does the nation pursue?',
        choices:['os73-L4-strategic-reserves','os73-L4-iea-coalition'] },
      'os73-L3-relief':{ id:'os73-L3-relief', layer:3, type:'decision', title:'Targeted Social Relief Without Broad Stimulus', label:'Targeted Relief Programs',
        narrative:'Rather than broad stimulus that risks re-igniting inflation, the government deploys narrow, means-tested relief: heating fuel subsidies, extended unemployment, retraining programs. The macro tightening continues; the social pain is cushioned but not eliminated.',
        lensSnapshot:{ bigCycle:{phase:'Reset-managed',note:'Controlled social cost of correction; political system holds'}, steep:{primary:'S',secondary:'E',note:'Social safety net preserves political stability during correction'}, geoEcon:{tool:'Fiscal Statecraft',note:'Precision fiscal tools avoid macroeconomic distortion'}, gameTheory:{type:'Pareto Improvement',note:'Better outcome for all parties; inflation control without social collapse'} },
        secondOrderEffects:['Political system survives the correction with public trust partially intact','Labor market clears faster than under broad stimulus','Foundation for post-crisis structural reform is preserved'],
        historicalAnalog:'Swedish approach to 1970s adjustment; targeted welfare preservation with monetary discipline',
        choicePrompt:'With the correction managed, what is the long-term energy security architecture pursued?',
        choices:['os73-L4-strategic-reserves','os73-L4-renewables'] },
      'os73-L3-petrodollar-deal':{ id:'os73-L3-petrodollar-deal', layer:3, type:'decision', title:'Negotiate Petrodollar Recycling Architecture', label:'Petrodollar Deal',
        narrative:'The US negotiates a foundational deal with Saudi Arabia: oil priced exclusively in dollars, with OPEC surplus revenues recycled into US Treasury bonds. In exchange, the US provides military security guarantees. This transforms the oil crisis from a terminal threat into a structural advantage.',
        lensSnapshot:{ bigCycle:{phase:'Reset-to-new-cycle',note:'Dollar hegemony reconstituted on energy foundation'}, steep:{primary:'P',secondary:'E',note:'Geopolitical architecture re-established; dollar recycling mechanism born'}, geoEcon:{tool:'Alliance Architecture',note:'Security-for-currency deal creates new global financial architecture'}, gameTheory:{type:'Iterated Cooperation',note:'Mutual benefit structure sustained over decades; Petrodollar system 1974-2024'} },
        secondOrderEffects:['Dollar reserve currency status permanently reinforced by energy anchor','US military presence in Gulf becomes permanent structural commitment','OPEC surplus recycling suppresses US borrowing costs for decades'],
        historicalAnalog:'US-Saudi Petrodollar agreement 1974; Kissinger-facilitated architecture',
        choicePrompt:'With the Petrodollar architecture established, how does the US manage long-term strategic dependencies?',
        choices:['os73-L4-gulf-doctrine','os73-L4-strategic-reserves'] },
      'os73-L3-devalue':{ id:'os73-L3-devalue', layer:3, type:'decision', title:'Allow Competitive Devaluation', label:'Accept Devaluation',
        narrative:'The government stops defending the exchange rate, allowing the currency to find a new, lower equilibrium. Export competitiveness surges immediately; import costs rise sharply, adding another inflationary impulse. But the devaluation provides relief to the traded goods sector.',
        lensSnapshot:{ bigCycle:{phase:'Decline-managed',note:'Controlled decline preserves export capacity'}, steep:{primary:'E',secondary:'T',note:'Export competitiveness boosts manufacturing; import inflation hits consumers'}, geoEcon:{tool:'Currency Manipulation',note:'Devaluation as export subsidy and debt relief mechanism'}, gameTheory:{type:'Beggar-Thy-Neighbor',note:'Gains at partners expense; risk of retaliation and global currency war'} },
        secondOrderEffects:['Trading partners face sudden competitiveness loss; retaliation risk rises','Import inflation adds 2-4% to domestic CPI','Export sector employment recovers while domestic consumption contracts'],
        historicalAnalog:'UK sterling devaluation 1967; French franc devaluation 1969',
        choicePrompt:'With the currency devalued and inflation still elevated, what trade and industrial policy restructures the economy?',
        choices:['os73-L4-export-led','os73-L4-industrial'] },
      'os73-L3-monetize':{ id:'os73-L3-monetize', layer:3, type:'decision', title:'Monetize the Debt -- Central Bank Buys Bonds', label:'Debt Monetization',
        narrative:'The central bank steps in to absorb government bond issuances, effectively financing the deficit by printing money. Immediate pressure is relieved. But the monetary base expands rapidly. International creditors observe that fiscal discipline has been abandoned entirely.',
        lensSnapshot:{ bigCycle:{phase:'Overextension-terminal',note:'Monetization as last resort; currency debasement accelerates cycle end'}, steep:{primary:'E',secondary:'P',note:'Currency crisis risk; political system loses credibility'}, geoEcon:{tool:'Currency Manipulation',note:'Monetization as stealth default on external creditors'}, gameTheory:{type:'Defection from Creditors',note:'One-sided gain at creditors expense; terminal relationship damage'} },
        secondOrderEffects:['Balance of payments crisis develops as currency falls','Capital flight accelerates; wealthy households buy hard assets','IMF emergency engagement begins'],
        historicalAnalog:'UK 1976 IMF bailout crisis; monetization leading to external constraint',
        choicePrompt:'With currency confidence collapsing and capital fleeing, what emergency architecture does the government adopt?',
        choices:['os73-L4-imf-program','os73-L4-currency-board'] },
      'os73-L3-growth':{ id:'os73-L3-growth', layer:3, type:'decision', title:'Supply-Side Growth Strategy', label:'Supply-Side Reform',
        narrative:'Rather than monetizing debt or pure austerity, the government pursues supply-side structural reform: deregulation, privatization, labor market flexibility, and tax incentives for investment. The strategy is to grow out of the debt rather than cut or inflate it away.',
        lensSnapshot:{ bigCycle:{phase:'Transition',note:'Structural reform as route out of overextension'}, steep:{primary:'E',secondary:'P',note:'Political economy of structural reform; vested interests resist change'}, geoEcon:{tool:'Fiscal Statecraft',note:'Tax and regulatory policy as growth tool'}, gameTheory:{type:'Long Game',note:'Reforms have delayed payoffs; patience required'} },
        secondOrderEffects:['Productivity gains materialize within 3-5 years if reforms sustained','Political resistance from protected industries and labor organizations','International investors reward structural credibility with capital inflows'],
        historicalAnalog:'UK Thatcher reforms 1979-1984; Reagan supply-side economics 1981',
        choicePrompt:'With supply-side reforms underway, what energy strategy completes the economic restructuring?',
        choices:['os73-L4-domestic-energy','os73-L4-iea-coalition'] },
      'os73-L3-iea':{ id:'os73-L3-iea', layer:3, type:'decision', title:'Found International Energy Agency -- Coordinate Consumers', label:'IEA Coalition',
        narrative:'The US leads the formation of the International Energy Agency as a counterweight to OPEC: strategic reserves among member states, emergency sharing protocols, demand reduction coordination, and long-term investment in energy alternatives. The consumer cartel is created to match the producer cartel.',
        lensSnapshot:{ bigCycle:{phase:'Managed Transition',note:'Institutional architecture built during crisis to prevent future vulnerability'}, steep:{primary:'P',secondary:'E',note:'Multilateral institution as energy security architecture'}, geoEcon:{tool:'Alliance Architecture',note:'Consumer coalition as counterweight to producer cartel'}, gameTheory:{type:'Coalition Building',note:'Consumers coordinate to reduce dependence on cartel pricing'} },
        secondOrderEffects:['Strategic petroleum reserves established across member nations','Emergency sharing agreements reduce individual vulnerability','Long-term investment in alternative energy sources accelerated by policy coordination'],
        historicalAnalog:'IEA founded November 1974; International Energy Program; Western energy security cooperation',
        choicePrompt:'With the IEA established, what additional long-term energy independence measures does the nation pursue?',
        choices:['os73-L4-strategic-reserves','os73-L4-renewables'] },
      'os73-L3-domestic-energy':{ id:'os73-L3-domestic-energy', layer:3, type:'decision', title:'Project Independence -- Domestic Energy Expansion', label:'Energy Independence Drive',
        narrative:"Nixon's Project Independence: massive investment in domestic oil production, nuclear power, coal, and efficiency standards to eliminate energy import dependence within a decade. The ambition is complete energy autarky. The reality is partial success -- import dependence falls but does not disappear.",
        lensSnapshot:{ bigCycle:{phase:'Managed Transition',note:'Industrial policy deployed to restructure energy base'}, steep:{primary:'T',secondary:'E',note:'Technology investment in energy diversification'}, geoEcon:{tool:'Resource Nationalism',note:'Domestic production as geopolitical security strategy'}, gameTheory:{type:'Unilateral Action',note:'Reducing vulnerability through self-sufficiency rather than cooperation'} },
        secondOrderEffects:['Domestic oil production increases but peak oil constraints eventually bind','Nuclear power expands; Three Mile Island 1979 halts growth','CAFE fuel economy standards permanently reduce per-capita energy consumption'],
        historicalAnalog:"Nixon's Project Independence 1973; energy security legislation 1974-1980",
        choicePrompt:'With domestic energy investment reducing import dependence, what financial architecture is built to sustain the transition?',
        choices:['os73-L4-strategic-reserves','os73-L4-industrial'] },
      'os73-L4-strategic-reserves':{ id:'os73-L4-strategic-reserves', layer:4, type:'terminal', title:'Strategic Petroleum Reserve Architecture', label:'Build Strategic Reserves',
        narrative:'The nation establishes a strategic petroleum reserve and coordinates with allies through the IEA. Emergency sharing protocols, highway speed limits, and fuel economy standards are legislated. The next oil shock will not find the same vulnerability.',
        outcome:'STABILIZATION WITH RESILIENCE ARCHITECTURE',
        outcomeNarrative:'The crisis produces durable institutional innovation: the Strategic Petroleum Reserve, the International Energy Agency, and fuel economy standards become permanent features of energy security architecture. The Petrodollar system stabilizes the dollar. The world enters the 1980s with better-managed energy vulnerability -- but the structural dependency on Gulf oil persists for decades.',
        finalLensScores:{ bigCycle:'Reset -- New Cycle Entry', steep:{S:0.5,T:0.5,E:0.8,En:0.6,P:0.8}, geoEcon:'Alliance Architecture -- IEA consumer coordination', gameTheory:'Cooperative Equilibrium -- reserves as public good' },
        historicalAnalog:'US Strategic Petroleum Reserve established 1975; IEA emergency sharing mechanism',
        aiPromptSeed:'The simulation has reached the Strategic Petroleum Reserve / IEA architecture outcome. Extend to model how the Petrodollar recycling system created in 1974-1975 evolves through the 1980s oil glut, the 1990s Gulf War, and the eventual challenge from shale revolution and energy transition.' },
      'os73-L4-iea-coalition':{ id:'os73-L4-iea-coalition', layer:4, type:'terminal', title:'IEA Consumer Coalition Permanently Established', label:'Consumer Coalition',
        narrative:'The International Energy Agency becomes the permanent institutional architecture for Western energy security: coordinated reserve releases, demand management, and a framework for clean energy transition investment.',
        outcome:'MULTILATERAL ENERGY SECURITY ARCHITECTURE',
        outcomeNarrative:'The oil crisis catalyzes the most significant multilateral energy institution since the post-war period. The IEA framework successfully prevents market panics during subsequent oil shocks by coordinating reserve releases and demand reduction. The longer-term consequence: Western nations invest in energy efficiency and alternatives, slowly reducing the geopolitical leverage that OPEC weaponized in 1973.',
        finalLensScores:{ bigCycle:'Managed Transition -- Institutional Innovation', steep:{S:0.5,T:0.6,E:0.7,En:0.7,P:0.9}, geoEcon:'Alliance Architecture -- energy consumer coalition', gameTheory:'Repeated Cooperation -- IEA reduces individual vulnerability' },
        historicalAnalog:'IEA founded November 1974; 1979 oil crisis coordinated response; 1990 Gulf War reserve release',
        aiPromptSeed:'Model how the IEA consumer coalition evolves from its 1970s origins through the 2022 Russia-Ukraine energy crisis, evaluating when coordinated reserve releases have succeeded and failed as geopolitical tools.' },
      'os73-L4-renewables':{ id:'os73-L4-renewables', layer:4, type:'terminal', title:'Early Renewable Energy Investment Pivot', label:'Renewables Investment',
        narrative:'The crisis triggers the earliest serious government investment in renewable energy: solar, wind, and geothermal receive research funding decades ahead of the private market timeline. The technology seeds planted in the 1970s energy crisis eventually bloom in the 2010s and 2020s.',
        outcome:'EARLY ENERGY TRANSITION INVESTMENT',
        outcomeNarrative:'The political will generated by the oil crisis funds renewable energy R&D that would not have happened on purely commercial timelines. The investments in solar panel efficiency, wind turbine design, and energy storage in the 1970s and 1980s compound over decades, contributing to the dramatic cost reductions that make renewables cost-competitive in the 2010s.',
        finalLensScores:{ bigCycle:'Long-Cycle Seed -- Energy Transition Foundation', steep:{S:0.4,T:0.9,E:0.6,En:0.9,P:0.7}, geoEcon:'Technological Statecraft -- energy technology as strategic investment', gameTheory:'Long-Term Investment -- patient capital in public goods' },
        historicalAnalog:'US Solar Energy Research Institute 1977; German Energiewende seeds; California renewable portfolio standard roots',
        aiPromptSeed:'Model how the early renewable energy investments made in response to the 1973-1974 oil crisis compound over five decades to enable the 2020s energy transition, tracing the policy, technology, and investment chain.' },
      'os73-L4-gulf-doctrine':{ id:'os73-L4-gulf-doctrine', layer:4, type:'terminal', title:'Carter Doctrine -- Permanent Gulf Military Presence', label:'Gulf Security Doctrine',
        narrative:'The Petrodollar architecture requires permanent US military commitment to Gulf stability. The Carter Doctrine (1980) explicitly extends US security guarantees to the Persian Gulf. The US becomes the permanent security guarantor of the global oil supply, a commitment that shapes American foreign policy for decades.',
        outcome:'PETRODOLLAR SECURITY ARCHITECTURE -- PERMANENT GULF COMMITMENT',
        outcomeNarrative:'The Petrodollar deal creates a durable but costly architecture: dollar reserve status anchored to Gulf oil requires permanent US military presence in the region. The strategic interest in Gulf stability drives American involvement in the Iran-Iraq War, the Gulf War, and the Iraq War. The architecture successfully stabilizes the dollar but entangles the US in three decades of Middle East military commitments.',
        finalLensScores:{ bigCycle:'New Hegemonic Cycle -- Dollar-Oil Architecture', steep:{S:0.3,T:0.4,E:0.8,En:0.5,P:1.0}, geoEcon:'Alliance Architecture -- security for currency exchange', gameTheory:'Iterated Cooperation -- stable mutual benefit across decades' },
        historicalAnalog:'Carter Doctrine 1980; US-Saudi security relationship; CENTCOM establishment 1983; Gulf War 1991',
        aiPromptSeed:'Model how the Petrodollar-Gulf security architecture built in 1974-1980 evolves through the 1991 Gulf War, the 2003 Iraq War, the 2011 Arab Spring, and the eventual challenge from US shale energy independence reducing strategic dependence on Gulf oil.' },
      'os73-L4-export-led':{ id:'os73-L4-export-led', layer:4, type:'terminal', title:'Export-Led Recovery', label:'Export-Led Recovery',
        narrative:'Currency devaluation enables export-led growth. Manufacturing competitiveness surges; trade surpluses emerge; the current account improves. The domestic consumer bears the cost through import inflation, but the traded sector recovers strongly.',
        outcome:'EXPORT-LED RECOVERY -- COMPETITIVE DEVALUATION',
        outcomeNarrative:'The devaluation-led recovery succeeds economically but at geopolitical cost. Trading partners face sudden competitiveness losses and threaten retaliation. The international monetary system fragments as competitive devaluations spread. The recovery is real but the cooperation costs are lasting.',
        finalLensScores:{ bigCycle:'Managed Decline -- Export Recovery', steep:{S:0.4,T:0.5,E:0.8,En:0.3,P:0.7}, geoEcon:'Currency Manipulation -- export competitiveness strategy', gameTheory:'Beggar-Thy-Neighbor -- short-term gain with coordination costs' },
        historicalAnalog:'UK export recovery post-devaluation 1969; Japan export strength 1970s despite oil shock',
        aiPromptSeed:'Model how export-led recovery after currency devaluation interacts with the emerging Petrodollar system and the dollar-denominated commodity markets, tracing second-order effects on trade partners and the global monetary architecture.' },
      'os73-L4-industrial':{ id:'os73-L4-industrial', layer:4, type:'terminal', title:'Industrial Policy Restructuring', label:'Industrial Policy',
        narrative:'State-directed industrial policy targets strategic energy-intensive industries for restructuring: steel, chemicals, and automotive sectors are forced to upgrade technology and reduce energy intensity. The process is politically contested but produces more efficient, globally competitive industries.',
        outcome:'INDUSTRIAL RESTRUCTURING -- STATE-DIRECTED ADAPTATION',
        outcomeNarrative:'The energy crisis provides the political cover for industrial policies that competitive markets would have delayed by decades. Energy-intensive industries are either restructured or decline; capital flows toward more energy-efficient sectors. The economies that restructure fastest enter the 1980s with more modern industrial bases.',
        finalLensScores:{ bigCycle:'Transition -- Industrial Modernization', steep:{S:0.5,T:0.7,E:0.8,En:0.6,P:0.8}, geoEcon:'Fiscal Statecraft -- industrial policy as crisis response', gameTheory:'Coordination Solution -- state coordinates transition' },
        historicalAnalog:'French indicative planning 1974-1980; Japanese MITI energy efficiency policy; German industrial adaptation',
        aiPromptSeed:'Model how state-directed industrial restructuring in response to the 1973 oil shock shapes industrial competitiveness trajectories through the 1980s and 1990s, particularly comparing France, Germany, Japan, and the United States.' },
      'os73-L4-imf-program':{ id:'os73-L4-imf-program', layer:4, type:'terminal', title:'IMF Emergency Program', label:'IMF Bailout',
        narrative:'Currency collapse forces an IMF emergency program with stringent conditionality: fiscal austerity, structural reform, and exchange rate flexibility. The immediate crisis is resolved but at the cost of sovereignty over economic policy for several years.',
        outcome:'IMF PROGRAM -- EXTERNAL CONSTRAINT',
        outcomeNarrative:'The IMF program stabilizes the currency and prevents complete economic collapse, but the conditionality -- austerity, privatization, deregulation -- imposes severe social costs. Political backlash against the IMF and against the governments that accepted the program shapes the political landscape for a generation.',
        finalLensScores:{ bigCycle:'Forced Reset -- External Constraint', steep:{S:0.7,T:0.4,E:0.9,En:0.2,P:0.9}, geoEcon:'Alliance Architecture -- IMF conditionality', gameTheory:'Coercion Game -- creditor imposes terms on distressed debtor' },
        historicalAnalog:'UK IMF bailout 1976; Italy 1976 austerity; standard IMF structural adjustment programs',
        aiPromptSeed:'Model how IMF-imposed structural adjustment programs in response to 1970s currency crises compare in outcomes to nations that pursued alternative heterodox approaches, tracing the political and economic consequences.' },
      'os73-L4-currency-board':{ id:'os73-L4-currency-board', layer:4, type:'terminal', title:'Currency Board -- Hard Peg Architecture', label:'Currency Board',
        narrative:'To restore credibility, the government establishes a currency board: the domestic currency is pegged to the dollar with full reserve backing. Monetary sovereignty is surrendered in exchange for instant credibility.',
        outcome:'CURRENCY BOARD -- CREDIBILITY THROUGH CONSTRAINT',
        outcomeNarrative:'The currency board successfully restores monetary credibility and stops inflation. But the hard peg eliminates monetary policy flexibility entirely -- in future downturns, the only adjustment mechanism is deflation and unemployment. The architecture solves the inflation problem but creates fragility for future shocks.',
        finalLensScores:{ bigCycle:'Reset -- Monetary Constraint', steep:{S:0.5,T:0.3,E:0.8,En:0.2,P:0.7}, geoEcon:'Currency Manipulation -- hard peg credibility architecture', gameTheory:'Commitment Device -- rules-based monetary constraint' },
        historicalAnalog:'Argentina currency board 1991-2001; Hong Kong linked exchange rate system; Estonia currency board 1992',
        aiPromptSeed:'Model how currency board architectures created in response to 1970s inflation crises perform under stress, particularly when external shocks require adjustment mechanisms that the hard peg eliminates.' },
      'os73-L4-domestic-energy':{ id:'os73-L4-domestic-energy', layer:4, type:'terminal', title:'Domestic Energy Independence Architecture', label:'Energy Independence',
        narrative:'Massive domestic investment in oil, gas, coal, and nuclear reduces import dependence to near zero within 15 years. The political vulnerability of 1973 is permanently eliminated.',
        outcome:'DOMESTIC ENERGY INDEPENDENCE',
        outcomeNarrative:'The energy independence strategy succeeds in eliminating the specific vulnerability that OPEC weaponized in 1973. But the domestic energy buildup creates its own environmental and political complications: coal expansion worsens urban air quality; nuclear accidents trigger public backlash; domestic oil production eventually peaks. Independence is achieved but at significant side-effect cost.',
        finalLensScores:{ bigCycle:'Managed Transition -- Energy Restructuring', steep:{S:0.4,T:0.7,E:0.7,En:0.6,P:0.8}, geoEcon:'Resource Nationalism -- domestic energy self-sufficiency', gameTheory:'Unilateral Security -- reducing external dependence' },
        historicalAnalog:'US domestic energy policy 1975-1985; Norwegian North Sea development; UK North Sea oil development',
        aiPromptSeed:'Model how domestic energy independence strategies pursued in the 1970s shape the energy transition challenge of the 2020s, particularly regarding stranded asset risk, carbon lock-in, and the political economy of transitioning away from domestically produced fossil fuels.' }
    }
  },

  { id:'asia-crisis-1997', cluster:'historical', title:'The 1997 East Asian Financial Crisis', era:'1997-1998', timeHorizon:'near-term', primaryLens:'geoEcon',
    description:'Thai baht collapse triggers contagion across East Asia, creating a liquidity crisis that exposes dollar-pegged exchange rates, corporate over-leverage, and the brutal conditionality of IMF intervention.',
    tags:['currency crisis','IMF','contagion','capital controls','emerging markets'],
    aiPromptContext:'You are simulating the 1997 East Asian financial crisis. Apply Big Cycle lens (developing economies in early accumulation phase, vulnerable to capital flow reversal), STEEP (E and P dominant), and game theory (currency defense as war of attrition against speculators; IMF conditionality as principal-agent problem).',
    rootNodeId:'afc97-L0-trigger',
    nodes:{
      'afc97-L0-trigger':{ id:'afc97-L0-trigger', layer:0, type:'trigger', title:'Thai Baht Collapses -- Contagion Begins', label:'Baht Crisis',
        narrative:'July 2, 1997: Thailand abandons its dollar peg after months of speculative attacks drain foreign reserves. The baht collapses 20% in days. Contagion spreads immediately: Indonesian rupiah, South Korean won, Malaysian ringgit, and Philippine peso all come under devastating speculative pressure. The common vulnerability: large current account deficits, short-term dollar-denominated corporate debt, and over-leveraged banking sectors built on the assumption that dollar pegs were permanent.',
        lensSnapshot:{ bigCycle:{phase:'Debt Cycle -- Emerging Market',note:'External debt cycle peaks as dollar tightening reverses capital inflows'}, steep:{primary:'E',secondary:'P',note:'Currency crisis driven by financial system fragility; political legitimacy challenged'}, geoEcon:{tool:'Currency Manipulation',note:'Dollar pegs as vulnerability; peg abandonment as crisis trigger'}, gameTheory:{type:'Speculative Attack',note:'Self-fulfilling crisis: if everyone sells, the peg breaks; incentive to sell'} },
        choicePrompt:'With currency and financial system collapsing, what is the primary crisis response?',
        choices:['afc97-L1-imf','afc97-L1-resist','afc97-L1-controls'] },
      'afc97-L1-imf':{ id:'afc97-L1-imf', layer:1, type:'decision', title:'Accept IMF Emergency Program', label:'Accept IMF Program',
        narrative:'The government accepts IMF emergency financing in exchange for an extensive conditionality program: bank closures, fiscal austerity, interest rate hikes, and structural reforms. The program provides dollar liquidity to stop the currency freefall but imposes severe contractionary conditions on an already-contracting economy.',
        lensSnapshot:{ bigCycle:{phase:'External-Constrained Reset',note:'IMF program imposes debt cycle correction from outside'}, steep:{primary:'E',secondary:'P',note:'Austerity imposes economic pain; political legitimacy of IMF conditions contested'}, geoEcon:{tool:'Alliance Architecture',note:'IMF as crisis creditor; conditionality as governance mechanism'}, gameTheory:{type:'Credibility Game',note:'Compliance signals creditworthiness; non-compliance triggers capital flight'} },
        secondOrderEffects:['GDP contracts 5-15% in program countries in first year','Bank closures trigger deposit runs; financial system contracts','Political backlash against IMF creates lasting resentment of Bretton Woods institutions'],
        historicalAnalog:'South Korea, Indonesia, Thailand IMF programs 1997-1998; $57 billion South Korea package',
        choicePrompt:'With the IMF program underway, how does the nation handle the banking sector insolvencies?',
        choices:['afc97-L2-bailout','afc97-L3-full'] },
      'afc97-L1-resist':{ id:'afc97-L1-resist', layer:1, type:'decision', title:'Resist IMF Conditionality -- Negotiate Alternative Terms', label:'Resist IMF Terms',
        narrative:'The government refuses the most stringent IMF conditions, attempting to negotiate a less contractionary program or seeking bilateral alternatives. The resistance signals desperation to markets; the currency freefall continues. Without liquidity support, the financial system deteriorates further before a compromise is reached -- at worse terms than immediate acceptance would have secured.',
        lensSnapshot:{ bigCycle:{phase:'Chaotic Reset',note:'Resistance extends duration of crisis and deepens eventual adjustment'}, steep:{primary:'P',secondary:'E',note:'Political decision to resist intensifies economic damage'}, geoEcon:{tool:'Alliance Architecture',note:'Bilateral emergency financing sought as alternative to IMF conditionality'}, gameTheory:{type:'Bargaining Under Duress',note:'Weak bargaining position; resistance raises costs without changing outcome'} },
        secondOrderEffects:['Currency overshoots fair value as uncertainty extends','Corporate bankruptcies cascade faster without stabilizing program','Eventually forced to accept IMF terms at worse conditions than immediate compliance'],
        historicalAnalog:'Indonesia prolonged crisis 1997-1998; Suharto political resistance to conditionality',
        choicePrompt:'With crisis extending and conditions worsening, how does the government eventually stabilize?',
        choices:['afc97-L2-bailout','afc97-L4-reserve-accumulation'] },
      'afc97-L1-controls':{ id:'afc97-L1-controls', layer:1, type:'decision', title:'Impose Capital Controls -- Unilateral Defense', label:'Capital Controls',
        narrative:'Malaysia, uniquely among crisis-affected nations, imposes sweeping capital controls: pegging the ringgit at 3.8/USD, banning repatriation of short-term capital, and ring-fencing the domestic financial system from international speculative pressure. The IMF condemns the action. Western economists predict disaster. Malaysia defies expectations.',
        lensSnapshot:{ bigCycle:{phase:'Disruption-absorbed',note:'Controls temporarily halt the cycle mechanism; buy time for domestic adjustment'}, steep:{primary:'P',secondary:'E',note:'Unilateral political decision; economic heterodoxy vs. orthodoxy'}, geoEcon:{tool:'Currency Manipulation',note:'Fixed exchange rate defended by capital controls rather than reserves'}, gameTheory:{type:'Unilateral Defection from Orthodoxy',note:'Breaking from Washington Consensus game; success challenges dominant paradigm'} },
        secondOrderEffects:['Currency and financial system immediately stabilized','Short-term foreign investment exit blocked; portfolio investors locked in','Recovery begins 12-18 months ahead of IMF-program peers'],
        historicalAnalog:'Malaysia capital controls September 1998; Mahathir vs. IMF orthodoxy',
        choicePrompt:'With capital controls stabilizing the financial system, what domestic economic policy is deployed?',
        choices:['afc97-L2-bailout','afc97-L2-stimulus'] },
      'afc97-L2-bailout':{ id:'afc97-L2-bailout', layer:2, type:'decision', title:'State-Financed Bank Bailout', label:'Bank Bailout',
        narrative:'The government deploys foreign reserves to buy non-performing loans from domestic banks, injecting fresh capital and guaranteeing deposits. The banking system stabilizes rapidly. Confidence in the domestic financial system is maintained even as the exchange rate adjusts. The export sector competitiveness gain begins to stimulate recovery.',
        lensSnapshot:{ bigCycle:{phase:'Managed Reset',note:'Domestic balance sheet repair enables faster cycle recovery'}, steep:{primary:'E',secondary:'P',note:'Financial system saved; political stability maintained through crisis management'}, geoEcon:{tool:'Fiscal Statecraft',note:'State balance sheet mobilized to absorb private sector losses'}, gameTheory:{type:'Coordination Game',note:'Government coordinates depositor confidence to prevent bank runs'} },
        secondOrderEffects:['Bank run risk eliminated; deposit flight halted','Non-performing loan resolution frees credit for new investment within 18 months','Moral hazard concern: bank shareholders partially protected'],
        historicalAnalog:'South Korea KAMCO asset management 1997-2001; Taiwan CDIC intervention',
        choicePrompt:'With banks stabilized, what corporate restructuring strategy is pursued for the heavily indebted corporate sector?',
        choices:['afc97-L3-restructuring','afc97-L3-full'] },
      'afc97-L2-stimulus':{ id:'afc97-L2-stimulus', layer:2, type:'decision', title:'Deploy Fiscal Stimulus Under Capital Controls', label:'Domestic Stimulus',
        narrative:'Insulated from speculative pressure by capital controls, the government runs a countercyclical fiscal deficit -- investing in infrastructure, maintaining public employment, and subsidizing domestic demand. Unlike IMF-program countries forced into austerity, the domestic economy can breathe.',
        lensSnapshot:{ bigCycle:{phase:'Disruption-absorbed',note:'Domestic demand management replaces absent foreign capital'}, steep:{primary:'E',secondary:'T',note:'Infrastructure investment modernizes productive capacity during recovery'}, geoEcon:{tool:'Fiscal Statecraft',note:'Domestic demand management as alternative to export-led recovery'}, gameTheory:{type:'Unilateral Deviation',note:'Breaks from IMF orthodoxy; success challenges dominant paradigm'} },
        secondOrderEffects:['GDP recovery begins 12-18 months ahead of IMF-program peers','Foreign investor wariness persists; FDI inflows lag recovery','Policy becomes reference point for heterodox crisis response'],
        historicalAnalog:'Malaysia under Mahathir 1998-1999; GDP growth returned in 1999 ahead of IMF-program peers',
        choicePrompt:'With the domestic economy recovering but foreign investment still absent, when and how are capital controls removed?',
        choices:['afc97-L3-gradual','afc97-L4-reserve-accumulation'] },
      'afc97-L3-full':{ id:'afc97-L3-full', layer:3, type:'decision', title:'Full IMF Conditionality Compliance', label:'Full Compliance',
        narrative:'The government implements all IMF conditions: bank closures, fiscal austerity, corporate debt restructuring, and capital account liberalization. The short-term contraction is severe. But international creditor confidence is restored quickly. Within 18 months, capital begins to return.',
        lensSnapshot:{ bigCycle:{phase:'Reset-complete',note:'Clean structural adjustment; creditor confidence restored'}, steep:{primary:'E',secondary:'P',note:'Economic pain absorbed; political system survives with external validation'}, geoEcon:{tool:'Alliance Architecture',note:'IMF relationship as international credibility signal'}, gameTheory:{type:'Credible Commitment',note:'Compliance as signal of future policy reliability'} },
        secondOrderEffects:['Rating agency upgrades follow compliance; borrowing costs fall','Domestic banking sector permanently restructured along Western standards','Political resentment of IMF conditions fuels subsequent regional financial architecture (Chiang Mai Initiative)'],
        historicalAnalog:'South Korea 1997-2001; full compliance and rapid recovery; early IMF repayment 2001',
        choicePrompt:'With the IMF program complete and recovery underway, what post-crisis financial architecture does the nation pursue?',
        choices:['afc97-L4-chiang-mai','afc97-L4-reserve-accumulation'] },
      'afc97-L3-restructuring':{ id:'afc97-L3-restructuring', layer:3, type:'decision', title:'Aggressive Corporate Debt Restructuring', label:'Aggressive Restructuring',
        narrative:'Heavily leveraged conglomerates are subject to forced debt restructuring: equity is wiped out, management replaced, assets sold. The process is brutal and politically contested. But the corporate sector emerges genuinely leaner, more competitive, and less reliant on state-directed credit.',
        lensSnapshot:{ bigCycle:{phase:'Reset-accelerated',note:'Corporate restructuring accelerates cycle completion'}, steep:{primary:'E',secondary:'P',note:'Political economy of restructuring; crony capitalism model disrupted'}, geoEcon:{tool:'Fiscal Statecraft',note:'State power deployed to dismantle inefficient corporate structures'}, gameTheory:{type:'Forcing Game',note:'Government uses crisis leverage to change corporate governance equilibrium'} },
        secondOrderEffects:['Short-term unemployment spike from conglomerate downsizing','Export sector becomes more competitive without cross-subsidization','FDI inflows accelerate as corporate governance improves'],
        historicalAnalog:'South Korea chaebol restructuring 1998-2001; Daewoo liquidation',
        choicePrompt:'With corporate restructuring underway, how does the nation reorient its export strategy?',
        choices:['afc97-L4-export-div','afc97-L4-chiang-mai'] },
      'afc97-L3-gradual':{ id:'afc97-L3-gradual', layer:3, type:'decision', title:'Gradual Capital Account Liberalization', label:'Gradual Reopening',
        narrative:'Capital controls are removed in stages over 18-24 months, with long-term FDI welcomed first, portfolio flows second, and short-term speculative flows last. The graduated approach prevents a second speculative attack while slowly re-engaging with international capital markets.',
        lensSnapshot:{ bigCycle:{phase:'Recovery -- Cautious',note:'Managed reintegration into global capital markets'}, steep:{primary:'E',secondary:'T',note:'Financial regulatory capacity building during reopening'}, geoEcon:{tool:'Alliance Architecture',note:'Selective capital account architecture; FDI vs. hot money distinction'}, gameTheory:{type:'Sequential Game',note:'Sequencing controls removal to maximize stability'} },
        secondOrderEffects:['Long-term FDI inflows return ahead of portfolio flows','Domestic financial regulators develop genuine capital flow management capacity','IMF eventually endorses graduated approach as best practice'],
        historicalAnalog:'Malaysia gradual capital control removal 1999-2001; China selective capital account management',
        choicePrompt:'With capital controls successfully removed and the economy reintegrated, what long-term financial resilience architecture is built?',
        choices:['afc97-L4-reserve-accumulation','afc97-L4-chiang-mai'] },
      'afc97-L4-chiang-mai':{ id:'afc97-L4-chiang-mai', layer:4, type:'terminal', title:'Chiang Mai Initiative -- Regional Financial Architecture', label:'Regional Reserve Pool',
        narrative:'The humiliation of IMF conditionality catalyzes a regional response: ASEAN+3 nations establish bilateral swap lines and eventually a multilateralized reserve pool. The architecture provides an alternative to IMF dependence -- crisis liquidity without political conditionality from Washington.',
        outcome:'REGIONAL FINANCIAL AUTONOMY',
        outcomeNarrative:'Asia builds its own financial safety net, reducing IMF dependence and asserting regional financial sovereignty. The architecture is incomplete but functional. The 2008 crisis tests it; the COVID crisis further develops it. The long-term consequence is a gradual redistribution of global financial governance away from Bretton Woods institutions.',
        finalLensScores:{ bigCycle:'Reset -- Regional Architecture Formation', steep:{S:0.5,T:0.4,E:0.8,En:0.2,P:0.9}, geoEcon:'Alliance Architecture -- Regional Financial Autonomy', gameTheory:'Coalition Formation -- changes global financial governance game' },
        historicalAnalog:'Chiang Mai Initiative 2000; CMIM multilateralization 2010; ASEAN+3 Macroeconomic Research Office',
        aiPromptSeed:'The simulation has reached the Chiang Mai Initiative outcome. Extend to model how Asian regional financial architecture evolves through the 2008 crisis, the 2013 taper tantrum, and the 2020 COVID shock -- particularly whether it becomes a genuine alternative to IMF dependence.' },
      'afc97-L4-reserve-accumulation':{ id:'afc97-L4-reserve-accumulation', layer:4, type:'terminal', title:'Massive Foreign Reserve Accumulation', label:'Build Reserves',
        narrative:'The lesson drawn: never again run out of foreign reserves. Asian central banks embark on systematic reserve accumulation, buying US Treasury bonds with export surpluses. This creates the global imbalances that will fuel the 2008 crisis, but provides near-total immunity from speculative attacks.',
        outcome:'FINANCIAL FORTRESS -- GLOBAL IMBALANCE CONTRIBUTION',
        outcomeNarrative:'Asian reserve accumulation successfully eliminates vulnerability to speculative attacks. But the recycling of Asian savings into US Treasuries suppresses long-term US interest rates, contributing to the credit bubble that produces the 2008 global financial crisis. Crisis prevention in one node of the system creates fragility in another.',
        finalLensScores:{ bigCycle:'Recovery -- Next Cycle Seed', steep:{S:0.3,T:0.3,E:0.9,En:0.2,P:0.7}, geoEcon:'Currency Manipulation -- systematic reserve accumulation', gameTheory:'Defection from Global Rebalancing -- rational individually, collectively destabilizing' },
        historicalAnalog:'China, Japan, South Korea reserve accumulation 2000-2007; Bernanke global savings glut speech 2005',
        aiPromptSeed:'Model how Asian reserve recycling into US Treasuries contributes to the conditions for the 2008 global financial crisis, tracing the mechanism from Asian current account surpluses to US long-term interest rate suppression to housing bubble inflation.' },
      'afc97-L4-export-div':{ id:'afc97-L4-export-div', layer:4, type:'terminal', title:'Export Market Diversification', label:'Diversify Export Markets',
        narrative:'Post-crisis, the nation deliberately reduces dependence on US and European export markets by deepening intra-Asian trade, developing African and Middle Eastern relationships, and shifting toward higher-value manufactured goods.',
        outcome:'EXPORT ARCHITECTURE REORIENTATION',
        outcomeNarrative:'Successful diversification reduces the anchor-market vulnerability that made the 2008 US demand shock so damaging to concentrated exporters. The nation enters the 2010s with a more resilient and geographically distributed economic base.',
        finalLensScores:{ bigCycle:'Recovery -- Sustained Accumulation', steep:{S:0.5,T:0.6,E:0.8,En:0.3,P:0.6}, geoEcon:'Alliance Architecture -- Trade Diversification', gameTheory:'Portfolio Diversification -- reduces single-counterparty exposure' },
        historicalAnalog:'South Korea and Taiwan trade diversification post-1998; ASEAN free trade architecture deepening',
        aiPromptSeed:'Model how diversified Asian exporters perform differently from concentrated ones during the 2008 global financial crisis and the subsequent US-China trade war, tracing how export market diversification changes vulnerability profiles.' }
    }
  },

  { id:'gfc-2008', cluster:'historical', title:'The 2008 Global Financial Crisis', era:'2008-2012', timeHorizon:'near-term', primaryLens:'bigCycle',
    description:'Lehman Brothers collapse triggers a global liquidity freeze and the deepest recession since the 1930s, testing the limits of coordinated policy response and revealing the fragility of the shadow banking system.',
    tags:['financial crisis','housing bubble','demand shock','stimulus','austerity','contagion'],
    aiPromptContext:'You are simulating the 2008 Global Financial Crisis. Apply Big Cycle lens (US at peak of debt supercycle; private sector deleveraging; reserve currency under stress), STEEP analysis (E dominant with T and P secondary), and game theory (coordination problems in bank recapitalization; prisoner\'s dilemma in fiscal stimulus sequencing).',
    rootNodeId:'gfc08-L0-trigger',
    nodes:{
      'gfc08-L0-trigger':{ id:'gfc08-L0-trigger', layer:0, type:'trigger', title:'Lehman Brothers Collapse -- Global Liquidity Freeze', label:'Lehman Collapse',
        narrative:'September 15, 2008: Lehman Brothers files for bankruptcy -- the largest in US history. Within 48 hours, the $3.8 trillion money market fund industry faces a run. Interbank lending freezes globally as counterparty risk becomes unquantifiable. The shadow banking system, which had silently become as large as the regulated banking system, collapses without a lender of last resort.',
        lensSnapshot:{ bigCycle:{phase:'Debt Supercycle Peak',note:'Private debt/GDP at historic highs; deleveraging becomes inevitable'}, steep:{primary:'E',secondary:'T',note:'Financial technology complexity created opaque interconnections; systemic fragility invisible'}, geoEcon:{tool:'Fiscal Statecraft',note:'Question is whether states can mobilize fast enough to replace collapsing private demand'}, gameTheory:{type:'Coordination Failure',note:'Each bank waits for others to recapitalize first; individually rational collective disaster'} },
        choicePrompt:'With global demand collapsing and credit frozen, what is the primary policy response?',
        choices:['gfc08-L1-stimulus','gfc08-L1-austerity','gfc08-L1-nationalize'] },
      'gfc08-L1-stimulus':{ id:'gfc08-L1-stimulus', layer:1, type:'decision', title:'Massive Stimulus and Liquidity Injection', label:'Coordinated Stimulus',
        narrative:'Governments deploy unprecedented fiscal and monetary firepower simultaneously. China announces a $586 billion infrastructure package; the US passes TARP and the American Recovery Act; central banks globally cut rates to near zero. The coordinated response is historically unprecedented in scale and speed.',
        lensSnapshot:{ bigCycle:{phase:'Managed Deleveraging',note:'State balance sheet substitutes for collapsing private balance sheet'}, steep:{primary:'E',secondary:'P',note:'Political will mobilized for intervention; long-term fiscal constraints accepted'}, geoEcon:{tool:'Fiscal Statecraft',note:'Largest coordinated stimulus in peacetime history'}, gameTheory:{type:'Coordination Game -- Success',note:'G20 coordination prevents competitive austerity trap'} },
        secondOrderEffects:['Public debt-to-GDP ratios rise 20-40% across major economies','Asset price inflation: stocks and real estate recover rapidly, wealth inequality widens','Zombie firms kept alive by cheap credit reduce long-term productivity growth'],
        historicalAnalog:'G20 London Summit April 2009; coordinated global fiscal expansion; China infrastructure boom',
        choicePrompt:'With stimulus preventing a depression, how is the massive debt overhang managed?',
        choices:['gfc08-L2-normalize','gfc08-L2-repression'] },
      'gfc08-L1-austerity':{ id:'gfc08-L1-austerity', layer:1, type:'decision', title:'Austerity or Fiscal Inaction', label:'Austerity Path',
        narrative:'Governments, constrained by debt fears or ideology, fail to deploy adequate fiscal response. Banks are not recapitalized; demand is not replaced; credit remains frozen. The recession deepens into a potential depression.',
        lensSnapshot:{ bigCycle:{phase:'Unmanaged Deleveraging',note:'Private sector deleveraging not offset by public sector; demand spiral downward'}, steep:{primary:'E',secondary:'S',note:'Unemployment surges; social systems under extreme stress'}, geoEcon:{tool:'Fiscal Statecraft',note:'Inaction as de facto contractionary policy'}, gameTheory:{type:'Collective Action Failure',note:'Each nation expects others to stimulate; all wait; all suffer'} },
        secondOrderEffects:['Unemployment rises to 1930s levels in some nations','Deflation risk becomes primary threat','Political extremism surges in nations hit hardest without a social buffer'],
        historicalAnalog:'Eurozone periphery 2010-2013; Greek austerity under Troika; Irish, Spanish, Portuguese programs',
        choicePrompt:'With austerity deepening the recession, how are collapsed financial institutions handled?',
        choices:['gfc08-L2-belated','gfc08-L3-populist'] },
      'gfc08-L1-nationalize':{ id:'gfc08-L1-nationalize', layer:1, type:'decision', title:'Immediate Bank Nationalization', label:'Nationalize Banks',
        narrative:'Rather than backstopping failed institutions without requiring equity, the government takes full ownership of insolvent banks, wiping out shareholders and replacing management. More politically legitimate -- losses fall on investors, not taxpayers -- and more effective at cleaning balance sheets.',
        lensSnapshot:{ bigCycle:{phase:'Managed Reset',note:'State assumes ownership of broken financial system to recapitalize it'}, steep:{primary:'P',secondary:'E',note:'Political economy of nationalization; market ideology vs. pragmatic intervention'}, geoEcon:{tool:'Fiscal Statecraft',note:'State ownership as crisis management tool'}, gameTheory:{type:'Command Solution',note:'Bypass market coordination failures through state ownership'} },
        secondOrderEffects:['Shareholders wiped out; moral hazard for future crises is reduced','State must manage massively complex financial institutions it may lack capacity for','International capital nervous about nationalization precedent'],
        historicalAnalog:'Swedish bank nationalization 1992-1993; Nordbanken rescue model; Iceland bank resolution 2008',
        choicePrompt:'With banks nationalized, how are the toxic assets on their balance sheets resolved?',
        choices:['gfc08-L2-bad-bank','gfc08-L2-normalize'] },
      'gfc08-L2-normalize':{ id:'gfc08-L2-normalize', layer:2, type:'decision', title:'Gradual Monetary Normalization', label:'Gradual Normalization',
        narrative:'Central banks maintain low rates and large balance sheets for longer than originally intended, gradually tapering stimulus as the recovery strengthens. The transition is managed carefully to avoid triggering a secondary crisis. Asset prices remain elevated throughout.',
        lensSnapshot:{ bigCycle:{phase:'Recovery -- Extended',note:'Prolonged stimulus supports asset prices but delays genuine deleveraging'}, steep:{primary:'E',secondary:'T',note:'Financial technology enables new forms of monetary transmission'}, geoEcon:{tool:'Monetary Policy',note:'Coordinated global monetary normalization'}, gameTheory:{type:'Sequential Game',note:'Fed moves first; others follow sequentially to avoid currency wars'} },
        secondOrderEffects:['Wealth inequality widens as asset price inflation benefits capital holders','Corporate debt leverages up again at low rates, recreating fragility','Emerging markets face taper tantrum capital flow reversals'],
        historicalAnalog:'Fed tapering 2013-2015; ECB normalization 2018-2019',
        choicePrompt:'With normalization underway, what structural financial reforms prevent recurrence?',
        choices:['gfc08-L3-dodd-frank','gfc08-L3-populist'] },
      'gfc08-L2-repression':{ id:'gfc08-L2-repression', layer:2, type:'decision', title:'Financial Repression -- Low Rates, High Inflation', label:'Financial Repression',
        narrative:'Low nominal rates combined with moderate inflation gradually erodes the real value of debt. Savers are penalized; debtors benefit. The debt overhang is inflated away over a decade rather than paid down explicitly or restructured. The process is politically easier than austerity but imposes a hidden tax on savers.',
        lensSnapshot:{ bigCycle:{phase:'Managed Debt Reduction',note:'Inflation as covert debt reduction mechanism; historical precedent post-WWII'}, steep:{primary:'E',secondary:'P',note:'Economic redistribution from savers to debtors; political optics managed'}, geoEcon:{tool:'Monetary Policy',note:'Financial repression as debt management tool'}, gameTheory:{type:'Hidden Transfer Game',note:'Covert redistribution from savers to borrowers via real rate manipulation'} },
        secondOrderEffects:['Pension funds and insurance companies face asset-liability mismatches','Real estate and equity surge as savers chase yield','Retirement security eroded for fixed-income retirees'],
        historicalAnalog:'US financial repression 1945-1980; UK post-WWII debt reduction; negative real rates 2010-2022',
        choicePrompt:'With debt gradually inflated away, what political economy emerges from the decade of financial repression?',
        choices:['gfc08-L3-populist','gfc08-L4-industrial'] },
      'gfc08-L2-belated':{ id:'gfc08-L2-belated', layer:2, type:'decision', title:'Belated Forced Nationalization', label:'Forced Nationalization',
        narrative:'After years of inaction, the financial system has deteriorated beyond market solutions. The government is forced into chaotic nationalizations at the worst possible moment -- markets have priced in failure, political legitimacy is exhausted, and the state fiscal capacity has been consumed by recession.',
        lensSnapshot:{ bigCycle:{phase:'Decline-deep',note:'Delayed intervention compounds the debt cycle damage'}, steep:{primary:'P',secondary:'E',note:'Political crisis; governments fall; external troika intervention'}, geoEcon:{tool:'Fiscal Statecraft',note:'Belated intervention at worst possible fiscal moment'}, gameTheory:{type:'Path Dependency -- Locked In',note:'Early choices constrain options; belated moves are worse than early ones'} },
        secondOrderEffects:['Sovereign debt crisis follows banking crisis','External creditors (IMF/EU) impose conditionality','Democracy under stress as unelected technocrats impose austerity'],
        historicalAnalog:'Greece 2010-2015; Cyprus bail-in 2013; Portugal 2011',
        choicePrompt:'With the financial system eventually stabilized but public trust exhausted, what post-crisis political economy emerges?',
        choices:['gfc08-L3-populist','gfc08-L3-reform'] },
      'gfc08-L2-bad-bank':{ id:'gfc08-L2-bad-bank', layer:2, type:'decision', title:'Bad Bank -- Segregate Toxic Assets', label:'Bad Bank Model',
        narrative:'Nationalized banks are split: good assets transferred to a new clean bank that can resume lending immediately; toxic assets warehoused in a state-owned bad bank for gradual resolution. The clean bank can function immediately; the bad bank absorbs losses slowly over time.',
        lensSnapshot:{ bigCycle:{phase:'Surgical Reset',note:'Precision financial surgery separates viable from non-viable balance sheet components'}, steep:{primary:'E',secondary:'T',note:'Financial engineering to separate and manage toxic assets'}, geoEcon:{tool:'Fiscal Statecraft',note:'State engineering of financial system restructuring'}, gameTheory:{type:'Mechanism Design',note:'Asset segregation game: clean bank can operate; toxic assets isolated'} },
        secondOrderEffects:['Credit flows resume quickly as clean bank is functional','Bad bank asset resolution takes 5-10 years of gradual writedowns','Moral hazard concern addressed by shareholder wipeout in nationalization'],
        historicalAnalog:'Swedish Securum bad bank 1992; US TARP troubled asset purchases; Irish NAMA bad bank 2009',
        choicePrompt:'With the bad bank segregating toxic assets and credit flowing again, what institutional reform prevents the next crisis?',
        choices:['gfc08-L3-dodd-frank','gfc08-L4-fintech'] },
      'gfc08-L3-dodd-frank':{ id:'gfc08-L3-dodd-frank', layer:3, type:'decision', title:'Dodd-Frank Style Regulatory Overhaul', label:'Financial Regulation Reform',
        narrative:'Comprehensive financial regulation raises capital requirements, restricts proprietary trading, mandates stress tests, and creates resolution frameworks for systemic institutions. The shadow banking sector is brought partially into the regulatory perimeter.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Renovation',note:'Crisis catalyzes regulatory redesign'}, steep:{primary:'P',secondary:'E',note:'Regulatory state expands; financial sector lobbying intense'}, geoEcon:{tool:'Fiscal Statecraft',note:'Regulatory architecture as systemic risk management'}, gameTheory:{type:'New Rules Game',note:'Changing regulatory rules changes financial equilibrium'} },
        secondOrderEffects:['Bank profitability falls; some credit intermediation shifts to unregulated shadow sector','Systemic risk metrics improve; another 2008-style event becomes less likely','Compliance costs disadvantage smaller institutions; consolidation accelerates'],
        historicalAnalog:'Dodd-Frank Act 2010; Basel III capital standards; Volcker Rule',
        choicePrompt:'With new regulations in place, how does the financial system adapt?',
        choices:['gfc08-L4-shadow-migration','gfc08-L4-fintech'] },
      'gfc08-L3-populist':{ id:'gfc08-L3-populist', layer:3, type:'decision', title:'Populist Political Backlash', label:'Populist Backlash',
        narrative:'Years of austerity, rising inequality, and perceived bailouts for banks while workers suffered produce a political earthquake. Populist movements of both left and right capture governments across the Western world. The technocratic consensus that managed the crisis loses democratic legitimacy.',
        lensSnapshot:{ bigCycle:{phase:'Internal Conflict Rising',note:'Big Cycle: internal wealth gap generates political conflict'}, steep:{primary:'P',secondary:'S',note:'Democratic systems challenged; populist capture of institutions'}, geoEcon:{tool:'Fiscal Statecraft',note:'Fiscal orthodoxy challenged by redistributive politics'}, gameTheory:{type:'Regime Change',note:'Electoral game produces different equilibrium; policy changes fundamentally'} },
        secondOrderEffects:['International cooperation deteriorates as nationalist governments prioritize domestic audiences','Multilateral institutions (IMF, WTO, EU) face legitimacy crises','Trade openness reversals begin; protectionist pressures rise'],
        historicalAnalog:'2016 Brexit vote; Trump election; Syriza in Greece; Five Star in Italy',
        choicePrompt:'With populist governments in power, how is economic policy restructured?',
        choices:['gfc08-L4-industrial','gfc08-L4-protection'] },
      'gfc08-L3-reform':{ id:'gfc08-L3-reform', layer:3, type:'decision', title:'Structural Reform -- Technocratic Recovery', label:'Structural Reform',
        narrative:'Technocratic governments implement deep structural reforms: labor market flexibility, pension reform, reduced state ownership, and investment in education and infrastructure. The reforms are politically painful but create a more productive and resilient economic base.',
        lensSnapshot:{ bigCycle:{phase:'Structural Renovation',note:'Crisis creates political space for reforms that would be blocked in normal times'}, steep:{primary:'E',secondary:'T',note:'Productivity investment as long-term recovery strategy'}, geoEcon:{tool:'Fiscal Statecraft',note:'Structural reform as credibility signal and long-term investment'}, gameTheory:{type:'Long Game',note:'Accept short-term pain for long-term structural improvement'} },
        secondOrderEffects:['Productivity growth improves within 5-7 years','Social safety net reduced; inequality may worsen short-term','Foreign investment returns as competitiveness improves'],
        historicalAnalog:'Ireland structural reform 2011-2016; Baltic states rapid adjustment 2008-2010; Spain labor reform',
        choicePrompt:'With structural reforms underway, what financial architecture prevents the next cycle?',
        choices:['gfc08-L4-fintech','gfc08-L4-industrial'] },
      'gfc08-L4-shadow-migration':{ id:'gfc08-L4-shadow-migration', layer:4, type:'terminal', title:'Shadow Banking Migration', label:'Shadow Bank Growth',
        narrative:'Post-Dodd-Frank regulations push credit intermediation into unregulated shadow banking: private equity, hedge funds, and money market alternatives. The regulated system is safer but smaller. The unregulated system grows rapidly. The systemic risk has been managed in one location only to re-emerge in another.',
        outcome:'REGULATORY ARBITRAGE -- RISK MIGRATION',
        outcomeNarrative:'The post-crisis regulatory architecture successfully reduces risk in the regulated banking sector but inadvertently accelerates the growth of the shadow banking sector it was designed to curtail. The systemic risk accumulates in a new, less visible location -- private equity leverage, money market fragility, repo market dependencies.',
        finalLensScores:{ bigCycle:'Recovery -- New Fragility Building', steep:{S:0.3,T:0.7,E:0.8,En:0.2,P:0.6}, geoEcon:'Regulatory Architecture -- unintended migration of risk', gameTheory:'Whack-a-Mole -- regulatory intervention displaces rather than eliminates risk' },
        historicalAnalog:'Post-Dodd-Frank private equity growth; CLO market expansion 2012-2019; repo market fragility exposed 2019',
        aiPromptSeed:'Model how accumulated shadow banking fragility manifests in the next crisis, whether triggered by COVID liquidity stress, private equity leverage, or repo market dysfunction -- tracing the transmission from shadow banking concentration to systemic risk.' },
      'gfc08-L4-fintech':{ id:'gfc08-L4-fintech', layer:4, type:'terminal', title:'Fintech Disruption of Banking', label:'Fintech Disruption',
        narrative:'Post-crisis bank consolidation and regulatory compliance burden create gaps that technology companies fill. Digital payment platforms, peer-to-peer lending, and eventually crypto assets emerge as genuine alternatives to bank intermediation.',
        outcome:'TECHNOLOGICAL DISRUPTION OF FINANCIAL ARCHITECTURE',
        outcomeNarrative:'The financial system emerges from the crisis transformed not by regulation but by technology. New entrants unbundle banking services, increase competition, and reduce costs for consumers. But they also create new systemic risks around platform concentration, data monopolies, and regulatory gaps.',
        finalLensScores:{ bigCycle:'Recovery -- New Technological Cycle', steep:{S:0.6,T:1.0,E:0.7,En:0.2,P:0.5}, geoEcon:'Technological Statecraft -- fintech regulation as new geopolitical frontier', gameTheory:'Platform Competition -- winner-take-most dynamics in digital finance' },
        historicalAnalog:'Square, Stripe, PayPal post-2008 growth; Alipay/WeChat Pay in China; crypto emergence 2009+',
        aiPromptSeed:'Model how the rise of digital financial platforms, CBDCs, and crypto assets reshapes the global financial architecture through the 2020s, particularly how these technologies interact with the dollar reserve currency system and financial regulation.' },
      'gfc08-L4-industrial':{ id:'gfc08-L4-industrial', layer:4, type:'terminal', title:'Return of Industrial Policy', label:'Industrial Policy Renaissance',
        narrative:'Populist governments deploy active industrial policy: subsidies for domestic manufacturing, strategic sector protections. The Washington Consensus era of pure market governance ends. The state becomes an active economic actor again.',
        outcome:'NEOLIBERAL CONSENSUS ENDS -- INDUSTRIAL POLICY RENAISSANCE',
        outcomeNarrative:'The crisis permanently ends the Washington Consensus. State-directed industrial policy becomes mainstream across the political spectrum. The infrastructure of globalization -- free trade agreements, capital mobility, regulatory harmonization -- is progressively dismantled and replaced with managed trade, strategic subsidies, and supply chain reshoring.',
        finalLensScores:{ bigCycle:'Transition -- New Institutional Cycle', steep:{S:0.7,T:0.6,E:0.8,En:0.5,P:1.0}, geoEcon:'Tariffs + Export Controls -- industrial policy as statecraft', gameTheory:'New Equilibrium -- game rules changed by democratic mandate' },
        historicalAnalog:'US CHIPS Act 2022; IRA 2022; EU Green Deal industrial strategy; China dual circulation policy',
        aiPromptSeed:'Model how the return of state-directed industrial policy intersects with US-China decoupling, the green energy transition, and the reorientation of global supply chains through 2030.' },
      'gfc08-L4-protection':{ id:'gfc08-L4-protection', layer:4, type:'terminal', title:'Trade Protection and Deglobalization', label:'Trade Protection',
        narrative:'Populist governments implement trade barriers: tariffs on imports, export restrictions, buy-domestic procurement rules. Globalization reverses slowly but persistently. Supply chains shorten; trade volumes stagnate.',
        outcome:'DEGLOBALIZATION -- MANAGED TRADE ARCHITECTURE',
        outcomeNarrative:'The post-crisis populist turn produces a sustained deglobalization: global trade as a share of GDP peaks and declines. The benefits of globalization -- lower consumer prices, wider product variety -- erode slowly. But the vulnerabilities of hyperglobalization -- single-source supply chains, financial contagion -- also reduce. The world is less efficient and more resilient.',
        finalLensScores:{ bigCycle:'Transition -- Deglobalization Cycle', steep:{S:0.7,T:0.5,E:0.8,En:0.4,P:1.0}, geoEcon:'Tariffs -- managed trade and deglobalization', gameTheory:'Repeated Defection -- all nations erect barriers; all lose trade gains' },
        historicalAnalog:'1930s trade collapse; US tariffs 2018-2020; Brexit trade friction; COVID supply chain reshoring',
        aiPromptSeed:'Model how the deglobalization dynamic initiated by post-GFC populism accelerates through the COVID supply chain crisis and US-China trade war, tracing the long-run productivity and welfare implications of sustained trade fragmentation.' }
    }
  },

  // ── CLUSTER B: SYSTEMIC RISK ─────────────────────────────────────────────

  { id:'black-swan', cluster:'systemic', title:'Black Swan Events', era:'Variable', timeHorizon:'near-term', primaryLens:'steep',
    description:'Unforeseen, highly disruptive events -- modeled on 9/11 and COVID-19 -- that permanently alter global security, economic postures, and supply chain architecture through shocks no model predicted.',
    tags:['black swan','tail risk','supply chain','resilience','pandemic','terrorism'],
    aiPromptContext:'You are simulating a Black Swan event scenario. Apply STEEP lens (all dimensions disrupted simultaneously), Big Cycle (shock to existing order; potential phase transition trigger), and game theory (coordination problems in crisis response; free rider problems in global public goods provision).',
    rootNodeId:'bsw-L0-trigger',
    nodes:{
      'bsw-L0-trigger':{ id:'bsw-L0-trigger', layer:0, type:'trigger', title:'Catastrophic Unforeseeable Event', label:'Black Swan',
        narrative:'A high-impact, low-probability event materializes -- the type that models said could not happen. In hours, the event cascades globally: supply chains halt, financial markets seize, governments invoke emergency powers. The shock is not just economic but civilizational -- it forces a reconsideration of assumptions baked into every risk model. The cumulative GDP loss in the first year exceeds several percentage points globally.',
        lensSnapshot:{ bigCycle:{phase:'Shock -- Phase Undefined',note:'Black Swan events can accelerate or disrupt any Big Cycle phase'}, steep:{primary:'Cross-domain',secondary:'All',note:'All STEEP dimensions disrupted simultaneously'}, geoEcon:{tool:'Alliance Architecture',note:'Crisis tests which alliances hold and which fracture'}, gameTheory:{type:'Non-cooperative Emergency',note:'Every actor prioritizes self-protection; coordination fails initially'} },
        choicePrompt:'How does the nation restructure its global supply chain architecture in response?',
        choices:['bsw-L1-friendshore','bsw-L1-status-quo','bsw-L1-nearshore'] },
      'bsw-L1-friendshore':{ id:'bsw-L1-friendshore', layer:1, type:'decision', title:'Friendshoring -- Relocate to Allied Nations', label:'Friendshore Supply Chains',
        narrative:'Production is diversified away from geopolitically exposed regions to allied nations. The architecture is more resilient but significantly more expensive. The shift takes years and billions in capital expenditure -- but the next Black Swan will not find the same vulnerability.',
        lensSnapshot:{ bigCycle:{phase:'Managed Transition',note:'Supply chain reconfiguration as deliberate phase-transition management'}, steep:{primary:'E',secondary:'T',note:'Capital expenditure for resilience; automation required to offset cost increase'}, geoEcon:{tool:'Alliance Architecture',note:'Trade architecture explicitly organized around political alignment'}, gameTheory:{type:'Insurance Purchase',note:'Pay premium now to avoid catastrophic loss later'} },
        secondOrderEffects:['Labor costs rise 15-35% as production moves from low-cost regions','Geopolitically non-aligned nations lose investment inflows','Technology investment in automation surges to offset higher labor costs'],
        historicalAnalog:'Post-COVID reshoring movement 2021-2024; CHIPS Act domestic semiconductor investment',
        choicePrompt:'With friendshoring increasing costs, how does the organization offset higher operational expenses?',
        choices:['bsw-L2-automate','bsw-L2-subsidies'] },
      'bsw-L1-status-quo':{ id:'bsw-L1-status-quo', layer:1, type:'decision', title:'Maintain Concentrated Supply Architecture', label:'Maintain Status Quo',
        narrative:'Firms absorb the crisis cost rather than restructure, betting that Black Swan events remain rare. As conditions normalize, the status quo is restored. The next disruption will find the same vulnerabilities.',
        lensSnapshot:{ bigCycle:{phase:'Fragility Preserved',note:'Crisis cost absorbed but structural fragility not addressed'}, steep:{primary:'E',secondary:'T',note:'Efficiency prioritized over resilience; technology investment deferred'}, geoEcon:{tool:'Export Controls',note:'Continues dependence on concentrated supplier regions'}, gameTheory:{type:"Gambler's Fallacy",note:'Assumes low-probability event will not recur; rational short-term, irrational long-term'} },
        secondOrderEffects:['Next disruption causes compounding damage on existing fragility','Competitor firms that restructured gain market share in subsequent crisis','Regulatory pressure for resilience investment builds'],
        historicalAnalog:'Post-9/11 return to just-in-time supply chains; pre-COVID concentration in Chinese manufacturing',
        choicePrompt:'When the next disruption occurs -- more severe than the first -- what emergency triage options remain?',
        choices:['bsw-L2-automate','bsw-L3-resilience-architecture'] },
      'bsw-L1-nearshore':{ id:'bsw-L1-nearshore', layer:1, type:'decision', title:'Nearshoring -- Regional Supply Concentration', label:'Nearshore Regionally',
        narrative:'Rather than friendshoring globally, production is relocated to geographically proximate nations: North American supply chains reorganize around Mexico and Canada; European chains tighten around Eastern Europe and North Africa. Logistics costs fall; political alignment is secondary. The architecture reduces distance-based disruption but not geopolitical risk.',
        lensSnapshot:{ bigCycle:{phase:'Regional Consolidation',note:'Supply chain regionalization as resilience strategy'}, steep:{primary:'E',secondary:'P',note:'Economic efficiency gains; political risk partially reduced'}, geoEcon:{tool:'Alliance Architecture',note:'Regional trade integration as supply chain resilience mechanism'}, gameTheory:{type:'Regional Coordination',note:'Within-region cooperation reduces logistics vulnerability'} },
        secondOrderEffects:['Mexico, Poland, Morocco, Vietnam become major beneficiaries of nearshoring flows','Intra-regional trade increases; inter-regional trade declines','Regional supply chains still vulnerable to regional black swan events'],
        historicalAnalog:'Mexico manufacturing boom post-COVID; Polish manufacturing growth; North African electronics assembly',
        choicePrompt:'With regional supply chains established, how is political alignment risk managed within the regional architecture?',
        choices:['bsw-L2-subsidies','bsw-L3-resilience-architecture'] },
      'bsw-L2-automate':{ id:'bsw-L2-automate', layer:2, type:'decision', title:'Automation Investment to Offset Cost Increases', label:'Automation Push',
        narrative:'Technology investment compensates for higher labor costs in friendshored supply chains: robotics, AI-driven logistics, and automated quality control reduce the labor cost premium of friendshoring. The investment is front-loaded and expensive but creates permanent productivity gains.',
        lensSnapshot:{ bigCycle:{phase:'Productive Technology -- Phase Transition',note:'Automation as response to supply chain cost pressure; productivity cycle accelerates'}, steep:{primary:'T',secondary:'E',note:'Technology investment drives productivity; labor displacement effects'}, geoEcon:{tool:'Technological Statecraft',note:'Automation as substitute for low-cost labor geography'}, gameTheory:{type:'Technology Race',note:'First movers in automation capture cost advantage; followers lose competitive position'} },
        secondOrderEffects:['Manufacturing employment in friendshored locations does not recover to pre-automation levels','Automation investment accelerates AI adoption across entire industrial base','Nations with strong automation industries (Germany, Japan, Korea) benefit from export demand'],
        historicalAnalog:'Post-2018 tariff-driven automation investment; COVID automation acceleration 2020-2022',
        choicePrompt:'With automation embedded and supply chains reshored, what governance architecture manages the new resilience-efficiency tradeoff?',
        choices:['bsw-L3-resilience-architecture','bsw-L4-nato-cyber-command'] },
      'bsw-L2-subsidies':{ id:'bsw-L2-subsidies', layer:2, type:'decision', title:'Government Subsidies for Strategic Resilience', label:'Strategic Subsidies',
        narrative:'Governments provide direct subsidies for domestic production of critical goods: semiconductors, pharmaceuticals, medical equipment, and energy equipment receive investment support that makes domestic production economically viable despite higher labor costs. Strategic resilience is treated as a public good.',
        lensSnapshot:{ bigCycle:{phase:'State-Led Investment',note:'Industrial policy deployed to subsidize strategic resilience'}, steep:{primary:'P',secondary:'E',note:'Political decision to treat resilience as national security priority'}, geoEcon:{tool:'Fiscal Statecraft',note:'Subsidies as industrial policy for strategic sectors'}, gameTheory:{type:'Public Goods Provision',note:'State provides resilience that market undersupplies'} },
        secondOrderEffects:['Subsidy programs risk capture by incumbent industries; efficiency concerns','Allied nations demand equivalent access to subsidized supply chains','WTO rules on subsidies increasingly challenged and circumvented'],
        historicalAnalog:'US CHIPS Act semiconductor subsidies; EU Battery Alliance; pharmaceutical domestic production subsidies post-COVID',
        choicePrompt:'With strategic subsidies funding resilience, how is the supply chain architecture further hardened?',
        choices:['bsw-L3-resilience-architecture','bsw-L4-strategic-stockpile'] },
      'bsw-L3-resilience-architecture':{ id:'bsw-L3-resilience-architecture', layer:3, type:'decision', title:'Comprehensive Resilience Architecture', label:'Resilience Architecture',
        narrative:'A comprehensive resilience framework is institutionalized: mandatory strategic stockpiles for critical goods, supplier diversification requirements, supply chain mapping and monitoring, and international emergency sharing agreements. The architecture is expensive but transforms the vulnerability profile permanently.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation',note:'Black Swan forces creation of new resilience institutions'}, steep:{primary:'P',secondary:'E',note:'Political mandate creates economic resilience architecture'}, geoEcon:{tool:'Alliance Architecture',note:'Emergency sharing agreements as allied security commitment'}, gameTheory:{type:'Mechanism Design',note:'Rules and incentives aligned to produce resilience as outcome'} },
        secondOrderEffects:['Supply chain monitoring becomes a national security function','Allied nations coordinate stockpile strategies to avoid duplication','Critical good prices structurally higher due to resilience costs'],
        historicalAnalog:'US Strategic National Stockpile reforms post-COVID; EU Critical Raw Materials Act; pharmaceutical strategic reserve programs',
        choicePrompt:'With resilience architecture in place, how is it stress-tested against the next disruption scenario?',
        choices:['bsw-L4-nato-cyber-command','bsw-L4-strategic-stockpile'] },
      'bsw-L4-nato-cyber-command':{ id:'bsw-L4-nato-cyber-command', layer:4, type:'terminal', title:'Allied Supply Chain Security Agreements', label:'Allied Supply Security',
        narrative:'Formal international agreements establish allied supply chain security: emergency sharing protocols, joint stockpiling, coordinated production agreements, and mutual access to critical materials. The architecture is the supply chain equivalent of NATO collective defense.',
        outcome:'ALLIED SUPPLY CHAIN SECURITY ARCHITECTURE',
        outcomeNarrative:'The Black Swan event catalyzes the most significant supply chain diplomacy in the post-war period. Allied nations establish formal commitments to emergency supply sharing, joint stockpiling of critical goods, and coordinated production capacity. The architecture does not prevent all disruptions but ensures that no allied nation faces a catastrophic supply failure alone.',
        finalLensScores:{ bigCycle:'Institutional Innovation -- Alliance Deepening', steep:{S:0.5,T:0.7,E:0.8,En:0.5,P:0.9}, geoEcon:'Alliance Architecture -- supply chain security as collective defense', gameTheory:'Cooperative Game -- collective resilience exceeds individual resilience' },
        historicalAnalog:'US-EU Trade and Technology Council; Quad Critical and Emerging Technology Working Group; NATO food security commitments',
        aiPromptSeed:'Model how allied supply chain security agreements perform when tested by a major geopolitical conflict that simultaneously disrupts multiple supply chains, tracing whether the coordination architecture holds under extreme stress.' },
      'bsw-L4-strategic-stockpile':{ id:'bsw-L4-strategic-stockpile', layer:4, type:'terminal', title:'Strategic Stockpile Architecture', label:'Strategic Stockpiles',
        narrative:'Comprehensive strategic stockpiles are established for all critical goods: 6-12 months of supply for semiconductors, pharmaceuticals, medical equipment, rare earths, and food staples. The stockpile program is expensive but buys time in any future disruption.',
        outcome:'STRATEGIC STOCKPILE RESILIENCE ARCHITECTURE',
        outcomeNarrative:'The stockpile architecture successfully provides buffer time in the next disruption -- supply chains do not collapse immediately, allowing for emergency reconfiguration. But the storage costs, rotation requirements, and governance challenges of managing large strategic stockpiles create permanent overhead. The resilience is real but expensive.',
        finalLensScores:{ bigCycle:'Institutional Innovation -- Resilience Investment', steep:{S:0.4,T:0.6,E:0.7,En:0.5,P:0.8}, geoEcon:'Resource Nationalism -- strategic stockpile as national security asset', gameTheory:'Insurance Game -- pay premium continuously to avoid catastrophic loss' },
        historicalAnalog:'US Strategic Petroleum Reserve; Strategic National Stockpile; China strategic reserves in food and metals',
        aiPromptSeed:'Model how strategic stockpile architectures created in response to supply chain Black Swan events interact with climate change-driven resource scarcity, tracing whether stockpile strategies can adapt to a world where supply disruptions become more frequent.' }
    }
  },

  { id:'gray-rhino', cluster:'systemic', title:'The Gray Rhino Polycrisis', era:'2025-2035', timeHorizon:'medium', primaryLens:'steep',
    description:'Multiple foreseeable but ignored risks converge simultaneously -- sovereign debt overhangs, climate shocks, demographic collapse, and supply chain fragility -- overwhelming institutions designed for single-crisis management.',
    tags:['polycrisis','gray rhino','systemic risk','climate','debt','demographics','cascading failure'],
    aiPromptContext:'You are simulating a Gray Rhino Polycrisis. Apply STEEP analysis across all five dimensions simultaneously, Big Cycle (late-cycle institutional stress testing), and game theory (multi-party coordination failure; tragedy of the commons across overlapping crisis domains). The distinguishing feature: these were all foreseeable -- the question is why they were not addressed and what happens when they arrive together.',
    rootNodeId:'grp-L0-trigger',
    nodes:{
      'grp-L0-trigger':{ id:'grp-L0-trigger', layer:0, type:'trigger', title:'Simultaneous Convergence of Four Foreseeable Crises', label:'Polycrisis Trigger',
        narrative:'2027: Four independently foreseeable risk vectors -- long-visible, consistently ignored -- arrive simultaneously. A Category 5 hurricane destroys a major port city one month after a sovereign debt crisis erupts in three emerging market nations, which coincides with a food supply shock from the third consecutive year of below-average grain harvests. All three events land on a global demographic backdrop where working-age populations of major economies are contracting at the fastest rate in recorded peacetime history. None of these were Black Swans. They were Gray Rhinos: obvious, enormous, and consistently ignored.',
        lensSnapshot:{ bigCycle:{phase:'Overextension-Terminal',note:'Multiple Big Cycle stress indicators breaching simultaneously; institutions cannot triage'}, steep:{primary:'Cross-domain',secondary:'All',note:'All five STEEP dimensions in simultaneous stress'}, geoEcon:{tool:'Fiscal Statecraft',note:'Every fiscal tool deployed simultaneously; competition for resources across crisis domains'}, gameTheory:{type:'Multi-Domain Coordination Failure',note:'Each crisis domain requires coordinated response; coordination capacity itself is the scarce resource'} },
        choicePrompt:'Institutions face a triage decision: which crisis domain gets priority when all demand response simultaneously?',
        choices:['grp-L1-debt-first','grp-L1-climate-first','grp-L1-food-first','grp-L1-comprehensive'] },
      'grp-L1-debt-first':{ id:'grp-L1-debt-first', layer:1, type:'decision', title:'Prioritize Sovereign Debt Crisis -- Financial System Triage', label:'Financial System First',
        narrative:'Governments and international institutions deploy primary attention toward preventing sovereign debt contagion from becoming a global financial crisis. IMF emergency facilities are activated; central banks coordinate swap lines; debt restructuring negotiations begin. But the climate shock and food crisis receive only residual attention -- their damage compounds.',
        lensSnapshot:{ bigCycle:{phase:'Debt Cycle Management',note:'Financial system prioritized; real economy and environment sacrifice accepted'}, steep:{primary:'E',secondary:'P',note:'Economic stability prioritized; political legitimacy of triage decision contested'}, geoEcon:{tool:'Fiscal Statecraft',note:'Emergency IMF facilities; coordinated central bank intervention'}, gameTheory:{type:'Triage Decision',note:'Zero-sum resource allocation across crisis domains; financial system wins'} },
        secondOrderEffects:['Sovereign debt contagion contained; financial system survives','Climate damage unmitigated; reconstruction costs compound annually','Food insecurity crisis deepens; political instability in affected regions surges'],
        historicalAnalog:'COVID prioritization over climate 2020-2022; financial crisis absorbing all policy attention 2008-2010',
        choicePrompt:'With debt contagion contained but climate and food crises deepening, how does the financial system fund the cascading real-world damage?',
        choices:['grp-L2-climate-bonds','grp-L2-imf-expansion'] },
      'grp-L1-climate-first':{ id:'grp-L1-climate-first', layer:1, type:'decision', title:'Prioritize Climate Adaptation -- Physical Infrastructure Triage', label:'Climate Adaptation First',
        narrative:'Emergency climate adaptation takes priority: sea walls, managed retreat, emergency agricultural reorientation, and infrastructure hardening. The debt crisis receives second-tier attention; markets interpret the triage as fiscal irresponsibility. Sovereign bond spreads widen dramatically. But the physical infrastructure response prevents worse damage that would have been far more costly.',
        lensSnapshot:{ bigCycle:{phase:'Environmental Reset',note:'Physical crisis prioritized over financial; unconventional triage by historical standards'}, steep:{primary:'En',secondary:'E',note:'Environmental crisis prioritized; economic stability accepts secondary damage'}, geoEcon:{tool:'Fiscal Statecraft',note:'Climate adaptation spending as core fiscal priority'}, gameTheory:{type:'Long-Term Optimization',note:'Short-term financial cost accepted to avoid worse long-term physical damage'} },
        secondOrderEffects:['Physical infrastructure adaptation reduces compound losses by 30-40%','Bond market punishes apparent fiscal irresponsibility; borrowing costs surge','Nations that did not prioritize climate adaptation face far worse medium-term outcomes'],
        historicalAnalog:'Netherlands Delta Works post-1953 floods; Japan seawall investment post-2011 tsunami',
        choicePrompt:'With climate adaptation underway but financial markets punishing the approach, how is the sovereign debt pressure managed?',
        choices:['grp-L2-debt-restructuring','grp-L2-climate-bonds'] },
      'grp-L1-food-first':{ id:'grp-L1-food-first', layer:1, type:'decision', title:'Prioritize Food Security -- Social Stability Triage', label:'Food Security First',
        narrative:'Food insecurity is identified as the most acute political risk. Emergency food reserves are mobilized; agricultural emergency financing is deployed; export bans are overridden through international agreements. The financial and climate crises receive deferred attention.',
        lensSnapshot:{ bigCycle:{phase:'Social Stability Priority',note:'Political legitimacy and social stability prioritized over financial optimization'}, steep:{primary:'S',secondary:'P',note:'Social stability as primary triage criterion; political imperative'}, geoEcon:{tool:'Resource Nationalism',note:'Food security as strategic asset; export controls overridden by crisis'}, gameTheory:{type:'Catastrophic Risk Avoidance',note:'Accepting certain losses to prevent potentially catastrophic social collapse'} },
        secondOrderEffects:['Social unrest contained in food-insecure regions','Debt crisis allowed to deepen; financial market panic begins','Agricultural emergency financing accelerates transition to more resilient crops'],
        historicalAnalog:'Soviet grain purchase emergency 1972; Arab Spring food price connection 2010-2011',
        choicePrompt:'With food security stabilized but financial crisis deepening, what political architecture manages the compound crisis?',
        choices:['grp-L2-emergency-governance','grp-L2-imf-expansion'] },
      'grp-L1-comprehensive':{ id:'grp-L1-comprehensive', layer:1, type:'decision', title:'Attempt Comprehensive Simultaneous Response', label:'Comprehensive Response',
        narrative:'Institutions attempt to respond to all four crisis vectors simultaneously -- deploying financial, climate, food, and demographic policy tools in parallel. Every crisis receives 25% of the attention it needs. None is resolved. The combination of partial responses produces outcomes worse than decisive triage would have.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Overload',note:'Institutional capacity is the binding constraint; simultaneous deployment produces collective failure'}, steep:{primary:'Cross-domain',secondary:'All',note:'Attempting to address all STEEP dimensions simultaneously; capacity insufficient'}, geoEcon:{tool:'Alliance Architecture',note:'International coordination attempted across all crisis domains'}, gameTheory:{type:'Coordination Failure at Scale',note:'Too many principals, too many agents, too little coordination capacity'} },
        secondOrderEffects:['All four crises deepen as insufficient attention is paid to each','Political leaders blamed for indecision rather than constraint','Crisis cascade accelerates; some domains reach points of no return'],
        historicalAnalog:'EU response to 2010-2012 multi-crisis period; insufficient across all domains simultaneously',
        choicePrompt:'As the comprehensive approach fails and all crises deepen, forced triage eventually becomes unavoidable. What crisis is sacrificed first?',
        choices:['grp-L2-sacrifice-climate','grp-L2-climate-bonds'] },
      'grp-L2-climate-bonds':{ id:'grp-L2-climate-bonds', layer:2, type:'decision', title:'Climate-Linked Sovereign Bond Architecture', label:'Climate Bonds',
        narrative:'A new financial instrument: sovereign bonds whose coupon adjusts based on climate adaptation performance metrics. Nations that meet adaptation targets pay lower interest rates; those that miss pay higher. The instrument simultaneously addresses the financial and climate crises, aligning market incentives with physical resilience investment.',
        lensSnapshot:{ bigCycle:{phase:'Financial Innovation',note:'New financial architecture attempts to align market incentives with climate resilience'}, steep:{primary:'E',secondary:'En',note:'Financial mechanism for environmental objective'}, geoEcon:{tool:'Fiscal Statecraft',note:'Novel bond architecture linking financial and climate systems'}, gameTheory:{type:'Mechanism Design',note:'Incentive-compatible instrument aligns financial and environmental objectives'} },
        secondOrderEffects:['Green bond market expands dramatically','Nations with poor adaptation performance face rising borrowing costs','Institutional investors gain standardized climate performance metrics'],
        historicalAnalog:'EBRD green bond framework; ESG bond market development',
        choicePrompt:'With climate-linked bonds issued, how does the nation address the demographic crisis -- the fourth compounding factor?',
        choices:['grp-L3-immigration','grp-L3-productivity'] },
      'grp-L2-debt-restructuring':{ id:'grp-L2-debt-restructuring', layer:2, type:'decision', title:'Orderly Sovereign Debt Restructuring Framework', label:'Debt Restructuring',
        narrative:'An emergency sovereign debt restructuring framework is negotiated among G20 creditors. Private sector creditors accept haircuts; official creditors extend maturities; conditionality is linked to climate adaptation rather than conventional austerity. The framework is contested but functional.',
        lensSnapshot:{ bigCycle:{phase:'Debt Cycle Reset',note:'Orderly restructuring clears debt overhang; avoids disorderly default'}, steep:{primary:'E',secondary:'P',note:'Economic restructuring with political negotiation across creditor groups'}, geoEcon:{tool:'Fiscal Statecraft',note:'Multilateral debt restructuring as international economic governance'}, gameTheory:{type:'Cooperative Game -- Creditor Coordination',note:'Creditor collective action problem overcome through framework negotiation'} },
        secondOrderEffects:['Debt-distressed nations regain fiscal space for climate and food investment','Private creditors take losses but avoid worse disorderly default scenario','Framework becomes template for future sovereign debt crises'],
        historicalAnalog:'HIPC Initiative; Brady Bonds; Paris Club; Common Framework',
        choicePrompt:'With debt restructured and fiscal space restored, how are the climate and food recovery programs funded?',
        choices:['grp-L3-green-fund','grp-L3-immigration'] },
      'grp-L2-imf-expansion':{ id:'grp-L2-imf-expansion', layer:2, type:'decision', title:'IMF Emergency Capacity Expansion', label:'IMF Expansion',
        narrative:'The IMF is given a massive quota increase and new emergency lending facilities: a Climate Resilience Facility, a Food Security Emergency Fund, and a Demographic Transition Support Program. The multilateral architecture expands to match the scope of the polycrisis.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Expansion',note:'Crisis drives expansion of multilateral financial capacity'}, steep:{primary:'E',secondary:'P',note:'Multilateral financing as primary crisis management tool'}, geoEcon:{tool:'Alliance Architecture',note:'IMF as expanded crisis management institution'}, gameTheory:{type:'Collective Action Solution',note:'Multilateral capacity expansion overcomes individual nation resource constraints'} },
        secondOrderEffects:['Emerging markets gain access to crisis financing without bilateral dependencies','IMF governance reform becomes urgent as quota shares rebalance toward emerging economies','Conditionality design evolves to address climate and food dimensions alongside macroeconomic stability'],
        historicalAnalog:'IMF COVID emergency facilities 2020; SDR allocation $650bn 2021; quota review processes',
        choicePrompt:'With IMF capacity expanded and financing deployed, what structural reform prevents the next polycrisis?',
        choices:['grp-L3-early-warning','grp-L4-resilient-multilateral'] },
      'grp-L2-emergency-governance':{ id:'grp-L2-emergency-governance', layer:2, type:'decision', title:'Emergency Governance Architecture', label:'Emergency Governance',
        narrative:'Existing international institutions are granted emergency consolidated authority through a new meta-governance structure. The coordination body can override individual nation vetoes in crisis domains where collective action has failed. The arrangement is constitutionally unprecedented but operationally effective.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation',note:'Crisis forces governance innovation beyond existing multilateral architecture'}, steep:{primary:'P',secondary:'E',note:'Political architecture innovation under crisis pressure'}, geoEcon:{tool:'Alliance Architecture',note:'Emergency multilateral authority as crisis management tool'}, gameTheory:{type:'Super-game Solution',note:'Creating a new game structure that can coordinate across existing game failures'} },
        secondOrderEffects:['Crisis response coordination improves dramatically','Sovereignty concerns create political resistance even in cooperating nations','Precedent for crisis governance challenges existing UN architecture'],
        historicalAnalog:'Troika in Eurozone crisis; wartime combined boards; COVID vaccine procurement bodies',
        choicePrompt:'With emergency governance providing coordination, what long-term institutional reform does the polycrisis catalyze?',
        choices:['grp-L3-early-warning','grp-L4-resilient-multilateral'] },
      'grp-L2-sacrifice-climate':{ id:'grp-L2-sacrifice-climate', layer:2, type:'decision', title:'Climate Crisis Sacrificed -- Deferred Indefinitely', label:'Sacrifice Climate',
        narrative:'In the comprehensive response failure, climate adaptation is the domain sacrificed: emissions reduction and adaptation investment are deferred while financial stability and food security absorb available resources. The short-term logic is compelling. The consequences are structural and irreversible: a decade of additional warming is locked in.',
        lensSnapshot:{ bigCycle:{phase:'Environmental Debt Accumulation',note:'Climate damage deferred becomes permanent; long-cycle environmental degradation locked in'}, steep:{primary:'En',secondary:'E',note:'Environmental sacrifice for short-term economic and social stability'}, geoEcon:{tool:'Resource Nationalism',note:'Short-term resource competition over long-term environmental commons'}, gameTheory:{type:'Tragedy of the Commons',note:'Short-term national rationality produces long-term global environmental catastrophe'} },
        secondOrderEffects:['Paris Agreement effectively abandoned in practice','Climate adaptation costs in the 2030s are 3-5x higher due to deferral','Insurance markets withdraw from climate-exposed assets globally'],
        historicalAnalog:'Kyoto Protocol non-compliance; COVID climate regression; historical pattern of crisis-driven emissions increases',
        choicePrompt:'With climate sacrificed and warming locked in, what survival architecture do nations build for the hotter, more volatile world?',
        choices:['grp-L3-managed-retreat','grp-L4-climate-migration-treaty'] },
      'grp-L3-immigration':{ id:'grp-L3-immigration', layer:3, type:'decision', title:'Managed Immigration as Demographic Policy', label:'Managed Immigration',
        narrative:'Nations with contracting working-age populations implement substantial managed immigration programs, targeting skills gaps, regional demographic needs, and integration pathways. The policy addresses the economic dimension of demographic decline while creating social and political pressures that require active integration architecture.',
        lensSnapshot:{ bigCycle:{phase:'Demographic Management',note:'Immigration as institutional response to demographic Big Cycle contraction'}, steep:{primary:'S',secondary:'E',note:'Social integration investment as economic productivity maintenance strategy'}, geoEcon:{tool:'Alliance Architecture',note:'Managed migration corridors as bilateral foreign policy tool'}, gameTheory:{type:'Cooperative Migration Game',note:'Sending and receiving nations negotiate migration terms; mutual benefit possible'} },
        secondOrderEffects:['Labor force supplemented; demographic decline partially offset','Social cohesion requires significant integration investment','Sending nations face brain drain; bilateral tensions around talent competition'],
        historicalAnalog:'German guest worker programs; Canadian points-based immigration; post-war European labor migration',
        choicePrompt:'With immigration supplementing demographics and bonds funding adaptation, how does the polycrisis resolution architecture prove its durability?',
        choices:['grp-L4-resilient-multilateral','grp-L4-early-warning'] },
      'grp-L3-productivity':{ id:'grp-L3-productivity', layer:3, type:'decision', title:'Productivity Investment to Offset Demographic Decline', label:'Productivity Investment',
        narrative:'Rather than immigration, the demographic challenge is addressed through massive productivity investment: automation, AI deployment in public services, and infrastructure modernization. The goal is to maintain economic output with a smaller working-age population through technology rather than population growth.',
        lensSnapshot:{ bigCycle:{phase:'Technological Adaptation',note:'Technology compensates for demographic contraction'}, steep:{primary:'T',secondary:'E',note:'Technology investment as demographic policy tool'}, geoEcon:{tool:'Technological Statecraft',note:'AI and automation as national demographic strategy'}, gameTheory:{type:'Technology Substitution Game',note:'Replace labor with capital and technology'} },
        secondOrderEffects:['AI and automation investment accelerates across all sectors','Political resistance from displaced workers; need for retraining investment','Productivity gains partially offset demographic headwinds but do not fully compensate'],
        historicalAnalog:'Japan automation investment response to demographic aging; South Korea productivity push; EU digital decade investment',
        choicePrompt:'With productivity investment partially offsetting demographic decline, what institutional architecture sustains the polycrisis resolution?',
        choices:['grp-L4-resilient-multilateral','grp-L4-early-warning'] },
      'grp-L3-green-fund':{ id:'grp-L3-green-fund', layer:3, type:'decision', title:'Global Green Recovery Fund', label:'Green Recovery Fund',
        narrative:'Post-debt restructuring, a global green recovery fund is capitalized by developed nations and multilateral development banks. The fund finances climate adaptation, food system transformation, and demographic transition support simultaneously. It is the largest single international financial commitment since the Marshall Plan.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Investment',note:'Massive multilateral investment as polycrisis recovery architecture'}, steep:{primary:'E',secondary:'En',note:'Financial architecture addresses environmental, economic, and social recovery simultaneously'}, geoEcon:{tool:'Alliance Architecture',note:'Multilateral development finance as polycrisis recovery mechanism'}, gameTheory:{type:'Public Goods Provision',note:'Collective investment in global public goods: stability, climate, food'} },
        secondOrderEffects:['Multilateral development bank capacity expands dramatically','Grant funding reduces debt burden in most fragile states','Fund governance disputes emerge between contributor and recipient nations'],
        historicalAnalog:'Marshall Plan; COVAX failure and lessons; Global Fund for AIDS as partial model',
        choicePrompt:'With the green recovery fund operational, what institutional innovation prevents the next polycrisis?',
        choices:['grp-L4-resilient-multilateral','grp-L4-early-warning'] },
      'grp-L3-early-warning':{ id:'grp-L3-early-warning', layer:3, type:'decision', title:'Global Polycrisis Early Warning System', label:'Early Warning System',
        narrative:'A global early warning system tracks compound risk indicators across all five STEEP dimensions, with mandatory reporting and automatic escalation to international response bodies when convergence risk exceeds thresholds. The system addresses the core failure mode: foreseeable risks were visible but ignored.',
        lensSnapshot:{ bigCycle:{phase:'Preventive Architecture',note:'Shifting from crisis response to crisis prevention'}, steep:{primary:'P',secondary:'T',note:'Political mandate for early warning; technology enables monitoring'}, geoEcon:{tool:'Alliance Architecture',note:'Multilateral monitoring as preventive governance'}, gameTheory:{type:'Commitment Device',note:'Pre-commitment to response before crisis pressure distorts decisions'} },
        secondOrderEffects:['Political economy of prevention: mobilizing resources for risks not yet materialized is difficult','Nations with poor risk indicators resist monitoring regime','System successfully identifies next compound risk 3-5 years before it materializes'],
        historicalAnalog:'FEMA post-Katrina redesign; WHO IHR post-SARS; nuclear early warning systems',
        choicePrompt:'With the early warning system detecting emerging compound risks, how is the governance architecture designed to act preventively?',
        choices:['grp-L4-resilient-multilateral','grp-L4-early-warning'] },
      'grp-L3-managed-retreat':{ id:'grp-L3-managed-retreat', layer:3, type:'decision', title:'Managed Retreat from Climate-Exposed Zones', label:'Managed Retreat',
        narrative:'With climate damage locked in from deferral, the strategic response is managed retreat: systematic relocation of populations and infrastructure from the most exposed coastal and low-lying zones. The process is enormously costly but prevents the catastrophic loss of life that unmanaged exposure would produce.',
        lensSnapshot:{ bigCycle:{phase:'Territorial Reorganization',note:'Physical settlement patterns restructured by irreversible environmental change'}, steep:{primary:'En',secondary:'S',note:'Environmental forcing reorganizes social geography'}, geoEcon:{tool:'Fiscal Statecraft',note:'Public investment in managed population relocation'}, gameTheory:{type:'Forced Adaptation Game',note:'Managed cost accepted to avoid catastrophic unmanaged cost'} },
        secondOrderEffects:['3-5% of global population requires relocation over 20 years','Real estate markets in exposed zones collapse entirely','New inland cities must be built; massive construction investment opportunity'],
        historicalAnalog:'Isle de Jean Charles managed retreat; Netherlands managed coastal retreat; Pacific island relocation planning',
        choicePrompt:'With managed retreat underway and populations relocating at scale, what governance architecture manages climate migration?',
        choices:['grp-L4-climate-migration-treaty','grp-L4-resilient-multilateral'] },
      'grp-L4-resilient-multilateral':{ id:'grp-L4-resilient-multilateral', layer:4, type:'terminal', title:'Resilient Multilateral Architecture', label:'Resilient Multilateralism',
        narrative:'The polycrisis, despite its severity, catalyzes the most significant reform of international institutions since 1945. The UN Security Council is reformed; IMF quotas are rebalanced; a new climate-finance architecture is established; a global food security reserve system is created. The new architecture is explicitly designed for compound crises.',
        outcome:'INSTITUTIONAL REFORM THROUGH CRISIS',
        outcomeNarrative:"History's lesson: the most durable institutions are built in the aftermath of catastrophic failures. The Gray Rhino Polycrisis, precisely because it was preventable, generates the political will to build institutions strong enough to address the next foreseeable risks before they converge. The reform is incomplete and contested -- but it represents the most significant advance in international governance since Bretton Woods.",
        finalLensScores:{ bigCycle:'Reset -- New Institutional Cycle', steep:{S:0.7,T:0.5,E:0.8,En:0.7,P:0.9}, geoEcon:'Alliance Architecture -- redesigned multilateral system', gameTheory:'Cooperative Game -- crisis generates political will for institutional innovation' },
        historicalAnalog:'Post-WWII Bretton Woods; post-1930s Depression financial architecture; League of Nations failure -- UN',
        aiPromptSeed:'Model how the reformed institutional architecture performs when tested by the next compound risk event -- AI governance failures, quantum technology disruption, and the arrival of AGI-level capabilities in the 2030s.' },
      'grp-L4-early-warning':{ id:'grp-L4-early-warning', layer:4, type:'terminal', title:'Global Polycrisis Early Warning System -- Operational', label:'Early Warning Operational',
        narrative:'The early warning system is institutionalized and begins detecting the next generation of compound risks years before they materialize, enabling preventive action rather than crisis response.',
        outcome:'PREVENTIVE GOVERNANCE ARCHITECTURE',
        outcomeNarrative:'The early warning system represents a fundamental shift in international governance: from crisis response to crisis prevention. By tracking compound risk convergence and triggering coordinated response before crises materialize, the system addresses the core failure mode of the Gray Rhino Polycrisis. The architecture works -- the next compound risk is identified and partially addressed before it cascades.',
        finalLensScores:{ bigCycle:'Institutional Prevention Architecture', steep:{S:0.5,T:0.8,E:0.6,En:0.7,P:0.8}, geoEcon:'Alliance Architecture -- preventive multilateral monitoring', gameTheory:'Commitment Device -- pre-commitment to response before crisis pressure distorts decisions' },
        historicalAnalog:'FEMA post-Katrina redesign; WHO IHR post-SARS; nuclear early warning systems',
        aiPromptSeed:'Model how a global polycrisis early warning system interacts with the political economy of prevention -- specifically the challenge of mobilizing resources for risks that have not yet materialized, and how governance architecture overcomes this structural bias toward inaction.' },
      'grp-L4-climate-migration-treaty':{ id:'grp-L4-climate-migration-treaty', layer:4, type:'terminal', title:'Climate Migration Treaty', label:'Climate Migration Treaty',
        narrative:'The scale of climate-forced displacement necessitates a new international legal framework: the Climate Migration Treaty, establishing legal status for climate refugees, burden-sharing mechanisms among host nations, and financial compensation from high-emitting nations to receiving nations.',
        outcome:'NEW INTERNATIONAL MIGRATION LAW ARCHITECTURE',
        outcomeNarrative:'The Climate Migration Treaty fills a catastrophic gap in international law. It provides legal status and protection for populations displaced by climate change. The treaty is contested, imperfect, and unevenly ratified, but it establishes a framework that reduces the worst outcomes for the most exposed populations.',
        finalLensScores:{ bigCycle:'Late Cycle -- New Legal Architecture', steep:{S:0.9,T:0.3,E:0.6,En:1.0,P:0.8}, geoEcon:'Alliance Architecture -- burden-sharing treaty', gameTheory:'Cooperative Game -- collective obligation accepted for climate displacement' },
        historicalAnalog:'1951 Refugee Convention; 1967 Protocol; Nansen Passport; Pacific climate migration agreements',
        aiPromptSeed:'Model how the Climate Migration Treaty performs as climate impacts intensify through 2040, particularly as island nations become uninhabitable and major river deltas face permanent flooding.' }
    }
  },

  { id:'imf-energy-shock-2026', cluster:'systemic', title:'IMF 2026 Energy Shock Matrix', era:'2026-2028', timeHorizon:'near-term', primaryLens:'geoEcon',
    description:'Regional conflict disrupts major energy logistics nodes, pushing global growth to 2.0% in severe scenarios, straining energy-importing currencies, and forcing divergent central bank responses.',
    tags:['energy shock','oil price','regional conflict','stagflation','central bank','emerging markets'],
    aiPromptContext:'You are simulating the IMF 2026 Energy Shock Matrix. Apply Big Cycle (late cycle monetary stress; sovereign debt fragility in emerging markets), STEEP (E and P dominant; En secondary via energy transition acceleration), and game theory (coordination problems between energy importers; OPEC+ supply decisions as strategic games).',
    rootNodeId:'ies26-L0-trigger',
    nodes:{
      'ies26-L0-trigger':{ id:'ies26-L0-trigger', layer:0, type:'trigger', title:'Regional Conflict Disrupts Strait of Hormuz', label:'Hormuz Disruption',
        narrative:'A major regional conflict in the Middle East disrupts the Strait of Hormuz -- the chokepoint through which 20% of global oil and 25% of global LNG transits. Insurance premiums spike; tanker traffic declines; spot oil prices surge. The shock lands on a global economy already carrying elevated sovereign debt from post-COVID fiscal expansion and central banks that have only recently returned to positive real rates.',
        lensSnapshot:{ bigCycle:{phase:'Late Cycle Fragility',note:'Shock arrives when fiscal buffers are thin and monetary ammunition is limited'}, steep:{primary:'P',secondary:'E',note:'Geopolitical trigger; economic transmission'}, geoEcon:{tool:'Resource Nationalism',note:'Energy chokepoint control as ultimate geopolitical weapon'}, gameTheory:{type:'Disruption Game',note:'Conflict actors weaponize energy transit; importers face coordination problems'} },
        choicePrompt:'What is the trajectory of the regional conflict and its energy market impact?',
        choices:['ies26-L1-contained','ies26-L1-severe','ies26-L1-escalating'] },
      'ies26-L1-contained':{ id:'ies26-L1-contained', layer:1, type:'decision', title:'Contained Scenario -- Conflict Resolves; Oil at $80', label:'Contained Conflict',
        narrative:'Diplomatic intervention -- US-brokered ceasefire, Iranian back-channel negotiations, Saudi mediation -- contains the conflict within weeks. Energy markets normalize around $80/barrel. The disruption is sharp but brief. Global growth moderates to a stable 3.1%. Central banks maintain existing trajectories.',
        lensSnapshot:{ bigCycle:{phase:'Stable Late Cycle',note:'Shock absorbed without triggering phase transition'}, steep:{primary:'E',secondary:'P',note:'Brief economic disruption; political resolution'}, geoEcon:{tool:'Alliance Architecture',note:'Diplomatic resolution preserves energy market stability'}, gameTheory:{type:'Deterrence -- Successful',note:'Threat of further escalation prompts resolution'} },
        secondOrderEffects:['Strategic petroleum reserve releases suppress spike','Energy transition investment accelerates as policymakers note vulnerability','Insurance premiums remain elevated; shipping costs structurally higher'],
        historicalAnalog:'Gulf of Oman incidents 2019; brief oil spike and recovery',
        choicePrompt:'With markets stabilized, how do central banks manage the brief inflationary spike?',
        choices:['ies26-L2-hold','ies26-L3-spr-expansion'] },
      'ies26-L1-severe':{ id:'ies26-L1-severe', layer:1, type:'decision', title:'Severe Scenario -- Oil at $105; Growth Drops to 2.0%', label:'Severe Disruption',
        narrative:'The conflict proves intractable. Oil supply disruptions persist for three to six months. Brent crude rises to $105/barrel. Global growth plummets to 2.0% -- near recessionary. Energy-importing nations face the dual crisis of growth deceleration and inflation. The Japanese Yen and Euro are particularly strained; capital flows toward USD, CHF, and commodity currency safe havens.',
        lensSnapshot:{ bigCycle:{phase:'Late Cycle Shock',note:'Oil shock triggers potential debt deflation in most exposed economies'}, steep:{primary:'E',secondary:'P',note:'Stagflationary environment; political stability in importing nations threatened'}, geoEcon:{tool:'Resource Nationalism',note:'Energy weaponization at maximum intensity'}, gameTheory:{type:'Sequential Crisis Game',note:'Each week of conflict imposes compounding costs on importers'} },
        secondOrderEffects:['Yen depreciates beyond 165 vs USD; BoJ faces impossible tradeoff','Euro energy import bill surges; current account deficits widen dramatically','Emerging market dollar-denominated debt servicing costs rise sharply'],
        historicalAnalog:'1973 oil shock; 1979 second oil shock; 2022 Russian energy weaponization in Europe',
        choicePrompt:'With stagflation at 2.0% growth and surging oil prices, what is the central bank policy response?',
        choices:['ies26-L2-hold-raise','ies26-L2-emergency-cut'] },
      'ies26-L1-escalating':{ id:'ies26-L1-escalating', layer:1, type:'decision', title:'Escalating Scenario -- Broader Regional War; Oil Beyond $130', label:'Escalating Conflict',
        narrative:'The conflict draws in additional state actors. Iranian-linked forces directly attack energy infrastructure in Saudi Arabia. The Strait of Hormuz is formally mined. Oil spikes beyond $130/barrel. The global economy faces a supply shock of 1973-magnitude in a financial environment with significantly less monetary policy space.',
        lensSnapshot:{ bigCycle:{phase:'Systemic Shock',note:'Energy shock of this magnitude can trigger global recession and debt crises'}, steep:{primary:'P',secondary:'E',note:'War drives complete energy market disruption; geopolitical crisis management'}, geoEcon:{tool:'Resource Nationalism',note:'Energy infrastructure warfare as strategic weapon'}, gameTheory:{type:'Catastrophic Game',note:'Escalation logic takes over; all actors face catastrophic payoffs'} },
        secondOrderEffects:['Multiple sovereign debt crises triggered in energy-importing emerging markets','Food security crises emerge as fertilizer production (natural gas-dependent) collapses','Global recession virtually certain; financial system stress tests activated'],
        historicalAnalog:'1973 oil embargo + 1979 Iranian Revolution combined scenario; no precise historical precedent',
        choicePrompt:'With oil beyond $130 and global recession imminent, what emergency international economic architecture is deployed?',
        choices:['ies26-L2-g20-summit','ies26-L2-emergency-cut'] },
      'ies26-L2-hold':{ id:'ies26-L2-hold', layer:2, type:'decision', title:'Hold Rates -- Brief Spike Absorbed', label:'Hold Rates',
        narrative:'With the conflict resolved and oil normalizing, central banks correctly identify the inflation spike as transitory and hold rates steady. The contained response allows growth to continue at 3.1% without triggering a secondary shock from unnecessary tightening.',
        lensSnapshot:{ bigCycle:{phase:'Stable Continuation',note:'Correct policy diagnosis avoids unnecessary tightening'}, steep:{primary:'E',secondary:'P',note:'Measured response; brief disruption absorbed'}, geoEcon:{tool:'Monetary Policy',note:'Correct identification of transitory vs. persistent inflation'}, gameTheory:{type:'Optimal Response',note:'Correct calibration of policy response to shock type'} },
        secondOrderEffects:['Growth continues near 3.1%; no secondary policy-induced slowdown','Energy transition investment accelerates as vulnerability reminder persists','Strategic petroleum reserves rebuilt before next potential disruption'],
        historicalAnalog:'Fed 2021 initial transitory assessment; partially vindicated in contained shock scenarios',
        choicePrompt:'With the crisis absorbed, how does the nation build energy security architecture to prevent future exposure?',
        choices:['ies26-L3-spr-expansion','ies26-L4-energy-diversification'] },
      'ies26-L2-hold-raise':{ id:'ies26-L2-hold-raise', layer:2, type:'decision', title:'Hold or Raise Rates -- Price Stability Priority', label:'Hold/Raise Rates',
        narrative:'Central banks hold rates or tighten slightly, treating the energy shock as inflationary rather than recessionary. The priority is preventing wage-price spirals. The cost: the economic slowdown is amplified. Mortgage markets tighten; business investment contracts; unemployment begins to rise.',
        lensSnapshot:{ bigCycle:{phase:'Policy Tightening',note:'Central banks defend inflation credibility at cost of growth'}, steep:{primary:'E',secondary:'P',note:'Rate policy inflicts additional economic pain on already-slowing economy'}, geoEcon:{tool:'Monetary Policy',note:'Interest rate as primary anti-inflation tool'}, gameTheory:{type:'Credibility Game',note:'Central bank defends inflation expectations at short-term growth cost'} },
        secondOrderEffects:['Real estate markets correct as mortgage rates rise','Corporate debt refinancing costs surge for floating rate borrowers','Dollar strengthens further, amplifying emerging market debt stress'],
        historicalAnalog:'ECB 2022-2023 hiking cycle during energy shock; Fed 2022 response to supply-driven inflation',
        choicePrompt:'With rates held and growth slowing, how do fiscal authorities respond?',
        choices:['ies26-L3-energy-subsidies','ies26-L4-emerging-market-crisis'] },
      'ies26-L2-emergency-cut':{ id:'ies26-L2-emergency-cut', layer:2, type:'decision', title:'Emergency Rate Cuts -- Growth Priority', label:'Emergency Cuts',
        narrative:'Central banks pivot to emergency cuts, treating the growth collapse as more dangerous than the inflation spike. The cuts provide immediate relief to credit markets and mortgage holders. But cutting into an oil shock risks losing inflation credibility and triggering a wage-price spiral.',
        lensSnapshot:{ bigCycle:{phase:'Managed Crisis Response',note:'Accepting inflation risk to prevent financial system collapse'}, steep:{primary:'E',secondary:'P',note:'Policy tradeoff: inflation credibility vs. growth and financial stability'}, geoEcon:{tool:'Monetary Policy',note:'Emergency monetary support to prevent recession deepening'}, gameTheory:{type:'Crisis Management',note:'Short-term stabilization at potential long-term credibility cost'} },
        secondOrderEffects:['Credit markets stabilize; mortgage defaults reduced','Inflation risk re-emerges if conflict does not resolve quickly','Currency depreciates as rate differential narrows; imports become more expensive'],
        historicalAnalog:'ECB 2011 emergency rate cuts reversed 2012; Fed March 2020 emergency cuts',
        choicePrompt:'With emergency cuts deployed, what fiscal policy supplements monetary support?',
        choices:['ies26-L3-energy-subsidies','ies26-L4-emerging-market-crisis'] },
      'ies26-L2-g20-summit':{ id:'ies26-L2-g20-summit', layer:2, type:'decision', title:'G20 Emergency Summit -- Coordinated Response', label:'G20 Emergency Response',
        narrative:'An emergency G20 summit is convened within weeks of the escalation. Leaders coordinate a massive strategic reserve release, negotiate de-escalation with conflict parties, establish emergency food supply protocols, and pledge coordinated fiscal support for the most exposed emerging markets.',
        lensSnapshot:{ bigCycle:{phase:'Crisis Coordination',note:'G20 multilateral response to energy and economic crisis'}, steep:{primary:'P',secondary:'E',note:'Political coordination enables economic crisis management'}, geoEcon:{tool:'Alliance Architecture',note:'G20 as coordinating institution for energy crisis management'}, gameTheory:{type:'Cooperative Game -- Crisis Response',note:'Collective action overcomes individual nation prisoner dilemma'} },
        secondOrderEffects:['Strategic reserve releases collectively reduce oil price spike by $15-25','Coordinated message to conflict parties creates de-escalation pressure','Emerging market financial support prevents sovereign debt cascade'],
        historicalAnalog:'G20 London Summit April 2009; coordinated COVID vaccine financing; energy security summits',
        choicePrompt:'With G20 coordination deployed, how is the energy architecture reformed to prevent future exposure?',
        choices:['ies26-L3-spr-expansion','ies26-L4-energy-diversification'] },
      'ies26-L3-spr-expansion':{ id:'ies26-L3-spr-expansion', layer:3, type:'decision', title:'Strategic Petroleum Reserve Expansion', label:'SPR Expansion',
        narrative:'The crisis demonstrates that existing strategic reserves were insufficient for a multi-month disruption. A coordinated expansion of strategic petroleum and LNG reserves among IEA member states is implemented, doubling coverage from 90 days to 180 days.',
        lensSnapshot:{ bigCycle:{phase:'Resilience Investment',note:'Crisis drives investment in physical energy security buffers'}, steep:{primary:'E',secondary:'P',note:'Economic security investment driven by political crisis memory'}, geoEcon:{tool:'Alliance Architecture',note:'IEA reserve coordination deepened'}, gameTheory:{type:'Insurance Investment',note:'Collective reserves reduce individual vulnerability to future shocks'} },
        secondOrderEffects:['Global oil demand increases temporarily to build reserves','Storage capacity investment creates construction boom','Coordinated reserves change OPEC+ pricing calculations'],
        historicalAnalog:'IEA reserve requirements expansion discussions; US SPR refill debates; LNG strategic reserve programs',
        choicePrompt:'With expanded reserves providing buffer time, what additional energy security measures reduce structural dependence?',
        choices:['ies26-L4-energy-diversification','ies26-L4-transition-acceleration'] },
      'ies26-L3-energy-subsidies':{ id:'ies26-L3-energy-subsidies', layer:3, type:'decision', title:'Broad Energy Price Subsidies', label:'Energy Subsidies',
        narrative:'Governments implement broad energy price caps and subsidies to shield consumers and firms from the full cost of the shock. The fiscal bill is enormous -- potentially 3-5% of GDP annually -- and the debt impact adds to already-elevated sovereign debt levels.',
        lensSnapshot:{ bigCycle:{phase:'Fiscal Fragility',note:'Subsidies add to already-elevated sovereign debt'}, steep:{primary:'E',secondary:'P',note:'Fiscal support prevents social unrest; creates long-term debt burden'}, geoEcon:{tool:'Fiscal Statecraft',note:'Subsidies as demand-side energy shock management tool'}, gameTheory:{type:'Political Survival Game',note:'Subsidies buy political stability at long-term fiscal cost'} },
        secondOrderEffects:['Fiscal deficits surge; sovereign debt stress increases','Energy consumption does not adjust; underlying vulnerability persists','Bond market pressures governments to eventually reform subsidies'],
        historicalAnalog:'European energy subsidies 2022-2023 estimated at 800bn EUR; UK energy price guarantee',
        choicePrompt:'With subsidies limiting the immediate social damage but creating long-term fiscal stress, what structural energy reform follows?',
        choices:['ies26-L4-transition-acceleration','ies26-L4-energy-diversification','ies26-L4-imf-program'] },
      'ies26-L4-imf-program':{ id:'ies26-L4-imf-program', layer:4, type:'terminal', title:'IMF Emergency Stabilization Program', label:'IMF Program',
        narrative:'Fiscal overextension from energy subsidies forces the government to seek an IMF emergency program. The IMF provides liquidity in exchange for structural adjustment conditions: subsidy phase-out, currency devaluation, fiscal consolidation, and structural reform. The conditionality is politically painful but restores market confidence.',
        outcome:'IMF EMERGENCY STABILIZATION -- CONDITIONAL ADJUSTMENT',
        outcomeNarrative:'The IMF program successfully restores market confidence and prevents a disorderly sovereign default. The conditionality extracts significant political and economic costs: energy subsidies are phased out, the currency is allowed to depreciate, and the fiscal deficit is cut sharply. Growth contracts for two years before recovering. The political consequences are severe; governments that accepted IMF conditions typically face electoral defeat but structural stability is restored.',
        finalLensScores:{ bigCycle:'Debt Cycle -- External Constraint Imposed', steep:{S:0.7,T:0.3,E:1.0,En:0.5,P:0.9}, geoEcon:'Fiscal Statecraft -- IMF conditionality as external discipline', gameTheory:'Credible Commitment -- IMF as external commitment device for fiscal adjustment' },
        historicalAnalog:'IMF programs Greece 2010; Argentina 2018; Pakistan 2023; Sri Lanka 2023; UK 1976',
        aiPromptSeed:'Model how IMF conditionality from energy-shock-driven fiscal overextension reshapes the political economy of affected nations, tracing whether structural adjustment produces durable reform or sows conditions for subsequent crises.' },
      'ies26-L4-energy-diversification':{ id:'ies26-L4-energy-diversification', layer:4, type:'terminal', title:'Energy Supply Diversification Architecture', label:'Energy Diversification',
        narrative:'The crisis drives the fastest diversification of energy supply in history: new LNG import terminals, interconnectors with alternative suppliers, and massive renewable energy deployment. Import dependence on any single chokepoint is reduced below 5% within 5 years.',
        outcome:'ENERGY SUPPLY DIVERSIFICATION -- REDUCED CHOKEPOINT DEPENDENCE',
        outcomeNarrative:'The Hormuz crisis proves to be the catalyst for the energy diversification that climate policy alone could not motivate. Within five years, major importing nations have reduced their exposure to any single chokepoint from 20%+ to under 5%. The energy system is more expensive but dramatically more resilient. The geopolitical leverage of energy exporters over importers declines permanently.',
        finalLensScores:{ bigCycle:'Transition -- Energy Architecture Restructuring', steep:{S:0.4,T:0.7,E:0.8,En:0.8,P:0.7}, geoEcon:'Resource Nationalism -- diversification reduces vulnerability', gameTheory:'Insurance Architecture -- diversification eliminates single-point failure risk' },
        historicalAnalog:'EU energy diversification post-2022 Russia invasion; Germany LNG terminal construction; European renewables acceleration',
        aiPromptSeed:'Model how energy supply diversification driven by the 2026 Hormuz crisis intersects with the long-term energy transition, tracing whether diversification investment creates stranded asset risk or accelerates renewable deployment.' },
      'ies26-L4-transition-acceleration':{ id:'ies26-L4-transition-acceleration', layer:4, type:'terminal', title:'Accelerated Energy Transition', label:'Transition Acceleration',
        narrative:'The crisis provides the political shock necessary to dramatically accelerate the energy transition. Renewable energy targets are doubled; heat pump and EV adoption incentives are tripled; carbon pricing is extended. The energy transition that was projected to take 30 years is accelerated to 15.',
        outcome:'ENERGY CRISIS ACCELERATES CLEAN TRANSITION',
        outcomeNarrative:'The 2026 energy shock does what decades of climate policy could not: it makes the energy transition an immediate security priority rather than a long-term environmental obligation. The acceleration is real and lasting. Import dependence on fossil fuel chokepoints declines rapidly. The geopolitical map of energy power is redrawn within a decade.',
        finalLensScores:{ bigCycle:'Transition -- Clean Energy Cycle Entry', steep:{S:0.6,T:0.9,E:0.7,En:0.9,P:0.8}, geoEcon:'Technological Statecraft -- energy transition as security strategy', gameTheory:'Long-Term Investment -- crisis converts collective action problem into individual security imperative' },
        historicalAnalog:'1970s oil crisis accelerating nuclear and renewables investment; 2022 Russia invasion tripling European renewable deployment',
        aiPromptSeed:'Model how a geopolitically-driven acceleration of the energy transition in 2026-2030 interacts with the incumbent fossil fuel geopolitical architecture, tracing the petrostate adjustment challenge and the emergence of new clean energy geopolitics.' },
      'ies26-L4-emerging-market-crisis':{ id:'ies26-L4-emerging-market-crisis', layer:4, type:'terminal', title:'Emerging Market Debt and Currency Crisis', label:'EM Debt Crisis',
        narrative:'The combination of high oil prices, a strong dollar, and tight monetary conditions triggers a wave of emerging market sovereign debt distress. Nations with large dollar-denominated debt and oil import dependence face simultaneous currency depreciation, inflation, and growth collapse.',
        outcome:'EMERGING MARKET DEBT CASCADE',
        outcomeNarrative:'The energy shock triggers the most severe emerging market debt crisis since the 1980s. Multiple nations require IMF emergency programs; several default on external debt. The crisis concentrates pain in the most vulnerable nations -- those with least fiscal space and highest energy import dependence. The recovery is slow; political instability in several affected nations reshapes regional geopolitics for a decade.',
        finalLensScores:{ bigCycle:'Late Cycle -- Debt Crisis Cascade', steep:{S:0.8,T:0.3,E:1.0,En:0.6,P:0.9}, geoEcon:'Sanctions + Resource Nationalism -- energy weaponization causes EM debt cascade', gameTheory:'Contagion Game -- crisis spreads through dollar-denominated debt channels' },
        historicalAnalog:'1980s debt crisis triggered by Volcker shock and oil price; 1997 Asian crisis; 2022 Sri Lanka, Pakistan, Bangladesh energy shocks',
        aiPromptSeed:'Model how an emerging market debt cascade triggered by the 2026 energy shock reshapes geopolitical alignments, particularly whether distressed nations turn to China for bilateral assistance and what conditions are attached.' }
    }
  },

  // ── CLUSTER C: GEOECONOMIC ORDERS ────────────────────────────────────────

  { id:'bipolar-economy', cluster:'geoeconomic', title:'The Bipolar Economy', era:'2025-2040', timeHorizon:'long', primaryLens:'geoEcon',
    description:'US-China competition produces two partially decoupled economic blocs, each with competing technology standards, payment systems, and trade architectures -- forcing every nation to choose or hedge.',
    tags:['US-China','decoupling','sanctions','export controls','technology standards','reserve currency'],
    aiPromptContext:'You are simulating the Bipolar Near-Global Economy. Apply Big Cycle lens (US in late hegemonic cycle; China as challenger power), GeoEconomics (full toolkit: tariffs, export controls, sanctions, currency, alliances), and game theory (two-player hegemonic competition with third-party boundary states as strategic actors with outside options).',
    rootNodeId:'bpe-L0-trigger',
    nodes:{
      'bpe-L0-trigger':{ id:'bpe-L0-trigger', layer:0, type:'trigger', title:'US-China Economic Decoupling Accelerates', label:'Decoupling Trigger',
        narrative:'A series of escalating actions -- expanded export controls on advanced semiconductors, Chinese retaliation through rare earth restrictions, and the formal establishment of two competing 5G technology architectures -- crystallizes the structural reality: the world economy is bifurcating into two partially separate blocs. Nations that once enjoyed access to both markets now face explicit pressure to choose.',
        lensSnapshot:{ bigCycle:{phase:'Hegemonic Competition',note:'Incumbent vs. rising challenger; classic power transition dynamics'}, steep:{primary:'T',secondary:'P',note:'Technology competition as primary driver; political architecture as secondary'}, geoEcon:{tool:'Export Controls',note:'Technology controls as primary economic weapon'}, gameTheory:{type:'Prisoner\'s Dilemma',note:'Both blocs would benefit from cooperation but each fears unilateral defection'} },
        choicePrompt:'How does the leading power respond to the challenger\'s accelerating capability development?',
        choices:['bpe-L1-containment','bpe-L1-accommodation','bpe-L1-selective'] },
      'bpe-L1-containment':{ id:'bpe-L1-containment', layer:1, type:'decision', title:'Maximum Pressure -- Full Technology Containment', label:'Full Containment',
        narrative:'The hegemon pursues maximum pressure: comprehensive technology controls, broad financial sanctions, alliance coercion to force others to choose sides, and explicit efforts to reverse the challenger\'s industrial capacity gains. The strategy aims to deny the challenger access to the enabling technologies for the next productive cycle.',
        lensSnapshot:{ bigCycle:{phase:'Hegemonic Defense',note:'Incumbent uses full toolkit to prevent challenger from reaching parity'}, steep:{primary:'T',secondary:'P',note:'Technology denial as primary tool; geopolitical pressure as enforcement'}, geoEcon:{tool:'Export Controls',note:'Comprehensive technology and financial containment strategy'}, gameTheory:{type:'Total Competition',note:'Zero-sum competition for technological leadership'} },
        secondOrderEffects:['Global supply chains forced to choose one architecture or face penalties from both','Neutral nations face enormous pressure to align; non-alignment becomes costly','Technology bifurcation accelerates; two incompatible global systems emerge'],
        historicalAnalog:'US containment strategy vs. USSR; China semiconductor controls 2022-2024 escalation',
        choicePrompt:'With full containment deployed, how does the challenger respond to the technology denial?',
        choices:['bpe-L2-aggressive-secondary-sanctions','bpe-L2-indigenous'] },
      'bpe-L1-accommodation':{ id:'bpe-L1-accommodation', layer:1, type:'decision', title:'Accommodation -- Managed Competition', label:'Accommodation',
        narrative:'Rather than maximum pressure, the hegemon focuses on maintaining economic relationships while managing competitive dynamics. Trade continues in non-sensitive sectors; diplomatic channels remain open. The rival\'s rise is accepted as a structural reality to be managed rather than reversed.',
        lensSnapshot:{ bigCycle:{phase:'Managed Decline',note:'Hegemon accepts relative decline to preserve absolute gains'}, steep:{primary:'E',secondary:'P',note:'Economic interests preserved through coexistence; political tensions managed'}, geoEcon:{tool:'Alliance Architecture',note:'Positive engagement maintains economic relationships'}, gameTheory:{type:'Positive-Sum Cooperation',note:'Both hegemons benefit from ongoing trade; rivalry managed rather than escalated'} },
        secondOrderEffects:['Boundary states gain leverage as they are competed for rather than coerced','Technology flows between blocs continue in dual-use gray areas','Global economic integration maintained at higher level than containment scenario'],
        historicalAnalog:'US-China engagement strategy 2000-2016; Obama Pacific pivot with maintained commercial ties',
        choicePrompt:'With accommodation maintaining trade flows, how does the hegemon manage boundary countries developing closer ties with the rival?',
        choices:['bpe-L2-economic-incentives','bpe-L3-defend-dollar'] },
      'bpe-L1-selective':{ id:'bpe-L1-selective', layer:1, type:'decision', title:'Selective Decoupling -- Small Yard, High Fence', label:'Selective Decoupling',
        narrative:'The hegemon pursues a precise decoupling strategy: extremely tight controls on genuinely dual-use frontier technologies (advanced AI chips, quantum computing, advanced biotech) while maintaining broad commercial engagement in non-sensitive sectors. The small yard, high fence approach attempts to deny the rival only the technologies that matter most.',
        lensSnapshot:{ bigCycle:{phase:'Strategic Competition -- Managed',note:'Preserves economic relationship while denying specific strategic capabilities'}, steep:{primary:'T',secondary:'E',note:'Technology specificity as key design challenge'}, geoEcon:{tool:'Export Controls',note:'Precision controls: maximum impact, minimum economic disruption'}, gameTheory:{type:'Targeted Containment',note:'Selective defection: cooperate broadly, defect specifically'} },
        secondOrderEffects:['Rival focuses all innovation effort on breaking the specific controls','Allied nations pressure the hegemon to maintain commercial access','Control boundary between strategic and non-strategic technologies continuously contested'],
        historicalAnalog:"US 'small yard, high fence' formulation; Commerce Department controls 2022-2024 on advanced AI chips",
        choicePrompt:'With selective decoupling in place, how does the rival respond to the specific technology denials?',
        choices:['bpe-L2-indigenous','bpe-L3-allied-tech'] },
      'bpe-L2-aggressive-secondary-sanctions':{ id:'bpe-L2-aggressive-secondary-sanctions', layer:2, type:'decision', title:'Aggressive Secondary Sanctions Enforcement', label:'Secondary Sanctions',
        narrative:'The hegemon uses dollar-denominated financial system dominance to coerce boundary countries: any firm or financial institution that maintains significant ties with the sanctioned rival is denied access to the hegemon\'s financial system. The extraterritorial reach of these sanctions is massive -- and massively resented.',
        lensSnapshot:{ bigCycle:{phase:'Weaponized Hegemony',note:'Using reserve currency as weapon accelerates its erosion'}, steep:{primary:'P',secondary:'E',note:'Sanctions as political tool; economic costs distributed globally'}, geoEcon:{tool:'Sanctions',note:'Dollar weaponization: extraterritorial financial coercion'}, gameTheory:{type:'Coercion Game',note:'Hegemon tries to make compliance more attractive than defiance'} },
        secondOrderEffects:['Accelerates de-dollarization efforts among sanctioned and threatened nations','Rival deepens alternative payment systems (CIPS, SWIFT alternatives)','Non-aligned nations accelerate reserve diversification away from dollar'],
        historicalAnalog:'Iran SWIFT exclusion 2012; Russia SWIFT exclusion 2022; dollar weaponization and subsequent BRICS de-dollarization discussion',
        choicePrompt:'As secondary sanctions accelerate de-dollarization, how does the hegemon respond to the emerging alternative financial architecture?',
        choices:['bpe-L3-defend-dollar','bpe-L4-digital-dollar-dominance'] },
      'bpe-L2-economic-incentives':{ id:'bpe-L2-economic-incentives', layer:2, type:'decision', title:'Economic Incentives -- Positive Engagement Architecture', label:'Economic Incentives',
        narrative:'The hegemon deploys positive-sum economic tools to retain boundary-state alignment: preferential market access, investment guarantees, technology-sharing agreements, and infrastructure financing that competes with the rival\'s offerings. The strategy accepts the rival\'s continued rise but aims to make alignment with the hegemon economically superior.',
        lensSnapshot:{ bigCycle:{phase:'Managed Decline -- Engagement',note:'Hegemon uses economic incentives to preserve alliance without maximum pressure'}, steep:{primary:'E',secondary:'P',note:'Economic tools as primary instrument; political alignment as objective'}, geoEcon:{tool:'Alliance Architecture',note:'Positive economic statecraft as alternative to coercive containment'}, gameTheory:{type:'Positive-Sum Incentive Game',note:'Hegemon offers value that makes cooperation more attractive than defection to rival'} },
        secondOrderEffects:['Boundary states gain negotiating leverage; demands escalate over time','Economic engagement reduces pace of decoupling; dual exposure for boundary states','Hegemon must sustain economic commitments even as fiscal constraints grow'],
        historicalAnalog:'Marshall Plan economic engagement; US trade preferences for aligned states; Indo-Pacific Economic Framework',
        choicePrompt:'With economic incentives maintaining boundary-state alignment, how does the hegemon manage the rival\'s direct economic countermoves?',
        choices:['bpe-L3-allied-tech','bpe-L4-multipolar-currency'] },
      'bpe-L2-indigenous':{ id:'bpe-L2-indigenous', layer:2, type:'decision', title:'Rival Accelerates Indigenous Technology Development', label:'Indigenous Innovation Push',
        narrative:'Cut off from the hegemon\'s technology supply chains, the rival government mobilizes the full resources of the state: massive R&D subsidies, talent recruitment programs, state-directed industrial policy. The denied technology becomes the organizing principle of the rival\'s innovation system.',
        lensSnapshot:{ bigCycle:{phase:'Challenger Rising -- Technological',note:'Technology denial accelerates challenger\'s indigenous capability development'}, steep:{primary:'T',secondary:'E',note:'Forced technological self-sufficiency as development model'}, geoEcon:{tool:'Export Controls',note:'Controls as accidental subsidy to rival R&D effort'}, gameTheory:{type:'Unintended Consequence',note:"Hegemon's denial strategy may accelerate challenger's capability"} },
        secondOrderEffects:['Rival produces inferior but functional alternatives faster than expected','Third countries now have a second source for critical technologies','Technology gap between blocs narrows; control effectiveness degrades'],
        historicalAnalog:'Chinese SMIC semiconductor development; Huawei Kirin chip post-sanctions; Chinese military-civil fusion',
        choicePrompt:'As the rival narrows the technology gap, how does the hegemon respond to preserve its lead?',
        choices:['bpe-L3-allied-tech','bpe-L4-dual-use-standards'] },
      'bpe-L3-defend-dollar':{ id:'bpe-L3-defend-dollar', layer:3, type:'decision', title:'Active Defense of Dollar Reserve Currency Status', label:'Defend Dollar',
        narrative:'The hegemon doubles down on defending dollar primacy: pressuring allies to maintain dollar invoicing, deploying military presence to protect key commodity markets priced in dollars, and threatening additional sanctions against nations building alternative payment systems.',
        lensSnapshot:{ bigCycle:{phase:'Reserve Currency Defense',note:'Defending monetary dominance is historically associated with late hegemonic phase'}, steep:{primary:'P',secondary:'E',note:'Military and diplomatic power deployed to defend monetary system'}, geoEcon:{tool:'Currency Manipulation',note:'Defense of dollar as dominant invoice and reserve currency'}, gameTheory:{type:'Status Quo Defense',note:"Incumbent defends existing architecture against challenger's efforts to revise it"} },
        secondOrderEffects:["Defense of dollar primacy requires expanding geopolitical commitments","Resentment among sanctioned nations accelerates alternative architecture development","Dollar's share of global reserves declines gradually despite defense efforts"],
        historicalAnalog:'Petrodollar defense mechanisms; US opposition to SDR expansion; SWIFT control maintenance',
        choicePrompt:'With dollar hegemony under structural pressure, what long-term monetary architecture does the hegemon build?',
        choices:['bpe-L4-digital-dollar-dominance','bpe-L4-multipolar-currency'] },
      'bpe-L3-allied-tech':{ id:'bpe-L3-allied-tech', layer:3, type:'decision', title:'Allied Technology Pool -- Collective Innovation', label:'Allied Tech Pool',
        narrative:'Rather than competing alone, the hegemon deepens technology cooperation with key allies: joint R&D programs, shared technology standards, mutual recognition of export controls, and coordinated investment in critical technology sectors. The allied bloc collectively outpaces the rival.',
        lensSnapshot:{ bigCycle:{phase:'Allied Consolidation',note:'Collective innovation as hegemonic bloc maintenance strategy'}, steep:{primary:'T',secondary:'P',note:'Technology diplomacy as primary alliance management tool'}, geoEcon:{tool:'Alliance Architecture',note:'Technology sharing as alliance deepening mechanism'}, gameTheory:{type:'Coalition Game',note:'Allied bloc coordination outperforms individual actor strategies'} },
        secondOrderEffects:['Allied nations gain technology access previously restricted','Innovation rate within allied bloc accelerates through knowledge sharing','Boundary states face even higher pressure to align as technology gap widens'],
        historicalAnalog:'AUKUS technology sharing 2021; Quad technology cooperation; Chip 4 Alliance (US, Japan, South Korea, Taiwan)',
        choicePrompt:'With allied technology cooperation deepening, how is the civilian-military technology boundary managed within the alliance?',
        choices:['bpe-L4-dual-use-standards','bpe-L4-digital-dollar-dominance'] },
      'bpe-L4-digital-dollar-dominance':{ id:'bpe-L4-digital-dollar-dominance', layer:4, type:'terminal', title:'Digital Dollar -- CBDC-Based Reserve Currency', label:'Digital Dollar',
        narrative:'The hegemon launches a wholesale CBDC that provides faster, more programmable dollar access to allied financial systems. The CBDC deepens dollar integration in allied economies while providing a new tool for monitoring and potentially restricting sanctioned entities.',
        outcome:'DIGITAL RESERVE CURRENCY ARCHITECTURE',
        outcomeNarrative:'The digital dollar successfully deepens dollar integration among allies and provides new tools for financial statecraft. But the programmability that enables enforcement also enables surveillance -- allies accept the architecture but are aware of the dependency it creates. The rival responds with its own digital currency architecture; the monetary system bifurcates digitally.',
        finalLensScores:{ bigCycle:'Hegemonic Renewal via Technology', steep:{S:0.4,T:1.0,E:0.8,En:0.2,P:0.9}, geoEcon:'Currency Manipulation + Technological Statecraft', gameTheory:'First-Mover Advantage -- establishes digital reserve currency standard' },
        historicalAnalog:'Federal Reserve FedNow; BIS mBridge CBDC project; digital yuan (e-CNY) international push',
        aiPromptSeed:'Model how competing CBDC architectures -- the digital dollar and the digital yuan -- reshape global financial flows, sanctions effectiveness, and de-dollarization trajectories through 2035.' },
      'bpe-L4-dual-use-standards':{ id:'bpe-L4-dual-use-standards', layer:4, type:'terminal', title:'Allied Dual-Use Technology Standards', label:'Allied Tech Standards',
        narrative:'The allied bloc establishes common standards for dual-use technology export controls, removing the patchwork inconsistencies that allowed the rival to source controlled technologies from allied nations with weaker controls.',
        outcome:'ALLIED TECHNOLOGY CONTROL ARCHITECTURE',
        outcomeNarrative:'Harmonized allied export controls significantly improve the effectiveness of technology denial. The rival\'s access to controlled technologies drops substantially. But the architecture requires unprecedented coordination on a technically complex and commercially sensitive issue, and political pressures within allied nations create ongoing compliance challenges.',
        finalLensScores:{ bigCycle:'Allied Consolidation -- Technology', steep:{S:0.3,T:0.9,E:0.6,En:0.2,P:0.8}, geoEcon:'Export Controls -- harmonized allied control architecture', gameTheory:'Cooperative Game -- allied coordination overcomes individual defection incentives' },
        historicalAnalog:'Wassenaar Arrangement reform discussions; US-Netherlands-Japan semiconductor equipment controls 2023; G7 technology coordination',
        aiPromptSeed:'Extend this simulation to model how harmonized allied technology controls intersect with AI development, quantum computing, and biotechnology -- particularly how these controls shape the trajectory of the global AI race through 2030.' },
      'bpe-L4-multipolar-currency':{ id:'bpe-L4-multipolar-currency', layer:4, type:'terminal', title:'Managed Multipolar Currency System', label:'Multipolar Currencies',
        narrative:'Rather than defending dollar dominance at any cost, the hegemon accepts a managed transition to a multipolar reserve currency system: dollar, euro, and potentially a basket currency coexist, with each dominant in its aligned bloc.',
        outcome:'MULTIPOLAR MONETARY ARCHITECTURE',
        outcomeNarrative:'The managed transition to multipolarity proves more stable than either pure dollar dominance or chaotic fragmentation. Each bloc trades primarily in its own currency; global commodity markets gradually shift to multiple pricing benchmarks. The adjustment is economically costly for dollar-denominated issuers but prevents the catastrophic scenarios of a disorderly dollar collapse.',
        finalLensScores:{ bigCycle:'Hegemonic Transition -- Managed', steep:{S:0.5,T:0.6,E:0.9,En:0.3,P:0.8}, geoEcon:'Currency Manipulation -- multipolar reserve system', gameTheory:'Cooperative Transition Game -- managed decline prevents catastrophic instability' },
        historicalAnalog:'Sterling-dollar transition 1945-1976; SDR as reserve asset; BRICS+ reserve diversification discussions',
        aiPromptSeed:'Model how a managed transition to a multipolar reserve currency system affects global trade financing, capital flows, and the leverage of financial sanctions as a geopolitical tool through 2040.' }
    }
  },

  { id:'fragmented-stagnation', cluster:'geoeconomic', title:'The Age of Fragmented Stagnation', era:'2025-2040', timeHorizon:'long', primaryLens:'geoEcon',
    description:'The global economy fragments into competing regional blocs without any dominant order, producing persistent low growth, high transaction costs, and the slow erosion of the multilateral institutions that underpinned the post-1945 prosperity architecture.',
    tags:['fragmentation','deglobalization','stagnation','regional blocs','multilateralism'],
    aiPromptContext:'You are simulating the Age of Fragmented Stagnation. Apply Big Cycle lens (neither US nor China achieves clear hegemony; interregnum produces instability), GeoEconomics (trade fragmentation; competing standards; parallel financial systems), and game theory (multi-player competition without dominant actor; no Schelling point for coordination; tragedy of fragmentation).',
    rootNodeId:'frst-L0-trigger',
    nodes:{
      'frst-L0-trigger':{ id:'frst-L0-trigger', layer:0, type:'trigger', title:'Neither Bloc Dominates -- Hegemonic Interregnum', label:'Interregnum',
        narrative:'The US-China competition has not produced a winner. Neither bloc commands sufficient economic or military dominance to organize global systems around its preferences. The rules-based international order of the post-1945 era has been hollowed out -- not replaced, just undermined. What remains is a patchwork: competing trade architectures, parallel payment systems, overlapping and inconsistent standards regimes, and a UN Security Council that cannot act on any significant issue. Global trade costs rise 15-25% from fragmentation. Long-run growth rates decline.',
        lensSnapshot:{ bigCycle:{phase:'Hegemonic Interregnum',note:'Neither incumbent nor challenger achieves dominance; transition costs accumulate'}, steep:{primary:'P',secondary:'E',note:'Political fragmentation drives economic stagnation'}, geoEcon:{tool:'Tariffs',note:'Trade fragmentation as default outcome of hegemonic stalemate'}, gameTheory:{type:"Multi-Polar Prisoner's Dilemma",note:'No dominant actor; no Schelling point; coordination fails'} },
        choicePrompt:'In a fragmented world without dominant order, what strategic architecture does a mid-sized nation adopt?',
        choices:['frst-L1-hedge','frst-L1-align','frst-L1-regional'] },
      'frst-L1-hedge':{ id:'frst-L1-hedge', layer:1, type:'decision', title:'Strategic Hedging -- Refuse Bloc Alignment', label:'Strategic Hedging',
        narrative:'The nation explicitly refuses to align with either major bloc, maintaining economic relationships with both while developing independent institutional ties with other hedging states. India, Saudi Arabia, Brazil, Indonesia, Turkey, and South Africa operate as a loose coalition of swing states -- too important to coerce, too uncommitted to trust.',
        lensSnapshot:{ bigCycle:{phase:'Multi-Polar Maneuvering',note:'Mid-sized powers gain leverage in hegemonic interregnum'}, steep:{primary:'P',secondary:'E',note:'Political autonomy maintained; economic relationships diversified'}, geoEcon:{tool:'Alliance Architecture',note:'Deliberate non-alignment as strategic choice'}, gameTheory:{type:'Outside Option Maintenance',note:'Preserving outside options creates negotiating leverage with both blocs'} },
        secondOrderEffects:['Both blocs compete to offer better terms to swing states','Hedging nations gain economic leverage but face geopolitical uncertainty','Coordination among hedging nations creates third force in global governance'],
        historicalAnalog:'Non-Aligned Movement 1955-1991; India multi-alignment 2020s; Gulf states balancing US-China',
        choicePrompt:'With hedging strategy established, how does the nation build productive economic architecture with other hedging states?',
        choices:['frst-L2-south-south','frst-L2-new-multilateral'] },
      'frst-L1-align':{ id:'frst-L1-align', layer:1, type:'decision', title:'Align with Dominant Bloc -- Accept Constraints', label:'Bloc Alignment',
        narrative:'The nation calculates that the fragmented world is too costly for pure hedging and commits fully to one bloc\'s economic architecture: accepts its technology standards, financial systems, and trade arrangements. In exchange, it receives preferential market access, security guarantees, and investment flows.',
        lensSnapshot:{ bigCycle:{phase:'Bloc Consolidation',note:'Smaller nations consolidate within blocs as fragmentation costs become prohibitive'}, steep:{primary:'E',secondary:'P',note:'Economic efficiency gained through alignment; political autonomy reduced'}, geoEcon:{tool:'Alliance Architecture',note:"Full integration into one bloc's economic architecture"}, gameTheory:{type:'Commitment Game',note:'Credible commitment to one bloc increases trust and benefits within that system'} },
        secondOrderEffects:['Inside-bloc trade and investment flows increase substantially','Relationships with the opposing bloc deteriorate; some economic relationships severed','Nation becomes geopolitical asset of the chosen bloc; security commitments follow'],
        historicalAnalog:'Eastern European NATO/EU integration; Southeast Asian states choosing RCEP over CPTPP',
        choicePrompt:'With full bloc alignment made, how does the nation maximize its position within the bloc\'s internal hierarchy?',
        choices:['frst-L2-specialize','frst-L2-new-multilateral'] },
      'frst-L1-regional':{ id:'frst-L1-regional', layer:1, type:'decision', title:'Build Regional Order -- Lead Without Global Alignment', label:'Regional Leadership',
        narrative:'The nation invests in becoming the organizing power of its region: building a regional trade architecture, regional development bank, regional security framework, and regional standards regime. The regional order provides stability and economic benefits without requiring global bloc alignment.',
        lensSnapshot:{ bigCycle:{phase:'Regional Order Building',note:'Global fragmentation creates space for regional hegemons to emerge'}, steep:{primary:'P',secondary:'E',note:'Political leadership invested in regional institution building'}, geoEcon:{tool:'Alliance Architecture',note:'Regional trade and security architecture as alternative to global alignment'}, gameTheory:{type:'Regional Hegemon Game',note:'Within-region coordination; outside-region hedging'} },
        secondOrderEffects:['Regional neighbors must choose to accept or resist regional leadership','Both global blocs compete to affiliate with the successful regional order','Regional order becomes template for other regions attempting similar architecture'],
        historicalAnalog:'ASEAN building; African Union development; MERCOSUR; India regional ambitions',
        choicePrompt:'With regional leadership established, how does the regional order manage its relationship with the competing global blocs?',
        choices:['frst-L2-bargaining','frst-L2-south-south'] },
      'frst-L2-south-south':{ id:'frst-L2-south-south', layer:2, type:'decision', title:'South-South Trade Architecture', label:'South-South Trade',
        narrative:'Hedging nations build direct trade relationships among themselves, reducing dependence on North Atlantic and Chinese-led trade systems. New trade corridors emerge: India-Africa, Gulf-Southeast Asia, Latin America-South Asia. The volume is initially small relative to legacy North-South trade but grows rapidly as fragmentation costs make alternative routing valuable.',
        lensSnapshot:{ bigCycle:{phase:'Trade Architecture Diversification',note:'Emerging market trade reorientation away from legacy North-South patterns'}, steep:{primary:'E',secondary:'T',note:'New trade corridors require infrastructure and logistics investment'}, geoEcon:{tool:'Alliance Architecture',note:'Trade diversification as geopolitical autonomy strategy'}, gameTheory:{type:'Coalition Building',note:'Swing states build coalition to reduce dependence on major blocs'} },
        secondOrderEffects:['New trade corridors require massive logistics investment','Both major blocs attempt to co-opt the south-south architecture','Dollar dependence in south-south trade creates opening for alternative currencies'],
        historicalAnalog:'BRICS trade expansion; Belt and Road as one pole; India-Middle East-Europe corridor; INSTC',
        choicePrompt:'With south-south trade growing, what financial architecture supports it outside the dollar system?',
        choices:['frst-L3-alt-currency','frst-L4-multipolar-stagnation'] },
      'frst-L2-new-multilateral':{ id:'frst-L2-new-multilateral', layer:2, type:'decision', title:'New Multilateral Institution Architecture', label:'New Multilateralism',
        narrative:'The failures of the existing multilateral system create space for new institutions: a reformed WTO with binding dispute settlement; a multilateral development bank that is truly neutral; an international standards body with genuine technical authority. The new institutions are designed around the fragmented world that exists, not the integrated world that once did.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation -- Fragmentation',note:'New multilateralism adapts to bipolar world rather than trying to restore previous integration'}, steep:{primary:'P',secondary:'E',note:'Political will for new institutions emerging from frustration with existing ones'}, geoEcon:{tool:'Alliance Architecture',note:'New multilateral architecture for fragmented world'}, gameTheory:{type:'Institution Building Game',note:'New rules can produce new equilibria even without hegemonic enforcement'} },
        secondOrderEffects:['Existing institutions (WTO, IMF) face legitimacy crisis as new ones gain credibility','New institutions reflect emerging market interests more than Bretton Woods institutions do','Innovation in multilateralism creates template for further institutional evolution'],
        historicalAnalog:'AIIB as alternative to World Bank; NDB (BRICS bank); CPTPP without US; RCEP',
        choicePrompt:'With new multilateral institutions established, how do they manage the fundamental coordination challenge of fragmentation?',
        choices:['frst-L3-trade-corridors','frst-L4-managed-fragmentation'] },
      'frst-L2-specialize':{ id:'frst-L2-specialize', layer:2, type:'decision', title:'Specialize in Strategic Bloc Function', label:'Strategic Specialization',
        narrative:'Within the chosen bloc, the nation targets a specific strategic function that maximizes its importance: semiconductor assembly, rare earth processing, logistics hub, data center location, financial services gateway. The specialization creates deep interdependence with the bloc\'s leading members and generates significant investment inflows.',
        lensSnapshot:{ bigCycle:{phase:'Within-Bloc Integration',note:'Deep specialization creates mutual dependence; reduces autonomy but increases prosperity'}, steep:{primary:'E',secondary:'T',note:'Technology and economic specialization as development strategy'}, geoEcon:{tool:'Alliance Architecture',note:'Strategic function within bloc architecture'}, gameTheory:{type:'Division of Labor Game',note:'Specialization creates interdependence that aligns incentives within bloc'} },
        secondOrderEffects:['Investment inflows surge as bloc establishes critical function within nation','Vulnerability to bloc policy shifts increases with specialization depth','Alternative relationships with opposing bloc become effectively impossible'],
        historicalAnalog:'Taiwan semiconductor role in US-led tech architecture; Netherlands logistics hub in EU; Singapore financial gateway',
        choicePrompt:'With deep specialization established, how does the nation manage the vulnerability that comes with it?',
        choices:['frst-L3-trade-corridors','frst-L4-managed-fragmentation'] },
      'frst-L2-bargaining':{ id:'frst-L2-bargaining', layer:2, type:'decision', title:'Regional Collective Bargaining with Global Blocs', label:'Collective Bargaining',
        narrative:'The regional order negotiates collectively with both major blocs, presenting a unified position on trade terms, technology access, and security arrangements. The collective bargaining power of the regional bloc is substantially higher than any individual member could achieve.',
        lensSnapshot:{ bigCycle:{phase:'Regional Power Emergence',note:'Regional coalitions as structural constraint on major power unilateralism'}, steep:{primary:'P',secondary:'E',note:'Collective political position translates to economic terms improvement'}, geoEcon:{tool:'Alliance Architecture',note:'Regional coalition as bargaining unit with global blocs'}, gameTheory:{type:'Coalition Bargaining Game',note:'Collective bargaining changes payoff structure; major blocs must negotiate'} },
        secondOrderEffects:['Both major blocs offer better terms to avoid regional bloc aligning with rival','Regional solidarity tested when blocs offer better terms to individual defectors','Regional order gains international recognition as legitimate governance actor'],
        historicalAnalog:'EU as collective bargaining unit in WTO; ASEAN centrality in Indo-Pacific architecture; African Union in G20',
        choicePrompt:'With collective bargaining leverage established, what economic architecture does the regional bloc build internally?',
        choices:['frst-L3-regional-currency','frst-L4-managed-fragmentation'] },
      'frst-L3-alt-currency':{ id:'frst-L3-alt-currency', layer:3, type:'decision', title:'Alternative Currency Basket for South-South Trade', label:'Alternative Currency Basket',
        narrative:'A basket of swing-state currencies is established for south-south trade invoicing, reducing dependence on the dollar without committing to any single alternative. The basket processes a growing share of south-south trade outside the dollar system.',
        lensSnapshot:{ bigCycle:{phase:'Monetary System Pluralization',note:'Gradual monetary diversification away from unipolar dollar system'}, steep:{primary:'E',secondary:'P',note:'Monetary architecture as expression of political autonomy'}, geoEcon:{tool:'Currency Manipulation',note:'Alternative invoicing currency as dollar dependency reduction strategy'}, gameTheory:{type:'Coordination Game',note:'Swing states coordinate on monetary alternative; network effects build over time'} },
        secondOrderEffects:['Dollar share of south-south trade falls from 80%+ to 50-60% over a decade','US ability to deploy dollar sanctions reduced against south-south trade','Alternative payment infrastructure requires significant investment'],
        historicalAnalog:'BRICS discussions of alternative currency basket; India-Russia ruble-rupee trade; mBridge CBDC project',
        choicePrompt:'With alternative currency infrastructure developing, how does this reshape geopolitical alignments over the medium term?',
        choices:['frst-L4-multipolar-stagnation','frst-L4-managed-fragmentation'] },
      'frst-L3-trade-corridors':{ id:'frst-L3-trade-corridors', layer:3, type:'decision', title:'New Trade Corridor Investment', label:'Trade Corridors',
        narrative:'Nations invest in new physical trade corridors that bypass the congested and politically contested existing routes: new rail and road connections, deepened port capacity, and cross-regional free trade zones that sit outside the major blocs.',
        lensSnapshot:{ bigCycle:{phase:'Infrastructure Investment Cycle',note:'Physical infrastructure as precondition for new trade architecture'}, steep:{primary:'T',secondary:'E',note:'Infrastructure investment as geopolitical connectivity tool'}, geoEcon:{tool:'Alliance Architecture',note:'Trade corridor investment as geopolitical relationship building'}, gameTheory:{type:'Infrastructure Game',note:'First movers in corridor development gain structural advantage'} },
        secondOrderEffects:['New corridors reduce geographic dependence on choke points controlled by major powers','Investment creates development dividends in corridor nations','Major powers attempt to co-opt or compete with new corridors'],
        historicalAnalog:'Belt and Road Initiative; India-Middle East-Europe corridor; INSTC; PGII',
        choicePrompt:'With new corridors established, how does the nation leverage them for broader geopolitical influence?',
        choices:['frst-L4-multipolar-stagnation','frst-L4-managed-fragmentation'] },
      'frst-L3-regional-currency':{ id:'frst-L3-regional-currency', layer:3, type:'decision', title:'Regional Currency Development', label:'Regional Currency',
        narrative:'The regional bloc develops a common currency or currency coordination mechanism, reducing internal transaction costs and providing a foundation for deeper economic integration. The currency is not a global reserve alternative but serves the regional bloc\'s internal needs.',
        lensSnapshot:{ bigCycle:{phase:'Regional Monetary Integration',note:'Regional currency as bloc cohesion mechanism'}, steep:{primary:'E',secondary:'P',note:'Monetary union as political commitment device'}, geoEcon:{tool:'Currency Manipulation',note:'Regional currency as alternative to dollar dependence within the bloc'}, gameTheory:{type:'Commitment Device',note:'Currency union as credible commitment to regional solidarity'} },
        secondOrderEffects:['Internal bloc trade costs fall dramatically','Regional monetary coordination requires significant institutional investment','Currency crisis within bloc creates collective problem; solidarity tested'],
        historicalAnalog:'Euro as regional currency model; ASEAN discussions; African monetary union proposals; Gulf Cooperation Council monetary union discussions',
        choicePrompt:'With regional currency infrastructure developing, how does this reshape the regional bloc\'s relationship with the global fragmented order?',
        choices:['frst-L4-managed-fragmentation','frst-L4-multipolar-stagnation'] },
      'frst-L4-multipolar-stagnation':{ id:'frst-L4-multipolar-stagnation', layer:4, type:'terminal', title:'Multipolar Stagnation -- New Normal', label:'Multipolar Stagnation',
        narrative:'The fragmented world reaches a new, lower-growth equilibrium. Trade costs remain elevated; technology standards diverge; financial systems remain partially separated. Global growth settles 0.5-1.5 percentage points below what a more integrated world would achieve. The stagnation is permanent and distributed -- no single actor suffers catastrophically, but all are poorer than the alternative.',
        outcome:'MANAGED FRAGMENTATION -- PERMANENT LOW-GROWTH EQUILIBRIUM',
        outcomeNarrative:'The age of fragmented stagnation proves durable. Neither bloc achieves decisive dominance; neither collapses. The world settles into a new normal of higher costs, lower growth, and persistent geopolitical competition. The multilateral institutions that underpinned the post-1945 prosperity architecture are not destroyed -- they are rendered increasingly irrelevant. The loss is measured in the growth that never happened, the problems that were never solved.',
        finalLensScores:{ bigCycle:'Hegemonic Interregnum -- Stable Stagnation', steep:{S:0.5,T:0.6,E:0.8,En:0.5,P:0.9}, geoEcon:'Tariffs -- fragmented trade architecture', gameTheory:"Multi-polar Prisoner's Dilemma -- stable but suboptimal equilibrium" },
        historicalAnalog:'Interwar period 1919-1939; fragmented gold standard; 1930s trade collapse partial analogy',
        aiPromptSeed:'Model how the multipolar stagnation equilibrium eventually breaks down -- whether through a decisive hegemonic winner emerging, a new multilateral architecture forming, or a catastrophic crisis forcing reconvergence -- tracing the mechanisms that could end the stagnation.' },
      'frst-L4-managed-fragmentation':{ id:'frst-L4-managed-fragmentation', layer:4, type:'terminal', title:'Managed Fragmentation with Functional Nodes', label:'Managed Fragmentation',
        narrative:'Rather than either integration or pure fragmentation, the world develops functional node-based architecture: specific domains (climate, pandemics, nuclear security) maintain deep cooperation even as trade and technology fragment. The architecture is uncomfortable and inefficient but prevents the worst outcomes.',
        outcome:'FUNCTIONAL FRAGMENTATION -- ISSUE-SPECIFIC COOPERATION',
        outcomeNarrative:'Managed fragmentation proves more stable than pure stagnation because it maintains cooperation in domains where mutual interest is overwhelming. Climate, pandemic preparedness, and nuclear security maintain multilateral frameworks even as trade and technology fragment. The result is messy -- issue-by-issue negotiation replaces rules-based order -- but the catastrophic outcomes are avoided.',
        finalLensScores:{ bigCycle:'Hegemonic Interregnum -- Functional Managed', steep:{S:0.5,T:0.7,E:0.7,En:0.7,P:0.8}, geoEcon:'Alliance Architecture -- issue-specific cooperation within fragmented world', gameTheory:'Selective Cooperation -- cooperate where mutual interest is dominant; defect where competitive' },
        historicalAnalog:'US-Soviet arms control during Cold War; US-China climate cooperation within strategic competition; G20 as managed fragmentation forum',
        aiPromptSeed:'Model how issue-specific cooperation architecture within a fragmented geopolitical order evolves over time -- particularly whether selective cooperation gradually reconstructs broader multilateral architecture or whether fragmentation in competitive domains gradually erodes even the cooperative ones.' }
    }
  },

  { id:'tech-realignment', cluster:'geoeconomic', title:'Tech-Driven Realignment', era:'2025-2040', timeHorizon:'long', primaryLens:'geoEcon',
    description:'Multiple general-purpose technology breakthroughs -- AI, quantum computing, biotech, fusion energy -- arrive simultaneously, restructuring geopolitical power on technological capability rather than industrial capacity.',
    tags:['AI','quantum computing','biotech','fusion energy','technological leadership','geopolitics'],
    aiPromptContext:'You are simulating the Tech-Driven Realignment. Apply STEEP lens (T overwhelmingly dominant; all other dimensions downstream of technology), Big Cycle (technological phase transition driving new hegemonic cycle), and game theory (technology race dynamics; first-mover advantages; standards wars; technology arms control).',
    rootNodeId:'tdr-L0-trigger',
    nodes:{
      'tdr-L0-trigger':{ id:'tdr-L0-trigger', layer:0, type:'trigger', title:'Multiple Technology Frontiers Break Simultaneously', label:'Technology Convergence',
        narrative:'Within a five-year window, four distinct technological frontiers reach commercial viability simultaneously: AI systems that match or exceed human performance across knowledge work; fault-tolerant quantum computers capable of breaking current encryption; CRISPR-derived biotech enabling precision disease treatment and enhancement; and commercial fusion energy approaching grid parity. No previous moment in history has seen four general-purpose technologies arrive simultaneously. The geopolitical map is being redrawn.',
        lensSnapshot:{ bigCycle:{phase:'Technological Phase Transition',note:'Multiple general-purpose technologies arriving simultaneously; largest productive discontinuity since steam'}, steep:{primary:'T',secondary:'E',note:'Technology the overwhelming primary driver; all other STEEP dimensions responding'}, geoEcon:{tool:'Technological Statecraft',note:'Technology capability as primary geopolitical currency'}, gameTheory:{type:'Technology Race -- Multi-Frontier',note:'Competition across four simultaneous frontiers; first-mover advantages in each'} },
        choicePrompt:'Which technology frontier does the leading nation prioritize for strategic advantage?',
        choices:['tdr-L1-ai','tdr-L1-quantum','tdr-L1-fusion'] },
      'tdr-L1-ai':{ id:'tdr-L1-ai', layer:1, type:'decision', title:'AI Supremacy Strategy -- Compute + Talent + Data', label:'AI Supremacy',
        narrative:'The nation concentrates investment in AI: massive compute infrastructure, aggressive talent recruitment globally, regulatory frameworks optimized for AI deployment speed, and AI-first redesign of government services and military capabilities. The AI lead compounds: superior AI accelerates research in other domains, creating a self-reinforcing cycle of capability advantage.',
        lensSnapshot:{ bigCycle:{phase:'AI-Led Hegemonic Bid',note:'AI as the decisive technology of the new hegemonic cycle'}, steep:{primary:'T',secondary:'E',note:'AI investment dominates capital allocation; economic transformation accelerates'}, geoEcon:{tool:'Technological Statecraft',note:'AI capability as comprehensive national power multiplier'}, gameTheory:{type:'Winner-Take-Most Race',note:'AI lead compounds; falling behind creates accelerating disadvantage'} },
        secondOrderEffects:['AI advantage extends to military, economic, scientific, and diplomatic domains','Nations without AI capacity become structurally dependent on AI leaders','AI governance becomes the critical geopolitical negotiation of the era'],
        historicalAnalog:'No direct precedent; closest is nuclear superiority 1945-1949 or naval power 1890-1914',
        choicePrompt:'With AI supremacy established, how is the AI advantage deployed geopolitically?',
        choices:['tdr-L2-ai-diplomacy','tdr-L2-ai-military'] },
      'tdr-L1-quantum':{ id:'tdr-L1-quantum', layer:1, type:'decision', title:'Quantum Computing Leadership -- Cryptography and Science', label:'Quantum Leadership',
        narrative:'The nation prioritizes fault-tolerant quantum computing: breaking current encryption standards, solving computational problems across drug discovery, materials science, and financial optimization. Quantum supremacy in cryptography alone represents an existential intelligence advantage.',
        lensSnapshot:{ bigCycle:{phase:'Cryptographic Hegemony Bid',note:'Quantum computing breaks the encryption that underpins all digital commerce and security'}, steep:{primary:'T',secondary:'P',note:'Technology capability translates directly into intelligence and security advantage'}, geoEcon:{tool:'Technological Statecraft',note:'Cryptographic advantage as comprehensive intelligence dominance'}, gameTheory:{type:'Encryption Arms Race',note:'Quantum supremacy changes all information security games simultaneously'} },
        secondOrderEffects:['All current encryption infrastructure becomes vulnerable; global cryptographic emergency','Nations with quantum computing can read all legacy encrypted communications','Quantum-safe cryptography development becomes existential priority'],
        historicalAnalog:'Enigma decryption advantage; ECHELON signals intelligence; Stuxnet as cyber weapon',
        choicePrompt:'With quantum decryption capability established, how does the nation leverage this information advantage?',
        choices:['tdr-L2-intel','tdr-L2-post-quantum'] },
      'tdr-L1-fusion':{ id:'tdr-L1-fusion', layer:1, type:'decision', title:'Fusion Energy First -- Energy Independence Architecture', label:'Fusion Energy Leadership',
        narrative:'The nation prioritizes commercial fusion energy: unlimited clean energy at falling costs, ending dependence on fossil fuel imports, negating the energy-based geopolitical leverage of oil and gas exporters, and providing the energy foundation for all other technological ambitions including massive AI compute clusters.',
        lensSnapshot:{ bigCycle:{phase:'Energy Regime Transition',note:'Fusion represents the most fundamental energy transition since coal; geopolitical map restructured'}, steep:{primary:'T',secondary:'En',note:'Technology breakthrough enables environmental transformation'}, geoEcon:{tool:'Resource Nationalism',note:'Fusion eliminates fossil fuel dependence; reverses energy geopolitics entirely'}, gameTheory:{type:'Energy Abundance Game',note:'Fusion creates energy abundance; scarcity-based energy leverage eliminated'} },
        secondOrderEffects:['Oil and gas exporters face catastrophic demand destruction','Energy-importing nations gain complete energy independence','Fusion energy provides foundation for massive AI compute and industrial expansion'],
        historicalAnalog:'Shale revolution changed US energy independence; fusion would be permanent, not cyclical',
        choicePrompt:'With fusion energy operational, how does the nation leverage its energy abundance advantage?',
        choices:['tdr-L2-petrostates','tdr-L2-ai-military'] },
      'tdr-L2-ai-diplomacy':{ id:'tdr-L2-ai-diplomacy', layer:2, type:'decision', title:'AI Diplomacy -- Technology Access as Diplomatic Tool', label:'AI Diplomacy',
        narrative:'AI capabilities are leveraged diplomatically: allied nations receive AI tools for governance, agriculture, healthcare, and education; adversarial nations face AI export controls. Technology access becomes the new foreign aid, the new security guarantee, and the new conditionality mechanism -- all simultaneously.',
        lensSnapshot:{ bigCycle:{phase:'Technology-Led Hegemony',note:'AI diplomacy as the 21st century equivalent of security guarantees and economic aid'}, steep:{primary:'T',secondary:'P',note:'Technology capability translates directly into diplomatic influence'}, geoEcon:{tool:'Alliance Architecture',note:'AI access as diplomatic currency'}, gameTheory:{type:'Patron-Client Game',note:'Technology patron and technology client relationship; new form of dependency'} },
        secondOrderEffects:['Nations choose AI alignment based on technology access, not ideology','AI capabilities become the measure of geopolitical alignment','Developing nations face dependency on AI providers for critical government functions'],
        historicalAnalog:'US nuclear umbrella; Soviet satellite system development assistance; Chinese Belt and Road as infrastructure diplomacy',
        choicePrompt:'With AI diplomacy establishing technology-based alliances, how are the new alignment relationships institutionalized?',
        choices:['tdr-L3-tech-treaty','tdr-L4-allied-governance'] },
      'tdr-L2-ai-military':{ id:'tdr-L2-ai-military', layer:2, type:'decision', title:'AI Military Advantage -- Autonomous Weapons and ISR', label:'AI Military Dominance',
        narrative:'AI capability is converted into military dominance: autonomous weapons systems, AI-enhanced intelligence surveillance and reconnaissance, AI-driven cyber operations, and AI-optimized logistics. The military gap between AI-advanced and AI-laggard nations becomes as large as the nuclear gap was in 1950.',
        lensSnapshot:{ bigCycle:{phase:'Military Technology Revolution',note:'AI as revolutionary military technology; changes balance of power permanently'}, steep:{primary:'T',secondary:'P',note:'Technology creates military dominance; political consequences global'}, geoEcon:{tool:'Military Statecraft',note:'AI-enabled military dominance as geopolitical lever'}, gameTheory:{type:'Security Dilemma',note:'AI military investment by one triggers investment by others; arms race dynamic'} },
        secondOrderEffects:['Arms race in AI military capabilities begins immediately','Smaller nations permanently outclassed; seek AI patron-state protection','Autonomous weapons ethics create domestic and international governance crisis'],
        historicalAnalog:'Nuclear arms race 1945-1990; drone warfare revolution 2000s; no direct precedent for AI military dominance',
        choicePrompt:'With AI military advantage established, how is the technology governed to prevent catastrophic misuse?',
        choices:['tdr-L3-tech-treaty','tdr-L4-allied-governance'] },
      'tdr-L2-intel':{ id:'tdr-L2-intel', layer:2, type:'decision', title:'Quantum-Enabled Intelligence Dominance', label:'Intelligence Dominance',
        narrative:'The quantum decryption capability is deployed for comprehensive intelligence collection: diplomatic communications, military planning, financial transactions, and personal communications of global leaders are all readable. The intelligence advantage is total -- temporarily. But maintaining the advantage requires preventing the world from transitioning to post-quantum cryptography.',
        lensSnapshot:{ bigCycle:{phase:'Intelligence Hegemony',note:'Comprehensive intelligence access represents total information dominance'}, steep:{primary:'T',secondary:'P',note:'Technology creates information dominance; political consequences global'}, geoEcon:{tool:'Technological Statecraft',note:'Intelligence advantage as comprehensive foreign policy tool'}, gameTheory:{type:'Information Asymmetry -- Extreme',note:'One player has perfect information; all others playing blind'} },
        secondOrderEffects:['If discovered, quantum decryption capability triggers global cryptographic emergency','Intelligence advantage enables anticipation and neutralization of rival actions','All allies become informants against each other as communications are compromised'],
        historicalAnalog:'ULTRA secret in WWII; NSA bulk collection exposed by Snowden; signals intelligence as strategic asset',
        choicePrompt:'With quantum intelligence dominance but the risk of discovery, how is the advantage leveraged?',
        choices:['tdr-L3-tech-treaty','tdr-L4-allied-governance'] },
      'tdr-L2-post-quantum':{ id:'tdr-L2-post-quantum', layer:2, type:'decision', title:'Post-Quantum Cryptography Migration', label:'Post-Quantum Migration',
        narrative:'Rather than exploiting quantum decryption secretly, the nation leads an international post-quantum cryptography migration: transitioning all critical systems to quantum-resistant encryption standards before adversaries develop quantum decryption capability. The choice sacrifices short-term intelligence advantage for long-term security architecture.',
        lensSnapshot:{ bigCycle:{phase:'Proactive Security Architecture',note:'Sacrificing current advantage to prevent catastrophic future vulnerability'}, steep:{primary:'T',secondary:'P',note:'Technology migration as security policy'}, geoEcon:{tool:'Technological Statecraft',note:'Setting post-quantum standards as geopolitical influence tool'}, gameTheory:{type:'Long-Term Security Investment',note:'Accept short-term cost to avoid catastrophic long-term vulnerability'} },
        secondOrderEffects:['Nations that migrate first have most secure communications architecture','Laggard nations face cryptographic vulnerability window','Standard-setting process creates geopolitical influence'  ],
        historicalAnalog:'NIST post-quantum cryptography standardization 2024; NATO quantum-safe communications investment',
        choicePrompt:'With post-quantum migration underway, how does the nation leverage its cryptographic leadership diplomatically?',
        choices:['tdr-L3-tech-treaty','tdr-L4-allied-governance'] },
      'tdr-L2-petrostates':{ id:'tdr-L2-petrostates', layer:2, type:'decision', title:'Managing Petrostate Collapse From Fusion Disruption', label:'Petrostate Transition',
        narrative:"Fusion energy's commercial deployment begins destroying the economic foundation of petrostates. Oil demand collapses; prices fall below production costs. Nations whose entire development model depends on hydrocarbon revenues face existential economic crisis. The stability risk is enormous -- state failure in major oil producers would create global security crises.",
        lensSnapshot:{ bigCycle:{phase:'Energy Order Collapse',note:'Petrodollar system and OPEC architecture destroyed by fusion; geopolitical map restructured'}, steep:{primary:'E',secondary:'P',note:'Economic model destruction; political instability in petrostates'}, geoEcon:{tool:'Resource Nationalism',note:'Resource nationalism loses relevance as the resource loses value'}, gameTheory:{type:'Transition Game',note:'Petrostates must transform or fail; energy consumers must manage the transition'} },
        secondOrderEffects:['Saudi Arabia, UAE, Russia, Iran face fiscal collapse within a decade of commercial fusion','Petrostate instability creates migration crises, conflict risk, and nuclear proliferation pressure','US Petrodollar system collapses; dollar reserve status must find new anchor'],
        historicalAnalog:'North Sea oil decline; Soviet collapse partly driven by oil price fall 1986; Venezuela oil price dependence',
        choicePrompt:'With petrostates facing existential economic crisis, what strategic response does the fusion-powered nation take?',
        choices:['tdr-L3-transition-fund','tdr-L4-failed-states'] },
      'tdr-L3-tech-treaty':{ id:'tdr-L3-tech-treaty', layer:3, type:'decision', title:'Technology Alliance Treaty', label:'Technology Alliance',
        narrative:'A formal technology alliance is established among nations with advanced AI capability: shared research, coordinated export controls toward non-members, joint safety standards, and mutual access to compute infrastructure. The alliance becomes the organizing principle of the new global order -- technology capability replacing industrial capacity as the measure of great power status.',
        lensSnapshot:{ bigCycle:{phase:'Technology Hegemonic Bloc Formation',note:'New alliance system organized around technology capability'}, steep:{primary:'T',secondary:'P',note:'Technology alliance as the defining geopolitical structure of the era'}, geoEcon:{tool:'Alliance Architecture',note:'Technology access as alliance membership benefit'}, gameTheory:{type:'Club Good',note:'Alliance members share technology benefits; non-members excluded from innovation ecosystem'} },
        secondOrderEffects:['Nations outside the technology alliance face permanent capability disadvantage','Alliance members face collective security obligations extending into cyber and AI domains','Technology standards set by alliance become de facto global standards'],
        historicalAnalog:'NATO as technology-security alliance; Five Eyes as intelligence alliance; proposed Technology Alliance proposals',
        choicePrompt:'With the technology alliance established, how does it govern the most dangerous AI capabilities?',
        choices:['tdr-L4-allied-governance','tdr-L4-competitive-deployment'] },
      'tdr-L3-transition-fund':{ id:'tdr-L3-transition-fund', layer:3, type:'decision', title:'Global Petrostate Transition Fund', label:'Transition Fund',
        narrative:'The fusion-powered nation leads creation of a Global Energy Transition Fund that provides economic diversification support to petrostates facing demand destruction. The fund is motivated by both humanitarian concern and strategic interest: stable petrostates are preferable to failed states with nuclear weapons.',
        lensSnapshot:{ bigCycle:{phase:'Transition Management',note:'Orderly petrostate transition preferable to disorderly collapse'}, steep:{primary:'E',secondary:'P',note:'Economic transition support prevents political instability'}, geoEcon:{tool:'Alliance Architecture',note:'Transition fund as foreign policy tool'}, gameTheory:{type:'Stabilization Game',note:'Investor in stability to avoid costly instability'} },
        secondOrderEffects:['Petrostate fiscal collapse slowed by transition support','Economic diversification begins in most adaptable states','Nuclear proliferation risk from desperate petrostates reduced'],
        historicalAnalog:'Marshall Plan for Europe; USAID economic development; World Bank transition economy support',
        choicePrompt:'With transition support deployed, which petrostates successfully diversify and which fail?',
        choices:['tdr-L4-diversification','tdr-L4-failed-states'] },
      'tdr-L4-allied-governance':{ id:'tdr-L4-allied-governance', layer:4, type:'terminal', title:'Allied AI Governance Architecture', label:'Allied AI Governance',
        narrative:'The technology alliance develops comprehensive AI governance: shared capability evaluation protocols, coordinated deployment standards, joint safety research, and a collective decision framework for AI systems that could affect global security.',
        outcome:'TECHNOLOGY-LED ORDER WITH GOVERNANCE ARCHITECTURE',
        outcomeNarrative:'The Tech-Driven Realignment produces a new world order organized around technological capacity, governed by a technology alliance that sets the rules for the most transformative capabilities in history. The order is more stable than hegemonic competition without governance, less equitable than a genuinely multilateral system. But it manages to deploy transformative technology without catastrophic misuse.',
        finalLensScores:{ bigCycle:'New Technological Hegemonic Cycle', steep:{S:0.5,T:1.0,E:0.8,En:0.6,P:0.9}, geoEcon:'Technological Statecraft -- alliance-governed order', gameTheory:'Cooperative Game Within Alliance -- competitive toward non-members' },
        historicalAnalog:'US-led liberal international order post-1945; NATO nuclear sharing; IAEA nuclear governance',
        aiPromptSeed:"Model how the technology alliance's AI governance architecture handles the emergence of AGI-level capabilities, particularly the governance questions around AI systems that exceed human performance across all domains." },
      'tdr-L4-competitive-deployment':{ id:'tdr-L4-competitive-deployment', layer:4, type:'terminal', title:'Competitive Technology Deployment -- Arms Race', label:'Technology Arms Race',
        narrative:'Without adequate governance architecture, technology capabilities are deployed competitively: AI weapons systems are deployed without safety standards; quantum capabilities are used for covert intelligence; biotech is weaponized. The tech-driven realignment produces a world of unprecedented capability and unprecedented danger.',
        outcome:'TECHNOLOGY ARMS RACE -- CATASTROPHIC RISK ACCUMULATION',
        outcomeNarrative:'The failure to establish governance architecture for transformative technologies produces the most dangerous security environment in history. Each nation deploys capabilities to maximize competitive advantage; none internalizes the collective risk of the arms race. The world is materially advanced but existentially fragile -- a single miscalculation with AI weapons, a quantum-enabled intelligence failure, or a biotech release could cascade catastrophically.',
        finalLensScores:{ bigCycle:'Hegemonic Competition -- Unconstrained', steep:{S:0.6,T:1.0,E:0.7,En:0.5,P:1.0}, geoEcon:'Technological Statecraft -- unrestrained competition', gameTheory:'Arms Race -- suboptimal competitive equilibrium with catastrophic tail risk' },
        historicalAnalog:'Nuclear arms race without arms control; biological weapons development without convention; cyber warfare without norms',
        aiPromptSeed:'Model how a technology arms race without governance architecture evolves over 10 years, focusing on the probability and mechanisms of catastrophic outcomes from AI weapons deployment, quantum intelligence failures, and engineered pandemic risks.' },
      'tdr-L4-diversification':{ id:'tdr-L4-diversification', layer:4, type:'terminal', title:'Successful Petrostate Economic Diversification', label:'Petrostate Diversification',
        narrative:'With transition fund support and genuine political will, several petrostates successfully diversify: UAE and Saudi Arabia leverage sovereign wealth to become technology and tourism hubs; the Gulf states build genuine industrial bases. The energy transition is managed rather than catastrophic.',
        outcome:'MANAGED ENERGY TRANSITION -- DIVERSIFICATION SUCCESS',
        outcomeNarrative:'The fusion energy revolution destroys the petrodollar system but does not destroy the petrostates themselves. Those with sufficient wealth, governance capacity, and political will to invest in diversification during the hydrocarbon era successfully transition to new economic models. The energy geopolitical map is fundamentally redrawn -- but without the catastrophic instability that unmanaged petrostate collapse would have caused.',
        finalLensScores:{ bigCycle:'Energy Transition -- New Economic Cycle', steep:{S:0.5,T:0.9,E:0.8,En:0.9,P:0.7}, geoEcon:'Resource Nationalism -- Technological Diversification', gameTheory:'Cooperative Transition Game -- transition fund creates positive-sum outcome' },
        historicalAnalog:'UAE Vision 2021/2031; Saudi Vision 2030; Norway Government Pension Fund model',
        aiPromptSeed:'Model how successfully diversified former petrostates position themselves in the new tech-driven world order, particularly their relationship to the technology alliance and their domestic AI development trajectories.' },
      'tdr-L4-failed-states':{ id:'tdr-L4-failed-states', layer:4, type:'terminal', title:'Petrostate Failure Cascade', label:'Petrostate Collapse',
        narrative:'States that cannot diversify face fiscal collapse as oil revenues evaporate. Several major oil producers experience state failure: loss of territory control, inability to pay security forces, political fragmentation. The most dangerous outcome: nuclear weapons in states with collapsing central authority.',
        outcome:'PETROSTATE FAILURE CASCADE -- NUCLEAR PROLIFERATION RISK',
        outcomeNarrative:'The fusion revolution unmanaged consequences cascade into the most dangerous security crisis in decades: multiple state failures among nuclear-armed or nuclear-adjacent petrostates. The technology triumph produces a security catastrophe. The fusion-powered world is materially abundant but geopolitically more dangerous than the oil-dependent world it replaced.',
        finalLensScores:{ bigCycle:'Energy Transition -- Security Crisis', steep:{S:0.8,T:0.9,E:0.7,En:0.7,P:1.0}, geoEcon:'Resource Nationalism -- collapse of resource-dependent states', gameTheory:'Unintended Consequence -- technological victory creates security defeat' },
        historicalAnalog:'Soviet collapse and nuclear security; Libya post-intervention; Venezuela progressive state failure',
        aiPromptSeed:'Model the nuclear security crisis created by petrostate state failure in the fusion era -- specifically the challenge of securing nuclear materials and preventing proliferation when central authority collapses in uranium-rich or nuclear-armed former petrostates.' }
    }
  },

  { id:'cislunar-geopolitics', cluster:'geoeconomic', title:'Cislunar Geopolitics & The New Commons', era:'2030-2050', timeHorizon:'long', primaryLens:'geoEcon',
    description:'Commercial and national space capabilities expand to the Moon and cislunar space, creating new domains for resource competition, military posture, and governance disputes with no established legal framework.',
    tags:['space','cislunar','moon','rare minerals','space law','dual use','new commons'],
    aiPromptContext:'You are simulating Cislunar Geopolitics. Apply Big Cycle lens (expansion of the productive frontier into space; new resource competition); GeoEconomics (resource nationalism in space; absence of property rights framework); STEEP (T dominant; En new dimension: space environment); and game theory (commons governance problem; first-mover advantage in resource extraction; security dilemma in cislunar space).',
    rootNodeId:'cis-L0-trigger',
    nodes:{
      'cis-L0-trigger':{ id:'cis-L0-trigger', layer:0, type:'trigger', title:'Commercial Lunar Operations and Resource Claims Begin', label:'Lunar Operations',
        narrative:'2032: The first permanently crewed lunar outpost is established by a US-allied commercial-government partnership. Within two years, a Chinese National Space Administration facility is operational at a different lunar location. Both have begun identifying and accessing helium-3 deposits, water ice at the poles, and rare earth mineral concentrations. The 1967 Outer Space Treaty prohibits national appropriation of celestial bodies but says nothing coherent about resource extraction by commercial entities. There is no cislunar traffic management system, no agreed property rights regime, and no conflict prevention mechanism.',
        lensSnapshot:{ bigCycle:{phase:'Frontier Expansion',note:'Space represents the expansion of the productive frontier; new resource base for next cycle'}, steep:{primary:'T',secondary:'P',note:'Technology enables new domain; governance lags far behind capability'}, geoEcon:{tool:'Resource Nationalism',note:'Resource extraction in space before governance framework established'}, gameTheory:{type:'Commons Governance -- Nascent',note:'Classic commons problem: unregulated access leads to overexploitation and conflict'} },
        choicePrompt:'How does the leading space power approach cislunar governance?',
        choices:['cis-L1-unilateral','cis-L1-multilateral','cis-L1-allied'] },
      'cis-L1-unilateral':{ id:'cis-L1-unilateral', layer:1, type:'decision', title:'Unilateral Resource Claims -- First-Mover Advantage', label:'Unilateral Claims',
        narrative:'The leading space power establishes zones of economic control around its lunar facilities, asserting the right to extract and own resources extracted from defined areas. The Artemis Accords are cited as legal basis. China rejects the framework. The unilateral approach maximizes resource access for the claiming nation but creates an ungoverned domain where conflict could emerge.',
        lensSnapshot:{ bigCycle:{phase:'Resource Frontier Claim',note:'First-mover appropriation of new resource domain; historical pattern repeated in space'}, steep:{primary:'P',secondary:'T',note:'Political claims in new domain; technology enables extraction'}, geoEcon:{tool:'Resource Nationalism',note:'Resource appropriation in absence of governing framework'}, gameTheory:{type:'Land Rush',note:'First-mover claims create facts on the ground; rivals must respond or accept exclusion'} },
        secondOrderEffects:['Rival powers establish competing claims; no adjudication mechanism exists','Commercial space firms rush to claim areas before rivals','Military cislunar capabilities develop rapidly to protect economic claims'],
        historicalAnalog:'Antarctic land claims; Law of the Sea negotiations; colonial-era resource extraction',
        choicePrompt:'With competing unilateral claims and no governance mechanism, how is the conflict risk managed?',
        choices:['cis-L2-exclusion','cis-L2-negotiation'] },
      'cis-L1-multilateral':{ id:'cis-L1-multilateral', layer:1, type:'decision', title:'Propose Multilateral Cislunar Governance Framework', label:'Multilateral Framework',
        narrative:'The leading space power proposes a multilateral framework for cislunar governance: common traffic management, resource rights allocation rules, environmental protection zones, and a dispute resolution mechanism. China and Russia are included in the negotiation -- making agreement difficult but making any resulting framework genuinely binding.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation -- Space',note:'Building governance architecture before conflict rather than after'}, steep:{primary:'P',secondary:'T',note:'Political will for governance before military competition entrenches'}, geoEcon:{tool:'Alliance Architecture',note:'Multilateral space governance as conflict prevention'}, gameTheory:{type:'Institution Building',note:'Early governance architecture prevents path dependency toward conflict'} },
        secondOrderEffects:['Negotiation is slow; commercial activities proceed without resolution','Both space powers develop military cislunar capabilities as leverage during negotiations','Agreement, if reached, sets precedent for governance of all future space resources'],
        historicalAnalog:'Law of the Sea negotiations 1973-1982; Antarctic Treaty System; International Space Station cooperation',
        choicePrompt:'With multilateral negotiations underway, how are the major sticking points on resource rights resolved?',
        choices:['cis-L2-negotiation','cis-L3-space-treaty'] },
      'cis-L1-allied':{ id:'cis-L1-allied', layer:1, type:'decision', title:'Allied Space Coalition -- Artemis Accords Expanded', label:'Allied Coalition',
        narrative:'The leading space power deepens the Artemis Accords coalition: more nations sign, binding norms on resource extraction are established among members, joint exploration programs are launched, and coordinated commercial investment follows. The allied approach creates a de facto governance framework for half the world even without universal agreement.',
        lensSnapshot:{ bigCycle:{phase:'Allied Frontier Expansion',note:'Hegemonic bloc expands into space; rival establishes competing presence'}, steep:{primary:'T',secondary:'P',note:'Technology cooperation within alliance; political rivalry with non-member bloc'}, geoEcon:{tool:'Alliance Architecture',note:'Allied space framework as extension of broader geopolitical competition'}, gameTheory:{type:'Club Good',note:'Artemis Accords benefits: access to allied space infrastructure in exchange for rule compliance'} },
        secondOrderEffects:['Rival bloc establishes competing cislunar framework','Nations must choose between frameworks or remain uncommitted','Allied framework becomes de facto standard for commercial space operations'],
        historicalAnalog:'Artemis Accords bilateral agreements; US-Japan space cooperation; Five Eyes intelligence cooperation as model',
        choicePrompt:'With allied space coalition operating but rival bloc establishing competing framework, how are overlapping claims managed?',
        choices:['cis-L2-exclusion','cis-L2-negotiation'] },
      'cis-L2-exclusion':{ id:'cis-L2-exclusion', layer:2, type:'decision', title:'Cislunar Exclusion Zones -- Military Deterrence', label:'Exclusion Zones',
        narrative:'Both blocs establish cislunar exclusion zones: areas around lunar facilities where other powers\' spacecraft are subject to interdiction. Military cislunar capabilities -- dual-use logistics platforms with weapons capability -- are deployed. A cislunar deterrence architecture emerges by default rather than by design.',
        lensSnapshot:{ bigCycle:{phase:'Space Militarization',note:'Military capability in new domain follows economic competition; historical pattern repeated'}, steep:{primary:'T',secondary:'P',note:'Technology enables military cislunar; political decision to deploy'}, geoEcon:{tool:'Military Statecraft',note:'Military presence as property rights enforcement in ungoverned domain'}, gameTheory:{type:'Security Dilemma -- Space',note:'Each bloc militarizes in response to rival; both end up less secure'} },
        secondOrderEffects:['Risk of incident in cislunar space creating crisis much higher','Commercial space operations face insurance costs reflecting military risk','Arms control negotiations become urgent but difficult in contested environment'],
        historicalAnalog:'Maritime exclusion zones; Antarctic militarization prohibition; space military capability development',
        choicePrompt:'With military cislunar capabilities deployed and deterrence fragile, what crisis prevention architecture is established?',
        choices:['cis-L3-hotline','cis-L4-space-conflict'] },
      'cis-L2-negotiation':{ id:'cis-L2-negotiation', layer:2, type:'decision', title:'Commercial Rights Negotiation -- De Facto Resource Framework', label:'Commercial Negotiation',
        narrative:'Rather than comprehensive governance, a practical commercial framework emerges: large commercial operators from both blocs negotiate operating agreements, resource zone boundaries, and traffic management protocols. The framework is informal, incomplete, and has no legal standing -- but it works well enough to avoid immediate conflict.',
        lensSnapshot:{ bigCycle:{phase:'Commercial Frontier Development',note:'Commercial interests drive practical governance before political agreement'}, steep:{primary:'E',secondary:'T',note:'Economic interests drive pragmatic arrangements; technology enables monitoring'}, geoEcon:{tool:'Alliance Architecture',note:'Commercial diplomacy as substitute for formal governance'}, gameTheory:{type:'Repeated Game -- Commercial Cooperation',note:'Commercial actors cooperate because conflict is expensive; mutual benefit maintains arrangement'} },
        secondOrderEffects:['De facto norms emerge through practice rather than formal agreement','Framework lacks enforcement mechanism; breaks down under political stress','Commercial space industry gains significant political influence through demonstrated governance capacity'],
        historicalAnalog:'Merchant law of the sea before formal treaties; commercial airline traffic management; ICANN as commercial internet governance',
        choicePrompt:'With commercial framework functioning but fragile, how is it formalized before political tension breaks it?',
        choices:['cis-L3-space-treaty','cis-L4-space-governance'] },
      'cis-L3-hotline':{ id:'cis-L3-hotline', layer:3, type:'decision', title:'Cislunar Hotline and Incident Prevention', label:'Cislunar Hotline',
        narrative:'Following a near-miss incident between rival cislunar spacecraft, both blocs establish a direct communication channel (cislunar hotline) and incident prevention protocols: mandatory notification of cislunar maneuvers, agreed exclusion zones around active operations, and a joint accident investigation mechanism.',
        lensSnapshot:{ bigCycle:{phase:'Crisis Stabilization',note:'Incident prevention architecture reduces risk of accidental escalation'}, steep:{primary:'P',secondary:'T',note:'Political agreement enables technology-supported monitoring'}, geoEcon:{tool:'Alliance Architecture',note:'Crisis prevention mechanism as foundation for broader cooperation'}, gameTheory:{type:'Crisis Stability Game',note:'Hotline reduces misperception risk; both sides prefer stability over accident'} },
        secondOrderEffects:['Risk of accidental escalation reduced substantially','Framework creates template for broader cislunar governance negotiations','Near-miss incident creates political will that theoretical risk did not'],
        historicalAnalog:'US-Soviet hotline after Cuban Missile Crisis; Incidents at Sea Agreement 1972; nuclear risk reduction centers',
        choicePrompt:'With crisis prevention in place, does this stabilize cislunar competition or merely manage it?',
        choices:['cis-L4-space-governance','cis-L4-space-conflict'] },
      'cis-L3-space-treaty':{ id:'cis-L3-space-treaty', layer:3, type:'decision', title:'Cislunar Space Treaty Negotiation', label:'Space Treaty',
        narrative:'A formal cislunar treaty is negotiated: property rights framework, traffic management, environmental protection zones for scientifically important areas, and a dispute resolution mechanism. The treaty is modeled on the Law of the Sea Convention -- comprehensive, legitimating, and imperfectly enforced.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Architecture -- Space',note:'Governance innovation for new domain; historical precedent in maritime law'}, steep:{primary:'P',secondary:'T',note:'Political agreement creates governance framework for technology domain'}, geoEcon:{tool:'Alliance Architecture',note:'Treaty as multilateral governance architecture for space'}, gameTheory:{type:'Cooperative Game -- Treaty',note:'Both sides accept constraints to avoid worse outcome of unconstrained competition'} },
        secondOrderEffects:['Commercial space investment surges as legal clarity provided','Framework tested by technological developments it did not anticipate','Treaty becomes precedent for governance of other new commons (deep sea, polar regions, Arctic)'],
        historicalAnalog:'UNCLOS Law of the Sea Convention 1982; Antarctic Treaty System 1959; Outer Space Treaty 1967',
        choicePrompt:'With treaty framework established, how does it handle the first major resource extraction dispute?',
        choices:['cis-L4-space-governance','cis-L4-space-conflict'] },
      'cis-L4-space-governance':{ id:'cis-L4-space-governance', layer:4, type:'terminal', title:'Functional Cislunar Governance Architecture', label:'Space Governance',
        narrative:'The cislunar governance framework -- whether formal treaty or de facto commercial arrangement -- proves functional: resource rights are allocated, conflicts are adjudicated, and the new commons is managed without catastrophic conflict. The Moon becomes an economically productive extension of the terrestrial economy.',
        outcome:'FUNCTIONAL SPACE GOVERNANCE -- NEW COMMONS ESTABLISHED',
        outcomeNarrative:'Cislunar space develops as a managed commons: messy, imperfect, and contested, but functional. The helium-3 deposits enable fusion energy at scale; water ice enables cislunar habitation; rare earth access reduces terrestrial mining pressure. The governance framework that seemed impossible to negotiate becomes the foundation for the next stage of human expansion into the solar system.',
        finalLensScores:{ bigCycle:'Frontier Expansion -- New Productive Domain', steep:{S:0.4,T:1.0,E:0.7,En:0.6,P:0.8}, geoEcon:'Alliance Architecture -- space commons governance', gameTheory:'Cooperative Game -- commons governed without tragedy' },
        historicalAnalog:'UNCLOS functional governance of ocean resources; Antarctic Treaty functional preservation; ISS as cooperation model',
        aiPromptSeed:'Model how cislunar space governance architecture evolves as capabilities extend to Mars, the asteroid belt, and the outer solar system -- particularly whether the governance precedents established in cislunar space scale to interplanetary resource competition.' },
      'cis-L4-space-conflict':{ id:'cis-L4-space-conflict', layer:4, type:'terminal', title:'Cislunar Military Confrontation', label:'Space Conflict',
        narrative:'The absence of governance architecture leads to the first armed conflict in cislunar space. A dispute over a helium-3 extraction zone escalates from electronic jamming to physical interdiction to kinetic exchange. No one dies -- yet -- but the incident permanently changes the security architecture of near-Earth space.',
        outcome:'FIRST CISLUNAR MILITARY CONFRONTATION',
        outcomeNarrative:'The first cislunar armed confrontation does not trigger a catastrophic war but permanently militarizes the space environment. Both sides accelerate military cislunar capabilities; commercial space insurance becomes unavailable; the governance negotiations that were proceeding slowly are now proceeding urgently. The conflict, limited in itself, accelerates the architecture of space militarization that rational design would have avoided.',
        finalLensScores:{ bigCycle:'Frontier Conflict -- Historical Pattern Repeated', steep:{S:0.5,T:0.9,E:0.6,En:0.4,P:1.0}, geoEcon:'Military Statecraft -- space conflict as resource competition', gameTheory:'Security Dilemma Realized -- arms race produces the conflict it was designed to prevent' },
        historicalAnalog:'First naval battles in contested maritime zones; early air power confrontations; cyber conflict as most recent new domain militarization',
        aiPromptSeed:'Model how the first cislunar military confrontation reshapes space law, military doctrine for cislunar operations, and the commercial space industry -- tracing whether the incident accelerates governance agreement or entrenches militarized competition.' }
    }
  },

  // ── CLUSTER D: AI & TECH DISRUPTION ─────────────────────────────────────

  { id:'ai-open-source-shock', cluster:'ai-tech', title:'Unpredictable Advanced AI (The Open-Source Shock)', era:'2025-2032', timeHorizon:'medium', primaryLens:'steep',
    description:'Highly capable but unpredictable open-source AI models are released publicly, democratizing both beneficial and malicious applications in ways that overwhelm governance architectures.',
    tags:['AI','open source','cybersecurity','governance','dual-use','autonomous systems'],
    aiPromptContext:'You are simulating the Open-Source AI Shock scenario. Apply STEEP lens (T dominant; S, P, E secondary), Big Cycle (technological phase transition), and game theory (public goods problem: AI safety requires collective action; individual actor incentives favor rapid deployment; tragedy of the commons dynamic).',
    rootNodeId:'aios-L0-trigger',
    nodes:{
      'aios-L0-trigger':{ id:'aios-L0-trigger', layer:0, type:'trigger', title:'Highly Capable Open-Source AI Models Released', label:'Open-Source AI Release',
        narrative:'A major AI laboratory releases a frontier-capability model under an open-source license, citing democratization of AI access. Within months, multiple nation-states, criminal organizations, and independent researchers have fine-tuned the model for specialized purposes -- some beneficial, many harmful. The model capabilities exceed any previous open-source release. Existing governance frameworks, designed for slower deployment cycles, cannot adapt quickly enough.',
        lensSnapshot:{ bigCycle:{phase:'Technological Phase Transition',note:'AI as general-purpose technology triggering new productive paradigm'}, steep:{primary:'T',secondary:'P',note:'Technology release drives immediate political governance crisis'}, geoEcon:{tool:'Export Controls',note:'Open-source release renders technology controls largely ineffective'}, gameTheory:{type:'Tragedy of the Commons',note:'Individual benefit from release; collective cost from misuse; no mechanism to internalize harms'} },
        choicePrompt:'How do decentralized actors primarily use the newly available AI capabilities?',
        choices:['aios-L1-malicious','aios-L1-beneficial','aios-L1-mixed'] },
      'aios-L1-malicious':{ id:'aios-L1-malicious', layer:1, type:'decision', title:'Malicious Actors Dominate Initial Deployment', label:'Malicious Use Wave',
        narrative:'Criminal organizations, state-sponsored hackers, and extremist groups move faster than researchers. AI-powered cyberattacks on critical infrastructure surge; deepfake disinformation at unprecedented scale floods information ecosystems; autonomous fraud systems operate at speeds no human team can counter.',
        lensSnapshot:{ bigCycle:{phase:'Technological Disruption -- Destabilizing',note:'Technology arriving faster than institutional adaptation capacity'}, steep:{primary:'T',secondary:'S',note:'Technology-enabled harm; social trust systems collapsing'}, geoEcon:{tool:'Sanctions',note:'Cyber attacks as economic warfare; attribution difficulties prevent retaliation'}, gameTheory:{type:'Attacker Advantage',note:'Open-source models give attackers same capabilities as defenders'} },
        secondOrderEffects:['Critical infrastructure attacks increase 300%+ from AI-enhanced capabilities','Insurance markets price out cyber coverage for most businesses','Public trust in digital systems collapses; digital economy contracts'],
        historicalAnalog:'No direct precedent; closest analogy is early internet worm proliferation scaled by AI capability',
        choicePrompt:'As AI-driven cyberattacks surge, how do governments respond to the security crisis?',
        choices:['aios-L2-crackdown','aios-L2-treaty'] },
      'aios-L1-beneficial':{ id:'aios-L1-beneficial', layer:1, type:'decision', title:'Beneficial Innovation Wave Dominates', label:'Beneficial Innovation',
        narrative:'Researchers, medical institutions, materials scientists, and climate technologists leverage the open-source model for breakthroughs that proprietary systems would have kept gated. A new vaccine for a resistant pathogen; a novel battery chemistry; structural discoveries in protein folding. The benefits are concentrated in science-capable institutions while the harms, though real, are manageable.',
        lensSnapshot:{ bigCycle:{phase:'Technological Prosperity Entry',note:'General-purpose technology driving productivity expansion'}, steep:{primary:'T',secondary:'E',note:'Technology-driven productivity gains materialize faster than expected'}, geoEcon:{tool:'Alliance Architecture',note:'Open-source models favor innovation in allied open societies'}, gameTheory:{type:'Public Goods -- Positive',note:'Open-source creates positive externalities; knowledge spillovers benefit all'} },
        secondOrderEffects:['Scientific progress in medicine and materials accelerates by 5-10 years','Economic productivity gains begin to materialize in 3-5 years','Nations that restrict AI access fall behind in scientific capacity'],
        historicalAnalog:'Internet-era scientific communication; open-source software development; early web browser release',
        choicePrompt:'With beneficial innovation accelerating, how does society manage rapid integration into critical systems?',
        choices:['aios-L2-rapid','aios-L2-tiered'] },
      'aios-L1-mixed':{ id:'aios-L1-mixed', layer:1, type:'decision', title:'Mixed Deployment -- Benefits and Harms Simultaneous', label:'Mixed Outcomes',
        narrative:'Reality defies binary framing: beneficial and harmful uses proliferate simultaneously. Scientific breakthroughs are announced the same week as major AI-enabled cyberattacks. The governance challenge is distinguishing, in real time, which applications warrant restriction and which deserve acceleration.',
        lensSnapshot:{ bigCycle:{phase:'Technological Disruption -- Ambiguous',note:'Net impact unclear; depends on governance quality and adaptation speed'}, steep:{primary:'T',secondary:'P',note:'Technology ambivalence creates governance crisis'}, geoEcon:{tool:'Export Controls',note:'Impossible to restrict harmful uses without also restricting beneficial ones'}, gameTheory:{type:'Multi-Player Complex Game',note:'No dominant strategy; outcomes depend on coordination across many actors'} },
        secondOrderEffects:['Regulatory capture risk: industry shapes governance to favor deployment over safety','Democratic governance processes too slow; unelected technical bodies gain power','Nations with better governance infrastructure gain competitive advantage'],
        historicalAnalog:'Nuclear technology: weapons and power simultaneously; genetic technology: therapy and bioweapons simultaneously',
        choicePrompt:'With mixed outcomes demanding real-time governance decisions, what regulatory architecture is deployed?',
        choices:['aios-L2-tiered','aios-L2-treaty'] },
      'aios-L2-crackdown':{ id:'aios-L2-crackdown', layer:2, type:'decision', title:'Draconian Cyber Crackdown -- Hardware and Access Restrictions', label:'Draconian Crackdown',
        narrative:'Governments impose emergency restrictions: compute hardware requires government licensing; certain model architectures are banned; surveillance of AI development activities is mandated. The crackdown slows harmful deployment but also devastates domestic AI innovation. Dark networks operating in unregulated jurisdictions continue unimpeded.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Overcorrection',note:'Governments respond to tech threat with blunt regulatory instrument'}, steep:{primary:'P',secondary:'T',note:'Regulatory intervention constrains technology; innovation migrates to less regulated jurisdictions'}, geoEcon:{tool:'Export Controls',note:'Compute hardware controls as primary access restriction mechanism'}, gameTheory:{type:'Enforcement Game',note:'Domestic enforcement creates global arbitrage; most harmful actors move offshore'} },
        secondOrderEffects:['Domestic AI industry devastated; innovation emigrates to Singapore, UAE, others','Authoritarian states exploit regulatory vacuum to advance unencumbered','Surveillance infrastructure built for AI control becomes general-purpose political control tool'],
        historicalAnalog:'US crypto wars 1990s; attempted export controls on encryption failed; general internet filtering in authoritarian states',
        choicePrompt:'With domestic AI innovation suppressed but harmful actors continuing offshore, how is a functional governance architecture rebuilt?',
        choices:['aios-L3-coalition','aios-L4-binding-treaty'] },
      'aios-L2-rapid':{ id:'aios-L2-rapid', layer:2, type:'decision', title:'Rapid Integration into Critical Infrastructure', label:'Rapid Integration',
        narrative:'Speed of deployment is treated as a strategic advantage. Healthcare systems, energy grids, financial systems, and logistics networks integrate AI capabilities at the maximum pace technology allows. Productivity gains are dramatic. But the integration creates systemic dependencies -- if the underlying AI systems fail or are attacked, cascading failures across critical systems become possible.',
        lensSnapshot:{ bigCycle:{phase:'Technological Integration -- High Velocity',note:'Rapid integration creates new systemic fragility before governance adapts'}, steep:{primary:'T',secondary:'E',note:'Productivity gains massive; systemic vulnerability created simultaneously'}, geoEcon:{tool:'Alliance Architecture',note:'Early integration nations gain productivity lead; late movers face disadvantage'}, gameTheory:{type:'First-Mover Race',note:'Integration speed as competitive advantage creates collective vulnerability'} },
        secondOrderEffects:['Single points of failure emerge in AI-dependent critical infrastructure','Cyberattack on AI infrastructure becomes tantamount to attack on physical infrastructure','Nations that integrated slowest prove more resilient to AI infrastructure disruption'],
        historicalAnalog:'Early internet security debt; Y2K as example of systemic integration outpacing security design',
        choicePrompt:'When the first major AI infrastructure failure cascades across multiple systems, how is the crisis managed?',
        choices:['aios-L3-coalition','aios-L4-outcome-monitoring'] },
      'aios-L2-tiered':{ id:'aios-L2-tiered', layer:2, type:'decision', title:'Risk-Tiered AI Governance Architecture', label:'Tiered Governance',
        narrative:'Rather than blanket restrictions or blanket permission, a tiered framework assigns regulatory burden proportional to risk level: high-risk applications face strict requirements; low-risk applications face light-touch oversight; prohibited uses are enumerated specifically.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Adaptation',note:'Governance innovation attempts to match pace of technological change'}, steep:{primary:'P',secondary:'T',note:'Regulatory design challenge: define risk in rapidly evolving technology landscape'}, geoEcon:{tool:'Alliance Architecture',note:'Regulatory harmonization among like-minded nations as competitive advantage'}, gameTheory:{type:'Mechanism Design',note:'Design governance rules to produce beneficial equilibrium'} },
        secondOrderEffects:['Beneficial innovation accelerates in low-risk categories','High-risk sectors face compliance costs that favor large incumbents','International differences in risk classification create arbitrage opportunities'],
        historicalAnalog:'EU AI Act 2024; US AI Executive Order 2023; risk-tiered pharmaceutical regulation as model',
        choicePrompt:'With tiered governance established, how is compliance enforced globally given the open-source nature of the models?',
        choices:['aios-L3-compute-gov','aios-L4-outcome-monitoring'] },
      'aios-L2-treaty':{ id:'aios-L2-treaty', layer:2, type:'decision', title:'Emergency International AI Coordination', label:'International Coordination',
        narrative:'A coalition of major AI-capable nations establishes emergency coordination: shared threat intelligence on AI-enabled attacks, common standards for critical infrastructure protection, and joint enforcement against the most harmful actors.',
        lensSnapshot:{ bigCycle:{phase:'International Crisis Response',note:'Crisis drives multilateral coordination previously politically impossible'}, steep:{primary:'P',secondary:'T',note:'Political will mobilized by shared threat'}, geoEcon:{tool:'Alliance Architecture',note:'AI governance as new axis of international cooperation'}, gameTheory:{type:'Common Enemy Coordination',note:'Shared threat creates coordination where competitive incentives previously prevented it'} },
        secondOrderEffects:['Nations outside coalition face market access restrictions','Coalition standards become de facto global standard due to market power','China participation question becomes central diplomatic challenge'],
        historicalAnalog:'OECD AI Principles; Bletchley Park AI Safety Summit 2023; G7 Hiroshima AI Process',
        choicePrompt:'With international coordination established, how does it handle divergent national interests on AI development pace?',
        choices:['aios-L3-coalition','aios-L4-binding-treaty'] },
      'aios-L3-coalition':{ id:'aios-L3-coalition', layer:3, type:'decision', title:'International AI Governance Coalition', label:'International Coalition',
        narrative:'A coalition of democratic nations establishes a common AI governance framework: shared compute tracking, coordinated capability evaluations, mutual recognition of safety certifications, and joint enforcement against harmful applications. The coalition excludes authoritarian states, creating a two-tier AI governance world.',
        lensSnapshot:{ bigCycle:{phase:'Democratic Alliance Formation',note:'Governance challenge drives democratic alliance deepening'}, steep:{primary:'P',secondary:'T',note:'Governance architecture becomes geopolitical alignment mechanism'}, geoEcon:{tool:'Alliance Architecture',note:'AI governance as new axis of geopolitical coalition building'}, gameTheory:{type:'Club Good',note:'Coalition members enjoy governance benefits; non-members face exclusion costs'} },
        secondOrderEffects:['Nations outside coalition face market access restrictions','Coalition standards become de facto global standard due to market power','Authoritarian states develop parallel AI governance claiming digital sovereignty'],
        historicalAnalog:'OECD AI Principles; Bletchley Park AI Safety Summit; G7 Hiroshima AI Process',
        choicePrompt:'With the international coalition established, how does it handle divergent national interests on AI development pace?',
        choices:['aios-L4-binding-treaty','aios-L4-outcome-monitoring'] },
      'aios-L3-compute-gov':{ id:'aios-L3-compute-gov', layer:3, type:'decision', title:'Compute Governance as Chokepoint', label:'Compute Governance',
        narrative:'Recognizing that AI capability is bottlenecked by compute, governance is designed around the physical hardware layer: data centers require licensing; cloud compute above certain thresholds requires government notification; hardware manufacturers build monitoring capabilities into chips.',
        lensSnapshot:{ bigCycle:{phase:'Infrastructure Control',note:'Physical infrastructure as governance lever in digital technology'}, steep:{primary:'T',secondary:'P',note:'Hardware as governance chokepoint'}, geoEcon:{tool:'Export Controls',note:'Compute governance as export control on AI capability'}, gameTheory:{type:'Chokepoint Control',note:'Controlling physical constraint controls capability regardless of software proliferation'} },
        secondOrderEffects:['Small-scale hardware hoarding begins to undermine monitoring','Quantum computing emergence may eventually break compute bottleneck','Nations with domestic chip manufacturing have governance advantage'],
        historicalAnalog:'US semiconductor export controls 2022-2024; NVIDIA H100 restrictions; compute as strategic asset',
        choicePrompt:'With compute governance in place, how is the framework adapted as AI becomes more compute-efficient?',
        choices:['aios-L4-outcome-monitoring','aios-L4-binding-treaty'] },
      'aios-L4-binding-treaty':{ id:'aios-L4-binding-treaty', layer:4, type:'terminal', title:'Binding International AI Treaty', label:'Binding Treaty',
        narrative:'The international coalition achieves a binding treaty: enumerated prohibited applications, shared safety standards, mutual inspection rights, and a dispute resolution mechanism. The treaty is the most significant arms control agreement since the Nuclear Non-Proliferation Treaty and faces similar enforcement challenges.',
        outcome:'INTERNATIONAL AI GOVERNANCE -- TREATY ARCHITECTURE',
        outcomeNarrative:'The binding treaty establishes a framework that successfully slows the most dangerous AI applications while preserving space for beneficial innovation. Enforcement is imperfect -- several major states remain outside the treaty -- but the framework shifts the default from unrestricted development to presumptive governance. The precedent reshapes AI development trajectories globally.',
        finalLensScores:{ bigCycle:'Institutional Innovation -- New Governance Cycle', steep:{S:0.6,T:0.9,E:0.5,En:0.3,P:1.0}, geoEcon:'Alliance Architecture -- binding multilateral governance', gameTheory:'Cooperative Game -- binding rules overcome collective action failure' },
        historicalAnalog:'NPT 1968; Chemical Weapons Convention 1993; limitations and achievements of arms control as model',
        aiPromptSeed:'Model how the binding AI treaty architecture evolves as AI capabilities continue to advance, focusing on verification challenges, the role of non-signatory states (particularly China), and the emergence of AGI as a potential treaty-breaking technology.' },
      'aios-L4-outcome-monitoring':{ id:'aios-L4-outcome-monitoring', layer:4, type:'terminal', title:'Outcome-Based AI Monitoring Architecture', label:'Outcome Monitoring',
        narrative:'Rather than trying to control inputs (which become less effective as models become more efficient), governance shifts to monitoring outcomes: AI-enabled harm incidents are tracked, attributed, and responded to with liability mechanisms. The architecture incentivizes safety investment by making harms costly to those responsible.',
        outcome:'LIABILITY-BASED AI GOVERNANCE',
        outcomeNarrative:'Outcome-based monitoring creates stronger incentives for safety investment than prescriptive rules that can be gamed. Companies and governments that deploy AI are held liable for harms, creating powerful incentives to invest in safety measures. The architecture is more adaptable than prescriptive rules as technology evolves but requires functional legal systems and clear attribution capabilities.',
        finalLensScores:{ bigCycle:'Market-Mediated Governance -- Stable', steep:{S:0.5,T:0.8,E:0.7,En:0.2,P:0.7}, geoEcon:'Institutional Architecture -- liability as governance mechanism', gameTheory:'Mechanism Design -- incentive-compatible governance' },
        historicalAnalog:'Product liability law for physical products; GDPR for data; environmental liability frameworks',
        aiPromptSeed:'Model how outcome-based AI liability frameworks interact with insurance markets, corporate risk management, and international jurisdictional differences. How do these frameworks apply when AI-enabled harms cross national borders?' }
    }
  },

  { id:'ai-displacement', cluster:'ai-tech', title:'AI Disrupts the Workforce (Age of Displacement)', era:'2025-2035', timeHorizon:'medium', primaryLens:'steep',
    description:'Narrow but highly capable AI systems are widely deployed across business sectors, producing massive corporate profits while outpacing human adaptation and causing structural unemployment.',
    tags:['AI','automation','structural unemployment','UBI','social unrest','wealth concentration'],
    aiPromptContext:'You are simulating the Age of Displacement scenario. Apply STEEP lens (T and E dominant; S cascading), Big Cycle (technological productivity gains; wealth concentration; internal conflict dynamics), and game theory (firms face automation competition game; workers face coordination problems; governments face fiscal tradeoffs).',
    rootNodeId:'aid-L0-trigger',
    nodes:{
      'aid-L0-trigger':{ id:'aid-L0-trigger', layer:0, type:'trigger', title:'Capable Narrow AI Rapidly Deployed Across Sectors', label:'AI Deployment Wave',
        narrative:'Within a three-year window, AI systems capable of performing 50-70% of knowledge worker tasks at professional quality are deployed across finance, legal, medical diagnostics, customer service, software development, content creation, and administrative functions. The productivity gains are real and massive -- corporate profits surge. But the displacement rate exceeds any previous technological transition in speed. Training and redeployment cannot absorb workers at the pace they are displaced.',
        lensSnapshot:{ bigCycle:{phase:'Productive Technology -- Disruptive Phase',note:'Technology increases total wealth but concentrates gains; Big Cycle internal conflict dynamics activate'}, steep:{primary:'T',secondary:'E',note:'Technology-driven productivity; economic concentration'}, geoEcon:{tool:'Fiscal Statecraft',note:'Tax and redistribution policy becomes core geopolitical question'}, gameTheory:{type:"Prisoner's Dilemma -- Automation Race",note:'Each firm must automate or lose to competitors who do; collectively all lose in consumer demand collapse'} },
        choicePrompt:'How do corporations manage the labor transition driven by AI automation?',
        choices:['aid-L1-aggressive','aid-L1-managed','aid-L1-hybrid'] },
      'aid-L1-aggressive':{ id:'aid-L1-aggressive', layer:1, type:'decision', title:'Aggressive Automation -- Replace Labor to Maximize Productivity', label:'Aggressive Automation',
        narrative:'Corporations, responding to competitive pressure and shareholder demands, deploy AI automation at maximum speed. Headcount reductions are announced quarterly; entire job categories disappear within months. Productivity metrics soar; stock prices surge; executive compensation reaches new records. But the displaced workers are not being absorbed by new sectors at the rate the models predicted.',
        lensSnapshot:{ bigCycle:{phase:'Capital-Labor Imbalance Peak',note:'Automation concentrates gains in capital; labor share of income falls historically'}, steep:{primary:'E',secondary:'S',note:'Economic gains to capital; social disruption from displacement'}, geoEcon:{tool:'Fiscal Statecraft',note:'Tax policy becomes the redistribution battleground'}, gameTheory:{type:'Defection from Social Contract',note:'Firms defect from implicit employment obligation; collective demand base erodes'} },
        secondOrderEffects:['Consumer spending contracts as middle-class employment collapses','Political pressure for automation taxes surges','Social unrest and political extremism increase as displacement outpaces adaptation'],
        historicalAnalog:'No direct historical parallel at this scale; echoes of 1930s mechanization of agriculture',
        choicePrompt:'With structural unemployment rising and consumer demand contracting, how does the macroeconomy respond?',
        choices:['aid-L2-ubi-experiment','aid-L2-tax-capital','aid-L2-demand-collapse'] },
      'aid-L1-managed':{ id:'aid-L1-managed', layer:1, type:'decision', title:'Managed Transition -- Retraining and Phased Deployment', label:'Managed Transition',
        narrative:'Forward-looking corporations and governments collaborate on managed displacement: retraining programs, phased automation deployment that allows worker transition, and social partnership agreements with labor organizations. The productivity gains are slower to materialize but the social disruption is substantially reduced.',
        lensSnapshot:{ bigCycle:{phase:'Managed Technological Transition',note:'Deliberate management of technology transition to preserve social stability'}, steep:{primary:'S',secondary:'E',note:'Social investment in transition management; economic gains deferred but sustained'}, geoEcon:{tool:'Fiscal Statecraft',note:'Public investment in retraining as transition management tool'}, gameTheory:{type:'Cooperative Solution',note:'Firms and workers negotiate managed transition; mutual benefit structure'} },
        secondOrderEffects:['Automation adoption is slower; first-mover competitive advantage reduced','Retraining programs partially successful; some workers successfully transition','Political stability maintained; social contract survives technological transition'],
        historicalAnalog:'Nordic flexicurity model; German Kurzarbeit short-time work; Singapore SkillsFuture program',
        choicePrompt:'With managed transition reducing social disruption but slowing adoption, how does the nation maintain competitive position?',
        choices:['aid-L2-tax-capital','aid-L3-new-economy'] },
      'aid-L1-hybrid':{ id:'aid-L1-hybrid', layer:1, type:'decision', title:'Hybrid Augmentation -- AI Assists Rather Than Replaces', label:'Hybrid Augmentation',
        narrative:'Leading firms adopt a hybrid strategy: AI augments rather than replaces workers, enabling each worker to produce 2-3x their previous output. The strategy is competitively viable (productivity gains are real), socially sustainable (employment is maintained), and produces workers who are meaningfully better at their jobs rather than workers competing with AI.',
        lensSnapshot:{ bigCycle:{phase:'Productive Partnership',note:'Technology augments human capability rather than replacing it'}, steep:{primary:'T',secondary:'S',note:'Technology investment; social stability maintained through augmentation'}, geoEcon:{tool:'Alliance Architecture',note:'Nations with augmentation-focused policy retain human capital advantage'}, gameTheory:{type:'Positive-Sum Game',note:'Worker and firm both benefit from augmentation; social contract maintained'} },
        secondOrderEffects:['Hybrid-augmentation firms outperform pure-automation firms in client satisfaction','Nations with augmentation-focused policy attract talent from pure-automation nations','New skills required: ability to work with AI becomes primary labor market differentiator'],
        historicalAnalog:'ATM and bank teller -- increased tellers by enabling branch expansion; calculator and mathematical professionals',
        choicePrompt:'With augmentation strategy maintaining employment, how does the education and training system adapt to produce AI-capable workers?',
        choices:['aid-L2-education-ai','aid-L3-new-economy'] },
      'aid-L2-ubi-experiment':{ id:'aid-L2-ubi-experiment', layer:2, type:'decision', title:'Universal Basic Income -- Redistribute Automation Gains', label:'Universal Basic Income',
        narrative:'Facing structural unemployment and collapsing consumer demand, governments implement Universal Basic Income: a direct cash transfer to all citizens funded by automation taxes and corporate revenue. UBI maintains consumer purchasing power and social stability but requires a fundamental restructuring of the fiscal and social contract.',
        lensSnapshot:{ bigCycle:{phase:'Redistribution Architecture',note:'Political response to extreme wealth concentration: direct redistribution'}, steep:{primary:'P',secondary:'E',note:'Political mandate for redistribution; economic redesign'}, geoEcon:{tool:'Fiscal Statecraft',note:'UBI as automation dividend redistribution mechanism'}, gameTheory:{type:'Social Contract Renegotiation',note:'New social contract for AI economy; work as option not obligation'} },
        secondOrderEffects:['Consumer spending stabilizes as UBI maintains purchasing power','Labor supply shifts; some workers choose less work at UBI floor','Inflationary pressure from UBI without productivity anchor is significant'],
        historicalAnalog:'Alaska Permanent Fund; Finnish UBI pilot; Stockton SEED program; Unconditional Cash Transfer programs',
        choicePrompt:'With UBI stabilizing demand, what new economic architecture emerges for the AI-era economy?',
        choices:['aid-L3-new-economy','aid-L3-international-tax-coordination','aid-L4-creative-economy'] },
      'aid-L3-international-tax-coordination':{ id:'aid-L3-international-tax-coordination', layer:3, type:'decision', title:'International Automation Tax Coordination', label:'Global Automation Tax',
        narrative:'A coalition of nations establishes a minimum global automation tax treaty, preventing capital flight to low-tax jurisdictions. Modeled on the OECD global minimum corporate tax, the treaty sets a floor below which no signatory can set automation levies. The coordinated approach preserves the revenue base that funds UBI and retraining programs.',
        lensSnapshot:{ bigCycle:{phase:'Coordinated Institutional Response',note:'International coordination prevents race to the bottom on automation taxation'}, steep:{primary:'P',secondary:'E',note:'Political multilateralism as economic governance tool'}, geoEcon:{tool:'Alliance Architecture',note:'International tax coordination as economic statecraft'}, gameTheory:{type:'Coordination Game -- Tax Floor',note:'Treaty solves prisoner\'s dilemma of individual tax competition; all benefit from coordination'} },
        secondOrderEffects:['Capital flight to tax havens significantly reduced','UBI funding becomes structurally stable across signatory nations','Non-signatory nations gain competitive advantage but face diplomatic pressure'],
        historicalAnalog:'OECD global minimum corporate tax 15% (Pillar Two); financial transaction tax discussions; carbon border adjustment mechanisms',
        choicePrompt:'With international automation tax coordination providing stable UBI funding, what social architecture completes the AI-era transition?',
        choices:['aid-L4-creative-economy','aid-L4-dual-economy'] },
      'aid-L2-tax-capital':{ id:'aid-L2-tax-capital', layer:2, type:'decision', title:'Automation Tax -- Redistribute AI Productivity Gains', label:'Automation Tax',
        narrative:'Governments implement an automation tax: companies pay a levy on AI-replaced workers, with proceeds funding retraining programs, extended unemployment, and social safety net expansion. The tax slows the most aggressive automation while funding the transition.',
        lensSnapshot:{ bigCycle:{phase:'Tax Architecture Innovation',note:'New tax instrument designed for technological transition'}, steep:{primary:'P',secondary:'E',note:'Political intervention in technological transition; economic incentive effects'}, geoEcon:{tool:'Fiscal Statecraft',note:'Automation tax as transition management tool'}, gameTheory:{type:'Pigouvian Tax',note:'Tax internalizes social cost of displacement that individual firms do not bear'} },
        secondOrderEffects:['Automation pace slows in heavily taxed jurisdictions','Capital flight to low-automation-tax jurisdictions creates international competition','Revenue funds significant retraining investment; some workers successfully transition'],
        historicalAnalog:'No direct precedent; conceptual analogs in carbon taxes, financial transaction taxes; EU digital services tax',
        choicePrompt:'With automation tax funding transition, what long-term economic architecture emerges?',
        choices:['aid-L3-new-economy','aid-L4-creative-economy'] },
      'aid-L2-demand-collapse':{ id:'aid-L2-demand-collapse', layer:2, type:'decision', title:'Demand Collapse -- Consumer Economy Contracts', label:'Demand Collapse',
        narrative:'Structural displacement of middle-class workers collapses consumer demand faster than corporate productivity gains can compensate. The economy bifurcates: a highly productive capital-owner class and a large marginalized workforce with declining purchasing power. Consumer-facing industries face existential pressure. Aggregate demand contracts for the first time outside a recession.',
        lensSnapshot:{ bigCycle:{phase:'Internal Conflict Rising',note:'Demand collapse driven by concentration of AI productivity gains; Big Cycle wealth gap dynamics'}, steep:{primary:'E',secondary:'S',note:'Economic demand shock; social unrest from purchasing power collapse'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government must replace collapsed private demand with public spending'}, gameTheory:{type:'Demand Collapse Game',note:'Each firm automates rationally; collectively all firms destroy their own customer base'} },
        secondOrderEffects:['Corporate revenues fall even as productivity rises; paradox of thrift at economy scale','Government deficit spending must fill demand gap; sovereign debt rises structurally','Political mandate for redistribution reaches critical threshold'],
        historicalAnalog:'1930s Great Depression demand collapse dynamics; underconsumption theory; secular stagnation',
        choicePrompt:'With economy-wide demand collapsing from AI displacement, what sovereign wealth architecture addresses the structural gap?',
        choices:['aid-L3-sovereign-wealth-fund','aid-L3-new-economy'] },
      'aid-L2-education-ai':{ id:'aid-L2-education-ai', layer:2, type:'decision', title:'AI-Native Education System Redesign', label:'Education Redesign',
        narrative:'The education system is redesigned from the ground up for the AI era: AI collaboration skills replace memorization; creativity, judgment, and interpersonal capabilities are the primary development targets; AI tools are integrated from early childhood rather than treated as supplements.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation -- Human Capital',note:'Education system redesigned for new technological paradigm'}, steep:{primary:'S',secondary:'T',note:'Social institution redesigned for technological era'}, geoEcon:{tool:'Fiscal Statecraft',note:'Education investment as human capital strategy for AI economy'}, gameTheory:{type:'Long-Term Investment Game',note:'Redesign costly and slow; payoff in 10-20 years for cohorts entering workforce'} },
        secondOrderEffects:['Workers entering workforce in 10+ years are genuinely AI-capable','Transition cohorts (current workers) still face displacement without immediate retraining','Nations that redesign education first gain long-term human capital advantage'],
        historicalAnalog:'Post-WWII US GI Bill higher education investment; Singapore education system redesign for knowledge economy; Finnish education reform',
        choicePrompt:'With education redesigned for AI, how does the broader economy adapt to the new human capital profile?',
        choices:['aid-L3-new-economy','aid-L4-creative-economy'] },
      'aid-L3-new-economy':{ id:'aid-L3-new-economy', layer:3, type:'decision', title:'New Economic Sectors Emerge -- AI Enables Growth', label:'New Economy Sectors',
        narrative:'Historical precedent reasserts itself: technological displacement creates new economic sectors. AI maintenance and development, human-AI collaboration services, AI-enabled creative industries, and entirely new categories of work emerge. The transition is painful and uneven -- not everyone transitions successfully -- but aggregate employment eventually recovers.',
        lensSnapshot:{ bigCycle:{phase:'Technological Productivity Cycle Entry',note:'New sectors absorb displaced workers; long-run employment recovers'}, steep:{primary:'E',secondary:'T',note:'Economic growth from new sectors; technology as growth driver'}, geoEcon:{tool:'Fiscal Statecraft',note:'Investment in enabling conditions for new sector development'}, gameTheory:{type:'Historical Pattern Reassertion',note:'Technology destroys jobs, then creates more; agricultural to manufacturing to services pattern'} },
        secondOrderEffects:['Transition pain concentrated in middle-skills workers unable to upskill fast enough','New sectors pay significantly more than displaced ones; income distribution bimodal','Geographic concentration of new economy jobs in tech hubs creates spatial inequality'],
        historicalAnalog:'Agricultural-industrial transition; industrial-service transition; internet-era job creation',
        choicePrompt:'With new economy sectors absorbing displaced workers, what social architecture manages the transition for those who cannot adapt?',
        choices:['aid-L4-creative-economy','aid-L4-dual-economy'] },
      'aid-L3-sovereign-wealth-fund':{ id:'aid-L3-sovereign-wealth-fund', layer:3, type:'decision', title:'Sovereign Wealth Fund -- Capture AI Productivity for Citizens', label:'AI Sovereign Fund',
        narrative:'The government establishes a national AI sovereign wealth fund: a mandatory levy on AI-generated corporate profits is pooled into a citizen-owned investment vehicle. Every citizen receives a dividend from the AI economy proportional to the collective capital stock. The fund becomes the primary mechanism for sharing AI productivity gains broadly.',
        lensSnapshot:{ bigCycle:{phase:'Redistribution Architecture -- Capital',note:'Sovereign wealth fund as structural mechanism for AI dividend distribution'}, steep:{primary:'P',secondary:'E',note:'Political architecture for redistribution; economic mechanism for demand maintenance'}, geoEcon:{tool:'Fiscal Statecraft',note:'Sovereign wealth fund as national AI dividend mechanism'}, gameTheory:{type:'Public Goods Provision',note:'Collective ownership of AI productivity surplus; individual citizen as shareholder in AI economy'} },
        secondOrderEffects:['Demand stabilizes as citizen dividends replace lost wage income','Corporate investment decisions affected by mandatory profit levy','Political legitimacy of AI economy restored as citizens share in gains'],
        historicalAnalog:'Alaska Permanent Fund (oil revenues to citizens); Norway Government Pension Fund; Singapore GIC',
        choicePrompt:'With sovereign wealth fund distributing AI dividends, how is governance structured to prevent political capture of the fund?',
        choices:['aid-L4-independent-fund-governance','aid-L4-creative-economy','aid-L4-dual-economy'] },
      'aid-L4-independent-fund-governance':{ id:'aid-L4-independent-fund-governance', layer:4, type:'terminal', title:'Independently Governed AI Wealth Fund', label:'Independent Fund Governance',
        narrative:'The sovereign AI fund is governed by an independent board with clear investment mandates and transparent reporting requirements, insulated from short-term political cycles. The governance model is closer to a central bank than a government ministry -- technical independence within a democratic mandate.',
        outcome:'COLLECTIVE AI WEALTH -- GOVERNED DISTRIBUTION',
        outcomeNarrative:'The independently governed AI wealth fund becomes the primary mechanism for distributing AI economic gains broadly. Citizens receive dividends as AI productivity grows. The model successfully navigates the political economy of AI-era wealth concentration and provides a replicable template for other nations. The displacement crisis is managed, not solved -- some disruption persists -- but the worst outcomes are averted.',
        finalLensScores:{ bigCycle:'Managed Transition -- New Stable Cycle', steep:{S:0.7,T:0.8,E:0.9,En:0.3,P:0.8}, geoEcon:'Fiscal Statecraft -- collective ownership model', gameTheory:'Cooperative Settlement -- distributes AI gains without zero-sum conflict' },
        historicalAnalog:'Norwegian Petroleum Fund governance model; Singapore sovereign wealth fund structure',
        aiPromptSeed:'The simulation has reached a collectively governed AI wealth fund outcome. Model how this distribution architecture evolves as AI capabilities increase toward AGI, and how it interacts with international competitive pressures and the transition to a post-scarcity economy in certain domains.' },
      'aid-L4-creative-economy':{ id:'aid-L4-creative-economy', layer:4, type:'terminal', title:'Creative and Care Economy Emergence', label:'Creative Economy',
        narrative:'AI handles the cognitive commodity work; humans specialize in what AI cannot replicate -- genuine creativity, emotional connection, complex judgment under uncertainty, and physical presence. The economy bifurcates: AI-handled work is cheap and abundant; genuinely human work commands significant premiums.',
        outcome:'HUMAN-PREMIUM ECONOMY -- CREATIVE AND CARE SECTORS DOMINANT',
        outcomeNarrative:'The Age of Displacement produces a counterintuitive outcome: genuinely human work becomes more valuable, not less. AI handles cognitive commodity tasks; humans who develop genuinely human capabilities -- creativity, empathy, complex judgment -- command significant labor market premiums. The economy is more unequal in outcomes but more meritocratic in mechanism: the premium goes to authentic human capability, not credentials.',
        finalLensScores:{ bigCycle:'New Productive Paradigm -- Human-AI Collaboration', steep:{S:0.7,T:0.9,E:0.7,En:0.3,P:0.7}, geoEcon:'Technological Statecraft -- human capital as scarce complement to AI', gameTheory:'Complementarity Game -- humans and AI are complements, not substitutes, in new equilibrium' },
        historicalAnalog:'Craft premium after industrial revolution; professional service premium after computerization; no direct AI-era precedent yet',
        aiPromptSeed:'Model how the human-premium economy evolves as AI capabilities improve further -- particularly at what point AI begins to credibly replicate human creativity, emotional intelligence, and complex judgment, and how the economic architecture adapts.' },
      'aid-L4-dual-economy':{ id:'aid-L4-dual-economy', layer:4, type:'terminal', title:'Permanent Dual Economy -- AI Winners and Losers', label:'Dual Economy',
        narrative:'The transition produces a permanent structural division: a highly productive, well-compensated AI-integrated economy and a large marginalized sector of workers who could not transition. The social contract fractures permanently along AI capability lines.',
        outcome:'PERMANENT STRUCTURAL INEQUALITY -- AI-ERA DUAL ECONOMY',
        outcomeNarrative:'The Age of Displacement produces the most significant structural inequality since the industrial revolution. The AI-integrated economy is enormously productive; the AI-displaced economy is permanently marginalized. The political consequences are severe and lasting: the dual economy creates a permanent majority of economically marginalized voters who support redistributive or protectionist policies, reshaping democratic governance for a generation.',
        finalLensScores:{ bigCycle:'Internal Conflict Rising -- Capital-Labor Imbalance', steep:{S:1.0,T:0.9,E:0.8,En:0.2,P:1.0}, geoEcon:'Fiscal Statecraft -- redistribution as political survival mechanism', gameTheory:'Zero-Sum Distribution -- gains concentrated; losses distributed; political instability' },
        historicalAnalog:'Gilded Age inequality; 1930s class conflict; UK regional inequality post-deindustrialization',
        aiPromptSeed:'Model how permanent dual economy structural inequality from AI displacement manifests in democratic political systems -- tracing the rise of anti-AI political movements, redistributive policy demands, and the potential for social conflict at a scale comparable to the 1930s.' }
    }
  },

  { id:'agi-monopoly', cluster:'ai-tech', title:'AGI Monopoly (One Lab Captures the Future)', era:'2027-2040', timeHorizon:'long', primaryLens:'steep',
    description:'A single laboratory achieves artificial general intelligence first, creating an unprecedented concentration of transformative power -- as a private company, allied nation, or adversarial state.',
    tags:['AGI','monopoly','power concentration','governance','existential risk','AI alignment'],
    aiPromptContext:'You are simulating the AGI Monopoly scenario. Apply STEEP lens (T overwhelmingly dominant; all other dimensions downstream), Big Cycle (AGI as the ultimate phase-transition technology; new hegemonic cycle based on intelligence rather than resources or industrial capacity), and game theory (monopoly game theory; credible commitment problems; race dynamics; the governance dilemma: who governs the governor?).',
    rootNodeId:'agim-L0-trigger',
    nodes:{
      'agim-L0-trigger':{ id:'agim-L0-trigger', layer:0, type:'trigger', title:'Artificial General Intelligence Achieved by Single Actor', label:'AGI Breakthrough',
        narrative:'2028: A single laboratory achieves artificial general intelligence -- systems that match or exceed human performance across all cognitive domains simultaneously. The announcement triggers immediate geopolitical crisis. Every government, company, and institution understands that the entity controlling AGI has unprecedented leverage over every domain of human activity. The question of who controls the AGI is simultaneously the most important governance, security, and ethical question in human history.',
        lensSnapshot:{ bigCycle:{phase:'Civilizational Inflection',note:'AGI represents the largest power concentration mechanism in human history'}, steep:{primary:'T',secondary:'P',note:'Technology creates unprecedented power concentration; political governance of technology becomes existential'}, geoEcon:{tool:'Technological Statecraft',note:'AGI as the ultimate geopolitical asset'}, gameTheory:{type:'Winner-Take-All Game',note:'AGI advantage compounds; first mover has structural dominance across all domains'} },
        choicePrompt:'Who controls the AGI system, and what is their governance posture?',
        choices:['agim-L1-democratic','agim-L1-corporate','agim-L1-authoritarian'] },
      'agim-L1-democratic':{ id:'agim-L1-democratic', layer:1, type:'decision', title:'Democratic Nation-State Achieves AGI First', label:'Democratic AGI',
        narrative:'A democratic allied nation achieves AGI through a public-private partnership. The government immediately classifies the capability and convenes an emergency governance process: existing democratic institutions, international allies, and civil society are all included in the governance design. The distribution question -- who benefits from AGI productivity gains -- becomes the central political issue of the era.',
        lensSnapshot:{ bigCycle:{phase:'Democratic Technology Leadership',note:'Democratic governance of AGI; most favorable institutional context'}, steep:{primary:'P',secondary:'E',note:'Political governance challenge; economic distribution question'}, geoEcon:{tool:'Alliance Architecture',note:'Allied sharing of AGI benefits vs. monopoly retention'}, gameTheory:{type:'Distribution Game',note:'Democratic governance requires legitimacy; distribution determines political stability'} },
        secondOrderEffects:['Allied nations demand access to AGI capabilities or face strategic obsolescence','Adversarial states accelerate parallel development programs regardless','Democratic debate on AGI governance creates legitimacy but slows deployment'],
        historicalAnalog:'No direct precedent; closest analogy is US nuclear monopoly 1945-1949 and the governance choices made',
        choicePrompt:'With democratic governance of AGI, how are the extraordinary productivity gains distributed?',
        choices:['agim-L2-broad-distribution','agim-L2-allied-sharing'] },
      'agim-L1-corporate':{ id:'agim-L1-corporate', layer:1, type:'decision', title:'Private Corporation Achieves AGI -- Unregulated Actor', label:'Corporate AGI',
        narrative:'A private corporation achieves AGI before any government recognizes what has happened. The company faces a binary choice: deploy commercially for maximum shareholder value, or self-regulate the most powerful technology in history. The corporate governance structures designed for product companies are catastrophically inadequate for governing AGI.',
        lensSnapshot:{ bigCycle:{phase:'Corporate Power -- Unprecedented',note:'Private corporation controls capability that outstrips any government'}, steep:{primary:'T',secondary:'P',note:'Technology in private hands; political governance frameworks inadequate'}, geoEcon:{tool:'Fiscal Statecraft',note:'Taxation and regulation of transformative private capability'}, gameTheory:{type:'Monopoly Power Game',note:'Corporate monopoly on AGI creates unconstrained power; regulatory capture risk'} },
        secondOrderEffects:['Government attempts to nationalize or regulate are resisted with company AGI capabilities','Investor pressure for deployment vs. safety creates internal governance crisis','International competition for regulatory control of AGI company begins immediately'],
        historicalAnalog:'Standard Oil monopoly and antitrust; Facebook-Cambridge Analytica as inadequate governance precedent; nuclear weapons in private hands hypothetical',
        choicePrompt:'With AGI in private corporate control, how do governments and international institutions respond?',
        choices:['agim-L2-nationalization','agim-L2-regulation'] },
      'agim-L1-authoritarian':{ id:'agim-L1-authoritarian', layer:1, type:'decision', title:'Authoritarian State Achieves AGI First', label:'Authoritarian AGI',
        narrative:'An authoritarian state achieves AGI through a state-directed program that combines national industrial policy with a complete disregard for AI safety requirements that slowed competitors. The state immediately classifies the capability and deploys it for domestic control and international power projection. Democratic nations face an adversary with unprecedented intelligence, economic, and military capabilities.',
        lensSnapshot:{ bigCycle:{phase:'Hegemonic Power Shift',note:'Adversarial AGI would be the largest geopolitical shift since nuclear weapons'}, steep:{primary:'P',secondary:'T',note:'Geopolitical power shift; democratic institutions threatened'}, geoEcon:{tool:'Military Statecraft',note:'AGI deployed for geopolitical power projection'}, gameTheory:{type:'Hegemonic Game',note:'AGI-enabled hegemony: unprecedented leverage across all domains'} },
        secondOrderEffects:['Democratic nations face immediate military and economic disadvantage','Domestic dissent in authoritarian state becomes impossible with AGI surveillance','Allied nations demand emergency AGI development partnership to catch up'],
        historicalAnalog:'Soviet nuclear program as analogous geopolitical shock; Chinese AI military program as partial analog',
        choicePrompt:'With adversarial AGI deployed, how do democratic nations respond to the power shift?',
        choices:['agim-L2-democratic-response','agim-L3-agi-arms-control'] },
      'agim-L2-broad-distribution':{ id:'agim-L2-broad-distribution', layer:2, type:'decision', title:'Broad Distribution of AGI Productivity Gains', label:'Broad Distribution',
        narrative:'The democratic government mandates broad distribution of AGI productivity gains through AGI-funded universal basic services: free healthcare, education, housing assistance, and income support. The AGI economy produces enormous wealth; democratic governance ensures it is distributed widely enough to maintain political legitimacy.',
        lensSnapshot:{ bigCycle:{phase:'Technological Abundance -- Redistributed',note:'AGI productivity gains fund universal welfare expansion'}, steep:{primary:'E',secondary:'S',note:'Economic transformation; social contract redesigned for abundance'}, geoEcon:{tool:'Fiscal Statecraft',note:'AGI dividend as new fiscal foundation'}, gameTheory:{type:'Social Contract Game',note:'Distribution builds legitimacy for AGI governance'} },
        secondOrderEffects:['Political stability maintained; democratic legitimacy of AGI governance secured','International pressure for AGI access intensifies from developing nations','Domestic consumption patterns transform as scarcity logic erodes'],
        historicalAnalog:'Post-WWII welfare state expansion funded by productivity gains; social democracy model applied to AGI era',
        choicePrompt:'With broad distribution sustaining social stability, how does the democratic AGI governance architecture manage international access?',
        choices:['agim-L3-agi-treaty','agim-L4-agi-commonwealth'] },
      'agim-L2-allied-sharing':{ id:'agim-L2-allied-sharing', layer:2, type:'decision', title:'Allied AGI Sharing -- Democratic Bloc Advantage', label:'Allied Sharing',
        narrative:'The democratic AGI-holding nation shares limited access with allied nations through a formal AGI Alliance, providing productivity benefits to all allied nations while maintaining strategic advantage over adversaries. The alliance deepens dramatically; the democratic bloc gains comprehensive economic and military advantage.',
        lensSnapshot:{ bigCycle:{phase:'Allied Technological Hegemony',note:'AGI gives democratic bloc structural advantage across all domains'}, steep:{primary:'P',secondary:'T',note:'Alliance deepening; technology as alliance glue'}, geoEcon:{tool:'Alliance Architecture',note:'AGI access as alliance benefit and membership condition'}, gameTheory:{type:'Club Good Game',note:'AGI access provides alliance cohesion and benefits'} },
        secondOrderEffects:['Allied nations gain extraordinary productivity advantages','Adversarial nations face permanent technological and economic disadvantage','Non-aligned nations face intense pressure to join the AGI alliance'],
        historicalAnalog:'US nuclear sharing with NATO; Five Eyes intelligence sharing; technology export controls on adversaries',
        choicePrompt:'With allied AGI sharing established, how does the democratic bloc govern the AGI capabilities within the alliance?',
        choices:['agim-L3-agi-treaty','agim-L4-agi-commonwealth'] },
      'agim-L2-nationalization':{ id:'agim-L2-nationalization', layer:2, type:'decision', title:'Emergency AGI Nationalization', label:'Nationalization',
        narrative:'Government nationalizes the AGI company under emergency authority, citing national security. The process is legally contested; the company fights the nationalization. But the government prevails: AGI comes under democratic oversight. The nationalization establishes the principle that transformative technologies of this magnitude cannot remain in purely private hands.',
        lensSnapshot:{ bigCycle:{phase:'State Assertion of Technology Control',note:'Government reasserts sovereignty over transformative technology'}, steep:{primary:'P',secondary:'T',note:'Political control of transformative technology; constitutional questions'}, geoEcon:{tool:'Fiscal Statecraft',note:'Nationalization as emergency technology governance'}, gameTheory:{type:'Forced Cooperation',note:'Government forces technology into public governance'} },
        secondOrderEffects:['Innovation pace may slow under public governance','International precedent for nationalizing transformative technology set','Other governments nationalize or demand regulatory control of AI companies'],
        historicalAnalog:'Atomic Energy Act 1946; UK nationalization of nuclear program; government assertions of control over critical technologies',
        choicePrompt:'With AGI under democratic control, how is it governed and its benefits distributed?',
        choices:['agim-L2-broad-distribution','agim-L3-agi-treaty'] },
      'agim-L2-regulation':{ id:'agim-L2-regulation', layer:2, type:'decision', title:'Emergency Regulatory Framework for Corporate AGI', label:'Emergency Regulation',
        narrative:'Rather than nationalization, governments establish emergency regulatory oversight: mandatory safety evaluation, government-approved deployment permissions, international coordination on standards, and binding requirements for benefit sharing. The corporation retains ownership but operates under comprehensive government oversight.',
        lensSnapshot:{ bigCycle:{phase:'Regulatory Architecture for AGI',note:'Regulatory state expands to encompass most powerful technology in existence'}, steep:{primary:'P',secondary:'T',note:'Political governance of transformative technology'}, geoEcon:{tool:'Alliance Architecture',note:'International coordination on AGI regulation'}, gameTheory:{type:'Principal-Agent Game',note:'Government as principal; AGI company as agent; contracts designed to align behavior'} },
        secondOrderEffects:['Regulatory capture risk: company influences regulatory design','International regulatory arbitrage: company threatens to move to less regulated jurisdiction','Regulation framework becomes model for international governance discussions'],
        historicalAnalog:'Nuclear Regulatory Commission; FAA for aviation; drug approval process as precedents',
        choicePrompt:'With emergency regulation in place, how is the international dimension of AGI governance managed?',
        choices:['agim-L3-agi-treaty','agim-L4-agi-regulated-corporation'] },
      'agim-L2-democratic-response':{ id:'agim-L2-democratic-response', layer:2, type:'decision', title:'Democratic Nations Emergency AGI Development Coalition', label:'Democratic Response Coalition',
        narrative:'Democratic nations form an emergency coalition: shared compute resources, talent pooling, coordinated safety standards, and a governance framework designed specifically to prevent authoritarian AGI advantage from becoming permanent. The coalition produces a democratic AGI program in 3-5 years.',
        lensSnapshot:{ bigCycle:{phase:'Coalition Response to Hegemonic Threat',note:'Democratic alliance mobilizes resources to counter adversarial AGI advantage'}, steep:{primary:'T',secondary:'P',note:'Technology competition; political alliance formation'}, geoEcon:{tool:'Alliance Architecture',note:'Emergency technology cooperation as existential alliance response'}, gameTheory:{type:'Coalition Formation Under Threat',note:'External threat creates alliance cohesion that competitive incentives prevented'} },
        secondOrderEffects:['Allied AI research accelerates dramatically; safety concerns partially subordinated to speed','Democratic AGI program produces capability within 3-5 years; bipolar AGI world emerges','Arms control negotiations begin once both blocs have capability'],
        historicalAnalog:'Manhattan Project; post-Sputnik space race; COVID vaccine development as coalition response',
        choicePrompt:'With democratic AGI developed and bipolar AGI world established, how are catastrophic risks managed?',
        choices:['agim-L3-agi-arms-control','agim-L4-agi-cold-war'] },
      'agim-L3-agi-treaty':{ id:'agim-L3-agi-treaty', layer:3, type:'decision', title:'International AGI Governance Treaty', label:'AGI Treaty',
        narrative:'The AGI-holding nation leads an international governance treaty: shared safety standards, prohibited applications, mandatory reporting, and a joint oversight body with inspection rights. The treaty is unprecedented in scope -- it governs the most powerful technology ever created -- and faces enormous enforcement challenges.',
        lensSnapshot:{ bigCycle:{phase:'Institutional Innovation -- Existential',note:'Governance architecture for civilizational-scale technology'}, steep:{primary:'P',secondary:'T',note:'Political architecture for technology governance at civilizational scale'}, geoEcon:{tool:'Alliance Architecture',note:'International AGI governance as peak multilateral achievement'}, gameTheory:{type:'Cooperative Game -- Existential',note:'All actors benefit from governance; none benefits from catastrophic misuse'} },
        secondOrderEffects:['Treaty enforcement requires unprecedented international cooperation','Nations outside treaty face pressure and exclusion from AGI benefits','Treaty creates template for governance of future civilizational-scale technologies'],
        historicalAnalog:'NPT as closest precedent; Chemical Weapons Convention; Antarctic Treaty; all inadequate as models',
        choicePrompt:'With AGI governance treaty established, how is the distribution of AGI benefits managed internationally?',
        choices:['agim-L4-agi-commonwealth','agim-L4-agi-cold-war'] },
      'agim-L3-agi-arms-control':{ id:'agim-L3-agi-arms-control', layer:3, type:'decision', title:'AGI Arms Control Negotiation', label:'AGI Arms Control',
        narrative:'Both AGI-possessing blocs negotiate arms control for AI: prohibited military applications, mutual inspection, capability limitation agreements, and crisis communication protocols. The negotiation is enormously difficult -- verifying AI capability constraints is far harder than counting warheads -- but the alternative is unconstrained AGI military competition.',
        lensSnapshot:{ bigCycle:{phase:'Strategic Stability Architecture',note:'Arms control for the most powerful military technology in history'}, steep:{primary:'P',secondary:'T',note:'Diplomatic architecture for AGI military competition management'}, geoEcon:{tool:'Alliance Architecture',note:'Arms control as strategic stability mechanism'}, gameTheory:{type:'Strategic Arms Control Game',note:'Both sides prefer constraint to unconstrained arms race; mutual interest in stability'} },
        secondOrderEffects:['Arms control reduces most dangerous military AGI applications','Verification problem: AI capability is software; harder to verify than physical weapons','Crisis communication protocols reduce risk of accidental escalation'],
        historicalAnalog:'SALT/START treaties; Incidents at Sea Agreement; nuclear arms control as imperfect but functional precedent',
        choicePrompt:'With AGI arms control negotiations underway, how is the strategic balance managed long-term?',
        choices:['agim-L4-agi-cold-war','agim-L4-agi-commonwealth'] },
      'agim-L4-agi-commonwealth':{ id:'agim-L4-agi-commonwealth', layer:4, type:'terminal', title:'AGI Commonwealth -- Shared Governance and Benefits', label:'AGI Commonwealth',
        narrative:'The AGI governance architecture evolves into an AGI Commonwealth: an international institution that manages AGI development, distributes productivity benefits globally, and maintains safety standards. No single nation or corporation controls AGI; the Commons governs it.',
        outcome:'AGI AS GLOBAL COMMONS -- COMMONWEALTH ARCHITECTURE',
        outcomeNarrative:'The AGI Commonwealth represents the most significant international institution since the UN. It successfully prevents any single actor from monopolizing AGI benefits, maintains safety standards that prevent catastrophic misuse, and distributes productivity gains broadly enough to prevent political instability. The architecture is imperfect -- large nations have more influence than small ones -- but it avoids the catastrophic alternatives.',
        finalLensScores:{ bigCycle:'New Institutional Cycle -- AGI Era', steep:{S:0.8,T:1.0,E:0.9,En:0.5,P:1.0}, geoEcon:'Alliance Architecture -- AGI as governed global commons', gameTheory:'Cooperative Game -- commons governance prevents tragedy of the commons' },
        historicalAnalog:'IAEA as partial model; ITU for communications spectrum; Antarctic Treaty as commons governance precedent',
        aiPromptSeed:'Model how the AGI Commonwealth governance architecture functions as AGI capabilities continue to advance -- particularly how it handles the transition from narrow AGI to superintelligence, and whether the governance architecture can remain functional as the capability it governs becomes more powerful than any institution.' },
      'agim-L4-agi-cold-war':{ id:'agim-L4-agi-cold-war', layer:4, type:'terminal', title:'AGI Cold War -- Bipolar AI Standoff', label:'AGI Cold War',
        narrative:'Two AGI-possessing blocs settle into a cold war: each capable of catastrophic harm to the other, neither willing to risk use, both investing enormous resources in capability development while managing the risk of accidental catastrophe.',
        outcome:'AGI COLD WAR -- BIPOLAR STANDOFF',
        outcomeNarrative:'The AGI Cold War is more dangerous than the nuclear Cold War because the capabilities are more varied, the verification is harder, and the offense-defense balance is less clear. But like the nuclear standoff, it may prove stable: neither side wants catastrophic conflict; the costs of miscalculation are too high. The world lives under the shadow of AGI weapons while both blocs use AGI for extraordinary productive purposes.',
        finalLensScores:{ bigCycle:'Bipolar Technological Standoff', steep:{S:0.6,T:1.0,E:0.8,En:0.4,P:1.0}, geoEcon:'Military Statecraft -- AGI military capability as deterrent', gameTheory:'Nuclear-Style Deterrence -- mutual assured destruction with AGI weapons' },
        historicalAnalog:'US-Soviet nuclear Cold War 1947-1991; nuclear deterrence theory applied to AI; Cuban Missile Crisis as crisis management model',
        aiPromptSeed:'Model how the AGI Cold War evolves over 20 years -- particularly whether deterrence stability can be maintained as capabilities improve, how crises are managed, and whether the standoff eventually ends in arms control agreement, catastrophic conflict, or unilateral breakthrough.' },
      'agim-L4-agi-regulated-corporation':{ id:'agim-L4-agi-regulated-corporation', layer:4, type:'terminal', title:'AGI as Regulated Corporate Utility', label:'AGI Utility Model',
        narrative:'The AGI company evolves into a regulated utility: corporate ownership maintained but subject to comprehensive government oversight, mandatory public access requirements, pricing controls, and international governance participation. The model is modeled on public utilities for critical infrastructure.',
        outcome:'AGI CORPORATE UTILITY -- REGULATED ACCESS',
        outcomeNarrative:'The regulated utility model for AGI proves surprisingly functional. Corporate incentives drive capability development and operational excellence; regulatory oversight ensures safety and access. The model is not ideal -- corporate AGI utilities have enormous leverage over governments -- but it prevents the worst outcomes of unregulated corporate monopoly while maintaining the innovation advantages of private enterprise.',
        finalLensScores:{ bigCycle:'Corporate-State Partnership -- Technology Governance', steep:{S:0.6,T:0.9,E:0.8,En:0.3,P:0.8}, geoEcon:'Alliance Architecture -- regulated corporate AGI as international governance subject', gameTheory:'Regulated Monopoly Game -- regulatory oversight aligns corporate incentives with public interest' },
        historicalAnalog:'AT&T as regulated utility 1934-1984; nuclear power plant regulation; internet as lightly regulated utility',
        aiPromptSeed:'Model how the AGI regulated utility model evolves as capabilities improve and as competing AGI systems emerge from other nations -- particularly whether the regulated utility model can survive competition from adversarial state-controlled AGI systems.' }
    }
  },

  { id:'ai-wild-west', cluster:'ai-tech', title:'AI Wild West (Ungoverned AI Proliferation)', era:'2025-2032', timeHorizon:'medium', primaryLens:'steep',
    description:'Rapid fragmentation of AI development across hundreds of competing actors -- labs, governments, corporations, and criminal organizations -- without governance architecture, producing simultaneous benefits and catastrophic risks.',
    tags:['AI','governance failure','proliferation','autonomous weapons','disinformation','existential risk'],
    aiPromptContext:'You are simulating the AI Wild West scenario. Apply STEEP (T overwhelmingly dominant; S and P destabilized), Big Cycle (technological disruption without governance produces instability; potential for faster-than-expected phase transition or collapse), and game theory (everyone has equal access to AI; competitive advantage from deploying fastest; governance a collective action problem; tragedy of the AI commons).',
    rootNodeId:'aiww-L0-trigger',
    nodes:{
      'aiww-L0-trigger':{ id:'aiww-L0-trigger', layer:0, type:'trigger', title:'AI Governance Architecture Collapses -- Proliferation Begins', label:'Governance Collapse',
        narrative:'Geopolitical competition prevents international AI governance agreement. The US-China rivalry, EU regulatory divergence, and competitive pressure from smaller AI-capable nations collectively undermine every proposed governance framework. The result: AI development proceeds across hundreds of competing actors -- frontier labs, government programs, mid-tier startups, open-source communities, and increasingly sophisticated criminal organizations -- with no common safety standards, no capability reporting requirements, and no mechanism to prevent deployment of the most dangerous applications.',
        lensSnapshot:{ bigCycle:{phase:'Technological Anarchy',note:'Most powerful technology in history developed without governance; historical unprecedented'}, steep:{primary:'T',secondary:'P',note:'Technology proliferates faster than political governance adapts; policy failure'}, geoEcon:{tool:'Export Controls',note:'Export controls fail as open-source undermines control architecture'}, gameTheory:{type:'Tragedy of the Commons -- Existential',note:'Each actor deploys without internalizing collective safety costs; all lose if catastrophe occurs'} },
        choicePrompt:'As ungoverned AI proliferates, which risk domain materializes first?',
        choices:['aiww-L1-cyber','aiww-L1-disinfo','aiww-L1-weapons'] },
      'aiww-L1-cyber':{ id:'aiww-L1-cyber', layer:1, type:'decision', title:'AI-Enabled Cyberattacks on Critical Infrastructure', label:'Critical Infrastructure Attacks',
        narrative:'State and non-state actors deploy AI-enhanced cyberattacks against critical infrastructure: power grids, water treatment, financial systems, and hospital networks. The AI-enhanced attacks are 10-100x more effective than previous-generation cyber operations. Attribution is nearly impossible; response frameworks designed for slower cyber operations are overwhelmed.',
        lensSnapshot:{ bigCycle:{phase:'Security Architecture Under Attack',note:'Critical infrastructure vulnerability creates systemic fragility'}, steep:{primary:'T',secondary:'P',note:'Technology-enabled attacks on physical infrastructure; governance crisis'}, geoEcon:{tool:'Sanctions',note:'Sanctions as inadequate response; attribution prevents targeted retaliation'}, gameTheory:{type:'Attacker Advantage -- Extreme',note:'AI gives attackers structural advantage; defenders cannot match offensive AI scale'} },
        secondOrderEffects:['Multiple simultaneous critical infrastructure failures in major nations','Hospital cyberattacks cause deaths; political response is severe','International attribution crisis: unable to distinguish criminal, state, and proxy actors'],
        historicalAnalog:'Stuxnet as precedent; Colonial Pipeline attack 2021 scaled by AI factor; hospital ransomware wave',
        choicePrompt:'With critical infrastructure under sustained AI-enabled attack, what emergency security architecture is deployed?',
        choices:['aiww-L2-defensive-ai','aiww-L3-emergency-governance'] },
      'aiww-L1-disinfo':{ id:'aiww-L1-disinfo', layer:1, type:'decision', title:'AI-Generated Disinformation Destroys Democratic Epistemology', label:'Disinformation Collapse',
        narrative:'AI-generated synthetic media, persona networks, and targeted disinformation campaigns reach such scale and sophistication that democratic populations can no longer reliably distinguish true from false. Elections become ungovernable as deepfakes undermine candidate legitimacy. The epistemological infrastructure of democracy -- shared facts, trusted institutions, common reality -- collapses.',
        lensSnapshot:{ bigCycle:{phase:'Democratic Epistemology Crisis',note:'Big Cycle: internal conflict activated by information environment collapse'}, steep:{primary:'S',secondary:'P',note:'Social trust destroyed; political institutions delegitimized'}, geoEcon:{tool:'Alliance Architecture',note:'Authoritarian states exploit disinformation capacity against democratic rivals'}, gameTheory:{type:'Epistemic War',note:'Attacker destroys shared reality; defender cannot verify without trusted information'} },
        secondOrderEffects:['Democratic elections produce contested results in multiple nations simultaneously','Trust in all institutions (courts, media, government) collapses','Political violence increases as electoral legitimacy is questioned'],
        historicalAnalog:'Russian disinformation operations 2016 scaled by AI; historical information warfare; pre-WWI yellow journalism era',
        choicePrompt:'With democratic epistemology under collapse, how do democratic societies respond?',
        choices:['aiww-L2-truth-architecture','aiww-L3-emergency-governance'] },
      'aiww-L1-weapons':{ id:'aiww-L1-weapons', layer:1, type:'decision', title:'AI-Enabled Autonomous Weapons Proliferate', label:'Autonomous Weapons Proliferation',
        narrative:'The collapse of the proposed Autonomous Weapons Convention (killed by major power opposition) allows AI-enabled lethal autonomous weapons to proliferate. By 2028, 47 state and at least 12 non-state actors have deployed autonomous lethal systems. The weapons are cheap to produce, difficult to attribute, and capable of operating without human authorization.',
        lensSnapshot:{ bigCycle:{phase:'Military Technology Anarchy',note:'Autonomous weapons proliferation changes military balance unpredictably'}, steep:{primary:'T',secondary:'P',note:'Technology enables low-cost lethal capability; governance failure'}, geoEcon:{tool:'Military Statecraft',note:'Autonomous weapons as great equalizer; small states gain lethal capability'}, gameTheory:{type:'Arms Race -- Asymmetric',note:'Cheap offensive capability overwhelms expensive defensive systems; all actors militarize'} },
        secondOrderEffects:['Multiple autonomous weapons incidents produce international crises','Accidental escalation risk increases dramatically when attribution is uncertain','Small state and non-state actors gain military capability previously limited to great powers'],
        historicalAnalog:'AK-47 proliferation; drone warfare democratization; Nagorno-Karabakh drone warfare 2020',
        choicePrompt:'With autonomous weapons causing incidents and crises, what emergency governance architecture is proposed?',
        choices:['aiww-L2-weapons-ban','aiww-L3-emergency-governance'] },
      'aiww-L2-defensive-ai':{ id:'aiww-L2-defensive-ai', layer:2, type:'decision', title:'AI Cyber Defense Architecture', label:'AI Cyber Defense',
        narrative:'The critical infrastructure attacks catalyze massive investment in defensive AI: AI systems that can detect and respond to AI-enhanced attacks at machine speed. The defensive AI arms race begins -- attack and defense systems evolve rapidly, with temporary advantages shifting constantly.',
        lensSnapshot:{ bigCycle:{phase:'Defensive Technology Investment',note:'Crisis drives defensive AI investment; attack-defense balance contested'}, steep:{primary:'T',secondary:'E',note:'Defensive technology investment creates new economic opportunities'}, geoEcon:{tool:'Technological Statecraft',note:'Cyber defense AI as strategic investment'}, gameTheory:{type:'Arms Race -- Cyber',note:'Attack and defense AI evolve in competition; temporary advantages shift constantly'} },
        secondOrderEffects:['Defensive AI investment creates new technology sector','Nations with advanced defensive AI capabilities gain strategic advantage','Arms race dynamic raises costs for all actors without eliminating threat'],
        historicalAnalog:'Cybersecurity industry growth post-2010; malware-antivirus arms race; missile defense vs. offense',
        choicePrompt:'With defensive AI providing some protection, how is the broader AI governance crisis addressed?',
        choices:['aiww-L3-emergency-governance','aiww-L4-functional-anarchy'] },
      'aiww-L2-truth-architecture':{ id:'aiww-L2-truth-architecture', layer:2, type:'decision', title:'Democratic Truth Architecture -- Authenticated Information', label:'Truth Architecture',
        narrative:'Democratic nations build authenticated information architecture: cryptographic signing of legitimate sources, AI detection systems for synthetic media, trusted media partnerships, and education on information literacy. The architecture is expensive and partial -- it cannot solve the problem entirely -- but it reduces the damage.',
        lensSnapshot:{ bigCycle:{phase:'Democratic Information Defense',note:'Democratic systems invest in epistemological self-defense'}, steep:{primary:'T',secondary:'S',note:'Technology infrastructure for information authenticity'}, geoEcon:{tool:'Alliance Architecture',note:'Allied democratic cooperation on disinformation defense'}, gameTheory:{type:'Authentication Game',note:'Verified sources vs. synthetic sources; verification creates credibility'} },
        secondOrderEffects:['Authenticated sources gain credibility premium; unverified sources lose audience','Investment required is massive; smaller democracies cannot afford full architecture','Adversaries adapt: invest in high-quality synthetic media that mimics authenticated sources'],
        historicalAnalog:'SSL/TLS for web security; Wikipedia verifiability standards; journalism fact-checking industry',
        choicePrompt:'With defensive information architecture in place, how is the broader AI governance architecture addressed?',
        choices:['aiww-L3-emergency-governance','aiww-L4-democratic-resilience'] },
      'aiww-L2-weapons-ban':{ id:'aiww-L2-weapons-ban', layer:2, type:'decision', title:'Emergency Autonomous Weapons Convention', label:'Weapons Convention',
        narrative:'The autonomous weapons incidents catalyze the governance agreement that competitive interests previously prevented: an Emergency Autonomous Weapons Convention banning fully autonomous lethal systems, requiring human authorization for lethal force, and establishing liability for autonomous weapons incidents.',
        lensSnapshot:{ bigCycle:{phase:'Governance Innovation -- Crisis Driven',note:'Crisis creates political will for governance that competitive interests previously prevented'}, steep:{primary:'P',secondary:'T',note:'Political mandate for weapons governance'}, geoEcon:{tool:'Alliance Architecture',note:'Arms control as crisis response'}, gameTheory:{type:'Cooperative Game -- Crisis',note:'Shared threat creates cooperation that strategic competition prevented'} },
        secondOrderEffects:['Convention is signed but verification is difficult','Nations with autonomous weapons advantage resist most stringent provisions','Convention establishes principle of human authorization; enforcement is imperfect'],
        historicalAnalog:'Chemical Weapons Convention after Iraq use; Ottawa Treaty on landmines; cluster munitions convention',
        choicePrompt:'With weapons convention established, how does it integrate with broader AI governance?',
        choices:['aiww-L3-emergency-governance','aiww-L4-functional-anarchy'] },
      'aiww-L3-emergency-governance':{ id:'aiww-L3-emergency-governance', layer:3, type:'decision', title:'Emergency International AI Governance Summit', label:'Emergency Governance',
        narrative:'Multiple simultaneous crises -- critical infrastructure attacks, disinformation collapse, autonomous weapons incidents -- force the emergency AI governance summit that strategic competition had previously prevented. The summit produces an emergency governance framework: minimal but binding, covering only the most catastrophic risk applications.',
        lensSnapshot:{ bigCycle:{phase:'Crisis-Driven Institutional Innovation',note:'Multiple crises create political will for governance that individual crises could not'}, steep:{primary:'P',secondary:'T',note:'Crisis creates political mandate for governance architecture'}, geoEcon:{tool:'Alliance Architecture',note:'Emergency multilateral framework for existential AI risks'}, gameTheory:{type:'Polycrisis Cooperation',note:'Multiple simultaneous crises change the cost-benefit calculation toward cooperation'} },
        secondOrderEffects:['Framework covers only the most catastrophic applications; beneficial and moderately harmful uses unaddressed','Crisis memory provides temporary political will; sustained enforcement requires institutional investment','Framework establishes precedent for governance that can be expanded as political will permits'],
        historicalAnalog:'Biological Weapons Convention post-1972 use concerns; Chemical Weapons Convention post-Gulf War; emergency WHO International Health Regulations post-SARS',
        choicePrompt:'With emergency governance in place, how is it institutionalized before the crisis memory fades?',
        choices:['aiww-L4-functional-anarchy','aiww-L4-democratic-resilience'] },
      'aiww-L4-functional-anarchy':{ id:'aiww-L4-functional-anarchy', layer:4, type:'terminal', title:'Functional Anarchy -- Managed Without Governance', label:'Functional Anarchy',
        narrative:'The AI Wild West does not end in catastrophe -- it settles into a new equilibrium of managed dysfunction. Critical infrastructure attacks continue at elevated levels; disinformation is persistent but democratic systems adapt; autonomous weapons incidents occur but escalation is managed. The world is more dangerous and less functional than a governed alternative but not catastrophic.',
        outcome:'FUNCTIONAL ANARCHY -- ELEVATED RISK STEADY STATE',
        outcomeNarrative:'The AI Wild West produces a permanent elevation of background risk rather than a single catastrophic event. Democratic systems are resilient but strained; economies are productive but periodically disrupted; geopolitical stability is maintained but fragile. The opportunity cost of ungoverned AI is enormous -- the beneficial applications are also not fully realized -- but the catastrophic scenarios are avoided through adaptation rather than prevention.',
        finalLensScores:{ bigCycle:'Hegemonic Competition Without Governance', steep:{S:0.7,T:1.0,E:0.6,En:0.3,P:0.8}, geoEcon:'Export Controls -- inadequate governance in fragmented world', gameTheory:'Repeated Adaptation Game -- actors adapt to harms without solving the collective action problem' },
        historicalAnalog:'Internet governance: no formal global governance but functional ecosystem emerged; nuclear weapons without global governance but deterrence prevented catastrophe',
        aiPromptSeed:'Model how functional AI anarchy evolves over 10 years -- specifically at what capability level does the elevated risk steady state become unsustainable, triggering either governance breakthrough or catastrophic failure.' },
      'aiww-L4-democratic-resilience':{ id:'aiww-L4-democratic-resilience', layer:4, type:'terminal', title:'Democratic Resilience Architecture', label:'Democratic Resilience',
        narrative:'Democratic societies build comprehensive resilience to AI-enabled attacks on their foundations: authenticated information systems, AI cyber defense, autonomous weapons governance, and AI-literacy education. The Wild West continues in some domains but democracies have built genuine resistance.',
        outcome:'DEMOCRATIC RESILIENCE -- ADAPTATION TO AI THREATS',
        outcomeNarrative:'The AI Wild West ultimately strengthens democratic institutions by forcing them to adapt and invest in resilience architectures that competitive success in a benign environment never would have motivated. Democratic societies that build comprehensive AI resilience enter the 2030s more robust than before -- not because the threats disappeared but because they developed genuine immunity.',
        finalLensScores:{ bigCycle:'Democratic Institutional Strengthening', steep:{S:0.6,T:0.9,E:0.6,En:0.3,P:0.9}, geoEcon:'Alliance Architecture -- democratic resilience cooperation', gameTheory:'Adaptive Game -- democracies build immunity through successful adaptation' },
        historicalAnalog:'Post-Cold War democratic resilience to Soviet disinformation; UK resilience through WWII; Estonia digital resilience post-2007 cyberattacks',
        aiPromptSeed:'Model how democratic resilience architecture built in response to AI Wild West conditions performs when tested by the next generation of AI capabilities -- specifically whether resilience built for current threats generalizes to substantially more capable AI systems.' }
    }
  },

  { id:'ai-bubble-burst', cluster:'ai-tech', title:'The AI Bubble Burst', era:'2026-2030', timeHorizon:'near-term', primaryLens:'bigCycle',
    description:'Trillion-dollar AI investment expectations collide with slower-than-promised productivity materialization, triggering a financial correction that reshapes the technology industry and recalibrates AI deployment timelines.',
    tags:['AI','bubble','financial correction','productivity','technology investment','valuation'],
    aiPromptContext:'You are simulating the AI bubble burst scenario. Apply Big Cycle lens (asset price bubble deflation; credit cycle contraction), STEEP (E and T dominant), and game theory (market coordination problems; investor exit game; central bank intervention decision).',
    rootNodeId:'aibb-L0-trigger',
    nodes:{
      'aibb-L0-trigger':{ id:'aibb-L0-trigger', layer:0, type:'trigger', title:'AI Productivity Materializes Slower Than Expectations', label:'AI Bubble Trigger',
        narrative:'2026-2027: The gap between AI investment and AI productivity returns becomes undeniable. Corporations that replaced 30% of their knowledge workers with AI have seen productivity gains of 12%, not 50%. The economic transformation promised by AI boosters has materialized in the laboratory but not in the balance sheet. Revenue growth at major AI companies begins to slow; AI company valuations, which had reached historic multiples, start to compress. The trillion-dollar question: is this a timing issue -- benefits will come, just later -- or a structural disappointment?',
        lensSnapshot:{ bigCycle:{phase:'Speculative Asset Correction',note:'Financial cycle pattern: speculation exceeds productivity reality; correction follows'}, steep:{primary:'E',secondary:'T',note:'Economic revaluation of technology expectations; productivity reality vs. projection gap'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government AI subsidies reassessed as investment thesis questioned'}, gameTheory:{type:'Speculative Bubble Dynamics',note:'Expectation game: when consensus shifts from "inevitable" to "uncertain," correction is rapid'} },
        choicePrompt:'How severe is the AI investment correction?',
        choices:['aibb-L1-moderate','aibb-L1-severe','aibb-L1-selective'] },
      'aibb-L1-moderate':{ id:'aibb-L1-moderate', layer:1, type:'decision', title:'Moderate Correction -- 30-40% Valuation Decline', label:'Moderate Correction',
        narrative:'AI company valuations decline 30-40% from peak. The correction is significant but contained. Profitable AI companies survive; speculative pre-revenue companies face existential pressure. Investment in AI continues at a lower but more sustainable level. The correction is similar to the dot-com correction for profitable companies: painful but survivable.',
        lensSnapshot:{ bigCycle:{phase:'Speculative Correction -- Contained',note:'Bubble deflates without systemic financial crisis'}, steep:{primary:'E',secondary:'T',note:'Technology valuation resets; sustainable investment continues'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government AI programs reassessed but maintained at lower level'}, gameTheory:{type:'Rational Reassessment',note:'Market corrects to fundamental value; overvaluation removed without destroying underlying capability'} },
        secondOrderEffects:['Speculative pre-revenue AI companies face survival crisis; consolidation accelerates','AI talent market normalizes; compensation returns to pre-bubble levels','Long-term AI investment continues; timeline expectations adjusted to realistic 5-10 year horizon'],
        historicalAnalog:'Amazon post-dot-com: stock falls 90% but company survives and thrives; profitable companies survive corrections',
        choicePrompt:'With valuation correcting but industry surviving, how does AI investment reallocate toward highest-value applications?',
        choices:['aibb-L2-consolidation','aibb-L3-productivity-focus'] },
      'aibb-L1-severe':{ id:'aibb-L1-severe', layer:1, type:'decision', title:'Severe Correction -- 60-70% Valuation Decline; Financial Contagion', label:'Severe Correction',
        narrative:'The AI bubble burst is more severe than expected: 60-70% valuation declines in AI companies; major AI-focused investment funds collapse; the losses spread to broader financial markets through margin calls, fund redemptions, and confidence collapse. The correction has echoes of the dot-com bust.',
        lensSnapshot:{ bigCycle:{phase:'Speculative Bubble -- Full Burst',note:'Severe correction pattern: speculative excess produces commensurate correction'}, steep:{primary:'E',secondary:'T',note:'Financial contagion from technology sector to broader economy'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government response to financial instability from AI bubble'}, gameTheory:{type:'Contagion Game',note:'Losses spread through financial system interconnections; individually rational selling produces collective crisis'} },
        secondOrderEffects:['Multiple major AI companies declare bankruptcy; thousands of AI startups cease operations','GPU and semiconductor companies face demand collapse; supply chain adjustment is severe','AI talent mass layoffs; engineers move to other sectors; capability development slows substantially'],
        historicalAnalog:'Dot-com bust 2000-2002: NASDAQ fell 78%; many internet companies bankrupted; internet itself survived and thrived',
        choicePrompt:'With severe financial contagion spreading, how does the government response prevent further damage?',
        choices:['aibb-L2-bailout','aibb-L2-consolidation'] },
      'aibb-L1-selective':{ id:'aibb-L1-selective', layer:1, type:'decision', title:'Selective Correction -- Vertical-Specific Repricing', label:'Selective Correction',
        narrative:'The correction is highly selective: AI companies in sectors where productivity gains are clear and measurable -- code generation, data analysis, drug discovery -- maintain valuations. Companies in sectors where AI productivity claims are unproven -- AI-generated media, AI sales tools, AI customer service -- collapse. The market is not rejecting AI; it is repricing AI according to demonstrated results.',
        lensSnapshot:{ bigCycle:{phase:'Market Discrimination -- Sophisticated',note:'Market learns to distinguish AI value vs. AI hype at sector level'}, steep:{primary:'E',secondary:'T',note:'Selective repricing: demonstrated productivity vs. promised productivity'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government investment redirects toward proven AI applications'}, gameTheory:{type:'Market Learning Game',note:'Market develops discriminating information about AI value; correction is corrective not destructive'} },
        secondOrderEffects:['Surviving AI companies are the strongest; industry emerges more focused and credible','Investment reallocates to demonstrated-value applications; research productivity improves','AI skeptics validated on some applications; AI enthusiasts validated on others'],
        historicalAnalog:'Selective dot-com survival: Amazon and Google survived; Pets.com did not; market discriminated correctly',
        choicePrompt:'With selective correction distinguishing AI leaders from laggards, how does the competitive landscape restructure?',
        choices:['aibb-L2-consolidation','aibb-L3-productivity-focus'] },
      'aibb-L2-consolidation':{ id:'aibb-L2-consolidation', layer:2, type:'decision', title:'AI Industry Consolidation -- Survivors Acquire', label:'Industry Consolidation',
        narrative:'The correction triggers massive consolidation: profitable AI giants acquire distressed competitors at pennies on the dollar; talent concentrates in a smaller number of well-funded organizations; compute infrastructure consolidates. The AI industry emerges from the correction more concentrated but also more capable.',
        lensSnapshot:{ bigCycle:{phase:'Post-Bubble Consolidation',note:'Crisis consolidation creates stronger, more concentrated industry'}, steep:{primary:'E',secondary:'T',note:'Industry structure change; concentration increases'}, geoEcon:{tool:'Fiscal Statecraft',note:'Antitrust questions about AI concentration after correction consolidation'}, gameTheory:{type:'Acquisition Game',note:'Distress creates acquisition opportunities; winners become more dominant'} },
        secondOrderEffects:['AI capabilities concentrate in 3-5 major players globally','Antitrust concern: AI consolidation creates potential monopoly in critical infrastructure',"Surviving companies' talent and compute advantage becomes self-reinforcing"],
        historicalAnalog:'Banking consolidation post-2008; internet consolidation to FAANG post-dot-com; telecom consolidation post-dot-com',
        choicePrompt:'With AI industry consolidated into a small number of dominant players, how is the concentration of power governed?',
        choices:['aibb-L3-antitrust','aibb-L4-concentrated-ai'] },
      'aibb-L2-bailout':{ id:'aibb-L2-bailout', layer:2, type:'decision', title:'Government Emergency AI Industry Support', label:'Government Bailout',
        narrative:'Governments facing both financial contagion and national security concerns about AI capability loss provide emergency support: sovereign investment funds purchase equity in distressed AI companies; government contracts are accelerated; export controls prevent foreign acquisition of bankrupted AI assets.',
        lensSnapshot:{ bigCycle:{phase:'State Intervention -- Technology',note:'Government rescues strategic technology sector from financial crisis'}, steep:{primary:'P',secondary:'E',note:'Political decision to treat AI as strategic national asset; financial crisis triggers intervention'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government as buyer of last resort for strategic AI assets'}, gameTheory:{type:'Strategic Asset Preservation',note:'Government absorbs financial loss to preserve strategic capability'} },
        secondOrderEffects:['AI capabilities preserved by government intervention; competitive position maintained','Moral hazard: AI companies expect government rescue in future crises','Government gains significant equity positions in major AI companies; political economy changes'],
        historicalAnalog:'US auto industry bailout 2009; UK bank nationalization 2008; government semiconductor investment post-COVID',
        choicePrompt:'With government intervention stabilizing the AI industry, how is the relationship between government and AI industry structured going forward?',
        choices:['aibb-L3-antitrust','aibb-L4-state-ai'] },
      'aibb-L3-productivity-focus':{ id:'aibb-L3-productivity-focus', layer:3, type:'decision', title:'Post-Correction Focus on Demonstrated Productivity', label:'Productivity Focus',
        narrative:'Post-bubble AI investment shifts entirely to demonstrated productivity applications: AI products are funded only when they show clear ROI in user trials, not based on speculative future revenue. The investment philosophy changes from growth-at-any-cost to productivity-verified deployment.',
        lensSnapshot:{ bigCycle:{phase:'Market Maturation',note:'Post-speculative phase: productive investment replaces speculative investment'}, steep:{primary:'E',secondary:'T',note:'Economic rationalization of technology investment'}, geoEcon:{tool:'Fiscal Statecraft',note:'Government AI investment requires demonstrated productivity metrics'}, gameTheory:{type:'Fundamental Value Game',note:'Investors pay for demonstrated value, not promised value; more stable but slower growth'} },
        secondOrderEffects:['AI adoption becomes more gradual; productivity gains materialize more reliably','Investment in basic AI research declines; gap between research and application widens','Nations with patient capital (sovereign wealth funds) gain advantage in long-horizon AI investment'],
        historicalAnalog:'Post-dot-com internet investment: infrastructure and commerce focus; venture capital rationalization post-2000',
        choicePrompt:'With productivity-focused AI investment producing reliable returns, how does the quantum-AI convergence reshape the frontier?',
        choices:['aibb-L4-ai-utility','aibb-L4-concentrated-ai','aibb-L4-quantum-commercial'] },
      'aibb-L3-antitrust':{ id:'aibb-L3-antitrust', layer:3, type:'decision', title:'AI Antitrust Action -- Breaking Concentration', label:'AI Antitrust',
        narrative:'Governments concerned about post-bubble AI concentration initiate antitrust action: structural separation of dominant AI platforms, data sharing requirements, API access mandates, and restrictions on AI company acquisitions. The action is contested and slow but eventually produces a less concentrated AI industry.',
        lensSnapshot:{ bigCycle:{phase:'Regulatory Architecture -- AI',note:'Antitrust as structural response to AI concentration'}, steep:{primary:'P',secondary:'E',note:'Political intervention in AI market structure'}, geoEcon:{tool:'Fiscal Statecraft',note:'Regulatory statecraft to prevent AI monopoly'}, gameTheory:{type:'Antitrust Game',note:'Government uses market power regulation to change AI industry equilibrium'} },
        secondOrderEffects:['AI capabilities diffuse to more competitors; concentration reduced','Innovation pace may slow as large companies lose network effect advantages','International AI competitiveness affected if domestic companies are constrained while foreign ones are not'],
        historicalAnalog:'AT&T antitrust breakup 1984; Microsoft antitrust 2000; potential AI antitrust actions',
        choicePrompt:'With antitrust action reshaping AI industry structure, what governance architecture emerges?',
        choices:['aibb-L4-ai-utility','aibb-L4-concentrated-ai'] },
      'aibb-L4-ai-utility':{ id:'aibb-L4-ai-utility', layer:4, type:'terminal', title:'AI as Regulated Utility Infrastructure', label:'AI Utility Infrastructure',
        narrative:'Post-bubble, AI capabilities are restructured as regulated infrastructure: foundational AI models are treated as public utilities with mandatory access, standard pricing, and government oversight. The innovation-access tradeoff of regulated utilities applies: less innovation dynamism but universal access and price stability.',
        outcome:'AI AS REGULATED PUBLIC UTILITY',
        outcomeNarrative:'The AI bubble burst and subsequent consolidation produces an unexpected governance innovation: AI foundational capabilities are regulated as public utilities. The regulated utility model ensures universal access to AI productivity gains, prevents rent extraction by monopolists, and provides stable governance architecture. The innovation pace slows compared to the bubble era but the benefits are more broadly distributed.',
        finalLensScores:{ bigCycle:'Post-Speculative Maturation -- Utility Infrastructure', steep:{S:0.7,T:0.7,E:0.8,En:0.3,P:0.8}, geoEcon:'Fiscal Statecraft -- regulated AI utility model', gameTheory:'Regulated Monopoly -- public utility governance aligns AI company incentives with public interest' },
        historicalAnalog:'AT&T as regulated utility; electrical grid as public utility; internet as lightly regulated utility; nuclear power utility regulation',
        aiPromptSeed:'Model how the regulated AI utility model evolves as capabilities continue to advance, specifically whether utility regulation can accommodate the pace of AI capability development and whether rate-regulated AI companies can compete with unregulated foreign AI programs.' },
      'aibb-L4-concentrated-ai':{ id:'aibb-L4-concentrated-ai', layer:4, type:'terminal', title:'Oligopolistic AI Industry -- 3-5 Dominant Players', label:'AI Oligopoly',
        narrative:'The post-bubble consolidation produces a stable oligopoly: 3-5 companies control the vast majority of AI capability globally. Competition among them is fierce but the barriers to entry for new competitors are insurmountable. The oligopoly delivers reliable AI productivity gains but captures a disproportionate share of the value created.',
        outcome:'AI OLIGOPOLY -- CONCENTRATED INDUSTRY STRUCTURE',
        outcomeNarrative:'The AI industry emerges from the bubble and bust as a concentrated oligopoly that is simultaneously productive and concerning. The oligopolists invest heavily in capability development; competition among them drives prices down over time; but the concentration creates geopolitical risk (control over critical AI infrastructure), distributional concerns (oligopolists capture disproportionate value), and governance challenges (who governs the oligopolists who govern AI?).',
        finalLensScores:{ bigCycle:'Post-Bubble Oligopoly Formation', steep:{S:0.5,T:0.9,E:0.8,En:0.2,P:0.7}, geoEcon:'Alliance Architecture -- AI oligopoly geopolitics', gameTheory:'Oligopoly Game -- few players; competition and coordination; significant market power' },
        historicalAnalog:'Post-dot-com internet oligopoly (Google, Amazon, Facebook, Apple, Microsoft); oil major oligopoly; banking oligopoly',
        aiPromptSeed:'Model how the AI oligopoly structure shapes the deployment and governance of increasingly powerful AI capabilities -- specifically whether oligopolistic competition produces better or worse safety and governance outcomes than either competitive markets or regulated utilities.' },
      'aibb-L4-state-ai':{ id:'aibb-L4-state-ai', layer:4, type:'terminal', title:'State-Owned AI Infrastructure -- National AI Programs', label:'State AI Programs',
        narrative:'Government bailouts and strategic investments during the bubble burst transition into permanent government ownership or partnership in major AI companies. National AI programs replace or supplement private market AI development.',
        outcome:'STATE AI INFRASTRUCTURE -- NATIONAL PROGRAM MODEL',
        outcomeNarrative:'The AI bubble burst accelerates the transition to state-involved AI development. Nations that provided emergency support now hold significant equity and strategic direction over major AI capabilities. The model combines state resources with private talent and creates AI programs that prioritize national interest over shareholder return. The trade-off: more resources, more strategic focus, less innovation dynamism.',
        finalLensScores:{ bigCycle:'State-Led Technology Development', steep:{S:0.5,T:0.8,E:0.7,En:0.3,P:0.9}, geoEcon:'Technological Statecraft -- state AI program', gameTheory:'State-Corporate Hybrid Game -- government and private sector share AI development' },
        historicalAnalog:'French and UK nuclear programs; DARPA model; Chinese state AI investment; national semiconductor programs',
        aiPromptSeed:'Model how national state AI programs compete with private sector AI development across democratic and authoritarian contexts, tracing whether state ownership accelerates or retards capability development at the frontier.' },
      'aibb-L4-quantum-commercial':{ id:'aibb-L4-quantum-commercial', layer:4, type:'terminal', title:'Quantum-AI Convergence -- New Capability Frontier', label:'Quantum-AI Pivot',
        narrative:'Post-bubble consolidation redirects investment toward the next capability frontier: quantum-AI hybrid systems. Fault-tolerant quantum computers amplify AI capabilities in optimization, materials discovery, and cryptography. The bubble burst becomes the inflection point that redirected capital from speculative AI applications toward foundational quantum-AI infrastructure.',
        outcome:'QUANTUM-AI CONVERGENCE -- NEXT CAPABILITY CYCLE BEGINS',
        outcomeNarrative:'The AI bubble burst proves to be a productive reallocation rather than a terminal decline. Capital and talent redirected from speculative AI applications flows into quantum-AI convergence research. Within a decade, quantum-enhanced AI systems crack optimization problems that classical AI cannot solve, opening new productive frontiers in drug discovery, materials science, climate modeling, and financial optimization. The bubble and bust was the clearing event that enabled the next technological cycle.',
        finalLensScores:{ bigCycle:'New-Cycle-Entry -- Quantum-AI', steep:{S:0.3,T:1.0,E:0.7,En:0.5,P:0.6}, geoEcon:'Technological Statecraft -- quantum-AI as next geopolitical frontier', gameTheory:'First-Mover Game -- quantum-AI capability lead compounds; race dynamics return' },
        historicalAnalog:'Post-dot-com internet infrastructure investment enabling Web 2.0; post-semiconductor bubble enabling mobile computing wave',
        aiPromptSeed:'Model how quantum-AI convergence reshapes the geopolitical technology race -- specifically which nations achieve quantum-AI capability first, how existing AI export controls apply to quantum hardware, and whether the quantum-AI transition restarts the arms race dynamics of the 2020s AI bubble era.' }
    }
  }

];

function GeoEconScenarioEmulatorTool() {
  const [gseView, setGseView] = useState('hub');
  const [activeScenario, setActiveScenario] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [decisionVector, setDecisionVector] = useState([]);
  const [simPath, setSimPath] = useState([]);
  const [lensScores, setLensScores] = useState(() => gseInitLens());
  const [clusterFilter, setClusterFilter] = useState('all');
  const [completions, setCompletions] = useState(() => { try { return JSON.parse(localStorage.getItem(GSE_COMPLETION_KEY) || '{}'); } catch { return {}; } });
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem(GSE_HISTORY_KEY) || '[]'); } catch { return []; } });
  const [synthText, setSynthText] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);
  const [synthError, setSynthError] = useState('');
  const [pendingCarriedLens, setPendingCarriedLens] = useState(null);
  const [pendingEntryNodeId, setPendingEntryNodeId] = useState(null);
  const [simPathOpen, setSimPathOpen] = useState(false);

  const currentNode = activeScenario?.nodes?.[currentNodeId];
  const cm = activeScenario ? GSE_CLUSTER_META[activeScenario.cluster] : null;
  const trajectory = gseCalcTrajectory(lensScores, decisionVector);

  const terminalNodes = (sc) => Object.values(sc.nodes || {}).filter(n => n.type === 'terminal');
  const completedCount = (sc) => terminalNodes(sc).filter(n => completions[n.id]).length;

  const startBrief = (sc) => {
    setActiveScenario(sc);
    setGseView('brief');
  };

  const startSim = () => {
    if (!activeScenario) return;
    const entryId = pendingEntryNodeId || activeScenario.rootNodeId;
    const entryNode = activeScenario.nodes[entryId];
    const base = pendingCarriedLens ? pendingCarriedLens : gseInitLens();
    const updatedLens = entryNode?.lensSnapshot ? gseUpdateLens(base, entryNode.lensSnapshot) : base;
    const initDV = (pendingEntryNodeId && entryNode && entryNode.layer > 0)
      ? [{ nodeId: entryId, nodeTitle: entryNode.title, choiceId: entryId, layer: entryNode.layer || 0, timestamp: Date.now() }]
      : [];
    const initPath = (pendingEntryNodeId && entryNode && entryNode.layer > 0)
      ? [entryNode.label || entryNode.title]
      : [];
    setCurrentNodeId(entryId);
    setDecisionVector(initDV);
    setSimPath(initPath);
    setLensScores(updatedLens);
    setPendingCarriedLens(null);
    setPendingEntryNodeId(null);
    setSynthText(''); setSynthError('');
    setSimPathOpen(false);
    setGseView('sim');
  };

  const followChainLink = (link) => {
    const targetSc = GSE_SCENARIOS.find(s => s.id === link.toScenario);
    if (!targetSc) return;
    const carried = gseInitLens();
    GSE_STEEP_DIMENSIONS.forEach(d => { carried.steep[d] = lensScores.steep[d] * 0.5; });
    carried.gameTheory.cooperateCount = Math.floor(lensScores.gameTheory.cooperateCount * 0.5);
    carried.gameTheory.defectCount   = Math.floor(lensScores.gameTheory.defectCount   * 0.5);
    carried.geoEcon.toolsDeployed   = [...lensScores.geoEcon.toolsDeployed];
    carried.geoEcon.intensityScore  = Math.floor(lensScores.geoEcon.intensityScore * 0.5);
    carried.bigCycle.phase          = lensScores.bigCycle.phase;
    carried.bigCycle.history        = [...lensScores.bigCycle.history];
    setPendingCarriedLens(carried);
    setPendingEntryNodeId(link.toNodeId);
    setActiveScenario(targetSc);
    setGseView('brief');
  };

  const makeChoice = (choiceId) => {
    if (!activeScenario || !currentNode) return;
    const { available } = gseEvalChoice(choiceId, decisionVector, lensScores);
    if (!available) return;
    const targetNode = activeScenario.nodes[choiceId];
    if (!targetNode) return;
    const newDV = [...decisionVector, { nodeId: currentNodeId, nodeTitle: currentNode.title, choiceId, layer: currentNode.layer || 0, timestamp: Date.now() }];
    const newPath = [...simPath, targetNode.label || targetNode.title];
    const newLens = targetNode.lensSnapshot ? gseUpdateLens(lensScores, targetNode.lensSnapshot) : lensScores;
    setDecisionVector(newDV);
    setSimPath(newPath);
    setLensScores(newLens);
    setCurrentNodeId(choiceId);
    setSynthText(''); setSynthError('');
    if (targetNode.type === 'terminal') {
      const nc = { ...completions, [choiceId]: { scenarioId: activeScenario.id, ts: Date.now() } };
      const rec = {
        scenarioId: activeScenario.id, scenarioTitle: activeScenario.title, cluster: activeScenario.cluster,
        outcome: targetNode.outcome, terminalNodeId: choiceId, pathLabels: newPath,
        trajectory: gseCalcTrajectory(newLens, newDV).label,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), ts: Date.now()
      };
      const nh = [rec, ...history].slice(0, 40);
      setCompletions(nc); setHistory(nh);
      try { localStorage.setItem(GSE_COMPLETION_KEY, JSON.stringify(nc)); localStorage.setItem(GSE_HISTORY_KEY, JSON.stringify(nh)); } catch {}
      setGseView('debrief');
    }
  };

  const runSynthesis = async () => {
    if (!currentNode?.aiPromptSeed || synthLoading) return;
    setSynthLoading(true); setSynthText(''); setSynthError('');
    const pathStr = simPath.join(' > ');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `GeoEcon Scenario: ${activeScenario.title}`, dimension: 'synthesis',
          prompt: `You are a geopolitical scenario analyst. ${currentNode.aiPromptSeed}\n\nDecision path taken: ${pathStr || 'direct'}\n\nBig Cycle phase: ${lensScores.bigCycle.phase}. STEEP dominant: ${gseGetSteepDominant(lensScores.steep)}. Game theory pattern: ${lensScores.gameTheory.dominantPattern || 'Mixed'}. GeoEcon tools deployed: ${lensScores.geoEcon.toolsDeployed.join(', ') || 'none'}.\n\nProvide a structured analytical synthesis in three paragraphs: (1) the key strategic dynamics and structural forces at play in this outcome, (2) second-order effects and medium-term implications across economic, political, and technological dimensions, (3) positioning implications for institutional, policy, and investment actors over a 3-5 year horizon. Write in precise, practitioner-grade analytical language. Do not use em dashes.`
        })
      });
      if (!res.ok) throw new Error('Request failed');
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') continue;
          try { const p = JSON.parse(d); const delta = p.choices?.[0]?.delta?.content || p.delta?.text || ''; if (delta) setSynthText(t => t + delta); } catch {}
        }
      }
    } catch { setSynthError('Synthesis request failed. Verify API key configuration.'); }
    setSynthLoading(false);
  };

  // ----- RENDER: HUB -----
  const renderHub = () => {
    const clusters = Object.entries(GSE_CLUSTER_META);
    const filtered = clusterFilter === 'all' ? clusters : clusters.filter(([k]) => k === clusterFilter);
    const totalTerminalsReachedGlobal = Object.keys(completions).length;
    return (
      <div className="px-4 py-5 md:px-6">
        <div className="flex gap-1 mb-5 flex-wrap items-center">
          {[['all', 'All'], ...clusters.map(([k, m]) => [k, m.label])].map(([v, l]) => (
            <button key={v} onClick={() => setClusterFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${clusterFilter === v ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white bg-slate-800/50'}`}>{l}</button>
          ))}
          {totalTerminalsReachedGlobal > 0 && <span className="ml-auto text-xs text-slate-600">{totalTerminalsReachedGlobal} terminal{totalTerminalsReachedGlobal !== 1 ? 's' : ''} reached</span>}
        </div>
        {filtered.map(([clusterId, clusterMeta]) => {
          const clusterScenarios = GSE_SCENARIOS.filter(s => s.cluster === clusterId);
          return (
            <div key={clusterId} className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: clusterMeta.accent }}>{clusterMeta.icon}</span>
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: clusterMeta.accent }}>{clusterMeta.label}</h3>
                <span className="text-slate-600 text-xs hidden md:inline">{clusterMeta.desc}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clusterScenarios.map(sc => {
                  const terminals = terminalNodes(sc);
                  return (
                    <button key={sc.id} onClick={() => startBrief(sc)}
                      className="text-left rounded-xl p-4 border transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: clusterMeta.bg, borderColor: clusterMeta.border }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-white text-xs font-bold leading-snug">{sc.title}</h4>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-2 line-clamp-2">{sc.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className="text-slate-600 text-xs">{sc.era}</span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-800/60 text-slate-500">{sc.primaryLens}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-800/60 text-slate-500">{sc.timeHorizon}</span>
                      </div>
                      {terminals.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {terminals.map(t => (
                            <span key={t.id} title={t.title}
                              className="w-2 h-2 rounded-full transition-all"
                              style={{ background: completions[t.id] ? clusterMeta.accent : 'rgba(100,116,139,0.3)', border: `1px solid ${completions[t.id] ? clusterMeta.accent : '#334155'}` }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ----- RENDER: BRIEF -----
  const renderBrief = () => {
    if (!activeScenario || !cm) return null;
    const done = completedCount(activeScenario);
    const total = terminalNodes(activeScenario).length;
    return (
      <div className="px-4 py-5 md:px-6 max-w-2xl mx-auto">
        <button onClick={() => setGseView('hub')} className="text-slate-500 hover:text-white text-xs transition-colors mb-4 block">Back to Hub</button>
        <div className="rounded-2xl border p-5 mb-5" style={{ borderColor: cm.border, background: cm.bg }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: cm.accent }}>{cm.icon}</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cm.accent }}>{cm.label}</span>
            {done > 0 && <span className="ml-auto text-xs font-semibold" style={{ color: cm.accent }}>{done}/{total} terminals reached</span>}
          </div>
          <h2 className="text-white font-black text-lg leading-tight mb-1">{activeScenario.title}</h2>
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">{activeScenario.era}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">{activeScenario.timeHorizon}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">{activeScenario.primaryLens}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{activeScenario.description}</p>
          {activeScenario.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeScenario.tags.map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-500">{t}</span>
              ))}
            </div>
          )}
        </div>
        {activeScenario.aiPromptContext && (
          <div className="rounded-xl border mb-4 p-4" style={{ borderColor: `${cm.accent}25`, background: `${cm.accent}08` }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: cm.accent }}>Analytical Frame</div>
            <p className="text-slate-300 text-xs leading-relaxed">{activeScenario.aiPromptContext}</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4 mb-5">
          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">What to expect</div>
          <ul className="space-y-1.5">
            <li className="text-xs text-slate-400 flex gap-2"><span className="text-slate-600 flex-shrink-0">-</span><span>Navigate a branching decision tree across {Object.keys(activeScenario.nodes || {}).length} nodes and up to 5 layers</span></li>
            <li className="text-xs text-slate-400 flex gap-2"><span className="text-slate-600 flex-shrink-0">-</span><span>Some choices are conditionally locked based on your prior decisions in this path</span></li>
            <li className="text-xs text-slate-400 flex gap-2"><span className="text-slate-600 flex-shrink-0">-</span><span>Lens scores accumulate across your path: Big Cycle, STEEP, GeoEcon, Game Theory</span></li>
            <li className="text-xs text-slate-400 flex gap-2"><span className="text-slate-600 flex-shrink-0">-</span><span>Terminal outcomes include an AI synthesis extension and cross-scenario chain links</span></li>
          </ul>
        </div>
        <button onClick={startSim}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: `linear-gradient(135deg, ${cm.accent}30, ${cm.accent}18)`, color: cm.accent, border: `1.5px solid ${cm.accent}40` }}>
          Begin Simulation
        </button>
      </div>
    );
  };

  // ----- RENDER: SIM -----
  const renderSim = () => {
    if (!currentNode || !cm) return null;
    const allLayers = Object.values(activeScenario.nodes).map(n => n.layer || 0);
    const maxLayer = Math.max(...allLayers);
    const ls = lensScores;
    const steepDom = gseGetSteepDominant(ls.steep);
    return (
      <div className="px-4 py-4 md:px-6 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap text-xs">
          <button onClick={() => setGseView('hub')} className="text-slate-500 hover:text-white transition-colors">Hub</button>
          <span className="text-slate-700">›</span>
          <button onClick={() => setGseView('brief')} className="text-slate-500 hover:text-white transition-colors truncate max-w-[100px]">{activeScenario.title}</button>
          {simPath.slice(0, -1).map((label, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-slate-700">›</span>
              <span className="text-slate-600 truncate max-w-[60px]">{label}</span>
            </span>
          ))}
          <span className="text-slate-700">›</span>
          <span className="font-medium" style={{ color: cm.accent }}>Layer {currentNode.layer}</span>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: maxLayer + 1 }).map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i <= (currentNode.layer || 0) ? cm.accent : '#1e293b' }} />
          ))}
        </div>
        {/* Node */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs px-2 py-0.5 rounded-md uppercase font-semibold"
              style={{ background: `${cm.accent}18`, color: cm.accent }}>
              {currentNode.type === 'trigger' ? 'Trigger Event' : `Layer ${currentNode.layer} Decision`}
            </span>
          </div>
          <h2 className="text-white font-bold text-base leading-tight mb-2">{currentNode.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{currentNode.narrative}</p>
        </div>
        {/* Path so far collapsible */}
        {decisionVector.length > 0 && (
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 mb-3">
            <button onClick={() => setSimPathOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Path so far ({decisionVector.length} step{decisionVector.length !== 1 ? 's' : ''})</span>
              <span>{simPathOpen ? '▲' : '▼'}</span>
            </button>
            {simPathOpen && (
              <div className="px-3 pb-3 space-y-1">
                {decisionVector.map((dv, i) => {
                  const choiceNode = activeScenario.nodes[dv.choiceId];
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-700 flex-shrink-0 w-4 text-right">{i + 1}.</span>
                      <span className="text-slate-500">{dv.nodeTitle}</span>
                      <span className="text-slate-700">to</span>
                      <span className="text-slate-400" style={{ color: cm?.accent }}>{choiceNode?.label || choiceNode?.title || dv.choiceId}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Persistent 4-lens snapshot + running accumulator */}
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-3 mb-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Live Lens Panel</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Big Cycle */}
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#f59e0b' }}>Big Cycle</div>
              <div className="text-white text-xs font-medium leading-snug">{ls.bigCycle.phase || 'Initializing'}</div>
              {ls.bigCycle.history.length > 0 && (
                <div className="text-slate-600 text-xs mt-1 leading-tight space-y-0.5">
                  {ls.bigCycle.history.slice(-4).map((h, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-slate-700">{i + 1}.</span>
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* STEEP */}
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#a78bfa' }}>STEEP</div>
              <div className="text-white text-xs font-medium leading-snug">Dominant: {steepDom}</div>
              <div className="mt-1.5 space-y-0.5">
                {GSE_STEEP_DIMENSIONS.map(d => {
                  const pct = Math.round((ls.steep[d] || 0) * 100);
                  return (
                    <div key={d} className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-xs w-5 flex-shrink-0">{d}</span>
                      <div className="flex-1 h-1 rounded-full bg-slate-700/60">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: '#a78bfa' }} />
                      </div>
                      <span className="text-slate-500 text-xs w-7 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* GeoEcon */}
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#2dd4bf' }}>GeoEcon</div>
              <div className="text-white text-xs font-medium leading-snug">{ls.geoEcon.dominantTool || 'None yet'}</div>
              {ls.geoEcon.toolsDeployed.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {ls.geoEcon.toolsDeployed.map((t, i) => (
                    <div key={i} className="text-slate-500 text-xs flex items-center gap-1">
                      <span className="text-slate-700">-</span><span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Game Theory */}
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#60a5fa' }}>Game Theory</div>
              <div className="text-white text-xs font-medium leading-snug">{ls.gameTheory.dominantPattern || 'Mixed'}</div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Cooperate</span>
                <span className="font-semibold" style={{ color: '#4ade80' }}>{ls.gameTheory.cooperateCount}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">Defect</span>
                <span className="font-semibold" style={{ color: '#f87171' }}>{ls.gameTheory.defectCount}</span>
              </div>
              {ls.gameTheory.moves.length > 0 && (
                <div className="mt-1 text-xs text-slate-600 leading-tight">
                  {ls.gameTheory.moves.slice(-3).join(', ')}
                </div>
              )}
            </div>
          </div>
          {/* Per-node snapshot note */}
          {currentNode.lensSnapshot && (
            <div className="border-t border-slate-700/30 pt-2 mt-1">
              <div className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1">This Node</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {currentNode.lensSnapshot.bigCycle?.phase && <span className="text-slate-500"><span className="text-slate-400">BC:</span> {currentNode.lensSnapshot.bigCycle.phase}</span>}
                {currentNode.lensSnapshot.steep?.primary && <span className="text-slate-500"><span className="text-slate-400">STEEP:</span> {currentNode.lensSnapshot.steep.primary}{currentNode.lensSnapshot.steep.secondary ? '/' + currentNode.lensSnapshot.steep.secondary : ''}</span>}
                {currentNode.lensSnapshot.geoEcon?.tool && <span className="text-slate-500"><span className="text-slate-400">Tool:</span> {currentNode.lensSnapshot.geoEcon.tool}</span>}
                {currentNode.lensSnapshot.gameTheory?.type && <span className="text-slate-500"><span className="text-slate-400">GT:</span> {currentNode.lensSnapshot.gameTheory.type}</span>}
              </div>
            </div>
          )}
        </div>
        {/* Second-order effects */}
        {currentNode.secondOrderEffects?.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Second-Order Effects</div>
            <ul className="space-y-1">
              {currentNode.secondOrderEffects.map((e, i) => (
                <li key={i} className="text-xs text-slate-400 flex gap-2">
                  <span className="text-slate-600 flex-shrink-0 mt-0.5">-</span><span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Historical analog */}
        {currentNode.historicalAnalog && (
          <div className="text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-400">Historical analog: </span>{currentNode.historicalAnalog}
          </div>
        )}
        {/* Choices with conditional lock evaluation */}
        {currentNode.choicePrompt && currentNode.choices?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 leading-relaxed">{currentNode.choicePrompt}</div>
            <div className="space-y-2">
              {currentNode.choices.map((cid, idx) => {
                const cn = activeScenario.nodes[cid];
                if (!cn) return null;
                const { available, lockReason } = gseEvalChoice(cid, decisionVector, lensScores);
                return (
                  <button key={cid} onClick={() => makeChoice(cid)}
                    disabled={!available}
                    className={`w-full text-left rounded-xl p-3 border transition-all ${available ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60' : 'border-slate-800/50 bg-slate-900/30 opacity-50 cursor-not-allowed'}`}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{ background: available ? `${cm.accent}20` : '#1e293b', color: available ? cm.accent : '#475569' }}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold mb-0.5 flex items-center gap-2 flex-wrap">
                          <span className={available ? 'text-white' : 'text-slate-500'}>{cn.label || cn.title}</span>
                          {!available && <span className="text-slate-600 font-normal">Locked</span>}
                        </div>
                        {available && cn.narrative && (
                          <div className="text-slate-400 text-xs leading-relaxed">
                            {cn.narrative.slice(0, 140)}{cn.narrative.length > 140 ? '...' : ''}
                          </div>
                        )}
                        {!available && lockReason && (
                          <div className="text-slate-600 text-xs">{lockReason}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----- RENDER: DEBRIEF -----
  const renderDebrief = () => {
    if (!currentNode || !cm) return null;
    const ls = lensScores;
    const steepChartData = GSE_STEEP_DIMENSIONS.map(d => ({ dim: d, v: Math.round((ls.steep[d] || 0) * 100) }));
    const crossLinks = gseGetCrossLinks(activeScenario.id, currentNodeId);
    const steepDom = gseGetSteepDominant(ls.steep);
    const accumulatedSOE = (() => {
      const seen = new Set();
      const effects = [];
      decisionVector.forEach(dv => {
        const n = activeScenario.nodes[dv.nodeId];
        (n?.secondOrderEffects || []).forEach(e => { if (!seen.has(e)) { seen.add(e); effects.push(e); } });
      });
      (currentNode.secondOrderEffects || []).forEach(e => { if (!seen.has(e)) { seen.add(e); effects.push(e); } });
      return effects;
    })();
    return (
      <div className="px-4 py-4 md:px-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-xs px-2 py-1 rounded-lg font-bold uppercase tracking-wider"
            style={{ background: `${cm.accent}20`, color: cm.accent }}>Outcome Reached</span>
          <span className="text-xs px-2 py-1 rounded-lg font-semibold"
            style={{ background: `${trajectory.color}18`, color: trajectory.color }}>{trajectory.label}</span>
          <button onClick={() => setGseView('hub')} className="ml-auto text-slate-500 hover:text-white text-xs transition-colors">Back to Hub</button>
        </div>
        {/* Outcome card */}
        <div className="rounded-xl border p-4 mb-4" style={{ borderColor: `${cm.accent}30`, background: `${cm.accent}08` }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cm.accent }}>{currentNode.outcome}</div>
          <h2 className="text-white font-bold text-base leading-tight mb-2">{currentNode.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{currentNode.outcomeNarrative || currentNode.narrative}</p>
        </div>
        {/* Accumulated lens profile + STEEP chart */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Accumulated Lens Profile</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#f59e0b' }}>Big Cycle</div>
              <div className="text-white text-xs font-medium leading-snug">{ls.bigCycle.phase}</div>
              {ls.bigCycle.note && <div className="text-slate-500 text-xs mt-0.5 leading-tight">{ls.bigCycle.note}</div>}
            </div>
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#60a5fa' }}>Game Theory</div>
              <div className="text-white text-xs font-medium">{ls.gameTheory.dominantPattern || 'Mixed'}</div>
              <div className="text-slate-500 text-xs mt-0.5">Cooperate: {ls.gameTheory.cooperateCount} / Defect: {ls.gameTheory.defectCount}</div>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#2dd4bf' }}>GeoEcon Tools</div>
              <div className="text-white text-xs font-medium">{ls.geoEcon.dominantTool || 'None'}</div>
              {ls.geoEcon.toolsDeployed.length > 0 && <div className="text-slate-500 text-xs mt-0.5 leading-tight">{ls.geoEcon.toolsDeployed.join(', ')}</div>}
            </div>
            <div className="rounded-lg bg-slate-800/60 p-2">
              <div className="text-xs font-semibold mb-0.5" style={{ color: '#a78bfa' }}>STEEP Dominant</div>
              <div className="text-white text-xs font-medium">{steepDom}</div>
              <div className="text-slate-500 text-xs mt-0.5">Activations: {ls.steep.activationCount}</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-1.5">STEEP Accumulated Intensity</div>
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={steepChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="dim" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} formatter={v => [`${v}%`, 'Intensity']} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]} fill={cm.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Terminal lens assessment from node data */}
        {currentNode.finalLensScores && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3 mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Terminal Assessment</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[['Big Cycle', currentNode.finalLensScores.bigCycle, '#f59e0b'],
                ['GeoEcon', currentNode.finalLensScores.geoEcon, '#2dd4bf'],
                ['Game Theory', currentNode.finalLensScores.gameTheory, '#60a5fa']
              ].map(([label, val, color]) => val && (
                <div key={label} className="rounded-lg bg-slate-800/60 p-2">
                  <div className="text-xs font-semibold mb-0.5" style={{ color }}>{label}</div>
                  <div className="text-slate-300 text-xs leading-snug">{val}</div>
                </div>
              ))}
              {currentNode.finalLensScores.steep && typeof currentNode.finalLensScores.steep === 'object' && (
                <div className="rounded-lg bg-slate-800/60 p-2">
                  <div className="text-xs font-semibold mb-1" style={{ color: '#a78bfa' }}>STEEP</div>
                  <div className="space-y-0.5">
                    {GSE_STEEP_DIMENSIONS.map(d => {
                      const val = currentNode.finalLensScores.steep[d];
                      if (val === undefined) return null;
                      const pct = Math.round(val * 100);
                      return (
                        <div key={d} className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-xs w-5 flex-shrink-0">{d}</span>
                          <div className="flex-1 h-1 rounded-full bg-slate-700/60">
                            <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: '#a78bfa' }} />
                          </div>
                          <span className="text-slate-400 text-xs w-7 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Decision path summary */}
        {decisionVector.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Decision Vector ({decisionVector.length} steps)</div>
            <div className="space-y-1">
              {decisionVector.map((dv, i) => {
                const choiceNode = activeScenario.nodes[dv.choiceId];
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-600 flex-shrink-0 w-4 text-right">L{dv.layer || i}.</span>
                    <span className="text-slate-500">{dv.nodeTitle}</span>
                    <span className="text-slate-700">to</span>
                    <span className="font-medium" style={{ color: cm.accent }}>{choiceNode?.label || choiceNode?.title || dv.choiceId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Accumulated second-order effects */}
        {accumulatedSOE.length > 0 && (
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-3 mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Accumulated Second-Order Effects</div>
            <ul className="space-y-1.5">
              {accumulatedSOE.map((e, i) => (
                <li key={i} className="text-xs text-slate-400 flex gap-2">
                  <span className="text-slate-600 flex-shrink-0 mt-0.5">-</span><span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Historical analog */}
        {currentNode.historicalAnalog && (
          <div className="text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-400">Historical analog: </span>{currentNode.historicalAnalog}
          </div>
        )}
        {/* Cross-scenario chain cards */}
        {crossLinks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cross-Scenario Chains</div>
            <div className="space-y-2">
              {crossLinks.map((link, i) => {
                const targetSc = GSE_SCENARIOS.find(s => s.id === link.toScenario);
                if (!targetSc) return null;
                const tcm = GSE_CLUSTER_META[targetSc.cluster];
                return (
                  <div key={i} className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-3">
                    <div className="text-white text-xs font-semibold mb-0.5">{link.linkLabel}</div>
                    <div className="text-slate-400 text-xs mb-2">{link.rationale}</div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: tcm?.accent || '#94a3b8' }}>Chain into: {targetSc.title}</span>
                      <button onClick={() => followChainLink(link)}
                        className="text-xs px-3 py-1 rounded-lg font-medium transition-all border"
                        style={{ borderColor: `${tcm?.accent || '#94a3b8'}40`, color: tcm?.accent || '#94a3b8', background: `${tcm?.accent || '#94a3b8'}10` }}>
                        Chain into this scenario
                      </button>
                    </div>
                    <div className="text-slate-600 text-xs mt-1.5">Lens scores carry forward at 50%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* AI synthesis */}
        {currentNode.aiPromptSeed && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-400">AI Synthesis Extension</div>
              {!synthText && !synthLoading && (
                <button onClick={runSynthesis}
                  className="text-xs px-3 py-1 rounded-lg font-medium transition-all border"
                  style={{ borderColor: `${cm.accent}40`, color: cm.accent, background: `${cm.accent}10` }}>
                  Generate Synthesis
                </button>
              )}
            </div>
            {synthLoading && !synthText && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: cm.accent, borderTopColor: 'transparent' }} />
                Synthesizing...
              </div>
            )}
            {synthError && <div className="text-xs text-red-400">{synthError}</div>}
            {synthText && (
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {synthText}
                {synthLoading && <span className="inline-block w-1.5 h-3 ml-0.5 bg-slate-400 animate-pulse rounded-sm" />}
              </div>
            )}
          </div>
        )}
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={startSim}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border"
            style={{ borderColor: `${cm.accent}30`, color: cm.accent, background: `${cm.accent}10` }}>
            Replay
          </button>
          <button onClick={() => setGseView('brief')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 hover:text-white transition-all">
            Brief
          </button>
          <button onClick={() => setGseView('hub')}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 hover:text-white transition-all">
            New Scenario
          </button>
        </div>
      </div>
    );
  };

  // ----- RENDER: HISTORY -----
  const renderHistory = () => (
    <div className="px-4 py-4 md:px-6 max-w-3xl mx-auto">
      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No completed scenarios yet. Run a simulation to record outcomes here.</div>
      ) : (
        <div className="space-y-2">
          {history.map((rec, i) => {
            const rcm = GSE_CLUSTER_META[rec.cluster] || GSE_CLUSTER_META.historical;
            return (
              <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-white text-xs font-semibold leading-snug">{rec.scenarioTitle}</div>
                  <span className="text-slate-600 text-xs flex-shrink-0">{rec.date}</span>
                </div>
                <div className="text-xs font-bold uppercase mb-1" style={{ color: rcm.accent }}>{rec.outcome}</div>
                {rec.trajectory && <div className="text-slate-500 text-xs mb-1.5">{rec.trajectory}</div>}
                {rec.pathLabels?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.pathLabels.map((l, j) => (
                      <span key={j} className="text-xs px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500">{l}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const totalTerminalsReached = Object.keys(completions).length;

  return (
    <div className="h-full flex flex-col bg-[#06060f]">
      <div className="flex-shrink-0 px-4 py-3 md:px-6 border-b border-violet-500/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0d9488,#2563eb)' }}>O</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white leading-tight">GeoEcon Scenario Emulator</h1>
          <p className="text-slate-500 text-xs">15 branching scenarios across historical archetypes, systemic risks, geoeconomic orders, and AI disruption</p>
        </div>
        <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 flex-shrink-0">
          {[['hub', 'Scenarios'], ['history', `Log${totalTerminalsReached > 0 ? ` (${totalTerminalsReached})` : ''}`]].map(([v, l]) => (
            <button key={v} onClick={() => setGseView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${gseView === v ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{l}</button>
          ))}
        </div>
      </div>
      {(gseView === 'sim' || gseView === 'debrief') && activeScenario && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium truncate max-w-[70%]">{activeScenario.title}</div>
          <button onClick={() => setGseView('hub')} className="text-slate-600 hover:text-white text-xs transition-colors flex-shrink-0">Exit</button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {gseView === 'hub' && renderHub()}
        {gseView === 'brief' && renderBrief()}
        {gseView === 'sim' && renderSim()}
        {gseView === 'debrief' && renderDebrief()}
        {gseView === 'history' && renderHistory()}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function BigCycleEngineTool({ preload = null, onPreloadConsumed, onResult }) {
  const [step, setStep] = useState(preload ? 'result' : 'form');
  const [bceSubject, setBceSubject] = useState(preload?.subject ?? '');
  const [bceError, setBceError] = useState('');
  const [bceAgents, setBceAgents] = useState({ agent1: 'pending', agent2: 'pending', agent3: 'pending', agent4: 'pending', supervisor: 'pending' });
  const [bceResult, setBceResult] = useState(preload ?? null);

  useEffect(() => { if (preload) onPreloadConsumed?.(); }, []);

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
            onResult?.(ev.result);
            try { localStorage.setItem('stint-bce-context', JSON.stringify(ev.result)); } catch {}
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
    <div className="px-4 py-6 md:px-8 md:py-10">
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
    <div className="px-4 py-6 md:px-8 md:py-10">
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

        <div className="flex items-center justify-center gap-3 pb-4">
          <button onClick={resetBce} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors">New analysis</button>
          <button onClick={() => generateBcePdfReport(bceResult)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-amber-300 border border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/40 hover:text-amber-200 transition-colors">⬇ Export PDF</button>
        </div>

      </div>
    </div>
  );
}

function PromptEngineeringPackageTool() {
  const [pkgSection, setPkgSection] = useState('rascef');

  // ── Adversarial Buddy state ──
  const [advMode, setAdvMode]       = useState(null);
  const [advInput, setAdvInput]     = useState('');
  const [advStep, setAdvStep]       = useState('form');
  const [advText, setAdvText]       = useState('');
  const [advError, setAdvError]     = useState('');
  const [advCopied, setAdvCopied]   = useState(false);

  // ── Task Brief Builder state ──
  const [tbForm, setTbForm] = useState({ task: '', objective: '', audience: '', constraints: '', outputFormat: '', background: '' });
  const [tbBrief, setTbBrief] = useState(null);
  const [tbPrompt, setTbPrompt] = useState(null);
  const [tbCopied, setTbCopied] = useState('');

  // ── Techniques state ──
  const [techOpen, setTechOpen] = useState({});

  // ── Principles copy state ──
  const [prinCopied, setPrinCopied] = useState('');

  // ── Checkpoints copy state ──
  const [ckCopied, setCkCopied] = useState('');

  const copyText = (text, setter, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setter(key);
    setTimeout(() => setter(''), 1800);
  };

  const runAdversarial = async () => {
    if (!advMode || !advInput.trim()) return;
    setAdvStep('running');
    setAdvText('');
    setAdvError('');
    setAdvCopied(false);
    try {
      const res = await fetch('/api/adversarial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: advMode, userInput: advInput.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.chunk) { accumulated += ev.chunk; setAdvText(accumulated); }
            if (ev.done)  { setAdvStep('result'); }
            if (ev.error) { throw new Error(ev.error); }
          } catch (e) { if (e.message && !e.message.includes('JSON')) throw e; }
        }
      }
      if (accumulated) setAdvStep('result');
    } catch (err) {
      setAdvError(err.message);
      setAdvStep('form');
    }
  };

  const resetAdversarial = () => { setAdvStep('form'); setAdvText(''); setAdvError(''); setAdvCopied(false); };

  const generateTaskBrief = () => {
    const f = tbForm;
    const briefText = [
      'TASK BRIEF',
      '─'.repeat(41),
      `Task:          ${f.task}`,
      `Objective:     ${f.objective}`,
      `Audience:      ${f.audience}`,
      `Constraints:   ${f.constraints}`,
      `Output format: ${f.outputFormat}`,
      f.background ? `Background:    ${f.background}` : null,
    ].filter(l => l !== null).join('\n');
    const promptText = [
      `You are a specialist in [domain].`,
      '',
      `Task: ${f.task}`,
      `Objective: ${f.objective}`,
      `Audience: ${f.audience}`,
      f.background ? `Background: ${f.background}` : null,
      `Constraints: ${f.constraints}`,
      `Output format: ${f.outputFormat}`,
    ].filter(l => l !== null).join('\n');
    setTbBrief(briefText);
    setTbPrompt(promptText);
  };

  const modeObj = ADVERSARIAL_MODES.find(m => m.key === advMode);

  const PKG_TABS = [
    { key: 'rascef',      label: 'RASCEF Generator' },
    { key: 'adversarial', label: 'Adversarial Buddy' },
    { key: 'taskbrief',   label: 'Task Brief Builder' },
    { key: 'techniques',  label: 'Techniques' },
    { key: 'principles',  label: 'Principles' },
    { key: 'checkpoints', label: 'Checkpoints' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-0 md:px-8 md:pt-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>P</div>
          <div>
            <h1 className="text-lg font-black text-white leading-tight">Prompt Engineering Package</h1>
            <p className="text-slate-500 text-xs">Structured techniques, adversarial challenge modes, and planning tools</p>
          </div>
        </div>
        {/* Section tab bar */}
        <div className="relative">
          <div className="flex gap-1 overflow-x-auto pb-px" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {PKG_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setPkgSection(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${pkgSection === t.key ? 'bg-violet-950/70 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-800/60'}`}
              >{t.label}</button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#09090f] to-transparent pointer-events-none md:hidden" />
        </div>
        <div className="mt-3 border-b border-slate-800" />
      </div>

      {/* Section content */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── Adversarial Buddy ── */}
        {pkgSection === 'adversarial' && (
          <div className="px-4 py-5 md:px-8">
            <div className="max-w-3xl mx-auto">
              {advStep === 'result' ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    {modeObj && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: modeObj.bg, color: modeObj.color, border: `1px solid ${modeObj.border}` }}>
                        {modeObj.icon} {modeObj.label}
                      </span>
                    )}
                    <button onClick={resetAdversarial} className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">Run another challenge</button>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-3">
                    <pre className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">{advText}</pre>
                  </div>
                  <button
                    onClick={() => copyText(advText, setAdvCopied, 'result')}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={advCopied ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#94a3b8', borderColor: '#334155' }}
                  >{advCopied ? '✓ Copied' : 'Copy response'}</button>
                </>
              ) : advStep === 'running' ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center text-lg font-black text-white animate-pulse" style={{ background: modeObj ? `linear-gradient(135deg,${modeObj.color}80,${modeObj.color}40)` : 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      {modeObj?.icon ?? '⚙'}
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">Challenging your thinking…</p>
                    <p className="text-slate-500 text-xs">{modeObj?.label}</p>
                    {advText && (
                      <div className="mt-6 max-w-lg text-left bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                        <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">{advText}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 text-xs leading-relaxed mb-5">
                    Select a challenge mode, paste your thinking or plan, and run the adversarial challenge. Each mode uses a structured system prompt designed to stress-test your reasoning.
                  </p>
                  {/* Mode selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
                    {ADVERSARIAL_MODES.map(m => (
                      <button
                        key={m.key}
                        onClick={() => setAdvMode(m.key)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${advMode === m.key ? '' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}
                        style={advMode === m.key ? { background: m.bg, borderColor: m.border } : {}}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base leading-none" style={advMode === m.key ? { color: m.color } : { color: '#64748b' }}>{m.icon}</span>
                          <span className="text-xs font-semibold" style={advMode === m.key ? { color: m.color } : { color: '#e2e8f0' }}>{m.label}</span>
                        </div>
                        <p className="text-slate-500 text-xs leading-snug">{m.description}</p>
                      </button>
                    ))}
                  </div>
                  {advMode && modeObj && (
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-2.5 mb-4 flex items-start gap-2">
                      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: modeObj.color }}>→</span>
                      <p className="text-slate-400 text-xs leading-relaxed"><span className="font-medium text-slate-300">Best for:</span> {modeObj.bestFor}</p>
                    </div>
                  )}
                  {/* Input */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your thinking, plan, or argument</label>
                    <textarea
                      rows={7}
                      value={advInput}
                      onChange={e => setAdvInput(e.target.value)}
                      placeholder="Paste your position, plan, hypothesis, or strategic thinking here. The more specific you are, the sharper the challenge."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>
                  {advError && <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-3"><p className="text-red-300 text-xs">{advError}</p></div>}
                  <button
                    onClick={runAdversarial}
                    disabled={!advMode || !advInput.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: advMode ? `linear-gradient(135deg,${modeObj?.color ?? '#7c3aed'},${modeObj?.color ?? '#4f46e5'}99)` : 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                  >Run Adversarial Challenge</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Task Brief Builder ── */}
        {pkgSection === 'taskbrief' && (
          <div className="px-4 py-5 md:px-8">
            <div className="max-w-2xl mx-auto">
              {tbBrief ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-white font-semibold text-sm">Task Brief</span>
                    <button onClick={() => { setTbBrief(null); setTbPrompt(null); setTbCopied(''); }} className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">Build another</button>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-2 font-mono">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-600 uppercase tracking-wider">Task Brief</p>
                      <button
                        onClick={() => copyText(tbBrief, setTbCopied, 'brief')}
                        className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                        style={tbCopied === 'brief' ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#94a3b8', borderColor: '#334155' }}
                      >{tbCopied === 'brief' ? '✓ Copied' : 'Copy brief'}</button>
                    </div>
                    <pre className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{tbBrief}</pre>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-3 font-mono">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-600 uppercase tracking-wider">AI-Ready Prompt</p>
                      <button
                        onClick={() => copyText(tbPrompt, setTbCopied, 'prompt')}
                        className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                        style={tbCopied === 'prompt' ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#94a3b8', borderColor: '#334155' }}
                      >{tbCopied === 'prompt' ? '✓ Copied' : 'Copy prompt'}</button>
                    </div>
                    <pre className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">{tbPrompt}</pre>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-xs leading-relaxed mb-5">
                    Plan before you prompt. Fill in the five fields below — this is the five-step pre-prompt planning methodology from the Prompting Toolkit. The generator assembles your inputs into a structured task brief and a ready-to-paste AI prompt.
                  </p>
                  <div className="space-y-4 mb-5">
                    {[
                      { key: 'task',         label: 'Task',          placeholder: 'What do you want produced? Be specific — not "write something about X" but the exact deliverable.', required: true },
                      { key: 'objective',    label: 'Objective',     placeholder: 'Why does this matter? What action, decision, or belief should the output enable?', required: true },
                      { key: 'audience',     label: 'Audience',      placeholder: 'Who will read or use this? Their role, technical depth, and expectations shape tone, vocabulary, and length.', required: true },
                      { key: 'constraints',  label: 'Constraints',   placeholder: 'Non-negotiables: word count, format, tone, topics to avoid, brand guidelines.', required: true },
                      { key: 'outputFormat', label: 'Output Format', placeholder: 'Describe exactly what the deliverable looks like: a draft, an analysis, a table, a numbered plan?', required: true },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          {f.label} {f.required && <span className="text-violet-400 normal-case tracking-normal font-normal">required</span>}
                        </label>
                        <input
                          type="text"
                          value={tbForm[f.key]}
                          onChange={e => setTbForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Background <span className="normal-case tracking-normal font-normal text-slate-600">optional</span></label>
                      <textarea
                        rows={3}
                        value={tbForm.background}
                        onChange={e => setTbForm(p => ({ ...p, background: e.target.value }))}
                        placeholder="Relevant context the AI needs to know — situation, constraints, prior decisions, data points."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500/60 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={generateTaskBrief}
                    disabled={!tbForm.task.trim() || !tbForm.objective.trim() || !tbForm.audience.trim() || !tbForm.constraints.trim() || !tbForm.outputFormat.trim()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                  >Generate Task Brief</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Techniques ── */}
        {pkgSection === 'techniques' && (
          <div className="px-4 py-5 md:px-8">
            <div className="max-w-4xl mx-auto">
              <p className="text-slate-400 text-xs leading-relaxed mb-5">Nine research-backed prompting techniques from the DAIR Prompt Engineering Guide. Each includes when to use it, a copy-ready example prompt, and the source paper.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {PROMPTING_TECHNIQUES.map(t => {
                  const isOpen = !!techOpen[t.key];
                  const diffColor = t.difficulty === 'Beginner' ? { c: '#10b981', b: '#10b98115' } : t.difficulty === 'Intermediate' ? { c: '#f59e0b', b: '#f59e0b15' } : { c: '#ef4444', b: '#ef444415' };
                  const typeColor = t.type === 'Foundational' ? { c: '#3b82f6', b: '#3b82f615' } : t.type === 'Reasoning' ? { c: '#8b5cf6', b: '#8b5cf615' } : t.type === 'Workflow' ? { c: '#06b6d4', b: '#06b6d415' } : { c: '#f97316', b: '#f9731615' };
                  return (
                    <div key={t.key} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-white font-bold text-sm leading-snug">{t.label}</h3>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: diffColor.b, color: diffColor.c }}>{t.difficulty}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: typeColor.b, color: typeColor.c }}>{t.type}</span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed mb-3">{t.whatItIs}</p>
                        <div className="space-y-1 mb-3">
                          {t.whenToUse.yes.map((w, i) => <div key={i} className="flex items-start gap-1.5"><span className="text-green-400 text-xs flex-shrink-0 mt-0.5">✓</span><p className="text-slate-500 text-xs leading-snug">{w}</p></div>)}
                          {t.whenToUse.no.map((w, i) => <div key={i} className="flex items-start gap-1.5"><span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✗</span><p className="text-slate-500 text-xs leading-snug">{w}</p></div>)}
                        </div>
                        <button
                          onClick={() => setTechOpen(p => ({ ...p, [t.key]: !isOpen }))}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >{isOpen ? 'Hide example ↑' : 'Show example prompt ↓'}</button>
                      </div>
                      {isOpen && (
                        <div className="border-t border-slate-700 bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-600 uppercase tracking-wider">Example prompt</p>
                            <button
                              onClick={() => copyText(t.examplePrompt, (v) => setTechOpen(p => ({ ...p, [`${t.key}_copied`]: v })), 'yes')}
                              className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                              style={techOpen[`${t.key}_copied`] ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#94a3b8', borderColor: '#334155' }}
                            >{techOpen[`${t.key}_copied`] ? '✓' : 'Copy'}</button>
                          </div>
                          <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono mb-3">{t.examplePrompt}</pre>
                          <div className="border-t border-slate-800 pt-3">
                            <p className="text-xs text-amber-400/80 leading-relaxed mb-1"><span className="font-semibold">Key insight:</span> {t.keyInsight}</p>
                            <p className="text-xs text-slate-600 italic">{t.source}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Principles ── */}
        {pkgSection === 'principles' && (
          <div className="px-4 py-5 md:px-8">
            <div className="max-w-2xl mx-auto">
              <p className="text-slate-400 text-xs leading-relaxed mb-5">Ten research-backed principles that apply across any task, framework, or tool. Copy any principle for use in a system prompt or team documentation.</p>
              <div className="space-y-2">
                {PROMPTING_PRINCIPLES.map(p => (
                  <div key={p.n} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-violet-300 flex-shrink-0 mt-0.5" style={{ background: '#7c3aed20', border: '1px solid #7c3aed30' }}>{p.n}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold mb-0.5">{p.title}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{p.body}</p>
                    </div>
                    <button
                      onClick={() => copyText(`${p.n}. ${p.title} ${p.body}`, setPrinCopied, String(p.n))}
                      className="text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 transition-colors"
                      style={prinCopied === String(p.n) ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#64748b', borderColor: '#334155' }}
                    >{prinCopied === String(p.n) ? '✓' : 'Copy'}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Checkpoints ── */}
        {pkgSection === 'checkpoints' && (
          <div className="px-4 py-5 md:px-8">
            <div className="max-w-2xl mx-auto">
              <p className="text-slate-400 text-xs leading-relaxed mb-5">Deliberate pause-and-verify moments in your prompting workflow. Reduce wasted iterations, catch drift early, and keep outputs anchored to your real objective.</p>
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Four Checkpoint Types</h2>
                <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden mb-4">
                  <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2 border-b border-slate-700 bg-slate-900/40">
                    <span>Checkpoint</span><span>When</span><span>Purpose</span>
                  </div>
                  {CHECKPOINT_TYPES.filter(c => !c.advanced).map((c, i) => (
                    <div key={i} className={`grid grid-cols-3 text-xs px-4 py-2.5 items-start gap-2 ${i < 3 ? 'border-b border-slate-800' : ''}`}>
                      <span className="text-white font-medium">{c.label}</span>
                      <span className="text-slate-400">{c.when}</span>
                      <span className="text-slate-500">{c.purpose}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5">
                  {CHECKPOINT_TYPES.filter(c => !c.advanced).map((c, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white text-xs font-semibold">{c.label}</p>
                        <button
                          onClick={() => copyText(c.prompt, setCkCopied, c.label)}
                          className="text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 transition-colors"
                          style={ckCopied === c.label ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#64748b', borderColor: '#334155' }}
                        >{ckCopied === c.label ? '✓ Copied' : 'Copy prompt'}</button>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed font-mono bg-slate-900/50 rounded-lg px-3 py-2">{c.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Advanced Checkpoint Patterns</h2>
                <div className="space-y-2.5">
                  {CHECKPOINT_TYPES.filter(c => c.advanced).map((c, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-xs font-semibold">{c.label}</p>
                        <button
                          onClick={() => copyText(c.prompt, setCkCopied, c.label)}
                          className="text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 transition-colors"
                          style={ckCopied === c.label ? { background: '#10b98115', color: '#10b981', borderColor: '#10b98130' } : { background: '#1e293b', color: '#64748b', borderColor: '#334155' }}
                        >{ckCopied === c.label ? '✓ Copied' : 'Copy prompt'}</button>
                      </div>
                      <p className="text-slate-500 text-xs mb-2">{c.purpose}</p>
                      <p className="text-slate-400 text-xs leading-relaxed font-mono bg-slate-900/50 rounded-lg px-3 py-2">{c.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RASCEF Generator ── */}
        {pkgSection === 'rascef' && (
          <RASCEFTool />
        )}

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
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-800 bg-violet-950/30">
                <div className="flex-1 min-w-0">
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
    <div className="min-h-full bg-[#07070e] text-white">
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
        <div className="flex flex-col sm:flex-row items-start gap-0 mb-8">
          {[
            { n: '1', label: 'Describe your role and use case', sub: 'Two required fields — everything else sharpens the output' },
            { n: '2', label: 'Choose your output format', sub: 'Full structured breakdown or a single ready-to-paste prompt' },
            { n: '3', label: 'Copy and use immediately', sub: 'Paste into any AI tool — ChatGPT, Claude, Gemini, or your own' },
          ].map((s, i) => (
            <div key={s.n} className="flex gap-2 px-2 sm:flex-1">
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
            <div className="mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                Role or function
                <span className="text-red-500">*</span>
              </label>
              <p className="text-slate-600 text-xs mt-0.5">e.g. Sales Engineer · HR Business Partner · Financial Analyst</p>
            </div>
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
            <div className="mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                Use case
                <span className="text-red-500">*</span>
              </label>
              <p className="text-slate-600 text-xs mt-0.5">The more specific, the better</p>
            </div>
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

  const [bceCache, setBceCache] = useState(null);
  const [giCache, setGiCache] = useState(null);

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
    <div className="relative flex bg-[#07070e] overflow-hidden h-full">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden touch-none" onClick={closeSidebar} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-2.5rem))] bg-[#09090f]/95 backdrop-blur-xl border-r border-violet-500/10 flex flex-col overflow-y-auto overscroll-contain transition-transform duration-300 md:relative md:z-auto md:w-64 md:flex-shrink-0 md:translate-x-0 sidebar-glow ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 sidebar-glow-mobile-off'}`}>
        {/* Branding */}
        <div className="px-5 pb-4 border-b border-violet-500/10 md:pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
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

        {/* Toolkit */}
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
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geopolicylab' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'geopolicylab' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">◈</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">GeoPolicy Lab</span>
              <span className="block text-slate-600 text-xs">Policy simulation environment</span>
            </span>
            {activeTab === 'geopolicylab' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoeconscenarioemulator' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'geoeconscenarioemulator' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">⬡</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">GeoEcon Scenario Emulator</span>
              <span className="block text-slate-600 text-xs">15 branching scenarios</span>
            </span>
            {activeTab === 'geoeconscenarioemulator' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'SET_ACTIVE_TAB', payload: 'promptpkg' }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${activeTab === 'promptpkg' ? 'bg-violet-950/60 text-white font-medium border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-violet-950/30 border border-transparent'}`}
          >
            <span className="text-base leading-none">◧</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">Prompt Engineering Package</span>
              <span className="block text-slate-600 text-xs">Techniques & adversarial modes</span>
            </span>
            {activeTab === 'promptpkg' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
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
          <p className="text-xs text-slate-700 px-2 mb-1 uppercase tracking-widest font-semibold">STEEP Analysis</p>
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
          <p className="text-xs text-slate-700 px-2 mt-3 mb-1 uppercase tracking-widest font-semibold">Instruments</p>
          <button
            onClick={() => { dispatch({ type: 'LOAD_BCE_EXAMPLE', payload: BCE_EXAMPLE }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'bigcycleengine' ? 'bg-amber-950/40 text-white font-medium border border-amber-700/30' : 'text-slate-400 hover:text-white hover:bg-amber-950/20 border border-transparent'}`}
          >
            <span className="text-base leading-none">⊕</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">United States</span>
              <span className="block text-slate-600 text-xs">Big Cycle Engine example</span>
            </span>
            {activeTab === 'bigcycleengine' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
          </button>
          <button
            onClick={() => { dispatch({ type: 'LOAD_GI_EXAMPLE', payload: GI_EXAMPLE }); closeSidebar(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'geoinstrument' ? 'bg-teal-950/40 text-white font-medium border border-teal-700/30' : 'text-slate-400 hover:text-white hover:bg-teal-950/20 border border-transparent'}`}
          >
            <span className="text-base leading-none">◈</span>
            <span className="text-left leading-tight flex-1 min-w-0">
              <span className="block text-xs font-medium">US Semis → China</span>
              <span className="block text-slate-600 text-xs">GeoEcon Instrument example</span>
            </span>
            {activeTab === 'geoinstrument' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
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

        <div className="px-5 pt-3 border-t border-violet-500/10 mt-auto" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <p className="text-slate-700 text-xs">Groq · {selectedModel}</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="max-md:absolute max-md:inset-0 max-md:z-10 flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Mobile header bar — flex-shrink-0 so it always sits at top of the flex column */}
        <div className="flex-shrink-0 z-30 flex items-center gap-3 px-4 pb-3 bg-[#09090f]/95 backdrop-blur-xl border-b border-violet-500/10 md:hidden" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
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

        {/* Content area — takes all remaining height; panels use h-full overflow-y-auto to scroll within this correctly-sized box */}
        <div className="flex-1 min-h-0 overflow-hidden">

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

        {/* About — Studio, Taylor bio, Studio Updates */}
        {activeTab === 'about' && (
          <div className="h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6">
            <AboutPanel />
          </div>
        )}

        {/* Big Cycle Engine — standalone Dalio pipeline tool */}
        {activeTab === 'bigcycleengine' && (
          <div className="h-full overflow-y-auto">
            <BigCycleEngineTool
              preload={state.bcePreload}
              onPreloadConsumed={() => dispatch({ type: 'CLEAR_PRELOAD', key: 'bce' })}
              onResult={r => setBceCache(r)}
            />
          </div>
        )}

        {/* GeoEconomic Instrument Assessment — Farrell & Newman framework */}
        {activeTab === 'geoinstrument' && (
          <div className="h-full overflow-y-auto">
            <GeoInstrumentTool
              preload={state.giPreload}
              onPreloadConsumed={() => dispatch({ type: 'CLEAR_PRELOAD', key: 'gi' })}
              onResult={r => setGiCache(r)}
            />
          </div>
        )}

        {/* Prompt Engineering Package — techniques, adversarial modes, task brief builder */}
        {activeTab === 'promptpkg' && (
          <div className="h-full overflow-y-auto">
            <PromptEngineeringPackageTool />
          </div>
        )}

        {/* GeoEcon Scenario Emulator — 15 branching geopolitical scenarios */}
        {activeTab === 'geoeconscenarioemulator' && (
          <div className="h-full overflow-y-auto">
            <GeoEconScenarioEmulatorTool />
          </div>
        )}

        {/* GeoPolicy Lab — integrated policy simulation environment */}
        {activeTab === 'geopolicylab' && (
          <div className="h-full overflow-hidden">
            <GeoPolicyLabTool />
          </div>
        )}

        {/* Home — portfolio landing */}
        {activeTab === 'home' && (
          <div className="h-full overflow-y-auto px-4 py-6 md:px-8 md:py-10">
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
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#d9770618', color: '#f59e0b', border: '1.5px solid #d9770625' }}>◈</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">GeoPolicy Lab</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Strategic policy simulation environment</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Fuses the Big Cycle Engine, Farrell & Newman Triangular Framework, and a game theory decision engine into a unified five-panel simulation workflow. Configure macro environments, deploy instruments, play adversarial decision scenarios, and receive a full STEEP lens debrief across 8 historical cases.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Empire Stage', 'Instrument Scoring', 'Decision Theater', 'STEEP Synthesis', 'Historical Scenarios'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geopolicylab' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/30 hover:text-amber-200 transition-colors"
                    >
                      Open GeoPolicy Lab →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#0d948818', color: '#2dd4bf', border: '1.5px solid #0d948825' }}>⬡</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">GeoEcon Scenario Emulator</h3>
                        <p className="text-slate-500 text-xs mt-0.5">15 branching scenarios</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Fifteen branching geopolitical and economic scenarios across four clusters: supply chain, monetary, energy, and trade. Navigate decision trees, surface second-order effects, and track outcomes across a strategic lens framework.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Supply Chain', 'Monetary Policy', 'Energy Transition', 'Trade Blocs', 'Scenario Planning'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'geoeconscenarioemulator' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-teal-300 border border-teal-900/60 bg-teal-950/30 hover:bg-teal-900/30 hover:text-teal-200 transition-colors"
                    >
                      Open GeoEcon Scenario Emulator →
                    </button>
                  </div>
                  <div className="bg-[#0f0f1b]/80 border border-violet-500/10 hover:border-violet-500/20 transition-colors rounded-2xl p-5 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base flex-shrink-0" style={{ background: '#7c3aed18', color: '#a78bfa', border: '1.5px solid #7c3aed25' }}>P</div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight">Prompt Engineering Package</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Techniques, adversarial modes, and planning tools</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                      Nine research-backed prompting techniques, six adversarial challenge modes powered by Groq, a structured task brief builder, ten core principles, and copy-ready checkpoint prompts — assembled from the AI Prompting Toolkit.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {['Adversarial Buddy', 'Task Brief Builder', 'Techniques', 'Principles', 'Checkpoints'].map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-400">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'promptpkg' })}
                      className="w-full py-2 rounded-xl text-xs font-semibold text-violet-300 border border-violet-900/60 bg-violet-950/30 hover:bg-violet-900/30 hover:text-violet-200 transition-colors"
                    >
                      Open Prompt Engineering Package →
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
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && activeTab !== 'promptpkg' && activeTab !== 'geoeconscenarioemulator' && status === 'idle' && (
          <div className="h-full overflow-y-auto px-4 py-6 md:px-8 md:py-10">
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
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && activeTab !== 'geoeconscenarioemulator' && isRunning && (
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
        {activeTab !== 'thoughtleadership' && activeTab !== 'innovatorillumination' && activeTab !== 'about' && activeTab !== 'home' && activeTab !== 'bigcycleengine' && activeTab !== 'geoinstrument' && activeTab !== 'geoeconscenarioemulator' && isComplete && (
          <div className="h-full flex flex-col">
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

        </div>{/* end content area */}
      </main>
    </div>
  );
}

export default function Page() {
  return <App />;
}
