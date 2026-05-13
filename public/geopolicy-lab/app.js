// ============================================================
// DATA LAYER
// ============================================================

const ACTORS = {
  us_declining: {
    label: 'United States', subtitle: '1929–1934 / Stage 5 Decline',
    stage: 5, stageLabel: 'Decline', stageColor: '#f97316',
    mpStage: 'MP3', debtStatus: 'PONZI_FINANCE', printingProb: 85,
    bubbleAlert: true, compositeScore: 7.2,
    flags: ['CRITICAL_DEBT','BUBBLE_ALERT','INTERNAL_CONFLICT'],
    forceScores: { 'Debt / Money': 8.5, 'Internal Order': 7.0, 'External Order': 6.0, 'Nature / Climate': 3.0, 'Technology': 3.0 },
    cyclePhase: 'Deflationary Depression Path',
    analogy: 'US 1929–1933'
  },
  us_peak: {
    label: 'United States', subtitle: '1982–1990 / Stage 3 Peak Power',
    stage: 3, stageLabel: 'Peak Power', stageColor: '#06b6d4',
    mpStage: 'MP2', debtStatus: 'BEAUTIFUL_DELEVERAGING', printingProb: 25,
    bubbleAlert: false, compositeScore: 4.0,
    flags: [],
    forceScores: { 'Debt / Money': 4.5, 'Internal Order': 3.0, 'External Order': 3.0, 'Nature / Climate': 2.0, 'Technology': 1.5 },
    cyclePhase: 'Expansion — Technology-Led',
    analogy: 'US 1985 (Plaza Accord)'
  },
  us_late: {
    label: 'United States', subtitle: '2022–2026 / Stage 4 Overextension',
    stage: 4, stageLabel: 'Overextension', stageColor: '#eab308',
    mpStage: 'MP2', debtStatus: 'UNSUSTAINABLE', printingProb: 65,
    bubbleAlert: false, compositeScore: 5.9,
    flags: ['BUBBLE_ALERT','JURISDICTION_RISK'],
    forceScores: { 'Debt / Money': 6.5, 'Internal Order': 6.5, 'External Order': 5.5, 'Nature / Climate': 3.5, 'Technology': 2.0 },
    cyclePhase: 'Managed Decline — Tech Hegemony Maintained',
    analogy: 'US 2022 (SWIFT / Chip War)'
  },
  western_alliance: {
    label: 'Western Alliance', subtitle: '2022 / Collective Stage 4',
    stage: 4, stageLabel: 'Overextension', stageColor: '#eab308',
    mpStage: 'MP2', debtStatus: 'UNSUSTAINABLE', printingProb: 60,
    bubbleAlert: false, compositeScore: 5.6,
    flags: ['INTERNAL_CONFLICT'],
    forceScores: { 'Debt / Money': 6.0, 'Internal Order': 5.5, 'External Order': 6.5, 'Nature / Climate': 4.0, 'Technology': 2.5 },
    cyclePhase: 'Alliance Under Stress — External Threat Cohesion',
    analogy: 'NATO / EU 2022'
  },
  eurozone_creditor: {
    label: 'Eurozone (Creditor)', subtitle: '2011–2015 / Stage 4',
    stage: 4, stageLabel: 'Overextension', stageColor: '#eab308',
    mpStage: 'MP2', debtStatus: 'BORDERLINE', printingProb: 45,
    bubbleAlert: false, compositeScore: 5.5,
    flags: ['INTERNAL_CONFLICT'],
    forceScores: { 'Debt / Money': 6.0, 'Internal Order': 5.5, 'External Order': 4.0, 'Nature / Climate': 3.0, 'Technology': 3.0 },
    cyclePhase: 'Austerity Trap — Periphery Sovereign Stress',
    analogy: 'Germany / ECB 2011'
  },
  china_challenger: {
    label: 'China', subtitle: '2025–2030 / Stage 3 Peak Power',
    stage: 3, stageLabel: 'Peak Power', stageColor: '#06b6d4',
    mpStage: 'MP2', debtStatus: 'BORDERLINE', printingProb: 40,
    bubbleAlert: true, compositeScore: 4.5,
    flags: ['BUBBLE_ALERT'],
    forceScores: { 'Debt / Money': 5.5, 'Internal Order': 4.0, 'External Order': 3.5, 'Nature / Climate': 5.0, 'Technology': 2.5 },
    cyclePhase: 'Consolidation — Challenger Rising, Export Stress',
    analogy: 'China 2025 (Yuan / Tech Push)'
  },
  us_transition: {
    label: 'United States', subtitle: 'Forward Config / Stage 5–6',
    stage: 5, stageLabel: 'Decline → Crisis', stageColor: '#ef4444',
    mpStage: 'MP3', debtStatus: 'PONZI_FINANCE', printingProb: 80,
    bubbleAlert: true, compositeScore: 7.5,
    flags: ['CRITICAL_DEBT','BUBBLE_ALERT','WAR_ECONOMY'],
    forceScores: { 'Debt / Money': 8.0, 'Internal Order': 7.0, 'External Order': 7.0, 'Nature / Climate': 4.0, 'Technology': 3.0 },
    cyclePhase: 'Crisis / Reset — Power Transfer Active',
    analogy: 'UK 1945–1956 (Suez Analogy)'
  }
};

const INSTRUMENTS = {
  tariffs: {
    label: 'Tariffs', icon: '⚖️',
    desc: 'Import duties on foreign goods, sectors, or nations',
    scores: { precision: 4, impact: 6, circumvention: 5, visibility: 8, speed: 5 },
    utilityClass: 'domestic_protection', utilityLabel: 'Domestic Protection', utilityColor: '#10b981',
    timeHorizon: 'medium_term'
  },
  financial_sanctions: {
    label: 'Financial Sanctions', icon: '🔒',
    desc: 'SWIFT exclusion, dollar clearing restrictions, banking access denial',
    scores: { precision: 6, impact: 9, circumvention: 5, visibility: 10, speed: 9 },
    utilityClass: 'coercive_leverage', utilityLabel: 'Coercive Leverage', utilityColor: '#ef4444',
    timeHorizon: 'immediate'
  },
  export_controls: {
    label: 'Export Controls', icon: '🚫',
    desc: 'Technology denial targeting specific entities, products, or sectors',
    scores: { precision: 8, impact: 7, circumvention: 5, visibility: 7, speed: 4 },
    utilityClass: 'strategic_deterrence', utilityLabel: 'Strategic Deterrence', utilityColor: '#8b5cf6',
    timeHorizon: 'long_term'
  },
  currency_intervention: {
    label: 'Currency Intervention', icon: '💱',
    desc: 'Coordinated FX intervention or reserve policy to adjust exchange rates',
    scores: { precision: 4, impact: 7, circumvention: 6, visibility: 7, speed: 6 },
    utilityClass: 'alliance_management', utilityLabel: 'Alliance Management', utilityColor: '#3b82f6',
    timeHorizon: 'short_term'
  },
  reserve_currency: {
    label: 'Reserve Currency Lever', icon: '💵',
    desc: 'Dollar clearing weaponization, SWIFT architecture as statecraft tool',
    scores: { precision: 5, impact: 10, circumvention: 4, visibility: 8, speed: 7 },
    utilityClass: 'structural_dependency', utilityLabel: 'Structural Dependency', utilityColor: '#f97316',
    timeHorizon: 'medium_term'
  },
  secondary_sanctions: {
    label: 'Secondary Sanctions', icon: '⛓️',
    desc: 'Extraterritorial sanctions targeting third parties who trade with the primary target',
    scores: { precision: 4, impact: 8, circumvention: 6, visibility: 9, speed: 6 },
    utilityClass: 'coercive_leverage', utilityLabel: 'Coercive Leverage', utilityColor: '#ef4444',
    timeHorizon: 'short_term'
  },
  conditionality: {
    label: 'IMF / ESM Conditionality', icon: '📋',
    desc: 'Structured financial assistance with attached structural adjustment conditions',
    scores: { precision: 7, impact: 8, circumvention: 3, visibility: 9, speed: 5 },
    utilityClass: 'structural_dependency', utilityLabel: 'Structural Dependency', utilityColor: '#f97316',
    timeHorizon: 'long_term'
  },
  diplomatic_mix: {
    label: 'Diplomatic + Economic Mix', icon: '🤝',
    desc: 'Combined diplomatic engagement with conditional economic incentives',
    scores: { precision: 6, impact: 5, circumvention: 7, visibility: 6, speed: 3 },
    utilityClass: 'alliance_management', utilityLabel: 'Alliance Management', utilityColor: '#3b82f6',
    timeHorizon: 'long_term'
  }
};

// ============================================================
// STEEP NARRATIVES — per-scenario, per-dimension (3 sentences each)
// ============================================================

