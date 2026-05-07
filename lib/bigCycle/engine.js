/**
 * lib/bigCycle/engine.js
 *
 * Geoeconomic instrument scoring logic inspired by the GeoEcon-Engine.
 * Used by /api/big-cycle to post-process LLM outputs into standardised scores.
 */

// ── Attribute definitions ──────────────────────────────────────────────────
export const INSTRUMENT_ATTRIBUTES = [
  {
    key: 'precision',
    label: 'Precision',
    description: 'How targeted can the instrument be applied — can it isolate a specific actor, sector, or behaviour without broad collateral damage?',
    icon: '🎯',
  },
  {
    key: 'impact',
    label: 'Impact',
    description: 'Magnitude of economic effect — does it materially alter capital flows, trade volumes, cost structures, or growth trajectories?',
    icon: '💥',
  },
  {
    key: 'circumvention',
    label: 'Circumvention Resistance',
    description: 'How easily can the target route around, substitute, or neutralise the instrument? (higher = harder to circumvent)',
    icon: '🔒',
  },
  {
    key: 'visibility',
    label: 'Visibility',
    description: 'Is the instrument\'s use observable and attributable? High visibility creates deterrence and reputational consequences.',
    icon: '👁',
  },
  {
    key: 'speed',
    label: 'Speed of Effect',
    description: 'How quickly does the instrument produce measurable outcomes — days (sanctions), months (tariffs), years (industrial policy)?',
    icon: '⚡',
  },
];

// ── Strategic utility classes ──────────────────────────────────────────────
export const STRATEGIC_UTILITY_CLASSES = [
  { key: 'coercive_leverage',       label: 'Coercive Leverage',        color: '#ef4444' },
  { key: 'structural_dependency',   label: 'Structural Dependency',    color: '#f97316' },
  { key: 'alliance_management',     label: 'Alliance Management',      color: '#3b82f6' },
  { key: 'strategic_deterrence',    label: 'Strategic Deterrence',     color: '#8b5cf6' },
  { key: 'domestic_protection',     label: 'Domestic Protection',      color: '#10b981' },
  { key: 'retaliation_escalation',  label: 'Retaliation / Escalation', color: '#f59e0b' },
];

// ── Geoeconomic capacities ─────────────────────────────────────────────────
export const GEOECONOMIC_CAPACITIES = [
  { key: 'size_asymmetries',          label: 'Size Asymmetries',            description: 'Does the US have significant scale advantages (GDP, market access, reserve currency) that amplify instrument leverage?' },
  { key: 'strategic_dependencies',    label: 'Strategic Dependencies',      description: 'Are critical inputs (chips, rare earths, APIs, standards) concentrated in ways that create chokepoints the US controls or can exploit?' },
  { key: 'market_gravity',            label: 'Market Gravity',              description: 'Does US consumer/investor demand or capital access create gravitational pull that makes exclusion from US markets genuinely costly?' },
  { key: 'institutional_effectiveness', label: 'Institutional Effectiveness', description: 'Can US institutions (Treasury, Commerce, USTR, Fed, allies) effectively coordinate and enforce this instrument at scale?' },
];

// ── Severity scoring ───────────────────────────────────────────────────────
/**
 * Compute a composite severity score from LLM-returned attribute scores (0–10 each).
 * Weights reflect strategic doctrine: impact and precision matter most.
 */
const ATTRIBUTE_WEIGHTS = {
  precision:      0.20,
  impact:         0.30,
  circumvention:  0.20,
  visibility:     0.15,
  speed:          0.15,
};

