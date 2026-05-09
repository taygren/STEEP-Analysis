/**
 * GeoSim Studio — Master Scenario Index & Engine Integration
 * Aggregates all scenario files and wires them into the SimulationEngine.
 * This is the single import point for any UI layer.
 */

import HISTORICAL_SCENARIOS from './scenarios/historical.js';
import SYSTEMIC_SCENARIOS from './scenarios/systemic-geoeconomic.js';
import AI_SCENARIOS from './scenarios/ai-tech.js';
import REMAINING_SCENARIOS from './scenarios/remaining.js';

import {
  SimulationEngine,
  initLensScores,
  updateLensScores,
  getSteepDominant,
  evaluateChoiceAvailability,
  getAvailableCrossLinks,
  calculateChoiceWeights,
  buildNarrativeRefreshPayload,
  buildExtendedLayerPayload,
  buildCustomScenarioPayload,
  buildOutcomeReportPayload,
  CROSS_SCENARIO_LINKS,
  BIG_CYCLE_PHASES,
  STEEP_DIMENSIONS,
  GAME_THEORY_TYPES,
  GEOEC_TOOLS
} from './engine/simulation.js';

// ============================================================
// MASTER SCENARIO REGISTRY
// ============================================================

/**
 * All 15 preset scenarios, ordered by cluster and display sequence
 */
const ALL_SCENARIOS = [
  // Cluster A — Historical Archetypes
  ...HISTORICAL_SCENARIOS,

  // Cluster B — Systemic Risk Typologies (from systemic-geoeconomic.js + remaining.js)
  ...SYSTEMIC_SCENARIOS.filter(s => s.cluster === 'systemic'),
  ...REMAINING_SCENARIOS.filter(s => s.cluster === 'systemic'),

  // Cluster C — Geoeconomic Orders
  ...SYSTEMIC_SCENARIOS.filter(s => s.cluster === 'geoeconomic'),
  ...REMAINING_SCENARIOS.filter(s => s.cluster === 'geoeconomic'),

  // Cluster D — AI & Technological Disruption
  ...AI_SCENARIOS,
  ...REMAINING_SCENARIOS.filter(s => s.cluster === 'ai-tech'),
];

/**
 * Cluster metadata for display
 */
const CLUSTER_METADATA = {
  historical: {
    id: 'historical',
    label: 'Historical Archetypes',
    description: 'Pivotal historical inflection points that redefined global economic and geopolitical architecture.',
    accent: '#8B4513',
    scenarios: ['oil-shocks-1973', 'asia-crisis-1997', 'gfc-2008']
  },
  systemic: {
    id: 'systemic',
    label: 'Systemic Risk Typologies',
    description: 'Structural risk patterns — some sudden, some long-building — that overwhelm institutional response capacity.',
    accent: '#C0392B',
    scenarios: ['black-swan', 'gray-rhino', 'imf-energy-shock-2026']
  },
  geoeconomic: {
    id: 'geoeconomic',
    label: 'Geoeconomic Orders',
    description: 'Structural futures for the global economic and geopolitical order — from bipolar competition to fragmentation to space.',
    accent: '#2C3E50',
    scenarios: ['bipolar-economy', 'fragmented-stagnation', 'tech-realignment', 'cislunar-geopolitics']
  },
  'ai-tech': {
    id: 'ai-tech',
    label: 'AI & Technological Disruption',
    description: 'Five distinct trajectories for advanced AI development and its civilizational consequences.',
    accent: '#C4622D',
    scenarios: ['ai-open-source-shock', 'ai-displacement', 'agi-monopoly', 'ai-wild-west', 'ai-bubble-burst']
  }
};

/**
 * Lens display metadata
 */