const STEEP_NARRATIVES = {
  'smoot-hawley': {
    S: "The tariff spiral devastated working-class households through import price inflation while simultaneously collapsing export-sector employment in farming and manufacturing — US unemployment rose from 3.2% to 23.6% in three years. Social anger about economic collapse was channeled into political realignment, empowering FDR's New Deal coalition and permanently reshaping the social contract between government and labor. The generational trauma of the Depression altered American attitudes toward government intervention in ways that remained visible in policy architecture through the 1980s.",
    T: "Trade contraction severely curtailed the cross-border technology diffusion that had accelerated American industrialization through the 1920s, as companies lost access to foreign machinery, materials, and manufacturing process knowledge. Domestic production protected by tariffs appeared to boost self-sufficiency but in practice insulated inefficient producers from competitive pressure, slowing productivity growth at a critical moment. The longer-term technological cost was a missed decade of electrification and mechanization convergence that required sustained international industrial exchange to achieve.",
    E: "World trade fell 66% between 1929 and 1934 as 25 countries enacted retaliatory measures within 18 months of Smoot-Hawley's passage — the most rapid trade contraction in modern economic history. The tariff spiral compounded simultaneous fiscal and monetary contraction, destroying approximately 30% of US nominal GDP in three years and providing the definitive empirical case against protectionism. The episode's lasting economic legacy was the GATT (1947) and WTO architecture — institutions designed specifically to prevent recurrence by removing tariff authority from congressional logrolling.",
    En: "The economic collapse paradoxically reduced industrial pollution and resource extraction in the early Depression years, though the agricultural price collapse it accelerated contributed directly to the Dust Bowl catastrophe of 1934–36. Agricultural trade disruption created severe overproduction and land degradation as farmers worked harder on more marginal land to offset collapsing prices, undermining the soil conservation that had barely begun in the preceding decade. The Dust Bowl displaced 3.5 million people — a forced environmental migration that accompanied the simultaneous economic one and concentrated rural poverty in urban centers unprepared to absorb it.",
    P: "Smoot-Hawley passed over the explicit objections of 1,028 economists who petitioned President Hoover — one of the clearest early examples of expert consensus overridden by Congressional interest-group politics and constituent pressure. The retaliatory tariffs it triggered delegitimized Republican protectionist orthodoxy for a generation, opening political space for the Reciprocal Trade Agreements Act of 1934 that transferred tariff authority from Congress to the executive. That structural change defined US trade governance for nine decades and framed the debate that the 2018–2024 tariff era has once again reopened."
  },
  'plaza-accord': {
    S: "The Plaza Accord's dollar depreciation provided relief to US manufacturing workers facing Japanese import competition — particularly in the auto sector where Japanese penetration had reached 22% — while imposing adjustment costs on Japanese export workers as their goods became less competitive. The coordination was a political response to nascent protectionist pressure in Congress, channeling social anger about deindustrialization into a multilateral mechanism rather than tariffs that would have provoked broader disruption. Social stability in allied nations was preserved through economic diplomacy rather than the trade barriers that would have compounded it.",
    T: "Exchange rate coordination required unprecedented macroeconomic policy alignment among major economies, establishing the institutional template for G7 economic governance that persists today. The Plaza Accord demonstrated that monetary statecraft — coordinated central bank intervention — could achieve structural trade adjustment without the technological disruption of industrial policy, validating financial instruments over real-economy interventions. The success of the accord reinforced the primacy of financial tools in managing trade imbalances, shaping economic orthodoxy through the 1990s Washington Consensus.",
    E: "The dollar depreciated 40% against the yen and 46% against the deutschmark in the two years following the Plaza Accord, driven primarily by the credible commitment signal rather than sustained physical intervention. The US current account deficit narrowed from 3.5% of GDP in 1987 to near balance by 1991, validating exchange rate adjustment as the mechanism for global rebalancing. The accord demonstrated the power of coordination games: when major players align on a focal point, markets do most of the heavy lifting without requiring ongoing policy expenditure.",
    En: "The Plaza Accord had no direct environmental dimension, though the subsequent Japanese investment boom it triggered — as Japanese manufacturers localized US production to reduce currency exposure — significantly affected industrial geography and regional energy consumption patterns. The US manufacturing revival that followed the dollar correction temporarily reversed deindustrialization, maintaining domestic industrial production and its associated environmental footprint rather than fully offshoring it. The rebalancing also affected global energy markets, as a weaker dollar raised the real cost of dollar-denominated oil imports for non-US economies.",
    P: "The Plaza Accord was a triumph of executive-branch economic diplomacy — Treasury Secretary James Baker negotiated a fundamental realignment of the global monetary system in a single afternoon meeting, demonstrating that institutional credibility can substitute for prolonged negotiation. The political urgency was real: Congress had introduced over 300 protectionist bills in 1985, and the White House needed to demonstrate that the trade deficit could be addressed without tariffs. The accord established the G5 as a credible venue for economic coordination and reinforced the multilateral financial governance architecture that would prove essential in later crises."
  },
  'swift-exclusion': {
    S: "The SWIFT exclusion and asset freeze imposed devastating social costs on ordinary Russian citizens — inflation surged to 17% as the ruble collapsed, eroding real wages and triggering mass emigration of educated workers representing the most significant Russian social disruption since the 1990s. Within Western nations, the secondary effect of Russian energy retaliation drove an energy affordability crisis that disproportionately affected lower-income households, testing the social sustainability of sanctions maintenance across coalition members. The social asymmetry of sanctions — concentrated on target populations, diffuse on sender populations — created durable domestic support for the measures despite economic friction.",
    T: "Russia's exclusion from Western technology supply chains — extending beyond SWIFT to semiconductors, aircraft components, and industrial equipment — accelerated a technological degradation of the Russian economy that will persist for a generation. Sanctions interrupted Russia's integration into global technology networks just as AI and advanced manufacturing were reshaping industrial competition, locking it into an increasingly obsolete trajectory relative to both Western and Chinese competitors. The episode also revealed the vulnerability of financial system technology to geopolitical weaponization, accelerating investment in alternative payment architectures by non-Western nations seeking to insulate themselves from equivalent exposure.",
    E: "The asset freeze of approximately $300 billion in Russian central bank reserves was the largest sovereign asset confiscation in modern history and immediately impaired Russia's ability to defend the ruble or finance imports. Russian GDP contracted approximately 2.2% in 2022 — far less than initial forecasts of 15% decline, reflecting Russia's ability to redirect trade through China, India, and Turkey and the continued flow of energy revenues. The economic impact was asymmetric: Russia retained substantial commodity revenues while Western nations absorbed energy price shocks, complicating the cost-benefit calculus of sustained sanctions maintenance.",
    En: "The sanctions-driven collapse of Russian fossil fuel exports to Europe accelerated European investment in renewable energy — the REPowerEU plan committed €300 billion to energy independence, representing the largest peacetime energy transition investment in European history. Russian gas fields that could not be redirected to alternative markets were partially shut in, reducing global greenhouse gas emissions as a byproduct of the geopolitical conflict. The long-term environmental effect depends heavily on which replacement sources Europe deploys: where gas was replaced by coal, as occurred in Germany's short-term response, the net environmental impact was negative.",
    P: "The SWIFT exclusion demonstrated that financial infrastructure — previously considered a neutral commercial system — could be transformed into a precision geopolitical weapon, establishing a precedent that will reshape reserve management decisions globally for decades. The episode accelerated de-dollarization discussions in non-Western capitals, with the BRICS grouping formally exploring alternative reserve mechanisms and China accelerating CIPS adoption among Belt and Road partner nations. The most durable political consequence is the precedent that sovereign financial assets held in Western systems are subject to confiscation — creating powerful incentives for reserve diversification that will structurally reduce Western financial leverage over time."
  },
  'chip-war': {
    S: "Export controls on advanced semiconductors created significant social disruption within the US technology sector as allied firms lost Chinese market revenues and supply chains reorganized under national security constraints — Nvidia alone estimated $5.5 billion in inventory write-downs. In China, the technology denial generated nationalist political mobilization and accelerated state investment in domestic capability, shifting the social framing from commercial competition to civilizational self-sufficiency. The controls also raised difficult social questions in Taiwan and South Korea about economic dependence on US-China confrontation, as their semiconductor industries found themselves at the center of a geopolitical conflict they did not choose.",
    T: "The semiconductor export controls targeted specific technological chokepoints — extreme ultraviolet lithography, advanced packaging, AI training chips — where US and allied suppliers held near-monopoly positions and where denial would impose maximum capability delay on the target. China's forced acceleration of indigenous semiconductor development produced genuine technological progress: SMIC achieved 7nm production within 18 months of the most severe controls, compressing a development timeline that would otherwise have taken five or more years. The strategic question raised — whether technology denial accelerates or slows challenger capability development — remains empirically unresolved, as denial creates both urgency and removes the learning benefits of accessing frontier technology directly.",
    E: "The controls imposed significant economic costs on US semiconductor firms while the broader impact on China's AI sector remains contested, with Chinese entities successfully sourcing some controlled capabilities through third-country intermediaries. Global semiconductor investment has bifurcated, with the CHIPS Act committing $52 billion to domestic US capacity in parallel with equivalent Chinese state investment — a costly replication of productive capacity that reduces global efficiency. The economic logic of the controls depends on a time-horizon assumption: if China achieves near-parity within 5–10 years, the controls impose permanent costs on US firms without achieving lasting strategic advantage.",
    En: "Semiconductor manufacturing is among the most resource-intensive industries — a single advanced fab consumes as much water as a small city and requires thousands of specialty chemicals with significant environmental handling requirements. The forced replication of semiconductor capacity across multiple national sites rather than concentration in cost-optimized locations will increase the aggregate environmental footprint of global chip production substantially. The transition to AI-intensive computing that the chip war is partly contesting carries its own environmental cost: training large AI models requires massive electricity consumption, and the winner of the AI race will also become among the largest industrial electricity consumers.",
    P: "The export controls represented a fundamental shift in US economic doctrine — from the post-Cold War assumption that economic engagement would integrate China into the liberal order, to the explicit use of technology policy as a geopolitical instrument deployed at scale. The controls required unprecedented coordination with allied governments — the Netherlands (ASML), Japan (Tokyo Electron), and South Korea — establishing a template for technology-based alliance management that will define great power competition going forward. The political durability of the controls depends on allied coalition cohesion: each commercial defection seeking market access reduces control architecture effectiveness and forces the US to choose between broadening measures and accepting their erosion."
  },
  'yuan-internationalization': {
    S: "Yuan internationalization creates uneven social effects — nations that adopt Chinese financial architecture gain access to trade finance and development lending on favorable terms, while those that resist face potential exclusion from Belt and Road investment flows. Within China, reserve currency ambitions require financial liberalization — capital account opening, rule-of-law strengthening — that would constrain the Communist Party's economic control mechanisms, creating internal political tension between international ambition and domestic governance. In the United States, the prospect of dollar displacement generates significant political anxiety, as reserve currency status is widely associated with cheaper borrowing costs that directly benefit government finances and domestic consumers.",
    T: "The digital yuan (e-CNY) represents China's most technologically significant contribution to the reserve currency competition — a programmable, state-controlled digital currency that can be deployed without SWIFT infrastructure and that already has 260 million active users domestically. China's technology firms — Alipay, WeChat Pay — have already established digital payment dominance across Asia and Africa, creating a financial technology stack that could support yuan settlement without requiring changes to the traditional banking system. The competition between dollar and yuan may ultimately be decided not by economic fundamentals but by which nation builds the more attractive digital financial architecture — a race where China currently has the more advanced consumer-facing infrastructure but where the dollar's institutional depth remains decisive.",
    E: "The dollar's reserve currency status provides the United States with an estimated $100 billion annual 'exorbitant privilege' — the ability to borrow cheaply because global demand for dollar assets suppresses US interest rates across the yield curve. Yuan internationalization remains structurally constrained by China's capital account controls, which prevent the free flow of funds that makes a currency genuinely usable as a reserve asset — a contradiction the Communist Party has not resolved because resolution requires accepting financial vulnerability. Even partial reserve diversification toward the yuan would raise US borrowing costs at a moment of elevated national debt, making reserve currency defense a fiscal priority for the United States beyond its purely geopolitical significance.",
    En: "Reserve currency status has significant environmental implications: dollar-denominated commodity markets, particularly oil, have historically insulated US consumers from commodity price signals that might encourage energy efficiency or transition investment. Yuan-denominated commodity pricing at scale would redistribute commodity price risk in ways that could affect transition incentives globally, as different actors would face different exchange-rate exposures to fossil fuel imports. China's Belt and Road Initiative, closely linked to yuan internationalization, has financed significant fossil fuel infrastructure in developing nations — creating a tension between China's domestic green investment ambitions and its overseas energy financing that the internationalization strategy has not resolved.",
    P: "The reserve currency competition is fundamentally a political contest about which nation's legal and institutional architecture the world trusts enough to hold as stores of value — and on that dimension, China's authoritarian governance model remains a structural disadvantage relative to the rule-of-law commitments that underpin dollar holdings. The BRICS expansion to include Saudi Arabia, UAE, Egypt, Ethiopia, Iran, and Argentina in 2024 represents the most significant political mobilization behind a non-dollar reserve architecture since the Bretton Woods conference, signaling that dissatisfaction with dollar hegemony has become mainstream rather than marginal. The outcome of this competition will determine which nation has the financial statecraft capacity to impose sanctions, fund deficits without market discipline, and maintain geopolitical commitments without capital cost constraints — the most consequential political question in international economics."
  },
  'eurozone-debt': {
    S: "The austerity programs imposed on Greece, Ireland, Portugal, and Spain — cutting public sector wages, pensions, and social services during a recession — inflicted severe and concentrated social costs on the most vulnerable populations rather than the financial actors whose behavior caused the crisis. Greek GDP fell 26% between 2008 and 2016, producing an unemployment peak of 27.5% and driving emigration of approximately 500,000 working-age Greeks — a social trauma comparable in proportional terms to postwar displacement. The social damage to crisis-era youth — 60% youth unemployment at peak — has had lasting effects on human capital formation, family formation, and political participation that continue to shape European politics a decade later.",
    T: "The sovereign debt crisis exposed the institutional limitations of eurozone economic governance — the monetary union had a single currency and central bank but lacked the fiscal transfer mechanisms, banking union, and sovereign debt restructuring framework that normally accompany currency union. Greece's crisis accelerated European investment in digital financial monitoring infrastructure, stress-testing frameworks, and the ESM institutional architecture — the institutional response to the crisis was, in part, a technology investment program for financial governance that produced lasting improvements in European financial system resilience. The Target2 payment system imbalances that accumulated during the crisis revealed a hidden credit mechanism within the eurozone's plumbing that had not been designed for the stress it was absorbing and that remains a source of structural tension.",
    E: "The Greek debt trajectory was mathematically unsustainable — debt-to-GDP reached 180% by 2018, the highest of any major economy in modern history — yet the Troika's program imposed contractionary fiscal policy that shrank the denominator (GDP) faster than the numerator (debt), making the ratio consistently worse. The economic logic of the conditionality programs was internally contradictory: simultaneous fiscal consolidation, structural reform, and internal devaluation in a fixed exchange rate system required a Keynesian contraction that destroyed the tax base needed to achieve the primary surplus the program demanded. The IMF's own post-crisis assessment acknowledged that the fiscal multipliers used to design the Greek program were incorrect by a factor of three, validating the critique that the programs were designed for political rather than economic rationality.",
    En: "The austerity years saw significant environmental degradation in crisis countries as governments cut environmental enforcement budgets, renewable energy subsidies were clawed back under fiscal pressure, and economic desperation led to illegal logging and resource extraction in rural areas. Greece's substantial renewable energy potential — solar, wind, geothermal — went underdeveloped during the crisis decade as investment capital was frozen and subsidy frameworks were dismantled under Troika conditionality, precisely when the energy transition window was becoming strategically important. The longer-term environmental consequence is a lost decade of renewable investment in some of Europe's sunniest and windiest locations, creating a structural energy dependence that the 2022 gas price crisis exposed at maximum cost.",
    P: "The sovereign debt crisis produced a permanent rupture in the European social contract — the discovery that eurozone membership did not prevent a creditor bloc from imposing conditions that overrode democratic mandates created deep legitimacy deficits that have not recovered. The Syriza government's capitulation after the Oxi referendum — accepting terms rejected by 61% of Greek voters — became the defining symbol of the tension between democratic legitimacy and financial system membership, with consequences visible in anti-establishment party support across Europe for a decade. The political legacy includes Brexit (partly motivated by debt crisis optics about the EU's democratic accountability), the rise of Eurosceptic governments in Italy, Hungary, and Poland, and the fundamental unsolved challenge of sustaining a currency union among democracies with divergent economic preferences and unequal adjustment burdens."
  },
  'beautiful-deleveraging': {
    S: "A managed power transition requires both nations to communicate convincingly to their domestic audiences that accommodation serves national interest — a social communication challenge that runs directly against the nationalist media environments both countries have cultivated through a decade of strategic competition. In the United States, the domestic political economy of manufacturing decline has generated populist pressure for confrontation rather than accommodation, making cooperative deleveraging politically costly for any administration to defend against domestic critics. The social dimension of coalition formation is ultimately about which bloc offers swing-state populations a better standard-of-living deal — and that competition for hearts and minds among the Global South is more decisive than any formal alliance architecture.",
    T: "A cooperative deleveraging would require technology-sharing arrangements that are deeply counterintuitive in a moment of strategic technology competition — the very technologies most strategically valuable are those each side most wants to deny the other. The alternative — parallel development of incompatible technology standards across 5G, AI frameworks, financial rails, and industrial platforms — imposes enormous global efficiency costs as the world is forced to choose between incompatible technological architectures at every infrastructure investment decision. A genuine beautiful deleveraging in the technology domain would require agreed demilitarization zones — sectors where competition is permitted without national security overlay — which neither government currently has the political capacity to negotiate.",
    E: "A managed power transition that avoids acute financial disruption requires preserving sufficient trade and financial integration to maintain the economic incentives for both parties to remain within the cooperative framework. The historical precedent for beautiful deleveraging is limited — most power transitions have involved acute financial rupture (1914 sterling crisis, 1956 Suez crisis, 1971 Nixon shock) that produced significant wealth destruction before a new equilibrium emerged. The economic stakes of managing this transition well are enormous: the IMF estimates that complete US-China decoupling would reduce global GDP by 7% — roughly the size of the German economy — making the economic case for cooperation compelling even to strategic competitors.",
    En: "Climate change is the one domain where US-China beautiful deleveraging is not merely desirable but existentially necessary — both nations are the largest emitters and both require the other's cooperation to achieve meaningful global emissions reduction. A cooperative transition framework would almost certainly require climate as a coordinating mechanism: joint technology development, linked carbon markets, and coordinated clean energy investment — precisely the kind of positive-sum framework that can sustain cooperation when security competition escalates in other domains. The risk is that security competition poisons climate cooperation, creating a tragedy-of-the-commons failure in the global atmospheric commons at exactly the moment when the emissions reduction window is closing and when the consequences of failure are irreversible.",
    P: "The political challenge of a managed US-China transition is that cooperation requires both leaderships to restrain domestic constituencies that benefit from confrontation — defense industries, nationalist media, technology sector actors seeking market protection — in favor of long-term systemic stability. The Thucydides research shows that of 16 historical power transitions, the 4 that avoided war all involved one or both parties choosing institutional accommodation over competitive escalation at critical decision nodes. The task is to build the equivalent of the US-Soviet arms control architecture — communication channels, red lines, positive-sum domains — before the competitive dynamic forecloses the political space required to create it."
  },
  'thucydides-trap': {
    S: "Trust-building between hegemonic powers requires social narratives in both nations that make cooperation domestically legitimate — an increasingly difficult task in polarized media environments where confrontation generates more engagement than diplomacy and where each cooperative gesture can be framed as weakness by domestic opponents. US public opinion has shifted dramatically toward negative views of China (85% unfavorable in 2023 polls), creating a domestic social constraint on executive-branch cooperation that has no equivalent in the US-Soviet Cold War experience at comparable moments. The generational dimension is critical: if the generation currently entering leadership roles in both countries has been socialized primarily in a competition frame, the social infrastructure for trust-building may not exist when it is most urgently needed.",
    T: "Technology competition is simultaneously the domain most resistant to trust-building and the one where trust would be most valuable — AI systems capable of autonomous military action create catastrophic misperception risks that human communication channels may be too slow to manage under crisis conditions. The US-Soviet experience offers partial guidance: arms control worked not by eliminating competition but by creating mutual visibility through satellite reconnaissance and inspection regimes that reduced the probability of catastrophic miscalculation. An equivalent US-China technology confidence-building framework — covering autonomous weapons, AI decision-making in military systems, and cyber norms — would require a depth of technical disclosure that neither side has demonstrated willingness to provide.",
    E: "Economic interdependence has historically been both a brake on conflict and an accelerant of it — trade ties create mutual vulnerabilities that make war costly, but they also create chokepoints that become weapons during crises, as the 2022 Russia sanctions demonstrated. The current US-China economic relationship, at approximately $700 billion in annual bilateral trade, provides significant financial incentives for both parties to maintain stable relations, but selective decoupling in strategic sectors eliminates the key categories of mutual vulnerability while preserving the appearance of interdependence. The risk is that the economic deterrent to conflict is eroded asymmetrically — as decoupling eliminates the most strategically significant interdependencies — reducing the financial brake on escalation without the domestic political cost of visible separation.",
    En: "Climate represents the clearest case for mutual restraint in the Thucydides dynamic — both the US and China face existential environmental risks that neither can address without the other's cooperation, creating a domain of genuine positive-sum interaction that can anchor broader cooperation during periods of security competition. The Paris Agreement architecture, which survived the Trump administration's withdrawal and Biden's re-entry, demonstrated that climate cooperation can be institutionally resilient even under acute political stress, suggesting it can serve as a coordination focal point. A US-China climate partnership robust enough to prevent catastrophic warming would require technology transfer, joint investment, and policy coordination at a scale that would necessarily generate the trust infrastructure needed to manage the broader power transition across other domains.",
    P: "The Thucydides Trap is ultimately a political failure — a failure of leaders to override the short-term competitive logic that makes escalation locally rational at each decision node even as the aggregate of those decisions leads to globally catastrophic outcomes. The institutional architecture that prevented the Cold War from becoming hot — hotlines, arms control treaties, back-channel diplomacy, nuclear risk reduction centers — was built deliberately by leaders who chose to invest in conflict prevention infrastructure rather than simply managing competition. The task for US and Chinese leadership is to build the equivalent institutional architecture for a multipolar, technology-intensive power transition that has no clean historical precedent — making choices now about communication protocols, red lines, and positive-sum domains that will determine whether the trap closes."
  }
};

