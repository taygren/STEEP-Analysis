export const BCE_EXAMPLE = {
  subject: "United States",
  generatedAt: "2026-05-07T12:00:00.000Z",
  synthesis: {
    empire_stage: 4,
    confidence: "HIGH",
    agent_agreement: 4,
    active_flags: ["CRITICAL_DEBT", "BUBBLE_ALERT"],
    printing_probability: 74,
    rerun_cadence: "quarterly",
    power_trajectory: "declining",
    primary_action: "Rotate from long-duration US Treasuries into gold, short-duration TIPS, and commodity-linked equities. Reduce USD concentration. The Spider's Move is a phased defensive rotation timed to Treasury auction stress signals — not a binary exit from US assets, but a structured rebalancing toward inflation-resistant real assets that can compound through the adjustment period.",
    executive_summary: "The United States is a Stage 4 empire — Overextension — operating with a federal debt burden that has crossed the threshold of voluntary sustainability. At 122% debt-to-GDP with structural deficits of 6–7% of GDP, fiscal adjustment has become politically impossible, leaving monetary expansion as the mechanism of debt management. The Dalio Big Cycle diagnostic returns four of five agents in agreement: a stagflationary transition is the central scenario, analogous to the 1970s but with a larger initial debt load. The Spider's Move is defensive rotation — a structured shift toward gold, short-duration inflation protection, and commodity-linked equities that can compound through the adjustment period. Rerun this analysis on a quarterly cadence or immediately upon any of the six listed warning signals.",
    feedback_loops_active: { wealth_confiscation: false, war_economy: false },
    allocation_summary: [
      { asset_class: "Gold & precious metals", recommendation: "LONG", conviction: "HIGH", rationale: "Hard money hedge against fiscal dominance and monetary expansion. Central bank gold demand at 40-year highs validates the structural bid." },
      { asset_class: "Short-duration TIPS (0–5yr)", recommendation: "LONG", conviction: "HIGH", rationale: "Provides inflation protection without duration risk. Real yields remain positive at the short end; break-even inflation at 2.4% underprices the stagflationary scenario." },
      { asset_class: "Commodity producers (energy, copper)", recommendation: "LONG", conviction: "MODERATE", rationale: "Energy transition + deglobalization create structural commodity demand. Energy complex benefits from inflation pass-through. Position subject to growth-slowdown override." },
      { asset_class: "Long-duration US Treasuries (10yr+)", recommendation: "REDUCE", conviction: "HIGH", rationale: "Duration risk is uncompensated at current yield levels given the fiscal trajectory. Term premium must reprice to reflect monetization risk — expect 4.8–5.5% on the 10yr over the scenario horizon." },
      { asset_class: "US large-cap growth equities", recommendation: "REDUCE", conviction: "MODERATE", rationale: "Multiple compression risk as discount rates normalize and the AI capex cycle peaks. Maintain exposure to infrastructure and defense capex themes; reduce consumer-facing multiples." },
      { asset_class: "EM equities ex-China (diversified)", recommendation: "INCREASE", conviction: "MODERATE", rationale: "Beneficiary of USD weakness, commodity tailwinds, and supply chain onshoring flows into Southeast Asia and India. India small/mid-cap particularly well-positioned." },
      { asset_class: "Cash (short-term T-bills)", recommendation: "HOLD", conviction: "MODERATE", rationale: "T-bill yields remain positive in real terms for now. Preserve optionality; do not extend duration or take credit risk in this environment." }
    ]
  },
  layers: {
    layer1: {
      composite_score: 5.8,
      power_trajectory: "declining",
      dominant_force: "debt",
      force_scores: {
        debt: 7.8,
        internal_order: 6.1,
        external_order: 5.3,
        technology: 3.4,
        nature: 4.7
      },
      force_rationales: {
        debt: "Federal debt-to-GDP at 122%, structural deficits running at 6–7% of GDP, interest payments exceeding $1.1T annually. The feedback loop between debt service costs and new borrowing is self-reinforcing at current yield levels.",
        internal_order: "Bipartisan polarization and governance dysfunction suppress fiscal adjustment capacity. Wealth concentration in the top 1% has risen 11 percentage points since 2000, generating structural distributional conflict that blocks austerity.",
        external_order: "USD reserve currency status is eroding at the margin — BRICS+ bloc is settling 38% of trade in non-dollar currencies (up from 29% in 2020). US military primacy remains intact but is increasingly costly to sustain.",
        technology: "Significant technology advantage persists: AI, semiconductors, biotech. TSMC Arizona fab and CHIPS Act investments are rebuilding domestic production capacity. This partially offsets structural headwinds.",
        nature: "Climate-related fiscal costs are escalating — FEMA costs tripling per decade, agricultural stress in the Central Valley, infrastructure resilience spending demands. Not yet a systemic threat but a compounding drag on the fiscal position."
      },
      stage_rationale: "The United States occupies Stage 4 — Overextension — characterized by peak reserve currency status alongside unsustainable fiscal expansion. Empire-level productive capacity is declining relative to debt obligations, and the political system has lost the capacity for austerity. The transition to Stage 5 requires either a debt restructuring event, sustained financial repression, or a productive renaissance that grows GDP faster than debt — the last option being the least politically constrained path but the most economically uncertain."
    },
    layer2: {
      debt_status: "UNSUSTAINABLE",
      critical_debt_flag: false,
      mp_stage: "MP3",
      i_minus_g: 0.9,
      printing_probability: 74,
      bubble_score: 5,
      bubble_severity: "HIGH",
      bubble_alert: true,
      bubble_conditions_met: [
        "Equity market P/E ratios at 24x (90th percentile vs. 100-year history), sustained by AI multiple expansion",
        "Residential real estate price-to-income ratio at 7.2x nationally, exceeding the 2006 peak in 32 states",
        "Private credit markets expanding at 18% CAGR with deteriorating covenant protections and rising PIK structures",
        "AI infrastructure spending driving corporate leverage ratios above 3.5x in the technology sector",
        "Treasury term premium collapsed; market prices Fed pivot before meaningful fiscal adjustment occurs"
      ],
      debt_rationale: "US federal debt dynamics entered MP3 territory: the Fed cannot raise rates without triggering a debt service crisis (interest payments already 14% of federal outlays). Quantitative easing is the path of least resistance. The i-g differential is positive at +0.9%, meaning debt-to-GDP grows faster than the economy absent primary surpluses — which are politically infeasible in the current configuration. Financial repression (negative real yields) is the historical resolution.",
      bubble_rationale: "Five of seven bubble criteria are active. Asset markets have been sustained by post-COVID liquidity injections and AI-driven technology sector multiple expansion. A 15–20% correction is within one standard deviation; a 30–40% correction is plausible if credit markets seize around a Treasury auction disruption or a rapid shift in foreign reserve management."
    },
    layer3: {
      scenario_type: "INFLATIONARY_DEPRESSION",
      scenario_label: "Stagflationary Transition",
      phase: "early",
      war_economy_flag: false,
      analogy_label: "1970s United States",
      analogy_id: "us_1970s",
      analogy_confidence: "HIGH",
      mechanism: "Fiscal dominance forces the Fed into monetization, collapsing real yields and eroding USD purchasing power. Entrenched supply-side constraints — onshoring mandates, labor market rigidities, energy transition costs — sustain inflation above target even as growth softens. The 1970s analog holds because the mechanism is identical: an external supply shock (oil embargo in 1973; deglobalization and supply chain fracture in 2024–27) collides with an already-overextended fiscal position, forcing central bank accommodation. The difference in 2026 is that the initial debt load is 3× larger, compressing the available policy space.",
      warning_signals: [
        "Treasury 30-year auction bid-to-cover ratio declining toward 2.1× (structural danger threshold for auction disruption)",
        "MOVE Index (bond volatility) sustaining above 120 for more than 30 trading days",
        "USD DXY trending below 98 on a rolling 6-month moving average",
        "Real GDP growth below 1.5% for two consecutive quarters alongside CPI above 3.5%",
        "High-yield credit spreads (OAS) widening above 450bps on the Bloomberg US Corporate HY Index",
        "Gold-to-oil ratio approaching 30×, signaling monetary stress and the transition from financial to real asset stores of value"
      ],
      arb_signals: {
        pre_print: {
          long: ["Gold (GLD, IAU)", "Inflation-linked bonds — short duration (TIP, VTIP)", "Commodity producers (XLE, COPX, GDX)"],
          short: ["Long-duration Treasuries (TLT, EDV)", "USD (UUP)", "Rate-sensitive consumer credit (ALLY, SYF)"]
        },
        post_print: {
          long: ["Domestic real assets (infrastructure, industrial property)", "EM equities ex-China (EEM, INDA)", "Short-duration sovereign debt (laddered 3–12 month T-bills)"],
          short: ["Financial sector — rate-sensitive banks (XLF)", "Consumer discretionary with high leverage (XLY)", "Long-duration investment grade credit"]
        }
      }
    },
    layer4: {
      primary_action: "Rotate from long-duration US Treasuries into gold, short-duration TIPS, and commodity-linked equities. Reduce USD concentration. The Spider's Move is a phased defensive rotation timed to Treasury auction stress signals — not a binary exit from US assets, but a structured rebalancing toward inflation-resistant real assets.",
      cycle_stage: "late_expansion_early_contraction",
      position_sizing: "defensive_tilt",
      jurisdiction_risk_score: 5.8,
      jurisdiction_override: false,
      allocation_matrix: [
        { asset_class: "Gold & precious metals", recommendation: "LONG", conviction: "HIGH", rationale: "Hard money hedge against fiscal dominance and monetary expansion. Central bank gold demand at 40-year highs validates the structural bid." },
        { asset_class: "Short-duration TIPS (0–5yr)", recommendation: "LONG", conviction: "HIGH", rationale: "Provides inflation protection without duration risk. Real yields remain positive at the short end; break-even inflation at 2.4% underprices the stagflationary scenario." },
        { asset_class: "Commodity producers (energy, copper)", recommendation: "LONG", conviction: "MODERATE", rationale: "Energy transition + deglobalization create structural commodity demand. Energy complex benefits from inflation pass-through." },
        { asset_class: "Long-duration US Treasuries (10yr+)", recommendation: "REDUCE", conviction: "HIGH", rationale: "Duration risk is uncompensated. Term premium must reprice to reflect monetization risk — expect 4.8–5.5% on the 10yr over the scenario horizon." },
        { asset_class: "US large-cap growth equities", recommendation: "REDUCE", conviction: "MODERATE", rationale: "Multiple compression risk as discount rates normalize and the AI capex cycle peaks. Maintain infrastructure and defense capex themes." },
        { asset_class: "EM equities ex-China (diversified)", recommendation: "INCREASE", conviction: "MODERATE", rationale: "Beneficiary of USD weakness, commodity tailwinds, and supply chain onshoring flows into Southeast Asia and India." },
        { asset_class: "Cash (short-term T-bills)", recommendation: "HOLD", conviction: "MODERATE", rationale: "T-bill yields remain positive in real terms. Preserve optionality; do not extend duration or take credit risk in this environment." }
      ]
    }
  }
};
