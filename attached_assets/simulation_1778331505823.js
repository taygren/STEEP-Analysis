/**
 * GeoSim Studio — Core Simulation Engine (Phase 3)
 * Handles: decision tree traversal, conditional branching, path memory,
 * cross-scenario linking, lens score accumulation, adaptive node weighting
 */

// ============================================================
// LENS SCORING ENGINE
// ============================================================

const BIG_CYCLE_PHASES = [
  "Accumulation", "Rise", "Consolidation", "Overextension",
  "Decline", "Reset", "Transition", "New-Cycle-Entry"
];

const STEEP_DIMENSIONS = ["S", "T", "E", "En", "P"];

const GAME_THEORY_TYPES = [
  "Cooperate", "Defect", "Hedge", "Retaliate", "Contain",
  "Accommodate", "Escalate", "Signal", "Exit", "Coordinate"
];

const GEOEC_TOOLS = [
  "Tariffs", "Sanctions", "Export Controls", "Currency Manipulation",
  "Resource Nationalism", "Alliance Architecture", "Fiscal Statecraft",
  "Monetary Policy", "Military Statecraft", "Technological Statecraft"
];

/**
 * Initialize a fresh lens score state
 */
function initLensScores() {
  return {
    bigCycle: {
      phase: "Unknown",
      phaseIndex: -1,
      score: 0,
      history: [],
      note: ""
    },
    steep: {
      S: 0, T: 0, E: 0, En: 0, P: 0,
      primary: null,
      secondary: null,
      activationCount: 0
    },
    geoEcon: {
      toolsDeployed: [],
      dominantTool: null,
      intensityScore: 0
    },
    gameTheory: {
      moves: [],
      cooperateCount: 0,
      defectCount: 0,
      currentType: "Unknown",
      payoffLedger: { positive: 0, negative: 0, neutral: 0 },
      dominantPattern: null
    }
  };
}

/**
 * Update lens scores from a node's lensSnapshot
 */
function updateLensScores(currentScores, lensSnapshot) {
  const updated = JSON.parse(JSON.stringify(currentScores));

  // Big Cycle update
  if (lensSnapshot.bigCycle) {
    updated.bigCycle.phase = lensSnapshot.bigCycle.phase;
    updated.bigCycle.note = lensSnapshot.bigCycle.note;
    const phaseIdx = BIG_CYCLE_PHASES.indexOf(lensSnapshot.bigCycle.phase.split("-")[0]);
    if (phaseIdx >= 0) updated.bigCycle.phaseIndex = phaseIdx;
    updated.bigCycle.score = Math.max(0, Math.min(100, updated.bigCycle.score + 10));
    updated.bigCycle.history.push(lensSnapshot.bigCycle.phase);
  }

  // STEEP update
  if (lensSnapshot.steep) {
    const primary = lensSnapshot.steep.primary;
    const secondary = lensSnapshot.steep.secondary;
    if (primary && STEEP_DIMENSIONS.includes(primary)) {
      updated.steep[primary] = Math.min(1.0, (updated.steep[primary] || 0) + 0.2);
      updated.steep.primary = primary;
    }
    if (secondary && STEEP_DIMENSIONS.includes(secondary)) {
      updated.steep[secondary] = Math.min(1.0, (updated.steep[secondary] || 0) + 0.1);
      updated.steep.secondary = secondary;
    }
    updated.steep.activationCount += 1;
  }

  // GeoEcon update
  if (lensSnapshot.geoEcon && lensSnapshot.geoEcon.tool) {
    const tool = lensSnapshot.geoEcon.tool;
    if (!updated.geoEcon.toolsDeployed.includes(tool)) {
      updated.geoEcon.toolsDeployed.push(tool);
    }
    updated.geoEcon.dominantTool = tool;
    updated.geoEcon.intensityScore = Math.min(100, updated.geoEcon.intensityScore + 15);
  }

  // Game Theory update
  if (lensSnapshot.gameTheory) {
    const type = lensSnapshot.gameTheory.type;
    updated.gameTheory.currentType = type;
    updated.gameTheory.moves.push(type);

    const cooperativeTypes = ["Cooperate", "Coordinate", "Positive-Sum", "Cooperative", "Coalition", "Commitment"];
    const defectTypes = ["Defect", "Retaliate", "Escalate", "Zero-Sum", "Coercion", "Attacker"];
    const neutralTypes = ["Hedge", "Signal", "Exit", "Sequential"];

    const isCooperative = cooperativeTypes.some(t => type.includes(t));
    const isDefect = defectTypes.some(t => type.includes(t));

    if (isCooperative) {
      updated.gameTheory.cooperateCount++;
      updated.gameTheory.payoffLedger.positive++;
    } else if (isDefect) {
      updated.gameTheory.defectCount++;
      updated.gameTheory.payoffLedger.negative++;
    } else {
      updated.gameTheory.payoffLedger.neutral++;
    }

    // Determine dominant pattern
    if (updated.gameTheory.cooperateCount > updated.gameTheory.defectCount * 1.5) {
      updated.gameTheory.dominantPattern = "Cooperative";
    } else if (updated.gameTheory.defectCount > updated.gameTheory.cooperateCount * 1.5) {
      updated.gameTheory.dominantPattern = "Adversarial";
    } else {
      updated.gameTheory.dominantPattern = "Mixed";
    }
  }

  return updated;
}