// ============================================================
// SCENARIO LIBRARY — 8 PRE-BUILT SCENARIOS
// ============================================================

const SCENARIOS = [
  {
    id: 'smoot-hawley',
    title: 'Smoot-Hawley Spiral',
    era: '1930s', domain: 'trade', domainLabel: 'Trade War',
    difficulty: 'intermediate',
    macroContext: 'Stage 5 decline, deflationary path, MP3 money printing active',
    instrumentType: 'tariffs',
    gameType: 'pd',
    gameLabel: 'Prisoner\'s Dilemma (Iterated)',
    actorPreset: 'us_declining',
    targetLabel: 'Global Trading Partners (UK, Germany, France)',
    brief: 'June 1930. The US economy has contracted 9% in twelve months. Congress passes the Smoot-Hawley Tariff Act, raising duties on over 20,000 imported goods to record levels. Your trading partners face the same choice you do: absorb the cost, or retaliate in kind. The shadow of the future is short — the Great Depression is already unfolding. What does your trade policy signal?',
    aiStrategyKey: 'grim_trigger',
    aiStrategyLabel: 'Grim Trigger',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Hold Trade Policy', desc: 'Maintain existing tariff structure. Signal willingness to negotiate a multilateral trade framework.' },
      { id: 'defect', label: 'Escalate Tariffs', desc: 'Raise tariffs to Smoot-Hawley levels. Prioritize domestic industry protection over trade volume.' }
    ],
    payoffs: {
      cc: { player: 3, opp: 3, label: 'Stable Trade Maintained', class: 'cooperative', narrative: 'Both nations hold. Trade volumes fall modestly but the multilateral architecture holds. The depression deepens, but no spiral.' },
      cd: { player: -4, opp: 5, label: 'You Are Undercut', class: 'adversarial', narrative: 'You hold while your partner escalates. Your exporters are shut out of their markets. GDP contracts sharply.' },
      dc: { player: 5, opp: -4, label: 'Mercantilist Advantage (Round 1)', class: 'mixed', narrative: 'You escalate first. Short-term industry protection gained. Your partner prepares retaliation.' },
      dd: { player: -2, opp: -2, label: 'Trade War Spiral', class: 'adversarial', narrative: 'Both nations escalate. World trade falls 66% over four years. Both economies contract severely. Nash Equilibrium — rational, catastrophic.' }
    },
    gameLesson: 'In a Prisoner\'s Dilemma, defection is the dominant strategy — rational for each player individually, catastrophic collectively. The Smoot-Hawley tariffs triggered retaliatory measures from 25 countries within 12 months. World trade collapsed from $5.3B to $1.8B by 1932. The lesson: in iterated games, reputation and shadow of the future can sustain cooperation. In one-shot or short-horizon games, defection dominates.',
    analogy: 'After Smoot-Hawley passed, Canada, Britain, France and Germany all retaliated with equivalent tariffs within 18 months. US exports fell 61%. The global trading system did not recover until the GATT in 1947.',
    stageEffect: 'Stage 5 context: Late-cycle debt deflation means all actors are more likely to defect — domestic political pressure overwhelms cooperative rationality. Payoffs weighted toward conflict outcomes.',
    instrumentEffect: 'Tariff escalation: High visibility triggers immediate retaliation. Low precision means broad collateral damage to allied trading partners, eroding the coalition needed for coordination.'
  },
  {
    id: 'plaza-accord',
    title: 'Plaza Accord Coordination',
    era: '1985', domain: 'currency', domainLabel: 'Currency',
    difficulty: 'entry',
    macroContext: 'Stage 3 peak power, MP2 rates, dollar overvalued 40% vs trading partners',
    instrumentType: 'currency_intervention',
    gameType: 'coordination',
    gameLabel: 'Coordination Game',
    actorPreset: 'us_peak',
    targetLabel: 'G5 (Japan, Germany, UK, France)',
    brief: 'September 1985. The US dollar has appreciated 50% in five years. The US current account deficit is exploding; Congress is threatening protectionist legislation. Treasury Secretary James Baker has a plan: coordinate with Japan, Germany, UK, and France to jointly depreciate the dollar. But the G5 partners need to believe the US is committed before they act. Who moves first?',
    aiStrategyKey: 'conditional_cooperator',
    aiStrategyLabel: 'Conditional Cooperator',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Signal Multilateral Commitment', desc: 'Announce US commitment to coordinated intervention. Invite G5 to the Plaza Hotel for a joint statement.' },
      { id: 'defect', label: 'Unilateral Dollar Intervention', desc: 'Act alone to weaken the dollar without coordinating with partners. Cheaper and faster, but no burden-sharing.' }
    ],
    payoffs: {
      cc: { player: 6, opp: 6, label: 'Plaza Accord Success', class: 'cooperative', narrative: 'Coordinated G5 intervention drives the dollar down 40% over two years. US trade deficit narrows. All partners benefit from exchange rate stability.' },
      cd: { player: -1, opp: 3, label: 'Partners Free-Ride', class: 'mixed', narrative: 'You signal cooperation; partners pocket the benefit without full commitment. US bears most of the coordination cost.' },
      dc: { player: 2, opp: -2, label: 'Unilateral Devaluation', class: 'mixed', narrative: 'US acts alone. Dollar falls, but without coordination, partners resist and the adjustment is incomplete. Trade tensions persist.' },
      dd: { player: 0, opp: 0, label: 'No Coordination — Status Quo', class: 'adversarial', narrative: 'No one moves. Dollar stays overvalued. Congressional protectionism escalates. The problem festers.' }
    },
    gameLesson: 'Coordination games have two equilibria: all coordinate or none do. The Plaza Accord\'s genius was engineering a focal point — the meeting itself signaled commitment before any action was taken. First-mover advantage in coordination games goes to whoever can credibly commit publicly. The US used institutional architecture (the G5 meeting) to solve the coordination problem.',
    analogy: 'The Plaza Accord meeting on September 22, 1985 took 15 minutes. The joint statement caused the dollar to fall 4% on the first day of trading. Within two years, the dollar had fallen 40% against the yen and deutschmark — without ongoing intervention. The credible commitment did the work.',
    stageEffect: 'Stage 3 context: Peak power actors have institutional credibility to organize coordination. The US can credibly threaten Congress-driven protectionism as an outside option, making partners prefer coordination.',
    instrumentEffect: 'Currency intervention: Alliance management utility. Partners have aligned incentives (export competitiveness) making coordination achievable. High speed of effect once signaled.'
  },
  {
    id: 'swift-exclusion',
    title: 'SWIFT Exclusion — Russia 2022',
    era: '2022', domain: 'sovereignty', domainLabel: 'Financial War',
    difficulty: 'intermediate',
    macroContext: 'Stage 4 overextension, war economy flag active, sanctions architecture deployed',
    instrumentType: 'financial_sanctions',
    gameType: 'chicken',
    gameLabel: 'Chicken Game',
    actorPreset: 'western_alliance',
    targetLabel: 'Russia (Putin Government)',
    brief: 'February 26, 2022. Two days after Russia\'s invasion of Ukraine, the US and EU are debating whether to deploy the nuclear financial option: removing Russia from SWIFT, the global interbank messaging system. The measure will cost Russia $300B in frozen reserves and cut off its banking sector. But Russia can retaliate through energy cutoffs and escalation. Both sides must decide how far they\'re willing to go.',
    aiStrategyKey: 'calculated_escalator',
    aiStrategyLabel: 'Calculated Escalator',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Maintain Maximum Pressure', desc: 'Deploy full SWIFT exclusion and asset freeze. Signal that further escalation will trigger further sanctions.' },
      { id: 'defect', label: 'Relax Sanctions Scope', desc: 'Exclude only some banks; keep energy sector connected. Preserve off-ramp for negotiation.' }
    ],
    payoffs: {
      cc: { player: 5, opp: -5, label: 'Sanctions Hold — Russia Isolated', class: 'cooperative', narrative: 'Russia backs down on further escalation. The financial exclusion holds. Ruble collapses 40%. Long-term structural damage to Russian economy.' },
      cd: { player: -3, opp: 4, label: 'Western Deterrence Fails', class: 'adversarial', narrative: 'West maintains pressure; Russia escalates further (energy cutoffs, nuclear signaling). Credibility of the sanctions architecture damaged.' },
      dc: { player: 3, opp: 2, label: 'Partial Sanctions — Negotiated Outcome', class: 'mixed', narrative: 'Partial measures open space for negotiation. Russia retains energy leverage. A frozen conflict emerges.' },
      dd: { player: -3, opp: -3, label: 'Mutual Assured Economic Damage', class: 'adversarial', narrative: 'West restricts, Russia retaliates with full energy cutoff. European recession. Russian depression. No winner.' }
    },
    gameLesson: 'In a Chicken game, the player who can most credibly commit to not swerving wins — but mutual commitment leads to catastrophe. The West\'s challenge was maintaining coalition unity (internal coordination game) while playing Chicken with Russia. Partial measures signal willingness to swerve. Full measures raise catastrophic-outcome probability but improve deterrence.',
    analogy: 'The SWIFT exclusion in February 2022 froze $300B of Russian reserves and cut Russia off from dollar clearing. Russia\'s response — halting gas supplies to Europe — triggered a European energy crisis. The game continued for two years with neither side achieving dominant position. A textbook Chicken game with no clean resolution.',
    stageEffect: 'Stage 4 context: Overextended hegemon faces credibility test. Internal coalition maintenance (EU unity) is a parallel coordination game that limits how credibly the West can commit to full escalation.',
    instrumentEffect: 'Financial sanctions: Maximum visibility and speed. High impact on target but also high retaliation capacity. The structural dependency (energy) gives Russia real leverage, making this a true Chicken scenario rather than coercion.'
  },
  {
    id: 'chip-war',
    title: 'Chip War Chokepoint',
    era: '2022–2024', domain: 'tech', domainLabel: 'Technology',
    difficulty: 'advanced',
    macroContext: 'Stage 3–4 transition, tech decoupling active, AI race accelerating',
    instrumentType: 'export_controls',
    gameType: 'stackelberg',
    gameLabel: 'Stackelberg Competition (Leader–Follower)',
    actorPreset: 'us_late',
    targetLabel: 'China (SMIC, Huawei, AI Sector)',
    brief: 'October 2022. The Biden administration issues the most sweeping semiconductor export controls in history — targeting advanced chips, chip-making equipment, and software tools. The US controls critical chokepoints: ASML\'s EUV machines, TSMC\'s advanced nodes, NVIDIA\'s AI accelerators. China must respond. As the Stackelberg leader, the US moves first. Your controls define the game China must play.',
    aiStrategyKey: 'best_response',
    aiStrategyLabel: 'Best Response (Stackelberg Follower)',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Tight Controls (Entity List + Equipment)', desc: 'Maximum technology denial. Target AI chips, EUV equipment, advanced software. Accept economic cost to allied chip firms.' },
      { id: 'defect', label: 'Narrow Controls (Military Only)', desc: 'Restrict only explicit military applications. Preserve commercial semiconductor trade. Allow NVIDIA H100 sales to civilian buyers.' }
    ],
    payoffs: {
      cc: { player: 4, opp: -4, label: 'Technology Gap Preserved', class: 'cooperative', narrative: 'Tight controls slow China\'s AI development by 5–7 years. China accelerates indigenous programs — SMIC 7nm, Huawei Kirin — but from a lower base. US maintains 2+ generation lead.' },
      cd: { player: -2, opp: 3, label: 'Controls Circumvented', class: 'adversarial', narrative: 'Narrow controls are routed around via Singapore, Netherlands, third-country procurement. China gains full access. Controls failed to achieve denial.' },
      dc: { player: 2, opp: -2, label: 'Partial Denial — Contested Gap', class: 'mixed', narrative: 'Loose controls deny some capability. China responds by accelerating domestic production with state subsidies. Gap narrows over 3 years.' },
      dd: { player: -1, opp: 0, label: 'Controls Without Allied Coordination', class: 'adversarial', narrative: 'US acts alone; Dutch and Japanese equipment flows freely. Chinese entities source from non-US suppliers. US firms lose revenue with limited strategic gain.' }
    },
    gameLesson: 'In a Stackelberg game, the leader sets the quantity (here: control scope) and the follower best-responds. The US advantage is that it controls genuine chokepoints — EUV lithography, advanced packaging, AI software stacks. But the follower can exit the game by building alternatives. The key insight: controls work when the technology gap is so large that indigenous substitution takes longer than the strategic window. The clock is the constraint.',
    analogy: 'The October 2022 controls required ASML and TSMC to comply or lose US market access. Both complied. China\'s access to sub-7nm chips and advanced AI accelerators was severed. Huawei released the Mate 60 Pro in 2023 — a 7nm chip from SMIC, 2 generations behind — confirming the controls worked but did not halt progress.',
    stageEffect: 'Stage 4 context: Overextended hegemon has incentive to use asymmetric levers before the window closes. Technology controls are most effective when deployed from a position of structural advantage — which erodes as China\'s indigenous capability matures.',
    instrumentEffect: 'Export controls: High precision, durable (long-term), but slow. Circumvention via third countries is the primary vulnerability. Allied coordination (ASML, TSMC, KÉIA) is what makes this instrument effective rather than symbolic.'
  },
  {
    id: 'yuan-internationalization',
    title: 'Yuan Internationalization',
    era: 'Forward 2025–2030', domain: 'currency', domainLabel: 'Monetary Order',
    difficulty: 'advanced',
    macroContext: 'Stage 3 challenger rising, reserve currency positioning, BRICS+ expansion',
    instrumentType: 'reserve_currency',
    gameType: 'signaling',
    gameLabel: 'Signaling Game',
    actorPreset: 'china_challenger',
    targetLabel: 'Global Reserve Currency System (US Dollar Bloc)',
    brief: '2026. China has expanded CIPS (its dollar-clearing alternative), signed bilateral swap lines with 40 countries, and is pricing Belt and Road loans in yuan. The question is not whether China is pushing for reserve currency status — it is. The question is how aggressively to signal that intent, and whether the US response will be accommodation or confrontation. Your signaling strategy shapes the equilibrium.',
    aiStrategyKey: 'sophisticated_receiver',
    aiStrategyLabel: 'Sophisticated Receiver (US Response)',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Gradual Signal — Bilateral Swap Lines', desc: 'Expand yuan swap lines quietly. Let usage grow organically. Avoid explicit challenge to dollar primacy.' },
      { id: 'defect', label: 'Aggressive Signal — BRICS Reserve Currency', desc: 'Announce formal BRICS reserve currency initiative. Challenge dollar hegemony directly. Accelerate CIPS expansion.' }
    ],
    payoffs: {
      cc: { player: 4, opp: 3, label: 'Gradual Multipolarization', class: 'cooperative', narrative: 'Quiet expansion avoids US counter-response. Yuan share of reserves grows from 3% to 8% over five years. De-dollarization proceeds below the threshold of confrontation.' },
      cd: { player: 1, opp: 5, label: 'Signal Ignored — US Maintains Dominance', class: 'adversarial', narrative: 'Gradual approach is too slow. US uses dollar coercion aggressively. BRICS nations accept dollar dependency for market access. Yuan progress stalls.' },
      dc: { player: -2, opp: -2, label: 'Currency War Triggered', class: 'adversarial', narrative: 'Aggressive signal triggers US counter-mobilization: secondary sanctions, allied pressure, IMF architecture defense. Both systems fragment. Global trade costs rise.' },
      dd: { player: 2, opp: 1, label: 'Contested Bipolar Monetary System', class: 'mixed', narrative: 'Aggressive signaling accelerates bifurcation. BRICS bloc uses yuan; Western bloc uses dollar. Global trade fragments into two currency zones. Both suffer efficiency losses.' }
    },
    gameLesson: 'In a signaling game, the sender chooses signal intensity and the receiver decides whether to treat it as credible. The challenge for China: aggressive signals invite counter-mobilization (US secondary sanctions). Weak signals are ignored. The optimal strategy — Spence signaling — is a costly signal that only a genuinely committed actor would send. The question is whether yuan internationalization can demonstrate real commitment without triggering war-level response.',
    analogy: 'The British pound\'s decline from primary reserve currency took 40 years (1914–1956) and required two world wars, the Suez Crisis, and explicit US pressure. China is attempting a managed version of that transition in a world where the incumbent can weaponize the existing architecture against challengers.',
    stageEffect: 'Stage 3 challenger context: The challengers\'s optimal window is before the incumbent deploys full counter-architecture. But credible reserve currency status requires demonstrated stability and liquidity depth that takes decades to build.',
    instrumentEffect: 'Reserve currency lever: Maximum impact potential but extremely slow speed. Structural in nature. The instrument works by building dependency networks that are hard to reverse — exactly the structural dependency logic the US uses.'
  },
  {
    id: 'eurozone-debt',
    title: 'Eurozone Sovereign Debt Crisis',
    era: '2011–2012', domain: 'sovereignty', domainLabel: 'Sovereign Debt',
    difficulty: 'advanced',
    macroContext: 'Stage 5 periphery states, Ponzi finance in Greece, MP2 ECB constraint',
    instrumentType: 'conditionality',
    gameType: 'bargaining',
    gameLabel: 'Nash Bargaining — Asymmetric BATNAs',
    actorPreset: 'eurozone_creditor',
    targetLabel: 'Greece (Syriza Government, 2015)',
    brief: 'July 2015. Greece has just voted 61% to reject the Troika\'s austerity terms in the Oxi referendum. PM Tsipras faces ECB emergency liquidity cutoff in 48 hours. Finance Minister Varoufakis has resigned. Germany\'s Schäuble is pushing for Grexit. The creditors hold the liquidity lever; Greece holds the default threat and eurozone destabilization risk. Both sides go to the table with asymmetric outside options.',
    aiStrategyKey: 'credible_threat',
    aiStrategyLabel: 'Credible Threat (Greece)',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Offer Substantive Haircut (40% NPV)', desc: 'Accept meaningful debt relief as part of a restructuring. Reduce NPV burden by 40% in exchange for structural reforms.' },
      { id: 'defect', label: 'Demand Full Program Compliance', desc: 'No haircut. Full austerity package: pension cuts, VAT increases, primary surplus of 3.5% of GDP. Take it or exit.' }
    ],
    payoffs: {
      cc: { player: 4, opp: 4, label: 'Restructured Agreement', class: 'cooperative', narrative: 'Haircut + reforms create a sustainable debt path. Greece stays in the eurozone. Creditors take a loss but avoid contagion. Both parties above their BATNAs.' },
      cd: { player: -2, opp: 3, label: 'Greece Accepts Under Duress', class: 'mixed', narrative: 'Full program imposed. Greece signs under ECB liquidity pressure. Debt remains unsustainable. Third bailout required within 2 years.' },
      dc: { player: 3, opp: -3, label: 'Greece Rejects — Default Threat Credible', class: 'adversarial', narrative: 'Greece defaults. Creditors must choose: fund orderly exit or risk chaotic contagion. Your position is worse than if you had accepted the haircut.' },
      dd: { player: -4, opp: -4, label: 'Chaotic Grexit', class: 'adversarial', narrative: 'No deal. Greece exits. Euro contagion spreads to Italy and Spain. Both parties well below their BATNAs. The Nash bargaining disagreement point.' }
    },
    gameLesson: 'Nash Bargaining Theory predicts that rational parties split the surplus above their disagreement points in proportion to their bargaining power. The Eurozone crisis revealed that Greece\'s credible default threat was its only source of bargaining power — but ECB liquidity control neutralized it. The actual outcome (full program, no meaningful haircut) reflected Germany\'s ability to make Greece\'s BATNA worse through ECB pressure, not the Nash solution.',
    analogy: 'Varoufakis later revealed that Greece had a "Plan B" — a parallel payment system and capital controls. The creditors\' ultimate leverage was that this plan was barely credible and would have been catastrophic for Greek citizens. The negotiation ended with Greece accepting terms worse than what the Oxi referendum rejected.',
    stageEffect: 'Stage 5 periphery context: Late-cycle debt crisis eliminates debtor bargaining power. Creditors can make the outside option sufficiently bad to extract concessions. The asymmetry is structural, not negotiated.',
    instrumentEffect: 'IMF/ESM Conditionality: Maximum circumvention resistance (no alternative lender at scale), high precision (can target specific policy areas), high impact. The instrument is most powerful when the debtor has no exit option.'
  },
  {
    id: 'beautiful-deleveraging',
    title: 'US–China Beautiful Deleveraging',
    era: 'Forward 2030–2040', domain: 'power', domainLabel: 'Power Transition',
    difficulty: 'advanced',
    macroContext: 'Stage 6 managed decline, multi-instrument package, coalition competition',
    instrumentType: 'diplomatic_mix',
    gameType: 'coalition',
    gameLabel: 'Coalition Formation Game',
    actorPreset: 'us_transition',
    targetLabel: 'Global Swing States (India, Saudi Arabia, Brazil, Indonesia)',
    brief: '2035. The US-China power gap has narrowed to the point where hegemonic transition is a realistic medium-term scenario. The critical variable: which bloc can build a larger coalition of swing states? India, Saudi Arabia, Brazil, and Indonesia collectively represent 40% of world population and 30% of GDP. Each is currently hedging. The instrument mix — economic incentives, security guarantees, technology access, diplomatic recognition — determines who they align with.',
    aiStrategyKey: 'mirror_coalition',
    aiStrategyLabel: 'Mirror Coalition (China)',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Cooperative Coalition: Offer Access + Guarantee', desc: 'Offer swing states technology access, market openness, and credible security guarantees. Accept the cost of genuine reciprocity.' },
      { id: 'defect', label: 'Coercive Coalition: Secondary Sanctions Pressure', desc: 'Use secondary sanctions and financial exclusion threats to force alignment. Cheaper but breeds resentment.' }
    ],
    payoffs: {
      cc: { player: 3, opp: 3, label: 'Contested Equilibrium — Both Build Coalitions', class: 'mixed', narrative: 'Both powers offer positive-sum deals. Swing states split: some to US, some to China, some remain genuinely non-aligned. A stable bipolar order emerges with meaningful third-party autonomy.' },
      cd: { player: -1, opp: 5, label: 'China Wins Swing States', class: 'adversarial', narrative: 'US offers cooperation; China offers coercive dependency. Swing states accept Chinese terms for market access. US coalition narrows.' },
      dc: { player: 5, opp: -2, label: 'US Dominates via Coercion', class: 'mixed', narrative: 'US secondary sanctions force alignment. Short-term coalition win. Long-term: resentment seeds defection when US leverage weakens.' },
      dd: { player: -3, opp: -3, label: 'Fragmented System — Both Blocs Weak', class: 'adversarial', narrative: 'Coercive strategies from both sides push swing states toward genuine non-alignment. Both blocs shrink. Global governance collapses. Commons problems go unmanaged.' }
    },
    gameLesson: 'Coalition formation games involve side payments to attract members, with members choosing based on expected payoffs from membership. The key insight: coercive coalition building creates brittle alliances that collapse under stress. Cooperative coalition building is more expensive but more durable. The US-led post-WWII order worked because membership was genuinely beneficial — not purely compelled.',
    analogy: 'The Cold War saw both superpowers build coalitions through a mix of positive and coercive instruments. The US alliance system — NATO, Japan, Korea, Australia — was primarily positive-sum and survived Soviet collapse. Soviet client states — maintained through force — dissolved within months of Soviet withdrawal.',
    stageEffect: 'Stage 6 context: Crisis/reset phase means hegemonic legitimacy is contested. Coercive instruments become less effective as the hegemon\'s enforcement capacity is questioned. Cooperative instruments become relatively more powerful — the premium on genuine partnership rises.',
    instrumentEffect: 'Diplomatic + economic mix: Low visibility, slow speed, but high circumvention resistance and alliance durability. The instrument works through genuine value creation, not extraction — which is exactly what a declining hegemon needs to sustain coalition loyalty.'
  },
  {
    id: 'thucydides-trap',
    title: 'Thucydides Trap Avoidance',
    era: 'Forward 2025–2035', domain: 'power', domainLabel: 'Power Transition',
    difficulty: 'advanced',
    macroContext: 'Stage 5–6 transition, diplomatic + economic mix, trust-building under uncertainty',
    instrumentType: 'diplomatic_mix',
    gameType: 'trust_building',
    gameLabel: 'Repeated Trust Game — Reputation Building',
    actorPreset: 'us_transition',
    targetLabel: 'China (Xi-Era Government)',
    brief: '2027. Of the 16 historical cases where a rising power challenged a ruling power, 12 ended in war. The Thucydides Trap is not inevitable — but avoiding it requires both sides to build trust faster than the pace of capability transition. The US and China are currently in a managed competition framework. Each round of interaction builds or destroys the trust stock that determines whether this transition goes the way of 1914 or 1815.',
    aiStrategyKey: 'reciprocal_cooperator',
    aiStrategyLabel: 'Reciprocal Cooperator (Tit-for-Tat)',
    rounds: 2,
    choices: [
      { id: 'cooperate', label: 'Extend Trust Signal', desc: 'Offer a concrete cooperative gesture: climate finance, fentanyl coordination, arms control communication channels. Risk is exploitation.' },
      { id: 'defect', label: 'Maintain Competitive Posture', desc: 'No concessions without reciprocity. Compete on all fronts simultaneously. Trust must be earned, not given.' }
    ],
    payoffs: {
      cc: { player: 5, opp: 5, label: 'Trust Stock Accumulates', class: 'cooperative', narrative: 'Reciprocal cooperation builds a history of interaction that makes conflict less likely. Communication channels reduce misperception risk. The trap is sidestepped incrementally.' },
      cd: { player: -3, opp: 4, label: 'Trust Exploited', class: 'adversarial', narrative: 'US extends trust; China defects. Trust stock destroyed. Domestic politics in both nations harden. Risk of miscalculation rises.' },
      dc: { player: 4, opp: -3, label: 'Unreciprocated Hardline', class: 'adversarial', narrative: 'US maintains hardline while China seeks accommodation. A missed opportunity. Relations deteriorate further. War probability increases marginally.' },
      dd: { player: -2, opp: -2, label: 'Competitive Spiral — Trap Tightens', class: 'adversarial', narrative: 'Both maintain competitive posture. Military expenditure rises. Miscalculation probability rises each year. The Thucydides Trap closes.' }
    },
    gameLesson: 'In a repeated trust game with Tit-for-Tat, cooperation is the dominant long-run strategy — but only if the discount rate is low enough (actors care about the future). The Thucydides dynamic fails because rising powers and declining incumbents often have short planning horizons (domestic political cycles, military competition windows). Institutional mechanisms that extend the shadow of the future — communication channels, arms control, trade interdependence — are the key structural interventions.',
    analogy: 'The US-Soviet relationship navigated multiple potential "traps" (1956, 1962, 1983) through a combination of communication channels (hotline), nuclear risk reduction agreements, and eventually economic engagement. The 1983 Able Archer crisis — nearly nuclear — was resolved partly because both sides had enough interaction history to recognize misperception. China and the US do not yet have equivalent institutional infrastructure.',
    stageEffect: 'Stage 5–6 context: Late-cycle declining hegemon faces the strongest temptation to use military option while it still has the capability advantage. This is the most dangerous moment in any power transition. Trust-building instruments are most valuable — and most difficult — precisely now.',
    instrumentEffect: 'Diplomatic + economic mix: Trust-building requires genuine sacrifice of short-term competitive position. This is why it is difficult: rational short-term analysis always suggests competitive posture. Only long-run rationality supports cooperation — but power transitions create short-term pressure.'
  }
];

