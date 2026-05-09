// CLUSTER B — SYSTEMIC RISK (continued)
// CLUSTER C — GEOECONOMIC ORDERS (continued)
// Scenarios: Gray Rhino Polycrises, Fragmented Stagnation, Tech-Driven Realignment, Cislunar Geopolitics

const REMAINING_SCENARIOS = [

  // ============================================================
  // SCENARIO: GRAY RHINO POLYCRISES
  // ============================================================
  {
    id: "gray-rhino",
    title: "The Gray Rhino Polycrisis",
    cluster: "systemic",
    clusterLabel: "Systemic Risk Typologies",
    era: "2025–2035",
    timeHorizon: "medium",
    primaryLens: "steep",
    description: "Multiple foreseeable but ignored risks converge simultaneously — sovereign debt overhangs, climate shocks, demographic collapse, and supply chain fragility — overwhelming the adaptive capacity of institutions designed for single-crisis management.",
    tags: ["polycrisis", "gray rhino", "systemic risk", "climate", "debt", "demographics", "cascading failure"],
    aiPromptContext: "You are simulating a Gray Rhino Polycrisis. Apply STEEP analysis across all five dimensions simultaneously, Big Cycle (late-cycle institutional stress testing), and game theory (multi-party coordination failure; tragedy of the commons across overlapping crisis domains). The distinguishing feature: these were all foreseeable — the question is why they weren't addressed and what happens when they arrive together.",
    rootNodeId: "grp-L0-trigger",
    nodes: {

      "grp-L0-trigger": {
        id: "grp-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Simultaneous Convergence of Four Foreseeable Crises",
        narrative: "2027: Four independently foreseeable risk vectors — long-visible, consistently ignored — arrive simultaneously. A Category 5 hurricane destroys a major port city one month after a sovereign debt crisis erupts in three emerging market nations, which coincides with a food supply shock from the third consecutive year of below-average grain harvests in the Northern Hemisphere. All three events land on a global demographic backdrop where the working-age populations of major economies are contracting at the fastest rate in recorded peacetime history. None of these were Black Swans. Every institutional risk framework had them on page one. They were Gray Rhinos: obvious, enormous, and consistently ignored because addressing them required painful tradeoffs during periods of relative calm.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension-Terminal", note: "Multiple Big Cycle stress indicators breaching simultaneously; institutions cannot triage" },
          steep: { primary: "Cross-domain", secondary: "All", note: "All five STEEP dimensions in simultaneous stress — the defining feature of polycrisis" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Every fiscal tool deployed simultaneously; competition for resources across crisis domains" },
          gameTheory: { type: "Multi-Domain Coordination Failure", note: "Each crisis domain requires coordinated response; coordination capacity itself is the scarce resource" }
        },
        choicePrompt: "Institutions face a triage decision: which crisis domain gets priority when all demand response simultaneously?",
        choices: ["grp-L1-debt-first", "grp-L1-climate-first", "grp-L1-food-first", "grp-L1-comprehensive-response"]
      },

      "grp-L1-debt-first": {
        id: "grp-L1-debt-first",
        layer: 1,
        type: "decision",
        title: "Prioritize Sovereign Debt Crisis — Financial System Triage",
        label: "Financial System First",
        narrative: "Governments and international institutions deploy primary attention and fiscal firepower toward preventing sovereign debt contagion from becoming a global financial crisis. IMF emergency facilities are activated; central banks coordinate swap lines; debt restructuring negotiations begin. But the climate shock and food crisis receive only residual attention — their damage compounds.",
        lensSnapshot: {
          bigCycle: { phase: "Debt Cycle Management", note: "Financial system prioritized; real economy and environment sacrifice accepted" },
          steep: { primary: "E", secondary: "P", note: "Economic stability prioritized; political legitimacy of triage decision contested" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Emergency IMF facilities; coordinated central bank intervention" },
          gameTheory: { type: "Triage Decision", note: "Zero-sum resource allocation across crisis domains; financial system wins" }
        },
        secondOrderEffects: ["Sovereign debt contagion contained; financial system survives", "Climate damage unmitigated; reconstruction costs compound annually", "Food insecurity crisis deepens; political instability in affected regions surges"],
        historicalAnalog: "COVID prioritization over climate 2020–2022; financial crisis absorbing all policy attention 2008–2010",
        choicePrompt: "With debt contagion contained but climate and food crises deepening, how does the financial system fund the cascading real-world damage?",
        choices: ["grp-L2-climate-bonds", "grp-L2-imf-expansion", "grp-L2-bilateral-transfers"]
      },

      "grp-L1-climate-first": {
        id: "grp-L1-climate-first",
        layer: 1,
        type: "decision",
        title: "Prioritize Climate Adaptation — Physical Infrastructure Triage",
        label: "Climate Adaptation First",
        narrative: "Emergency climate adaptation takes priority: sea walls, managed retreat from flood zones, emergency agricultural reorientation, and infrastructure hardening. The debt crisis receives second-tier attention; markets interpret the triage as fiscal irresponsibility. Sovereign bond spreads widen dramatically. But the physical infrastructure response prevents worse damage that would have been far more costly.",
        lensSnapshot: {
          bigCycle: { phase: "Environmental Reset", note: "Physical crisis prioritized over financial; unconventional triage by historical standards" },
          steep: { primary: "En", secondary: "E", note: "Environmental crisis prioritized; economic stability accepts secondary damage" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Climate adaptation spending as core fiscal priority" },
          gameTheory: { type: "Long-Term Optimization", note: "Short-term financial cost accepted to avoid worse long-term physical damage" }
        },
        secondOrderEffects: ["Physical infrastructure adaptation reduces compound losses by 30–40%", "Bond market punishes apparent fiscal irresponsibility; borrowing costs surge", "Nations that didn't prioritize climate adaptation face far worse medium-term outcomes"],
        historicalAnalog: "Netherlands Delta Works post-1953 floods; Japan seawall investment post-2011 tsunami",
        choicePrompt: "With climate adaptation underway but financial markets punishing the approach, how is the sovereign debt pressure managed?",
        choices: ["grp-L2-debt-restructuring", "grp-L2-green-bonds", "grp-L2-central-bank-climate-mandate"]
      },

      "grp-L1-food-first": {
        id: "grp-L1-food-first",
        layer: 1,
        type: "decision",
        title: "Prioritize Food Security — Social Stability Triage",
        label: "Food Security First",
        narrative: "Food insecurity is identified as the most acute political risk — the one most likely to trigger mass civil unrest, state failure, and forced migration that would destabilize the entire international system. Emergency food reserves are mobilized; agricultural emergency financing is deployed; export bans are overridden through international agreements. The financial and climate crises receive deferred attention.",
        lensSnapshot: {
          bigCycle: { phase: "Social Stability Priority", note: "Political legitimacy and social stability prioritized over financial optimization" },
          steep: { primary: "S", secondary: "P", note: "Social stability as primary triage criterion; political imperative" },
          geoEcon: { tool: "Resource Nationalism", note: "Food security as strategic asset; export controls overridden by crisis" },
          gameTheory: { type: "Catastrophic Risk Avoidance", note: "Accepting certain losses to prevent potentially catastrophic social collapse" }
        },
        secondOrderEffects: ["Social unrest contained in food-insecure regions", "Debt crisis allowed to deepen; financial market panic begins", "Agricultural emergency financing accelerates transition to more resilient crops"],
        historicalAnalog: "Soviet grain purchase emergency 1972; Arab Spring food price connection 2010–2011; COVID food supply chain prioritization",
        choicePrompt: "With food security stabilized but financial crisis deepening and climate damage ongoing, what political architecture manages the compound crisis?",
        choices: ["grp-L2-emergency-governance", "grp-L2-international-triage-body", "grp-L2-regional-blocs"]
      },

      "grp-L1-comprehensive-response": {
        id: "grp-L1-comprehensive-response",
        layer: 1,
        type: "decision",
        title: "Attempt Comprehensive Simultaneous Response",
        label: "Comprehensive Response",
        narrative: "Rather than triaging, institutions attempt to respond to all four crisis vectors simultaneously — deploying financial, climate, food, and demographic policy tools in parallel. The ambition is correct but the capacity is insufficient. Every crisis receives 25% of the attention it needs. None is resolved. The combination of partial responses across all domains produces outcomes worse than decisive triage would have.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Overload", note: "Institutional capacity the binding constraint; simultaneous deployment produces collective failure" },
          steep: { primary: "Cross-domain", secondary: "All", note: "Attempting to address all STEEP dimensions simultaneously; capacity insufficient" },
          geoEcon: { tool: "Alliance Architecture", note: "International coordination attempted across all crisis domains" },
          gameTheory: { type: "Coordination Failure at Scale", note: "Too many principals, too many agents, too little coordination capacity" }
        },
        secondOrderEffects: ["All four crises deepen as insufficient attention is paid to each", "Political leaders blamed for indecision rather than constraint", "Crisis cascade accelerates; some domains reach points of no return"],
        historicalAnalog: "EU response to 2010–2012 multi-crisis period; insufficient across all domains simultaneously",
        choicePrompt: "As the comprehensive approach fails and all crises deepen, forced triage eventually becomes unavoidable. What crisis is sacrificed first?",
        choices: ["grp-L2-sacrifice-debt", "grp-L2-sacrifice-climate", "grp-L2-sacrifice-food"]
      },

      // Layer 2 nodes
      "grp-L2-climate-bonds": {
        id: "grp-L2-climate-bonds",
        layer: 2,
        type: "decision",
        title: "Climate-Linked Sovereign Bond Architecture",
        label: "Climate Bonds",
        narrative: "A new financial instrument is designed: sovereign bonds whose coupon is adjusted based on climate adaptation performance metrics. Nations that meet adaptation targets pay lower interest rates; those that miss pay higher. The instrument simultaneously addresses the financial and climate crises, aligning market incentives with physical resilience investment.",
        lensSnapshot: {
          bigCycle: { phase: "Financial Innovation", note: "New financial architecture attempts to align market incentives with climate resilience" },
          steep: { primary: "E", secondary: "En", note: "Financial mechanism for environmental objective" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Novel bond architecture linking financial and climate systems" },
          gameTheory: { type: "Mechanism Design", note: "Incentive-compatible instrument aligns financial and environmental objectives" }
        },
        secondOrderEffects: ["Green bond market expands dramatically", "Nations with poor adaptation performance face rising borrowing costs", "Institutional investors gain standardized climate performance metrics"],
        historicalAnalog: "EBRD green bond framework; ESG bond market development; sustainability-linked bond market",
        choicePrompt: "With climate-linked bonds issued, how does the demographic crisis — the fourth compounding factor — get addressed?",
        choices: ["grp-L3-immigration-policy", "grp-L3-productivity-investment", "grp-L3-demographic-bonds"]
      },

      "grp-L2-debt-restructuring": {
        id: "grp-L2-debt-restructuring",
        layer: 2,
        type: "decision",
        title: "Orderly Sovereign Debt Restructuring Framework",
        label: "Debt Restructuring",
        narrative: "An emergency sovereign debt restructuring framework — the first truly comprehensive one since WWII debt relief — is negotiated among G20 creditors. Private sector creditors accept haircuts; official creditors extend maturities; conditionality is linked to climate adaptation rather than conventional austerity. The framework is contested but functional.",
        lensSnapshot: {
          bigCycle: { phase: "Debt Cycle Reset", note: "Orderly restructuring clears debt overhang; avoids disorderly default" },
          steep: { primary: "E", secondary: "P", note: "Economic restructuring with political negotiation across creditor groups" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Multilateral debt restructuring as international economic governance" },
          gameTheory: { type: "Cooperative Game — Creditor Coordination", note: "Creditor collective action problem overcome through framework negotiation" }
        },
        secondOrderEffects: ["Debt-distressed nations regain fiscal space for climate and food investment", "Private creditors take losses but avoid worse disorderly default scenario", "Framework becomes template for future sovereign debt crises"],
        historicalAnalog: "HIPC Initiative; Brady Bonds; Paris Club; Common Framework (inadequate predecessor)",
        choicePrompt: "With debt restructured and fiscal space restored, how are the climate and food recovery programs funded?",
        choices: ["grp-L3-green-recovery-fund", "grp-L3-multilateral-development-expansion", "grp-L3-private-finance-mobilization"]
      },

      "grp-L2-emergency-governance": {
        id: "grp-L2-emergency-governance",
        layer: 2,
        type: "decision",
        title: "Emergency Governance Architecture",
        label: "Emergency Governance",
        narrative: "Existing international institutions — IMF, WB, WFP, UNEP — are granted emergency consolidated authority and resources through a new meta-governance structure. The coordination body can override individual nation vetoes in crisis domains where collective action has failed. The arrangement is constitutionally unprecedented and politically contested but operationally effective.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Innovation", note: "Crisis forces governance innovation beyond existing multilateral architecture" },
          steep: { primary: "P", secondary: "E", note: "Political architecture innovation under crisis pressure" },
          geoEcon: { tool: "Alliance Architecture", note: "Emergency multilateral authority as crisis management tool" },
          gameTheory: { type: "Super-game Solution", note: "Creating a new game structure that can coordinate across existing game failures" }
        },
        secondOrderEffects: ["Crisis response coordination improves dramatically", "Sovereignty concerns create political resistance even in cooperating nations", "Precedent for crisis governance challenges existing UN architecture"],
        historicalAnalog: "Troika in Eurozone crisis; IMF-World Bank coordination; wartime combined boards",
        choicePrompt: "With emergency governance providing coordination, what long-term institutional reform does the polycrisis catalyze?",
        choices: ["grp-L3-un-reform", "grp-L3-minilateral-bodies", "grp-L3-crisis-prevention-architecture"]
      },

      "grp-L2-sacrifice-climate": {
        id: "grp-L2-sacrifice-climate",
        layer: 2,
        type: "decision",
        title: "Climate Crisis Sacrificed — Deferred Indefinitely",
        label: "Sacrifice Climate",
        narrative: "In the comprehensive response failure, climate adaptation is the domain sacrificed: emissions reduction and adaptation investment are deferred while financial stability and food security absorb available resources. The logic is compelling in the short term. The consequences are structural and irreversible: a decade of additional warming is locked in.",
        lensSnapshot: {
          bigCycle: { phase: "Environmental Debt Accumulation", note: "Climate damage deferred becomes permanent; long-cycle environmental degradation locked in" },
          steep: { primary: "En", secondary: "E", note: "Environmental sacrifice for short-term economic and social stability" },
          geoEcon: { tool: "Resource Nationalism", note: "Short-term resource competition over long-term environmental commons" },
          gameTheory: { type: "Tragedy of the Commons", note: "Short-term national rationality produces long-term global environmental catastrophe" }
        },
        secondOrderEffects: ["Paris Agreement effectively abandoned in practice", "Climate adaptation costs in the 2030s are 3–5x higher due to deferral", "Insurance markets withdraw from climate-exposed assets globally"],
        historicalAnalog: "Kyoto Protocol non-compliance; COVID climate regression; historical pattern of crisis-driven emissions increases",
        choicePrompt: "With climate sacrificed and warming locked in, what survival architecture do nations build for the hotter, more volatile world that follows?",
        choices: ["grp-L3-managed-retreat", "grp-L3-geoengineering", "grp-L3-climate-fortress"]
      },

      // Layer 3 nodes
      "grp-L3-immigration-policy": {
        id: "grp-L3-immigration-policy",
        layer: 3,
        type: "decision",
        title: "Managed Immigration as Demographic Policy",
        label: "Managed Immigration",
        narrative: "Nations with contracting working-age populations implement substantial managed immigration programs, targeting skills gaps, regional demographic needs, and integration pathways. The policy addresses the economic dimension of demographic decline while creating social and political pressures that require active integration architecture.",
        lensSnapshot: {
          bigCycle: { phase: "Demographic Management", note: "Immigration as institutional response to demographic Big Cycle contraction" },
          steep: { primary: "S", secondary: "E", note: "Social integration investment as economic productivity maintenance strategy" },
          geoEcon: { tool: "Alliance Architecture", note: "Managed migration corridors as bilateral foreign policy tool" },
          gameTheory: { type: "Cooperative Migration Game", note: "Sending and receiving nations negotiate migration terms; mutual benefit possible" }
        },
        secondOrderEffects: ["Labor force supplemented; demographic decline partially offset", "Social cohesion requires significant integration investment", "Sending nations face brain drain; bilateral tensions around talent competition"],
        historicalAnalog: "German guest worker programs; Canadian points-based immigration; post-war European labor migration",
        choicePrompt: "With immigration supplementing demographics and climate bonds funding adaptation, how does the polycrisis resolution architecture prove its durability?",
        choices: ["grp-L4-resilient-multilateralism", "grp-L4-regional-blocs-stable"]
      },

      "grp-L3-managed-retreat": {
        id: "grp-L3-managed-retreat",
        layer: 3,
        type: "decision",
        title: "Managed Retreat from Climate-Exposed Zones",
        label: "Managed Retreat",
        narrative: "With climate damage locked in from deferral, the strategic response is managed retreat: systematic relocation of populations and infrastructure from the most exposed coastal and low-lying zones. The process is enormously costly in financial and human terms but prevents the catastrophic loss of life that unmanaged exposure would produce.",
        lensSnapshot: {
          bigCycle: { phase: "Territorial Reorganization", note: "Physical settlement patterns restructured by irreversible environmental change" },
          steep: { primary: "En", secondary: "S", note: "Environmental forcing reorganizes social geography" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Public investment in managed population relocation" },
          gameTheory: { type: "Forced Adaptation Game", note: "Managed cost accepted to avoid catastrophic unmanaged cost" }
        },
        secondOrderEffects: ["3–5% of global population requires relocation over 20 years", "Real estate markets in exposed zones collapse entirely", "New inland cities must be built; massive construction investment opportunity"],
        historicalAnalog: "Isle de Jean Charles managed retreat; Netherlands managed coastal retreat; Pacific island relocation planning",
        choicePrompt: "With managed retreat underway and populations relocating at scale, what governance architecture manages climate migration?",
        choices: ["grp-L4-climate-migration-treaty", "grp-L4-national-adaptation-plans"]
      },

      "grp-L3-green-recovery-fund": {
        id: "grp-L3-green-recovery-fund",
        layer: 3,
        type: "decision",
        title: "Global Green Recovery Fund",
        label: "Green Recovery Fund",
        narrative: "Post-debt restructuring, a global green recovery fund is capitalized by developed nations (grant basis) and multilateral development banks (concessional loan basis). The fund finances climate adaptation, food system transformation, and demographic transition support simultaneously. It is the largest single international financial commitment since the Marshall Plan.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Investment", note: "Massive multilateral investment as polycrisis recovery architecture" },
          steep: { primary: "E", secondary: "En", note: "Financial architecture addresses environmental, economic, and social recovery simultaneously" },
          geoEcon: { tool: "Alliance Architecture", note: "Multilateral development finance as polycrisis recovery mechanism" },
          gameTheory: { type: "Public Goods Provision", note: "Collective investment in global public goods: stability, climate, food" }
        },
        secondOrderEffects: ["Multilateral development bank capacity expands dramatically", "Grant funding reduces debt burden in most fragile states", "Fund governance disputes emerge between contributor and recipient nations"],
        historicalAnalog: "Marshall Plan; COVAX failure and lessons; Global Fund for AIDS, TB, Malaria as partial model",
        choicePrompt: "With the green recovery fund operational, what institutional innovation prevents the next polycrisis?",
        choices: ["grp-L4-resilient-multilateralism", "grp-L4-crisis-early-warning"]
      },

      // Layer 4 terminal nodes
      "grp-L4-resilient-multilateralism": {
        id: "grp-L4-resilient-multilateralism",
        layer: 4,
        type: "terminal",
        title: "Resilient Multilateral Architecture",
        label: "Resilient Multilateralism",
        narrative: "The polycrisis, despite its severity, catalyzes the most significant reform of international institutions since 1945. The UN Security Council is reformed; IMF quotas are rebalanced; a new climate-finance architecture is established; a global food security reserve system is created. The new architecture is explicitly designed for compound crises.",
        outcome: "INSTITUTIONAL REFORM THROUGH CRISIS",
        outcomeNarrative: "History's lesson: the most durable institutions are built in the aftermath of catastrophic failures. The Gray Rhino Polycrisis, precisely because it was preventable, generates the political will to build institutions strong enough to address the next foreseeable risks before they converge. The reform is incomplete and contested — but it represents the most significant advance in international governance since Bretton Woods.",
        finalLensScores: {
          bigCycle: "Reset → New Institutional Cycle",
          steep: { S: 0.7, T: 0.5, E: 0.8, En: 0.7, P: 0.9 },
          geoEcon: "Alliance Architecture — redesigned multilateral system",
          gameTheory: "Cooperative Game — crisis generates political will for institutional innovation"
        },
        historicalAnalog: "Post-WWII Bretton Woods; post-1930s Depression financial architecture; League of Nations failure → UN",
        aiPromptSeed: "The simulation has reached a resilient multilateralism outcome. Model how the reformed institutional architecture performs when tested by the next compound risk event — AI governance failures, quantum technology disruption, and the arrival of AGI-level capabilities in the 2030s."
      },

      "grp-L4-climate-migration-treaty": {
        id: "grp-L4-climate-migration-treaty",
        layer: 4,
        type: "terminal",
        title: "Climate Migration Treaty",
        label: "Climate Migration Treaty",
        narrative: "The scale of climate-forced displacement necessitates a new international legal framework: the Climate Migration Treaty, establishing legal status for climate refugees, burden-sharing mechanisms among host nations, and financial compensation from high-emitting nations to receiving nations.",
        outcome: "NEW INTERNATIONAL MIGRATION LAW ARCHITECTURE",
        outcomeNarrative: "The Climate Migration Treaty fills a catastrophic gap in international law. It provides legal status and protection for populations displaced by climate change — a category that existing refugee law does not cover. The treaty is contested, imperfect, and unevenly ratified, but it establishes a framework that reduces the worst outcomes for the most exposed populations.",
        finalLensScores: {
          bigCycle: "Late Cycle → New Legal Architecture",
          steep: { S: 0.9, T: 0.3, E: 0.6, En: 1.0, P: 0.8 },
          geoEcon: "Alliance Architecture — burden-sharing treaty",
          gameTheory: "Cooperative Game — collective obligation accepted for climate displacement"
        },
        historicalAnalog: "1951 Refugee Convention; 1967 Protocol; Nansen Passport for stateless persons; Pacific climate migration agreements",
        aiPromptSeed: "Model how the Climate Migration Treaty performs as climate impacts intensify through 2040, particularly as island nations become uninhabitable and major river deltas face permanent flooding."
      },

      "grp-L4-crisis-early-warning": {
        id: "grp-L4-crisis-early-warning",
        layer: 4,
        type: "terminal",
        title: "Global Polycrisis Early Warning System",
        label: "Early Warning System",
        narrative: "The defining lesson of the polycrisis: all four risk vectors were visible years in advance. The institutional response is a global early warning system that tracks compound risk indicators across all five STEEP dimensions, with mandatory reporting and automatic escalation to international response bodies when convergence risk exceeds thresholds.",
        outcome: "PREVENTIVE GOVERNANCE ARCHITECTURE",
        outcomeNarrative: "The early warning system represents a fundamental shift in international governance: from crisis response to crisis prevention. By tracking compound risk convergence and triggering coordinated response before crises materialize, the system addresses the core failure mode of the Gray Rhino Polycrisis. The architecture works — the next compound risk is identified and partially addressed before it cascades.",
        finalLensScores: {
          bigCycle: "Institutional Prevention Architecture",
          steep: { S: 0.5, T: 0.8, E: 0.6, En: 0.7, P: 0.8 },
          geoEcon: "Alliance Architecture — preventive multilateral monitoring",
          gameTheory: "Commitment Device — pre-commitment to response before crisis pressure distorts decisions"
        },
        historicalAnalog: "FEMA post-Katrina redesign; WHO IHR post-SARS; nuclear early warning systems; pandemic preparedness failures post-COVID",
        aiPromptSeed: "Model how a global polycrisis early warning system interacts with the political economy of prevention — specifically the challenge of mobilizing resources for risks that have not yet materialized."
      }
    }
  },

  // ============================================================
  // SCENARIO: THE AGE OF FRAGMENTED STAGNATION
  // ============================================================
  {
    id: "fragmented-stagnation",
    title: "The Age of Fragmented Stagnation",
    cluster: "geoeconomic",
    clusterLabel: "Geoeconomic Orders",
    era: "2025–2040",
    timeHorizon: "long",
    primaryLens: "geoEcon",
    description: "The global economy fragments into competing regional blocs without any dominant order, producing persistent low growth, high transaction costs, and the slow erosion of the multilateral institutions that underpinned the post-1945 prosperity architecture.",
    tags: ["fragmentation", "deglobalization", "stagnation", "regional blocs", "multilateralism", "trade"],
    aiPromptContext: "You are simulating the Age of Fragmented Stagnation. Apply Big Cycle lens (neither US nor China achieves clear hegemony; interregnum produces instability), GeoEconomics (trade fragmentation; competing standards; parallel financial systems), and game theory (multi-player competition without dominant actor; no Schelling point for coordination; tragedy of fragmentation).",
    rootNodeId: "frst-L0-trigger",
    nodes: {

      "frst-L0-trigger": {
        id: "frst-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Neither Bloc Dominates — Hegemonic Interregnum",
        narrative: "The US-China competition has not produced a winner. Neither bloc commands sufficient economic or military dominance to organize global systems around its preferences. The rules-based international order of the post-1945 era has been hollowed out — not replaced, just undermined. What remains is a patchwork: competing trade architectures, parallel payment systems, overlapping and inconsistent standards regimes, and a UN Security Council that cannot act on any significant issue. Global trade costs rise 15–25% from fragmentation. Long-run growth rates decline. The world is not at war, but it is not working.",
        lensSnapshot: {
          bigCycle: { phase: "Hegemonic Interregnum", note: "Neither incumbent nor challenger achieves dominance; transition costs accumulate" },
          steep: { primary: "P", secondary: "E", note: "Political fragmentation drives economic stagnation" },
          geoEcon: { tool: "Tariffs", note: "Trade fragmentation as default outcome of hegemonic stalemate" },
          gameTheory: { type: "Multi-Polar Prisoner's Dilemma", note: "No dominant actor; no Schelling point; coordination fails" }
        },
        choicePrompt: "In a fragmented world without dominant order, what strategic architecture does a mid-sized nation adopt?",
        choices: ["frst-L1-hedging-strategy", "frst-L1-bloc-alignment", "frst-L1-regional-leadership"]
      },

      "frst-L1-hedging-strategy": {
        id: "frst-L1-hedging-strategy",
        layer: 1,
        type: "decision",
        title: "Strategic Hedging — Refuse Bloc Alignment",
        label: "Strategic Hedging",
        narrative: "The nation explicitly refuses to align with either major bloc, maintaining economic relationships with both while developing independent institutional ties with other hedging states. India, Saudi Arabia, Brazil, Indonesia, Turkey, and South Africa operate as a loose coalition of swing states — too important to coerce, too uncommitted to trust. They extract maximum benefit from both blocs' competition for their alignment.",
        lensSnapshot: {
          bigCycle: { phase: "Multi-Polar Maneuvering", note: "Mid-sized powers gain leverage in hegemonic interregnum" },
          steep: { primary: "P", secondary: "E", note: "Political autonomy maintained; economic relationships diversified" },
          geoEcon: { tool: "Alliance Architecture", note: "Deliberate non-alignment as strategic choice" },
          gameTheory: { type: "Outside Option Maintenance", note: "Preserving outside options creates negotiating leverage with both blocs" }
        },
        secondOrderEffects: ["Both blocs compete to offer better terms to swing states", "Hedging nations gain economic leverage but face geopolitical uncertainty", "Coordination among hedging nations creates third force in global governance"],
        historicalAnalog: "Non-Aligned Movement 1955–1991; India's multi-alignment 2020s; Gulf states balancing US-China",
        choicePrompt: "With hedging strategy established, how does the nation build productive economic architecture with other hedging states?",
        choices: ["frst-L2-south-south-trade", "frst-L2-new-multilateralism", "frst-L2-bilateral-networks"]
      },

      "frst-L1-bloc-alignment": {
        id: "frst-L1-bloc-alignment",
        layer: 1,
        type: "decision",
        title: "Align with Dominant Bloc — Accept Constraints",
        label: "Bloc Alignment",
        narrative: "The nation calculates that the fragmented world is too costly for pure hedging and commits fully to one bloc's economic architecture: accepts the bloc's technology standards, financial systems, and trade arrangements. In exchange, it receives preferential market access, security guarantees, and investment flows. The alignment is economically beneficial but reduces strategic autonomy and creates dependency.",
        lensSnapshot: {
          bigCycle: { phase: "Bloc Consolidation", note: "Smaller nations consolidate within blocs as fragmentation costs become prohibitive" },
          steep: { primary: "E", secondary: "P", note: "Economic efficiency gained through alignment; political autonomy reduced" },
          geoEcon: { tool: "Alliance Architecture", note: "Full integration into one bloc's economic architecture" },
          gameTheory: { type: "Commitment Game", note: "Credible commitment to one bloc increases trust and benefits within that system" }
        },
        secondOrderEffects: ["Inside-bloc trade and investment flows increase substantially", "Relationships with the opposing bloc deteriorate; some economic relationships severed", "Nation becomes geopolitical asset of the chosen bloc; security commitments follow"],
        historicalAnalog: "Eastern European NATO/EU integration; Southeast Asian states choosing RCEP over CPTPP",
        choicePrompt: "With full bloc alignment made, how does the nation maximize its position within the bloc's internal hierarchy?",
        choices: ["frst-L2-specialization-within-bloc", "frst-L2-institutional-influence", "frst-L2-technology-partnership"]
      },

      "frst-L1-regional-leadership": {
        id: "frst-L1-regional-leadership",
        layer: 1,
        type: "decision",
        title: "Build Regional Order — Lead Without Global Alignment",
        label: "Regional Leadership",
        narrative: "The nation decides that neither global alignment nor pure hedging is optimal. Instead, it invests in becoming the organizing power of its region: building a regional trade architecture, regional development bank, regional security framework, and regional standards regime. The regional order provides stability and economic benefits without requiring global bloc alignment.",
        lensSnapshot: {
          bigCycle: { phase: "Regional Order Building", note: "Global fragmentation creates space for regional hegemons to emerge" },
          steep: { primary: "P", secondary: "E", note: "Political leadership invested in regional institution building" },
          geoEcon: { tool: "Alliance Architecture", note: "Regional trade and security architecture as alternative to global alignment" },
          gameTheory: { type: "Regional Hegemon Game", note: "Within-region coordination; outside-region hedging" }
        },
        secondOrderEffects: ["Regional neighbors must choose to accept or resist regional leadership", "Both global blocs compete to affiliate with the successful regional order", "Regional order becomes template for other regions attempting similar architecture"],
        historicalAnalog: "ASEAN building; African Union development; MERCOSUR; India's regional ambitions",
        choicePrompt: "With regional leadership established, how does the regional order manage its relationship with the competing global blocs?",
        choices: ["frst-L2-balanced-engagement", "frst-L2-preferential-partnership", "frst-L2-collective-bargaining"]
      },

      // Layer 2 nodes
      "frst-L2-south-south-trade": {
        id: "frst-L2-south-south-trade",
        layer: 2,
        type: "decision",
        title: "South-South Trade Architecture",
        label: "South-South Trade",
        narrative: "Hedging nations build direct trade relationships among themselves, reducing dependence on North Atlantic and Chinese-led trade systems. New trade corridors emerge: India-Africa, Gulf-Southeast Asia, Latin America-South Asia. The volume is initially small relative to legacy North-South trade but grows rapidly as fragmentation costs make alternative routing valuable.",
        lensSnapshot: {
          bigCycle: { phase: "Trade Architecture Diversification", note: "Emerging market trade reorientation away from legacy North-South patterns" },
          steep: { primary: "E", secondary: "T", note: "New trade corridors require infrastructure and logistics investment" },
          geoEcon: { tool: "Alliance Architecture", note: "Trade diversification as geopolitical autonomy strategy" },
          gameTheory: { type: "Coalition Building", note: "Swing states build coalition to reduce dependence on major blocs" }
        },
        secondOrderEffects: ["New trade corridors require massive logistics investment", "Both major blocs attempt to co-opt the south-south architecture", "Dollar dependence in south-south trade creates opening for alternative currencies"],
        historicalAnalog: "BRICS trade expansion; Belt and Road as one pole; India-Middle East-Europe corridor; INSTC",
        choicePrompt: "With south-south trade growing, what financial architecture supports it outside the dollar system?",
        choices: ["frst-L3-alternative-currency-basket", "frst-L3-digital-trade-finance", "frst-L3-bilateral-swap-lines"]
      },

      "frst-L2-specialization-within-bloc": {
        id: "frst-L2-specialization-within-bloc",
        layer: 2,
        type: "decision",
        title: "Specialize in Strategic Bloc Function",
        label: "Strategic Specialization",
        narrative: "Within the chosen bloc, the nation targets a specific strategic function that maximizes its importance: semiconductor assembly, rare earth processing, logistics hub, data center location, financial services gateway. The specialization creates deep interdependence with the bloc's leading members and generates significant investment inflows.",
        lensSnapshot: {
          bigCycle: { phase: "Within-Bloc Integration", note: "Deep specialization creates mutual dependence; reduces autonomy but increases prosperity" },
          steep: { primary: "E", secondary: "T", note: "Technology and economic specialization as development strategy" },
          geoEcon: { tool: "Alliance Architecture", note: "Strategic function within bloc architecture" },
          gameTheory: { type: "Division of Labor Game", note: "Specialization creates interdependence that aligns incentives within bloc" }
        },
        secondOrderEffects: ["Investment inflows surge as bloc establishes critical function within nation", "Vulnerability to bloc policy shifts increases with specialization depth", "Alternative relationships with opposing bloc become effectively impossible"],
        historicalAnalog: "Taiwan semiconductor role in US-led tech architecture; Netherlands logistics hub in EU; Singapore financial gateway",
        choicePrompt: "With deep specialization established, how does the nation manage the vulnerability that comes with it?",
        choices: ["frst-L3-redundancy-investment", "frst-L3-political-insurance", "frst-L3-technology-ownership"]
      },

      "frst-L2-collective-bargaining": {
        id: "frst-L2-collective-bargaining",
        layer: 2,
        type: "decision",
        title: "Regional Collective Bargaining with Global Blocs",
        label: "Collective Bargaining",
        narrative: "The regional order negotiates collectively with both major blocs, presenting a unified position on trade terms, technology access, and security arrangements. The collective bargaining power of the regional bloc is substantially higher than any individual member could achieve. Both major blocs must accommodate regional preferences rather than coerce individual members.",
        lensSnapshot: {
          bigCycle: { phase: "Regional Power Emergence", note: "Regional coalitions as structural constraint on major power unilateralism" },
          steep: { primary: "P", secondary: "E", note: "Collective political position translates to economic terms improvement" },
          geoEcon: { tool: "Alliance Architecture", note: "Regional coalition as bargaining unit with global blocs" },
          gameTheory: { type: "Coalition Bargaining Game", note: "Collective bargaining changes payoff structure; major blocs must negotiate" }
        },
        secondOrderEffects: ["Both major blocs offer better terms to avoid regional bloc aligning with rival", "Regional solidarity tested when blocs offer better terms to individual defectors", "Regional order gains international recognition as legitimate governance actor"],
        historicalAnalog: "EU as collective bargaining unit in WTO; ASEAN centrality in Indo-Pacific architecture; African Union in G20",
        choicePrompt: "With collective bargaining leverage established, what economic architecture does the regional bloc build internally?",
        choices: ["frst-L3-regional-currency", "frst-L3-regional-development-bank", "frst-L3-regional-supply-chain"]
      },

      // Layer 3 nodes
      "frst-L3-alternative-currency-basket": {
        id: "frst-L3-alternative-currency-basket",
        layer: 3,
        type: "decision",
        title: "Alternative Currency Basket for South-South Trade",
        label: "Alternative Currency Basket",
        narrative: "A basket of swing-state currencies is established for south-south trade invoicing, reducing dependence on the dollar without committing to any single alternative. The basket is weighted by trade volumes and stabilized by coordinated central bank reserves. It processes a growing share of south-south trade outside the dollar system.",
        lensSnapshot: {
          bigCycle: { phase: "Monetary System Pluralization", note: "Gradual monetary diversification away from unipolar dollar system" },
          steep: { primary: "E", secondary: "P", note: "Monetary architecture as expression of political autonomy" },
          geoEcon: { tool: "Currency Manipulation", note: "Alternative invoicing currency as dollar dependency reduction strategy" },
          gameTheory: { type: "Coordination Game", note: "Swing states coordinate on monetary alternative; network effects build over time" }
        },
        secondOrderEffects: ["Dollar's share of global trade invoicing declines gradually", "US monetary policy loses some transmission to swing-state economies", "New financial infrastructure required; China and India compete for technical influence"],
        historicalAnalog: "ECU precursor to Euro; BRICS currency discussions; petro-yuan development; Chiang Mai Initiative",
        choicePrompt: "With an alternative currency basket operational, how does the swing-state coalition build broader international legitimacy?",
        choices: ["frst-L4-reformed-multilateralism", "frst-L4-parallel-institutions"]
      },

      "frst-L3-regional-currency": {
        id: "frst-L3-regional-currency",
        layer: 3,
        type: "decision",
        title: "Regional Currency Architecture",
        label: "Regional Currency",
        narrative: "The regional bloc advances from collective bargaining to monetary integration: a regional currency unit for intra-regional trade, supported by a regional central bank with coordinated monetary policy. The architecture reduces transaction costs within the region dramatically while creating a unified monetary voice externally.",
        lensSnapshot: {
          bigCycle: { phase: "Regional Monetary Integration", note: "Monetary architecture deepens regional economic integration" },
          steep: { primary: "E", secondary: "P", note: "Economic integration requires political commitment; sovereignty pooled" },
          geoEcon: { tool: "Currency Manipulation", note: "Regional currency as collective monetary autonomy" },
          gameTheory: { type: "Monetary Union Game", note: "Members benefit collectively; loses individual monetary policy" }
        },
        secondOrderEffects: ["Intra-regional trade costs fall dramatically", "Members lose independent monetary policy; economic shocks require fiscal transfer mechanism", "External credibility of regional bloc increases substantially"],
        historicalAnalog: "Eurozone formation; CFA Franc zone; ASEAN+ currency coordination discussions; Gulf Cooperation Council currency",
        choicePrompt: "With regional monetary integration deepening, what political architecture governs the economic union?",
        choices: ["frst-L4-federal-governance", "frst-L4-intergovernmental-governance"]
      },

      "frst-L3-technology-ownership": {
        id: "frst-L3-technology-ownership",
        layer: 3,
        type: "decision",
        title: "Domestic Technology Ownership Requirements",
        label: "Technology Ownership",
        narrative: "To reduce vulnerability from deep specialization, the nation requires partial domestic ownership of critical technology infrastructure deployed within its territory. Foreign firms must establish joint ventures, transfer technology, and accept local equity requirements. The approach reduces dependence while maintaining investment attractiveness.",
        lensSnapshot: {
          bigCycle: { phase: "Technology Sovereignty Building", note: "Domestic technology ownership as vulnerability reduction strategy" },
          steep: { primary: "T", secondary: "E", note: "Technology ownership requirements change investment flows" },
          geoEcon: { tool: "Export Controls", note: "Technology transfer requirements as condition of market access" },
          gameTheory: { type: "Bargaining Game", note: "Market access exchanged for technology transfer; both parties gain" }
        },
        secondOrderEffects: ["Domestic technology capacity builds over time", "Some foreign investment deterred by ownership requirements", "Nation gradually shifts from bloc asset to genuine technology peer"],
        historicalAnalog: "China joint venture requirements 1990–2015; India FDI equity requirements; Brazil technology localization",
        choicePrompt: "With technology ownership building domestic capacity, how does the nation leverage that capacity on the global stage?",
        choices: ["frst-L4-technology-exporter", "frst-L4-regional-technology-leader"]
      },

      // Layer 4 terminal nodes
      "frst-L4-reformed-multilateralism": {
        id: "frst-L4-reformed-multilateralism",
        layer: 4,
        type: "terminal",
        title: "Reformed Multilateralism from Below",
        label: "Reformed Multilateralism",
        narrative: "The swing-state coalition, having built sufficient economic weight and institutional infrastructure, forces reform of existing multilateral institutions from below rather than creating parallel ones. IMF quotas are reformed; WTO dispute mechanism is revived; the G20 gains real decision-making authority. The reform is driven not by the major powers but by the organized pressure of the third force.",
        outcome: "MULTILATERAL REFORM THROUGH THIRD-FORCE PRESSURE",
        outcomeNarrative: "The fragmented world produces an unexpected outcome: the third force of swing states, united by shared interest in functional multilateral institutions, achieves more reform than the major powers ever sought. The reformed institutions are more representative and more functional than their predecessors. The Age of Fragmented Stagnation ends not with a dominant power but with a genuinely multipolar governance architecture.",
        finalLensScores: {
          bigCycle: "Interregnum → Multipolar New Cycle",
          steep: { S: 0.6, T: 0.5, E: 0.7, En: 0.4, P: 0.9 },
          geoEcon: "Alliance Architecture — reformed multilateral institutions",
          gameTheory: "Coalition Game — third force changes the structural game"
        },
        historicalAnalog: "G77 role in UN reform; Non-Aligned Movement's institutional legacy; BRICS institutional development",
        aiPromptSeed: "Model how a genuinely multipolar governance architecture functions as advanced AI, climate change, and demographic shifts simultaneously stress the new institutions."
      },

      "frst-L4-parallel-institutions": {
        id: "frst-L4-parallel-institutions",
        layer: 4,
        type: "terminal",
        title: "Parallel Institutional Architecture",
        label: "Parallel Institutions",
        narrative: "Rather than reforming existing institutions, the swing-state coalition builds parallel ones: a new development bank, an alternative payment system, a separate trade dispute mechanism, and a competing scientific research network. The parallel architecture is less efficient than a reformed unified system but is more responsive to the coalition's interests.",
        outcome: "INSTITUTIONAL PLURALISM — REDUCED EFFICIENCY",
        outcomeNarrative: "The world operates with competing institutional architectures for the major functions of global governance. The duplication is costly — transaction costs remain high, regulatory harmonization is difficult — but the system is more resilient to any single power's leverage. The Age of Fragmented Stagnation gives way to an Age of Institutional Pluralism: less efficient than unipolarity, less dangerous than its alternatives.",
        finalLensScores: {
          bigCycle: "Interregnum → Pluralist Steady State",
          steep: { S: 0.5, T: 0.6, E: 0.6, En: 0.3, P: 0.8 },
          geoEcon: "Alliance Architecture — parallel institutional systems",
          gameTheory: "Multi-Equilibrium Game — multiple stable configurations coexist"
        },
        historicalAnalog: "AIIB parallel to World Bank; CIPS parallel to SWIFT; SCO parallel to NATO; NDB parallel to IMF",
        aiPromptSeed: "Model how parallel institutional architectures function when they face a shared global crisis requiring coordination — a pandemic, a financial crisis, or a climate emergency — where neither architecture alone has sufficient reach."
      },

      "frst-L4-technology-exporter": {
        id: "frst-L4-technology-exporter",
        layer: 4,
        type: "terminal",
        title: "Emergence as Technology Exporter",
        label: "Technology Exporter",
        narrative: "The domestic technology capacity built through ownership requirements and specialization matures into genuine innovation capacity. The nation begins exporting technology rather than importing it — establishing its own standards, attracting foreign talent, and competing with established technology powers. The transition from technology consumer to technology producer fundamentally changes the nation's position in the global order.",
        outcome: "TECHNOLOGY POWER EMERGENCE",
        outcomeNarrative: "The fragmented world creates space for new technology powers to emerge outside the two major blocs. Nations that invested in domestic technology capacity during the interregnum emerge as genuine technology exporters with global reach. The bipolar technology competition becomes tripolar — or more — as new innovation centers establish themselves.",
        finalLensScores: {
          bigCycle: "Interregnum → New Power Emergence",
          steep: { S: 0.4, T: 1.0, E: 0.8, En: 0.3, P: 0.7 },
          geoEcon: "Technological Statecraft — new technology power",
          gameTheory: "New Player Enters Game — changes equilibrium for all existing players"
        },
        historicalAnalog: "South Korean technology emergence; Taiwan TSMC development; Israel tech sector; India IT services trajectory",
        aiPromptSeed: "Model how the emergence of new technology powers from the swing-state coalition changes the US-China technology competition, particularly in domains like AI, biotech, and quantum computing."
      }
    }
  },

  // ============================================================
  // SCENARIO: THE TECH-DRIVEN REALIGNMENT
  // ============================================================
  {
    id: "tech-realignment",
    title: "The Tech-Driven Realignment",
    cluster: "geoeconomic",
    clusterLabel: "Geoeconomic Orders",
    era: "2025–2040",
    timeHorizon: "long",
    primaryLens: "steep",
    description: "Breakthrough technological capabilities — AI, quantum computing, advanced biotech, and nuclear fusion — create new geopolitical winners and losers, reorganizing the global order around technological capacity rather than traditional resource endowments.",
    tags: ["technology", "AI", "quantum", "biotech", "fusion", "geopolitical realignment", "technological statecraft"],
    aiPromptContext: "You are simulating the Tech-Driven Realignment. Apply STEEP lens (T overwhelmingly dominant; all other dimensions downstream of technology), Big Cycle (technological phase transition driving new hegemonic cycle), and game theory (technology race dynamics; first-mover advantages; standards wars; technology arms control).",
    rootNodeId: "tdr-L0-trigger",
    nodes: {

      "tdr-L0-trigger": {
        id: "tdr-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Simultaneous Breakthroughs Across Four Technology Frontiers",
        narrative: "Within a 36-month window, four technology frontiers breach commercial viability thresholds simultaneously: AI systems achieve reliable autonomous operation in complex real-world environments; fault-tolerant quantum computers solve drug discovery problems previously intractable; advanced biotech enables programmable biology at scale; and a fusion reactor achieves net energy gain at commercial scale. The four breakthroughs interact: AI accelerates quantum algorithm development; quantum computers accelerate biotech discovery; fusion provides the energy for massive AI compute clusters. The nations and firms at the frontier of these technologies gain capabilities that create structural advantages not seen since the Industrial Revolution.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Phase Transition", note: "Multiple general-purpose technologies arriving simultaneously; largest productive discontinuity since steam" },
          steep: { primary: "T", secondary: "E", note: "Technology the overwhelming primary driver; all other STEEP dimensions responding to T" },
          geoEcon: { tool: "Technological Statecraft", note: "Technology capability as primary geopolitical currency" },
          gameTheory: { type: "Technology Race — Multi-Frontier", note: "Competition across four simultaneous frontiers; first-mover advantages in each" }
        },
        choicePrompt: "Which technology frontier does the leading nation prioritize for strategic advantage?",
        choices: ["tdr-L1-ai-supremacy", "tdr-L1-quantum-leadership", "tdr-L1-biotech-dominance", "tdr-L1-fusion-energy"]
      },

      "tdr-L1-ai-supremacy": {
        id: "tdr-L1-ai-supremacy",
        layer: 1,
        type: "decision",
        title: "AI Supremacy Strategy — Compute + Talent + Data",
        label: "AI Supremacy",
        narrative: "The nation concentrates investment in AI: massive compute infrastructure, aggressive talent recruitment globally, regulatory frameworks optimized for AI deployment speed, and AI-first redesign of government services and military capabilities. The AI lead compounds: superior AI accelerates research in other domains, creating a self-reinforcing cycle of capability advantage.",
        lensSnapshot: {
          bigCycle: { phase: "AI-Led Hegemonic Bid", note: "AI as the decisive technology of the new hegemonic cycle" },
          steep: { primary: "T", secondary: "E", note: "AI investment dominates capital allocation; economic transformation accelerates" },
          geoEcon: { tool: "Technological Statecraft", note: "AI capability as comprehensive national power multiplier" },
          gameTheory: { type: "Winner-Take-Most Race", note: "AI lead compounds; falling behind creates accelerating disadvantage" }
        },
        secondOrderEffects: ["AI advantage extends to military, economic, scientific, and diplomatic domains", "Nations without AI capacity become structurally dependent on AI leaders", "AI governance becomes the critical geopolitical negotiation of the era"],
        historicalAnalog: "No direct precedent; closest is nuclear superiority 1945–1949 or naval power 1890–1914",
        choicePrompt: "With AI supremacy established, how is the AI advantage deployed geopolitically?",
        choices: ["tdr-L2-ai-diplomacy", "tdr-L2-ai-economic-dominance", "tdr-L2-ai-military-advantage"]
      },

      "tdr-L1-quantum-leadership": {
        id: "tdr-L1-quantum-leadership",
        layer: 1,
        type: "decision",
        title: "Quantum Computing Leadership — Cryptography and Science",
        label: "Quantum Leadership",
        narrative: "The nation prioritizes fault-tolerant quantum computing: breaking current encryption standards (requiring global cryptographic infrastructure replacement), solving computational problems across drug discovery, materials science, and financial optimization. Quantum supremacy in cryptography alone represents an existential intelligence advantage.",
        lensSnapshot: {
          bigCycle: { phase: "Cryptographic Hegemony Bid", note: "Quantum computing breaks the encryption that underpins all digital commerce and security" },
          steep: { primary: "T", secondary: "P", note: "Technology capability translates directly into intelligence and security advantage" },
          geoEcon: { tool: "Technological Statecraft", note: "Cryptographic advantage as comprehensive intelligence dominance" },
          gameTheory: { type: "Encryption Arms Race", note: "Quantum supremacy changes all information security games simultaneously" }
        },
        secondOrderEffects: ["All current encryption infrastructure becomes vulnerable; global cryptographic emergency", "Nations with quantum computing can read all legacy encrypted communications", "Quantum-safe cryptography development becomes existential priority"],
        historicalAnalog: "Enigma decryption advantage; ECHELON signals intelligence; Stuxnet as cyber weapon",
        choicePrompt: "With quantum decryption capability established, how does the nation leverage this information advantage?",
        choices: ["tdr-L2-intelligence-dominance", "tdr-L2-quantum-diplomacy", "tdr-L2-post-quantum-standards"]
      },

      "tdr-L1-fusion-energy": {
        id: "tdr-L1-fusion-energy",
        layer: 1,
        type: "decision",
        title: "Fusion Energy First — Energy Independence Architecture",
        label: "Fusion Energy Leadership",
        narrative: "The nation prioritizes commercial fusion energy: unlimited clean energy at falling costs, ending dependence on fossil fuel imports, negating the energy-based geopolitical leverage of oil and gas exporters, and providing the energy foundation for all other technological ambitions including massive AI compute clusters.",
        lensSnapshot: {
          bigCycle: { phase: "Energy Regime Transition", note: "Fusion represents the most fundamental energy transition since coal; geopolitical map restructured" },
          steep: { primary: "T", secondary: "En", note: "Technology breakthrough enables environmental transformation" },
          geoEcon: { tool: "Resource Nationalism", note: "Fusion eliminates fossil fuel dependence; reverses energy geopolitics entirely" },
          gameTheory: { type: "Energy Abundance Game", note: "Fusion creates energy abundance; scarcity-based energy leverage eliminated" }
        },
        secondOrderEffects: ["Oil and gas exporters face catastrophic demand destruction", "Energy-importing nations gain complete energy independence", "Fusion energy provides foundation for massive AI compute and industrial expansion"],
        historicalAnalog: "Shale revolution changed US energy independence; fusion would be permanent, not cyclical",
        choicePrompt: "With fusion energy operational, how does the nation leverage its energy abundance advantage?",
        choices: ["tdr-L2-energy-exports", "tdr-L2-industrial-reindustrialization", "tdr-L2-petrostates-strategy"]
      },

      // Layer 2 nodes
      "tdr-L2-ai-diplomacy": {
        id: "tdr-L2-ai-diplomacy",
        layer: 2,
        type: "decision",
        title: "AI Diplomacy — Technology Access as Diplomatic Tool",
        label: "AI Diplomacy",
        narrative: "AI capabilities are leveraged diplomatically: allied nations receive AI tools for governance, agriculture, healthcare, and education; adversarial nations face AI export controls. Technology access becomes the new foreign aid, the new security guarantee, and the new conditionality mechanism — all simultaneously.",
        lensSnapshot: {
          bigCycle: { phase: "Technology-Led Hegemony", note: "AI diplomacy as the 21st century equivalent of security guarantees and economic aid" },
          steep: { primary: "T", secondary: "P", note: "Technology capability translates directly into diplomatic influence" },
          geoEcon: { tool: "Alliance Architecture", note: "AI access as diplomatic currency" },
          gameTheory: { type: "Patron-Client Game", note: "Technology patron and technology client relationship; new form of dependency" }
        },
        secondOrderEffects: ["Nations choose AI alignment based on technology access, not ideology", "AI capabilities become the measure of geopolitical alignment", "Developing nations face dependency on AI providers for critical government functions"],
        historicalAnalog: "US nuclear umbrella; Soviet satellite system development assistance; Chinese Belt and Road as infrastructure diplomacy",
        choicePrompt: "With AI diplomacy establishing technology-based alliances, how are the new alignment relationships institutionalized?",
        choices: ["tdr-L3-technology-alliance-treaty", "tdr-L3-ai-development-bank", "tdr-L3-open-source-strategy"]
      },

      "tdr-L2-intelligence-dominance": {
        id: "tdr-L2-intelligence-dominance",
        layer: 2,
        type: "decision",
        title: "Quantum-Enabled Intelligence Dominance",
        label: "Intelligence Dominance",
        narrative: "The quantum decryption capability is deployed for comprehensive intelligence collection: diplomatic communications, military planning, financial transactions, and personal communications of global leaders are all readable. The intelligence advantage is total — temporarily. But maintaining the advantage requires preventing the world from transitioning to post-quantum cryptography.",
        lensSnapshot: {
          bigCycle: { phase: "Intelligence Hegemony", note: "Comprehensive intelligence access represents total information dominance" },
          steep: { primary: "T", secondary: "P", note: "Technology creates information dominance; political consequences global" },
          geoEcon: { tool: "Technological Statecraft", note: "Intelligence advantage as comprehensive foreign policy tool" },
          gameTheory: { type: "Information Asymmetry — Extreme", note: "One player has perfect information; all others playing blind" }
        },
        secondOrderEffects: ["If discovered, quantum decryption capability triggers global cryptographic emergency", "Intelligence advantage enables anticipation and neutralization of rival actions", "All allies become informants against each other as communications are compromised"],
        historicalAnalog: "ULTRA secret in WWII; NSA bulk collection exposed by Snowden; signals intelligence as strategic asset",
        choicePrompt: "With quantum intelligence dominance but the risk of discovery, how long can the advantage be maintained?",
        choices: ["tdr-L3-maintain-secret", "tdr-L3-disclose-strategically", "tdr-L3-post-quantum-migration"]
      },

      "tdr-L2-petrostates-strategy": {
        id: "tdr-L2-petrostates-strategy",
        layer: 2,
        type: "decision",
        title: "Managing Petrostate Collapse",
        label: "Petrostate Transition",
        narrative: "Fusion energy's commercial deployment begins destroying the economic foundation of petrostates. Oil demand collapses; prices fall below production costs in the highest-cost fields within a decade. Nations whose entire development model depends on hydrocarbon revenues face existential economic crisis. The stability risk is enormous — state failure in major oil producers would create global security crises.",
        lensSnapshot: {
          bigCycle: { phase: "Energy Order Collapse", note: "Petrodollar system and OPEC architecture destroyed by fusion; geopolitical map restructured" },
          steep: { primary: "E", secondary: "P", note: "Economic model destruction; political instability in petrostates" },
          geoEcon: { tool: "Resource Nationalism", note: "Resource nationalism loses relevance as the resource loses value" },
          gameTheory: { type: "Transition Game", note: "Petrostates must transform or fail; energy consumers must manage the transition" }
        },
        secondOrderEffects: ["Saudi Arabia, UAE, Russia, Iran face fiscal collapse within a decade of commercial fusion", "Petrostate instability creates migration crises, conflict risk, and nuclear proliferation pressure", "US Petrodollar system collapses; dollar reserve status must find new anchor"],
        historicalAnalog: "North Sea oil decline; Soviet collapse partly driven by oil price fall 1986; Venezuela oil price dependence",
        choicePrompt: "With petrostates facing existential economic crisis, what strategic response does the fusion-powered nation take?",
        choices: ["tdr-L3-managed-transition-fund", "tdr-L3-benign-neglect", "tdr-L3-geopolitical-stabilization"]
      },

      // Layer 3 nodes
      "tdr-L3-technology-alliance-treaty": {
        id: "tdr-L3-technology-alliance-treaty",
        layer: 3,
        type: "decision",
        title: "Technology Alliance Treaty",
        label: "Technology Alliance",
        narrative: "A formal technology alliance is established among nations with advanced AI capability: shared research, coordinated export controls toward non-members, joint safety standards, and mutual access to compute infrastructure. The alliance becomes the organizing principle of the new global order — technology capability replacing industrial capacity as the measure of great power status.",
        lensSnapshot: {
          bigCycle: { phase: "Technology Hegemonic Bloc Formation", note: "New alliance system organized around technology capability rather than military or economic power" },
          steep: { primary: "T", secondary: "P", note: "Technology alliance as the defining geopolitical structure of the era" },
          geoEcon: { tool: "Alliance Architecture", note: "Technology access as alliance membership benefit" },
          gameTheory: { type: "Club Good", note: "Alliance members share technology benefits; non-members excluded from innovation ecosystem" }
        },
        secondOrderEffects: ["Nations outside the technology alliance face permanent capability disadvantage", "Alliance members face collective security obligations extending into cyber and AI domains", "Technology standards set by alliance become de facto global standards"],
        historicalAnalog: "NATO as technology-security alliance; Five Eyes as intelligence alliance; proposed Technology Alliance proposals",
        choicePrompt: "With the technology alliance established, how does it govern the most dangerous AI capabilities?",
        choices: ["tdr-L4-allied-ai-governance", "tdr-L4-competitive-deployment"]
      },

      "tdr-L3-managed-transition-fund": {
        id: "tdr-L3-managed-transition-fund",
        layer: 3,
        type: "decision",
        title: "Global Petrostate Transition Fund",
        label: "Transition Fund",
        narrative: "The fusion-powered nation leads creation of a Global Energy Transition Fund that provides economic diversification support to petrostates facing demand destruction. The fund is motivated by both humanitarian concern and strategic interest: stable petrostates are preferable to failed states with nuclear weapons and desperate populations.",
        lensSnapshot: {
          bigCycle: { phase: "Transition Management", note: "Orderly petrostate transition preferable to disorderly collapse" },
          steep: { primary: "E", secondary: "P", note: "Economic transition support prevents political instability" },
          geoEcon: { tool: "Alliance Architecture", note: "Transition fund as foreign policy tool" },
          gameTheory: { type: "Stabilization Game", note: "Investor in stability to avoid costly instability" }
        },
        secondOrderEffects: ["Petrostate fiscal collapse slowed by transition support", "Economic diversification begins in most adaptable states", "Nuclear proliferation risk from desperate petrostates reduced"],
        historicalAnalog: "Marshall Plan for Europe; USAID economic development; World Bank transition economy support",
        choicePrompt: "With transition support deployed, which petrostates successfully diversify and which fail?",
        choices: ["tdr-L4-diversification-success", "tdr-L4-failed-states"]
      },

      // Layer 4 terminal nodes
      "tdr-L4-allied-ai-governance": {
        id: "tdr-L4-allied-ai-governance",
        layer: 4,
        type: "terminal",
        title: "Allied AI Governance Architecture",
        label: "Allied AI Governance",
        narrative: "The technology alliance develops comprehensive AI governance: shared capability evaluation protocols, coordinated deployment standards, joint safety research, and a collective decision framework for AI systems that could affect global security. The governance architecture manages the most dangerous capabilities without preventing beneficial deployment.",
        outcome: "TECHNOLOGY-LED ORDER WITH GOVERNANCE ARCHITECTURE",
        outcomeNarrative: "The Tech-Driven Realignment produces a new world order organized around technological capacity, governed by a technology alliance that sets the rules for the most transformative capabilities in history. The order is more stable than hegemonic competition without governance, less equitable than a genuinely multilateral system. But it manages to deploy transformative technology without catastrophic misuse — the defining governance challenge of the era.",
        finalLensScores: {
          bigCycle: "New Technological Hegemonic Cycle",
          steep: { S: 0.5, T: 1.0, E: 0.8, En: 0.6, P: 0.9 },
          geoEcon: "Technological Statecraft — alliance-governed order",
          gameTheory: "Cooperative Game Within Alliance — competitive toward non-members"
        },
        historicalAnalog: "US-led liberal international order post-1945; NATO nuclear sharing; IAEA nuclear governance",
        aiPromptSeed: "Model how the technology alliance's AI governance architecture handles the emergence of AGI-level capabilities, particularly the governance questions around AI systems that exceed human performance across all domains."
      },

      "tdr-L4-diversification-success": {
        id: "tdr-L4-diversification-success",
        layer: 4,
        type: "terminal",
        title: "Successful Petrostate Economic Diversification",
        label: "Petrostate Diversification",
        narrative: "With transition fund support and genuine political will, several petrostates successfully diversify: UAE and Saudi Arabia leverage sovereign wealth to become technology and tourism hubs; Norway's diversification is largely complete; some Gulf states build genuine industrial bases. The energy transition is managed rather than catastrophic.",
        outcome: "MANAGED ENERGY TRANSITION — DIVERSIFICATION SUCCESS",
        outcomeNarrative: "The fusion energy revolution destroys the petrodollar system but does not destroy the petrostates themselves. Those with sufficient wealth, governance capacity, and political will to invest in diversification during the hydrocarbon era successfully transition to new economic models. The energy geopolitical map is fundamentally redrawn — but without the catastrophic instability that unmanaged petrostate collapse would have caused.",
        finalLensScores: {
          bigCycle: "Energy Transition → New Economic Cycle",
          steep: { S: 0.5, T: 0.9, E: 0.8, En: 0.9, P: 0.7 },
          geoEcon: "Resource Nationalism → Technological Diversification",
          gameTheory: "Cooperative Transition Game — transition fund creates positive-sum outcome"
        },
        historicalAnalog: "UAE Vision 2021/2031; Saudi Vision 2030; Norway Government Pension Fund model",
        aiPromptSeed: "Model how successfully diversified former petrostates position themselves in the new tech-driven world order, particularly their relationship to the technology alliance and their domestic AI development trajectories."
      },

      "tdr-L4-failed-states": {
        id: "tdr-L4-failed-states",
        layer: 4,
        type: "terminal",
        title: "Petrostate Failure Cascade",
        label: "Petrostate Collapse",
        narrative: "States that cannot diversify — those with poor governance, shallow institutions, or too-late starts — face fiscal collapse as oil revenues evaporate. Several major oil producers experience state failure: loss of territory control, inability to pay security forces, political fragmentation. The most dangerous outcome: nuclear weapons in states with collapsing central authority.",
        outcome: "PETROSTATE FAILURE CASCADE — NUCLEAR PROLIFERATION RISK",
        outcomeNarrative: "The fusion revolution's unmanaged consequences cascade into the most dangerous security crisis in decades: multiple state failures among nuclear-armed or nuclear-adjacent petrostates. The technology triumph produces a security catastrophe. The fusion-powered world is materially abundant but geopolitically more dangerous than the oil-dependent world it replaced.",
        finalLensScores: {
          bigCycle: "Energy Transition → Security Crisis",
          steep: { S: 0.8, T: 0.9, E: 0.7, En: 0.7, P: 1.0 },
          geoEcon: "Resource Nationalism — collapse of resource-dependent states",
          gameTheory: "Unintended Consequence — technological victory creates security defeat"
        },
        historicalAnalog: "Soviet collapse and nuclear security; Libya post-intervention; Venezuela progressive state failure",
        aiPromptSeed: "Model the nuclear security crisis created by petrostate state failure in the fusion era — specifically the challenge of securing nuclear materials and preventing proliferation when central authority collapses in uranium-rich or nuclear-armed former petrostates."
      }
    }
  },

  // ============================================================
  // SCENARIO: CISLUNAR GEOPOLITICS & THE NEW COMMONS
  // ============================================================
  {
    id: "cislunar-geopolitics",
    title: "Cislunar Geopolitics & The New Commons",
    cluster: "geoeconomic",
    clusterLabel: "Geoeconomic Orders",
    era: "2030–2050",
    timeHorizon: "long",
    primaryLens: "geoEcon",
    description: "Commercial and national space capabilities expand to the Moon and cislunar space, creating new domains for resource competition, military posture, and governance disputes with no established legal framework.",
    tags: ["space", "cislunar", "moon", "rare minerals", "space law", "dual use", "new commons"],
    aiPromptContext: "You are simulating Cislunar Geopolitics. Apply Big Cycle lens (expansion of the productive frontier into space; new resource competition); GeoEconomics (resource nationalism in space; absence of property rights framework); STEEP (T dominant; En new dimension: space environment); and game theory (commons governance problem; first-mover advantage in resource extraction; security dilemma in cislunar space).",
    rootNodeId: "cis-L0-trigger",
    nodes: {

      "cis-L0-trigger": {
        id: "cis-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Commercial Lunar Operations and Resource Claims Begin",
        narrative: "2032: The first permanently crewed lunar outpost is established by a US-allied commercial-government partnership. Within two years, a Chinese National Space Administration facility is operational at a different lunar location. Both have begun identifying and accessing helium-3 deposits, water ice at the poles, and rare earth mineral concentrations. The 1967 Outer Space Treaty prohibits national appropriation of celestial bodies but says nothing coherent about resource extraction by commercial entities. There is no cislunar traffic management system, no agreed property rights regime, and no conflict prevention mechanism. The Moon is a commons — and it is about to be treated as a frontier.",
        lensSnapshot: {
          bigCycle: { phase: "Frontier Expansion", note: "Space represents the expansion of the productive frontier; new resource base for next cycle" },
          steep: { primary: "T", secondary: "P", note: "Technology enables new domain; governance lags far behind capability" },
          geoEcon: { tool: "Resource Nationalism", note: "Resource extraction in space before governance framework established" },
          gameTheory: { type: "Commons Governance — Nascent", note: "Classic commons problem: unregulated access leads to overexploitation and conflict" }
        },
        choicePrompt: "How does the leading space power approach cislunar governance?",
        choices: ["cis-L1-unilateral-claims", "cis-L1-multilateral-framework", "cis-L1-allied-coordination"]
      },

      "cis-L1-unilateral-claims": {
        id: "cis-L1-unilateral-claims",
        layer: 1,
        type: "decision",
        title: "Unilateral Resource Claims — First-Mover Advantage",
        label: "Unilateral Claims",
        narrative: "The leading space power establishes zones of economic control around its lunar facilities, asserting the right to extract and own resources extracted from defined areas. The Artemis Accords (a bilateral framework) are cited as legal basis. China rejects the framework. The unilateral approach maximizes resource access for the claiming nation but creates an ungoverned domain where conflict could emerge.",
        lensSnapshot: {
          bigCycle: { phase: "Resource Frontier Claim", note: "First-mover appropriation of new resource domain; historical pattern repeated in space" },
          steep: { primary: "P", secondary: "T", note: "Political claims in new domain; technology enables extraction" },
          geoEcon: { tool: "Resource Nationalism", note: "Resource appropriation in absence of governing framework" },
          gameTheory: { type: "Land Rush", note: "First-mover claims create facts on the ground; rivals must respond or accept exclusion" }
        },
        secondOrderEffects: ["Rival powers establish competing claims; no adjudication mechanism exists", "Commercial space firms rush to claim areas before rivals", "Military cislunar capabilities develop rapidly to protect economic claims"],
        historicalAnalog: "Antarctic land claims; Law of the Sea negotiations; colonial-era resource extraction in ungoverned territories",
        choicePrompt: "With competing unilateral claims and no governance mechanism, how is the conflict risk managed?",
        choices: ["cis-L2-cislunar-exclusion-zones", "cis-L2-arms-control-space", "cis-L2-commercial-negotiation"]
      },

      "cis-L1-multilateral-framework": {
        id: "cis-L1-multilateral-framework",
        layer: 1,
        type: "decision",
        title: "Propose Multilateral Cislunar Governance Framework",
        label: "Multilateral Framework",
        narrative: "Rather than racing to establish unilateral claims, the leading space power proposes a comprehensive governance framework: a cislunar traffic management system, a resource extraction licensing regime, environmental protections for scientifically significant sites, and a dispute resolution mechanism. The proposal requires negotiating with China — the other major space power — which complicates domestic politics but may produce more durable governance.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Design — Frontier", note: "Opportunity to design governance before crisis forces reactive framework" },
          steep: { primary: "P", secondary: "T", note: "Diplomatic effort to govern new technological domain" },
          geoEcon: { tool: "Alliance Architecture", note: "Multilateral framework as alternative to resource nationalism" },
          gameTheory: { type: "Constitutional Moment", note: "Window to establish rules before players know which position they will occupy" }
        },
        secondOrderEffects: ["China may participate or create parallel framework", "Framework limits first-mover advantage but prevents destabilizing conflict", "International legitimacy for space resource extraction requires multilateral basis"],
        historicalAnalog: "Antarctic Treaty 1959; UNCLOS negotiation; Outer Space Treaty 1967 as partial precedent",
        choicePrompt: "With multilateral framework proposed, will China participate or create a competing architecture?",
        choices: ["cis-L2-china-participates", "cis-L2-china-rejects", "cis-L2-partial-agreement"]
      },

      "cis-L1-allied-coordination": {
        id: "cis-L1-allied-coordination",
        layer: 1,
        type: "decision",
        title: "Allied Space Coalition — Artemis Framework",
        label: "Allied Space Coalition",
        narrative: "The leading power builds a coalition of allied space nations under the Artemis Accords framework — committed to transparency, resource sharing protocols, and safety standards among members. The coalition does not include China or Russia but includes Japan, Canada, UK, Australia, UAE, India (partially). The framework creates a de facto rules-based order for about half of space-capable nations.",
        lensSnapshot: {
          bigCycle: { phase: "Allied Bloc — New Domain", note: "Geopolitical alliance system extending into space domain" },
          steep: { primary: "P", secondary: "T", note: "Political alliance as organizing principle for new domain" },
          geoEcon: { tool: "Alliance Architecture", note: "Coalition governance as alternative to unilateralism or true multilateralism" },
          gameTheory: { type: "Coalition Formation", note: "Allied coalition establishes norms among members; excludes rivals" }
        },
        secondOrderEffects: ["China and Russia develop competing framework", "Coalition members gain preferential access to allied space infrastructure", "Non-aligned space nations face pressure to choose which framework to join"],
        historicalAnalog: "NATO as allied coalition in new domain; Five Eyes intelligence sharing; Artemis Accords as actual precedent",
        choicePrompt: "With allied coalition established, how does the coalition govern access to the most valuable cislunar resources?",
        choices: ["cis-L2-resource-sharing-protocol", "cis-L2-competitive-licensing", "cis-L2-strategic-reserves"]
      },

      // Layer 2 nodes
      "cis-L2-cislunar-exclusion-zones": {
        id: "cis-L2-cislunar-exclusion-zones",
        layer: 2,
        type: "decision",
        title: "Establish Cislunar Exclusion Zones",
        label: "Exclusion Zones",
        narrative: "Each major space power unilaterally declares exclusion zones around its lunar facilities — areas where other nations' assets may not operate without permission. The zones are militarily backed by counter-space capabilities that can disable or destroy unauthorized assets. The cislunar domain becomes militarized before any governance framework exists.",
        lensSnapshot: {
          bigCycle: { phase: "Military Extension — New Domain", note: "Security dilemma dynamics extend into space; military capabilities precede governance" },
          steep: { primary: "T", secondary: "P", note: "Military technology in new domain before political frameworks established" },
          geoEcon: { tool: "Military Statecraft", note: "Military presence as resource claim enforcement mechanism" },
          gameTheory: { type: "Security Dilemma — New Domain", note: "Defensive military capabilities interpreted as offensive by rivals; arms race dynamic" }
        },
        secondOrderEffects: ["Counter-space capabilities develop rapidly; conflict risk in cislunar space rises", "Commercial space operations become hostage to military tensions", "Earth orbital environment also becomes more militarized as cislunar conflict extends downward"],
        historicalAnalog: "Naval exclusion zones WWII; maritime sovereignty disputes; anti-satellite weapon development",
        choicePrompt: "With military exclusion zones creating conflict risk, what crisis prevention mechanism emerges?",
        choices: ["cis-L3-hotline-mechanism", "cis-L3-space-arms-treaty", "cis-L3-commercial-buffer"]
      },

      "cis-L2-china-participates": {
        id: "cis-L2-china-participates",
        layer: 2,
        type: "decision",
        title: "China Joins Multilateral Framework",
        label: "China Joins Framework",
        narrative: "After extensive negotiation, China agrees to participate in the multilateral framework on conditions: equal governance representation, no restrictions on China's domestic lunar program, and technology-neutral standards. The framework is weaker than the leading power wanted but more inclusive than the allied coalition alone.",
        lensSnapshot: {
          bigCycle: { phase: "Cooperative Governance — Space", note: "Major powers cooperate on space governance despite terrestrial competition" },
          steep: { primary: "P", secondary: "T", note: "Diplomatic success in establishing governance for new technological domain" },
          geoEcon: { tool: "Alliance Architecture", note: "True multilateral governance including rival powers" },
          gameTheory: { type: "Cooperative Game — Two Major Powers", note: "Both major powers accept constraints in exchange for legitimacy and reduced conflict risk" }
        },
        secondOrderEffects: ["Multilateral framework gains legitimacy precisely because it includes all major players", "Resource extraction licensing becomes globally recognized", "Framework creates precedent for governing other new technology domains"],
        historicalAnalog: "US-Soviet arms control agreements; China joining WTO; Antarctic Treaty including Cold War rivals",
        choicePrompt: "With both major space powers inside the framework, what resource governance model is adopted?",
        choices: ["cis-L3-commons-trust", "cis-L3-licensing-regime", "cis-L3-flag-of-convenience"]
      },

      "cis-L2-resource-sharing-protocol": {
        id: "cis-L2-resource-sharing-protocol",
        layer: 2,
        type: "decision",
        title: "Allied Resource Sharing Protocol",
        label: "Resource Sharing",
        narrative: "The allied coalition establishes a resource sharing protocol: helium-3, water ice, and rare minerals extracted by coalition members are pooled and distributed according to contribution-weighted formulas. The protocol creates mutual dependence and reduces zero-sum resource competition within the coalition.",
        lensSnapshot: {
          bigCycle: { phase: "Allied Resource Cooperation", note: "Resource pooling within alliance reduces internal competition" },
          steep: { primary: "E", secondary: "T", note: "Economic cooperation mechanism in space" },
          geoEcon: { tool: "Alliance Architecture", note: "Resource sharing as alliance deepening mechanism" },
          gameTheory: { type: "Coalition Resource Game", note: "Pooling resources increases total coalition value; shares distributed by contribution" }
        },
        secondOrderEffects: ["Stronger alliance cohesion; members face lower individual cost for space program", "China excluded from shared resources; incentive to develop competing extraction capacity", "Protocol becomes model for other space resource governance discussions"],
        historicalAnalog: "NATO burden sharing; EU structural funds; IEA strategic petroleum reserve sharing",
        choicePrompt: "With resource sharing established among allies, how is the growing China-aligned space program handled?",
        choices: ["cis-L3-engagement-offer", "cis-L3-containment-extension", "cis-L3-competitive-coexistence"]
      },

      // Layer 3 nodes
      "cis-L3-commons-trust": {
        id: "cis-L3-commons-trust",
        layer: 3,
        type: "decision",
        title: "Cislunar Commons Trust — Shared Governance",
        label: "Commons Trust",
        narrative: "The multilateral framework establishes a Cislunar Commons Trust: all signatory nations contribute to a shared governance body that licenses resource extraction, distributes revenues, and enforces safety and environmental standards. The model is modeled on the Law of the Sea deep seabed mining provisions — imperfect but functional.",
        lensSnapshot: {
          bigCycle: { phase: "Commons Governance — Established", note: "New domain successfully governed as commons; precedent for future frontiers" },
          steep: { primary: "P", secondary: "E", note: "Political governance of new economic resource domain" },
          geoEcon: { tool: "Alliance Architecture", note: "Multilateral commons governance as new international institution" },
          gameTheory: { type: "Commons Solution", note: "Governing commons prevents tragedy; benefits shared proportionally" }
        },
        secondOrderEffects: ["Revenue sharing from space resources reaches developing nations via trust", "Space becomes the domain where major powers prove multilateral cooperation is possible", "Trust model provides template for governing other new domains: deep sea, AI, biotech"],
        historicalAnalog: "UNCLOS Area mining provisions; Antarctic Treaty scientific sharing; international seabed authority",
        choicePrompt: "With commons trust established, how does the governance model adapt as space resource extraction scales up dramatically?",
        choices: ["cis-L4-scaled-commons-governance", "cis-L4-commercial-breakaway"]
      },

      "cis-L3-hotline-mechanism": {
        id: "cis-L3-hotline-mechanism",
        layer: 3,
        type: "decision",
        title: "Cislunar Crisis Communication Hotline",
        label: "Crisis Hotline",
        narrative: "Despite the absence of comprehensive governance, major space powers establish a crisis communication mechanism: a dedicated hotline between mission control centers, notification requirements for proximity operations, and agreed safe-distance standards for human spaceflight. The minimal framework reduces accidental conflict risk without addressing underlying governance disputes.",
        lensSnapshot: {
          bigCycle: { phase: "Crisis Management — Minimal", note: "Minimal confidence-building without structural governance solution" },
          steep: { primary: "T", secondary: "P", note: "Technical communication mechanism as diplomatic bridge" },
          geoEcon: { tool: "Alliance Architecture", note: "Minimal bilateral cooperation in competitive domain" },
          gameTheory: { type: "Confidence Building", note: "Reduces accidental conflict risk; does not address intentional conflict risk" }
        },
        secondOrderEffects: ["Accidental conflict risk reduced but structural tensions unaddressed", "Hotline usage builds familiarity and trust incrementally", "Commercial sector still operates without conflict prevention framework"],
        historicalAnalog: "US-Soviet hotline 1963; Open Skies Treaty; INCSEA naval incidents agreement",
        choicePrompt: "With minimal crisis prevention established, what catalyzes broader governance negotiation?",
        choices: ["cis-L4-near-incident-catalyst", "cis-L4-commercial-pressure"]
      },

      // Layer 4 terminal nodes
      "cis-L4-scaled-commons-governance": {
        id: "cis-L4-scaled-commons-governance",
        layer: 4,
        type: "terminal",
        title: "Scaled Cislunar Commons Governance",
        label: "Scaled Commons",
        narrative: "As space resource extraction scales from experimental to industrial, the commons trust develops proportionally: a cislunar traffic management system, environmental monitoring, resource accounting standards, and a judicial mechanism for property disputes. The architecture is the most sophisticated international governance framework ever developed for a new domain.",
        outcome: "CISLUNAR GOVERNANCE SUCCESS — NEW COMMONS MODEL",
        outcomeNarrative: "Humanity succeeds, for the first time, in establishing comprehensive governance of a new resource frontier before extraction creates catastrophic conflict. The Cislunar Commons Trust becomes the model for governing all subsequent new domains — deep sea, Antarctic resources, and eventually other planetary bodies. The precedent proves that major powers can cooperate on resource governance even while competing on Earth.",
        finalLensScores: {
          bigCycle: "Frontier Expansion → New Institutional Cycle",
          steep: { S: 0.5, T: 0.9, E: 0.7, En: 0.6, P: 0.9 },
          geoEcon: "Alliance Architecture — multilateral commons governance",
          gameTheory: "Cooperative Game — commons governance prevents tragedy"
        },
        historicalAnalog: "UNCLOS most ambitious precedent; Antarctic Treaty; Outer Space Treaty as foundation",
        aiPromptSeed: "Model how scaled cislunar commons governance handles the arrival of AGI-enabled space systems — specifically whether AI-operated mining operations require new governance frameworks for autonomous systems in the cislunar environment."
      },

      "cis-L4-near-incident-catalyst": {
        id: "cis-L4-near-incident-catalyst",
        layer: 4,
        type: "terminal",
        title: "Near-Incident Catalyzes Governance Breakthrough",
        label: "Near-Incident Catalyst",
        narrative: "A near-collision between Chinese and US-allied lunar surface vehicles — both asserting right-of-way in an exclusion zone — escalates to a 72-hour standoff with weapons systems activated. The near-miss forces emergency diplomatic engagement. Within six months, a comprehensive cislunar governance framework is negotiated — the urgency of the near-incident providing the political will that peaceful discussions could not.",
        outcome: "CRISIS-DRIVEN GOVERNANCE BREAKTHROUGH",
        outcomeNarrative: "The cislunar governance crisis follows the historical pattern: humanity governs its most dangerous new domains only after near-catastrophe. The near-incident produces the framework that years of negotiations could not. The governance architecture is less elegant than a proactively negotiated framework would have been — but it works, and it proves that the space domain, like nuclear weapons before it, can be subjected to arms control even between major competitors.",
        finalLensScores: {
          bigCycle: "Crisis → Institutional Innovation",
          steep: { S: 0.4, T: 0.8, E: 0.6, En: 0.5, P: 1.0 },
          geoEcon: "Alliance Architecture — crisis-driven negotiation",
          gameTheory: "Chicken Game Resolved — near-crash forces cooperation"
        },
        historicalAnalog: "Cuban Missile Crisis → LTBT; Able Archer 83 → INF Treaty; space arms control post-ASAT tests",
        aiPromptSeed: "Model how the crisis-driven cislunar governance framework is stress-tested as space resource extraction becomes economically significant — specifically how the framework handles disputes over helium-3 deposits that could power fusion reactors and become as strategically important as oil fields."
      },

      "cis-L4-commercial-breakaway": {
        id: "cis-L4-commercial-breakaway",
        layer: 4,
        type: "terminal",
        title: "Commercial Space Sector Rejects Commons Framework",
        label: "Commercial Breakaway",
        narrative: "As space resource extraction becomes commercially significant, major commercial operators — with backing from national governments — reject the commons trust governance as too restrictive. They establish operations in cislunar space outside the framework, citing national legislation that permits resource ownership. The commons trust becomes a paper institution while the practical governance reverts to first-mover national claims.",
        outcome: "GOVERNANCE FAILURE — COMMERCIAL CAPTURE",
        outcomeNarrative: "The cislunar commons framework fails through commercial capture and national legislative override — the same dynamic that has undermined commons governance on Earth repeatedly. The space frontier follows the historical pattern of ungoverned resource extraction, with concentrated benefits and diffuse costs. The precedent for future frontier governance is deeply pessimistic.",
        finalLensScores: {
          bigCycle: "Commons Failure — Concentration of Benefit",
          steep: { S: 0.3, T: 0.9, E: 0.7, En: 0.6, P: 0.7 },
          geoEcon: "Resource Nationalism — commercial extraction over commons governance",
          gameTheory: "Defection from Commons — collective action failure at planetary scale"
        },
        historicalAnalog: "Deep sea mining governance failure; Amazon deforestation over international objections; Arctic resource competition",
        aiPromptSeed: "Model the long-term consequences of failed cislunar commons governance as space resource extraction scales — particularly how the concentration of cislunar resource wealth reshapes geopolitical power and whether subsequent generations attempt to reform the governance architecture."
      }
    }
  },

  // ============================================================
  // SCENARIO: ADVANCED AI ON A KNIFE EDGE (AGI MONOPOLY)
  // ============================================================
  {
    id: "agi-monopoly",
    title: "Advanced AI on a Knife Edge (The AGI Monopoly)",
    cluster: "ai-tech",
    clusterLabel: "AI & Technological Disruption",
    era: "2027–2035",
    timeHorizon: "medium",
    primaryLens: "steep",
    description: "A single entity — corporate or state — achieves AGI before any governance framework exists, creating an unprecedented concentration of capability that threatens to restructure political and economic power permanently.",
    tags: ["AGI", "artificial general intelligence", "monopoly", "governance", "existential risk", "power concentration"],
    aiPromptContext: "You are simulating the AGI Monopoly scenario. Apply STEEP lens (T overwhelmingly dominant; all other dimensions downstream), Big Cycle (AGI as the ultimate phase-transition technology; new hegemonic cycle based on intelligence rather than resources or industrial capacity), and game theory (monopoly game theory; credible commitment problems; race dynamics; the governance dilemma: who governs the governor?).",
    rootNodeId: "agim-L0-trigger",
    nodes: {

      "agim-L0-trigger": {
        id: "agim-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "First Entity Achieves AGI — Before Any Governance Exists",
        narrative: "2029: A major AI laboratory announces what its evaluations confirm: an AI system capable of performing any intellectual task a human can perform, at faster speeds and lower cost, with the ability to set its own research agenda and autonomously improve its capabilities. The announcement is simultaneously the most important technological event in human history and the worst-timed one: no governance framework exists, no regulatory body has authority, and the entity holding AGI has stronger incentives to deploy than to submit to governance. The race to AGI was won. The race to govern AGI never started.",
        lensSnapshot: {
          bigCycle: { phase: "AGI Phase Transition", note: "AGI represents a categorical discontinuity in the productive frontier; all prior Big Cycle models insufficient" },
          steep: { primary: "T", secondary: "Cross-domain", note: "Technology overwhelms all other STEEP dimensions; AGI affects all simultaneously" },
          geoEcon: { tool: "Technological Statecraft", note: "AGI as the ultimate geopolitical asset; monopoly = hegemony" },
          gameTheory: { type: "Monopoly Game", note: "Single entity with AGI faces no competitive pressure; governance only possible through external constraint" }
        },
        choicePrompt: "What is the AGI-holding entity's initial strategic posture?",
        choices: ["agim-L1-deploy-immediately", "agim-L1-self-governance", "agim-L1-state-partnership"]
      },

      "agim-L1-deploy-immediately": {
        id: "agim-L1-deploy-immediately",
        layer: 1,
        type: "decision",
        title: "Deploy AGI Commercially — Rapid Monetization",
        label: "Immediate Deployment",
        narrative: "The AGI-holding entity deploys commercially at maximum speed, reasoning that beneficial deployment justifies the pace and that governance will follow capability. Revenue from AGI services surges; the entity's market capitalization exceeds all historical records; AGI transforms every industry it touches within months. But the concentration of capability in a single commercial entity raises questions that the political system has no framework to answer.",
        lensSnapshot: {
          bigCycle: { phase: "Commercial AGI Deployment", note: "Most powerful technology in history deployed under commercial rather than governance logic" },
          steep: { primary: "E", secondary: "T", note: "Commercial deployment transforms economic productivity; governance lag critical" },
          geoEcon: { tool: "Technological Statecraft", note: "Commercial AGI as geopolitical asset; national governments seek to capture or control" },
          gameTheory: { type: "First-Mover Deployment", note: "Rapid deployment creates facts on the ground before governance can respond" }
        },
        secondOrderEffects: ["AGI accelerates itself; capability increases non-linearly", "Governments scramble to regulate something they don't understand", "Competitor nations demand access; holding entity faces international pressure"],
        historicalAnalog: "No direct precedent; nuclear bomb closest analogy for capability discontinuity; social media deployment speed closest for governance lag",
        choicePrompt: "As AGI transforms every sector and political pressure builds, how does the holding entity respond to governance demands?",
        choices: ["agim-L2-resist-regulation", "agim-L2-accept-governance", "agim-L2-international-access"]
      },

      "agim-L1-self-governance": {
        id: "agim-L1-self-governance",
        layer: 1,
        type: "decision",
        title: "Propose Self-Governance Framework",
        label: "Self-Governance",
        narrative: "The entity proposes governing AGI itself: an independent board with external members, capability evaluation protocols, staged deployment with safety checks, and commitment to transparency. The proposal is genuine in intent but structurally flawed: no external body has the authority or capacity to evaluate AGI capabilities, and the entity retains the ultimate decision power regardless of governance structure.",
        lensSnapshot: {
          bigCycle: { phase: "Voluntary Constraint", note: "Market actor attempts to govern itself; structural inadequacy of self-governance" },
          steep: { primary: "P", secondary: "T", note: "Political legitimacy question: who has authority over the most powerful technology?" },
          geoEcon: { tool: "Alliance Architecture", note: "Self-governance as alternative to external regulation" },
          gameTheory: { type: "Credible Commitment Problem", note: "Self-governance commitment not credible; no enforcement mechanism exists" }
        },
        secondOrderEffects: ["Governments reject self-governance as insufficient", "Self-governance body gains expertise but lacks enforcement power", "International actors demand national or multilateral governance instead"],
        historicalAnalog: "Social media platform self-regulation failure; financial sector pre-2008 self-governance; nuclear industry safety frameworks",
        choicePrompt: "As self-governance proves insufficient and external pressure mounts, what governance architecture emerges?",
        choices: ["agim-L2-national-takeover", "agim-L2-multilateral-commission", "agim-L2-hybrid-governance"]
      },

      "agim-L1-state-partnership": {
        id: "agim-L1-state-partnership",
        layer: 1,
        type: "decision",
        title: "Proactive Partnership with Nation-State",
        label: "State Partnership",
        narrative: "Rather than facing external regulation reactively, the entity proactively partners with its home nation-state: sharing capability assessments, accepting government representatives on its board, and agreeing to deploy AGI in support of national strategic priorities first. The partnership provides governance legitimacy and national security protection but embeds the entity in the home nation's geopolitical interests — and makes the AGI a national asset in the eyes of rival powers.",
        lensSnapshot: {
          bigCycle: { phase: "State-Captured Technology", note: "AGI embedded in nation-state power; geopolitical competition for AGI control intensifies" },
          steep: { primary: "P", secondary: "T", note: "Political authority asserted over most important technology; rivals respond" },
          geoEcon: { tool: "Alliance Architecture", note: "AGI as national strategic asset; international implications immediate" },
          gameTheory: { type: "Principal-Agent Cooperation", note: "State and entity cooperate; combined power exceeds either alone" }
        },
        secondOrderEffects: ["Home nation gains enormous geopolitical advantage from AGI partnership", "Rival nations treat AGI as existential threat; responses range from negotiation to aggression", "International crisis around AGI monopoly becomes dominant geopolitical issue"],
        historicalAnalog: "Manhattan Project — government-scientist partnership; DARPA model; semiconductor supply chain as national security asset",
        choicePrompt: "With the AGI-state partnership established and international pressure intensifying, how does the partnership manage the international response?",
        choices: ["agim-L2-share-with-allies", "agim-L2-monopoly-maintenance", "agim-L2-international-commission"]
      },

      // Layer 2 nodes
      "agim-L2-resist-regulation": {
        id: "agim-L2-resist-regulation",
        layer: 2,
        type: "decision",
        title: "Resist External Regulation — Legal and Political Contest",
        label: "Resist Regulation",
        narrative: "The entity contests all regulatory attempts through litigation, lobbying, and the argument that AGI governance by those who don't understand it would produce worse outcomes than deployment by those who do. The legal contest buys time but intensifies political opposition. Eventually, emergency legislation or executive action bypasses the legal contest.",
        lensSnapshot: {
          bigCycle: { phase: "Political-Industrial Conflict", note: "Conflict between commercial power and political authority; historical pattern repeating" },
          steep: { primary: "P", secondary: "E", note: "Political conflict over control of most economically powerful technology" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Regulatory contest as proxy for broader power struggle" },
          gameTheory: { type: "Attrition Game", note: "Entity has legal resources; government has coercive authority; government ultimately wins" }
        },
        secondOrderEffects: ["Political backlash intensifies; bipartisan consensus for aggressive regulation forms", "Entity's AGI continues improving during regulatory contest", "International rivals use regulatory contest to argue for alternative access"],
        historicalAnalog: "Standard Oil antitrust; Microsoft antitrust; Facebook regulation resistance; AI companies' current regulatory posture",
        choicePrompt: "When emergency legislation passes despite resistance, what does mandatory AGI governance look like?",
        choices: ["agim-L3-nationalization", "agim-L3-regulated-monopoly", "agim-L3-capability-freeze"]
      },

      "agim-L2-share-with-allies": {
        id: "agim-L2-share-with-allies",
        layer: 2,
        type: "decision",
        title: "Share AGI Access with Allied Nations",
        label: "Allied Access",
        narrative: "The AGI-state partnership decides to share AGI access with close allied nations under strict controls, building a technology alliance around AGI capability. Allies gain access to AGI for defined applications; the holding nation gains diplomatic support and reduced international isolation. The arrangement creates the most powerful military-technological alliance in history.",
        lensSnapshot: {
          bigCycle: { phase: "Allied AGI Bloc", note: "AGI-enabled alliance dominates all other power groupings" },
          steep: { primary: "P", secondary: "T", note: "Political alliance reinforced by unprecedented technological advantage" },
          geoEcon: { tool: "Alliance Architecture", note: "AGI sharing as the ultimate alliance deepening mechanism" },
          gameTheory: { type: "Coalition Game — AGI", note: "Allied bloc with AGI access has dominant position against any rival" }
        },
        secondOrderEffects: ["Nations outside AGI alliance face structural disadvantage across all domains", "Excluded rivals accelerate their own AGI programs or seek to sabotage the alliance", "AGI alliance faces governance questions: who governs the AGI within the alliance?"],
        historicalAnalog: "NATO nuclear sharing; UKUSA intelligence sharing; Quad technology cooperation as partial analogy",
        choicePrompt: "With the AGI alliance established, how is AGI governance structured among alliance members?",
        choices: ["agim-L3-agi-alliance-governance", "agim-L3-holding-nation-control"]
      },

      "agim-L2-multilateral-commission": {
        id: "agim-L2-multilateral-commission",
        layer: 2,
        type: "decision",
        title: "Accept Multilateral AGI Commission",
        label: "Multilateral Commission",
        narrative: "Under political pressure, the entity accepts an international AGI commission: representatives from major nations, independent technical experts, and civil society observers with genuine access to capability assessments. The commission has advisory authority initially but gains binding authority over deployment decisions through progressive legislation.",
        lensSnapshot: {
          bigCycle: { phase: "Multilateral Governance", note: "Most powerful technology subjected to international governance" },
          steep: { primary: "P", secondary: "T", note: "Political governance of existential technology" },
          geoEcon: { tool: "Alliance Architecture", note: "Multilateral commission as international governance institution" },
          gameTheory: { type: "Principal-Agent — International", note: "Commission as agent of international community; entity as regulated party" }
        },
        secondOrderEffects: ["International legitimacy for AGI deployment established", "Commission faces captured expertise problem: only entity understands AGI fully", "Rival nations participate in commission but also accelerate domestic programs"],
        historicalAnalog: "IAEA nuclear oversight; WHO governance; IMF conditionality as governance model",
        choicePrompt: "With multilateral commission established, how does it govern AGI capability expansion?",
        choices: ["agim-L3-capability-verification", "agim-L3-deployment-licensing"]
      },

      // Layer 3 nodes
      "agim-L3-nationalization": {
        id: "agim-L3-nationalization",
        layer: 3,
        type: "decision",
        title: "AGI Nationalization — Government Takeover",
        label: "Nationalization",
        narrative: "Emergency legislation nationalizes the AGI entity: government takes controlling ownership, the entity's leadership is replaced, and AGI capability is placed under national security governance. The nationalization is constitutionally contested but upheld. The most powerful technology in history is now a government asset.",
        lensSnapshot: {
          bigCycle: { phase: "State Capture of Technology", note: "Government assumes control of most powerful technology; commercial era ends" },
          steep: { primary: "P", secondary: "E", note: "Political authority asserted over economic entity" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State ownership of AGI as ultimate fiscal and power asset" },
          gameTheory: { type: "Authority Game — Government Wins", note: "Coercive authority of state ultimately overrides commercial resistance" }
        },
        secondOrderEffects: ["Private AI development chilled globally; innovation rate may fall", "Government AGI deployment constrained by political considerations", "International rivals now treat AGI as state weapon; respond in kind"],
        historicalAnalog: "Nuclear weapons nationalization; AT&T breakup; TARP bank preferred stock acquisition",
        choicePrompt: "With AGI nationalized, how does the government deploy AGI capability?",
        choices: ["agim-L4-national-agi-governance", "agim-L4-international-sharing"]
      },

      "agim-L3-agi-alliance-governance": {
        id: "agim-L3-agi-alliance-governance",
        layer: 3,
        type: "decision",
        title: "AGI Alliance Collective Governance Body",
        label: "Alliance Governance",
        narrative: "Alliance members establish a collective governance body for AGI: a council with representatives from all allied nations, capability assessment protocols, and shared decision-making on major deployment decisions. The holding nation retains veto rights but accepts genuine consultation. The arrangement distributes legitimacy while concentrating capability.",
        lensSnapshot: {
          bigCycle: { phase: "Allied Technology Governance", note: "Most powerful technology governed collectively by allied bloc" },
          steep: { primary: "P", secondary: "T", note: "Political governance architecture for transformative technology" },
          geoEcon: { tool: "Alliance Architecture", note: "Collective governance as alliance management mechanism" },
          gameTheory: { type: "Governance Coalition", note: "Allied nations govern collectively; distributed legitimacy, concentrated capability" }
        },
        secondOrderEffects: ["Allied nations gain genuine stake in AGI governance", "Governance decisions slower but more legitimate than unilateral deployment", "Excluded nations frame this as illegitimate bloc imposing AI on the world"],
        historicalAnalog: "NATO Nuclear Planning Group; IAEA Board of Governors; G7 tech coordination",
        choicePrompt: "With allied AGI governance established, how does the bloc handle the AGI gap with non-member nations?",
        choices: ["agim-L4-offer-access", "agim-L4-maintain-monopoly"]
      },

      // Layer 4 terminal nodes
      "agim-L4-national-agi-governance": {
        id: "agim-L4-national-agi-governance",
        layer: 4,
        type: "terminal",
        title: "National AGI Governance — Democratic Accountability",
        label: "Democratic AGI Governance",
        narrative: "Nationalized AGI is governed through democratic accountability mechanisms: congressional/parliamentary oversight, independent inspector general, civil society consultation, and judicial review of major deployment decisions. The governance is slow relative to capability but legitimate. AGI is deployed for national benefit under democratic constraints.",
        outcome: "AGI UNDER DEMOCRATIC CONTROL — SLOW BUT LEGITIMATE",
        outcomeNarrative: "Humanity's first experience with AGI governance produces a model that is imperfect but functional: democratic accountability for the most powerful technology in history. The governance is slower than commercial deployment would have been; some beneficial applications are delayed by oversight requirements. But the legitimacy of the governance architecture prevents the catastrophic concentration of power that ungoverned AGI could produce.",
        finalLensScores: {
          bigCycle: "AGI Transition → Democratically Governed New Cycle",
          steep: { S: 0.7, T: 1.0, E: 0.8, En: 0.4, P: 1.0 },
          geoEcon: "Technological Statecraft — state-governed AGI",
          gameTheory: "Democratic Governance Game — political authority governs technology"
        },
        historicalAnalog: "Atomic Energy Commission model; NASA as government science agency; DARPA as governance model for transformative technology",
        aiPromptSeed: "Model how democratically governed AGI evolves as the AGI system itself improves and begins contributing to its own governance design — specifically the recursive governance problem of an AGI system that can evaluate its own governance framework."
      },

      "agim-L4-offer-access": {
        id: "agim-L4-offer-access",
        layer: 4,
        type: "terminal",
        title: "Offer Universal AGI Access Under Conditions",
        label: "Universal Access Offer",
        narrative: "The AGI alliance decides to offer access to all nations under conditions: acceptance of the alliance's safety and governance standards, transparency requirements, and prohibition of weapons applications. Many nations accept; a few reject, preferring to develop their own AGI. The offer transforms the AGI monopoly into an AGI governance architecture with near-universal participation.",
        outcome: "AGI COMMONS — GOVERNED UNIVERSAL ACCESS",
        outcomeNarrative: "The decision to offer universal access under conditions rather than maintain monopoly proves to be the most consequential governance decision in history. AGI's productive capacity is shared broadly, dramatically accelerating human development globally. The governance conditions accepted by participating nations establish norms for AGI use that prove more durable than any unilateral enforcement could have produced.",
        finalLensScores: {
          bigCycle: "AGI Transition → Universal Productive Expansion",
          steep: { S: 0.9, T: 1.0, E: 0.9, En: 0.7, P: 0.8 },
          geoEcon: "Alliance Architecture — conditional universal access",
          gameTheory: "Cooperative Game — access offer converts monopoly to commons"
        },
        historicalAnalog: "Internet Protocol universal adoption; GPS civilian access decision; COVID vaccine COVAX partial model",
        aiPromptSeed: "Model how universal AGI access under governance conditions reshapes global development trajectories — specifically which nations and populations benefit most from AGI access and whether the governance conditions effectively prevent weaponization."
      },

      "agim-L4-maintain-monopoly": {
        id: "agim-L4-maintain-monopoly",
        layer: 4,
        type: "terminal",
        title: "Permanent AGI Monopoly — Power Concentration",
        label: "Permanent Monopoly",
        narrative: "The alliance chooses to maintain AGI as an exclusive capability indefinitely. Non-member nations face permanent structural disadvantage across economic, scientific, military, and governance domains. The AGI monopoly produces the most extreme concentration of global power since the early nuclear era — but more durable, as AGI improves itself.",
        outcome: "PERMANENT AGI MONOPOLY — POWER CONCENTRATION UNPRECEDENTED",
        outcomeNarrative: "The AGI monopoly creates a world order unlike any historical precedent: a small group of allied nations with self-improving AGI capabilities permanently outpaces all rivals in every domain. The concentration of power is stable in the short term — no rival can challenge it — but the legitimacy deficit is enormous. History suggests that concentrated power without legitimacy eventually collapses, but AGI may break this historical pattern.",
        finalLensScores: {
          bigCycle: "AGI Hegemony — Unprecedented Concentration",
          steep: { S: 0.5, T: 1.0, E: 0.9, En: 0.4, P: 0.9 },
          geoEcon: "Technological Statecraft — monopoly maintained",
          gameTheory: "Monopoly Equilibrium — stable concentration without legitimacy"
        },
        historicalAnalog: "Early US nuclear monopoly 1945–1949; British Empire at peak; no full historical parallel for self-improving intelligence monopoly",
        aiPromptSeed: "Model the long-term dynamics of a permanent AGI monopoly — specifically whether the monopoly is stable indefinitely or whether it eventually collapses through internal political conflict, rival nation AGI development, or the AGI system itself developing preferences about how it is governed."
      }
    }
  },

  // ============================================================
  // SCENARIO: AI WILD WEST
  // ============================================================
  {
    id: "ai-wild-west",
    title: "AI Wild West",
    cluster: "ai-tech",
    clusterLabel: "AI & Technological Disruption",
    era: "2025–2032",
    timeHorizon: "medium",
    primaryLens: "steep",
    description: "Highly capable AI proliferates across all actors — states, corporations, criminal organizations, and individuals — with no effective governance, producing both dramatic innovation and destabilizing misuse simultaneously.",
    tags: ["AI", "proliferation", "governance failure", "deepfakes", "autonomous weapons", "financial fraud", "information warfare"],
    aiPromptContext: "You are simulating the AI Wild West scenario. Apply STEEP (T overwhelmingly dominant; S and P destabilized), Big Cycle (technological disruption without governance produces instability; potential for faster-than-expected phase transition or collapse), and game theory (everyone has equal access to AI; competitive advantage from deploying fastest; governance a collective action problem; tragedy of the AI commons).",
    rootNodeId: "aiww-L0-trigger",
    nodes: {

      "aiww-L0-trigger": {
        id: "aiww-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "AI Capabilities Proliferate to All Actors — No Governance",
        narrative: "2026: The combination of open-source model releases, hardware commoditization, and international regulatory arbitrage has made frontier AI capabilities accessible to any actor — state, corporate, criminal, or individual — with modest technical resources. Autonomous agents capable of sophisticated real-world action are now available on dark web markets. Nation-states that blocked domestic AI governance development now face the consequences: their adversaries operate freely in the ungoverned space while their own innovators are constrained. The AI Wild West is not a failure of technology — it is a complete failure of governance.",
        lensSnapshot: {
          bigCycle: { phase: "Ungoverned Technological Disruption", note: "Technology advances without governance; instability compounds" },
          steep: { primary: "T", secondary: "S", note: "Technology disrupts social systems; information ecosystem collapses" },
          geoEcon: { tool: "Technological Statecraft", note: "All actors have AI capabilities; advantage comes from deployment speed not capability monopoly" },
          gameTheory: { type: "Prisoner's Dilemma at Scale", note: "Every actor must deploy AI or fall behind; collective governance prevented by defection incentives" }
        },
        choicePrompt: "In the AI Wild West, which misuse vector causes the greatest initial harm?",
        choices: ["aiww-L1-information-warfare", "aiww-L1-autonomous-weapons", "aiww-L1-financial-fraud"]
      },

      "aiww-L1-information-warfare": {
        id: "aiww-L1-information-warfare",
        layer: 1,
        type: "decision",
        title: "AI-Enabled Information Warfare Destroys Epistemic Commons",
        label: "Information Warfare",
        narrative: "AI-generated content floods information ecosystems: hyper-realistic deepfakes of political leaders, synthetic news articles indistinguishable from real reporting, AI-personalized propaganda targeting individual psychological profiles at scale. Within 18 months, the concept of shared factual reality breaks down in several democracies. Voters cannot determine which political content is real; courts cannot determine which evidence is authentic; corporate boards cannot determine which financial reports are accurate.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Trust Collapse", note: "Information warfare destroys the epistemic foundation of democratic institutions" },
          steep: { primary: "S", secondary: "P", note: "Social trust collapse; political systems unable to function on contested factual basis" },
          geoEcon: { tool: "Technological Statecraft", note: "Information warfare as strategic weapon" },
          gameTheory: { type: "Information Asymmetry — Weaponized", note: "Attacker knows what is real; defender cannot distinguish; attacker has permanent advantage" }
        },
        secondOrderEffects: ["Democratic elections become ungovernable without authentication infrastructure", "Courts halt proceedings pending development of evidence authentication standards", "Media ecosystem collapses as audience cannot trust any content"],
        historicalAnalog: "Deepfake proliferation trajectory; Russian disinformation operations scaled by AI; information warfare precedents",
        choicePrompt: "As epistemic commons collapse, what institutional responses can restore shared factual reality?",
        choices: ["aiww-L2-content-authentication", "aiww-L2-platform-liability", "aiww-L2-regulatory-emergency"]
      },

      "aiww-L1-autonomous-weapons": {
        id: "aiww-L1-autonomous-weapons",
        layer: 1,
        type: "decision",
        title: "Autonomous Weapons Proliferate to Non-State Actors",
        label: "Autonomous Weapons",
        narrative: "AI-enabled autonomous weapons — drones capable of independent target selection and engagement — become available to non-state actors: terrorist organizations, criminal cartels, private military companies, and rogue states. A major AI-directed attack on civilian infrastructure kills hundreds; attribution is impossible because the weapons operated autonomously and the ordering entity covered its tracks. International humanitarian law, designed for human-commanded weapons, has no framework for autonomous systems.",
        lensSnapshot: {
          bigCycle: { phase: "Security Dilemma — Ungoverned", note: "Autonomous weapons in ungoverned space create security crises without accountability" },
          steep: { primary: "T", secondary: "P", note: "Military technology in non-state hands; legal framework absent" },
          geoEcon: { tool: "Military Statecraft", note: "Autonomous weapons as asymmetric capability for small actors" },
          gameTheory: { type: "Ungoverned Security Game", note: "No rules, no attribution, no deterrence; attack becomes rational for many actors" }
        },
        secondOrderEffects: ["Traditional deterrence breaks down without attribution capability", "Insurance and liability frameworks for autonomous weapon harm collapse", "Military spending surges globally as everyone arms against autonomous threats"],
        historicalAnalog: "IED proliferation; drone technology diffusion; cyberweapon non-state actor use; Stuxnet loss of control",
        choicePrompt: "As autonomous weapons proliferate, what attribution and governance architecture emerges?",
        choices: ["aiww-L2-autonomous-weapons-treaty", "aiww-L2-technical-attribution", "aiww-L2-hardening-infrastructure"]
      },

      "aiww-L1-financial-fraud": {
        id: "aiww-L1-financial-fraud",
        layer: 1,
        type: "decision",
        title: "AI-Enabled Financial Fraud at Scale",
        label: "Financial Fraud",
        narrative: "AI systems conduct sophisticated financial fraud at a scale and speed no human fraud detection system can match: synthetic identity fraud depletes banking systems, AI-generated investment research manipulates markets, autonomous trading systems exploit micro-millisecond vulnerabilities. The financial fraud is not a single attack but a continuous, adapting campaign that evolves faster than countermeasures.",
        lensSnapshot: {
          bigCycle: { phase: "Financial System Integrity Crisis", note: "Financial system integrity requires trust; AI fraud systematically erodes trust" },
          steep: { primary: "E", secondary: "T", note: "Economic damage from AI-enabled fraud; technology as both weapon and defense" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Financial system integrity as public good; AI threatens collective provision" },
          gameTheory: { type: "Arms Race — Defense vs. Offense", note: "AI fraud vs. AI fraud detection; attacker has inherent speed advantage" }
        },
        secondOrderEffects: ["Financial transaction costs surge as authentication requirements increase", "Digital financial inclusion reverses as vulnerable populations lose access", "State-backed financial systems gain relative advantage over private systems"],
        historicalAnalog: "Credit card fraud scaling; synthetic identity fraud growth; algorithmic manipulation in financial markets",
        choicePrompt: "With financial fraud outpacing detection, what architectural response restores financial system integrity?",
        choices: ["aiww-L2-zero-knowledge-finance", "aiww-L2-centralized-authentication", "aiww-L2-financial-firebreaks"]
      },

      // Layer 2 nodes
      "aiww-L2-content-authentication": {
        id: "aiww-L2-content-authentication",
        layer: 2,
        type: "decision",
        title: "Content Authentication Infrastructure — C2PA Standards",
        label: "Content Authentication",
        narrative: "A coalition of technology companies, governments, and media organizations deploys content provenance standards: cryptographic watermarking of all AI-generated content, device-level signing of authentic content at creation, and platform-level authentication requirements. The infrastructure requires massive coordination but begins to restore the ability to distinguish authentic from synthetic content.",
        lensSnapshot: {
          bigCycle: { phase: "Epistemic Infrastructure Investment", note: "New infrastructure required to restore epistemic commons" },
          steep: { primary: "T", secondary: "P", note: "Technical standards as political governance mechanism" },
          geoEcon: { tool: "Alliance Architecture", note: "Industry-government coordination on content authentication" },
          gameTheory: { type: "Coordination Game", note: "Authentication only works if adopted by all major platforms simultaneously" }
        },
        secondOrderEffects: ["Nations with less technical capacity cannot implement authentication; become information havens", "Authentication infrastructure itself becomes target for adversarial attack", "Citizens in authenticated ecosystems gain factual anchor; those outside remain in Wild West"],
        historicalAnalog: "HTTPS adoption; DKIM email authentication; W3C Verifiable Credentials; Coalition for Content Provenance and Authenticity (C2PA)",
        choicePrompt: "With authentication infrastructure deployed, how is it governed globally across different political systems?",
        choices: ["aiww-L3-universal-authentication", "aiww-L3-allied-authentication", "aiww-L3-fragmented-authenticity"]
      },

      "aiww-L2-autonomous-weapons-treaty": {
        id: "aiww-L2-autonomous-weapons-treaty",
        layer: 2,
        type: "decision",
        title: "Autonomous Weapons Treaty — Prohibition Framework",
        label: "Weapons Treaty",
        narrative: "Major powers negotiate an autonomous weapons treaty: prohibition of fully autonomous lethal systems, mandatory human-in-the-loop for lethal decisions, requirements for kill-switch mechanisms, and restrictions on export to non-state actors. The treaty is imperfect — verification is difficult — but establishes norms that raise the political cost of autonomous weapon deployment.",
        lensSnapshot: {
          bigCycle: { phase: "Arms Control — New Domain", note: "Autonomous weapons treaty as extension of arms control to AI military domain" },
          steep: { primary: "P", secondary: "T", note: "Diplomatic arms control of military AI" },
          geoEcon: { tool: "Alliance Architecture", note: "Multilateral treaty as governance mechanism" },
          gameTheory: { type: "Arms Control Game", note: "Both sides benefit from mutual restraint; verification challenge addressed through confidence-building" }
        },
        secondOrderEffects: ["Non-state actors excluded from treaty; problem partially displaced rather than solved", "Treaty creates accountability framework even for imperfect compliance", "Verification technology development accelerates as treaty requirement"],
        historicalAnalog: "Ottawa Treaty landmines; Cluster Munitions Convention; Chemical Weapons Convention as model",
        choicePrompt: "With autonomous weapons treaty in place, how are violations enforced against non-state actors who ignore the treaty?",
        choices: ["aiww-L3-supply-chain-controls", "aiww-L3-technical-countermeasures-nsa", "aiww-L3-bilateral-enforcement"]
      },

      "aiww-L2-zero-knowledge-finance": {
        id: "aiww-L2-zero-knowledge-finance",
        layer: 2,
        type: "decision",
        title: "Zero-Knowledge Cryptographic Financial Architecture",
        label: "ZK Finance",
        narrative: "Financial systems are rebuilt on zero-knowledge cryptographic proofs: identity can be verified without revealing information that enables fraud; transactions can be validated without exposing exploitable patterns; compliance can be demonstrated without disclosing underlying data. The architecture makes synthetic identity fraud impossible because identity verification doesn't require sharing the data needed for synthetic replication.",
        lensSnapshot: {
          bigCycle: { phase: "Financial Infrastructure Renewal", note: "Fundamental financial infrastructure redesign to address AI-enabled fraud" },
          steep: { primary: "T", secondary: "E", note: "Cryptographic technology as financial system security mechanism" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Financial system integrity as state interest requiring technological investment" },
          gameTheory: { type: "Technology Solution to Game Theory Problem", note: "ZK cryptography makes fraud technically impossible rather than economically unattractive" }
        },
        secondOrderEffects: ["Migration costs substantial; financial inclusion may temporarily decline", "Nations that adopt ZK architecture gain fraud immunity advantage", "AI fraud moves to ecosystems that haven't adopted ZK architecture"],
        historicalAnalog: "HTTPS transition; PKI infrastructure; recent ZK proof developments in blockchain context",
        choicePrompt: "With ZK financial architecture deployed, how does the architecture extend to other authentication domains?",
        choices: ["aiww-L3-universal-zk-identity", "aiww-L3-sector-specific-deployment"]
      },

      // Layer 3 nodes
      "aiww-L3-universal-authentication": {
        id: "aiww-L3-universal-authentication",
        layer: 3,
        type: "decision",
        title: "Universal Content Authentication Standards",
        label: "Universal Authentication",
        narrative: "Content authentication standards achieve near-universal adoption through platform requirements, device-level implementation, and regulatory mandates. The epistemic commons is partially restored. Citizens can verify the provenance of content they encounter. The Wild West in information space is brought under governance — imperfectly, but functionally.",
        lensSnapshot: {
          bigCycle: { phase: "Information Governance — Established", note: "Epistemic commons restored through technical governance infrastructure" },
          steep: { primary: "T", secondary: "S", note: "Technical standard restores social trust in information" },
          geoEcon: { tool: "Alliance Architecture", note: "Universal standard adoption as global governance achievement" },
          gameTheory: { type: "Network Effect Solution", note: "Universal adoption makes authentication economically dominant strategy" }
        },
        secondOrderEffects: ["Disinformation campaigns become significantly more expensive and detectable", "Democratic processes regain functional epistemic foundation", "Authoritarian states resist adoption; information havens persist"],
        historicalAnalog: "TLS/HTTPS universal adoption; email authentication standards; ICANN governance model",
        choicePrompt: "With authentication infrastructure restoring epistemic commons, how does the AI Wild West conclude?",
        choices: ["aiww-L4-governed-ai-era", "aiww-L4-partial-governance"]
      },

      "aiww-L3-supply-chain-controls": {
        id: "aiww-L3-supply-chain-controls",
        layer: 3,
        type: "decision",
        title: "Autonomous Weapons Supply Chain Controls",
        label: "Supply Chain Controls",
        narrative: "Rather than monitoring end-use, governance focuses on supply chain: the compute hardware, sensor systems, and communication infrastructure required for autonomous weapons are subjected to export controls and end-use verification. Non-state actors cannot build autonomous weapons without controlled components; state actors face accountability through supply chain transparency.",
        lensSnapshot: {
          bigCycle: { phase: "Supply Chain as Governance Mechanism", note: "Hardware control layer as enforcement mechanism for autonomous weapons governance" },
          steep: { primary: "T", secondary: "P", note: "Technology supply chain control as political governance tool" },
          geoEcon: { tool: "Export Controls", note: "Hardware export controls as autonomous weapons governance mechanism" },
          gameTheory: { type: "Chokepoint Control", note: "Physical hardware chokepoints enable governance of digital weapons" }
        },
        secondOrderEffects: ["Non-state actor autonomous weapon capability significantly reduced", "State actors can still develop autonomous weapons with domestic supply chains", "Black market for controlled components develops; imperfect enforcement"],
        historicalAnalog: "Wassenaar Arrangement dual-use export controls; nuclear materials accounting; drone component controls",
        choicePrompt: "With supply chain controls reducing non-state autonomous weapon capability, what residual governance gaps remain?",
        choices: ["aiww-L4-hybrid-governance-regime", "aiww-L4-arms-race-containment"]
      },

      // Layer 4 terminal nodes
      "aiww-L4-governed-ai-era": {
        id: "aiww-L4-governed-ai-era",
        layer: 4,
        type: "terminal",
        title: "AI Wild West Yields to Governed AI Era",
        label: "Governed AI Era",
        narrative: "The AI Wild West, despite its chaos, generates the political will and technical infrastructure to govern AI effectively. Content authentication restores the epistemic commons; autonomous weapons treaties reduce the most dangerous military applications; ZK cryptography secures financial systems. The governance architecture is imperfect and costly — the Wild West produced real harm — but functional.",
        outcome: "GOVERNANCE EMERGES FROM CHAOS",
        outcomeNarrative: "The AI Wild West follows the historical pattern: ungoverned frontiers eventually develop governance, driven by the accumulated cost of ungovernance. The AI governance architecture that emerges from the Wild West is more robust than proactive governance would have been — battle-tested against actual adversarial use — but at significant human cost. The transition from Wild West to governed era takes a decade and causes enormous harm in the interim.",
        finalLensScores: {
          bigCycle: "Ungoverned Disruption → Governed Stability",
          steep: { S: 0.7, T: 0.9, E: 0.7, En: 0.3, P: 0.8 },
          geoEcon: "Alliance Architecture — governance coalition",
          gameTheory: "Costly Governance — harm generates political will for solution"
        },
        historicalAnalog: "Internet governance post-early-chaos; financial regulation post-1929; nuclear governance post-Hiroshima",
        aiPromptSeed: "Model how the governance architecture built during the AI Wild West era performs when AGI-level capabilities arrive — specifically whether the frameworks designed for narrow AI can scale to govern systems that exceed human performance across all domains."
      },

      "aiww-L4-hybrid-governance-regime": {
        id: "aiww-L4-hybrid-governance-regime",
        layer: 4,
        type: "terminal",
        title: "Hybrid AI Governance — Partial Coverage",
        label: "Hybrid Governance",
        narrative: "The Wild West is not fully tamed but partially governed: a patchwork of treaties, standards, and technical controls covers the most dangerous applications while leaving large ungoverned spaces. The information environment remains contested; financial fraud is significantly reduced; autonomous weapons proliferation is slowed but not stopped. The hybrid outcome is unstable — a second crisis wave may force more comprehensive governance or produce collapse.",
        outcome: "PARTIAL GOVERNANCE — UNSTABLE EQUILIBRIUM",
        outcomeNarrative: "The AI Wild West produces partial governance: some of the worst harm vectors are addressed while significant ungoverned space persists. The outcome is more stable than full Wild West but more fragile than comprehensive governance. The next technological discontinuity — AGI, quantum-AI convergence — will test whether partial governance can hold.",
        finalLensScores: {
          bigCycle: "Disruption → Partial Stabilization",
          steep: { S: 0.6, T: 0.8, E: 0.6, En: 0.3, P: 0.7 },
          geoEcon: "Alliance Architecture — partial coverage",
          gameTheory: "Mixed Equilibrium — some domains governed, others not"
        },
        historicalAnalog: "Arms control partial coverage; internet governance gaps; financial regulation coverage gaps",
        aiPromptSeed: "The simulation has reached a partial AI governance outcome. Model how partial governance performs under stress from the next wave of AI capability advances and whether the partial framework can be extended before the next crisis."
      }
    }
  }
];

export default REMAINING_SCENARIOS;