/**
 * Calculate STEEP dominant dimension from current scores
 */
function getSteepDominant(steepScores) {
  let max = 0;
  let dominant = "E";
  STEEP_DIMENSIONS.forEach(dim => {
    if (steepScores[dim] > max) {
      max = steepScores[dim];
      dominant = dim;
    }
  });
  return dominant;
}

// ============================================================
// CONDITIONAL BRANCHING LOGIC
// ============================================================

/**
 * Evaluate whether a choice should be unlocked based on path history
 * Rules engine for conditional node availability
 */
function evaluateChoiceAvailability(choiceId, decisionVector, lensScores, scenarioId) {
  const conditionalRules = {
    // Oil Shocks: Petrodollar deal only available if peg was NOT defended
    "os73-L3-petrodollar-deal": (dv) => !dv.some(d => d.choiceId === "os73-L1-defend-peg"),

    // Bipolar: Secondary sanctions only available if containment was chosen
    "bpe-L2-aggressive-secondary-sanctions": (dv) =>
      dv.some(d => d.choiceId === "bpe-L1-containment"),

    // Bipolar: Economic incentives only available if accommodation was chosen
    "bpe-L2-economic-incentives": (dv) =>
      dv.some(d => d.choiceId === "bpe-L1-accommodation"),

    // IMF program only available if fiscal overextension occurred
    "ies26-L4-imf-program": (dv, ls) => ls.geoEcon.intensityScore > 40,

    // International tax coordination requires UBI to have been selected first
    "aid-L3-international-tax-coordination": (dv) =>
      dv.some(d => d.choiceId === "aid-L2-ubi-experiment"),

    // Sovereign wealth fund requires demand collapse acknowledgment
    "aid-L3-sovereign-wealth-fund": (dv) =>
      dv.some(d => d.choiceId === "aid-L2-demand-collapse"),

    // Quantum pivot only available if mass divestment occurred
    "aibb-L4-quantum-commercial": (dv) =>
      dv.some(d => d.choiceId === "aibb-L1-strategic-pivot" || d.choiceId === "aibb-L2-state-industrial-policy"),

    // Binding treaty requires cooperative game theory pattern
    "aios-L4-binding-treaty": (dv, ls) =>
      ls.gameTheory.cooperateCount >= ls.gameTheory.defectCount,

    // Volcker shock only available if rates were initially lowered
    "os73-L2-volcker-shock": (dv) =>
      dv.some(d => d.choiceId === "os73-L1-lower-rates"),

    // Premature easing only available after volcker shock attempt
    "os73-L3-premature-easing": (dv) =>
      dv.some(d => d.choiceId === "os73-L2-volcker-shock"),
  };

  // If no rule exists, choice is always available
  if (!conditionalRules[choiceId]) return true;

  try {
    return conditionalRules[choiceId](decisionVector, lensScores);
  } catch (e) {
    return true; // Fail open
  }
}

// ============================================================
// CROSS-SCENARIO LINK ENGINE
// ============================================================

/**
 * Cross-scenario link definitions
 * Terminal outcomes in one scenario can seed new simulations
 */
