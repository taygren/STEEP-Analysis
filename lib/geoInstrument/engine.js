/**
 * lib/geoInstrument/engine.js
 *
 * Farrell & Newman Triangular Framework — prompt builders for the five-agent
 * GeoEconomic Instrument Assessment pipeline.
 * Used by /api/geoinstrument.
 */

export const GEO_ATTRIBUTE_WEIGHTS = {
  precision:     0.20,
  impact:        0.30,
  circumvention: 0.20,
  visibility:    0.15,
  speed:         0.15,
};

/**
 * Compute weighted severity score from attribute scores (0–10 each).
 */
export function computeGeoSeverity(attributeScores) {
  if (!attributeScores || typeof attributeScores !== 'object') return null;
  let weighted = 0, totalWeight = 0;
  for (const [key, weight] of Object.entries(GEO_ATTRIBUTE_WEIGHTS)) {
    const raw = attributeScores[key];
    if (raw == null) continue;
    const score = Math.max(0, Math.min(10, Number(raw)));
    if (!isFinite(score)) continue;
    weighted += score * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 10) / 10;
}

/**
 * Classify a severity score into tier + color.
 */
export function classifyGeoSeverity(score) {
  if (score == null) return { tier: 'UNKNOWN', label: 'Unknown', color: '#64748b' };
  if (score >= 8)   return { tier: 'CRITICAL', label: 'Critical', color: '#ef4444' };
  if (score >= 6)   return { tier: 'HIGH',     label: 'High',     color: '#f97316' };
  if (score >= 4)   return { tier: 'MODERATE', label: 'Moderate', color: '#f59e0b' };
  if (score >= 2)   return { tier: 'LOW',      label: 'Low',      color: '#10b981' };
  return                    { tier: 'MINIMAL', label: 'Minimal',  color: '#64748b' };
}

export const GEO_STRATEGIC_UTILITY_CLASSES = [
  { key: 'coercive_leverage',      label: 'Coercive Leverage',        color: '#ef4444' },
  { key: 'structural_dependency',  label: 'Structural Dependency',    color: '#f97316' },
  { key: 'alliance_management',    label: 'Alliance Management',      color: '#3b82f6' },
  { key: 'strategic_deterrence',   label: 'Strategic Deterrence',     color: '#8b5cf6' },
  { key: 'domestic_protection',    label: 'Domestic Protection',      color: '#10b981' },
  { key: 'retaliation_escalation', label: 'Retaliation / Escalation', color: '#f59e0b' },
];

// ── Prompt builders ───────────────────────────────────────────────────────────

export function buildAgent5APrompt(instrument, sender, target, context) {
  const ctx = context?.trim() ? `\nContext: ${context}` : '';
  return `You are Agent 5A — Attribute Scorer in the Farrell & Newman Triangular Framework Instrument Assessment.

Instrument: "${instrument}"
Sender: ${sender} | Target: ${target}${ctx}

Score this geoeconomic instrument on 5 attributes (0–10 each):

PRECISION (weight 20%): How targeted — isolates specific actors/sectors without broad collateral damage. 10=surgical, 0=indiscriminate.
IMPACT (weight 30%): Magnitude of economic disruption to capital flows, trade volumes, cost structures. 10=systemic, 0=negligible.
CIRCUMVENTION RESISTANCE (weight 20%): Difficulty for target to route around or substitute. 10=nearly impossible, 0=trivially bypassed.
VISIBILITY (weight 15%): Observable and attributable, creating deterrence/reputational consequences. 10=highly visible, 0=covert.
SPEED OF EFFECT (weight 15%): How quickly measurable outcomes appear. 10=days/weeks, 0=decade-plus.

Severity: 0.30×impact + 0.20×precision + 0.20×circumvention + 0.15×visibility + 0.15×speed
Tiers: ≥8 CRITICAL | 6–8 HIGH | 4–6 MODERATE | 2–4 LOW | <2 MINIMAL

Be specific: cite actual dependencies, market shares, regulations, or supply chain positions.

Return ONLY valid JSON:
{"attribute_scores":{"precision":0,"impact":0,"circumvention":0,"visibility":0,"speed":0},"dominant_attribute":"impact","lowest_attribute":"visibility","severity_score":0.0,"severity_tier":"MODERATE","score_rationale":""}`;
}

