export const GI_EXAMPLE = {
  instrument: "Semiconductor export controls",
  sender: "United States",
  target: "China",
  generatedAt: "2026-05-07T12:00:00.000Z",
  synthesis: {
    unified_severity: 7.4,
    unified_severity_tier: "HIGH",
    convergence_confidence: "HIGH",
    active_flags: ["HIGH_SEVERITY", "RETALIATION_RISK"],
    strategic_summary: "US semiconductor export controls targeting China's advanced chipmaking capability represent a structurally significant geoeconomic instrument with HIGH severity. The precision of entity-list targeting is high, the impact on China's AI and defense computing is severe, but circumvention resistance is moderate — SMIC and Huawei have demonstrated partial workarounds through stockpiling and domestic fab development. The US sender holds clear leverage: China has no domestic alternative to EUV lithography or advanced packaging technology on a 3–5 year horizon. The primary retaliation vector is rare earth export restriction and supply chain weaponization in processed minerals.",
    key_risks: [
      "China accelerates domestic semiconductor investment — a SMIC 5nm breakthrough would materially erode the precision advantage of current controls",
      "Third-country circumvention through Malaysia, Singapore, and Thailand entities undermines the effective control perimeter without formal violations",
      "Rare earth retaliation: China controls 85% of global rare earth processing; gallium and germanium restrictions are already active, escalation to neodymium and dysprosium is credible",
      "Allied erosion: ASML (Netherlands) and Tokyo Electron (Japan) face domestic commercial pressure to loosen export restriction compliance over time",
      "US semiconductor equipment sector faces revenue concentration risk — KLA, Lam Research, and Applied Materials each derive 25–35% of revenue from China"
    ]
  },
  agents: {
    agent5a: {
      severity_score: 7.4,
      severity_tier: "HIGH",
      score_rationale: "Export controls targeting sub-7nm chips, EDA software, and advanced packaging achieve HIGH severity through the intersection of high impact (blocking China's path to frontier AI compute), high visibility (publicly named entities, clear enforcement signals), and acceptable precision (entity-list targeting minimizes collateral damage to non-targeted Chinese industries). The score is capped below CRITICAL because circumvention pathways remain viable and allied compliance is incomplete — both factors constrain the instrument's effective reach.",
      attribute_scores: {
        precision: 7.2,
        impact: 8.6,
        circumvention: 5.4,
        visibility: 8.8,
        speed: 6.1
      },
      dominant_attribute: "visibility",
      lowest_attribute: "circumvention"
    },
    agent5b: {
      leverage_holder: "sender",
      sender_capacity: {
        score: 8.2,
        dominant_advantage: "EUV lithography monopoly (ASML), EDA toolchain control (Synopsys/Cadence), advanced packaging dependency (TSMC/OSAT)",
        rationale: "The US controls or has allied-lock on every critical node in the advanced semiconductor stack. China cannot produce frontier-class chips (≤7nm at scale) without US or allied equipment or IP. This dependency has a 5–10 year structural lock-in even under maximum Chinese domestic investment scenarios. The CHIPS Act and Fab Act additionally create captive allied demand that further concentrates leverage."
      },
      target_capacity: {
        vulnerability_level: "HIGH",
        rationale: "China's AI ambitions — including military AI, hypersonic guidance systems, and commercial LLM deployment — require frontier compute that is now structurally inaccessible. CXMT and YMTC provide limited domestic alternatives in memory, but logic chip capability at advanced nodes is 5–8 years behind TSMC's leading node. SMIC's 7nm DUV workaround yields remain below 50%, rendering mass production of advanced AI accelerators infeasible on any relevant timeline."
      },
      chokepoints_identified: [
        "EUV lithography systems — single-source: ASML Netherlands, requiring US export license under EAR",
        "EDA design software — Synopsys and Cadence are US entities; their tools govern the entire chip design flow",
        "Advanced packaging and CoWoS technology — TSMC and OSAT providers subject to US re-export controls",
        "HBM memory for AI accelerators — SK Hynix and Samsung comply with US pressure on China sales restrictions",
        "American-origin software embedded in semiconductor design flows — triggers US jurisdiction regardless of fab location"
      ],
      retaliation_vectors: [
        "Rare earth and processed mineral export restrictions — China controls 60–85% of global gallium, germanium, and dysprosium processing",
        "Supply chain weaponization in solar panels, EV batteries, and drone components — significant US downstream exposure",
        "Accelerated state-sponsored IP acquisition programs targeting leading-edge US fab processes and materials",
        "SMIC capacity allocation preferences to non-US-aligned customers, weaponizing legacy node availability in under-served markets"
      ],
      retaliation_capacity: "MODERATE"
    },
    agent5c: {
      strategic_utility_class: "coercive_leverage",
      time_horizon: "long_term",
      escalation_probability: 38,
      structural_vs_transient: "structural",
      class_rationale: "Semiconductor export controls function as coercive leverage: the sender inflicts costs on the target's strategic priorities — frontier AI capability, military modernization — with the implicit offer of relief contingent on behavioral change. The structural nature of the control — embedded in supply chains and equipment dependencies rather than financial flows — makes this a durable, difficult-to-reverse instrument. Escalation probability is 38%: China has thus far calibrated retaliation to avoid triggering further US escalation, but a verified SMIC breakthrough or demonstrated AI parity event could destabilize this equilibrium rapidly."
    },
    agent5d: {
      first_order_shocks: [
        { sector: "China AI and cloud infrastructure", direction: "NEGATIVE", magnitude: "HIGH", rationale: "Frontier AI chip access constrained at scale. Baidu, Alibaba, and Tencent face GPU shortages limiting large-model training runs. Estimated 2–3 year delay in frontier model parity versus US peers under current controls." },
        { sector: "US semiconductor equipment makers", direction: "NEGATIVE", magnitude: "HIGH", rationale: "KLA, Lam Research, and Applied Materials face $8–12B annual revenue reduction from China exposure. Margin compression expected as China pivots procurement toward domestic equipment alternatives." },
        { sector: "HBM and advanced memory markets", direction: "NEGATIVE", magnitude: "MODERATE", rationale: "HBM supply constrained for China-linked AI systems; global HBM pricing tightens benefiting non-China AI infrastructure build. SK Hynix and Samsung pricing power improves for allied customers." }
      ],
      second_order_shocks: [
        { sector: "Southeast Asia semiconductor hubs", direction: "POSITIVE", magnitude: "MODERATE", rationale: "Malaysia (Penang), Vietnam, and Thailand capture supply chain re-routing as China seeks alternative assembly and test capacity not subject to US controls." },
        { sector: "Rare earth and critical minerals", direction: "NEGATIVE", magnitude: "MODERATE", rationale: "China retaliation risk elevates rare earth price volatility; gallium and germanium spot prices already +120% since 2023 restrictions. Further restrictions on neodymium and dysprosium remain credible." },
        { sector: "US domestic advanced fab capacity", direction: "POSITIVE", magnitude: "MODERATE", rationale: "CHIPS Act ($52B) combined with controls creates captive demand for domestic production. TSMC Arizona, Intel Foundry, and Samsung Taylor fab investments are accelerating as strategic industrial policy." }
      ],
      beneficiaries: [
        { name: "ASML", thesis: "Paradoxically benefits from controls: capacity is ring-fenced to allied customers, driving lead time extension and pricing power for EUV systems. EUR-denominated earnings partially hedged from USD weakness." },
        { name: "Synopsys (SNPS) & Cadence (CDNS)", thesis: "US export license requirements solidify EDA toolchain moat. Chinese EDA alternatives remain 5+ years behind in toolchain completeness; customer lock-in deepens under controls." },
        { name: "SE Asia OSAT operators (ASE Technology, Amkor)", thesis: "Advanced packaging demand diverted from China-linked players. Amkor (US) and ASE Technology (Taiwan) capture incremental volume from re-routing supply chains." }
      ],
      portfolio_signals: [
        { signal: "Short US semiconductor equipment (KLA, LRCX, AMAT)", type: "SELL", conviction: "MODERATE", rationale: "Revenue exposure to China (25–35% of total) faces structural reduction. Domestic fab build-out partially offsets but with a 12–18 month lag. Multiple compression risk as China revenue visibility declines into 2027." },
        { signal: "Long ASML", type: "BUY", conviction: "HIGH", rationale: "EUV monopoly is structurally unassailable on a 5–10 year horizon. Controls enhance pricing power by ring-fencing allied demand. Dutch government support provides political backstop against dilution of technology lead." },
        { signal: "Long TSMC ADR and US domestic fab exposure", type: "BUY", conviction: "MODERATE", rationale: "CHIPS Act funding plus captive government demand creates earnings floor. TSMC Arizona ramp reduces single-geography concentration. Intel Foundry 18A execution remains the key binary risk." },
        { signal: "Monitor critical mineral exposure (MP Materials, Lynas)", type: "MONITOR", conviction: "MODERATE", rationale: "If China formalizes rare earth retaliation, pure-play rare earth and critical mineral miners become high-conviction longs. Position sizing should be sized to the escalation probability (38%)." }
      ],
      hedging_recommendations: [
        "Buy put spreads on semiconductor equipment index (SOXX) to hedge China revenue concentration risk",
        "Long TIPS or commodity inflation swaps to hedge rare earth retaliation scenario and downstream input cost inflation",
        "Diversify OSAT exposure geographically from Taiwan toward Southeast Asia to reduce single-jurisdiction concentration"
      ]
    }
  }
};