const CROSS_SCENARIO_LINKS = [
  {
    fromScenario: "oil-shocks-1973",
    fromNodeId: "os73-L4-strategic-reserves",
    toScenario: "imf-energy-shock-2026",
    toNodeId: "ies26-L0-trigger",
    linkLabel: "Fast-forward 50 years: energy architecture tested again",
    rationale: "Successful 1973 energy architecture didn't prevent 2026 vulnerability; model how the inherited system performs under new stress"
  },
  {
    fromScenario: "gfc-2008",
    fromNodeId: "gfc08-L4-shadow-migration",
    toScenario: "bipolar-economy",
    toNodeId: "bpe-L0-trigger",
    linkLabel: "Financial fragility meets geopolitical fracture",
    rationale: "Unresolved shadow banking risk intersects with hegemonic competition; dual vulnerability amplifies both crises"
  },
  {
    fromScenario: "asia-crisis-1997",
    fromNodeId: "afc97-L4-reserve-accumulation",
    toScenario: "gfc-2008",
    toNodeId: "gfc08-L0-trigger",
    linkLabel: "Asian reserves fuel US credit bubble",
    rationale: "Asian reserve accumulation suppresses US long rates; cheap money fuels housing bubble; 1997 response seeds 2008 crisis"
  },
  {
    fromScenario: "ai-bubble-burst",
    fromNodeId: "aibb-L4-quantum-commercial",
    toScenario: "ai-open-source-shock",
    toNodeId: "aios-L0-trigger",
    linkLabel: "Quantum-AI convergence reopens capability frontier",
    rationale: "Quantum-AI hybrid systems create new capability frontier; open-source quantum-AI models trigger new governance crisis"
  },
  {
    fromScenario: "bipolar-economy",
    fromNodeId: "bpe-L4-digital-dollar-dominance",
    toScenario: "imf-energy-shock-2026",
    toNodeId: "ies26-L1-severe",
    linkLabel: "Dollar weaponization accelerates Hormuz crisis impact",
    rationale: "Digital dollar enforcement intensifies energy shock by restricting sanctioned nations' ability to hedge"
  },
  {
    fromScenario: "ai-displacement",
    fromNodeId: "aid-L4-independent-fund-governance",
    toScenario: "bipolar-economy",
    toNodeId: "bpe-L1-accommodation",
    linkLabel: "AI wealth redistribution reduces hegemonic competition pressure",
    rationale: "Domestic stability from AI wealth distribution reduces geopolitical confrontation pressure; accommodation becomes viable"
  },
  {
    fromScenario: "black-swan",
    fromNodeId: "bsw-L4-nato-cyber-command",
    toScenario: "ai-open-source-shock",
    toNodeId: "aios-L2-international-treaty",
    linkLabel: "Cyber defense architecture extends to AI governance",
    rationale: "NATO cyber command provides institutional template for AI governance coalition"
  }
];

/**
 * Get available cross-scenario links for a terminal node
 */
function getAvailableCrossLinks(scenarioId, nodeId) {
  return CROSS_SCENARIO_LINKS.filter(link =>
    link.fromScenario === scenarioId && link.fromNodeId === nodeId
  );
}

// ============================================================
// CORE SIMULATION STATE MACHINE
// ============================================================

class SimulationEngine {
  constructor(scenarioData) {
    this.allScenarios = scenarioData;
    this.scenarioIndex = this._buildScenarioIndex(scenarioData);
    this.reset();
  }

  _buildScenarioIndex(scenarioData) {
    const index = {};
    if (!Array.isArray(scenarioData)) return index;
    scenarioData.forEach(scenario => {
      index[scenario.id] = scenario;
    });
    return index;
  }

  reset() {
    this.state = {
      scenarioId: null,
      scenarioTitle: null,
      cluster: null,
      currentNodeId: null,
      currentLayer: 0,
      decisionVector: [],
      lensScores: initLensScores(),
      aiModeActive: false,
      customScenarioData: null,
      sessionStartTime: Date.now(),
      simulationComplete: false,
      crossScenarioHistory: [],
      pathNarrative: []
    };
  }

  /**
   * Start a simulation with a given scenario ID
   */
  startScenario(scenarioId) {
    const scenario = this.scenarioIndex[scenarioId];
    if (!scenario) {
      console.error(`Scenario not found: ${scenarioId}`);
      return null;
    }

    this.reset();
    this.state.scenarioId = scenarioId;
    this.state.scenarioTitle = scenario.title;
    this.state.cluster = scenario.cluster;
    this.state.currentNodeId = scenario.rootNodeId;
    this.state.currentLayer = 0;

    // Initialize lens scores from root node
    const rootNode = scenario.nodes[scenario.rootNodeId];
    if (rootNode && rootNode.lensSnapshot) {
      this.state.lensScores = updateLensScores(this.state.lensScores, rootNode.lensSnapshot);
    }

    return this.getCurrentState();
  }