// ============================================================
// STATE BUS
// ============================================================

const STATE = {
  panel: 'library',
  filter: 'all',
  env: { actorKey: null, actor: null, locked: false },
  instrument: { key: null, data: null, target: '', locked: false },
  game: {
    scenario: null,
    round: 1,
    playerChoices: [],
    aiChoices: [],
    roundLog: [],
    complete: false,
    totalScore: 0,
    lensScores: { S: 0, T: 0, E: 0, En: 0, P: 0, gameCoopCount: 0, gameDefectCount: 0, bigCyclePhase: '' }
  }
};

function setState(updates) {
  Object.assign(STATE, updates);
  render();
}

// ============================================================
// GAME ENGINE
// ============================================================

function computeSeverity(scores) {
  const w = { precision: 0.20, impact: 0.30, circumvention: 0.20, visibility: 0.15, speed: 0.15 };
  let total = 0;
  for (const k of Object.keys(w)) total += (scores[k] || 0) * w[k];
  return Math.round(total * 10) / 10;
}

function severityTier(s) {
  if (s >= 8) return { tier: 'CRITICAL', color: '#ef4444' };
  if (s >= 6) return { tier: 'HIGH', color: '#f97316' };
  if (s >= 4) return { tier: 'MODERATE', color: '#f59e0b' };
  if (s >= 2) return { tier: 'LOW', color: '#10b981' };
  return { tier: 'MINIMAL', color: '#64748b' };
}

