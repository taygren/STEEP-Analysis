// CLUSTER A — HISTORICAL ARCHETYPES
// Scenarios: 1973 Oil Shocks, 1997 East Asian Financial Crisis, 2008 Global Financial Crisis

const HISTORICAL_SCENARIOS = [

  // ============================================================
  // SCENARIO 1: 1973–1974 OIL SHOCKS
  // ============================================================
  {
    id: "oil-shocks-1973",
    title: "The 1973–1974 Oil Shocks",
    cluster: "historical",
    clusterLabel: "Historical Archetypes",
    era: "1973–1974",
    timeHorizon: "near-term",
    primaryLens: "geoEcon",
    description: "OAPEC embargo quadruples oil prices from $2.90 to $11.65/barrel, exposing Western economies to their first weaponized energy crisis.",
    tags: ["energy", "stagflation", "embargo", "monetary policy", "geopolitics"],
    aiPromptContext: "You are simulating the 1973–1974 oil crisis. Apply Dalio Big Cycle lens (US in late consolidation/early overextension phase), STEEP analysis (P and E dominant with S feedback), and game theory (OAPEC defection against Western importers; oligopolistic coordination among Arab states).",
    rootNodeId: "os73-L0-trigger",
    nodes: {

      "os73-L0-trigger": {
        id: "os73-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Arab Oil Embargo Declared",
        narrative: "October 1973: OAPEC member states, led by Saudi Arabia, announce a total oil embargo against the United States, Netherlands, and other Western supporters of Israel following the Yom Kippur War. Within weeks, oil prices quadruple from $2.90 to $11.65 per barrel. Western economies, built on cheap energy assumptions, face simultaneous inflation and economic contraction — a combination monetary frameworks were not designed to handle.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension", note: "US post-Bretton Woods dollar stress; Petrodollar architecture not yet established" },
          steep: { primary: "P", secondary: "E", note: "Political weaponization of energy; economic stagflation feedback" },
          geoEcon: { tool: "Resource Nationalism", note: "First coordinated use of oil as geopolitical instrument" },
          gameTheory: { type: "Coordination Game", note: "OAPEC members coordinate defection against Western bloc" }
        },
        choicePrompt: "How do Western central banks respond to simultaneous inflation and slowing growth?",
        choices: ["os73-L1-lower-rates", "os73-L1-raise-rates"]
      },

      "os73-L1-lower-rates": {
        id: "os73-L1-lower-rates",
        layer: 1,
        type: "decision",
        title: "Lower Interest Rates — Prioritize Growth",
        label: "Stimulate the Economy",
        narrative: "Central banks elect to prioritize employment and economic activity, holding or cutting rates despite surging inflation. The logic: the recession is supply-side, so demand stimulus might bridge the gap. The consequence: inflation expectations begin to de-anchor. Workers demand higher wages to offset rising costs; firms pass wage increases back into prices. The wage-price spiral activates.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension", note: "Debt monetization accelerates currency debasement" },
          steep: { primary: "E", secondary: "S", note: "Inflation erodes purchasing power; social unrest builds" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Monetary loosening as de facto fiscal transfer" },
          gameTheory: { type: "Prisoner's Dilemma", note: "Each nation loosens hoping others will tighten; collective outcome is worse" }
        },
        secondOrderEffects: ["Dollar credibility erodes internationally", "Oil exporters accumulate surpluses faster, accelerating Petrodollar recycling pressure", "Political pressure mounts on incumbents as consumer prices rise monthly"],
        historicalAnalog: "US Federal Reserve 1973–1978 under Burns; persistent accommodation of inflation",
        choicePrompt: "With the wage-price spiral activating, the central bank faces a critical inflection. Capitulate with a Volcker-style shock, or continue accommodating?",
        choices: ["os73-L2-volcker-shock", "os73-L2-chronic-inflation"]
      },

      "os73-L1-raise-rates": {
        id: "os73-L1-raise-rates",
        layer: 1,
        type: "decision",
        title: "Raise Interest Rates — Prioritize Inflation Control",
        label: "Tighten Monetary Policy",
        narrative: "Central banks elect to front-load rate hikes, treating inflation as the primary threat. Credit tightens sharply. Mortgage markets seize; business investment contracts. Unemployment rises faster than models projected. The medicine is working — but the patient is in visible pain. Political pressure to reverse course builds immediately.",
        lensSnapshot: {
          bigCycle: { phase: "Decline-entry", note: "Deliberate demand destruction to reset inflationary expectations" },
          steep: { primary: "E", secondary: "S", note: "Recession deepens; social cost of unemployment accumulates" },
          geoEcon: { tool: "Monetary Policy", note: "Rates as instrument of supply-side shock absorption" },
          gameTheory: { type: "Chicken Game", note: "Who blinks first: central bank or political class?" }
        },
        secondOrderEffects: ["Housing market contraction spreads to construction employment", "Corporate bond spreads widen as refinancing becomes costly", "Trading partners with dollar-pegged currencies face imported tightening"],
        historicalAnalog: "Bundesbank response 1973; German insistence on price stability over growth",
        choicePrompt: "With recession deepening, governments face a binary on fiscal policy. Expand deficit spending to offset the contraction, or pursue austerity to clear structural imbalances?",
        choices: ["os73-L2-fiscal-expansion", "os73-L2-austerity"]
      },

      "os73-L2-volcker-shock": {
        id: "os73-L2-volcker-shock",
        layer: 2,
        type: "decision",
        title: "Induce Volcker-Style Rate Shock",
        label: "Abrupt Rate Hike",
        narrative: "After years of accommodation, the central bank reverses course with a brutal tightening cycle — rates rising to double digits. The shock is immediate and severe: unemployment spikes, credit markets seize, and the housing sector collapses. But inflation expectations crack. The credibility of the central bank, once squandered, begins its slow reconstruction.",
        lensSnapshot: {
          bigCycle: { phase: "Reset", note: "Controlled destruction to reset the debt/inflation cycle" },
          steep: { primary: "E", secondary: "S", note: "Deep recession trades short-term pain for long-term stability" },
          geoEcon: { tool: "Monetary Policy", note: "Extreme rate shock as credibility restoration mechanism" },
          gameTheory: { type: "Commitment Device", note: "Central bank burns bridges to make low-inflation policy credible" }
        },
        secondOrderEffects: ["Emerging market dollar-denominated debt becomes catastrophically expensive", "Commodity exporters face demand collapse", "Long-term bond yields reprice downward as inflation expectations anchor"],
        historicalAnalog: "Volcker Fed 1979–1981; federal funds rate to 20%, unemployment to 10.8%",
        choicePrompt: "With the shock administered, how does the government manage the immediate recession and rising unemployment?",
        choices: ["os73-L3-absorb-pain", "os73-L3-premature-easing", "os73-L3-targeted-relief"]
      },

      "os73-L2-chronic-inflation": {
        id: "os73-L2-chronic-inflation",
        layer: 2,
        type: "decision",
        title: "Allow Chronic Inflation to Persist",
        label: "Continued Accommodation",
        narrative: "Rather than inducing a sharp correction, policymakers allow inflation to become structural. Annual price increases of 8–12% become normalized. Real wages erode for those without bargaining power. The middle class saves less, borrows more, and begins to distrust institutions. The economy functions, but on increasingly fragile foundations. International creditors quietly reduce dollar-denominated holdings.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension-peak", note: "Dollar reserve status questioned; Petrodollar system under strain" },
          steep: { primary: "S", secondary: "E", note: "Social cohesion erodes as purchasing power collapses for fixed-income households" },
          geoEcon: { tool: "Currency Manipulation", note: "Inflation as de facto debt reduction via debasement" },
          gameTheory: { type: "Iterated Game — Defection Cascade", note: "Each accommodation erodes credibility; commitment becomes impossible" }
        },
        secondOrderEffects: ["Gold price surges as dollar alternatives are sought", "OPEC continues production discipline as dollar purchasing power falls", "Political radicalization accelerates among economically displaced populations"],
        historicalAnalog: "UK stagflation 1974–1979; pre-Thatcher period of chronic inflationary accommodation",
        choicePrompt: "With inflation entrenched, the currency faces external pressure. Does the government defend the exchange rate or allow competitive devaluation?",
        choices: ["os73-L3-defend-currency", "os73-L3-devalue-currency", "os73-L3-petrodollar-deal"]
      },

      "os73-L2-fiscal-expansion": {
        id: "os73-L2-fiscal-expansion",
        layer: 2,
        type: "decision",
        title: "Deficit-Financed Fiscal Expansion",
        label: "Stimulus Spending",
        narrative: "Governments deploy large-scale deficit spending — public works, unemployment benefits, subsidies — to offset the contractionary effect of rate hikes. The stimulus bridges the employment gap but adds significantly to sovereign debt loads at exactly the moment when borrowing is most expensive. Bond vigilantes begin to stir.",
        lensSnapshot: {
          bigCycle: { phase: "Decline", note: "Debt accumulation during contraction; structural fiscal fragility rising" },
          steep: { primary: "E", secondary: "P", note: "Political imperative to buffer social pain creates long-term fiscal constraints" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Domestic demand management as geopolitical stabilizer" },
          gameTheory: { type: "Short-term vs. Long-term Tradeoff", note: "Stimulate now, pay later; debt overhang defers the reckoning" }
        },
        secondOrderEffects: ["Sovereign debt-to-GDP ratios rise 15–25% across stimulating nations", "Crowding out of private investment in medium term", "International creditors demand higher yields on new issuances"],
        historicalAnalog: "US Ford/Carter era deficit spending 1974–1979; UK Labour government spending 1974–1976",
        choicePrompt: "With debt ballooning during a contraction, how does the government manage the growing sovereign debt burden?",
        choices: ["os73-L3-monetize-debt", "os73-L3-austerity-pivot", "os73-L3-growth-strategy"]
      },

      "os73-L2-austerity": {
        id: "os73-L2-austerity",
        layer: 2,
        type: "decision",
        title: "Pursue Austerity — Clear Structural Imbalances",
        label: "Fiscal Austerity",
        narrative: "Rather than borrowing to cushion the blow, governments cut expenditures and reduce deficits. The immediate pain is severe and politically costly. Social programs shrink; public sector employment falls; civil unrest grows. But the structural imbalances that made the economy brittle — over-leverage, inefficient state industries, rigid labor markets — begin to clear faster than under stimulus.",
        lensSnapshot: {
          bigCycle: { phase: "Reset", note: "Forced deleveraging clears the cycle; painful but structurally necessary" },
          steep: { primary: "S", secondary: "P", note: "Social cost of austerity; political instability as governments fall" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Austerity as credibility signal to international creditors" },
          gameTheory: { type: "Cooperation with Future Self", note: "Short-term defection from current voters to benefit future stability" }
        },
        secondOrderEffects: ["Government bond yields decline as fiscal credibility improves", "Social safety net erosion increases poverty rates short-term", "Structural reform opens space for private investment in medium term"],
        historicalAnalog: "West Germany 1974–1976; Netherlands 1975–1982 Wassenaar antecedents",
        choicePrompt: "With austerity implemented, what is the geopolitical energy strategy response? Address import dependency directly or attempt international coordination?",
        choices: ["os73-L3-project-independence", "os73-L3-iea-formation", "os73-L3-opec-negotiation"]
      },

      // Layer 3 nodes
      "os73-L3-absorb-pain": {
        id: "os73-L3-absorb-pain",
        layer: 3,
        type: "decision",
        title: "Absorb the Recession — No Immediate Stimulus",
        label: "Accept Short-Term Pain",
        narrative: "The government and central bank hold firm. Unemployment rises to historic highs; political pressure is intense. But the commitment is maintained. Inflation expectations crack — consumers and businesses begin to believe that price stability is genuinely the policy objective. The recession is deep but its duration is compressed by the clarity of the commitment.",
        lensSnapshot: {
          bigCycle: { phase: "Reset-completion", note: "Debt cycle cleansed; foundation for next expansion set" },
          steep: { primary: "S", secondary: "E", note: "High unemployment temporary; productivity recovery begins" },
          geoEcon: { tool: "Monetary Policy", note: "Credibility permanently restored" },
          gameTheory: { type: "Commitment Device — Successful", note: "Painful but credible; expectations permanently anchored" }
        },
        secondOrderEffects: ["Long-term bond yields fall dramatically as inflation risk premium collapses", "Productivity-led expansion follows within 2–3 years", "Dollar regains reserve currency confidence"],
        historicalAnalog: "US 1981–1983 recession; Volcker holds firm despite 10.8% unemployment",
        choicePrompt: "With inflation broken, the energy vulnerability that triggered the crisis remains. What long-term energy architecture does the nation pursue?",
        choices: ["os73-L4-strategic-reserves", "os73-L4-diversify-suppliers", "os73-L4-domestic-energy"]
      },

      "os73-L3-premature-easing": {
        id: "os73-L3-premature-easing",
        layer: 3,
        type: "decision",
        title: "Pivot Back to Rate Cuts Prematurely",
        label: "Premature Easing",
        narrative: "Political pressure overwhelms the central bank's resolve. Rates are cut before inflation is fully broken. The initial relief is real — unemployment stops rising, markets rally. But inflation re-accelerates within months. The credibility of the central bank, so recently reconstructed, is destroyed again. The next tightening cycle will need to be even more severe.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension-repeat", note: "Failed reset; cycle extends with compounding fragility" },
          steep: { primary: "E", secondary: "P", note: "Political capture of monetary policy; institutional credibility destroyed" },
          geoEcon: { tool: "Monetary Policy", note: "Premature easing as geopolitical signal of weakness" },
          gameTheory: { type: "Time Inconsistency Problem", note: "Classic central bank credibility failure; promises not believed" }
        },
        secondOrderEffects: ["Wage-price spiral reactivates at higher base", "International investors reduce dollar holdings further", "Policy options for next cycle are severely constrained"],
        historicalAnalog: "Federal Reserve 1967–1969 Burns accommodation; Vietnam-era fiscal dominance of monetary policy",
        choicePrompt: "With stagflation entrenched for a second time, what structural reforms can break the cycle?",
        choices: ["os73-L4-institutional-reform", "os73-L4-incomes-policy", "os73-L4-supply-side-reform"]
      },

      "os73-L3-targeted-relief": {
        id: "os73-L3-targeted-relief",
        layer: 3,
        type: "decision",
        title: "Targeted Social Relief Without Broad Stimulus",
        label: "Targeted Relief Programs",
        narrative: "Rather than broad stimulus that risks re-igniting inflation, the government deploys narrow, means-tested relief: heating fuel subsidies for low-income households, extended unemployment for displaced workers, retraining programs for structurally affected industries. The macro tightening continues; the social pain is cushioned but not eliminated.",
        lensSnapshot: {
          bigCycle: { phase: "Reset-managed", note: "Controlled social cost of correction; political system holds" },
          steep: { primary: "S", secondary: "E", note: "Social safety net preserves political stability during correction" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Precision fiscal tools avoid macroeconomic distortion" },
          gameTheory: { type: "Pareto Improvement", note: "Better outcome for all parties; inflation control without social collapse" }
        },
        secondOrderEffects: ["Political system survives the correction with public trust partially intact", "Labor market clears faster than under broad stimulus", "Foundation for post-crisis structural reform is preserved"],
        historicalAnalog: "Swedish approach to 1970s adjustment; targeted welfare preservation with monetary discipline",
        choicePrompt: "With the correction managed, what is the long-term energy security architecture pursued?",
        choices: ["os73-L4-strategic-reserves", "os73-L4-iea-coalition", "os73-L4-renewables-pivot"]
      },

      "os73-L3-defend-currency": {
        id: "os73-L3-defend-currency",
        layer: 3,
        type: "decision",
        title: "Defend the Exchange Rate",
        label: "Currency Defense",
        narrative: "The government burns foreign reserves to maintain the exchange rate, treating currency stability as the anchor for anti-inflation credibility. It buys time — but reserves deplete rapidly, and speculative pressure intensifies as markets sense the commitment is finite. The defense eventually fails, but the collapse when it comes is more severe than an earlier managed devaluation would have been.",
        lensSnapshot: {
          bigCycle: { phase: "Decline-accelerated", note: "Reserve depletion accelerates the cycle's terminal phase" },
          steep: { primary: "E", secondary: "P", note: "Financial system fragility; political survival threatened" },
          geoEcon: { tool: "Currency Manipulation", note: "Reserve depletion as terminal fiscal constraint" },
          gameTheory: { type: "War of Attrition", note: "Defender vs. speculators; defender has finite resources" }
        },
        secondOrderEffects: ["Speculative attacks intensify as reserves visibly decline", "IMF emergency consultations begin", "Political government falls when defense collapses"],
        historicalAnalog: "UK Black Wednesday 1992; ERM crisis",
        choicePrompt: "With reserves critically depleted and the defense near collapse, what emergency measures does the government deploy?",
        choices: ["os73-L4-imf-bailout", "os73-L4-capital-controls", "os73-L4-managed-float"]
      },

      "os73-L3-devalue-currency": {
        id: "os73-L3-devalue-currency",
        layer: 3,
        type: "decision",
        title: "Allow Competitive Devaluation",
        label: "Accept Devaluation",
        narrative: "The government stops defending the exchange rate, allowing the currency to find a new, lower equilibrium. Export competitiveness surges immediately; import costs rise sharply, adding another inflationary impulse on top of the oil shock. But the devaluation provides relief to the traded goods sector and prevents reserve depletion.",
        lensSnapshot: {
          bigCycle: { phase: "Decline-managed", note: "Controlled decline preserves export capacity" },
          steep: { primary: "E", secondary: "T", note: "Export competitiveness boosts manufacturing; import inflation hits consumers" },
          geoEcon: { tool: "Currency Manipulation", note: "Devaluation as export subsidy and debt relief mechanism" },
          gameTheory: { type: "Beggar-Thy-Neighbor", note: "Gains at partners' expense; risk of retaliation and global currency war" }
        },
        secondOrderEffects: ["Trading partners face sudden competitiveness loss; retaliation risk rises", "Import inflation adds 2–4% to domestic CPI", "Export sector employment recovers while domestic consumption contracts"],
        historicalAnalog: "UK sterling devaluation 1967; French franc devaluation 1969",
        choicePrompt: "With the currency devalued and inflation still elevated, what trade and industrial policy does the government pursue to restructure the economy?",
        choices: ["os73-L4-export-led-recovery", "os73-L4-import-substitution", "os73-L4-industrial-policy"]
      },

      "os73-L3-petrodollar-deal": {
        id: "os73-L3-petrodollar-deal",
        layer: 3,
        type: "decision",
        title: "Negotiate Petrodollar Recycling Architecture",
        label: "Petrodollar Deal",
        narrative: "The US negotiates a foundational deal with Saudi Arabia: oil priced exclusively in dollars, with OPEC surplus revenues recycled into US Treasury bonds. In exchange, the US provides military security guarantees. This transforms the oil crisis from a terminal threat into a structural advantage — dollar demand is now permanently anchored to global energy trade.",
        lensSnapshot: {
          bigCycle: { phase: "Reset-to-new-cycle", note: "Dollar hegemony reconstituted on energy foundation" },
          steep: { primary: "P", secondary: "E", note: "Geopolitical architecture re-established; dollar recycling mechanism born" },
          geoEcon: { tool: "Alliance Architecture", note: "Security-for-currency deal creates new global financial architecture" },
          gameTheory: { type: "Iterated Cooperation", note: "Mutual benefit structure sustained over decades; Petrodollar system 1974–2024" }
        },
        secondOrderEffects: ["Dollar reserve currency status permanently reinforced by energy anchor", "US military presence in Gulf becomes permanent structural commitment", "OPEC surplus recycling suppresses US borrowing costs for decades"],
        historicalAnalog: "US-Saudi Petrodollar agreement 1974; Kissinger-facilitated architecture",
        choicePrompt: "With the Petrodollar architecture established, how does the US manage the long-term strategic dependencies created?",
        choices: ["os73-L4-gulf-security-doctrine", "os73-L4-diversify-partners", "os73-L4-energy-independence"]
      },

      "os73-L3-monetize-debt": {
        id: "os73-L3-monetize-debt",
        layer: 3,
        type: "decision",
        title: "Monetize the Debt — Central Bank Buys Bonds",
        label: "Debt Monetization",
        narrative: "The central bank steps in to absorb government bond issuances, effectively financing the deficit by printing money. The immediate pressure is relieved — bond yields stay low, the government can continue spending. But the monetary base expands rapidly. International creditors observe that fiscal discipline has been abandoned entirely. Currency confidence erodes.",
        lensSnapshot: {
          bigCycle: { phase: "Overextension-terminal", note: "Monetization as last resort; currency debasement accelerates cycle end" },
          steep: { primary: "E", secondary: "P", note: "Currency crisis risk; political system loses credibility" },
          geoEcon: { tool: "Currency Manipulation", note: "Monetization as stealth default on external creditors" },
          gameTheory: { type: "Defection from Creditors", note: "One-sided gain at creditors' expense; terminal relationship damage" }
        },
        secondOrderEffects: ["Balance of payments crisis develops as currency falls", "Capital flight accelerates; wealthy households buy hard assets", "IMF emergency engagement begins"],
        historicalAnalog: "UK 1976 IMF bailout crisis; monetization leading to external constraint",
        choicePrompt: "With currency confidence collapsing and capital fleeing, what emergency economic architecture does the government adopt?",
        choices: ["os73-L4-imf-program", "os73-L4-capital-controls-emergency", "os73-L4-currency-board"]
      },

      // Layer 4 terminal nodes (outcomes)
      "os73-L4-strategic-reserves": {
        id: "os73-L4-strategic-reserves",
        layer: 4,
        type: "terminal",
        title: "Strategic Petroleum Reserve Architecture",
        label: "Build Strategic Reserves",
        narrative: "The nation establishes a strategic petroleum reserve and coordinates with allies through the newly formed International Energy Agency (IEA). Highway speed limits are imposed; fuel economy standards legislated; emergency sharing protocols established among member states. The next oil shock will not find the same vulnerability.",
        outcome: "STABILIZATION WITH RESIDUAL DEPENDENCY",
        outcomeNarrative: "The energy architecture is partially secured. Future shocks are cushioned but not eliminated. Military and diplomatic entanglement with oil-producing regions deepens as the price of stability. The fundamental transition away from oil dependence is deferred by two decades.",
        finalLensScores: {
          bigCycle: "Managed Decline → Transition",
          steep: { S: 0.4, T: 0.5, E: 0.8, En: 0.3, P: 0.9 },
          geoEcon: "Alliance Architecture + Resource Nationalism countermeasure",
          gameTheory: "Coordination Game — IEA coalition successfully changes payoff structure"
        },
        historicalAnalog: "IEA formation 1974; US Strategic Petroleum Reserve established 1975",
        aiPromptSeed: "The simulation has reached a stabilization outcome through monetary shock absorption and strategic energy architecture. Extend this scenario by modeling how the new Petrodollar recycling system and IEA framework interact over the next decade, particularly around the 1979 second oil shock."
      },

      "os73-L4-iea-coalition": {
        id: "os73-L4-iea-coalition",
        layer: 4,
        type: "terminal",
        title: "IEA Multilateral Energy Coalition",
        label: "Form IEA Coalition",
        narrative: "Western nations, coordinating through the newly established IEA, develop emergency sharing protocols, demand reduction targets, and joint reserve requirements. The coalition successfully blunts the monopoly pricing power of OAPEC. But the structural dependency on imported energy remains, and the geopolitical leverage of producer states persists.",
        outcome: "MULTILATERAL RESILIENCE",
        outcomeNarrative: "The consumer bloc successfully organizes against producer-side weaponization. The IEA framework survives and strengthens over decades. However, the fundamental energy transition is not forced — cheap oil returns, reducing the urgency for alternatives.",
        finalLensScores: {
          bigCycle: "Reset → New Cycle Entry",
          steep: { S: 0.5, T: 0.4, E: 0.7, En: 0.4, P: 0.9 },
          geoEcon: "Alliance Architecture — Consumer Bloc Coordination",
          gameTheory: "Cooperative Game — Counter-cartel formation"
        },
        historicalAnalog: "IEA founding 1974; coordinated release from strategic reserves during Gulf War 1991",
        aiPromptSeed: "The simulation has reached a multilateral energy coalition outcome. Model how the IEA-OPEC dynamic evolves, including the role of North Sea and Alaskan oil production in breaking OPEC's pricing power by the early 1980s."
      },

      "os73-L4-renewables-pivot": {
        id: "os73-L4-renewables-pivot",
        layer: 4,
        type: "terminal",
        title: "Accelerated Renewables Investment",
        label: "Pivot to Renewables",
        narrative: "The oil shock, rather than being managed through reserves and alliances, is treated as the inflection point to restructure energy systems entirely. Heavy public investment flows into solar, nuclear, and efficiency standards. The transition is costly and takes a decade to manifest, but the structural dependency is genuinely broken rather than merely hedged.",
        outcome: "STRUCTURAL TRANSITION INITIATED",
        outcomeNarrative: "The energy shock accelerates the energy transition by 20–30 years. The path is expensive and politically contested, but by the late 1980s the economies that made this choice are significantly less exposed to producer-state coercion. The geopolitical map of the late 20th century is altered.",
        finalLensScores: {
          bigCycle: "Reset → New Technological Cycle",
          steep: { S: 0.5, T: 0.9, E: 0.7, En: 0.8, P: 0.7 },
          geoEcon: "Technological Self-Sufficiency — exits resource dependency trap",
          gameTheory: "Exit Strategy — removes self from game rather than playing it better"
        },
        historicalAnalog: "French nuclear program post-1973; Denmark wind energy pivot; Carter solar initiatives",
        aiPromptSeed: "The simulation has reached an early energy transition outcome. Model what a world where Western nations committed to renewable energy in 1975 looks like by 1990, including geopolitical effects on OPEC, the Cold War, and early climate awareness."
      },

      "os73-L4-institutional-reform": {
        id: "os73-L4-institutional-reform",
        layer: 4,
        type: "terminal",
        title: "Central Bank Independence Reform",
        label: "Institutional Reform",
        narrative: "The repeated failure of politically captured monetary policy prompts constitutional or statutory reforms granting the central bank genuine independence from the fiscal authority. Inflation targeting becomes law. The reform is politically painful but institutionally transformative — the credibility problem is solved at its root.",
        outcome: "INSTITUTIONAL RENOVATION",
        outcomeNarrative: "The crisis becomes the catalyst for the most important institutional reform of the post-war era. Independent central banks with explicit inflation mandates become the global standard. The stagflation era ends not through any single policy but through an institutional redesign that changes the game's rules permanently.",
        finalLensScores: {
          bigCycle: "Reset-complete → New Institutional Cycle",
          steep: { S: 0.4, T: 0.3, E: 0.9, En: 0.2, P: 0.8 },
          geoEcon: "Institutional Architecture — monetary governance reform",
          gameTheory: "Rules Change — exits the time-inconsistency trap through binding commitment"
        },
        historicalAnalog: "New Zealand Reserve Bank Act 1989; Bundesbank model; UK Bank of England independence 1997",
        aiPromptSeed: "The simulation has reached an institutional reform outcome. Model how independent central banking with inflation targets reshapes the global economy over the following decades, including its role in the Great Moderation and the 2008 crisis response."
      },

      "os73-L4-gulf-security-doctrine": {
        id: "os73-L4-gulf-security-doctrine",
        layer: 4,
        type: "terminal",
        title: "Gulf Security Doctrine — Carter Doctrine",
        label: "Military Security Guarantee",
        narrative: "The Petrodollar architecture is locked in by an explicit security doctrine: the US will treat any attempt by an external force to control the Persian Gulf as an attack on US vital interests. Military infrastructure expands in the region. The dollar-oil nexus is hardened into a permanent geopolitical commitment with generational consequences.",
        outcome: "HEGEMONIC OVEREXTENSION — STRATEGIC LOCK-IN",
        outcomeNarrative: "The US secures cheap credit and dollar dominance for decades at the cost of permanent military entanglement in the world's most volatile region. The Petrodollar system delivers exactly what it promises — until it doesn't. The 2003 Iraq War and the rise of BRICS de-dollarization movements are downstream consequences of this lock-in.",
        finalLensScores: {
          bigCycle: "Consolidation via Overextension",
          steep: { S: 0.3, T: 0.5, E: 0.9, En: 0.4, P: 1.0 },
          geoEcon: "Alliance Architecture + Military Statecraft",
          gameTheory: "Dominant Strategy — locks in payoff structure for 50 years at enormous long-run cost"
        },
        historicalAnalog: "Carter Doctrine 1980; Reagan military buildup in Gulf; US permanent basing in Saudi Arabia",
        aiPromptSeed: "The simulation has reached the Gulf Security Doctrine outcome. Model how this 50-year entanglement plays out, including Iraq 1991, Iraq 2003, and the eventual emergence of de-dollarization pressure from the BRICS coalition in the 2020s."
      }
    }
  },

  // ============================================================
  // SCENARIO 2: 1997 EAST ASIAN FINANCIAL CRISIS
  // ============================================================
  {
    id: "asia-crisis-1997",
    title: "The 1997 East Asian Financial Crisis",
    cluster: "historical",
    clusterLabel: "Historical Archetypes",
    era: "1997–1999",
    timeHorizon: "near-term",
    primaryLens: "geoEcon",
    description: "Thailand's baht collapse triggers a region-wide capital flight crisis, exposing the vulnerabilities of dollar-pegged currencies and state-directed credit in post-Bretton Woods capital markets.",
    tags: ["currency crisis", "capital flight", "IMF", "emerging markets", "contagion"],
    aiPromptContext: "You are simulating the 1997 East Asian financial crisis. Apply Big Cycle lens (developing economies in early accumulation phase, vulnerable to capital flow reversal), STEEP (E and P dominant), and game theory (currency defense as war of attrition against speculators; IMF conditionality as principal-agent problem).",
    rootNodeId: "afc97-L0-trigger",
    nodes: {

      "afc97-L0-trigger": {
        id: "afc97-L0-trigger",
        layer: 0,
        type: "trigger",
        title: "Thai Baht Speculative Attack",
        narrative: "July 2, 1997: The Thai central bank exhausts its foreign reserves defending the baht's dollar peg. Thailand floats the baht; it collapses 15% in one day. Within weeks, speculative attacks spread to Indonesia, Malaysia, South Korea, and the Philippines. The region's dollar-pegged exchange rates, underpinned by short-term foreign borrowing and state-directed credit allocation, are exposed as structurally insolvent.",
        lensSnapshot: {
          bigCycle: { phase: "Accumulation-disrupted", note: "High-growth economies suddenly face capital reversal; debt denominated in foreign currency" },
          steep: { primary: "E", secondary: "P", note: "Capital account liberalization collides with fixed exchange rates; political stability threatened" },
          geoEcon: { tool: "Currency Manipulation", note: "Dollar peg becomes liability; speculative pressure exposes reserve inadequacy" },
          gameTheory: { type: "One-Sided War of Attrition", note: "Central banks have finite reserves; speculators have larger capital pools" }
        },
        choicePrompt: "With the currency under speculative attack, how do governments defend against capital flight?",
        choices: ["afc97-L1-defend-peg", "afc97-L1-float-immediately", "afc97-L1-capital-controls"]
      },

      "afc97-L1-defend-peg": {
        id: "afc97-L1-defend-peg",
        layer: 1,
        type: "decision",
        title: "Defend the Dollar Peg Using Reserves",
        label: "Defend the Peg",
        narrative: "Governments commit their foreign reserve stockpiles to maintaining currency pegs. Interest rates are raised sharply to make shorting the currency expensive. Initially, the defense holds. But reserves deplete at an alarming rate; the speculative attack intensifies as hedge funds sense the end game. The defense creates the very illiquidity it seeks to prevent.",
        lensSnapshot: {
          bigCycle: { phase: "Decline-entry", note: "Reserve depletion accelerates external vulnerability" },
          steep: { primary: "E", secondary: "P", note: "Financial system stress mounts; political crises begin" },
          geoEcon: { tool: "Currency Manipulation", note: "Reserve-based defense unsustainable against concentrated speculative capital" },
          gameTheory: { type: "War of Attrition — Losing", note: "Finite reserves against larger private capital flows; outcome predetermined" }
        },
        secondOrderEffects: ["Foreign reserves drop below critical thresholds in weeks", "Domestic interest rates spike to 15–30%, crushing local credit markets", "IMF emergency consultations begin"],
        historicalAnalog: "Bank of Thailand July 1997; Indonesian rupiah defense August 1997",
        choicePrompt: "With reserves critically depleted and the defense failing, what emergency measures are deployed?",
        choices: ["afc97-L2-imf-bailout", "afc97-L2-forced-float", "afc97-L2-emergency-controls"]
      },

      "afc97-L1-float-immediately": {
        id: "afc97-L1-float-immediately",
        layer: 1,
        type: "decision",
        title: "Float the Currency Immediately",
        label: "Accept Devaluation",
        narrative: "Rather than burning reserves on a defense that cannot succeed, the central bank immediately allows the currency to float. The initial shock is severe — the currency falls 20–40% in days — but reserves are preserved. This liquidity cushion becomes the critical resource for stabilizing the domestic banking system, which is now under extreme stress from dollar-denominated debt.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Decline", note: "Controlled shock preserves institutional capacity for recovery" },
          steep: { primary: "E", secondary: "S", note: "Sharp contractionary shock; import costs surge; social pain immediate" },
          geoEcon: { tool: "Currency Manipulation", note: "Managed devaluation as least-bad option" },
          gameTheory: { type: "Strategic Retreat", note: "Sacrifice position to preserve capacity for subsequent moves" }
        },
        secondOrderEffects: ["Export competitiveness surges immediately; manufacturing sector gains", "Foreign-currency-denominated corporate debt becomes catastrophically expensive", "IMF engagement shifts from emergency to structural reform dialogue"],
        historicalAnalog: "South Korea partial float October 1997; eventual IMF program December 1997",
        choicePrompt: "With the currency floated and reserves preserved, how are the domestic banks — loaded with non-performing foreign-currency loans — stabilized?",
        choices: ["afc97-L2-bank-recapitalization", "afc97-L2-bank-liquidation", "afc97-L2-asset-management"]
      },

      "afc97-L1-capital-controls": {
        id: "afc97-L1-capital-controls",
        layer: 1,
        type: "decision",
        title: "Impose Capital Controls — Malaysia Model",
        label: "Capital Controls",
        narrative: "The government moves against conventional IMF wisdom: capital outflows are restricted, the exchange rate is pegged at a new level, and foreign currency transactions require government approval. The policy is condemned internationally and triggers immediate capital strike from foreign investors. But the controls work — the speculative pressure cannot operate in a closed market.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Disruption", note: "State intervention breaks the speculative attack mechanism" },
          steep: { primary: "P", secondary: "E", note: "Political intervention in capital markets; international relations strained" },
          geoEcon: { tool: "Export Controls", note: "Capital account restriction as defensive statecraft" },
          gameTheory: { type: "Rule Change", note: "Controls change the payoff structure; speculators cannot profit in a closed market" }
        },
        secondOrderEffects: ["Foreign direct investment dries up for 12–18 months as investors fear entrapment", "Domestic economy stabilizes faster than IMF-program peers", "Policy becomes controversial template for future crisis responses"],
        historicalAnalog: "Malaysia Mahathir capital controls September 1998; subsequent GDP recovery outpaced IMF-program neighbors",
        choicePrompt: "With capital controls holding the exchange rate but foreign investment fleeing, how does the government manage the domestic economy during isolation?",
        choices: ["afc97-L2-fiscal-stimulus", "afc97-L2-structural-reform", "afc97-L2-gradual-reopening"]
      },

      "afc97-L2-imf-bailout": {
        id: "afc97-L2-imf-bailout",
        layer: 2,
        type: "decision",
        title: "Accept IMF Structural Adjustment Conditions",
        label: "IMF Bailout",
        narrative: "The IMF arrives with emergency liquidity — but the price is austerity and structural reform. Banks must be recapitalized to international standards; government deficits must be cut; state-directed credit allocation must end; corporate governance must be reformed. The immediate effect is contractionary. The medicine may be right for the long term but the dosage is debated.",
        lensSnapshot: {
          bigCycle: { phase: "Reset — Externally Imposed", note: "IMF conditionality as externally administered restructuring" },
          steep: { primary: "P", secondary: "E", note: "Sovereignty over economic policy transferred to IMF; political legitimacy crisis" },
          geoEcon: { tool: "Fiscal Statecraft", note: "IMF conditionality as creditor-imposed structural adjustment" },
          gameTheory: { type: "Principal-Agent Problem", note: "IMF (principal) vs. domestic government (agent); conditionality as enforcement mechanism" }
        },
        secondOrderEffects: ["GDP contracts 7–15% in year one of program", "Political unrest triggers government changes in Thailand, Indonesia, South Korea", "Corporate restructuring eliminates family-controlled chaebol model"],
        historicalAnalog: "Indonesia IMF program 1997–98; Korea IMF standby agreement December 1997",
        choicePrompt: "With the IMF program imposing contractionary conditions, how does the government manage the political and social fallout?",
        choices: ["afc97-L3-full-compliance", "afc97-L3-partial-compliance", "afc97-L3-reject-conditions"]
      },

      "afc97-L2-bank-recapitalization": {
        id: "afc97-L2-bank-recapitalization",
        layer: 2,
        type: "decision",
        title: "Use Preserved Reserves for Bank Recapitalization",
        label: "Recapitalize Banks",
        narrative: "The government deploys its preserved foreign reserves to buy non-performing loans from domestic banks, injecting fresh capital and guaranteeing deposits. The banking system stabilizes rapidly. Confidence in the domestic financial system is maintained even as the exchange rate adjusts. The export sector's competitiveness gain begins to stimulate recovery.",
        lensSnapshot: {
          bigCycle: { phase: "Managed Reset", note: "Domestic balance sheet repair enables faster cycle recovery" },
          steep: { primary: "E", secondary: "P", note: "Financial system saved; political stability maintained through crisis management" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State balance sheet mobilized to absorb private sector losses" },
          gameTheory: { type: "Coordination Game", note: "Government coordinates depositor confidence to prevent bank runs" }
        },
        secondOrderEffects: ["Bank run risk eliminated; deposit flight halted", "Non-performing loan resolution frees credit for new investment within 18 months", "Moral hazard concern: bank shareholders protected from full loss"],
        historicalAnalog: "South Korea KAMCO asset management 1997–2001; Taiwan CDIC intervention",
        choicePrompt: "With banks stabilized, what corporate restructuring strategy is pursued for the heavily indebted corporate sector?",
        choices: ["afc97-L3-aggressive-restructuring", "afc97-L3-regulatory-forbearance", "afc97-L3-fdi-led-restructuring"]
      },

      "afc97-L2-fiscal-stimulus": {
        id: "afc97-L2-fiscal-stimulus",
        layer: 2,
        type: "decision",
        title: "Deploy Fiscal Stimulus Under Capital Controls",
        label: "Domestic Stimulus",
        narrative: "Insulated from speculative pressure by capital controls, the government runs a countercyclical fiscal deficit — investing in infrastructure, maintaining public employment, and subsidizing domestic demand. Unlike IMF-program countries forced into austerity, the domestic economy can breathe. Recovery begins earlier than orthodox forecasts predicted.",
        lensSnapshot: {
          bigCycle: { phase: "Disruption-absorbed", note: "Domestic demand management replaces absent foreign capital" },
          steep: { primary: "E", secondary: "T", note: "Infrastructure investment modernizes productive capacity during recovery" },
          geoEcon: { tool: "Fiscal Statecraft", note: "Domestic demand management as alternative to export-led recovery" },
          gameTheory: { type: "Unilateral Deviation", note: "Breaks from IMF orthodoxy; success challenges dominant paradigm" }
        },
        secondOrderEffects: ["GDP recovery begins 12–18 months ahead of IMF-program peers", "Foreign investor wariness persists; FDI inflows lag recovery", "Policy becomes reference point for heterodox crisis response"],
        historicalAnalog: "Malaysia under Mahathir 1998–1999; GDP growth returned in 1999 ahead of IMF-program peers",
        choicePrompt: "With the domestic economy recovering but foreign investment still absent, when and how are capital controls removed?",
        choices: ["afc97-L3-gradual-liberalization", "afc97-L3-rapid-reopening", "afc97-L3-selective-reopening"]
      },

      // Layer 3 nodes
      "afc97-L3-full-compliance": {
        id: "afc97-L3-full-compliance",
        layer: 3,
        type: "decision",
        title: "Full IMF Conditionality Compliance",
        label: "Full Compliance",
        narrative: "The government implements all IMF conditions: bank closures, fiscal austerity, corporate debt restructuring, and capital account liberalization. The short-term contraction is severe. But international creditor confidence is restored quickly. Within 18 months, capital begins to return. The restructured economy, leaner and more transparent, begins to recover on a more sustainable foundation.",
        lensSnapshot: {
          bigCycle: { phase: "Reset-complete", note: "Clean structural adjustment; creditor confidence restored" },
          steep: { primary: "E", secondary: "P", note: "Economic pain absorbed; political system survives with external validation" },
          geoEcon: { tool: "Alliance Architecture", note: "IMF relationship as international credibility signal" },
          gameTheory: { type: "Credible Commitment", note: "Compliance as signal of future policy reliability" }
        },
        secondOrderEffects: ["Rating agency upgrades follow compliance; borrowing costs fall", "Domestic banking sector permanently restructured along Western standards", "Political resentment of IMF conditions fuels subsequent regional financial architecture (Chiang Mai Initiative)"],
        historicalAnalog: "South Korea 1997–2001; full compliance and rapid recovery; early IMF repayment 2001",
        choicePrompt: "With the IMF program complete and recovery underway, what post-crisis financial architecture does the nation pursue?",
        choices: ["afc97-L4-chiang-mai-initiative", "afc97-L4-imf-reform-advocacy", "afc97-L4-reserve-accumulation"]
      },

      "afc97-L3-aggressive-restructuring": {
        id: "afc97-L3-aggressive-restructuring",
        layer: 3,
        type: "decision",
        title: "Aggressive Corporate Debt Restructuring",
        label: "Aggressive Restructuring",
        narrative: "Heavily leveraged conglomerates are subject to forced debt restructuring: equity is wiped out, management replaced, assets sold. The process is brutal and politically contested — many conglomerates have deep ties to political families. But the corporate sector emerges genuinely leaner, more competitive, and less reliant on state-directed credit.",
        lensSnapshot: {
          bigCycle: { phase: "Reset-accelerated", note: "Corporate restructuring accelerates cycle completion" },
          steep: { primary: "E", secondary: "P", note: "Political economy of restructuring; crony capitalism model disrupted" },
          geoEcon: { tool: "Fiscal Statecraft", note: "State power deployed to dismantle inefficient corporate structures" },
          gameTheory: { type: "Forcing Game", note: "Government uses crisis leverage to change corporate governance equilibrium" }
        },
        secondOrderEffects: ["Short-term unemployment spike from conglomerate downsizing", "Export sector becomes more competitive without cross-subsidization from state banks", "FDI inflows accelerate as corporate governance improves"],
        historicalAnalog: "South Korea chaebol restructuring 1998–2001; Daewoo liquidation",
        choicePrompt: "With corporate restructuring underway, how does the nation reorient its export strategy in the post-crisis period?",
        choices: ["afc97-L4-export-diversification", "afc97-L4-technology-upgrading", "afc97-L4-regional-value-chains"]
      },

      "afc97-L3-gradual-liberalization": {
        id: "afc97-L3-gradual-liberalization",
        layer: 3,
        type: "decision",
        title: "Gradual Capital Account Liberalization",
        label: "Gradual Reopening",
        narrative: "Capital controls are removed in stages over 18–24 months, with long-term FDI welcomed first, portfolio flows second, and short-term speculative flows last. The graduated approach prevents a second speculative attack while slowly re-engaging with international capital markets. Domestic institutional capacity to manage capital flows is built during the transition.",
        lensSnapshot: {
          bigCycle: { phase: "Recovery — Cautious", note: "Managed reintegration into global capital markets" },
          steep: { primary: "E", secondary: "T", note: "Financial regulatory capacity building during reopening" },
          geoEcon: { tool: "Alliance Architecture", note: "Selective capital account architecture; FDI vs. hot money distinction" },
          gameTheory: { type: "Sequential Game", note: "Sequencing controls removal to maximize stability" }
        },
        secondOrderEffects: ["Long-term FDI inflows return ahead of portfolio flows", "Domestic financial regulators develop genuine capital flow management capacity", "IMF eventually endorses graduated approach as best practice"],
        historicalAnalog: "Malaysia gradual capital control removal 1999–2001; China's selective capital account management",
        choicePrompt: "With capital controls successfully removed and the economy reintegrated, what long-term financial resilience architecture is built?",
        choices: ["afc97-L4-reserve-accumulation", "afc97-L4-regional-swap-lines", "afc97-L4-domestic-bond-market"]
      },

      // Layer 4 terminal nodes
      "afc97-L4-chiang-mai-initiative": {
        id: "afc97-L4-chiang-mai-initiative",
        layer: 4,
        type: "terminal",
        title: "Chiang Mai Initiative — Regional Financial Architecture",
        label: "Regional Reserve Pool",
        narrative: "The humiliation of IMF conditionality catalyzes a regional response: ASEAN+3 nations establish bilateral swap lines and eventually a multilateralized reserve pool. The architecture provides an alternative to IMF dependence — crisis liquidity without political conditionality from Washington.",
        outcome: "REGIONAL FINANCIAL AUTONOMY",
        outcomeNarrative: "Asia builds its own financial safety net, reducing IMF dependence and asserting regional financial sovereignty. The architecture is incomplete but functional. The 2008 crisis tests it; the COVID crisis further develops it. The long-term consequence is a gradual redistribution of global financial governance away from Bretton Woods institutions.",
        finalLensScores: {
          bigCycle: "Reset → Regional Architecture Formation",
          steep: { S: 0.5, T: 0.4, E: 0.8, En: 0.2, P: 0.9 },
          geoEcon: "Alliance Architecture — Regional Financial Autonomy",
          gameTheory: "Coalition Formation — changes global financial governance game"
        },
        historicalAnalog: "Chiang Mai Initiative 2000; CMIM multilateralization 2010; ASEAN+3 Macroeconomic Research Office",
        aiPromptSeed: "The simulation has reached the Chiang Mai Initiative outcome. Extend the simulation to model how Asian regional financial architecture evolves through the 2008 crisis, the 2013 taper tantrum, and the 2020 COVID shock."
      },

      "afc97-L4-reserve-accumulation": {
        id: "afc97-L4-reserve-accumulation",
        layer: 4,
        type: "terminal",
        title: "Massive Foreign Reserve Accumulation",
        label: "Build Reserves",
        narrative: "The lesson drawn from the crisis: never again run out of foreign reserves. Asian central banks embark on systematic reserve accumulation, buying US Treasury bonds with export surpluses. This creates the 'global imbalances' that will fuel the 2008 crisis, but provides near-total immunity from speculative attacks.",
        outcome: "FINANCIAL FORTRESS — GLOBAL IMBALANCE CONTRIBUTION",
        outcomeNarrative: "Asian reserve accumulation successfully eliminates vulnerability to speculative attacks. But the recycling of Asian savings into US Treasuries suppresses long-term US interest rates, contributing to the credit bubble that produces the 2008 global financial crisis. Crisis prevention in one node of the system creates fragility in another.",
        finalLensScores: {
          bigCycle: "Recovery → Next Cycle Seed",
          steep: { S: 0.3, T: 0.3, E: 0.9, En: 0.2, P: 0.7 },
          geoEcon: "Currency Manipulation — systematic reserve accumulation",
          gameTheory: "Defection from Global Rebalancing — rational individually, collectively destabilizing"
        },
        historicalAnalog: "China, Japan, South Korea reserve accumulation 2000–2007; Bernanke 'global savings glut' speech 2005",
        aiPromptSeed: "The simulation has reached the reserve accumulation outcome. Model how Asian reserve recycling into US Treasuries contributes to the conditions for the 2008 global financial crisis."
      },

      "afc97-L4-export-diversification": {
        id: "afc97-L4-export-diversification",
        layer: 4,
        type: "terminal",
        title: "Export Market Diversification",
        label: "Diversify Export Markets",
        narrative: "Post-crisis, the nation deliberately reduces its dependence on US and European export markets by deepening intra-Asian trade, developing African and Middle Eastern relationships, and shifting its export mix toward higher-value manufactured goods. The diversification insulates subsequent growth from Western demand cycles.",
        outcome: "EXPORT ARCHITECTURE REORIENTATION",
        outcomeNarrative: "Successful diversification reduces the 'anchor market' vulnerability that made the 2008 US demand shock so damaging to concentrated exporters. The nation enters the 2010s with a more resilient and geographically distributed economic base.",
        finalLensScores: {
          bigCycle: "Recovery → Sustained Accumulation",
          steep: { S: 0.5, T: 0.6, E: 0.8, En: 0.3, P: 0.6 },
          geoEcon: "Alliance Architecture — Trade Diversification",
          gameTheory: "Portfolio Diversification — reduces single-counterparty exposure"
        },
        historicalAnalog: "South Korea and Taiwan trade diversification post-1998; ASEAN free trade architecture deepening",
        aiPromptSeed: "The simulation has reached an export diversification outcome. Model how diversified Asian exporters perform differently from concentrated ones during the 2008 global financial crisis and the subsequent US-China trade war."
      }
    }
  }
];

export default HISTORICAL_SCENARIOS;