  /**
   * Get the current scenario object
   */
  getCurrentScenario() {
    if (this.state.customScenarioData) return this.state.customScenarioData;
    return this.scenarioIndex[this.state.scenarioId] || null;
  }

  /**
   * Get the current node object
   */
  getCurrentNode() {
    const scenario = this.getCurrentScenario();
    if (!scenario) return null;
    return scenario.nodes[this.state.currentNodeId] || null;
  }

  /**
   * Get available choices for the current node, with availability evaluated
   */
  getAvailableChoices() {
    const node = this.getCurrentNode();
    if (!node || !node.choices) return [];

    return node.choices.map(choiceId => {
      const available = evaluateChoiceAvailability(
        choiceId,
        this.state.decisionVector,
        this.state.lensScores,
        this.state.scenarioId
      );

      // Find the target node for this choice
      const scenario = this.getCurrentScenario();
      const targetNode = scenario ? scenario.nodes[choiceId] : null;

      return {
        id: choiceId,
        available,
        label: targetNode ? targetNode.label || targetNode.title : choiceId,
        title: targetNode ? targetNode.title : choiceId,
        lensSnapshot: targetNode ? targetNode.lensSnapshot : null,
        secondOrderEffects: targetNode ? targetNode.secondOrderEffects || [] : [],
        historicalAnalog: targetNode ? targetNode.historicalAnalog : null
      };
    });
  }

  /**
   * Make a choice and advance the simulation
   */
  makeChoice(choiceId) {
    const scenario = this.getCurrentScenario();
    if (!scenario) return null;

    const currentNode = this.getCurrentNode();
    if (!currentNode) return null;

    // Verify choice is available
    const available = evaluateChoiceAvailability(
      choiceId,
      this.state.decisionVector,
      this.state.lensScores,
      this.state.scenarioId
    );

    if (!available) {
      return { error: "Choice not available based on current path", choiceId };
    }

    // Record the decision
    this.state.decisionVector.push({
      nodeId: this.state.currentNodeId,
      nodeTitle: currentNode.title,
      choiceId: choiceId,
      layer: this.state.currentLayer,
      timestamp: Date.now()
    });

    // Move to the chosen node
    const nextNode = scenario.nodes[choiceId];
    if (!nextNode) {
      return { error: "Target node not found", choiceId };
    }

    // Update lens scores
    if (nextNode.lensSnapshot) {
      this.state.lensScores = updateLensScores(this.state.lensScores, nextNode.lensSnapshot);
    }

    // Add to path narrative
    if (nextNode.narrative) {
      this.state.pathNarrative.push({
        layer: nextNode.layer,
        nodeTitle: nextNode.title,
        narrative: nextNode.narrative
      });
    }

    this.state.currentNodeId = choiceId;
    this.state.currentLayer = nextNode.layer;

    // Check if terminal
    if (nextNode.type === "terminal") {
      this.state.simulationComplete = true;
    }

    return this.getCurrentState();
  }

  /**
   * Follow a cross-scenario link from a terminal node
   */
  followCrossScenarioLink(linkIndex) {
    const node = this.getCurrentNode();
    if (!node) return null;

    const links = getAvailableCrossLinks(this.state.scenarioId, this.state.currentNodeId);
    const link = links[linkIndex];
    if (!link) return { error: "Link not found" };

    // Save current scenario to history
    this.state.crossScenarioHistory.push({
      scenarioId: this.state.scenarioId,
      scenarioTitle: this.state.scenarioTitle,
      exitNodeId: this.state.currentNodeId,
      exitLayer: this.state.currentLayer,
      lensScoresAtExit: JSON.parse(JSON.stringify(this.state.lensScores))
    });

    // Start the new scenario but carry lens scores forward
    const previousLensScores = JSON.parse(JSON.stringify(this.state.lensScores));
    const previousVector = [...this.state.decisionVector];

    const newScenario = this.scenarioIndex[link.toScenario];
    if (!newScenario) return { error: "Target scenario not found" };

    this.state.scenarioId = link.toScenario;
    this.state.scenarioTitle = newScenario.title;
    this.state.cluster = newScenario.cluster;
    this.state.currentNodeId = link.toNodeId;
    this.state.currentLayer = 0;
    this.state.simulationComplete = false;

    // Merge lens scores (carry 50% of previous into new scenario)
    const newScores = initLensScores();
    STEEP_DIMENSIONS.forEach(dim => {
      newScores.steep[dim] = previousLensScores.steep[dim] * 0.5;
    });
    newScores.gameTheory.cooperateCount = Math.floor(previousLensScores.gameTheory.cooperateCount * 0.5);
    newScores.gameTheory.defectCount = Math.floor(previousLensScores.gameTheory.defectCount * 0.5);
    this.state.lensScores = newScores;

    return {
      crossScenarioLink: link,
      newState: this.getCurrentState()
    };
  }