const LENS_METADATA = {
  bigCycle: {
    id: 'bigCycle',
    label: 'Big Cycle',
    shortLabel: 'BC',
    description: "Ray Dalio's framework: long-term debt cycles, reserve currency dynamics, institutional rise and decline",
    phases: BIG_CYCLE_PHASES,
    color: '#8B4513'
  },
  steep: {
    id: 'steep',
    label: 'STEEP',
    shortLabel: 'ST',
    description: 'Macro-environmental scanning across Social, Technological, Economic, Environmental, and Political dimensions',
    dimensions: STEEP_DIMENSIONS,
    dimensionLabels: { S: 'Social', T: 'Technological', E: 'Economic', En: 'Environmental', P: 'Political' },
    color: '#27AE60'
  },
  geoEcon: {
    id: 'geoEcon',
    label: 'GeoEconomics',
    shortLabel: 'GE',
    description: 'Statecraft tools, trade architecture, resource nationalism, sanctions regimes, hegemonic competition',
    tools: GEOEC_TOOLS,
    color: '#2980B9'
  },
  gameTheory: {
    id: 'gameTheory',
    label: 'Game Theory',
    shortLabel: 'GT',
    description: 'Strategic interaction classification: cooperation, defection, hedging, retaliation, containment, payoff structures',
    types: GAME_THEORY_TYPES,
    color: '#8E44AD'
  }
};

/**
 * Quick lookup: scenario tags for filtering
 */
const SCENARIO_TAG_INDEX = {};
ALL_SCENARIOS.forEach(scenario => {
  (scenario.tags || []).forEach(tag => {
    if (!SCENARIO_TAG_INDEX[tag]) SCENARIO_TAG_INDEX[tag] = [];
    SCENARIO_TAG_INDEX[tag].push(scenario.id);
  });
});

/**
 * Lens primary assignment index for filtering
 */
const SCENARIO_LENS_INDEX = {};
ALL_SCENARIOS.forEach(scenario => {
  const lens = scenario.primaryLens;
  if (!SCENARIO_LENS_INDEX[lens]) SCENARIO_LENS_INDEX[lens] = [];
  SCENARIO_LENS_INDEX[lens].push(scenario.id);
});

/**
 * Time horizon index for filtering
 */
const SCENARIO_HORIZON_INDEX = {};
ALL_SCENARIOS.forEach(scenario => {
  const h = scenario.timeHorizon;
  if (!SCENARIO_HORIZON_INDEX[h]) SCENARIO_HORIZON_INDEX[h] = [];
  SCENARIO_HORIZON_INDEX[h].push(scenario.id);
});


// ============================================================
// ENGINE FACTORY
// ============================================================

/**
 * Create a fully initialized simulation engine with all scenarios
 * This is the primary export for the UI layer.
 */
function createEngine() {
  return new SimulationEngine(ALL_SCENARIOS);
}

/**
 * Get filtered scenario list for the Scenario Select view
 * @param {Object} filters - { cluster, lens, timeHorizon, tags[], searchQuery }
 */