function getStageModifier(stage) {
  // Stage 5-6: harder to cooperate, lower payoffs for cooperation
  if (stage >= 5) return 0.8;
  if (stage >= 3) return 1.0;
  return 1.2;
}

function aiDecide(strategyKey, round, playerHistory) {
  switch (strategyKey) {
    case 'grim_trigger':
      if (round === 1) return 'cooperate';
      return playerHistory.includes('defect') ? 'defect' : 'cooperate';
    case 'conditional_cooperator':
      return round === 1 ? 'defect' : (playerHistory[0] === 'cooperate' ? 'cooperate' : 'defect');
    case 'calculated_escalator':
      if (round === 1) return 'cooperate';
      return playerHistory[0] === 'cooperate' ? 'cooperate' : 'defect';
    case 'best_response':
      return round === 1 ? 'defect' : (playerHistory[0] === 'cooperate' ? 'cooperate' : 'defect');
    case 'sophisticated_receiver':
      return round === 1 ? 'cooperate' : (playerHistory[0] === 'defect' ? 'defect' : 'cooperate');
    case 'credible_threat':
      return round === 1 ? 'defect' : 'cooperate';
    case 'mirror_coalition':
      return playerHistory.length === 0 ? 'cooperate' : playerHistory[playerHistory.length - 1];
    case 'reciprocal_cooperator':
      return round === 1 ? 'cooperate' : playerHistory[playerHistory.length - 1];
    default:
      return Math.random() > 0.4 ? 'cooperate' : 'defect';
  }
}

function getPayoffKey(playerChoice, aiChoice) {
  const p = playerChoice === 'cooperate' ? 'c' : 'd';
  const a = aiChoice === 'cooperate' ? 'c' : 'd';
  return p + a;
}

function resolveRound(playerChoice, aiChoice, scenario, round) {
  const key = getPayoffKey(playerChoice, aiChoice);
  const payoff = scenario.payoffs[key];
  const stageMod = getStageModifier(STATE.env.actor ? STATE.env.actor.stage : 3);
  const adjustedScore = Math.round(payoff.player * stageMod * 10);

  // Update lens scores
  const ls = STATE.game.lensScores;
  if (payoff.class === 'cooperative') { ls.gameCoopCount++; ls.S = Math.min(1, ls.S + 0.15); ls.E = Math.min(1, ls.E + 0.1); }
  if (payoff.class === 'adversarial') { ls.gameDefectCount++; ls.P = Math.min(1, ls.P + 0.2); ls.E = Math.min(1, ls.E + 0.15); }
  if (payoff.class === 'mixed') { ls.T = Math.min(1, ls.T + 0.1); ls.E = Math.min(1, ls.E + 0.1); }

  return { key, payoff, adjustedScore };
}

function classifyOutcome() {
  const g = STATE.game;
  const coopRatio = g.lensScores.gameCoopCount / Math.max(1, g.roundLog.length);
  if (coopRatio >= 0.7) return { cls: 'cooperative', label: 'Cooperative Equilibrium', color: 'var(--green)' };
  if (coopRatio <= 0.3) return { cls: 'adversarial', label: 'Adversarial Spiral', color: 'var(--red)' };
  return { cls: 'mixed', label: 'Mixed Strategy Equilibrium', color: 'var(--amber)' };
}

// ============================================================
// NAVIGATION
// ============================================================

function nav(panel) {
  if (panel === 'instrument' && !STATE.env.locked) return;
  if (panel === 'decision' && (!STATE.env.locked || !STATE.instrument.locked)) return;
  if (panel === 'synthesis' && !STATE.game.complete) return;
  STATE.panel = panel;
  render();
  document.getElementById('main').scrollTop = 0;
}

function updateNavState() {
  ['overview','library','env','instrument','decision','synthesis'].forEach(id => {
    const btn = document.getElementById('nav-' + id);
    if (!btn) return;
    btn.classList.toggle('active', STATE.panel === id);
    if (id === 'instrument') btn.classList.toggle('locked', !STATE.env.locked);
    if (id === 'decision') btn.classList.toggle('locked', !STATE.env.locked || !STATE.instrument.locked);
    if (id === 'synthesis') btn.classList.toggle('locked', !STATE.game.complete);
  });
}

function updateTopBadges() {
  const envBadge = document.getElementById('env-badge');
  const envText = document.getElementById('env-badge-text');
  if (STATE.env.actor) {
    envBadge.classList.remove('empty');
    envBadge.classList.add('env');
    envText.textContent = `${STATE.env.actor.label.toUpperCase()} // STAGE ${STATE.env.actor.stage}`;
  }
  const instrBadge = document.getElementById('instr-badge');
  const instrText = document.getElementById('instr-badge-text');
  if (STATE.instrument.data) {
    instrBadge.classList.remove('empty');
    instrBadge.classList.add('instr');
    instrText.textContent = STATE.instrument.data.label.toUpperCase();
  }
  const scoreText = document.getElementById('score-badge-text');
  scoreText.textContent = STATE.game.totalScore > 0 ? `SCORE: ${STATE.game.totalScore}` : 'SCORE: —';
}

// ============================================================
// PANEL: LIBRARY
// ============================================================