  /**
   * Get full current state snapshot
   */
  getCurrentState() {
    const scenario = this.getCurrentScenario();
    const node = this.getCurrentNode();
    const choices = this.getAvailableChoices();
    const crossLinks = this.state.simulationComplete
      ? getAvailableCrossLinks(this.state.scenarioId, this.state.currentNodeId)
      : [];

    // Calculate overall path trajectory
    const trajectory = this._calculatePathTrajectory();

    return {
      // Core state
      scenarioId: this.state.scenarioId,
      scenarioTitle: this.state.scenarioTitle,
      cluster: this.state.cluster,
      currentNodeId: this.state.currentNodeId,
      currentLayer: this.state.currentLayer,
      simulationComplete: this.state.simulationComplete,

      // Current node
      currentNode: node,

      // Navigation
      availableChoices: choices,
      crossScenarioLinks: crossLinks,

      // Path history
      decisionVector: this.state.decisionVector,
      pathNarrative: this.state.pathNarrative,
      crossScenarioHistory: this.state.crossScenarioHistory,

      // Lens scores
      lensScores: this.state.lensScores,
      steepDominant: getSteepDominant(this.state.lensScores.steep),
      pathTrajectory: trajectory,

      // AI mode
      aiModeActive: this.state.aiModeActive,

      // Metadata
      totalDecisions: this.state.decisionVector.length,
      sessionDuration: Date.now() - this.state.sessionStartTime
    };
  }

  /**
   * Calculate a high-level path trajectory summary
   */
  _calculatePathTrajectory() {
    const ls = this.state.lensScores;
    const dv = this.state.decisionVector;

    if (dv.length === 0) return { label: "Simulation Not Started", color: "#888" };

    const cooperate = ls.gameTheory.cooperateCount;
    const defect = ls.gameTheory.defectCount;
    const ratio = defect / Math.max(1, cooperate + defect);

    const bigCyclePhase = ls.bigCycle.phase;
    const steepDominant = getSteepDominant(ls.steep);

    let trajectoryLabel;
    let trajectoryColor;

    if (ratio > 0.7) {
      trajectoryLabel = "Adversarial Escalation";
      trajectoryColor = "#C0392B";
    } else if (ratio < 0.3) {
      trajectoryLabel = "Cooperative Resolution";
      trajectoryColor = "#27AE60";
    } else if (bigCyclePhase.includes("Reset") || bigCyclePhase.includes("Transition")) {
      trajectoryLabel = "Managed Transition";
      trajectoryColor = "#E67E22";
    } else if (bigCyclePhase.includes("Overextension") || bigCyclePhase.includes("Decline")) {
      trajectoryLabel = "Systemic Fragility";
      trajectoryColor = "#8E44AD";
    } else {
      trajectoryLabel = "Uncertain Equilibrium";
      trajectoryColor = "#2980B9";
    }

    return {
      label: trajectoryLabel,
      color: trajectoryColor,
      bigCyclePhase,
      steepDominant,
      cooperateRatio: 1 - ratio,
      defectRatio: ratio
    };
  }

