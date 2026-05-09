// CLUSTER B — SYSTEMIC RISK TYPOLOGIES
// Cluster C — GEOECONOMIC ORDERS
// Scenarios: GFC 2008, Black Swan, Gray Rhino, IMF Energy Matrix, Bipolar Economy, Fragmented Stagnation, Tech-Driven Realignment, Cislunar Geopolitics

const SYSTEMIC_SCENARIOS = [

  // ============================================================
  // SCENARIO 3: 2008 GLOBAL FINANCIAL CRISIS
  // ============================================================
  {
    id: "gfc-2008",
    title: "The 2008 Global Financial Crisis",
    cluster: "systemic",
    clusterLabel: "Systemic Risk Typologies",
    era: "2008–2012",
    timeHorizon: "near-term",
    primaryLens: "bigCycle",
    description: "The collapse of the US housing bubble and major financial institutions triggers a massive global demand shock, liquidity freeze, and the deepest recession since the 1930s.",
    tags: ["financial crisis", "housing bubble", "demand shock", "stimulus", "austerity", "contagion"],
    aiPromptContext: "You are simulating the 2008 Global Financial Crisis. Apply Big Cycle lens (US at peak of debt supercycle; private sector deleveraging; reserve currency under stress), STEEP analysis (E dominant with T and P secondary), and game theory (coordination problems in bank recapitalization; prisoner's dilemma in fiscal stimulus sequencing).",
    rootNodeId: "gfc08-L0-trigger",
    nodes: {

      "gfc08-L0-trigger": {
        id: "gfc08-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Lehman Brothers Collapse — Global Liquidity Freeze",
        narrative: "September 15, 2008: Lehman Brothers files for bankruptcy — the largest in US history. Within 48 hours, the $3.8 trillion money market fund industry faces a run. Interbank lending freezes globally as counterparty risk becomes unquantifiable. The shadow banking system, which had silently become as large as the regulated banking system, collapses without a lender of last resort. Export-heavy economies face a simultaneous credit crunch and demand collapse.",
        lensSnapshot: {
          bigCycle: { phase: "Debt Supercycle Peak", note: "Private debt/GDP at historic highs; deleveraging becomes inevitable" },
          steep: { primary: "E", secondary: "T", note: "Financial technology complexity created opaque interconnections; systemic fragility invisible" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Question is whether states can mobilize fast enough to replace collapsing private demand" },
          gameTheory: { type: "Coordination Failure", note: "Each bank waits for others to recapitalize first; individually rational collective disaster" }
        },
        choicePrompt: "With global demand collapsing and credit frozen, what is the primary policy response?",
        choices: ["gfc08-L1-massive-stimulus", "gfc08-L1-austerity", "gfc08-L1-bank-nationalization"]
      },

      "gfc08-L1-massive-stimulus": {
        id: "gfc08-L1-massive-stimulus",
        layer: 1,
        type: "decision",
        title: "Massive Stimulus and Liquidity Injection",
        label: "Coordinated Stimulus",
        narrative: "Governments deploy unprecedented fiscal and monetary firepower simultaneously. China announces a $586 billion infrastructure package; the US passes TARP and the American Recovery Act; central banks globally cut rates to near zero and begin unconventional asset purchases. The coordinated response is historically unprecedented in scale and speed.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Deleveraging", note: "State balance sheet substitutes for collapsing private balance sheet" },
          steep: { primary: "E", secondary: "P", note: "Political will mobilized for intervention; long-term fiscal constraints accepted" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Largest coordinated stimulus in peacetime history" },
          gameTheory: { type: "Coordination Game — Success", note: "G20 coordination prevents competitive austerity trap" }
        },
        secondOrderEffects: ["Public debt-to-GDP ratios rise 20–40% across major economies", "Asset price inflation: stocks and real estate recover rapidly, wealth inequality widens", "Zombie firms kept alive by cheap credit reduce long-term productivity growth"],
        historicalAnalog: "G20 London Summit April 2009; coordinated global fiscal expansion; China infrastructure boom",
        choicePrompt: "With stimulus preventing a depression, how is the massive debt overhang from the bailout managed?",
        choices: ["gfc08-L2-gradual-normalization", "gfc08-L2-austerity-pivot", "gfc08-L2-financial-repression"]
      },

      "gfc08-L1-austerity": {
        id: "gfc08-L1-austerity",
        layer: 1,
        type: "decision",
        title: "Austerity or Fiscal Inaction",
        label: "Austerity Path",
        narrative: "Governments, constrained by debt fears or ideology, fail to deploy adequate fiscal response. Banks are not recapitalized; demand is not replaced; credit remains frozen. The recession deepens into a potential depression. Every quarter of inaction makes the eventual intervention — if it comes — more expensive and less effective.",
        lensSnapshot: {
          bigCycle: { phase: "Unmanaged Deleveraging", note: "Private sector deleveraging not offset by public sector; demand spiral downward" },
          steep: { primary: "E", secondary: "S", note: "Unemployment surges; social systems under extreme stress" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Inaction as de facto contractionary policy" },
          gameTheory: { type: "Collective Action Failure", note: "Each nation expects others to stimulate; all wait; all suffer" }
        },
        secondOrderEffects: ["Unemployment rises to 1930s levels in some nations", "Deflation risk becomes primary threat", "Political extremism surges in nations hit hardest without a social buffer"],
        historicalAnalog: "Eurozone periphery 2010–2013; Greek austerity under Troika; Irish, Spanish, Portuguese programs",
        choicePrompt: "With austerity deepening the recession, forced restructuring becomes inevitable. How are collapsed financial institutions handled?",
        choices: ["gfc08-L2-belated-nationalization", "gfc08-L2-bank-failures", "gfc08-L2-imf-rescue"]
      },

      "gfc08-L1-bank-nationalization": {
        id: "gfc08-L1-bank-nationalization",
        layer: 1,
        type: "decision",
        title: "Immediate Bank Nationalization",
        label: "Nationalize Banks",
        narrative: "Rather than backstopping failed institutions without requiring equity, the government takes full ownership of insolvent banks, wiping out shareholders and replacing management. The approach is more politically legitimate — losses fall on investors, not taxpayers — and more effective at cleaning balance sheets. But it requires enormous state capacity and political will.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Reset", note: "State assumes ownership of broken financial system to recapitalize it" },
          steep: { primary: "P", secondary: "E", note: "Political economy of nationalization; market ideology vs. pragmatic intervention" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State ownership as crisis management tool" },
          gameTheory: { type: "Command Solution", note: "Bypass market coordination failures through state ownership" }
        },
        secondOrderEffects: ["Shareholders wiped out; moral hazard for future crises is reduced", "State must manage massively complex financial institutions it may lack capacity for", "International capital nervous about nationalization precedent"],
        historicalAnalog: "Swedish bank nationalization 1992–1993; Nordbanken rescue model; Iceland bank resolution 2008",
        choicePrompt: "With banks nationalized, how are the toxic assets on their balance sheets resolved?",
        choices: ["gfc08-L2-bad-bank", "gfc08-L2-asset-management", "gfc08-L2-write-downs"]
      },

      "gfc08-L2-gradual-normalization": {
        id: "gfc08-L2-gradual-normalization",
        layer: 2,
        type: "decision",
        title: "Gradual Monetary Normalization",
        label: "Gradual Normalization",
        narrative: "Central banks maintain low rates and large balance sheets for longer than originally intended, gradually tapering stimulus as the recovery strengthens. The transition is managed carefully to avoid triggering a secondary crisis. Asset prices remain elevated throughout, but real economic activity gradually strengthens.",
        lensSnapshot: {
          bigCycle: { phase: "Recovery — Extended", note: "Prolonged stimulus supports asset prices but delays genuine deleveraging" },
          steep: { primary: "E", secondary: "T", note: "Financial technology enables new forms of monetary transmission" },
          geoEcon: { tool: "Monetary Policy", note: "Coordinated global monetary normalization" },
          gameTheory: { type: "Sequential Game", note: "Fed moves first; others follow sequentially to avoid currency wars" }
        },
        secondOrderEffects: ["Wealth inequality widens as asset price inflation benefits capital holders", "Corporate debt leverages up again at low rates, recreating fragility", "Emerging markets face 'taper tantrum' capital flow reversals"],
        historicalAnalog: "Fed tapering 2013–2015; ECB normalization 2018–2019",
        choicePrompt: "With normalization underway and fragility rebuilding, what structural financial reforms are implemented to prevent recurrence?",
        choices: ["gfc08-L3-dodd-frank", "gfc08-L3-banking-union", "gfc08-L3-shadow-bank-regulation"]
      },

      "gfc08-L2-belated-nationalization": {
        id: "gfc08-L2-belated-nationalization",
        layer: 2,
        type: "decision",
        title: "Belated Forced Nationalization",
        label: "Forced Nationalization",
        narrative: "After years of inaction, the financial system has deteriorated beyond market solutions. The government is forced into chaotic nationalizations at the worst possible moment — markets have priced in failure, political legitimacy is exhausted, and the state's own fiscal capacity has been consumed by recession. The nationalizations are more expensive and less orderly than they would have been in 2008.",
        lensSnapshot: {
          bigCycle: { phase: "Decline-deep", note: "Delayed intervention compounds the debt cycle damage" },
          steep: { primary: "P", secondary: "E", note: "Political crisis; governments fall; external troika intervention" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Belated intervention at worst possible fiscal moment" },
          gameTheory: { type: "Path Dependency — Locked In", note: "Early choices constrain options; belated moves are worse than early ones" }
        },
        secondOrderEffects: ["Sovereign debt crisis follows banking crisis", "External creditors (IMF/EU) impose conditionality", "Democracy under stress as unelected technocrats impose austerity"],
        historicalAnalog: "Greece 2010–2015; Cyprus bail-in 2013; Portugal 2011",
        choicePrompt: "With the financial system eventually stabilized but public trust exhausted, what post-crisis political economy emerges?",
        choices: ["gfc08-L3-technocratic-governance", "gfc08-L3-populist-backlash", "gfc08-L3-structural-reform"]
      },

      // Layer 3 terminal nodes
      "gfc08-L3-dodd-frank": {
        id: "gfc08-L3-dodd-frank",
        layer: 3,
        type: "decision",
        title: "Dodd-Frank Style Regulatory Overhaul",
        label: "Financial Regulation Reform",
        narrative: "Comprehensive financial regulation raises capital requirements, restricts proprietary trading, mandates stress tests, and creates resolution frameworks for systemic institutions. The shadow banking sector is brought partially into the regulatory perimeter. The immediate effect is reduced risk-taking but also reduced lending.",
        lensSnapshot: {
          bigCycle: { phase: "Institutional Renovation", note: "Crisis catalyzes regulatory redesign" },
          steep: { primary: "P", secondary: "E", note: "Regulatory state expands; financial sector lobbying intense" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Regulatory architecture as systemic risk management" },
          gameTheory: { type: "New Rules Game", note: "Changing regulatory rules changes financial equilibrium" }
        },
        secondOrderEffects: ["Bank profitability falls; some credit intermediation shifts to unregulated shadow sector", "Systemic risk metrics improve; another 2008-style event becomes less likely", "Compliance costs disadvantage smaller institutions; consolidation accelerates"],
        historicalAnalog: "Dodd-Frank Act 2010; Basel III capital standards; Volcker Rule",
        choicePrompt: "With new regulations in place, how does the financial system adapt to the new constraints?",
        choices: ["gfc08-L4-shadow-migration", "gfc08-L4-bank-consolidation", "gfc08-L4-fintech-emergence"]
      },

      "gfc08-L3-populist-backlash": {
        id: "gfc08-L3-populist-backlash",
        layer: 3,
        type: "decision",
        title: "Populist Political Backlash",
        label: "Populist Backlash",
        narrative: "Years of austerity, rising inequality, and perceived bailouts for banks while workers suffered produce a political earthquake. Populist movements of both left and right capture governments across the Western world. The technocratic consensus that managed the crisis — and inflicted the adjustment costs — loses democratic legitimacy.",
        lensSnapshot: {
          bigCycle: { phase: "Internal Conflict Rising", note: "Big Cycle: internal wealth gap generates political conflict" },
          steep: { primary: "P", secondary: "S", note: "Democratic systems challenged; populist capture of institutions" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Fiscal orthodoxy challenged by redistributive politics" },
          gameTheory: { type: "Regime Change", note: "Electoral game produces different equilibrium; policy changes fundamentally" }
        },
        secondOrderEffects: ["International cooperation deteriorates as nationalist governments prioritize domestic audiences", "Multilateral institutions (IMF, WTO, EU) face legitimacy crises", "Trade openness reversals begin; protectionist pressures rise"],
        historicalAnalog: "2016 Brexit vote; Trump election; Syriza in Greece; Five Star in Italy; Le Pen in France",
        choicePrompt: "With populist governments in power, how is economic policy restructured to address the underlying grievances?",
        choices: ["gfc08-L4-industrial-policy-return", "gfc08-L4-trade-protection", "gfc08-L4-redistribution-programs"]
      },

      // Layer 4 terminal nodes
      "gfc08-L4-shadow-migration": {
        id: "gfc08-L4-shadow-migration",
        layer: 4,
        type: "terminal",
        title: "Shadow Banking Migration",
        label: "Shadow Bank Growth",
        narrative: "Post-Dodd-Frank regulations push credit intermediation into unregulated shadow banking: private equity, hedge funds, money market alternatives. The regulated system is safer but smaller. The unregulated system grows rapidly. The systemic risk has been managed in one location only to re-emerge in another.",
        outcome: "REGULATORY ARBITRAGE — RISK MIGRATION",
        outcomeNarrative: "The post-crisis regulatory architecture successfully reduces risk in the regulated banking sector but inadvertently accelerates the growth of the shadow banking sector it was designed to curtail. The systemic risk accumulates in a new, less visible location — private equity leverage, money market fragility, repo market dependencies.",
        finalLensScores: {
          bigCycle: "Recovery → New Fragility Building",
          steep: { S: 0.3, T: 0.7, E: 0.8, En: 0.2, P: 0.6 },
          geoEcon: "Regulatory Architecture — unintended migration of risk",
          gameTheory: "Whack-a-Mole — regulatory intervention displaces rather than eliminates risk"
        },
        historicalAnalog: "Post-Dodd-Frank private equity growth; CLO market expansion 2012–2019; repo market fragility exposed 2019",
        aiPromptSeed: "The simulation has reached a shadow banking migration outcome. Extend to model how accumulated shadow banking fragility manifests in the next crisis, whether triggered by COVID liquidity stress, private equity leverage, or repo market dysfunction."
      },

      "gfc08-L4-fintech-emergence": {
        id: "gfc08-L4-fintech-emergence",
        layer: 4,
        type: "terminal",
        title: "Fintech Disruption of Banking",
        label: "Fintech Disruption",
        narrative: "Post-crisis bank consolidation and regulatory compliance burden create gaps that technology companies fill. Digital payment platforms, peer-to-peer lending, and eventually crypto assets emerge as genuine alternatives to bank intermediation. The financial system is restructured from below, not from above.",
        outcome: "TECHNOLOGICAL DISRUPTION OF FINANCIAL ARCHITECTURE",
        outcomeNarrative: "The financial system emerges from the crisis transformed not by regulation but by technology. New entrants unbundle banking services, increase competition, and reduce costs for consumers. But they also create new systemic risks around platform concentration, data monopolies, and regulatory gaps.",
        finalLensScores: {
          bigCycle: "Recovery → New Technological Cycle",
          steep: { S: 0.6, T: 1.0, E: 0.7, En: 0.2, P: 0.5 },
          geoEcon: "Technological Statecraft — fintech regulation as new geopolitical frontier",
          gameTheory: "Platform Competition — winner-take-most dynamics in digital finance"
        },
        historicalAnalog: "Square, Stripe, PayPal post-2008 growth; Alipay/WeChat Pay in China; crypto emergence 2009+",
        aiPromptSeed: "The simulation has reached a fintech disruption outcome. Model how the rise of digital financial platforms, central bank digital currencies (CBDCs), and crypto assets reshapes the global financial architecture through the 2020s."
      },

      "gfc08-L4-industrial-policy-return": {
        id: "gfc08-L4-industrial-policy-return",
        layer: 4,
        type: "terminal",
        title: "Return of Industrial Policy",
        label: "Industrial Policy Renaissance",
        narrative: "Populist governments, backed by popular mandates for economic change, deploy active industrial policy: subsidies for domestic manufacturing, Buy American/European provisions, strategic sector protections. The Washington Consensus era of pure market governance ends. The state becomes an active economic actor again.",
        outcome: "NEOLIBERAL CONSENSUS ENDS — INDUSTRIAL POLICY RENAISSANCE",
        outcomeNarrative: "The crisis permanently ends the Washington Consensus. State-directed industrial policy becomes mainstream across the political spectrum. The infrastructure of globalization — free trade agreements, capital mobility, regulatory harmonization — is progressively dismantled and replaced with managed trade, strategic subsidies, and supply chain reshoring.",
        finalLensScores: {
          bigCycle: "Transition → New Institutional Cycle",
          steep: { S: 0.7, T: 0.6, E: 0.8, En: 0.5, P: 1.0 },
          geoEcon: "Tariffs + Export Controls — industrial policy as statecraft",
          gameTheory: "New Equilibrium — game rules changed by democratic mandate"
        },
        historicalAnalog: "US CHIPS Act 2022; IRA 2022; EU Green Deal industrial strategy; China dual circulation policy",
        aiPromptSeed: "The simulation has reached an industrial policy renaissance outcome. Model how the return of state-directed industrial policy intersects with US-China decoupling, the green energy transition, and the reorientation of global supply chains."
      }
    }
  },

  // ============================================================
  // SCENARIO 4: BLACK SWAN EVENTS
  // ============================================================
  {
    id: "black-swan",
    title: "Black Swan Events",
    cluster: "systemic",
    clusterLabel: "Systemic Risk Typologies",
    era: "Variable",
    timeHorizon: "near-term",
    primaryLens: "steep",
    description: "Unforeseen, highly disruptive events — modeled on 9/11 and COVID-19 — that permanently alter global security, economic postures, and supply chain architecture.",
    tags: ["black swan", "tail risk", "supply chain", "resilience", "pandemic", "terrorism"],
    aiPromptContext: "You are simulating a Black Swan event scenario. Apply STEEP lens (all dimensions disrupted simultaneously), Big Cycle (shock to existing order; potential phase transition trigger), and game theory (coordination problems in crisis response; free rider problems in global public goods provision).",
    rootNodeId: "bsw-L0-trigger",
    nodes: {

      "bsw-L0-trigger": {
        id: "bsw-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Catastrophic Unforeseeable Event",
        narrative: "A high-impact, low-probability event materializes — the type that models said couldn't happen. In hours, the event cascades globally: supply chains halt, financial markets seize, governments invoke emergency powers. The shock is not just economic but civilizational — it forces a reconsideration of assumptions baked into every risk model. The cumulative GDP loss in the first year alone exceeds several percentage points globally.",
        lensSnapshot: {
          bigCycle: { phase: "Shock — Phase Undefined", note: "Black Swan events can accelerate or disrupt any Big Cycle phase" },
          steep: { primary: "Cross-domain", secondary: "All", note: "All STEEP dimensions disrupted simultaneously" },
          geoEcon: { tool: "Alliance Architecture", note: "Crisis tests which alliances hold and which fracture" },
          gameTheory: { type: "Non-cooperative Emergency", note: "Every actor prioritizes self-protection; coordination fails initially" }
        },
        choicePrompt: "How does the organization restructure its global supply chain architecture in response?",
        choices: ["bsw-L1-friendshore", "bsw-L1-status-quo", "bsw-L1-nearshore"]
      },

      "bsw-L1-friendshore": {
        id: "bsw-L1-friendshore",
        layer: 1,
        type: "decision",
        title: "Friendshoring — Relocate to Allied Nations",
        label: "Friendshore Supply Chains",
        narrative: "Production is diversified away from geopolitically exposed regions to allied nations. The architecture is more resilient but significantly more expensive. The cost of resilience is absorbed now to avoid the catastrophic cost of future disruptions. The shift takes years and billions in capital expenditure — but the next Black Swan will not find the same vulnerability.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Transition", note: "Supply chain reconfiguration as deliberate phase-transition management" },
          steep: { primary: "E", secondary: "T", note: "Capital expenditure for resilience; automation required to offset cost increase" },
          geoEcon: { tool: "Alliance Architecture", note: "Trade architecture explicitly organized around political alignment" },
          gameTheory: { type: "Insurance Purchase", note: "Pay premium now to avoid catastrophic loss later" }
        },
        secondOrderEffects: ["Labor costs rise 15–35% as production moves from low-cost regions", "Geopolitically non-aligned nations lose investment inflows", "Technology investment in automation surges to offset higher labor costs"],
        historicalAnalog: "Post-COVID reshoring movement 2021–2024; CHIPS Act domestic semiconductor investment",
        choicePrompt: "With friendshoring increasing costs, how does the organization offset the higher operational expenses?",
        choices: ["bsw-L2-automation-investment", "bsw-L2-premium-pricing", "bsw-L2-subsidies"]
      },

      "bsw-L1-status-quo": {
        id: "bsw-L1-status-quo",
        layer: 1,
        type: "decision",
        title: "Maintain Concentrated Supply Architecture",
        label: "Maintain Status Quo",
        narrative: "Firms choose to absorb the crisis cost rather than restructure, betting that Black Swan events remain rare and that the efficiency gains of concentrated supply chains still outweigh the tail risk. As conditions normalize, the status quo is restored. The next disruption will find the same vulnerabilities.",
        lensSnapshot: {
          bigCycle: { phase: "Fragility Preserved", note: "Crisis cost absorbed but structural fragility not addressed" },
          steep: { primary: "E", secondary: "T", note: "Efficiency prioritized over resilience; technology investment deferred" },
          geoEcon: { tool: "Export Controls", note: "Continues dependence on concentrated supplier regions" },
          gameTheory: { type: "Gambler's Fallacy", note: "Assumes low-probability event won't recur; rational short-term, irrational long-term" }
        },
        secondOrderEffects: ["Next disruption causes compounding damage on existing fragility", "Competitor firms that restructured gain market share in subsequent crisis", "Regulatory pressure for resilience investment builds"],
        historicalAnalog: "Post-9/11 return to just-in-time supply chains; pre-COVID concentration in Chinese manufacturing",
        choicePrompt: "When the next disruption occurs — more severe than the first — what emergency triage options remain?",
        choices: ["bsw-L2-emergency-bailout", "bsw-L2-crisis-nationalization", "bsw-L2-market-exit"]
      },

      "bsw-L1-nearshore": {
        id: "bsw-L1-nearshore",
        layer: 1,
        type: "decision",
        title: "Nearshoring — Regional Supply Chain Consolidation",
        label: "Nearshore Operations",
        narrative: "Rather than full friendshoring to allied nations globally, production is consolidated in adjacent regions — Mexico for US firms, Eastern Europe for EU firms. Geographic proximity reduces logistics risk and transit time while maintaining access to lower-cost labor than full domestic reshoring requires.",
        lensSnapshot: {
          bigCycle: { phase: "Regional Rebalancing", note: "Regionalization as intermediate step between globalization and fragmentation" },
          steep: { primary: "E", secondary: "S", note: "Regional labor markets activated; migration patterns shift" },
          geoEcon: { tool: "Alliance Architecture", note: "Regional trade blocs deepened as global chains fragmented" },
          gameTheory: { type: "Regional Coordination Game", note: "Neighboring nations compete for investment inflows from reshoring" }
        },
        secondOrderEffects: ["Mexico, Poland, Vietnam emerge as major manufacturing beneficiaries", "China's export share declines structurally", "Regional infrastructure investment surges"],
        historicalAnalog: "Mexico nearshoring surge 2022–2024; Poland/Czech Republic manufacturing growth post-Ukraine",
        choicePrompt: "With nearshoring established, how does the organization secure its new regional supply chain against political risks?",
        choices: ["bsw-L2-bilateral-treaties", "bsw-L2-dual-sourcing", "bsw-L2-local-investment"]
      },

      // Layer 2 nodes
      "bsw-L2-automation-investment": {
        id: "bsw-L2-automation-investment",
        layer: 2,
        type: "decision",
        title: "Heavy Investment in Robotics and AI Automation",
        label: "Automation Investment",
        narrative: "Capital expenditure flows massively into robotics, AI, and advanced manufacturing automation. The labor cost disadvantage of friendshoring is offset by eliminating labor from the production equation entirely. The factories of allied nations run with skeleton human crews; output per employee doubles within five years.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Phase Entry", note: "Automation enables new productive capacity in high-cost locations" },
          steep: { primary: "T", secondary: "E", note: "Technology investment restructures labor markets fundamentally" },
          geoEcon: { tool: "Export Controls", note: "Advanced manufacturing technology becomes geopolitical asset" },
          gameTheory: { type: "Arms Race", note: "First mover in automation gains permanent competitive advantage" }
        },
        secondOrderEffects: ["Manufacturing employment declines even in reshored industries", "AI/robotics firms capture enormous value from production restructuring", "New vulnerabilities: cyberattack on automated systems as catastrophic as physical attack"],
        historicalAnalog: "Tesla gigafactories; semiconductor fab automation; Amazon robotics warehouse deployment",
        choicePrompt: "With automation deployed at scale, how does the organization manage the cybersecurity vulnerabilities created?",
        choices: ["bsw-L3-zero-trust-architecture", "bsw-L3-cyber-insurance", "bsw-L3-air-gap-systems"]
      },

      "bsw-L2-emergency-bailout": {
        id: "bsw-L2-emergency-bailout",
        layer: 2,
        type: "decision",
        title: "Emergency State Bailout of Critical Supply Chains",
        label: "Emergency Bailout",
        narrative: "When the second crisis hits the unresolved concentrated architecture, governments step in with emergency bailouts of critical industries — semiconductors, pharmaceuticals, food supply chains. The bailouts are more expensive than proactive restructuring would have been and come with political conditions that permanently reshape corporate governance.",
        lensSnapshot: {
          bigCycle: { phase: "State Intervention — Late", note: "Crisis forces state intervention that markets resisted during calm period" },
          steep: { primary: "P", secondary: "E", note: "Political conditions on bailouts reshape corporate strategy" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State capital as last-resort supply chain investor" },
          gameTheory: { type: "Too Big to Fail — Repeated", note: "Moral hazard reinforced; firms bet on future bailouts" }
        },
        secondOrderEffects: ["Privatized profits, socialized losses model permanently embedded in critical sectors", "State acquires strategic stakes in critical industries", "International firms lose competitive advantage relative to state-backed rivals"],
        historicalAnalog: "COVID PPE nationalization; semiconductor supply chain emergency measures 2021; European energy firm rescue 2022",
        choicePrompt: "With the state now holding strategic stakes in critical industries, what industrial policy framework governs these investments?",
        choices: ["bsw-L3-strategic-autonomy-doctrine", "bsw-L3-return-to-markets", "bsw-L3-permanent-state-ownership"]
      },

      // Layer 3 nodes
      "bsw-L3-zero-trust-architecture": {
        id: "bsw-L3-zero-trust-architecture",
        layer: 3,
        type: "decision",
        title: "Zero Trust Cybersecurity Architecture",
        label: "Zero Trust Security",
        narrative: "Automated manufacturing systems are rebuilt on zero-trust security principles: every access request verified, every connection authenticated, every anomaly flagged. The architecture is expensive and operationally complex but reduces the attack surface dramatically. It also creates a new dependency on the cybersecurity firms that implement and maintain these systems.",
        lensSnapshot: {
          bigCycle: { phase: "Technological Consolidation", note: "Security infrastructure becomes as important as physical infrastructure" },
          steep: { primary: "T", secondary: "E", note: "Cybersecurity as essential production input" },
          geoEcon: { tool: "Export Controls", note: "Cybersecurity technology becomes strategic asset subject to export controls" },
          gameTheory: { type: "Defense Dominance", note: "Attacker must find single gap; defender must close all gaps" }
        },
        secondOrderEffects: ["Cybersecurity sector grows to become major component of defense industrial base", "Nation-state cyber operations intensify as physical supply chains become more secure", "Smaller firms cannot afford zero-trust implementation; consolidation accelerates"],
        historicalAnalog: "US CISA zero-trust mandate 2021; SolarWinds aftermath; critical infrastructure protection frameworks",
        choicePrompt: "With cybersecurity architecture established, how does the nation coordinate allied cyber defense?",
        choices: ["bsw-L4-nato-cyber-command", "bsw-L4-bilateral-cyber-treaties", "bsw-L4-private-sector-led"]
      },

      "bsw-L3-strategic-autonomy-doctrine": {
        id: "bsw-L3-strategic-autonomy-doctrine",
        layer: 3,
        type: "decision",
        title: "Strategic Autonomy Industrial Doctrine",
        label: "Strategic Autonomy",
        narrative: "State investments are organized around an explicit strategic autonomy doctrine: certain sectors are too important for national security to be left to market forces or foreign ownership. A positive list of strategic sectors receives permanent state backing; foreign acquisition is restricted; domestic champions are cultivated.",
        lensSnapshot: {
          bigCycle: { phase: "State Consolidation", note: "Nation-state reasserts control over strategic economic assets" },
          steep: { primary: "P", secondary: "E", note: "Geopolitical logic overrides pure economic efficiency" },
          geoEcon: { tool: "Export Controls", note: "Strategic autonomy as systematic decoupling in critical sectors" },
          gameTheory: { type: "Sovereignty Game", note: "Nations compete to establish strategic autonomy; global efficiency sacrificed" }
        },
        secondOrderEffects: ["WTO rules challenged by strategic autonomy subsidies", "Allied nations argue over which each other's strategic sectors deserve protection", "Global supply chains fragment into security-aligned blocs"],
        historicalAnalog: "EU strategic autonomy doctrine 2020+; US National Security Strategy emphasis; China Made in China 2025",
        choicePrompt: "With strategic autonomy doctrine embedded, how does the nation manage tensions with trading partners who see it as protectionism?",
        choices: ["bsw-L4-allied-coordination", "bsw-L4-wto-dispute", "bsw-L4-bilateral-deals"]
      },

      // Layer 4 terminal nodes
      "bsw-L4-nato-cyber-command": {
        id: "bsw-L4-nato-cyber-command",
        layer: 4,
        type: "terminal",
        title: "Allied Cyber Command Structure",
        label: "NATO Cyber Command",
        narrative: "Allied nations establish a unified cyber command structure with shared intelligence, coordinated attribution, and agreed thresholds for collective cyber response. The architecture extends Article 5 mutual defense obligations explicitly into cyberspace.",
        outcome: "COLLECTIVE CYBER DEFENSE ARCHITECTURE",
        outcomeNarrative: "Allied cyber defense creates significant deterrence against state-sponsored attacks on critical infrastructure. The architecture is incomplete — major cyber powers operate in gray zones below the collective response threshold — but it successfully prevents catastrophic attacks on supply chain infrastructure.",
        finalLensScores: {
          bigCycle: "Consolidation → Allied Technological Bloc",
          steep: { S: 0.4, T: 0.9, E: 0.6, En: 0.2, P: 0.9 },
          geoEcon: "Alliance Architecture — collective cyber defense",
          gameTheory: "Coordination Game — allies successfully coordinate on collective defense"
        },
        historicalAnalog: "NATO Cyber Operations Centre; Article 5 cyber triggers; Five Eyes intelligence sharing",
        aiPromptSeed: "Extend this simulation to model how allied cyber defense architecture evolves as AI-enabled offensive cyber capabilities proliferate, including the role of autonomous cyber weapons and the challenge of attribution in AI-driven attacks."
      },

      "bsw-L4-allied-coordination": {
        id: "bsw-L4-allied-coordination",
        layer: 4,
        type: "terminal",
        title: "Allied Industrial Policy Coordination",
        label: "Allied Coordination",
        narrative: "Rather than each allied nation pursuing unilateral strategic autonomy (which creates internal trade tensions), a coordinated division of labor is negotiated: each ally specializes in certain strategic sectors, reducing redundancy while maintaining collective resilience. The efficiency loss is minimized; the security gain is maximized.",
        outcome: "ALLIED STRATEGIC SPECIALIZATION",
        outcomeNarrative: "Allied coordination on strategic industrial policy reduces the inefficiency of parallel national programs while maintaining collective supply chain resilience. The arrangement requires sustained political commitment and complex negotiation but produces better outcomes than either pure markets or pure national autonomy.",
        finalLensScores: {
          bigCycle: "Managed Transition → Allied Bloc Formation",
          steep: { S: 0.5, T: 0.7, E: 0.7, En: 0.4, P: 0.9 },
          geoEcon: "Alliance Architecture — coordinated strategic specialization",
          gameTheory: "Cooperative Game — Pareto improvement over unilateral strategies"
        },
        historicalAnalog: "CHIPS and Science Act + allied semiconductor coordination; Minerals Security Partnership",
        aiPromptSeed: "Model how allied strategic specialization evolves as the US-China technological competition intensifies, focusing on semiconductors, AI hardware, quantum computing, and critical minerals as the key contested domains."
      }
    }
  },

  // ============================================================
  // SCENARIO 5: THE BIPOLAR NEAR-GLOBAL ECONOMY
  // ============================================================
  {
    id: "bipolar-economy",
    title: "The Bipolar Near-Global Economy",
    cluster: "geoeconomic",
    clusterLabel: "Geoeconomic Orders",
    era: "2025–2040",
    timeHorizon: "long",
    primaryLens: "geoEcon",
    description: "The global economy fractures into competing US and China-led hegemonic blocs, each wielding tariffs, export controls, and secondary sanctions to maintain dominance over boundary countries.",
    tags: ["decoupling", "sanctions", "export controls", "hegemonic competition", "boundary countries", "technological blocs"],
    aiPromptContext: "You are simulating the Bipolar Near-Global Economy. Apply Big Cycle lens (US in late hegemonic cycle; China as challenger power), GeoEconomics (full toolkit: tariffs, export controls, sanctions, currency, alliances), and game theory (two-player hegemonic competition with third-party boundary states as strategic actors with outside options).",
    rootNodeId: "bpe-L0-trigger",
    nodes: {

      "bpe-L0-trigger": {
        id: "bpe-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Global Economy Fractures into Competing Blocs",
        narrative: "The incremental decoupling of the 2018–2024 trade war period reaches a structural inflection: the world economy no longer functions as a single integrated market but as two partially overlapping spheres of influence with distinct technology standards, financial systems, and trade architectures. Nations in Asia, Africa, the Middle East, and Latin America face an explicit choice: align, hedge, or face coercion from both sides.",
        lensSnapshot: {
          bigCycle: { phase: "Late Hegemonic Cycle", note: "Incumbent (US) vs. challenger (China); classic Kindleberger hegemonic transition dynamics" },
          steep: { primary: "P", secondary: "T", note: "Political fracture drives technological decoupling; standards war begins" },
          geoEcon: { tool: "Export Controls", note: "Technology controls as primary tool of hegemonic competition" },
          gameTheory: { type: "Two-Player Hegemonic Game with Third Parties", note: "Boundary states have outside options; their alignment choices shape the equilibrium" }
        },
        choicePrompt: "As a hegemonic actor, what primary strategy is deployed against the rival bloc and boundary countries?",
        choices: ["bpe-L1-containment", "bpe-L1-accommodation", "bpe-L1-selective-decoupling"]
      },

      "bpe-L1-containment": {
        id: "bpe-L1-containment",
        layer: 1,
        type: "decision",
        title: "Containment Strategy — Technology Denial and Secondary Sanctions",
        label: "Containment",
        narrative: "The hegemon deploys maximum economic statecraft to constrain the rival: entity list designations, advanced semiconductor export controls, financial sanctions, and explicit threats of secondary sanctions against any third-party nation that maintains deep commercial ties with the rival. The strategy is aggressive and produces results — but also generates resentment among boundary states who resist being coerced into alignment.",
        lensSnapshot: {
          bigCycle: { phase: "Hegemonic Defense", note: "Incumbent uses institutional power to slow challenger's rise" },
          steep: { primary: "P", secondary: "T", note: "Technology denial as core containment mechanism" },
          geoEcon: { tool: "Export Controls", note: "Full technology denial: chips, software, equipment, IP" },
          gameTheory: { type: "Zero-Sum Competition", note: "Containment frames the competition as winner-take-all" }
        },
        secondOrderEffects: ["Rival accelerates domestic semiconductor and technology development", "Boundary states develop workarounds and parallel supply chains", "Global trade fragmentation costs estimated at 5–7% of world GDP"],
        historicalAnalog: "US export controls on Huawei 2020; CHIPS Act 2022; Entity List expansion 2022–2024",
        choicePrompt: "As containment intensifies, how are secondary sanctions enforced against boundary countries trading with the rival?",
        choices: ["bpe-L2-aggressive-secondary-sanctions", "bpe-L2-selective-enforcement", "bpe-L2-incentive-alignment"]
      },

      "bpe-L1-accommodation": {
        id: "bpe-L1-accommodation",
        layer: 1,
        type: "decision",
        title: "Accommodation — Profit-Seeking Coexistence",
        label: "Accommodation",
        narrative: "Rather than maximum pressure, the hegemon focuses on maintaining economic relationships while managing competitive dynamics. Trade continues in non-sensitive sectors; diplomatic channels remain open. The rival's rise is accepted as a structural reality to be managed rather than reversed. Boundary states are engaged competitively but not coerced.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Decline", note: "Hegemon accepts relative decline to preserve absolute gains" },
          steep: { primary: "E", secondary: "P", note: "Economic interests preserved through coexistence; political tensions managed" },
          geoEcon: { tool: "Alliance Architecture", note: "Positive engagement maintains economic relationships" },
          gameTheory: { type: "Positive-Sum Cooperation", note: "Both hegemons benefit from ongoing trade; rivalry managed rather than escalated" }
        },
        secondOrderEffects: ["Boundary states gain leverage as they are competed for rather than coerced", "Technology flows between blocs continue in dual-use gray areas", "Global economic integration maintained at higher level than containment scenario"],
        historicalAnalog: "US-China engagement strategy 2000–2016; Obama Pacific pivot with maintained commercial ties",
        choicePrompt: "With accommodation maintaining trade flows, how does the hegemon manage the boundary countries that are developing closer ties with the rival?",
        choices: ["bpe-L2-economic-incentives", "bpe-L2-alliance-deepening", "bpe-L2-benign-neglect"]
      },

      "bpe-L1-selective-decoupling": {
        id: "bpe-L1-selective-decoupling",
        layer: 1,
        type: "decision",
        title: "Selective Decoupling — Small Yard, High Fence",
        label: "Selective Decoupling",
        narrative: "The hegemon pursues a precise decoupling strategy: extremely tight controls on genuinely dual-use frontier technologies (advanced AI chips, quantum computing, advanced biotech) while maintaining broad commercial engagement in non-sensitive sectors. The 'small yard, high fence' approach attempts to deny the rival only the technologies that matter most while preserving the economic relationship.",
        lensSnapshot: {
          bigCycle: { phase: "Strategic Competition — Managed", note: "Preserves economic relationship while denying specific strategic capabilities" },
          steep: { primary: "T", secondary: "E", note: "Technology specificity as key design challenge" },
          geoEcon: { tool: "Export Controls", note: "Precision controls: maximum impact, minimum economic disruption" },
          gameTheory: { type: "Targeted Containment", note: "Selective defection: cooperate broadly, defect specifically" }
        },
        secondOrderEffects: ["Rival focuses all innovation effort on breaking the specific controls", "Allied nations pressure the hegemon to maintain commercial access", "Control boundary between strategic and non-strategic technologies continuously contested"],
        historicalAnalog: "US 'small yard, high fence' formulation; Commerce Department controls 2022–2024 on advanced AI chips",
        choicePrompt: "With selective decoupling in place, how does the rival respond to the specific technology denials?",
        choices: ["bpe-L2-indigenous-innovation", "bpe-L2-third-country-workarounds", "bpe-L2-retaliation"]
      },

      // Layer 2 nodes
      "bpe-L2-aggressive-secondary-sanctions": {
        id: "bpe-L2-aggressive-secondary-sanctions",
        layer: 2,
        type: "decision",
        title: "Aggressive Enforcement of Secondary Sanctions",
        label: "Secondary Sanctions",
        narrative: "The hegemon uses dollar-denominated financial system dominance to coerce boundary countries: any firm or financial institution that maintains significant ties with the sanctioned rival is denied access to the hegemon's financial system. The extraterritorial reach of these sanctions is massive — and massively resented.",
        lensSnapshot: {
          bigCycle: { phase: "Weaponized Hegemony", note: "Using reserve currency as weapon accelerates its erosion" },
          steep: { primary: "P", secondary: "E", note: "Sanctions as political tool; economic costs distributed globally" },
          geoEcon: { tool: "Sanctions", note: "Dollar weaponization: extraterritorial financial coercion" },
          gameTheory: { type: "Coercion Game", note: "Hegemon tries to make compliance more attractive than defiance" }
        },
        secondOrderEffects: ["Accelerates de-dollarization efforts among sanctioned and threatened nations", "Rival deepens alternative payment systems (CIPS, SWIFT alternatives)", "Non-aligned nations accelerate reserve diversification away from dollar"],
        historicalAnalog: "Iran SWIFT exclusion 2012; Russia SWIFT exclusion 2022; dollar weaponization and subsequent BRICS de-dollarization discussion",
        choicePrompt: "As secondary sanctions accelerate de-dollarization, how does the hegemon respond to the emerging alternative financial architecture?",
        choices: ["bpe-L3-defend-dollar-hegemony", "bpe-L3-cbdc-strategy", "bpe-L3-sanctions-relief"]
      },

      "bpe-L2-indigenous-innovation": {
        id: "bpe-L2-indigenous-innovation",
        layer: 2,
        type: "decision",
        title: "Rival Accelerates Indigenous Technology Development",
        label: "Indigenous Innovation Push",
        narrative: "Cut off from the hegemon's technology supply chains, the rival government mobilizes the full resources of the state: massive R&D subsidies, talent recruitment programs, state-directed industrial policy. The denied technology becomes the organizing principle of the rival's innovation system. Progress is slower than importing technology but faster than the hegemon anticipated.",
        lensSnapshot: {
          bigCycle: { phase: "Challenger Rising — Technological", note: "Technology denial accelerates challenger's indigenous capability development" },
          steep: { primary: "T", secondary: "E", note: "Forced technological self-sufficiency as development model" },
          geoEcon: { tool: "Export Controls", note: "Controls as accidental subsidy to rival's R&D effort" },
          gameTheory: { type: "Unintended Consequence", note: "Hegemon's denial strategy may accelerate challenger's capability" }
        },
        secondOrderEffects: ["Rival produces inferior but functional alternatives faster than expected", "Third countries now have a second source for critical technologies", "Technology gap between blocs narrows; control effectiveness degrades"],
        historicalAnalog: "Chinese SMIC semiconductor development; Huawei Kirin chip post-sanctions; Chinese military-civil fusion",
        choicePrompt: "As the rival narrows the technology gap, how does the hegemon respond to preserve its lead?",
        choices: ["bpe-L3-accelerate-rd", "bpe-L3-export-control-expansion", "bpe-L3-allied-technology-pool"]
      },

      // Layer 3 nodes
      "bpe-L3-defend-dollar-hegemony": {
        id: "bpe-L3-defend-dollar-hegemony",
        layer: 3,
        type: "decision",
        title: "Active Defense of Dollar Reserve Currency Status",
        label: "Defend Dollar",
        narrative: "The hegemon doubles down on defending dollar primacy: pressuring allies to maintain dollar invoicing, deploying military presence to protect key commodity markets priced in dollars, and threatening additional sanctions against nations building alternative payment systems.",
        lensSnapshot: {
          bigCycle: { phase: "Reserve Currency Defense", note: "Defending monetary dominance is historically associated with late hegemonic phase" },
          steep: { primary: "P", secondary: "E", note: "Military and diplomatic power deployed to defend monetary system" },
          geoEcon: { tool: "Currency Manipulation", note: "Defense of dollar as dominant invoice and reserve currency" },
          gameTheory: { type: "Status Quo Defense", note: "Incumbent defends existing architecture against challenger's efforts to revise it" }
        },
        secondOrderEffects: ["Defense of dollar primacy requires expanding geopolitical commitments", "Resentment among sanctioned nations accelerates alternative architecture development", "Dollar's share of global reserves declines gradually despite defense efforts"],
        historicalAnalog: "Petrodollar defense mechanisms; US opposition to SDR expansion; SWIFT control maintenance",
        choicePrompt: "With dollar hegemony under structural pressure, what long-term monetary architecture does the hegemon build?",
        choices: ["bpe-L4-digital-dollar-dominance", "bpe-L4-managed-multipolar-currency", "bpe-L4-petrodollar-renewal"]
      },

      "bpe-L3-allied-technology-pool": {
        id: "bpe-L3-allied-technology-pool",
        layer: 3,
        type: "decision",
        title: "Allied Technology Pool — Collective Innovation",
        label: "Allied Tech Pool",
        narrative: "Rather than competing alone, the hegemon deepens technology cooperation with key allies: joint R&D programs, shared technology standards, mutual recognition of export controls, and coordinated investment in critical technology sectors. The allied bloc collectively outpaces the rival's state-led innovation system.",
        lensSnapshot: {
          bigCycle: { phase: "Allied Consolidation", note: "Collective innovation as hegemonic bloc maintenance strategy" },
          steep: { primary: "T", secondary: "P", note: "Technology diplomacy as primary alliance management tool" },
          geoEcon: { tool: "Alliance Architecture", note: "Technology sharing as alliance deepening mechanism" },
          gameTheory: { type: "Coalition Game", note: "Allied bloc coordination outperforms individual actor strategies" }
        },
        secondOrderEffects: ["Allied nations gain technology access previously restricted", "Innovation rate within allied bloc accelerates through knowledge sharing", "Boundary states face even higher pressure to align as technology gap widens"],
        historicalAnalog: "AUKUS technology sharing 2021; Quad technology cooperation; Chip 4 Alliance (US, Japan, South Korea, Taiwan)",
        choicePrompt: "With allied technology cooperation deepening, how is the civilian-military technology boundary managed within the alliance?",
        choices: ["bpe-L4-dual-use-standards", "bpe-L4-military-civilian-separation", "bpe-L4-technology-escrow"]
      },

      // Layer 4 terminal nodes
      "bpe-L4-digital-dollar-dominance": {
        id: "bpe-L4-digital-dollar-dominance",
        layer: 4,
        type: "terminal",
        title: "Digital Dollar — CBDC-Based Reserve Currency",
        label: "Digital Dollar",
        narrative: "The hegemon launches a wholesale central bank digital currency that provides faster, more programmable, and more surveyable dollar access to allied financial systems. The CBDC deepens dollar integration in allied economies while providing a new tool for monitoring and potentially restricting sanctioned entities.",
        outcome: "DIGITAL RESERVE CURRENCY ARCHITECTURE",
        outcomeNarrative: "The digital dollar successfully deepens dollar integration among allies and provides new tools for financial statecraft. But the programmability that enables enforcement also enables surveillance — allies accept the architecture but are aware of the dependency it creates. The rival responds with its own digital currency architecture; the monetary system bifurcates digitally.",
        finalLensScores: {
          bigCycle: "Hegemonic Renewal via Technology",
          steep: { S: 0.4, T: 1.0, E: 0.8, En: 0.2, P: 0.9 },
          geoEcon: "Currency Manipulation + Technological Statecraft",
          gameTheory: "First-Mover Advantage — establishes digital reserve currency standard"
        },
        historicalAnalog: "Federal Reserve FedNow; BIS mBridge CBDC project; digital yuan (e-CNY) international push",
        aiPromptSeed: "The simulation has reached a digital reserve currency bifurcation outcome. Model how competing CBDC architectures — the digital dollar and the digital yuan — reshape global financial flows, sanctions effectiveness, and de-dollarization trajectories through 2035."
      },

      "bpe-L4-dual-use-standards": {
        id: "bpe-L4-dual-use-standards",
        layer: 4,
        type: "terminal",
        title: "Allied Dual-Use Technology Standards",
        label: "Allied Tech Standards",
        narrative: "The allied bloc establishes common standards for dual-use technology export controls, removing the patchwork inconsistencies that allowed the rival to source controlled technologies from allied nations with weaker controls. A common control list with harmonized enforcement creates a genuine technology denial architecture.",
        outcome: "ALLIED TECHNOLOGY CONTROL ARCHITECTURE",
        outcomeNarrative: "Harmonized allied export controls significantly improve the effectiveness of technology denial. The rival's access to controlled technologies drops substantially. But the architecture requires unprecedented coordination on a technically complex and commercially sensitive issue, and political pressures within allied nations — particularly from technology companies wanting to sell — create ongoing compliance challenges.",
        finalLensScores: {
          bigCycle: "Allied Consolidation — Technology",
          steep: { S: 0.3, T: 0.9, E: 0.6, En: 0.2, P: 0.8 },
          geoEcon: "Export Controls — harmonized allied control architecture",
          gameTheory: "Cooperative Game — allied coordination overcomes individual defection incentives"
        },
        historicalAnalog: "Wassenaar Arrangement reform discussions; US-Netherlands-Japan semiconductor equipment controls 2023; G7 technology coordination",
        aiPromptSeed: "Extend this simulation to model how harmonized allied technology controls intersect with AI development, quantum computing, and biotechnology — particularly how these controls shape the trajectory of the global AI race through 2030."
      }
    }
  },

  // ============================================================
  // SCENARIO 6: IMF 2026 ENERGY SHOCK MATRIX
  // ============================================================
  {
    id: "imf-energy-shock-2026",
    title: "IMF 2026 Energy Shock Matrix",
    cluster: "geoeconomic",
    clusterLabel: "Geoeconomic Orders",
    era: "2026–2028",
    timeHorizon: "near-term",
    primaryLens: "geoEcon",
    description: "Regional conflict disrupts major energy logistics nodes, pushing global growth to 2.0% in severe scenarios, straining energy-importing currencies, and forcing divergent central bank responses.",
    tags: ["energy shock", "oil price", "regional conflict", "stagflation", "central bank", "emerging markets"],
    aiPromptContext: "You are simulating the IMF 2026 Energy Shock Matrix. Apply Big Cycle (late cycle monetary stress; sovereign debt fragility in emerging markets), STEEP (E and P dominant; En secondary via energy transition acceleration), and game theory (coordination problems between energy importers; OPEC+ supply decisions as strategic games).",
    rootNodeId: "ies26-L0-trigger",
    nodes: {

      "ies26-L0-trigger": {
        id: "ies26-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Regional Conflict Disrupts Strait of Hormuz",
        narrative: "A major regional conflict in the Middle East disrupts the Strait of Hormuz — the chokepoint through which 20% of global oil and 25% of global LNG transits. Insurance premiums spike; tanker traffic declines; spot oil prices surge. The shock lands on a global economy already carrying elevated sovereign debt from post-COVID fiscal expansion and central banks that have only recently returned to positive real rates.",
        lensSnapshot: {
          bigCycle: { phase: "Late Cycle Fragility", note: "Shock arrives when fiscal buffers are thin and monetary ammunition is limited" },
          steep: { primary: "P", secondary: "E", note: "Geopolitical trigger; economic transmission" },
          geoEcon: { tool: "Resource Nationalism", note: "Energy chokepoint control as ultimate geopolitical weapon" },
          gameTheory: { type: "Disruption Game", note: "Conflict actors weaponize energy transit; importers face coordination problems" }
        },
        choicePrompt: "What is the trajectory of the regional conflict and its energy market impact?",
        choices: ["ies26-L1-contained", "ies26-L1-severe", "ies26-L1-escalating"]
      },

      "ies26-L1-contained": {
        id: "ies26-L1-contained",
        layer: 1,
        type: "decision",
        title: "Contained Scenario — Conflict Resolves; Oil at $80",
        label: "Contained Conflict",
        narrative: "Diplomatic intervention — US-brokered ceasefire, Iranian back-channel negotiations, Saudi mediation — contains the conflict within weeks. Energy markets normalize around $80/barrel. The disruption is sharp but brief. Global growth moderates to a stable 3.1%. Central banks, which had briefly considered emergency rate cuts, maintain existing trajectories.",
        lensSnapshot: {
          bigCycle: { phase: "Stable Late Cycle", note: "Shock absorbed without triggering phase transition" },
          steep: { primary: "E", secondary: "P", note: "Brief economic disruption; political resolution" },
          geoEcon: { tool: "Alliance Architecture", note: "Diplomatic resolution preserves energy market stability" },
          gameTheory: { type: "Deterrence — Successful", note: "Threat of further escalation prompts resolution" }
        },
        secondOrderEffects: ["Strategic petroleum reserve releases suppress spike", "Energy transition investment accelerates as policymakers note vulnerability", "Insurance premiums remain elevated; shipping costs structurally higher"],
        historicalAnalog: "Gulf of Oman incidents 2019; brief oil spike and recovery",
        choicePrompt: "With markets stabilized, how do central banks manage the brief inflationary spike?",
        choices: ["ies26-L2-hold-rates", "ies26-L2-brief-hike", "ies26-L2-forward-guidance"]
      },

      "ies26-L1-severe": {
        id: "ies26-L1-severe",
        layer: 1,
        type: "decision",
        title: "Severe Scenario — Oil at $105; Growth Drops to 2.0%",
        label: "Severe Disruption",
        narrative: "The conflict proves intractable. Oil supply disruptions persist for three to six months. Brent crude rises to $105/barrel. Global growth plummets to 2.0% — near recessionary. Energy-importing nations face the dual crisis of growth deceleration and inflation. The Japanese Yen and Euro are particularly strained; capital flows toward USD, CHF, and commodity currency safe havens.",
        lensSnapshot: {
          bigCycle: { phase: "Late Cycle Shock", note: "Oil shock triggers potential debt deflation in most exposed economies" },
          steep: { primary: "E", secondary: "P", note: "Stagflationary environment; political stability in importing nations threatened" },
          geoEcon: { tool: "Resource Nationalism", note: "Energy weaponization at maximum intensity" },
          gameTheory: { type: "Sequential Crisis Game", note: "Each week of conflict imposes compounding costs on importers" }
        },
        secondOrderEffects: ["Yen depreciates beyond 165 vs USD; BoJ faces impossible tradeoff", "Euro energy import bill surges; current account deficits widen dramatically", "Emerging market dollar-denominated debt servicing costs rise sharply"],
        historicalAnalog: "1973 oil shock; 1979 second oil shock; 2022 Russian energy weaponization in Europe",
        choicePrompt: "With stagflation at 2.0% growth and surging oil prices, what is the central bank policy response?",
        choices: ["ies26-L2-hold-raise-rates", "ies26-L2-emergency-cut", "ies26-L2-differentiated-response"]
      },

      "ies26-L1-escalating": {
        id: "ies26-L1-escalating",
        layer: 1,
        type: "decision",
        title: "Escalating Scenario — Broader Regional War; Oil Beyond $130",
        label: "Escalating Conflict",
        narrative: "The conflict draws in additional state actors. Iranian-linked forces directly attack energy infrastructure in Saudi Arabia. The Strait of Hormuz is formally mined. Oil spikes beyond $130/barrel. LNG supplies to Asia are severely disrupted. The global economy faces a supply shock of 1973-magnitude in a financial environment with significantly less monetary policy space.",
        lensSnapshot: {
          bigCycle: { phase: "Systemic Shock", note: "Energy shock of this magnitude can trigger global recession and debt crises" },
          steep: { primary: "P", secondary: "E", note: "War drives complete energy market disruption; geopolitical crisis management" },
          geoEcon: { tool: "Resource Nationalism", note: "Energy infrastructure warfare as strategic weapon" },
          gameTheory: { type: "Catastrophic Game", note: "Escalation logic takes over; all actors face catastrophic payoffs" }
        },
        secondOrderEffects: ["Multiple sovereign debt crises triggered in energy-importing emerging markets", "Food security crises emerge as fertilizer production (natural gas-dependent) collapses", "Global recession virtually certain; financial system stress tests activated"],
        historicalAnalog: "1973 oil embargo + 1979 Iranian Revolution combined scenario; no precise historical precedent for this severity",
        choicePrompt: "With oil beyond $130 and global recession imminent, what emergency international economic architecture is deployed?",
        choices: ["ies26-L2-emergency-iea-release", "ies26-L2-g20-emergency-summit", "ies26-L2-bilateral-deals"]
      },

      // Layer 2
      "ies26-L2-hold-raise-rates": {
        id: "ies26-L2-hold-raise-rates",
        layer: 2,
        type: "decision",
        title: "Hold or Raise Rates — Price Stability Priority",
        label: "Hold/Raise Rates",
        narrative: "Central banks hold rates or tighten slightly, treating the energy shock as inflationary rather than recessionary. The priority is preventing 1970s-style wage-price spirals. The cost: the economic slowdown is amplified. Mortgage markets tighten; business investment contracts; unemployment begins to rise.",
        lensSnapshot: {
          bigCycle: { phase: "Policy Tightening", note: "Central banks defend inflation credibility at cost of growth" },
          steep: { primary: "E", secondary: "P", note: "Rate policy inflicts additional economic pain on already-slowing economy" },
          geoEcon: { tool: "Monetary Policy", note: "Interest rate as primary anti-inflation tool" },
          gameTheory: { type: "Credibility Game", note: "Central bank defends inflation expectations at short-term growth cost" }
        },
        secondOrderEffects: ["Real estate markets correct as mortgage rates rise", "Corporate debt refinancing costs surge for floating rate borrowers", "Dollar strengthens further, amplifying emerging market debt stress"],
        historicalAnalog: "ECB 2022–2023 hiking cycle during energy shock; Fed 2022 response to supply-driven inflation",
        choicePrompt: "With rates held and growth slowing, how do fiscal authorities respond to the simultaneous growth deceleration?",
        choices: ["ies26-L3-energy-subsidies", "ies26-L3-targeted-transfers", "ies26-L3-austerity"]
      },

      "ies26-L2-hold-rates": {
        id: "ies26-L2-hold-rates",
        layer: 2,
        type: "decision",
        title: "Hold Rates — Brief Spike Absorbed",
        label: "Hold Rates",
        narrative: "With the conflict resolved and oil normalizing, central banks correctly identify the inflation spike as transitory — supply-side and brief — and hold rates steady. The contained response allows growth to continue at 3.1% without triggering a secondary shock from unnecessary tightening.",
        lensSnapshot: {
          bigCycle: { phase: "Stable Continuation", note: "Correct policy diagnosis avoids unnecessary tightening" },
          steep: { primary: "E", secondary: "P", note: "Measured response; brief disruption absorbed" },
          geoEcon: { tool: "Monetary Policy", note: "Correct identification of transitory vs. persistent inflation" },
          gameTheory: { type: "Optimal Response", note: "Correct calibration of policy response to shock type" }
        },
        secondOrderEffects: ["Growth continues near 3.1%; no secondary policy-induced slowdown", "Energy transition investment accelerates as vulnerability reminder persists", "Strategic petroleum reserves rebuilt before next potential disruption"],
        historicalAnalog: "Fed 2021 initial 'transitory' assessment; partially vindicated in contained shock scenarios",
        choicePrompt: "With the crisis absorbed, how does the nation build energy security architecture to prevent future exposure?",
        choices: ["ies26-L3-spr-expansion", "ies26-L3-energy-transition-acceleration", "ies26-L3-supply-diversification"]
      },

      // Layer 3 nodes
      "ies26-L3-energy-subsidies": {
        id: "ies26-L3-energy-subsidies",
        layer: 3,
        type: "decision",
        title: "Broad Energy Price Subsidies",
        label: "Energy Subsidies",
        narrative: "Governments implement broad energy price caps and subsidies to shield consumers and firms from the full cost of the shock. The fiscal bill is enormous — potentially 3–5% of GDP annually — and the debt impact adds to already-elevated sovereign debt levels. The subsidies prevent immediate social pain but create fiscal fragility.",
        lensSnapshot: {
          bigCycle: { phase: "Fiscal Overextension", note: "Subsidy costs push debt/GDP into dangerous territory in fragile states" },
          steep: { primary: "E", secondary: "P", note: "Fiscal cost of political decision to shield consumers" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Energy subsidies as social stability investment" },
          gameTheory: { type: "Short-term vs. Long-term Tradeoff", note: "Immediate pain prevented at long-term fiscal cost" }
        },
        secondOrderEffects: ["Public debt rises 10–14% of GDP in heavy subsidizing nations", "Energy demand reduction slower than without price signal; transition delayed", "IMF and bond market pressure builds on heavy subsidizers"],
        historicalAnalog: "European energy price caps 2022–2023; UK energy price guarantee; German gas price brake",
        choicePrompt: "With sovereign debt surging from subsidy costs, how does the government manage debt sustainability?",
        choices: ["ies26-L4-imf-program", "ies26-L4-energy-transition-pivot", "ies26-L4-fiscal-adjustment"]
      },

      "ies26-L3-energy-transition-acceleration": {
        id: "ies26-L3-energy-transition-acceleration",
        layer: 3,
        type: "decision",
        title: "Emergency Energy Transition Acceleration",
        label: "Transition Acceleration",
        narrative: "The energy shock is treated as the definitive case for accelerating the energy transition. Emergency permitting for renewable energy and grid investment; fast-track procurement of heat pumps and EVs; emergency nuclear plant licensing. The transition is expensive and takes years to manifest but permanently reduces exposure to hydrocarbon price shocks.",
        lensSnapshot: {
          bigCycle: { phase: "Structural Transition", note: "Crisis catalyzes long-term structural energy system change" },
          steep: { primary: "T", secondary: "En", note: "Technology-driven energy transition; environmental co-benefit" },
          geoEcon: { tool: "Export Controls", note: "Energy independence as geopolitical resilience" },
          gameTheory: { type: "Investment in Exit", note: "Paying today to exit the game entirely rather than playing it better" }
        },
        secondOrderEffects: ["Upfront capital cost large but operating cost per unit of energy falls structurally", "Fossil fuel producer nations face long-term demand destruction", "Technology nations gain from clean energy equipment exports"],
        historicalAnalog: "EU REPowerEU plan 2022; IRA US clean energy acceleration; German Energiewende acceleration",
        choicePrompt: "With energy transition investment surging, how does the nation manage the critical minerals supply chains required for the transition?",
        choices: ["ies26-L4-critical-minerals-security", "ies26-L4-circular-economy", "ies26-L4-minerals-diplomacy"]
      },

      // Layer 4 terminal nodes
      "ies26-L4-critical-minerals-security": {
        id: "ies26-L4-critical-minerals-security",
        layer: 4,
        type: "terminal",
        title: "Critical Minerals Security Architecture",
        label: "Minerals Security",
        narrative: "The nation invests in securing the critical minerals supply chain for the energy transition: lithium, cobalt, nickel, rare earths. This involves direct investment in mining in allied nations, stockpiling agreements, processing capacity development domestically and among allies, and diplomatic engagement with mineral-rich developing nations.",
        outcome: "ENERGY TRANSITION SECURED — MINERALS DEPENDENCY MANAGED",
        outcomeNarrative: "The energy transition proceeds at pace with critical minerals security managed through allied coordination. The transition to clean energy reduces geopolitical exposure to hydrocarbon chokepoints but creates new dependencies on mineral supply chains that require active management to prevent trading one vulnerability for another.",
        finalLensScores: {
          bigCycle: "Transition → New Technological Energy Cycle",
          steep: { S: 0.4, T: 0.9, E: 0.7, En: 0.9, P: 0.7 },
          geoEcon: "Alliance Architecture + Resource Security",
          gameTheory: "Supply Chain Security Game — exit hydrocarbon dependency, manage minerals dependency"
        },
        historicalAnalog: "Minerals Security Partnership 2022; US-DRC cobalt agreements; Australia lithium investment",
        aiPromptSeed: "The simulation has reached a critical minerals security outcome. Model how the global critical minerals supply chain evolves through 2035, including the role of China's dominance in rare earth processing, the development of alternative supply chains, and the intersection with the clean energy transition."
      },

      "ies26-L4-imf-program": {
        id: "ies26-L4-imf-program",
        layer: 4,
        type: "terminal",
        title: "IMF Emergency Program — Fiscal Adjustment",
        label: "IMF Program",
        narrative: "With sovereign debt unsustainable and market access closing, the government seeks an IMF emergency program. The conditions require unwinding energy subsidies, which were the source of the fiscal problem. The political cost of removing the subsidies after promising them is severe — governments fall; civil unrest erupts.",
        outcome: "IMF-IMPOSED FISCAL ADJUSTMENT — POLITICAL CRISIS",
        outcomeNarrative: "The cycle repeats: crisis leads to fiscal overextension; overextension leads to IMF conditionality; conditionality leads to political crisis. The energy shock has been managed at the cost of sovereign fiscal space and political stability. Recovery begins within two to three years but on a permanently altered political and economic landscape.",
        finalLensScores: {
          bigCycle: "Decline → Externally Imposed Reset",
          steep: { S: 0.7, T: 0.3, E: 0.9, En: 0.4, P: 1.0 },
          geoEcon: "Fiscal Statecraft — IMF conditionality as external constraint",
          gameTheory: "Creditor-Debtor Game — IMF imposes adjustment through conditionality"
        },
        historicalAnalog: "Pakistan IMF program 2023; Sri Lanka debt crisis 2022; Egypt IMF standby 2023",
        aiPromptSeed: "The simulation has reached an IMF-imposed adjustment outcome. Model how repeated energy shock exposure combined with fiscal overextension creates a vulnerability trap for energy-importing emerging markets, and what structural reforms could break this cycle."
      }
    }
  }
];

export default SYSTEMIC_SCENARIOS;