function renderLibrary() {
  const filters = ['all','trade','currency','tech','sovereignty','power'];
  const filterLabels = { all: 'ALL SCENARIOS', trade: 'TRADE WAR', currency: 'CURRENCY', tech: 'TECHNOLOGY', sovereignty: 'SOVEREIGNTY', power: 'POWER TRANSITION' };

  const filtered = STATE.filter === 'all' ? SCENARIOS : SCENARIOS.filter(s => s.domain === STATE.filter);

  const filterBtns = filters.map(f =>
    `<button class="filter-btn ${STATE.filter === f ? 'active' : ''}" onclick="setFilter('${f}')">${filterLabels[f]}</button>`
  ).join('');

  const cards = filtered.map(s => `
    <div class="scenario-card domain-${s.domain} ${STATE.game.scenario?.id === s.id ? 'active-scenario' : ''}" onclick="loadScenario('${s.id}')">
      <div class="sc-header">
        <div class="sc-title">${s.title}</div>
        <div class="sc-era mono">${s.era}</div>
      </div>
      <div class="sc-domain ${s.domain}">${s.domainLabel}</div>
      <div class="sc-meta">${s.brief.substring(0, 110)}...</div>
      <div class="sc-tags">
        <span class="sc-tag">${s.macroContext.substring(0, 30)}...</span>
        <span class="sc-tag">${INSTRUMENTS[s.instrumentType]?.label || s.instrumentType}</span>
      </div>
      <div class="sc-footer">
        <div class="sc-game">${s.gameLabel}</div>
        <div class="sc-diff ${s.difficulty}">${s.difficulty.toUpperCase()}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="panel-header">
      <div class="panel-title">SCENARIO LIBRARY <span class="panel-title-layer">// LAYER 00</span></div>
      <div class="panel-sub">8 pre-built scenarios across historical and forward-looking strategic domains. Select a scenario to load it into the simulation.</div>
    </div>
    <div class="filter-bar">${filterBtns}</div>
    <div class="grid-2">${cards}</div>
  `;
}

function setFilter(f) {
  STATE.filter = f;
  render();
}

function loadScenario(id) {
  const scenario = SCENARIOS.find(s => s.id === id);
  if (!scenario) return;

  // Pre-configure env + instrument from scenario
  const actorKey = scenario.actorPreset;
  const actor = ACTORS[actorKey];
  const instrKey = scenario.instrumentType;
  const instr = INSTRUMENTS[instrKey];

  STATE.env = { actorKey, actor, locked: false };
  STATE.instrument = { key: instrKey, data: instr, target: scenario.targetLabel, locked: false };
  STATE.game = {
    scenario,
    round: 1,
    playerChoices: [],
    aiChoices: [],
    roundLog: [],
    complete: false,
    totalScore: 0,
    lensScores: { S: 0.1, T: 0.1, E: 0.2, En: 0.05, P: 0.15, gameCoopCount: 0, gameDefectCount: 0, bigCyclePhase: actor?.cyclePhase || '' }
  };

  nav('env');
}

// ============================================================
// PANEL: ENVIRONMENT
// ============================================================

function renderEnvironment() {
  const actorKeys = Object.keys(ACTORS);

  const actorCards = actorKeys.map(key => {
    const a = ACTORS[key];
    const selected = STATE.env.actorKey === key;
    return `
      <div class="actor-card ${selected ? 'selected' : ''}" onclick="selectActor('${key}')">
        <div class="actor-name">${a.label}</div>
        <div class="actor-sub">${a.subtitle}</div>
        <div class="actor-stage" style="color:${a.stageColor}">Stage ${a.stage} — ${a.stageLabel}</div>
      </div>
    `;
  }).join('');

  let bcePanel = `<div class="empty-state"><div class="empty-icon">⬜</div><div class="empty-msg">SELECT AN ACTOR TO LOAD BCE PARAMETERS</div></div>`;

  if (STATE.env.actor) {
    const a = STATE.env.actor;
    const stagePips = [1,2,3,4,5,6].map(n =>
      `<div class="stage-pip s${n} ${n <= a.stage ? 'active' : ''}"></div>`
    ).join('');

    const forceBars = Object.entries(a.forceScores).map(([k, v]) => {
      const pct = (v / 10) * 100;
      const col = v >= 7 ? '#ef4444' : v >= 5 ? '#f59e0b' : '#4caf78';
      return `
        <div class="force-row">
          <div class="force-label">${k}</div>
          <div class="force-track"><div class="force-fill" style="width:${pct}%;background:${col}"></div></div>
          <div class="force-val">${v.toFixed(1)}</div>
        </div>
      `;
    }).join('');

    const flagsHtml = a.flags.map(f => {
      const cls = f.toLowerCase().replace(/_/g, '-');
      return `<span class="flag ${cls}">${f.replace(/_/g, ' ')}</span>`;
    }).join('');

    const debtColors = { PONZI_FINANCE: '#ef4444', UNSUSTAINABLE: '#f97316', BORDERLINE: '#f59e0b', BEAUTIFUL_DELEVERAGING: '#10b981' };
    const mpColors = { MP1: '#10b981', MP2: '#f59e0b', MP3: '#ef4444' };

    bcePanel = `
      <div class="grid-2">
        <div>
          <div class="card">
            <div class="card-title">EMPIRE STAGE</div>
            <div class="stage-bar">${stagePips}</div>
            <div class="flex-between mt-8">
              <div class="stage-label" style="color:${a.stageColor}">STAGE ${a.stage} — ${a.stageLabel.toUpperCase()}</div>
              <div class="mono" style="font-size:11px;color:var(--slate)">COMPOSITE: ${a.compositeScore.toFixed(1)}/10</div>
            </div>
            <div class="mt-8" style="font-size:11px;color:var(--slate-light)">${a.cyclePhase}</div>
          </div>
          <div class="card">
            <div class="card-title">MONETARY + DEBT STATUS</div>
            <div class="data-row">
              <div class="data-key">MP STAGE</div>
              <div class="data-val" style="color:${mpColors[a.mpStage]}">${a.mpStage}</div>
            </div>
            <div class="data-row">
              <div class="data-key">DEBT STATUS</div>
              <div class="data-val" style="color:${debtColors[a.debtStatus]}">${a.debtStatus.replace(/_/g, ' ')}</div>
            </div>
            <div class="data-row">
              <div class="data-key">PRINTING PROBABILITY</div>
              <div class="data-val ${a.printingProb >= 70 ? 'red' : a.printingProb >= 45 ? 'amber' : 'green'}">${a.printingProb}%</div>
            </div>
            <div class="data-row">
              <div class="data-key">BUBBLE ALERT</div>
              <div class="data-val ${a.bubbleAlert ? 'red' : 'green'}">${a.bubbleAlert ? 'ACTIVE' : 'CLEAR'}</div>
            </div>
            ${a.flags.length > 0 ? `<div class="flag-row">${flagsHtml}</div>` : ''}
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">FIVE FORCES DIAGNOSTIC</div>
            <div class="force-bars">${forceBars}</div>
          </div>
          <div class="card">
            <div class="card-title">HISTORICAL ANALOGY</div>
            <div class="analogy-box" style="margin:0">
              <div class="analogy-label">CLOSEST ANALOG</div>
              <div class="analogy-text">${a.analogy}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const isLocked = STATE.env.locked;

  return `
    <div class="panel-header">
      <div class="panel-title">ENVIRONMENT SETUP <span class="panel-title-layer">// LAYER 01</span></div>
      <div class="panel-sub">Select an actor to load Big Cycle parameters. The Environment Status card anchors all downstream simulation panels.</div>
    </div>
    ${isLocked ? `<div style="background:var(--green-dim);border:1px solid rgba(76,175,120,0.4);padding:10px 16px;margin-bottom:16px;font-family:var(--font-data);font-size:10px;color:var(--green);letter-spacing:0.08em;">✓ ENVIRONMENT LOCKED — PROCEED TO INSTRUMENT DEPLOYMENT</div>` : ''}
    <div class="card">
      <div class="card-title">SELECT ACTOR / CONFIGURATION</div>
      <div class="actor-grid">${actorCards}</div>
    </div>
    ${bcePanel}
    ${STATE.env.actor ? `
      <div class="btn-row">
        ${!isLocked
          ? `<button class="btn btn-primary" onclick="lockEnv()">LOCK ENVIRONMENT →</button>`
          : `<button class="btn btn-secondary" onclick="unlockEnv()">← UNLOCK ENVIRONMENT</button>
             <button class="btn btn-primary" onclick="nav('instrument')">PROCEED TO INSTRUMENT →</button>`
        }
      </div>
    ` : ''}
  `;
}

function selectActor(key) {
  if (STATE.env.locked) return;
  STATE.env.actorKey = key;
  STATE.env.actor = ACTORS[key];
  if (STATE.game.lensScores) STATE.game.lensScores.bigCyclePhase = ACTORS[key].cyclePhase;
  render();
}

function lockEnv() {
  if (!STATE.env.actor) return;
  STATE.env.locked = true;
  render();
}

function unlockEnv() {
  STATE.env.locked = false;
  STATE.instrument.locked = false;
  render();
}

// ============================================================
// PANEL: INSTRUMENT
// ============================================================

function renderInstrument() {
  const instrKeys = Object.keys(INSTRUMENTS);

  const instrCards = instrKeys.map(key => {
    const ins = INSTRUMENTS[key];
    const selected = STATE.instrument.key === key;
    return `
      <div class="instr-card ${selected ? 'selected' : ''}" onclick="selectInstrument('${key}')">
        <span class="instr-icon">${ins.icon}</span>
        <div class="instr-name">${ins.label}</div>
        <div class="instr-desc">${ins.desc}</div>
      </div>
    `;
  }).join('');

  let triPanel = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-msg">SELECT AN INSTRUMENT TO VIEW TRIANGULAR FRAMEWORK ANALYSIS</div></div>`;

  if (STATE.instrument.data) {
    const ins = STATE.instrument.data;
    const scores = ins.scores;
    const severity = computeSeverity(scores);
    const tier = severityTier(severity);

    const attrs = [
      { key: 'precision', label: 'Precision', weight: '20%', desc: 'Targeting without collateral damage' },
      { key: 'impact', label: 'Impact', weight: '30%', desc: 'Magnitude of economic disruption' },
      { key: 'circumvention', label: 'Circumvention Resistance', weight: '20%', desc: 'Difficulty for target to route around' },
      { key: 'visibility', label: 'Visibility', weight: '15%', desc: 'Observable, attributable, deterrent' },
      { key: 'speed', label: 'Speed of Effect', weight: '15%', desc: 'Time to measurable outcome' }
    ];

    const attrColors = { precision: '#8b5cf6', impact: '#ef4444', circumvention: '#3b82f6', visibility: '#f59e0b', speed: '#10b981' };

    const triBars = attrs.map(a => {
      const v = scores[a.key];
      const pct = (v / 10) * 100;
      return `
        <div class="tri-row">
          <div class="tri-label">${a.label} <span class="text-slate">(${a.weight})</span></div>
          <div class="tri-track"><div class="tri-fill" style="width:${pct}%;background:${attrColors[a.key]}"></div></div>
          <div class="tri-score" style="color:${attrColors[a.key]}">${v}</div>
        </div>
      `;
    }).join('');

    const targetVal = STATE.instrument.target || 'Not specified';

    triPanel = `
      <div class="grid-2">
        <div>
          <div class="card">
            <div class="card-title">TRIANGULAR FRAMEWORK — FARRELL & NEWMAN</div>
            <div class="tri-bars">${triBars}</div>
          </div>
          <div class="card">
            <div class="card-title">TARGET CONFIGURATION</div>
            <div class="data-row">
              <div class="data-key">TARGET ACTOR</div>
              <div class="data-val amber">${targetVal}</div>
            </div>
            <div class="data-row">
              <div class="data-key">STRATEGIC UTILITY CLASS</div>
              <div class="data-val" style="color:${ins.utilityColor}">${ins.utilityLabel.toUpperCase()}</div>
            </div>
            <div class="data-row">
              <div class="data-key">TIME HORIZON</div>
              <div class="data-val slate">${ins.timeHorizon.replace(/_/g, ' ').toUpperCase()}</div>
            </div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-title">COMPOSITE SEVERITY</div>
            <div class="severity-display">
              <div class="severity-number" style="color:${tier.color}">${severity.toFixed(1)}</div>
              <div class="severity-tier" style="color:${tier.color}">${tier.tier}</div>
              <div class="severity-label">Weighted composite / 10.0</div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">BILATERAL LEVERAGE ASSESSMENT</div>
            ${STATE.env.actor ? `
              <div class="data-row">
                <div class="data-key">SENDER (${STATE.env.actor.label})</div>
                <div class="data-val green">Stage ${STATE.env.actor.stage} — ${severity >= 6 ? 'STRONG' : 'MODERATE'} LEVERAGE</div>
              </div>
              <div class="data-row">
                <div class="data-key">RETALIATION CAPACITY</div>
                <div class="data-val ${scores.circumvention <= 4 ? 'red' : scores.circumvention <= 6 ? 'amber' : 'green'}">${scores.circumvention <= 4 ? 'HIGH' : scores.circumvention <= 6 ? 'MODERATE' : 'LOW'}</div>
              </div>
              <div class="data-row">
                <div class="data-key">STAGE × INSTRUMENT MODIFIER</div>
                <div class="data-val amber">${getStageModifier(STATE.env.actor.stage).toFixed(1)}×</div>
              </div>
            ` : `<div class="text-slate" style="font-size:11px">Lock environment first to compute leverage.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  const isLocked = STATE.instrument.locked;

  return `
    <div class="panel-header">
      <div class="panel-title">INSTRUMENT DEPLOYMENT <span class="panel-title-layer">// LAYER 02</span></div>
      <div class="panel-sub">Select a geoeconomic instrument. The Triangular Framework scores it across five strategic dimensions. Instrument profile anchors the Decision Theater calibration.</div>
    </div>
    ${isLocked ? `<div style="background:rgba(74,144,217,0.1);border:1px solid rgba(74,144,217,0.4);padding:10px 16px;margin-bottom:16px;font-family:var(--font-data);font-size:10px;color:var(--blue);letter-spacing:0.08em;">✓ INSTRUMENT LOCKED — PROCEED TO DECISION THEATER</div>` : ''}
    <div class="card">
      <div class="card-title">SELECT INSTRUMENT</div>
      <div class="instrument-grid">${instrCards}</div>
    </div>
    ${triPanel}
    ${STATE.instrument.data ? `
      <div class="btn-row">
        ${!isLocked
          ? `<button class="btn btn-primary" onclick="lockInstrument()">DEPLOY INSTRUMENT →</button>`
          : `<button class="btn btn-secondary" onclick="unlockInstrument()">← REVISE INSTRUMENT</button>
             <button class="btn btn-primary" onclick="nav('decision')">ENTER DECISION THEATER →</button>`
        }
      </div>
    ` : ''}
  `;
}

function selectInstrument(key) {
  if (STATE.instrument.locked) return;
  STATE.instrument.key = key;
  STATE.instrument.data = INSTRUMENTS[key];
  render();
}

function lockInstrument() {
  if (!STATE.instrument.data) return;
  STATE.instrument.locked = true;
  render();
}

function unlockInstrument() {
  STATE.instrument.locked = false;
  render();
}

// ============================================================
// PANEL: DECISION THEATER
// ============================================================

function renderDecision() {
  const g = STATE.game;
  const scenario = g.scenario;

  if (!scenario) {
    return `
      <div class="panel-header">
        <div class="panel-title">DECISION THEATER <span class="panel-title-layer">// LAYER 03</span></div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-msg">NO SCENARIO LOADED — SELECT ONE FROM THE LIBRARY</div>
        <div class="btn-row" style="justify-content:center;margin-top:16px">
          <button class="btn btn-secondary" onclick="nav('library')">OPEN SCENARIO LIBRARY</button>
        </div>
      </div>
    `;
  }

  if (g.complete) {
    nav('synthesis');
    return '';
  }

  const roundPips = [1, 2].map(n => {
    const cls = n < g.round ? 'done' : n === g.round ? 'active' : 'pending';
    return `<div class="round-pip ${cls}"></div>`;
  }).join('');

  const instr = STATE.instrument.data;
  const instrEffect = instr ? `<div class="analogy-box" style="margin-bottom:12px"><div class="analogy-label">INSTRUMENT EFFECT</div><div class="analogy-text">${scenario.instrumentEffect}</div></div>` : '';
  const stageEffect = STATE.env.actor ? `<div class="analogy-box"><div class="analogy-label">STAGE CONTEXT</div><div class="analogy-text">${scenario.stageEffect}</div></div>` : '';

  const choiceBtns = scenario.choices.map(c =>
    `<div class="choice-btn" onclick="selectChoice('${c.id}', this)">
      <div class="choice-label">${c.label}</div>
      <div class="choice-desc">${c.desc}</div>
    </div>`
  ).join('');

  const logHtml = g.roundLog.length > 0 ? `
    <div class="card">
      <div class="card-title">ROUND LOG</div>
      <div class="round-log">
        ${g.roundLog.map((entry, i) => `
          <div class="log-entry ${entry.class}">
            <div class="log-round">ROUND ${i + 1} — YOU: ${entry.playerChoice.toUpperCase()} | AI: ${entry.aiChoice.toUpperCase()}</div>
            <div class="log-outcome">${entry.label}</div>
            <div class="log-score text-amber">+${entry.score} pts ${entry.class === 'cooperative' ? '(cooperation bonus)' : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Build payoff matrix display
  const matrixRows = scenario.choices.map(pc => {
    const cells = scenario.choices.map(ac => {
      const key = getPayoffKey(pc.id, ac.id);
      const payoff = scenario.payoffs[key];
      const isRevealed = g.roundLog.some(r => r.playerChoice === pc.id && r.aiChoice === ac.id);
      if (isRevealed) {
        const cls = g.roundLog.some(r => r.playerChoice === pc.id) ? 'highlighted' : '';
        return `<td class="${cls} revealed"><span class="cell-p">${payoff.player > 0 ? '+' : ''}${payoff.player}</span> / <span class="cell-o">${payoff.opp > 0 ? '+' : ''}${payoff.opp}</span></td>`;
      }
      return `<td class="hidden-cell">? / ?</td>`;
    }).join('');
    return `<tr><th style="text-align:left;font-size:9px;color:var(--slate);padding:6px 8px;background:var(--bg2);border:1px solid var(--bg3)">${scenario.choices.find(c => c.id === pc.id).label.substring(0,18)}...</th>${cells}</tr>`;
  }).join('');

  const matrixHtml = `
    <div class="card">
      <div class="card-title">PAYOFF MATRIX</div>
      <div class="matrix-title">YOU (rows) vs. OPPONENT (columns) — opponent strategy hidden until debrief</div>
      <table class="matrix-table">
        <thead>
          <tr>
            <th></th>
            ${scenario.choices.map(c => `<th>${c.label.substring(0,16)}...</th>`).join('')}
          </tr>
        </thead>
        <tbody>${matrixRows}</tbody>
      </table>
      <div style="font-size:10px;color:var(--slate);margin-top:8px;">Values: Player / Opponent strategic advantage points</div>
    </div>
  `;

  let pendingChoice = null;

  return `
    <div class="panel-header">
      <div class="panel-title">DECISION THEATER <span class="panel-title-layer">// LAYER 03</span></div>
      <div class="panel-sub">${scenario.title} — ${scenario.gameLabel}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:20px">
      <div class="round-header">ROUND ${g.round} OF 2</div>
      ${roundPips}
      <div style="margin-left:auto;font-family:var(--font-data);font-size:10px;color:var(--amber)">SCORE: ${g.totalScore}</div>
    </div>
    <div class="theater-layout">
      <div>
        <div class="card">
          <div class="card-title">SCENARIO BRIEF</div>
          <div class="theater-brief">${scenario.brief}</div>
        </div>
        ${instrEffect}
        ${stageEffect}
        ${logHtml}
      </div>
      <div>
        <div class="card">
          <div class="card-title">MAKE YOUR MOVE — ROUND ${g.round}</div>
          <div id="choices-container">${choiceBtns}</div>
          <div class="btn-row">
            <button class="btn btn-primary" id="confirm-btn" onclick="confirmMove()" disabled>CONFIRM MOVE →</button>
          </div>
        </div>
        ${matrixHtml}
        <div class="card">
          <div class="card-title">AI OPPONENT</div>
          <div class="data-row">
            <div class="data-key">STRATEGY TYPE</div>
            <div class="data-val slate">HIDDEN — REVEALED IN DEBRIEF</div>
          </div>
          <div class="data-row">
            <div class="data-key">TARGET ACTOR</div>
            <div class="data-val amber">${scenario.targetLabel}</div>
          </div>
          <div class="data-row">
            <div class="data-key">INTERACTION TYPE</div>
            <div class="data-val">${scenario.gameType.replace(/_/g, ' ').toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _pendingChoice = null;

function selectChoice(choiceId, el) {
  _pendingChoice = choiceId;
  document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
  el.classList.add('selected');
  const btn = document.getElementById('confirm-btn');
  if (btn) btn.disabled = false;
}

function confirmMove() {
  if (!_pendingChoice) return;
  const g = STATE.game;
  const scenario = g.scenario;
  const playerChoice = _pendingChoice;
  _pendingChoice = null;

  const aiChoice = aiDecide(scenario.aiStrategyKey, g.round, g.playerChoices);
  const { payoff, adjustedScore } = resolveRound(playerChoice, aiChoice, scenario, g.round);

  g.playerChoices.push(playerChoice);
  g.aiChoices.push(aiChoice);
  g.roundLog.push({
    round: g.round,
    playerChoice,
    aiChoice,
    label: payoff.label,
    class: payoff.class,
    narrative: payoff.narrative,
    score: adjustedScore
  });
  g.totalScore += adjustedScore;
  g.round++;

  if (g.round > 2) {
    g.complete = true;
  }

  render();
}

// ============================================================
// PANEL: OUTCOME SYNTHESIS
// ============================================================

function renderSynthesis() {
  const g = STATE.game;
  const scenario = g.scenario;

  if (!g.complete) {
    return `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-msg">COMPLETE THE DECISION THEATER TO UNLOCK SYNTHESIS</div></div>`;
  }

  const outcome = classifyOutcome();
  const ls = g.lensScores;

  const steepDims = [
    { key: 'S', label: 'Social', color: '#ec4899' },
    { key: 'T', label: 'Technological', color: '#8b5cf6' },
    { key: 'E', label: 'Economic', color: '#f59e0b' },
    { key: 'En', label: 'Environmental', color: '#10b981' },
    { key: 'P', label: 'Political', color: '#3b82f6' }
  ];

  const lensCards = steepDims.map(d => {
    const val = ls[d.key] || 0;
    const pct = Math.round(val * 100);
    const level = pct > 60 ? 'HIGH' : pct > 30 ? 'MED' : 'LOW';
    return `
      <div class="lens-card">
        <div class="lens-dim ${d.key}" style="color:${d.color}">${d.key}</div>
        <div class="lens-label">${d.label}</div>
        <div style="font-family:var(--font-data);font-size:14px;color:${d.color}">${pct}%</div>
        <div class="lens-bar"><div class="lens-fill" style="width:${pct}%;background:${d.color}"></div></div>
        <div style="font-family:var(--font-data);font-size:9px;color:var(--slate);margin-top:4px">${level}</div>
      </div>
    `;
  }).join('');

  const coopPct = Math.round((ls.gameCoopCount / Math.max(1, g.roundLog.length)) * 100);
  const defPct = 100 - coopPct;

  const roundSummary = g.roundLog.map((entry, i) => `
    <div class="log-entry ${entry.class}">
      <div class="log-round">ROUND ${i + 1} — YOU: ${entry.playerChoice.toUpperCase()} | AI: ${entry.aiChoice.toUpperCase()}</div>
      <div class="log-outcome"><strong>${entry.label}</strong> — ${entry.narrative}</div>
      <div class="log-score text-amber">+${entry.score} pts</div>
    </div>
  `).join('');

  const aiRevealClass = g.roundLog.length > 0 && g.roundLog[0].aiChoice === 'cooperate' ? 'green' : 'red';

  return `
    <div class="panel-header">
      <div class="panel-title">OUTCOME SYNTHESIS <span class="panel-title-layer">// LAYER 04</span></div>
      <div class="panel-sub">${scenario?.title} — Post-Simulation Debrief</div>
    </div>
    <div class="grid-2" style="margin-bottom:16px">
      <div class="score-box">
        <div class="score-num">${g.totalScore}</div>
        <div class="score-max">points accumulated across ${g.roundLog.length} rounds</div>
        <div class="score-label">${outcome.label.toUpperCase()}</div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-title">GAME THEORY PATTERN</div>
        <div class="data-row">
          <div class="data-key">COOPERATION MOVES</div>
          <div class="data-val green">${ls.gameCoopCount} / ${g.roundLog.length} (${coopPct}%)</div>
        </div>
        <div class="data-row">
          <div class="data-key">DEFECTION MOVES</div>
          <div class="data-val ${ls.gameDefectCount > 0 ? 'red' : 'slate'}">${ls.gameDefectCount} / ${g.roundLog.length} (${defPct}%)</div>
        </div>
        <div class="data-row">
          <div class="data-key">AI STRATEGY (REVEALED)</div>
          <div class="data-val amber">${scenario?.aiStrategyLabel || '—'}</div>
        </div>
        <div class="data-row">
          <div class="data-key">DOMINANT PATTERN</div>
          <div class="data-val" style="color:${outcome.color}">${outcome.label.toUpperCase()}</div>
        </div>
      </div>
    </div>

    <div class="outcome-box ${outcome.cls}">
      <div class="outcome-class" style="color:${outcome.color}">${outcome.label.toUpperCase()}</div>
      <div class="outcome-narrative">${scenario?.gameLesson || ''}</div>
    </div>

    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-title">ROUND DEBRIEF</div>
          <div class="round-log">${roundSummary}</div>
        </div>
        <div class="card">
          <div class="card-title">HISTORICAL ANALOGY</div>
          <div class="analogy-box" style="margin:0">
            <div class="analogy-label">REAL-WORLD OUTCOME</div>
            <div class="analogy-text">${scenario?.analogy || '—'}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-title">STEEP LENS ACTIVATION</div>
          <div class="lens-grid">${lensCards}</div>
          <div class="sep"></div>
          <div class="data-row">
            <div class="data-key">BIG CYCLE PHASE</div>
            <div class="data-val amber">${ls.bigCyclePhase || STATE.env.actor?.cyclePhase || '—'}</div>
          </div>
          ${STATE.instrument.data ? `
            <div class="data-row">
              <div class="data-key">INSTRUMENT DEPLOYED</div>
              <div class="data-val">${STATE.instrument.data.label}</div>
            </div>
            <div class="data-row">
              <div class="data-key">SEVERITY SCORE</div>
              <div class="data-val amber">${computeSeverity(STATE.instrument.data.scores).toFixed(1)} / 10.0</div>
            </div>
          ` : ''}
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="exportReport()">EXPORT REPORT ↓</button>
          <button class="btn btn-secondary" onclick="resetSimulation()">NEW SIMULATION</button>
        </div>
      </div>
    </div>

    ${(() => {
      const narratives = STEEP_NARRATIVES[scenario?.id];
      if (!narratives) return '';
      const dims = [
        { key: 'S',  label: 'Social',         color: '#ec4899' },
        { key: 'T',  label: 'Technological',  color: '#8b5cf6' },
        { key: 'E',  label: 'Economic',        color: '#f59e0b' },
        { key: 'En', label: 'Environmental',  color: '#10b981' },
        { key: 'P',  label: 'Political',       color: '#3b82f6' },
      ];
      const rows = dims.map(d => {
        const val = ls[d.key] || 0;
        const pct = Math.round(val * 100);
        const text = narratives[d.key] || '';
        return `
          <div style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <div style="font-family:var(--font-header);font-size:11px;font-weight:700;color:${d.color};width:28px;flex-shrink:0">${d.key}</div>
              <div style="font-family:var(--font-data);font-size:10px;color:${d.color};letter-spacing:0.08em;flex:1">${d.label.toUpperCase()}</div>
              <div style="font-family:var(--font-data);font-size:10px;color:${d.color}">${pct}%</div>
              <div style="width:80px;height:4px;background:var(--bg3);border-radius:2px;flex-shrink:0">
                <div style="width:${pct}%;height:100%;background:${d.color};border-radius:2px"></div>
              </div>
            </div>
            <div style="font-size:12px;color:var(--slate-light);line-height:1.75;padding-left:40px">${text}</div>
          </div>
        `;
      }).join('');
      return `
        <div class="card" style="margin-top:4px">
          <div class="card-title">STEEP LENS ANALYSIS</div>
          <div style="font-size:11px;color:var(--slate);margin-bottom:4px">Synthesized drivers and second-order effects across each dimension for <strong style="color:var(--white)">${scenario?.title}</strong></div>
          ${rows}
        </div>
      `;
    })()}
  `;
}

function exportReport() {
  const g = STATE.game;
  const scenario = g.scenario;
  const outcome = classifyOutcome();
  const ts = new Date().toISOString();

  let text = `GEOPOLICY LAB — SIMULATION REPORT\n`;
  text += `${'='.repeat(60)}\n`;
  text += `Generated: ${ts}\n`;
  text += `Scenario: ${scenario?.title}\n`;
  text += `Era: ${scenario?.era}\n`;
  text += `Game Type: ${scenario?.gameLabel}\n\n`;
  text += `ENVIRONMENT\n${'-'.repeat(40)}\n`;
  if (STATE.env.actor) {
    const a = STATE.env.actor;
    text += `Actor: ${a.label} (${a.subtitle})\n`;
    text += `Empire Stage: ${a.stage} — ${a.stageLabel}\n`;
    text += `Debt Status: ${a.debtStatus}\n`;
    text += `Active Flags: ${a.flags.join(', ') || 'None'}\n\n`;
  }
  text += `INSTRUMENT\n${'-'.repeat(40)}\n`;
  if (STATE.instrument.data) {
    const ins = STATE.instrument.data;
    text += `Instrument: ${ins.label}\n`;
    text += `Target: ${STATE.instrument.target}\n`;
    text += `Severity: ${computeSeverity(ins.scores).toFixed(1)}/10\n`;
    text += `Strategic Utility: ${ins.utilityLabel}\n\n`;
  }
  text += `DECISION LOG\n${'-'.repeat(40)}\n`;
  g.roundLog.forEach((r, i) => {
    text += `Round ${i+1}: You ${r.playerChoice.toUpperCase()} | AI ${r.aiChoice.toUpperCase()}\n`;
    text += `  Outcome: ${r.label}\n`;
    text += `  Score: +${r.score}\n\n`;
  });
  text += `FINAL SCORE: ${g.totalScore}\n`;
  text += `GAME THEORY CLASSIFICATION: ${outcome.label}\n\n`;
  text += `HISTORICAL ANALOGY\n${'-'.repeat(40)}\n${scenario?.analogy}\n\n`;
  text += `GAME THEORY LESSON\n${'-'.repeat(40)}\n${scenario?.gameLesson}\n`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `geopolicy-${scenario?.id}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetSimulation() {
  STATE.env = { actorKey: null, actor: null, locked: false };
  STATE.instrument = { key: null, data: null, target: '', locked: false };
  STATE.game = { scenario: null, round: 1, playerChoices: [], aiChoices: [], roundLog: [], complete: false, totalScore: 0, lensScores: { S: 0, T: 0, E: 0, En: 0, P: 0, gameCoopCount: 0, gameDefectCount: 0, bigCyclePhase: '' } };
  nav('library');
}

// ============================================================
// RENDER DISPATCHER
// ============================================================

function renderOverview() {
  const panels = [
    { icon: '◈', label: 'LAYER 00 — OVERVIEW', color: 'var(--amber)', desc: 'This panel. System map, component guide, and workflow orientation.' },
    { icon: '⊞', label: 'LAYER 01 — SCENARIO LIBRARY', color: 'var(--amber)', desc: '8 pre-built historical scenarios spanning trade, currency, technology, sovereignty, and power transition domains. Each card is a fully self-contained simulation seed — select one to load its macro context, instrument type, and game theory structure.' },
    { icon: '◉', label: 'LAYER 02 — ENVIRONMENT SETUP', color: 'var(--blue)', desc: 'Powered by the Big Cycle Engine (Ray Dalio\'s framework). Configure the macro actor — choosing from 7 historical or contemporary power profiles at different empire stages. Sets the Debt/Money status, Five Forces diagnostics, and applies an Empire Stage multiplier to all downstream payoffs.' },
    { icon: '⬡', label: 'LAYER 03 — INSTRUMENT DEPLOYMENT', color: 'var(--purple)', desc: 'Powered by the Farrell & Newman Triangular Framework. Select the geoeconomic instrument (tariffs, sanctions, export controls, currency intervention, etc.) and specify a target actor. Scores 5 attributes — Precision, Impact, Circumvention Resistance, Visibility, Speed — to produce a composite severity score and strategic utility classification.' },
    { icon: '⚔', label: 'LAYER 04 — DECISION THEATER', color: 'var(--red)', desc: 'The game theory simulator. Each scenario maps to a game type (Prisoner\'s Dilemma, Coordination, Chicken, Stackelberg, etc.) with a 2×2 payoff matrix. Make your move each round while an AI opponent executes a pre-assigned strategy (grim trigger, tit-for-tat, calculated escalator, etc.). Empire Stage and instrument severity modify payoffs in real time.' },
    { icon: '📊', label: 'LAYER 05 — OUTCOME SYNTHESIS', color: 'var(--green)', desc: 'Post-simulation debrief. Surfaces your game theory pattern, STEEP lens activation scores, round-by-round decision log, and a historical analogy. Each STEEP dimension receives a 3-sentence analytical narrative grounded in the specific scenario\'s drivers and second-order effects.' },
  ];

  const components = [
    { name: 'Big Cycle Engine', src: 'lib/bigCycle/engine.js', color: 'var(--blue)', desc: 'Implements Dalio\'s 6-stage empire cycle model and Five Forces Diagnostic (Debt/Money, Internal Order, External Order, Nature/Climate, Technology). Provides MP stage classification (MP1/MP2/MP3) and debt-bubble scoring. In GeoPolicy Lab this is represented as the 7 actor presets, each hardcoded to a cycle position with force scores and flags.' },
    { name: 'Farrell & Newman Triangular Framework', src: 'lib/geoInstrument/engine.js', color: 'var(--purple)', desc: 'Scores geoeconomic instruments across 5 weighted attributes to produce a composite severity score and strategic utility class. The original engine is an LLM prompt-builder pipeline (Agents 5A–5D + Convergence Supervisor). GeoPolicy Lab ports the scoring logic directly with pre-calibrated static attribute scores per instrument type.' },
    { name: 'Game Theory Simulator', src: 'attached_assets/simulation_*.js', color: 'var(--red)', desc: 'Structured decision environment with 8 game types, conditional AI strategies, payoff matrices, and STEEP lens accumulation. Each round\'s outcome updates S/T/E/En/P scores based on whether the result is cooperative, adversarial, or mixed. The Empire Stage modifier (0.8× at Stage 5–6, 1.2× at Stage 1–2) links the macro environment to decision outcomes.' },
  ];

  const workflow = [
    { step: '01', label: 'Pick a Scenario', desc: 'Open the Scenario Library and select any of the 8 historical cases. Each pre-loads the recommended actor preset and instrument — or customize both in subsequent panels.' },
    { step: '02', label: 'Configure Environment', desc: 'Lock in your macro actor in Layer 02. This sets the empire stage, debt regime, and Five Forces profile. The stage multiplier is applied to all payoffs until you reset.' },
    { step: '03', label: 'Deploy an Instrument', desc: 'Select your geoeconomic instrument and specify the target in Layer 03. Review the severity score and strategic utility class, then lock to proceed.' },
    { step: '04', label: 'Play the Decision Theater', desc: 'Make your choices round by round in Layer 04. Watch the AI strategy unfold. Payoff matrices are partially obscured pre-decision and fully revealed post-move.' },
    { step: '05', label: 'Read the Synthesis', desc: 'Layer 05 surfaces the full debrief: score, game theory pattern, STEEP lens drivers, round log, and historical analogy. Export the full report as a text file.' },
  ];

  return `
    <div class="panel-header">
      <div class="panel-title">GEOPOLICY LAB <span class="panel-title-layer">// SYSTEM OVERVIEW</span></div>
      <div class="panel-sub">Strategic Simulation Environment — Component Map & Operator Guide</div>
    </div>

    <div class="card" style="margin-bottom:20px;border-color:var(--amber-border);background:linear-gradient(135deg,rgba(245,166,35,0.06),var(--bg1))">
      <div style="font-family:var(--font-header);font-size:13px;color:var(--amber);letter-spacing:0.1em;margin-bottom:10px">WHAT IS GEOPOLICY LAB?</div>
      <div style="font-size:13px;color:var(--slate-light);line-height:1.8;max-width:860px">
        GeoPolicy Lab is a standalone strategic simulation environment that fuses three analytical frameworks into a single unified workflow: Ray Dalio's Big Cycle macroeconomic model, the Farrell &amp; Newman Triangular Framework for geoeconomic instrument assessment, and a game theory decision engine. The tool is designed for analysts, researchers, and strategists who want to reason through historical and contemporary geopolitical scenarios with structured analytical rigor — moving from macro environment configuration through instrument selection to adversarial decision-making and outcome synthesis in a single session.
      </div>
      <div style="margin-top:14px;display:flex;gap:24px;flex-wrap:wrap">
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">⬡ 8 PRE-BUILT SCENARIOS</div>
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">◉ 7 ACTOR PRESETS</div>
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">⚔ 8 GAME THEORY TYPES</div>
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">📐 8 INSTRUMENT CLASSES</div>
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">📊 5-DIMENSION STEEP SCORING</div>
        <div style="font-family:var(--font-data);font-size:10px;color:var(--slate)">⊕ ZERO DEPENDENCIES</div>
      </div>
    </div>

    <div style="margin-bottom:8px;font-family:var(--font-data);font-size:9px;color:var(--slate);letter-spacing:0.12em">SOURCE COMPONENTS</div>
    <div class="grid-3" style="margin-bottom:20px">
      ${components.map(c => `
        <div class="card" style="margin:0;border-color:rgba(255,255,255,0.08)">
          <div style="font-family:var(--font-data);font-size:10px;color:${c.color};letter-spacing:0.08em;margin-bottom:6px">${c.name}</div>
          <div style="font-family:var(--font-data);font-size:9px;color:var(--slate);margin-bottom:10px;opacity:0.7">${c.src}</div>
          <div style="font-size:11px;color:var(--slate-light);line-height:1.7">${c.desc}</div>
        </div>
      `).join('')}
    </div>

    <div style="margin-bottom:8px;font-family:var(--font-data);font-size:9px;color:var(--slate);letter-spacing:0.12em">PANEL ARCHITECTURE</div>
    <div style="margin-bottom:20px">
      ${panels.map(p => `
        <div style="display:flex;gap:14px;align-items:flex-start;padding:12px 14px;background:var(--bg1);border:1px solid rgba(255,255,255,0.06);margin-bottom:6px">
          <div style="font-family:var(--font-data);font-size:14px;color:${p.color};width:20px;flex-shrink:0;padding-top:1px">${p.icon}</div>
          <div>
            <div style="font-family:var(--font-data);font-size:10px;color:${p.color};letter-spacing:0.08em;margin-bottom:4px">${p.label}</div>
            <div style="font-size:11px;color:var(--slate-light);line-height:1.7">${p.desc}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="margin-bottom:8px;font-family:var(--font-data);font-size:9px;color:var(--slate);letter-spacing:0.12em">SIMULATION WORKFLOW</div>
    <div class="grid-3" style="margin-bottom:24px">
      ${workflow.slice(0,3).map(w => `
        <div class="card" style="margin:0">
          <div style="font-family:var(--font-header);font-size:18px;color:var(--amber);opacity:0.3;margin-bottom:6px">${w.step}</div>
          <div style="font-family:var(--font-data);font-size:10px;color:var(--white);margin-bottom:8px">${w.label}</div>
          <div style="font-size:11px;color:var(--slate);line-height:1.7">${w.desc}</div>
        </div>
      `).join('')}
    </div>
    <div class="grid-2" style="margin-bottom:24px;max-width:780px">
      ${workflow.slice(3).map(w => `
        <div class="card" style="margin:0">
          <div style="font-family:var(--font-header);font-size:18px;color:var(--amber);opacity:0.3;margin-bottom:6px">${w.step}</div>
          <div style="font-family:var(--font-data);font-size:10px;color:var(--white);margin-bottom:8px">${w.label}</div>
          <div style="font-size:11px;color:var(--slate);line-height:1.7">${w.desc}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;gap:12px">
      <button class="btn btn-primary" onclick="nav('library')">OPEN SCENARIO LIBRARY →</button>
      <button class="btn btn-secondary" onclick="nav('env')">CONFIGURE ENVIRONMENT</button>
    </div>
  `;
}

function render() {
  const main = document.getElementById('main');
  switch (STATE.panel) {
    case 'overview':   main.innerHTML = renderOverview(); break;
    case 'library':    main.innerHTML = renderLibrary(); break;
    case 'env':        main.innerHTML = renderEnvironment(); break;
    case 'instrument': main.innerHTML = renderInstrument(); break;
    case 'decision':   main.innerHTML = renderDecision(); break;
    case 'synthesis':  main.innerHTML = renderSynthesis(); break;
    default:           main.innerHTML = renderLibrary();
  }
  updateNavState();
  updateTopBadges();
}

// ============================================================
// INIT
// ============================================================

render();