function getFilteredScenarios(filters = {}) {
  let results = ALL_SCENARIOS.map(s => ({
    id: s.id,
    title: s.title,
    cluster: s.cluster,
    clusterLabel: s.clusterLabel,
    era: s.era,
    timeHorizon: s.timeHorizon,
    primaryLens: s.primaryLens,
    description: s.description,
    tags: s.tags || [],
    nodeCount: Object.keys(s.nodes || {}).length
  }));

  if (filters.cluster) {
    results = results.filter(s => s.cluster === filters.cluster);
  }
  if (filters.lens) {
    results = results.filter(s => s.primaryLens === filters.lens);
  }
  if (filters.timeHorizon) {
    results = results.filter(s => s.timeHorizon === filters.timeHorizon);
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(s =>
      filters.tags.some(tag => s.tags.includes(tag))
    );
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase();
    results = results.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return results;
}

/**
 * Find the nearest preset scenario to a custom input
 * Used in static mode when custom scenario is requested without API
 * @param {Object} userInput - { primaryLens, timeHorizon, tags[] }
 */
function findNearestPreset(userInput) {
  let bestMatch = null;
  let bestScore = -1;

  ALL_SCENARIOS.forEach(scenario => {
    let score = 0;

    if (userInput.primaryLens && scenario.primaryLens === userInput.primaryLens) score += 3;
    if (userInput.timeHorizon && scenario.timeHorizon === userInput.timeHorizon) score += 2;
    if (userInput.tags) {
      const overlap = (userInput.tags || []).filter(t => (scenario.tags || []).includes(t)).length;
      score += overlap;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = scenario;
    }
  });

  return bestMatch ? {
    scenario: bestMatch,
    score: bestScore,
    isExactMatch: false,
    warning: "Custom scenario mode requires AI API. Routing to nearest preset scenario based on your inputs."
  } : null;
}

/**
 * Validate a custom scenario data structure before loading
 */
function validateCustomScenario(scenarioData) {
  const errors = [];
  const warnings = [];

  if (!scenarioData.id) errors.push("Missing: scenario id");
  if (!scenarioData.title) errors.push("Missing: scenario title");
  if (!scenarioData.rootNodeId) errors.push("Missing: rootNodeId");
  if (!scenarioData.nodes) errors.push("Missing: nodes object");

  if (scenarioData.nodes && scenarioData.rootNodeId) {
    if (!scenarioData.nodes[scenarioData.rootNodeId]) {
      errors.push(`Root node '${scenarioData.rootNodeId}' not found in nodes`);
    }

    // Check that all choice IDs exist as nodes
    Object.values(scenarioData.nodes).forEach(node => {
      (node.choices || []).forEach(choiceId => {
        if (!scenarioData.nodes[choiceId]) {
          warnings.push(`Choice '${choiceId}' in node '${node.id}' has no matching node`);
        }
      });
    });

    // Check at least one terminal node exists
    const terminals = Object.values(scenarioData.nodes).filter(n => n.type === 'terminal');
    if (terminals.length === 0) {
      warnings.push("No terminal nodes found — simulation may not be completable");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}


// ============================================================
// AI API ORCHESTRATOR
// ============================================================

/**
 * Central AI API call handler
 * All API calls route through here so the UI has a single integration point.
 * In static mode, returns null and the caller falls back to hardcoded content.
 *
 * [AI_API_HOOK] Wire this to the Anthropic API or any compatible LLM endpoint.
 * The model string should be 'claude-sonnet-4-20250514' for production.
 */
async function callAI(callType, payload, apiKey = null) {
  if (!apiKey) {
    console.warn(`[GeoSim] AI API not connected — ${callType} call skipped`);
    return null;
  }

  const systemPromptMap = {
    narrativeRefresh: payload.systemPrompt,
    extendedLayer: payload.systemPrompt,
    customScenario: payload.systemPrompt,
    outcomeReport: payload.systemPrompt
  };

  const userMessageMap = {
    narrativeRefresh: JSON.stringify(payload.context),
    extendedLayer: JSON.stringify(payload.context),
    customScenario: JSON.stringify(payload.userInput),
    outcomeReport: JSON.stringify(payload.outcomeData)
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPromptMap[callType],
        messages: [
          { role: "user", content: userMessageMap[callType] }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("[GeoSim] API error:", err);
      return null;
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    // For JSON-returning calls, parse the response
    if (payload.outputFormat === "JSON_ONLY") {
      try {
        const clean = raw.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      } catch (e) {
        console.error("[GeoSim] JSON parse error:", e, "Raw:", raw);
        return null;
      }
    }

    return raw;
  } catch (e) {
    console.error("[GeoSim] Network error:", e);
    return null;
  }
}

/**
 * High-level AI-assisted simulation functions for the UI
 */
const AIOrchestrator = {

  /**
   * Refresh node narrative based on player's path
   */
  async refreshNarrative(engine, apiKey) {
    const state = engine.getCurrentState();
    const node = engine.getCurrentNode();
    if (!node) return null;

    const payload = buildNarrativeRefreshPayload(state, node.aiPromptSeed || "");
    const result = await callAI('narrativeRefresh', payload, apiKey);
    return result; // Returns string narrative
  },

  /**
   * Generate extended Layer 5-6 node from terminal
   */
  async extendSimulation(engine, apiKey) {
    const state = engine.getCurrentState();
    const node = engine.getCurrentNode();
    if (!node || !state.simulationComplete) return null;

    const payload = buildExtendedLayerPayload(state, node);
    const result = await callAI('extendedLayer', payload, apiKey);

    if (result && result.id) {
      // Validate and inject the new node
      const validation = validateCustomScenario({
        id: `extended-${state.scenarioId}`,
        title: `${state.scenarioTitle} — Extended`,
        rootNodeId: result.id,
        nodes: { [result.id]: result, ...(result.childNodes || {}) }
      });

      if (validation.valid || validation.warnings.length === 0) {
        return result;
      }
    }
    return null;
  },

  /**
   * Generate a custom scenario from user input
   */
  async generateCustomScenario(userInput, apiKey) {
    const payload = buildCustomScenarioPayload(userInput);
    const result = await callAI('customScenario', payload, apiKey);

    if (result) {
      const validation = validateCustomScenario(result);
      return { scenario: result, validation };
    }
    return null;
  },

  /**
   * Synthesize an enriched outcome report
   */
  async synthesizeOutcomeReport(engine, apiKey) {
    const report = engine.generateOutcomeReport();
    if (!report) return null;

    const payload = buildOutcomeReportPayload(report);
    const aiSynthesis = await callAI('outcomeReport', payload, apiKey);

    return {
      ...report,
      aiSynthesis: aiSynthesis || null
    };
  }
};


// ============================================================
// SCENARIO COMPLETION TRACKER
// ============================================================

/**
 * Track which scenarios and outcomes the user has reached
 * Persists to localStorage when available
 */
const CompletionTracker = {
  STORAGE_KEY: 'geosim_completion',

  getCompletions() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { scenarios: {}, outcomes: [], totalDecisions: 0 };
    } catch {
      return { scenarios: {}, outcomes: [], totalDecisions: 0 };
    }
  },

  recordCompletion(scenarioId, outcomeNodeId, pathLength) {
    try {
      const data = this.getCompletions();
      if (!data.scenarios[scenarioId]) data.scenarios[scenarioId] = [];
      if (!data.scenarios[scenarioId].includes(outcomeNodeId)) {
        data.scenarios[scenarioId].push(outcomeNodeId);
      }
      if (!data.outcomes.includes(outcomeNodeId)) {
        data.outcomes.push(outcomeNodeId);
      }
      data.totalDecisions = (data.totalDecisions || 0) + pathLength;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  getScenarioProgress(scenarioId) {
    const data = this.getCompletions();
    const reached = data.scenarios[scenarioId] || [];

    // Find total possible terminal nodes for this scenario
    const scenario = ALL_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return { reached: 0, total: 0, percentage: 0 };

    const total = Object.values(scenario.nodes || {}).filter(n => n.type === 'terminal').length;
    return {
      reached: reached.length,
      total,
      percentage: total > 0 ? Math.round((reached.length / total) * 100) : 0,
      reachedNodeIds: reached
    };
  },

  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
};


// ============================================================
// EXPORTS
// ============================================================

export {
  // Core data
  ALL_SCENARIOS,
  CLUSTER_METADATA,
  LENS_METADATA,
  SCENARIO_TAG_INDEX,
  SCENARIO_LENS_INDEX,
  SCENARIO_HORIZON_INDEX,

  // Engine factory
  createEngine,

  // Filtering and validation
  getFilteredScenarios,
  findNearestPreset,
  validateCustomScenario,

  // AI orchestration
  AIOrchestrator,
  callAI,

  // Completion tracking
  CompletionTracker,

  // Re-exports from engine
  SimulationEngine,
  initLensScores,
  updateLensScores,
  getSteepDominant,
  evaluateChoiceAvailability,
  getAvailableCrossLinks,
  calculateChoiceWeights,
  buildNarrativeRefreshPayload,
  buildExtendedLayerPayload,
  buildCustomScenarioPayload,
  buildOutcomeReportPayload,
  CROSS_SCENARIO_LINKS,
  BIG_CYCLE_PHASES,
  STEEP_DIMENSIONS,
  GAME_THEORY_TYPES,
  GEOEC_TOOLS
};
