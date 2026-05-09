// CLUSTER D — AI & TECHNOLOGICAL DISRUPTION
// Scenarios: Open-Source AI Shock, Age of Displacement, AGI Monopoly, AI Wild West, AI Bubble Burst

const AI_SCENARIOS = [

  // ============================================================
  // SCENARIO 7: UNPREDICTABLE ADVANCED AI (OPEN-SOURCE SHOCK)
  // ============================================================
  {
    id: "ai-open-source-shock",
    title: "Unpredictable Advanced AI (The Open-Source Shock)",
    cluster: "ai-tech",
    clusterLabel: "AI & Technological Disruption",
    era: "2025–2032",
    timeHorizon: "medium",
    primaryLens: "steep",
    description: "Highly capable but unpredictable open-source AI models are released publicly, democratizing both beneficial and malicious applications in ways that overwhelm governance architectures.",
    tags: ["AI", "open source", "cybersecurity", "governance", "dual-use", "autonomous systems"],
    aiPromptContext: "You are simulating the Open-Source AI Shock scenario. Apply STEEP lens (T dominant; S, P, E secondary), Big Cycle (technological phase transition), and game theory (public goods problem: AI safety requires collective action; individual actor incentives favor rapid deployment; tragedy of the commons dynamic).",
    rootNodeId: "aios-L0-trigger",
    nodes: {

      "aios-L0-trigger": {
        id: "aios-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Highly Capable Open-Source AI Models Released",
        narrative: "A major AI laboratory releases a frontier-capability model under an open-source license, citing democratization of AI access. Within months, multiple nation-states, criminal organizations, and independent researchers have fine-tuned the model for specialized purposes — some beneficial, many harmful. The model's capabilities exceed any previous open-source release. Existing governance frameworks, designed for slower deployment cycles, cannot adapt quickly enough.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Phase Transition", note: "AI as general-purpose technology triggering new productive paradigm" },
          steep: { primary: "T", secondary: "P", note: "Technology release drives immediate political governance crisis" },
          geoEcon: { tool: "Export Controls", note: "Open-source release renders technology controls largely ineffective" },
          gameTheory: { type: "Tragedy of the Commons", note: "Individual benefit from release; collective cost from misuse; no mechanism to internalize harms" }
        },
        choicePrompt: "How do decentralized actors primarily use the newly available AI capabilities?",
        choices: ["aios-L1-malicious-actors", "aios-L1-beneficial-innovators", "aios-L1-mixed-deployment"]
      },

      "aios-L1-malicious-actors": {
        id: "aios-L1-malicious-actors",
        layer: 1,
        type: "decision",
        title: "Malicious Actors Dominate Initial Deployment",
        label: "Malicious Use Wave",
        narrative: "Criminal organizations, state-sponsored hackers, and extremist groups move faster than researchers. AI-powered cyberattacks on critical infrastructure surge; deepfake disinformation at unprecedented scale floods information ecosystems; autonomous fraud systems operate at speeds no human team can counter. The harms materialize faster than the benefits, which require longer development cycles.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Disruption — Destabilizing", note: "Technology arriving faster than institutional adaptation capacity" },
          steep: { primary: "T", secondary: "S", note: "Technology-enabled harm; social trust systems collapsing" },
          geoEcon: { tool: "Sanctions", note: "Cyber attacks as economic warfare; attribution difficulties prevent retaliation" },
          gameTheory: { type: "Attacker Advantage", note: "Open-source models give attackers same capabilities as defenders" }
        },
        secondOrderEffects: ["Critical infrastructure attacks increase 300%+ from AI-enhanced capabilities", "Insurance markets price out cyber coverage for most businesses", "Public trust in digital systems collapses; digital economy contracts"],
        historicalAnalog: "No direct precedent; closest analogy is early internet worm proliferation scaled by AI capability",
        choicePrompt: "As AI-driven cyberattacks surge, how do governments respond to the security crisis?",
        choices: ["aios-L2-cyber-crackdown", "aios-L2-international-treaty", "aios-L2-technical-countermeasures"]
      },

      "aios-L1-beneficial-innovators": {
        id: "aios-L1-beneficial-innovators",
        layer: 1,
        type: "decision",
        title: "Beneficial Innovation Wave Dominates",
        label: "Beneficial Innovation",
        narrative: "Researchers, medical institutions, materials scientists, and climate technologists leverage the open-source model for breakthroughs that proprietary systems would have kept gated. A new vaccine for a resistant pathogen; a novel battery chemistry; structural discoveries in protein folding. The benefits are concentrated in science-capable institutions while the harms, though real, are manageable.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Prosperity Entry", note: "General-purpose technology driving productivity expansion" },
          steep: { primary: "T", secondary: "E", note: "Technology-driven productivity gains materialize faster than expected" },
          geoEcon: { tool: "Alliance Architecture", note: "Open-source models favor innovation in allied open societies" },
          gameTheory: { type: "Public Goods — Positive", note: "Open-source creates positive externalities; knowledge spillovers benefit all" }
        },
        secondOrderEffects: ["Scientific progress in medicine and materials accelerates by 5–10 years", "Economic productivity gains begin to materialize in 3–5 years", "Nations that restrict AI access fall behind in scientific capacity"],
        historicalAnalog: "Internet-era scientific communication; open-source software development; early web browser release",
        choicePrompt: "With beneficial innovation accelerating, how does society manage rapid integration into critical systems?",
        choices: ["aios-L2-rapid-integration", "aios-L2-managed-deployment", "aios-L2-sector-specific-governance"]
      },

      "aios-L1-mixed-deployment": {
        id: "aios-L1-mixed-deployment",
        layer: 1,
        type: "decision",
        title: "Mixed Deployment — Benefits and Harms Simultaneous",
        label: "Mixed Outcomes",
        narrative: "Reality defies binary framing: beneficial and harmful uses proliferate simultaneously. Scientific breakthroughs are announced the same week as major AI-enabled cyberattacks. The governance challenge is distinguishing, in real time, which applications warrant restriction and which deserve acceleration. Existing regulatory frameworks cannot make this distinction at AI speed.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Disruption — Ambiguous", note: "Net impact unclear; depends on governance quality and adaptation speed" },
          steep: { primary: "T", secondary: "P", note: "Technology ambivalence creates governance crisis" },
          geoEcon: { tool: "Export Controls", note: "Impossible to restrict harmful uses without also restricting beneficial ones" },
          gameTheory: { type: "Multi-Player Complex Game", note: "No dominant strategy; outcomes depend on coordination across many actors" }
        },
        secondOrderEffects: ["Regulatory capture risk: industry shapes governance to favor deployment over safety", "Democratic governance processes too slow; unelected technical bodies gain power", "Nations with better governance infrastructure gain competitive advantage"],
        historicalAnalog: "Nuclear technology: weapons and power simultaneously; genetic technology: therapy and bioweapons simultaneously",
        choicePrompt: "With mixed outcomes demanding real-time governance decisions, what regulatory architecture is deployed?",
        choices: ["aios-L2-risk-tiered-governance", "aios-L2-use-case-licensing", "aios-L2-international-agency"]
      },

      // Layer 2 nodes
      "aios-L2-cyber-crackdown": {
        id: "aios-L2-cyber-crackdown",
        layer: 2,
        type: "decision",
        title: "Draconian Cyber Crackdown — Hardware and Access Restrictions",
        label: "Draconian Crackdown",
        narrative: "Governments impose emergency restrictions: compute hardware requires government licensing; certain model architectures are banned; surveillance of AI development activities is mandated. The crackdown slows harmful deployment but also devastates domestic AI innovation. Dark networks operating in unregulated jurisdictions continue unimpeded.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Overcorrection", note: "Governments respond to tech threat with blunt regulatory instrument" },
          steep: { primary: "P", secondary: "T", note: "Regulatory intervention constrains technology; innovation migrates to less regulated jurisdictions" },
          geoEcon: { tool: "Export Controls", note: "Compute hardware controls as primary access restriction mechanism" },
          gameTheory: { type: "Enforcement Game", note: "Domestic enforcement creates global arbitrage; most harmful actors move offshore" }
        },
        secondOrderEffects: ["Domestic AI industry devastated; innovation emigrates to Singapore, UAE, others", "Authoritarian states exploit regulatory vacuum to advance unencumbered", "Surveillance infrastructure built for AI control becomes general-purpose political control tool"],
        historicalAnalog: "US crypto wars 1990s; attempted export controls on encryption failed; general internet filtering in authoritarian states",
        choicePrompt: "With domestic AI innovation suppressed but harmful actors continuing offshore, how does the government rebuild a functional governance architecture?",
        choices: ["aios-L3-international-coalition", "aios-L3-sanctions-on-compute", "aios-L3-safe-harbor-framework"]
      },

      "aios-L2-rapid-integration": {
        id: "aios-L2-rapid-integration",
        layer: 2,
        type: "decision",
        title: "Rapid Integration into Critical Infrastructure",
        label: "Rapid Integration",
        narrative: "Speed of deployment is treated as a strategic advantage. Healthcare systems, energy grids, financial systems, and logistics networks integrate AI capabilities at the maximum pace technology allows. Productivity gains are dramatic. But the integration creates systemic dependencies — if the underlying AI systems fail or are attacked, cascading failures across critical systems become possible.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Integration — High Velocity", note: "Rapid integration creates new systemic fragility before governance adapts" },
          steep: { primary: "T", secondary: "E", note: "Productivity gains massive; systemic vulnerability created simultaneously" },
          geoEcon: { tool: "Alliance Architecture", note: "Early integration nations gain productivity lead; late movers face disadvantage" },
          gameTheory: { type: "First-Mover Race", note: "Integration speed as competitive advantage creates collective vulnerability" }
        },
        secondOrderEffects: ["Single points of failure emerge in AI-dependent critical infrastructure", "Cyberattack on AI infrastructure becomes tantamount to attack on physical infrastructure", "Nations that integrated slowest prove more resilient to AI infrastructure disruption"],
        historicalAnalog: "Early internet security debt; Y2K as example of systemic integration outpacing security design",
        choicePrompt: "When the first major AI infrastructure failure cascades across multiple systems, how is the crisis managed?",
        choices: ["aios-L3-emergency-isolation", "aios-L3-redundancy-investment", "aios-L3-human-override-protocols"]
      },

      "aios-L2-risk-tiered-governance": {
        id: "aios-L2-risk-tiered-governance",
        layer: 2,
        type: "decision",
        title: "Risk-Tiered AI Governance Architecture",
        label: "Tiered Governance",
        narrative: "Rather than blanket restrictions or blanket permission, a tiered framework assigns regulatory burden proportional to risk level: high-risk applications (critical infrastructure, criminal justice, medical diagnostics) face strict requirements; low-risk applications face light-touch oversight; prohibited uses are enumerated specifically. The architecture attempts to accelerate beneficial uses while managing harmful ones.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Adaptation", note: "Governance innovation attempts to match pace of technological change" },
          steep: { primary: "P", secondary: "T", note: "Regulatory design challenge: define risk in rapidly evolving technology landscape" },
          geoEcon: { tool: "Alliance Architecture", note: "Regulatory harmonization among like-minded nations as competitive advantage" },
          gameTheory: { type: "Mechanism Design", note: "Design governance rules to produce beneficial equilibrium" }
        },
        secondOrderEffects: ["Beneficial innovation accelerates in low-risk categories", "High-risk sectors face compliance costs that favor large incumbents", "International differences in risk classification create arbitrage opportunities"],
        historicalAnalog: "EU AI Act 2024; US AI Executive Order 2023; risk-tiered pharmaceutical regulation as model",
        choicePrompt: "With tiered governance established, how is compliance enforced globally given the open-source nature of the models?",
        choices: ["aios-L3-compute-governance", "aios-L3-deployment-licensing", "aios-L3-liability-framework"]
      },

      // Layer 3 nodes
      "aios-L3-international-coalition": {
        id: "aios-L3-international-coalition",
        layer: 3,
        type: "decision",
        title: "International AI Governance Coalition",
        label: "International Coalition",
        narrative: "A coalition of democratic nations establishes a common AI governance framework: shared compute tracking, coordinated capability evaluations, mutual recognition of safety certifications, and joint enforcement against harmful applications. The coalition excludes authoritarian states, creating a two-tier AI governance world.",
        lensSnapshot: {
          bigCycle: { phase: "Democratic Alliance Formation", note: "Governance challenge drives democratic alliance deepening" },
          steep: { primary: "P", secondary: "T", note: "Governance architecture becomes geopolitical alignment mechanism" },
          geoEcon: { tool: "Alliance Architecture", note: "AI governance as new axis of geopolitical coalition building" },
          gameTheory: { type: "Club Good", note: "Coalition members enjoy governance benefits; non-members face exclusion costs" }
        },
        secondOrderEffects: ["Nations outside coalition face market access restrictions", "Coalition standards become de facto global standard due to market power", "Authoritarian states develop parallel AI governance claiming 'digital sovereignty'"],
        historicalAnalog: "OECD AI Principles; Bletchley Park AI Safety Summit; G7 Hiroshima AI Process",
        choicePrompt: "With the international coalition established, how does it handle divergent national interests on AI development pace?",
        choices: ["aios-L4-binding-treaty", "aios-L4-voluntary-commitments", "aios-L4-mutual-recognition"]
      },

      "aios-L3-compute-governance": {
        id: "aios-L3-compute-governance",
        layer: 3,
        type: "decision",
        title: "Compute Governance as Chokepoint",
        label: "Compute Governance",
        narrative: "Recognizing that AI capability is bottlenecked by compute, governance is designed around the physical hardware layer: data centers require licensing; cloud compute above certain thresholds requires government notification; hardware manufacturers build monitoring capabilities into chips. The compute chokepoint is an enforcement mechanism that open-source model distribution cannot circumvent.",
        lensSnapshot: {
          bigCycle: { phase: "Infrastructure Control", note: "Physical infrastructure as governance lever in digital technology" },
          steep: { primary: "T", secondary: "P", note: "Hardware as governance chokepoint" },
          geoEcon: { tool: "Export Controls", note: "Compute governance as export control on AI capability" },
          gameTheory: { type: "Chokepoint Control", note: "Controlling physical constraint controls capability regardless of software proliferation" }
        },
        secondOrderEffects: ["Small-scale hardware hoarding begins to undermine monitoring", "Quantum computing emergence may eventually break compute bottleneck", "Nations with domestic chip manufacturing have governance advantage"],
        historicalAnalog: "US semiconductor export controls 2022–2024; NVIDIA H100 restrictions; compute as strategic asset",
        choicePrompt: "With compute governance in place, how is the framework adapted as AI becomes more compute-efficient?",
        choices: ["aios-L4-algorithmic-efficiency-controls", "aios-L4-outcome-based-monitoring", "aios-L4-international-compute-registry"]
      },

      // Layer 4 terminal nodes
      "aios-L4-binding-treaty": {
        id: "aios-L4-binding-treaty",
        layer: 4,
        type: "terminal",
        title: "Binding International AI Treaty",
        label: "Binding Treaty",
        narrative: "The international coalition achieves a binding treaty: enumerated prohibited applications, shared safety standards, mutual inspection rights, and a dispute resolution mechanism. The treaty is the most significant arms control agreement since the Nuclear Non-Proliferation Treaty and faces similar enforcement challenges.",
        outcome: "INTERNATIONAL AI GOVERNANCE — TREATY ARCHITECTURE",
        outcomeNarrative: "The binding treaty establishes a framework that successfully slows the most dangerous AI applications while preserving space for beneficial innovation. Enforcement is imperfect — several major states remain outside the treaty — but the framework shifts the default from unrestricted development to presumptive governance. The precedent reshapes AI development trajectories globally.",
        finalLensScores: {
          bigCycle: "Institutional Innovation → New Governance Cycle",
          steep: { S: 0.6, T: 0.9, E: 0.5, En: 0.3, P: 1.0 },
          geoEcon: "Alliance Architecture — binding multilateral governance",
          gameTheory: "Cooperative Game — binding rules overcome collective action failure"
        },
        historicalAnalog: "NPT 1968; Chemical Weapons Convention 1993; limitations and achievements of arms control as model",
        aiPromptSeed: "The simulation has reached a binding AI treaty outcome. Model how the treaty architecture evolves as AI capabilities continue to advance, focusing on verification challenges, the role of non-signatory states (particularly China), and the emergence of AGI as a potential treaty-breaking technology."
      },

      "aios-L4-outcome-based-monitoring": {
        id: "aios-L4-outcome-based-monitoring",
        layer: 4,
        type: "terminal",
        title: "Outcome-Based AI Monitoring Architecture",
        label: "Outcome Monitoring",
        narrative: "Rather than trying to control inputs (which become less effective as models become more efficient), governance shifts to monitoring outcomes: AI-enabled harm incidents are tracked, attributed, and respond to with liability mechanisms. The architecture incentivizes safety investment by making harms costly to those responsible.",
        outcome: "LIABILITY-BASED AI GOVERNANCE",
        outcomeNarrative: "Outcome-based monitoring creates stronger incentives for safety investment than prescriptive rules that can be gamed. Companies and governments that deploy AI are held liable for harms, creating powerful incentives to invest in safety measures. The architecture is more adaptable than prescriptive rules as technology evolves but requires functional legal systems and clear attribution capabilities.",
        finalLensScores: {
          bigCycle: "Market-Mediated Governance → Stable",
          steep: { S: 0.5, T: 0.8, E: 0.7, En: 0.2, P: 0.7 },
          geoEcon: "Institutional Architecture — liability as governance mechanism",
          gameTheory: "Mechanism Design — incentive-compatible governance"
        },
        historicalAnalog: "Product liability law for physical products; GDPR for data; environmental liability frameworks",
        aiPromptSeed: "Model how outcome-based AI liability frameworks interact with insurance markets, corporate risk management, and international jurisdictional differences. How do these frameworks apply when AI-enabled harms cross national borders?"
      }
    }
  },

  // ============================================================
  // SCENARIO 8: AI DISRUPTS THE WORKFORCE (AGE OF DISPLACEMENT)
  // ============================================================
  {
    id: "ai-displacement",
    title: "AI Disrupts the Workforce (The Age of Displacement)",
    cluster: "ai-tech",
    clusterLabel: "AI & Technological Disruption",
    era: "2025–2035",
    timeHorizon: "medium",
    primaryLens: "steep",
    description: "Narrow but highly capable AI systems are widely deployed across business sectors, producing massive corporate profits while outpacing human adaptation and causing structural unemployment.",
    tags: ["AI", "automation", "structural unemployment", "UBI", "social unrest", "wealth concentration"],
    aiPromptContext: "You are simulating the Age of Displacement scenario. Apply STEEP lens (T and E dominant; S cascading), Big Cycle (technological productivity gains; wealth concentration; internal conflict dynamics), and game theory (firms face automation competition game; workers face coordination problems; governments face fiscal tradeoffs).",
    rootNodeId: "aid-L0-trigger",
    nodes: {

      "aid-L0-trigger": {
        id: "aid-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Capable Narrow AI Rapidly Deployed Across Sectors",
        narrative: "Within a three-year window, AI systems capable of performing 50–70% of knowledge worker tasks at professional quality are deployed across finance, legal, medical diagnostics, customer service, software development, content creation, and administrative functions. The productivity gains are real and massive — corporate profits surge. But the displacement rate exceeds any previous technological transition in speed. Training and redeployment cannot absorb workers at the pace they are displaced.",
        lensSnapshot: {
          bigCycle: { phase: "Productive Technology — Disruptive Phase", note: "Technology increases total wealth but concentrates gains; Big Cycle internal conflict dynamics activate" },
          steep: { primary: "T", secondary: "E", note: "Technology-driven productivity; economic concentration" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Tax and redistribution policy becomes core geopolitical question" },
          gameTheory: { type: "Prisoner's Dilemma — Automation Race", note: "Each firm must automate or lose to competitors who do; collectively all lose in consumer demand collapse" }
        },
        choicePrompt: "How do corporations manage the labor transition driven by AI automation?",
        choices: ["aid-L1-aggressive-automation", "aid-L1-managed-transition", "aid-L1-hybrid-augmentation"]
      },

      "aid-L1-aggressive-automation": {
        id: "aid-L1-aggressive-automation",
        layer: 1,
        type: "decision",
        title: "Aggressive Automation — Replace Labor to Maximize Productivity",
        label: "Aggressive Automation",
        narrative: "Corporations, responding to competitive pressure and shareholder demands, deploy AI automation at maximum speed. Headcount reductions are announced quarterly; entire job categories disappear within months rather than years. Productivity metrics soar; stock prices surge; executive compensation reaches new records. But the displaced workers are not being absorbed by new sectors at the rate the models predicted.",
        lensSnapshot: {
          bigCycle: { phase: "Capital-Labor Imbalance Peak", note: "Automation concentrates gains in capital; labor share of income falls historically" },
          steep: { primary: "E", secondary: "S", note: "Economic gains to capital; social disruption from displacement" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Tax policy becomes the redistribution battleground" },
          gameTheory: { type: "Defection from Social Contract", note: "Firms defect from implicit employment obligation; collective demand base erodes" }
        },
        secondOrderEffects: ["Consumer spending contracts as middle-class employment collapses", "Political pressure for automation taxes surges", "Social unrest and political extremism increase as displacement outpaces adaptation"],
        historicalAnalog: "No direct historical parallel at this scale; echoes of 1930s mechanization of agriculture",
        choicePrompt: "With structural unemployment rising and consumer demand contracting, how does the macroeconomy respond?",
        choices: ["aid-L2-demand-collapse", "aid-L2-ubi-experiment", "aid-L2-automation-tax"]
      },

      "aid-L1-managed-transition": {
        id: "aid-L1-managed-transition",
        layer: 1,
        type: "decision",
        title: "Managed Transition — Reskilling and Gradual Deployment",
        label: "Managed Transition",
        narrative: "A coalition of major firms, under government pressure and genuine concern about social stability, commits to managed deployment timelines: AI displaces roles as they naturally turn over (retirement, voluntary departure) rather than through mass layoffs; reskilling investments are made; transition support is provided. The productivity gains are slower to materialize but the social dislocation is significantly reduced.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Technological Transition", note: "Deliberate pace allows institutional adaptation to match technological change" },
          steep: { primary: "T", secondary: "S", note: "Managed technology transition reduces social disruption" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Public-private reskilling investment as social stability investment" },
          gameTheory: { type: "Cooperative Game", note: "Firms coordinate on managed transition; collective outcome better than race to automate" }
        },
        secondOrderEffects: ["Productivity gains materialize 2–3 years later than aggressive automation", "Social stability maintained; political extremism does not surge", "Competitive disadvantage vs. nations pursuing aggressive automation"],
        historicalAnalog: "Post-war managed automation in manufacturing; German Kurzarbeit short-time work schemes",
        choicePrompt: "With managed transition preserving social stability but creating competitive disadvantage, how does the nation maintain economic competitiveness?",
        choices: ["aid-L2-industrial-coordination", "aid-L2-innovation-investment", "aid-L2-selective-automation"]
      },

      // Layer 2 nodes
      "aid-L2-demand-collapse": {
        id: "aid-L2-demand-collapse",
        layer: 2,
        type: "decision",
        title: "Demand Collapse — Consumer Purchasing Power Destruction",
        label: "Demand Collapse",
        narrative: "The structural unemployment from aggressive automation removes the consumer base that the AI-driven productivity gains were supposed to serve. Firms discover that maximizing automation while the consumer class exists on depleted savings and safety net payments is not a sustainable growth model. Revenue growth stalls despite productivity gains. The AI financial bubble shows first signs of stress.",
        lensSnapshot: {
          bigCycle: { phase: "Internal Conflict — Economic", note: "Wealth concentration destroys the consumer base; Big Cycle internal conflict activates" },
          steep: { primary: "E", secondary: "S", note: "Macroeconomic demand destruction; social unrest building" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State redistribution becomes existential economic requirement" },
          gameTheory: { type: "Collective Action Failure", note: "Each firm maximizes individual automation; collectively destroys the demand base" }
        },
        secondOrderEffects: ["Corporate revenues begin to fall despite productivity gains", "Financial markets reprice AI stocks as revenue growth fails to materialize", "Political window opens for transformative economic policy"],
        historicalAnalog: "Henry Ford's $5 day as recognition that workers must be consumers; Great Depression demand destruction parallels",
        choicePrompt: "As demand collapse threatens the AI economy itself, what transformative economic policy is deployed?",
        choices: ["aid-L3-capital-gains-tax", "aid-L3-robot-tax", "aid-L3-sovereign-wealth-fund"]
      },

      "aid-L2-ubi-experiment": {
        id: "aid-L2-ubi-experiment",
        layer: 2,
        type: "decision",
        title: "Universal Basic Income as Economic Architecture",
        label: "UBI Implementation",
        narrative: "Several nations deploy genuine Universal Basic Income at scale — not as a pilot but as permanent economic architecture. The UBI is funded through a combination of automation taxes and capital gains levies. The immediate effect is demand stabilization — consumer spending holds as labor income is replaced. But the fiscal cost is enormous, and the geopolitical pressure from corporate capital flight is intense.",
        lensSnapshot: {
          bigCycle: { phase: "Redistribution Imperative", note: "AI-era wealth redistribution as new social contract requirement" },
          steep: { primary: "E", secondary: "S", note: "Universal income floor maintains consumer demand; social stability preserved" },
          geoEcon: { tool: "Fiscal Statecraft", note: "UBI as fiscal mechanism for distributing AI productivity gains" },
          gameTheory: { type: "Redistribution Game", note: "Capital vs. labor political economy; corporations threaten exit" }
        },
        secondOrderEffects: ["Capital flight to low-tax jurisdictions accelerates", "Demand stabilizes; consumer economy functions despite employment disruption", "Labor bargaining power shifts — workers can decline unfavorable terms"],
        historicalAnalog: "Finland UBI pilot; Stockton SEED program; Alaska Permanent Fund as partial model",
        choicePrompt: "With UBI stabilizing demand but corporate capital fleeing, how does the government prevent tax base erosion?",
        choices: ["aid-L3-international-tax-coordination", "aid-L3-capital-controls", "aid-L3-domestic-wealth-tax"]
      },

      // Layer 3 nodes
      "aid-L3-sovereign-wealth-fund": {
        id: "aid-L3-sovereign-wealth-fund",
        layer: 3,
        type: "decision",
        title: "AI Sovereign Wealth Fund — Collective Ownership Model",
        label: "Sovereign Wealth Fund",
        narrative: "Rather than taxing AI profits after the fact, the government takes equity stakes in AI-developing companies through a sovereign wealth fund model. As AI companies generate returns, the fund distributes dividends to all citizens. The model creates collective ownership of the AI economy without nationalization.",
        lensSnapshot: {
          bigCycle: { phase: "New Ownership Architecture", note: "Collective ownership model as alternative to redistribution via taxation" },
          steep: { primary: "E", secondary: "P", note: "Economic ownership model as political settlement" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Equity stake model as long-term revenue mechanism" },
          gameTheory: { type: "Equity Game", note: "Collective ownership aligns incentives between capital and citizens" }
        },
        secondOrderEffects: ["Citizens become financially invested in AI success, reducing political opposition", "Competitive pressure on companies reduced as state becomes large shareholder", "Model requires regulatory framework to prevent capture of the fund"],
        historicalAnalog: "Norwegian Government Pension Fund; Alaska Permanent Fund; Singaporean GIC/Temasek model",
        choicePrompt: "With a sovereign AI fund established, how is governance structured to prevent political capture of the fund's investment decisions?",
        choices: ["aid-L4-independent-fund-governance", "aid-L4-democratic-allocation", "aid-L4-expert-committee"]
      },

      "aid-L3-international-tax-coordination": {
        id: "aid-L3-international-tax-coordination",
        layer: 3,
        type: "decision",
        title: "International AI Economy Tax Coordination",
        label: "International Tax Coordination",
        narrative: "Nations implementing AI-economy redistribution programs negotiate a coordinated minimum automation tax to prevent capital flight arbitrage. The precedent of OECD global minimum corporate tax (Pillar Two) provides a framework. The negotiation is contentious — tax haven nations resist — but a coalition of major markets achieves sufficient coverage to prevent destabilizing capital flight.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Coordination", note: "International cooperation on taxation as governance requirement of AI economy" },
          steep: { primary: "P", secondary: "E", note: "International political economy of AI taxation" },
          geoEcon: { tool: "Alliance Architecture", note: "Tax coordination as multilateral economic governance" },
          gameTheory: { type: "Coalition Game", note: "Major market coordination can prevent free-rider exploitation by tax havens" }
        },
        secondOrderEffects: ["Capital flight significantly reduced among coordinating nations", "Small tax haven nations face pressure to join or face exclusion from major markets", "Revenue available for redistribution programs is stabilized"],
        historicalAnalog: "OECD Pillar Two global minimum corporate tax 2021; FATCA extraterritorial tax enforcement",
        choicePrompt: "With international tax coordination achieved, how are the resulting revenues deployed to address the displacement crisis?",
        choices: ["aid-L4-global-retraining-fund", "aid-L4-basic-income-distribution", "aid-L4-public-infrastructure"]
      },

      // Layer 4 terminal nodes
      "aid-L4-independent-fund-governance": {
        id: "aid-L4-independent-fund-governance",
        layer: 4,
        type: "terminal",
        title: "Independently Governed AI Wealth Fund",
        label: "Independent Fund Governance",
        narrative: "The sovereign AI fund is governed by an independent board with clear investment mandates and transparent reporting requirements, insulated from short-term political cycles. The governance model is closer to a central bank than a government ministry — technical independence within a democratic mandate.",
        outcome: "COLLECTIVE AI WEALTH — GOVERNED DISTRIBUTION",
        outcomeNarrative: "The independently governed AI wealth fund becomes the primary mechanism for distributing AI economic gains broadly. Citizens receive dividends as AI productivity grows. The model successfully navigates the political economy of AI-era wealth concentration and provides a replicable template for other nations. The displacement crisis is managed, not solved — some disruption persists — but the worst outcomes are averted.",
        finalLensScores: {
          bigCycle: "Managed Transition → New Stable Cycle",
          steep: { S: 0.7, T: 0.8, E: 0.9, En: 0.3, P: 0.8 },
          geoEcon: "Fiscal Statecraft — collective ownership model",
          gameTheory: "Cooperative Settlement — distributes AI gains without zero-sum conflict"
        },
        historicalAnalog: "Norwegian Petroleum Fund governance model; Singapore sovereign wealth fund structure",
        aiPromptSeed: "The simulation has reached a collectively governed AI wealth fund outcome. Model how this distribution architecture evolves as AI capabilities increase toward AGI, and how it interacts with international competitive pressures and the transition to a post-scarcity economy in certain domains."
      },

      "aid-L4-global-retraining-fund": {
        id: "aid-L4-global-retraining-fund",
        layer: 4,
        type: "terminal",
        title: "Global AI Transition Retraining Fund",
        label: "Global Retraining Fund",
        narrative: "International tax revenues are channeled into a global retraining and transition fund — the largest skills investment program in history. Displaced workers across member nations receive income support, skills training for AI-adjacent roles, and transition assistance. The fund proves most effective for workers in their 20s–40s; older workers near retirement age receive enhanced pension bridges instead.",
        outcome: "MANAGED HUMAN CAPITAL TRANSITION",
        outcomeNarrative: "The global retraining fund successfully manages the transition for younger displaced workers and those in adaptable roles. It cannot fully solve the displacement crisis for workers in roles with no adjacent AI-proof alternative. But it reduces the worst social outcomes, maintains political stability in participating nations, and creates a template for managing future technological transitions.",
        finalLensScores: {
          bigCycle: "Managed Transition — Partial Success",
          steep: { S: 0.8, T: 0.7, E: 0.7, En: 0.2, P: 0.8 },
          geoEcon: "Fiscal Statecraft — international redistribution mechanism",
          gameTheory: "Cooperative International Game — collective action on global public good"
        },
        historicalAnalog: "Marshall Plan as large-scale coordinated economic transition investment; EU structural funds model",
        aiPromptSeed: "Model how a global AI transition fund evolves as AGI approaches, particularly around the question of which human roles remain economically viable in an AGI economy and how the education system restructures itself for an AI-abundant world."
      }
    }
  },

  // ============================================================
  // SCENARIO 9: AI DISAPPOINTS (THE BURSTING BUBBLE)
  // ============================================================
  {
    id: "ai-bubble-burst",
    title: "AI Disappoints (The Bursting Bubble)",
    cluster: "ai-tech",
    clusterLabel: "AI & Technological Disruption",
    era: "2026–2030",
    timeHorizon: "near-term",
    primaryLens: "bigCycle",
    description: "AI capabilities plateau without delivering expected productivity gains, disillusioning investors who pull funding, triggering a financial crisis and a pivot toward alternative emerging technologies.",
    tags: ["AI bubble", "financial crisis", "hyperscalers", "quantum computing", "capital allocation", "tech recession"],
    aiPromptContext: "You are simulating the AI bubble burst scenario. Apply Big Cycle lens (asset price bubble deflation; credit cycle contraction), STEEP (E and T dominant), and game theory (market coordination problems; investor exit game; central bank intervention decision).",
    rootNodeId: "aibb-L0-trigger",
    nodes: {

      "aibb-L0-trigger": {
        id: "aibb-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "AI Capabilities Plateau — Productivity Gains Fail to Materialize",
        narrative: "After three years of extraordinary capital investment — over $2 trillion in AI infrastructure across hyperscalers — the productivity inflection that justified the investment fails to materialize at scale. AI systems prove unreliable for high-stakes autonomous operation; hallucination rates in enterprise deployment prove too costly; energy consumption per useful output continues rising. Investors begin to realize that current AI architectures may be approaching a capability ceiling. The AI trade unwinds.",
        lensSnapshot: {
          bigCycle: { phase: "Bubble Deflation", note: "Asset price cycle: euphoria, overinvestment, disappointment, contraction" },
          steep: { primary: "T", secondary: "E", note: "Technology disappointment triggers financial market repricing" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Question is whether state intervention can prevent financial crisis cascade" },
          gameTheory: { type: "Exit Game", note: "Each investor tries to exit first; collective exit is self-reinforcing" }
        },
        choicePrompt: "As AI investment thesis collapses, how do investors respond to the emerging evidence?",
        choices: ["aibb-L1-mass-divestment", "aibb-L1-strategic-pivot", "aibb-L1-defensive-holding"]
      },

      "aibb-L1-mass-divestment": {
        id: "aibb-L1-mass-divestment",
        layer: 1,
        type: "decision",
        title: "Mass Divestment — AI Stock Bubble Bursts",
        label: "Mass Divestment",
        narrative: "Institutional investors move simultaneously to reduce AI exposure. The highly concentrated positions in NVIDIA, Microsoft, Google, Amazon, and Meta unwind in weeks. The Nasdaq-equivalent loses 40–60% of peak value. Hyperscalers that had borrowed $120 billion+ in bonds to fund AI infrastructure suddenly face debt servicing on assets generating far lower returns than projected. Credit ratings are cut; bond spreads widen.",
        lensSnapshot: {
          bigCycle: { phase: "Debt Deflation Entry", note: "Over-leveraged technology firms face debt servicing crisis" },
          steep: { primary: "E", secondary: "T", note: "Financial market repricing cascades through economy" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Central bank emergency intervention decision becomes critical" },
          gameTheory: { type: "Panic Exit — Self-Fulfilling", note: "Exit pressure is self-reinforcing; first movers gain, last movers lose everything" }
        },
        secondOrderEffects: ["$15–20 trillion in market capitalization erased globally", "Credit freeze in technology sector; startup funding collapses", "Pension funds with AI equity exposure face significant losses"],
        historicalAnalog: "Dot-com crash 2000–2002; $5 trillion market cap erasure; Cisco, Intel, Amazon fell 80–90%",
        choicePrompt: "As the AI stock bubble bursts and hyperscalers face debt servicing crisis, how does the financial system respond?",
        choices: ["aibb-L2-let-fail", "aibb-L2-central-bank-bailout", "aibb-L2-orderly-restructuring"]
      },

      "aibb-L1-strategic-pivot": {
        id: "aibb-L1-strategic-pivot",
        layer: 1,
        type: "decision",
        title: "Strategic Capital Pivot to Hard Tech",
        label: "Strategic Pivot",
        narrative: "Rather than panic selling, sophisticated investors recognize the AI plateau as a sector rotation signal. Capital pivots toward genuinely deep technology: quantum computing, nuclear fusion, advanced materials, synthetic biology. The AI bubble deflates without becoming a financial crisis — the rotation is managed, the capital is redeployed rather than destroyed.",
        lensSnapshot: {
          bigCycle: { phase: "Sector Rotation — Managed", note: "Capital cycle rotates between technology sectors; overall financial system intact" },
          steep: { primary: "T", secondary: "E", note: "Capital reallocation toward next technological wave" },
          geoEcon: { tool: "Alliance Architecture", note: "Nations with strong hard-tech foundations attract rotated capital" },
          gameTheory: { type: "Information Game", note: "Investors with better information about next technology wave gain; slower movers lose" }
        },
        secondOrderEffects: ["AI sector valuations fall 40–60% but without broader financial crisis", "Quantum computing and fusion startups receive dramatic funding increases", "AI investment continues at sustainable levels in genuinely useful applications"],
        historicalAnalog: "Dot-com rotation to cloud 2003–2008; biotech sector rotation patterns",
        choicePrompt: "With capital pivoting to hard tech, how do governments support the next technology wave?",
        choices: ["aibb-L2-state-industrial-policy", "aibb-L2-basic-research-investment", "aibb-L2-public-private-partnerships"]
      },

      "aibb-L1-defensive-holding": {
        id: "aibb-L1-defensive-holding",
        layer: 1,
        type: "decision",
        title: "Defensive Holding — Wait for AI Recovery",
        label: "Defensive Hold",
        narrative: "Large institutional investors, locked into positions too large to exit without causing the crash they fear, hold their AI exposure and attempt to manage down gradually. The slow-motion deflation is less catastrophic than a sudden crash but creates years of uncertainty that depresses all technology investment.",
        lensSnapshot: {
          bigCycle: { phase: "Slow Deflation", note: "Gradual repricing less damaging than sudden crash but more prolonged" },
          steep: { primary: "E", secondary: "T", note: "Uncertainty suppresses investment across technology sector" },
          geoEcon: { tool: "Monetary Policy", note: "Central banks face choice of supporting valuations or allowing correction" },
          gameTheory: { type: "Coordination Failure", note: "Holders want others to sell first; collective holding creates zombie valuations" }
        },
        secondOrderEffects: ["Investment in next technology waves delayed as capital tied in AI positions", "Zombie AI companies keep talent and capital tied up unproductively", "Recovery eventually comes but 3–5 years later than the strategic pivot path"],
        historicalAnalog: "Japanese banks holding bad assets post-1990 bubble; zombie firm phenomenon of 1990s",
        choicePrompt: "With a slow-motion deflation and zombie AI sector, what policy intervention can restart growth?",
        choices: ["aibb-L2-regulatory-cleanup", "aibb-L2-forced-write-downs", "aibb-L2-new-growth-narrative"]
      },

      // Layer 2 nodes
      "aibb-L2-let-fail": {
        id: "aibb-L2-let-fail",
        layer: 2,
        type: "decision",
        title: "Let Hyperscalers Fail — Market Clearing",
        label: "Market Clearing",
        narrative: "Central banks and governments allow the over-leveraged hyperscalers to default on their bonds, enter bankruptcy restructuring, and be broken up or sold at distressed prices. The shock is severe — the $120 billion+ in bonds held by pension funds and insurance companies generates a credit wave — but the market is cleared of malinvestment faster.",
        lensSnapshot: {
          bigCycle: { phase: "Debt Deflation — Forced Clearing", note: "Market forces clear the debt cycle; painful but complete" },
          steep: { primary: "E", secondary: "P", note: "Deep recession from financial crisis; political backlash intense" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Government allows market clearing rather than intervening" },
          gameTheory: { type: "Commitment Device", note: "No-bailout commitment reduces future moral hazard" }
        },
        secondOrderEffects: ["Recession depth depends on credit cascade containment", "AI talent and infrastructure absorbed by smaller, more efficient players", "Long-term moral hazard significantly reduced; future investment more disciplined"],
        historicalAnalog: "Lehman Brothers allowed to fail 2008; subsequent financial cascade; Enron collapse; WorldCom bankruptcy",
        choicePrompt: "With hyperscalers failing and credit cascading, what emergency financial containment measures are deployed?",
        choices: ["aibb-L3-emergency-credit-facilities", "aibb-L3-depositor-protection", "aibb-L3-international-coordination"]
      },

      "aibb-L2-state-industrial-policy": {
        id: "aibb-L2-state-industrial-policy",
        layer: 2,
        type: "decision",
        title: "State-Directed Investment in Next-Gen Technology",
        label: "State Industrial Policy",
        narrative: "Governments step into the investment vacuum left by deflating private AI capital with explicit industrial policy: large-scale public investment in quantum computing, nuclear fusion research, advanced materials, and synthetic biology. The policy accepts that certain technology bets require longer time horizons than private markets can sustain.",
        lensSnapshot: {
          bigCycle: { phase: "State-Led Technology Renewal", note: "State investment bridges technology cycles" },
          steep: { primary: "T", secondary: "P", note: "Public investment in deep technology as industrial policy" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State capital filling private market gap in long-horizon technology" },
          gameTheory: { type: "Long-Horizon Investment", note: "State can hold long-term positions that private capital cannot" }
        },
        secondOrderEffects: ["10–15 year technology frontier pushed forward by sustained public investment", "Nations with strong public research capacity gain competitive advantage", "Private venture capital eventually co-invests as technologies mature"],
        historicalAnalog: "DARPA model; Manhattan Project; Human Genome Project; Apollo Program as precedents for state-directed deep tech",
        choicePrompt: "With state technology investment established, how is the transition from public to private-led development managed?",
        choices: ["aibb-L3-tech-transfer-mechanism", "aibb-L3-public-private-spinout", "aibb-L3-sovereign-tech-ownership"]
      },

      // Layer 3 nodes
      "aibb-L3-emergency-credit-facilities": {
        id: "aibb-L3-emergency-credit-facilities",
        layer: 3,
        type: "decision",
        title: "Emergency Central Bank Credit Facilities",
        label: "Emergency Credit Facilities",
        narrative: "Central banks deploy emergency credit facilities specifically for the technology sector — buying tech sector corporate bonds, providing emergency liquidity to distressed but systemically important firms. The intervention prevents the worst cascades but absorbs bad tech debt onto the public balance sheet.",
        lensSnapshot: {
          bigCycle: { phase: "Emergency Intervention", note: "Central bank prevents debt deflation spiral at cost of moral hazard" },
          steep: { primary: "E", secondary: "P", note: "Emergency intervention maintains financial system; moral hazard cost" },
          geoEcon: { tool: "Monetary Policy", note: "Central bank balance sheet expansion to absorb technology sector losses" },
          gameTheory: { type: "Too Important to Fail", note: "Systemic interconnection forces intervention; moral hazard reinforced' }
        },
        secondOrderEffects: ["Recession limited to mild contraction rather than deep crisis", "Moral hazard: technology investors expect future bailouts; discipline deteriorates", "Central bank balance sheet expands further; eventual normalization more difficult"],
        historicalAnalog: "Fed corporate bond buying during COVID 2020; ECB targeted longer-term refinancing operations; Japan BOJ asset purchases",
        choicePrompt: "With emergency facilities preventing crisis but moral hazard elevated, what regulatory reforms accompany the intervention?",
        choices: ["aibb-L4-technology-sector-regulation", "aibb-L4-leverage-limits", "aibb-L4-future-bailout-prohibition"]
      },

      "aibb-L3-tech-transfer-mechanism": {
        id: "aibb-L3-tech-transfer-mechanism",
        layer: 3,
        type: "decision",
        title: "Structured Technology Transfer to Private Sector",
        label: "Tech Transfer",
        narrative: "A structured mechanism transfers publicly developed technologies to private companies through licensing, spinouts, and public-private partnerships. The state retains equity stakes in spinout companies; licensing revenues fund the next generation of research. The model creates a sustainable public technology pipeline that self-funds over time.",
        lensSnapshot: {
          bigCycle: { phase: "Technology Cycle Renewal", note: "Structured transition from public to private-led technology development" },
          steep: { primary: "T", secondary: "E", note: "Technology pipeline creates sustained innovation stream" },
          geoEcon: { tool: "Alliance Architecture", note: "Technology transfer mechanisms as new form of industrial diplomacy" },
          gameTheory: { type: "Cooperative Investment Game", note: "State and private sector cooperate on complementary roles in technology development' }
        },
        secondOrderEffects: ["Sustainable public research funding through licensing revenues", "Private sector gains access to breakthrough technologies faster than internal R&D would produce", "Small and medium firms gain technology access previously only available to large incumbents"],
        historicalAnalog: "Bayh-Dole Act 1980; US technology transfer from national labs; Fraunhofer Institutes in Germany",
        choicePrompt: "With the technology transfer mechanism established, which specific next-generation technologies show the most near-term commercial promise?",
        choices: ["aibb-L4-quantum-commercial", "aibb-L4-fusion-power", "aibb-L4-advanced-biotech"]
      },

      // Layer 4 terminal nodes
      "aibb-L4-quantum-commercial": {
        id: "aibb-L4-quantum-commercial",
        layer: 4,
        type: "terminal",
        title: "Quantum Computing Reaches Commercial Viability",
        label: "Quantum Commercial",
        narrative: "The capital pivot from AI to quantum computing, sustained by both public investment and private capital, accelerates progress toward fault-tolerant quantum computing. Within five years of the AI bubble burst, quantum computers achieve commercial viability for specific problem classes: drug discovery, materials simulation, financial optimization, and cryptography.",
        outcome: "QUANTUM TECHNOLOGY COMMERCIAL BREAKTHROUGH",
        outcomeNarrative: "The AI bubble burst, though painful in the short term, catalyzes the reallocation of resources to deep technology with more durable commercial applications. Quantum computing reaches commercial viability and begins to deliver genuine productivity gains — the kind the AI hype cycle promised but could not deliver at the timeline the market priced in. The technology transition is slower than hoped but more real.",
        finalLensScores: {
          bigCycle: "Technology Cycle Reset → New Productive Expansion",
          steep: { S: 0.4, T: 1.0, E: 0.7, En: 0.3, P: 0.5 },
          geoEcon: "Technological Leadership — quantum era begins",
          gameTheory: "Long-term Investment Payoff — patient capital rewarded"
        },
        historicalAnalog: "Internet crash → mobile and cloud boom; no precise quantum analogy exists yet",
        aiPromptSeed: "The simulation has reached a quantum commercial breakthrough outcome. Model how quantum computing capabilities reshape industries starting with drug discovery and materials science, and how they intersect with AI — particularly whether quantum AI represents the next wave after the narrow AI plateau."
      },

      "aibb-L4-technology-sector-regulation": {
        id: "aibb-L4-technology-sector-regulation",
        layer: 4,
        type: "terminal",
        title: "Technology Sector Prudential Regulation",
        label: "Tech Sector Regulation",
        narrative: "Post-crisis, systemically important technology companies are subjected to prudential regulatory requirements analogous to banking regulation: leverage limits, stress tests, resolution planning, and concentration restrictions. The regulatory framework treats large technology platforms as systemically important to the digital economy.",
        outcome: "SYSTEMICALLY IMPORTANT TECHNOLOGY REGULATION",
        outcomeNarrative: "Technology companies above certain systemically important thresholds are regulated as financial institutions were post-2008. The regulation reduces risk-taking and leverage in the sector but also reduces innovation velocity. The tradeoff between stability and dynamism becomes the central policy debate of the next technology cycle.",
        finalLensScores: {
          bigCycle: "Institutional Renovation → Stable Tech Sector",
          steep: { S: 0.3, T: 0.6, E: 0.7, En: 0.2, P: 0.9 },
          geoEcon: "Institutional Architecture — tech sector prudential regulation",
          gameTheory: "New Rules Game — systemically important status changes firm behavior"
        },
        historicalAnalog: "Post-2008 SIFI designation for banks; Dodd-Frank systemic risk framework; proposed tech SIFI equivalents",
        aiPromptSeed: "Model how technology sector prudential regulation interacts with US-China technology competition, particularly whether regulatory burdens on US tech firms disadvantage them relative to Chinese counterparts operating under different regulatory constraints."
      }
    }
  }
];

export default AI_SCENARIOS;