export function buildAgent5BPrompt(instrument, sender, target, context, agent5a) {
  const ctx = context?.trim() ? `\nContext: ${context}` : '';
  const sev = agent5a?.severity_tier ?? '?';
  const sevScore = agent5a?.severity_score != null ? Number(agent5a.severity_score).toFixed(1) : '?';
  const dom = agent5a?.dominant_attribute ?? '?';
  return `You are Agent 5B — Capacity Assessor in the Farrell & Newman Triangular Framework Instrument Assessment.

Instrument: "${instrument}"
Sender: ${sender} | Target: ${target}${ctx}
Agent 5A context: Severity ${sev} (${sevScore}/10) | Dominant attribute: ${dom}

Assess bilateral economic leverage using Farrell & Newman's three network power dimensions:

1. SIZE ASYMMETRIES: GDP ratios, market size, reserve currency leverage — does the sender have scale advantages?
2. STRATEGIC DEPENDENCIES: Supply chain chokepoints, critical inputs (chips, energy, rare earths, finance), technology access
3. MARKET GRAVITY: Export/import dependence, capital market access, financial system connectivity

Sender capacity score 0–10 (10 = overwhelming leverage advantage over target).
Target capacity score 0–10 (10 = highly vulnerable / minimal ability to resist or retaliate).
leverage_holder: "sender" if sender_capacity > target_capacity + 2, "target" if reversed, else "balanced".
leverage_ratio: (sender_capacity - target_capacity + 10) / 2 → gives 0–10 scale (5 = balanced, >5 = sender advantage).
retaliation_capacity: can target credibly threaten proportionate countermeasures? HIGH|MODERATE|LOW
chokepoints_identified: specific critical dependencies or supply chain nodes the sender controls (3-5 concrete examples).
retaliation_vectors: specific mechanisms by which target could retaliate (2-3 concrete examples).

Return ONLY valid JSON:
{"sender_capacity":{"score":0,"dominant_advantage":"","rationale":""},"target_capacity":{"score":0,"vulnerability_level":"HIGH","rationale":""},"leverage_holder":"sender","leverage_ratio":0.0,"chokepoints_identified":[],"retaliation_capacity":"MODERATE","retaliation_vectors":[],"bilateral_rationale":""}`;
}

export function buildAgent5CPrompt(instrument, sender, target, context, agent5a, agent5b) {
  const ctx = context?.trim() ? `\nContext: ${context}` : '';
  const sev = agent5a?.severity_tier ?? '?';
  const lev = agent5b?.leverage_holder ?? '?';
  const ret = agent5b?.retaliation_capacity ?? '?';
  const ratio = agent5b?.leverage_ratio != null ? Number(agent5b.leverage_ratio).toFixed(1) : '?';
  return `You are Agent 5C — Strategic Utility Classifier in the Farrell & Newman Triangular Framework Instrument Assessment.

Instrument: "${instrument}"
Sender: ${sender} | Target: ${target}${ctx}
Agent 5A: Severity ${sev} | Agent 5B: Leverage holder ${lev} (ratio ${ratio}/10) | Retaliation capacity ${ret}

Classify the instrument into exactly ONE strategic utility category:
coercive_leverage: Deployed to extract policy concessions through economic pain
structural_dependency: Exploits/creates asymmetric supply-chain or financial dependence
alliance_management: Coordinates aligned partner behavior or deters defection from a coalition
strategic_deterrence: Signals capability to deter future actions without requiring deployment
domestic_protection: Shields domestic industries from foreign competition, technology transfer, or influence
retaliation_escalation: Countermeasure that escalates an existing economic conflict

Time horizon: immediate (weeks) | short_term (months) | medium_term (1–3 years) | long_term (3+ years)
structural: creates lasting dependency change that persists >2 years | transient: reversible within 2 years

escalation_probability: 0–100, probability the instrument triggers escalatory countermeasures within the time horizon.
escalation_pathways: specific mechanisms by which escalation would occur (2-3 concrete scenarios).
secondary_effects: second-order geopolitical or economic effects beyond the direct sender–target relationship (2-3 examples).

Return ONLY valid JSON:
{"strategic_utility_class":"coercive_leverage","class_rationale":"","time_horizon":"medium_term","escalation_probability":0,"escalation_pathways":[],"structural_vs_transient":"structural","structural_rationale":"","secondary_effects":[]}`;
}