export function computeSeverityScore(attributeScores) {
  if (!attributeScores || typeof attributeScores !== 'object') return null;
  let weighted = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(ATTRIBUTE_WEIGHTS)) {
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
 * Classify severity tier from 0–10 score.
 */
export function classifySeverity(score) {
  if (score == null) return { tier: 'unknown', label: 'Unknown', color: '#64748b' };
  if (score >= 8)   return { tier: 'critical', label: 'Critical', color: '#ef4444' };
  if (score >= 6)   return { tier: 'high',     label: 'High',     color: '#f97316' };
  if (score >= 4)   return { tier: 'moderate', label: 'Moderate', color: '#f59e0b' };
  if (score >= 2)   return { tier: 'low',      label: 'Low',      color: '#10b981' };
  return                    { tier: 'minimal', label: 'Minimal',  color: '#64748b' };
}

/**
 * Build the Big Cycle LLM system prompt.
 */
export function buildBigCycleSystemPrompt(subject, subjectType) {
  const perspective = subjectType === 'trend'
    ? 'Assess all findings from the United States perspective — how does the US geoeconomic position interact with this trend?'
    : 'Assess from the perspective of an investor, strategist, or executive with exposure to this company in the current geoeconomic cycle.';

  return `You are a senior geoeconomic strategist specialising in the intersection of statecraft, capital markets, and corporate strategy. ${perspective}

Your task: produce a Big Cycle Decision Engine assessment for "${subject}" (${subjectType}).

The "Big Cycle" framework — inspired by Ray Dalio's work on long-cycle debt/power transitions and geoeconomic statecraft theory — identifies:
1. Which geoeconomic instruments are most relevant to this subject
2. How those instruments score on 5 attributes (Precision, Impact, Circumvention Resistance, Visibility, Speed of Effect)
3. The subject's strategic utility classification (one of 6 classes)
4. US geoeconomic capacity assessments (4 dimensions)
5. Company or trend positioning relative to the current power cycle

WRITING STANDARD:
- Be specific: name countries, companies, regulations, choke points, dates
- Quantify where defensible (% of supply chain, $ at risk, policy timeline)
- Every rationale must be 2–3 sentences: mechanism → consequence → strategic implication
- Do NOT pad with generic observations

Return ONLY valid JSON matching this schema exactly:

{
  "subject": "${subject}",
  "subjectType": "${subjectType}",
  "cyclePhase": "one of: expansion | late_cycle | peak | contraction | transition | uncertain",
  "cyclePhaseRationale": "2-3 sentence explanation of why this phase applies now",
  "primaryInstruments": [
    {
      "name": "name of the geoeconomic instrument (e.g. Export Controls, Tariffs, Reserve Currency Leverage)",
      "relevance": "why this instrument is most relevant to ${subject} right now",
      "attributeScores": {
        "precision": 0,
        "impact": 0,
        "circumvention": 0,
        "visibility": 0,
        "speed": 0
      },
      "scoreRationale": "2 sentences explaining the highest and lowest attribute scores"
    }
  ],
  "strategicUtility": {
    "class": "one of: coercive_leverage | structural_dependency | alliance_management | strategic_deterrence | domestic_protection | retaliation_escalation",
    "rationale": "2-3 sentences explaining why this class applies and what it means for ${subject}"
  },
  "capacities": {
    "size_asymmetries":          { "score": 0, "rationale": "2 sentences" },
    "strategic_dependencies":    { "score": 0, "rationale": "2 sentences" },
    "market_gravity":            { "score": 0, "rationale": "2 sentences" },
    "institutional_effectiveness":{ "score": 0, "rationale": "2 sentences" }
  },
  "companyPositioning": {
    "exposureChannels": ["specific channel 1", "specific channel 2", "specific channel 3"],
    "primaryRisk":     "most acute geoeconomic risk for ${subject} with mechanism",
    "primaryOpportunity": "most actionable geoeconomic opportunity for ${subject}",
    "cycleAdaptation": "2-3 sentence strategic adaptation recommendation"
  },
  "overallSeverityScore": 0,
  "keyWatchItems": ["specific event or threshold to monitor"]
}

Include exactly 2–3 primaryInstruments. All scores are 0–10 integers.`;
}

export const BIG_CYCLE_OUTPUT_TOKENS = 1800;

// ── Dalio Big Cycle Engine — standalone pipeline prompt builders ────────────

export const EMPIRE_STAGES = [
  { n: 1, label: 'New Order / Rising',  color: '#10b981', bg: '#10b98112', range: '0.0–2.5',  posture: 'Aggressive long' },
  { n: 2, label: 'Building Power',      color: '#3b82f6', bg: '#3b82f612', range: '2.5–4.0',  posture: 'Growth' },
  { n: 3, label: 'Peak Power',          color: '#06b6d4', bg: '#06b6d412', range: '4.0–5.5',  posture: 'Balanced / selective' },
  { n: 4, label: 'Overextension',       color: '#eab308', bg: '#eab30812', range: '5.5–7.0',  posture: 'Defensive rotation begins' },
  { n: 5, label: 'Decline',            color: '#f97316', bg: '#f9731612', range: '7.0–9.0',  posture: 'Wealth preservation priority' },
  { n: 6, label: 'Crisis / Reset',     color: '#ef4444', bg: '#ef444412', range: '9.0–10.0', posture: 'Maximum defensive posture' },
];

export function buildFiveForcesPrompt(subject) {
  return `You are Agent 1 — Five Forces Diagnostician in the Dalio Big Cycle Engine. Score the macro-political state of "${subject}" across five force dimensions.

Score each force 0–10 (10 = maximum stress/decline). Weighted composite determines Empire Stage.
Weights: Debt/Money 30% · Internal Order 25% · External Order 20% · Technology 15% · Nature/Climate 10%

Stage thresholds (composite score):
0.0–2.5 → Stage 1 (New Order / Rising)
2.5–4.0 → Stage 2 (Building Power)
4.0–5.5 → Stage 3 (Peak Power)
5.5–7.0 → Stage 4 (Overextension)
7.0–9.0 → Stage 5 (Decline)
9.0–10.0 → Stage 6 (Crisis / Reset)

Return ONLY valid JSON — no prose before or after:
{"empire_stage":1,"composite_score":0.0,"dominant_force":"debt","power_posture":"rising","power_trajectory":"improving","force_scores":{"debt":0.0,"internal_order":0.0,"external_order":0.0,"nature":0.0,"technology":0.0},"force_rationales":{"debt":"","internal_order":"","external_order":"","nature":"","technology":""},"stage_label":"","stage_rationale":""}`;
}

export function buildDebtBubblePrompt(subject, layer1) {
  const stage = layer1?.empire_stage ?? '?';
  const stageLabel = layer1?.stage_label ?? '';
  const debtScore = layer1?.force_scores?.debt != null ? Number(layer1.force_scores.debt).toFixed(1) : '?';
  return `You are Agent 2 — Debt Sustainability Analyst and Bubble Detector in the Dalio Big Cycle Engine.

Subject: "${subject}" | Empire Stage ${stage} (${stageLabel}) | Debt force: ${debtScore}/10

Debt classification (i−g = nominal interest rate minus nominal GDP growth):
PONZI_FINANCE: i−g > 2 AND debt/income > 1.5 → printing_probability ≈ 90%
UNSUSTAINABLE: i−g > 0 AND debt/income > 1.0 → ≈ 70%
BORDERLINE: i−g ≈ 0, debt/income 0.8–1.0 → ≈ 35%
BEAUTIFUL_DELEVERAGING: i−g < 0 → ≈ 10%

MP Stage: MP1 rates > 2.5% | MP2 QE territory 0.25–2.5% | MP3 fiscal monetisation ≤ 0.25%

Bubble detection (score 0–7, alert if ≥ 5 conditions confirmed):
1. Prices high vs. traditional measures (CAPE > 30, P/B > 3.5)
2. Prices discount unsustainable future appreciation
3. Broad bullish sentiment (AAII bulls > 55%, put/call < 0.7)
4. Purchases financed by high leverage
5. Extended forward purchases / inventory building
6. New inexperienced buyers entering
7. Stimulative monetary policy inflating bubble

critical_debt_flag = true when PONZI_FINANCE AND bubble_score ≥ 5.

Return ONLY valid JSON:
{"i_minus_g":0.0,"debt_status":"UNSUSTAINABLE","mp_stage":"MP2","printing_probability":70,"bubble_score":0,"bubble_alert":false,"bubble_severity":"NONE","bubble_conditions_met":[],"critical_debt_flag":false,"debt_rationale":"","bubble_rationale":""}`;
}

export function buildScenarioPrompt(subject, layer1, layer2) {
  const stage = layer1?.empire_stage ?? '?';
  const stageLabel = layer1?.stage_label ?? '';
  const traj = layer1?.power_trajectory ?? '?';
  const debt = layer2?.debt_status ?? '?';
  const mp = layer2?.mp_stage ?? '?';
  const pp = layer2?.printing_probability ?? '?';
  const bubble = layer2?.bubble_alert ? 'ALERT' : 'clear';
  return `You are Agent 3 — Scenario Architect in the Dalio Big Cycle Engine.

Subject: "${subject}" | Stage ${stage} (${stageLabel}) | Trajectory: ${traj}
Agent 2 context: Debt=${debt} · MP=${mp} · Printing=${pp}% · Bubble=${bubble}

Currency regime fork determines path:
Own-currency debt + capital flight < 6/10 → DEFLATIONARY_DEPRESSION
  Mechanism: asset prices fall → debtors sell → wealth effect collapses → spending falls
  Pre-print: Long Gov Bonds + Gold. Post-print: Long Gold + Equities + Real Assets.

Own-currency debt + capital flight ≥ 6/10 → INFLATIONARY_DEPRESSION
  Mechanism: currency weakens → import inflation → capital flight loop
  Long: Gold + hard FX. Short: Local bonds.

Foreign currency debt → HYPERINFLATIONARY
  Mechanism: capital outflows → currency plummets → import prices spike
  Long: Gold + USD + Commodities. Short: Local FX + Local Bonds.

Historical analogies: US 1933–1945 (def, Stage 5, MP3, HIGH) · US 2008–2020 (def, Stage 4, MP2, HIGH) · Japan 1990–present (def, MODERATE) · Weimar 1919–1923 (inf, HIGH) · UK 1945–1976 (declining hegemon, MODERATE) · Argentina/Turkey (EM inflationary, MODERATE)

WAR_ECONOMY flag: true if external_order_score > 6 AND external conflict risk is elevated.

Return ONLY valid JSON:
{"scenario_type":"DEFLATIONARY_DEPRESSION","scenario_label":"","mechanism":"","phase":"early","capital_flight_risk":0.0,"own_currency_debt":true,"analogy_id":"US_2008","analogy_label":"","analogy_confidence":"HIGH","warning_signals":[],"arb_signals":{"pre_print":{"long":[],"short":[]},"post_print":{"long":[],"short":[]}},"war_economy_flag":false}`;
}

export function buildDecisionMatrixPrompt(subject, layer1, layer2, layer3) {
  const stage = layer1?.empire_stage ?? '?';
  const stageLabel = layer1?.stage_label ?? '';
  const mp = layer2?.mp_stage ?? '?';
  const debt = layer2?.debt_status ?? '?';
  const pp = layer2?.printing_probability ?? '?';
  const scenario = layer3?.scenario_type ?? '?';
  const scenLabel = layer3?.scenario_label ?? '';
  const war = layer3?.war_economy_flag ?? false;
  return `You are Agent 4 — Decision Matrix Executor in the Dalio Big Cycle Engine. You have final authority over allocation recommendations.

Subject: "${subject}" | Stage ${stage} (${stageLabel}) | MP: ${mp} | Debt: ${debt} | Printing: ${pp}% | Scenario: ${scenario} (${scenLabel}) | War economy: ${war}

Cycle stage → primary action mapping:
EARLY_CYCLE → LEVERAGE LONG: equities, real estate, corporate credit
BUBBLE → REDUCE LEVERAGE: rotate cyclicals to quality, build hedges
TOP → DEFENSIVE POSTURE: cash + short-term gov bonds, short bubble assets
DEFLATIONARY_DEPRESSION → PRESERVE CAPITAL: gov bonds + gold, avoid all credit
INFLATIONARY_DEPRESSION → HARD ASSET PRESERVATION: gold + hard FX + commodities, exit local bonds
MP3_DELEVERAGING → SHORT CASH / LONG REAL ASSETS: gold + TIPS + real assets + innovation, exit nominal bonds
NORMALIZATION → RE-ENTER RISK: equities slowly + innovation + corporate credit

Jurisdiction risk score 0–10 (capital controls probability + wealth confiscation risk + rule of law):
≥ 7 → JURISDICTION_OVERRIDE: "DIVERSIFY JURISDICTION — Singapore, Switzerland, UAE priority"
5–7 → Elevated: begin building foreign asset base

${war ? 'WAR_ECONOMY overlay: Long defense/domestic energy/strategic minerals. Avoid global supply-chain multinationals, EM sovereign debt.' : ''}

Return ONLY valid JSON with 5–7 asset classes in allocation_matrix:
{"cycle_stage":"DEFLATIONARY_DEPRESSION","primary_action":"","allocation_matrix":[{"asset_class":"","recommendation":"LONG","conviction":"HIGH","rationale":""}],"jurisdiction_risk_score":0.0,"jurisdiction_override":false,"jurisdiction_action":null,"wealth_confiscation_loop_active":false,"war_economy_loop_active":false,"position_sizing":"FULL","decision_rationale":""}`;
}

export function buildSupervisorSynthesisPrompt(subject, layer1, layer2, layer3, layer4) {
  const s1 = `Stage ${layer1?.empire_stage} (${layer1?.stage_label}), trajectory: ${layer1?.power_trajectory}`;
  const s2 = `${layer2?.debt_status}, MP: ${layer2?.mp_stage}, printing: ${layer2?.printing_probability}%, bubble: ${layer2?.bubble_alert ? 'ALERT' : 'clear'}, critical: ${layer2?.critical_debt_flag}`;
  const s3 = `${layer3?.scenario_type} (${layer3?.scenario_label}), analogy: ${layer3?.analogy_label} (${layer3?.analogy_confidence}), war: ${layer3?.war_economy_flag}`;
  const s4 = `"${layer4?.primary_action}", cycle: ${layer4?.cycle_stage}, juris: ${layer4?.jurisdiction_risk_score}/10, WC: ${layer4?.wealth_confiscation_loop_active}, WE: ${layer4?.war_economy_loop_active}`;
  return `You are the Supervisor "The Architect" in the Dalio Big Cycle Engine. Synthesize all four agent outputs for "${subject}".

Agent 1 (Five Forces): ${s1}
Agent 2 (Debt/Bubble): ${s2}
Agent 3 (Scenario): ${s3}
Agent 4 (Decision): ${s4}

Conflict resolution:
1. Stage ≥ 5 AND PONZI_FINANCE → escalate to CRISIS routing
2. INFLATIONARY + jurisdiction > 7 → prepend DIVERSIFY JURISDICTION to allocation
3. Bubble score ≥ 6 AND external_order > 6 → activate WAR_ECONOMY flag
4. Technology score < 2.0 → reduce printing_probability by 10 pts as cycle offset
5. If Agents 1 and 2 disagree on cycle stage by > 1 → weight Agent 2 (debt is leading)

agent_agreement: 4 = all agree on crisis vs. non-crisis; 3 = majority; 2 = split (flag LOW confidence)
active_flags: include any of CRITICAL_DEBT · WAR_ECONOMY · JURISDICTION_RISK · BUBBLE_ALERT that apply.

Return ONLY valid JSON:
{"confidence":"HIGH","agent_agreement":4,"empire_stage":1,"stage_label":"","cycle_stage":"","scenario_type":"","primary_action":"","printing_probability":0,"historical_analogy":"","analogy_confidence":"HIGH","active_flags":[],"allocation_summary":[{"asset_class":"","recommendation":"","conviction":"","rationale":""}],"feedback_loops_active":{"wealth_confiscation":false,"war_economy":false},"rerun_cadence":"MONTHLY","executive_summary":""}`;
}

export const BCE_AGENT_TOKENS      = 700;
export const BCE_SUPERVISOR_TOKENS = 900;
