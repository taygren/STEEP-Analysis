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