export function buildConvergencePrompt(instrument, sender, target, context, agent5a, agent5b, agent5c) {
  const ctx = context?.trim() ? `\nContext: ${context}` : '';
  const cs = agent5a?.attribute_scores?.circumvention != null ? Number(agent5a.attribute_scores.circumvention).toFixed(1) : 'unknown';
  const s5a = `Severity ${agent5a?.severity_tier} (${Number(agent5a?.severity_score ?? 0).toFixed(1)}/10), dominant: ${agent5a?.dominant_attribute}, lowest: ${agent5a?.lowest_attribute}, circumvention_score: ${cs}/10`;
  const s5b = `Leverage ${agent5b?.leverage_holder} (${Number(agent5b?.leverage_ratio ?? 5).toFixed(1)}/10), retaliation: ${agent5b?.retaliation_capacity}, chokepoints: ${(agent5b?.chokepoints_identified || []).slice(0, 3).join('; ')}`;
  const s5c = `${agent5c?.strategic_utility_class}, horizon: ${agent5c?.time_horizon}, escalation: ${agent5c?.escalation_probability}%, ${agent5c?.structural_vs_transient}`;
  return `You are the Convergence Supervisor in the Farrell & Newman Triangular Framework Instrument Assessment. Synthesize Agents 5A, 5B, 5C into a unified risk profile.

Instrument: "${instrument}" | ${sender} → ${target}${ctx}
Agent 5A (Attribute Scorer): ${s5a}
Agent 5B (Capacity Assessor): ${s5b}
Agent 5C (Strategic Utility): ${s5c}

Active flag rules — apply ALL that are true based on the data above:
HIGH_SEVERITY: Agent 5A severity_score ≥ 7
RETALIATION_RISK: Agent 5B retaliation_capacity = "HIGH" OR Agent 5C escalation_probability ≥ 50
CIRCUMVENTION_LIKELY: Agent 5A circumvention_score ≤ 4 (current value: ${cs})
WAR_ECONOMY_TRIGGER: Agent 5C escalation_probability ≥ 70 AND Agent 5B leverage_holder = "sender" AND Agent 5B retaliation_capacity = "HIGH"

convergence_confidence: HIGH if all 3 agents point same direction; MODERATE if 2/3 agree; LOW if signals conflict.
unified_severity: weighted re-assessment incorporating capacity and utility context (may differ from Agent 5A score).
key_risks: top 3-4 specific, actionable risk statements.

Return ONLY valid JSON:
{"convergence_confidence":"HIGH","active_flags":[],"unified_severity":0.0,"unified_severity_tier":"MODERATE","key_risks":[],"strategic_summary":""}`;
}

export function buildAgent5DPrompt(instrument, sender, target, context, agent5a, agent5b, agent5c, convergence) {
  const ctx = context?.trim() ? `\nContext: ${context}` : '';
  const flags = (convergence?.active_flags || []).join(', ') || 'none';
  const sev = convergence?.unified_severity_tier ?? agent5a?.severity_tier ?? '?';
  const horizon = agent5c?.time_horizon ?? '?';
  const utilClass = agent5c?.strategic_utility_class ?? '?';
  const levHolder = agent5b?.leverage_holder ?? '?';
  const retCap = agent5b?.retaliation_capacity ?? '?';
  return `You are Agent 5D — Investment Translation Agent in the Farrell & Newman Triangular Framework Instrument Assessment.

Instrument: "${instrument}" | ${sender} → ${target}${ctx}
Severity: ${sev} | Utility: ${utilClass} | Horizon: ${horizon}
Leverage holder: ${levHolder} | Retaliation capacity: ${retCap}
Active flags: ${flags}
Convergence summary: ${convergence?.strategic_summary || 'N/A'}

Translate the geoeconomic risk profile into investment-grade signals. Be specific: name actual sectors, ETFs, commodities, currencies, or company types.

FIRST_ORDER_SHOCKS (3-4): Direct, immediate market impacts — supply chain costs, revenue exposures, access restrictions.
SECOND_ORDER_SHOCKS (3-4): Indirect effects — demand shifts, substitution patterns, capital reallocation, investor sentiment.
BENEFICIARIES (3-4): Sectors, geographies, or company types likely to gain from this instrument's deployment.
PORTFOLIO_SIGNALS (4-5): Concrete positioning recommendations (BUY/SELL/HEDGE/MONITOR) with conviction levels.
HEDGING_RECOMMENDATIONS (2-3): Specific instruments or approaches to hedge the primary risk exposure.

direction values: POSITIVE | NEGATIVE | NEUTRAL
magnitude values: HIGH | MODERATE | LOW
signal types: BUY | SELL | HEDGE | MONITOR
conviction values: HIGH | MODERATE | LOW

Return ONLY valid JSON:
{"first_order_shocks":[{"sector":"","direction":"NEGATIVE","magnitude":"HIGH","rationale":""}],"second_order_shocks":[{"sector":"","direction":"POSITIVE","magnitude":"MODERATE","rationale":""}],"beneficiaries":[{"name":"","category":"sector","thesis":""}],"portfolio_signals":[{"signal":"","type":"BUY","conviction":"HIGH","rationale":""}],"hedging_recommendations":[]}`;
}

export const GEO_AGENT_TOKENS       = 500;
export const GEO_CONVERGENCE_TOKENS = 500;
export const GEO_5D_TOKENS          = 500;