  /**
   * Generate outcome report data for terminal nodes
   */
  generateOutcomeReport() {
    if (!this.state.simulationComplete) return null;

    const node = this.getCurrentNode();
    const scenario = this.getCurrentScenario();
    const ls = this.state.lensScores;
    const dv = this.state.decisionVector;
    const trajectory = this._calculatePathTrajectory();

    // Build decision path summary
    const pathSummary = dv.map((decision, i) => ({
      step: i + 1,
      layer: decision.layer,
      fromNode: decision.nodeTitle,
      choice: decision.choiceId,
      choiceTitle: scenario.nodes[decision.choiceId]?.title || decision.choiceId
    }));

    // Calculate STEEP impact
    const steepImpact = {
      S: { score: ls.steep.S, label: "Social", level: ls.steep.S > 0.6 ? "High" : ls.steep.S > 0.3 ? "Medium" : "Low" },
      T: { score: ls.steep.T, label: "Technological", level: ls.steep.T > 0.6 ? "High" : ls.steep.T > 0.3 ? "Medium" : "Low" },
      E: { score: ls.steep.E, label: "Economic", level: ls.steep.E > 0.6 ? "High" : ls.steep.E > 0.3 ? "Medium" : "Low" },
      En: { score: ls.steep.En, label: "Environmental", level: ls.steep.En > 0.6 ? "High" : ls.steep.En > 0.3 ? "Medium" : "Low" },
      P: { score: ls.steep.P, label: "Political", level: ls.steep.P > 0.6 ? "High" : ls.steep.P > 0.3 ? "Medium" : "Low" }
    };

    // Classify the game theory pattern
    let gameClassification;
    const cooperate = ls.gameTheory.cooperateCount;
    const defect = ls.gameTheory.defectCount;
    if (cooperate > defect * 2) {
      gameClassification = "Cooperative Equilibrium — Actors found mutual gains; positive-sum outcome achieved";
    } else if (defect > cooperate * 2) {
      gameClassification = "Adversarial Spiral — Defection dominated; suboptimal collective outcome";
    } else if (ls.gameTheory.dominantPattern === "Mixed") {
      gameClassification = "Mixed Strategy Equilibrium — Neither pure cooperation nor defection; contingent outcomes";
    } else {
      gameClassification = "Strategic Uncertainty — Path contained too many novel game structures for clean classification";
    }

    return {
      scenarioId: this.state.scenarioId,
      scenarioTitle: this.state.scenarioTitle,
      outcomeNode: node,
      outcome: node?.outcome || "Simulation Complete",
      outcomeNarrative: node?.outcomeNarrative || node?.narrative || "",

      pathSummary,
      totalDecisions: dv.length,
      layersTraversed: this.state.currentLayer,

      lensScores: ls,
      steepImpact,
      gameTheoryClassification: gameClassification,
      bigCyclePhase: ls.bigCycle.phase,
      bigCycleNote: ls.bigCycle.note,
      geoEconTools: ls.geoEcon.toolsDeployed,
      dominantGeoEconTool: ls.geoEcon.dominantTool,

      trajectory,

      historicalAnalog: node?.historicalAnalog || scenario?.era || "",
      aiPromptSeed: node?.aiPromptSeed || "",

      crossScenarioLinks: getAvailableCrossLinks(this.state.scenarioId, this.state.currentNodeId),
      crossScenarioHistory: this.state.crossScenarioHistory,

      finalLensScores: node?.finalLensScores || null,

      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Export the current path as structured JSON
   */
  exportPath() {
    const report = this.generateOutcomeReport();
    return {
      version: "1.0",
      tool: "GeoSim Studio",
      export: {
        type: this.state.simulationComplete ? "complete-simulation" : "partial-simulation",
        timestamp: new Date().toISOString(),
        scenarioId: this.state.scenarioId,
        scenarioTitle: this.state.scenarioTitle,
        decisionVector: this.state.decisionVector,
        lensScores: this.state.lensScores,
        pathNarrative: this.state.pathNarrative,
        outcomeReport: report
      }
    };
  }

  /**
   * Export the current path as human-readable text
   */
  exportPathAsText() {
    const scenario = this.getCurrentScenario();
    const dv = this.state.decisionVector;
    const ls = this.state.lensScores;
    const report = this.generateOutcomeReport();

    let text = `GeoSim Studio — Simulation Record\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `Scenario: ${this.state.scenarioTitle}\n`;
    text += `Cluster: ${this.state.cluster}\n`;
    text += `Decisions Made: ${dv.length}\n`;
    text += `Session Duration: ${Math.round((Date.now() - this.state.sessionStartTime) / 60000)} minutes\n\n`;

    text += `DECISION PATH\n${"-".repeat(40)}\n`;
    dv.forEach((decision, i) => {
      const choiceNode = scenario?.nodes[decision.choiceId];
      text += `Layer ${decision.layer}: ${decision.nodeTitle}\n`;
      text += `  → Choice: ${choiceNode?.title || decision.choiceId}\n\n`;
    });

    text += `\nLENS SCORE SUMMARY\n${"-".repeat(40)}\n`;
    text += `Big Cycle Phase: ${ls.bigCycle.phase}\n`;
    text += `STEEP Activation: S=${(ls.steep.S * 100).toFixed(0)}% T=${(ls.steep.T * 100).toFixed(0)}% E=${(ls.steep.E * 100).toFixed(0)}% En=${(ls.steep.En * 100).toFixed(0)}% P=${(ls.steep.P * 100).toFixed(0)}%\n`;
    text += `GeoEcon Tools Deployed: ${ls.geoEcon.toolsDeployed.join(", ") || "None"}\n`;
    text += `Game Theory Pattern: ${ls.gameTheory.dominantPattern || "Mixed"} (Cooperate: ${ls.gameTheory.cooperateCount}, Defect: ${ls.gameTheory.defectCount})\n`;

    if (report) {
      text += `\nOUTCOME\n${"-".repeat(40)}\n`;
      text += `${report.outcome}\n\n`;
      text += `${report.outcomeNarrative}\n\n`;
      text += `Game Theory Classification: ${report.gameTheoryClassification}\n`;
      text += `Historical Analog: ${report.historicalAnalog}\n`;
    }

    return text;
  }

  /**
   * Set AI mode on/off
   */
  setAiMode(active) {
    this.state.aiModeActive = active;
  }

  /**
   * Load a custom scenario (AI-generated or user-defined)
   */
  loadCustomScenario(scenarioData) {
    this.reset();
    this.state.customScenarioData = scenarioData;
    this.state.scenarioId = scenarioData.id || "custom-scenario";
    this.state.scenarioTitle = scenarioData.title || "Custom Scenario";
    this.state.cluster = scenarioData.cluster || "custom";
    this.state.currentNodeId = scenarioData.rootNodeId;
    this.state.currentLayer = 0;

    const rootNode = scenarioData.nodes[scenarioData.rootNodeId];
    if (rootNode && rootNode.lensSnapshot) {
      this.state.lensScores = updateLensScores(this.state.lensScores, rootNode.lensSnapshot);
    }

    return this.getCurrentState();
  }

  /**
   * Get all available scenarios organized by cluster
   */
  getScenarioLibrary() {
    const library = {};
    Object.values(this.scenarioIndex).forEach(scenario => {
      if (!library[scenario.cluster]) library[scenario.cluster] = [];
      library[scenario.cluster].push({
        id: scenario.id,
        title: scenario.title,
        cluster: scenario.cluster,
        clusterLabel: scenario.clusterLabel,
        era: scenario.era,
        timeHorizon: scenario.timeHorizon,
        primaryLens: scenario.primaryLens,
        description: scenario.description,
        tags: scenario.tags
      });
    });
    return library;
  }

  /**
   * Get scenario metadata by ID
   */
  getScenarioMeta(scenarioId) {
    const scenario = this.scenarioIndex[scenarioId];
    if (!scenario) return null;
    return {
      id: scenario.id,
      title: scenario.title,
      cluster: scenario.cluster,
      clusterLabel: scenario.clusterLabel,
      era: scenario.era,
      timeHorizon: scenario.timeHorizon,
      primaryLens: scenario.primaryLens,
      description: scenario.description,
      tags: scenario.tags,
      aiPromptContext: scenario.aiPromptContext,
      totalNodes: Object.keys(scenario.nodes).length,
      rootNodeId: scenario.rootNodeId
    };
  }
}

// ============================================================
// AI API BRIDGE — MODULAR HOOKS
// ============================================================

/**
 * Build API payload for node narrative refresh
 * [AI_API_HOOK] Replace static narrative with live API call
 */
function buildNarrativeRefreshPayload(simulationState, nodePromptSeed) {
  return {
    systemPrompt: `You are a geopolitical simulation engine. Analyze the player's decision path and generate 2-4 sentences of contextual narrative that connects their previous choices to the current situation. Maintain analytical tone. Apply Big Cycle (${simulationState.lensScores.bigCycle.phase}), STEEP (dominant: ${getSteepDominant(simulationState.lensScores.steep)}), and game theory (${simulationState.lensScores.gameTheory.currentType}) frameworks.`,
    context: {
      scenarioTitle: simulationState.scenarioTitle,
      currentLayer: simulationState.currentLayer,
      decisionPath: simulationState.decisionVector.map(d => d.choiceId).join(" → "),
      lensScores: simulationState.lensScores,
      nodePromptSeed: nodePromptSeed
    }
  };
}

/**
 * Build API payload for extended layer generation (Layer 5+)
 * [AI_API_HOOK] API call to generate new nodes beyond hardcoded tree
 */
function buildExtendedLayerPayload(simulationState, terminalNode) {
  return {
    systemPrompt: `You are a geopolitical simulation engine. Based on the player's decision path in this scenario, generate the next simulation layer as a JSON object following this exact schema: { id, layer, type, title, narrative, lensSnapshot: { bigCycle, steep, geoEcon, gameTheory }, secondOrderEffects[], historicalAnalog, choices[], aiPromptSeed }. choices should be 2-4 node IDs representing the next decision points, each following the same schema. The game theory type should be one of: Cooperate, Defect, Hedge, Retaliate, Contain, Accommodate, Escalate, Signal, Exit, Coordinate.`,
    context: {
      scenarioTitle: simulationState.scenarioTitle,
      scenarioContext: simulationState.currentNode?.aiPromptSeed || terminalNode?.aiPromptSeed,
      decisionPath: simulationState.decisionVector.map(d => d.choiceId).join(" → "),
      currentLensScores: simulationState.lensScores,
      currentOutcome: terminalNode?.outcome,
      requestedLayer: simulationState.currentLayer + 1
    },
    outputFormat: "JSON_ONLY"
  };
}

/**
 * Build API payload for custom scenario generation
 * [AI_API_HOOK] Generate full node tree from user input
 */
function buildCustomScenarioPayload(userInput) {
  return {
    systemPrompt: `You are a geopolitical simulation engine. Generate a complete simulation scenario as a JSON object. The scenario should include a rootNodeId and a nodes object containing at least 4 layers of decision tree. Each node must follow the schema: { id, layer, type (trigger|decision|outcome|terminal), title, narrative, lensSnapshot: { bigCycle, steep, geoEcon, gameTheory }, secondOrderEffects[], historicalAnalog, choicePrompt, choices[] }. Terminal nodes additionally need: outcome, outcomeNarrative, finalLensScores, aiPromptSeed. Apply Big Cycle, STEEP, GeoEconomics, and Game Theory frameworks throughout. Return ONLY valid JSON.`,
    userInput: {
      triggerEvent: userInput.triggerEvent,
      actors: userInput.actors,
      primaryLens: userInput.primaryLens,
      timeHorizon: userInput.timeHorizon,
      desiredDepth: userInput.desiredDepth || 4,
      additionalContext: userInput.additionalContext || ""
    },
    outputFormat: "JSON_ONLY"
  };
}

/**
 * Build API payload for outcome report synthesis
 * [AI_API_HOOK] AI synthesizes full outcome analysis
 */
function buildOutcomeReportPayload(outcomeReport) {
  return {
    systemPrompt: `You are a geopolitical analyst. Given a simulation outcome report, provide: 1) A 150-word strategic synthesis, 2) The dominant game theory dynamic of the overall path, 3) A Big Cycle phase placement with historical parallel, 4) The most significant STEEP dimension activated, 5) One historical analogy to a real-world situation. Return as JSON: { strategicSynthesis, gameTheoryDynamic, bigCyclePlacement, dominantSteepDimension, historicalAnalogy }`,
    outcomeData: {
      scenarioTitle: outcomeReport.scenarioTitle,
      pathSummary: outcomeReport.pathSummary,
      outcome: outcomeReport.outcome,
      lensScores: outcomeReport.lensScores,
      steepImpact: outcomeReport.steepImpact,
      trajectory: outcomeReport.trajectory,
      geoEconTools: outcomeReport.geoEconTools
    },
    outputFormat: "JSON_ONLY"
  };
}

// ============================================================
// ADAPTIVE NODE WEIGHTING (AI MODE)
// ============================================================

/**
 * Calculate adaptive probability weights for choices based on path
 * In AI mode, these weights are updated by API call
 * In static mode, default equal weighting is used
 */
function calculateChoiceWeights(choices, decisionVector, lensScores) {
  if (choices.length === 0) return [];

  // Default: equal weights
  const baseWeight = 1.0 / choices.length;

  return choices.map(choice => {
    let weight = baseWeight;

    // Bias toward cooperative choices if cooperative path established
    if (lensScores.gameTheory.cooperateCount > lensScores.gameTheory.defectCount) {
      const cooperativeKeywords = ["cooperation", "coalition", "multilateral", "alliance", "coordination"];
      if (cooperativeKeywords.some(kw => choice.label?.toLowerCase().includes(kw))) {
        weight *= 1.3;
      }
    }

    // Bias toward fiscal intervention if STEEP E dimension dominant
    if (lensScores.steep.E > 0.6) {
      const fiscalKeywords = ["stimulus", "bailout", "fiscal", "monetary"];
      if (fiscalKeywords.some(kw => choice.label?.toLowerCase().includes(kw))) {
        weight *= 1.2;
      }
    }

    // Normalize at end
    return { ...choice, probabilityWeight: weight };
  });
}

// ============================================================
// EXPORTS
// ============================================================

export {
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
