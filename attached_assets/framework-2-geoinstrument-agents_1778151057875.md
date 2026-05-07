# Framework 2: Geoeconomic Instrument Matrix — Multi-Agent Pipeline

> **Architecture:** Parallel-then-converge  
> **Source Framework:** Farrell & Newman Triangular Framework (Geoeconomic Instruments)  
> **Layer Covered:** 6 (Geoeconomic Instrument Analyzer)  
> **Agent Count:** 5 (3 Parallel Specialists + 1 Investment Translator + 1 Supervisor)  
> **Checkpoint:** #1 — May 06, 2026

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                   SUPERVISOR — "THE STRATEGIST"                       │
│     Routes instrument event → runs convergence → produces risk profile│
└──────────────┬───────────────────────────────────────────────────────┘
               │ dispatches simultaneously to all three specialist agents
  ┌────────────▼──────────┐ ┌──────────────────────┐ ┌────────────────────┐
  │      AGENT 5A          │ │      AGENT 5B          │ │     AGENT 5C        │
  │  Instrument Attribute  │ │  Geoeconomic Capacity  │ │  Strategic Utility  │
  │  Scorer                │ │  Assessor              │ │  Classifier         │
  └────────────┬──────────┘ └──────────────┬─────────┘ └──────────┬─────────┘
               │                           │                       │
               └───────────────────────────┴───────────────────────┘
                                           │ all three outputs converge
                              ┌────────────▼────────────┐
                              │  SUPERVISOR CONVERGENCE  │
                              │  Unified Risk Profile     │
                              └────────────┬─────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │      AGENT 5D            │
                              │  Investment Translation  │
                              │  Agent                   │
                              └────────────┬─────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │  FINAL PORTFOLIO SIGNAL  │
                              │  + Framework 1 Handoff   │
                              └─────────────────────────┘
```

Unlike Framework 1's sequential pipeline, this architecture dispatches Agents 5A, 5B, and 5C **simultaneously** against the same instrument event. The Supervisor then runs convergence logic before Agent 5D translates the unified risk profile into investment implications.

---

## Shared State Bus Schema

```json
{
  "instrument_name": "string",
  "sender": "string — country or bloc applying the instrument",
  "target": "string — country, company, or sector targeted",
  "timestamp": "ISO-8601",
  "agent_5a": "InstrumentAttributeScores",
  "agent_5b": "CapacityAssessment",
  "agent_5c": "StrategicUtilityClassification",
  "supervisor_convergence": "GeoRiskProfile",
  "agent_5d": "InvestmentImplications",
  "flags": ["HIGH_SEVERITY", "RETALIATION_RISK", "CIRCUMVENTION_LIKELY", "WAR_ECONOMY_TRIGGER"],
  "framework1_handoff": "CrossFrameworkSignal"
}
```

---

## Agent 5A — Instrument Attribute Scorer

**Role:** Severity matrix owner. Produces the immediate risk profile for any named geoeconomic instrument by scoring it across the five Farrell & Newman core attributes.

### Responsibilities

- Accept a named instrument as input (e.g., "CHIPS Act export controls," "USD SWIFT exclusion," "semiconductor tariff package")
- Score the instrument across all five attributes on a 1–5 scale with documented rationale for each score
- Compute the weighted severity score
- Identify the **dominant attribute** — the single attribute creating the most risk
- Flag `CIRCUMVENTION_LIKELY` if circumvention potential score ≥ 4

### The Five Core Attributes

| Attribute | Weight | Guiding Question | Score = 5 Means |
|---|---|---|---|
| Precision | 20% | How broad is the shock radius? | Surgical — minimal collateral damage |
| Impact | 35% | How painful will it be? | Maximum pain — existential pressure |
| Circumvention Potential | 15% | Can the target route around it? | Very easy to circumvent — largely symbolic |
| Visibility | 15% | Front-page news or buried in footnotes? | Maximum visibility — domestic politics fully activated |
| Speed & Flexibility | 15% | How fast, how reversible? | Instant deployment — pure administrative action |

> Note on Circumvention directionality: A **high** circumvention score (4–5) means the instrument is **easy to route around** — this reduces effectiveness. A **low** score (1–2) means the instrument is **difficult to circumvent** — this increases durability. The severity formula inverts this attribute: `effective_circum = (6 - circumvention_score)`.

### Severity Score Formula

```
Severity = (precision × 0.20) + (impact × 0.35) + ((6 - circumvention) × 0.15)
           + (visibility × 0.15) + (speed × 0.15)

Range: 1.0 (minimal) → 5.0 (maximum)
```

### Severity Classification

| Severity Score | Classification | Implication |
|---|---|---|
| 4.0 – 5.0 | CRITICAL | Structural, long-duration portfolio repositioning required |
| 3.0 – 3.9 | HIGH | Significant sector disruption — active hedging required |
| 2.0 – 2.9 | MODERATE | Targeted impact — monitor for escalation |
| 1.0 – 1.9 | LOW | Limited market impact — policy signaling only |

### Data Sources

#### Precision & Impact Scoring

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Tariff schedules and HS code targets | WTO Tariff Download Facility | tariffdata.wto.org | Ongoing |
| Entity lists / sanctions targets | US Treasury OFAC SDN List | ofac.treas.gov | Ongoing |
| Export control lists (EAR / ITAR) | BIS Export Administration Regulations | bis.doc.gov/index.php/regulations/export-administration-regulations-ear | Ongoing |
| EU sanctions and export controls | EU Sanctions Map | sanctionsmap.eu | Ongoing |
| Bilateral trade exposure by sector | UN Comtrade | comtradeplus.un.org | Monthly |
| Supply chain sector concentration (HHI) | OECD TiVA (Trade in Value Added) | oecd.org/sti/ind/measuringtradeinvalue-addedanoecd-wtojointinitiative | Annual |

#### Circumvention Potential Scoring

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Sanctions evasion / third-country routing reports | C4ADS Open Source Reports | c4ads.org | Periodic |
| Trade re-routing pattern detection | UN Comtrade (anomalous bilateral growth analysis) | comtradeplus.un.org | Monthly |
| Compliance / enforcement actions | US DOJ / Treasury enforcement actions (public) | justice.gov | Ongoing |

#### Visibility Scoring

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Economic policy uncertainty index | Baker-Bloom-Davis EPU Index | policyuncertainty.com | Monthly |
| Media coverage intensity and sentiment | GDELT Project | gdeltproject.org | Daily |
| Public opinion on trade and sanctions | Pew Research Global Attitudes | pewresearch.org/global | Annual |

#### Speed & Flexibility Scoring

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| US legislative tracking | Congress.gov | congress.gov | Daily |
| Executive order and regulatory action tracker | Federal Register | federalregister.gov | Daily |
| EU legislative process tracker | EUR-Lex | eur-lex.europa.eu | Daily |
| Parliamentary vote databases (G20) | Each parliament's official record | — | Varies |

### Handoff to State Bus

```json
{
  "attribute_scores": {
    "precision": "integer (1–5)",
    "impact": "integer (1–5)",
    "circumvention": "integer (1–5)",
    "visibility": "integer (1–5)",
    "speed": "integer (1–5)"
  },
  "severity_score": "float (1.0–5.0)",
  "severity_classification": "LOW | MODERATE | HIGH | CRITICAL",
  "dominant_attribute": "string — which attribute drives highest risk",
  "circumvention_likely_flag": "boolean"
}
```

---

## Agent 5B — Geoeconomic Capacity Assessor

**Role:** Sender/target capacity owner. Runs in parallel with 5A and 5C. Always executed **twice** — once from the sender's perspective and once from the target's — to produce a complete bilateral leverage picture.

### Responsibilities

- Score both sender and target across all four capacity dimensions (Size Asymmetry, Strategic Dependencies, Market Gravity, Institutional Effectiveness)
- Determine **who holds the geoeconomic aces** — which party has the structural leverage advantage
- Compute bilateral vulnerability score for each party (who has more to lose)
- Identify **chokepoint dependencies** — critical goods, financial nodes, or digital infrastructure where one party controls something the other critically depends on
- Assess **coalition potential** — can the sender enlist other countries to join its cause?

### The Four Capacity Dimensions

| Capacity | Core Question | What a High Score Indicates |
|---|---|---|
| Size Asymmetries | Who has more to lose? | Sender's market is far more important to target than vice versa |
| Strategic Dependencies | Who holds the geoeconomic aces? | Sender controls chokepoint — supply chain segment, financial node, or critical input |
| Market Gravity | Can the sender enlist other countries? | Sender's consumer market and capital markets are globally attractive — coalition is buildable |
| Institutional Effectiveness | Can the sender actually implement? | High state capacity, strong bureaucracy, supportive domestic political coalition |

### Bilateral Leverage Assessment Logic

```
Leverage = sender_capacity_composite - target_capacity_composite

IF Leverage > 2.0:  Sender holds clear advantage — instrument likely effective
IF Leverage 0–2.0:  Moderate sender advantage — instrument partially effective
IF Leverage < 0:    Target holds counter-leverage — retaliation or circumvention risk HIGH

Chokepoint premium: If sender controls a critical chokepoint dependency,
                    add +1.5 to sender leverage regardless of composite score
```

### Data Sources

#### Size Asymmetries

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Bilateral trade flows (exports + imports) | UN Comtrade | comtradeplus.un.org | Monthly |
| Bilateral FDI stocks | UNCTAD Bilateral FDI Statistics | unctad.org/topic/investment | Annual |
| Trade as % of GDP by country | World Bank | data.worldbank.org | Annual |
| Revenue exposure by sector | OECD TiVA | oecd.org/sti/ind | Annual |

#### Strategic Dependencies

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Critical raw material import dependencies | EC Critical Raw Materials List + IEA Critical Minerals | iea.org/topics/critical-minerals | Annual |
| Semiconductor supply chain mapping | OECD / SIA Semiconductor Industry Association | semiconductors.org | Annual |
| Energy import dependencies by country | IEA World Energy Statistics | iea.org/data-and-statistics | Annual |
| Food import dependency | FAO Food Security Data | fao.org/faostat | Annual |
| Pharmaceutical / API supply chain dependencies | FDA Drug Shortages Database / EMA | fda.gov/drugs | Ongoing |

#### Market Gravity

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| GDP and per capita GDP | World Bank / IMF | data.worldbank.org | Annual |
| Consumer market size | World Bank / UN population + income data | data.worldbank.org | Annual |
| Financial market depth (equity + bond market cap) | World Federation of Exchanges | world-exchanges.org/our-work/statistics | Annual |
| Currency weight in global FX portfolios | BIS Triennial FX Survey | bis.org/statistics/rpfx | Triennial |
| Inward FDI flows and attractiveness | UNCTAD World Investment Report | unctad.org/topic/investment | Annual |

#### Institutional Effectiveness

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Government effectiveness index | World Bank Governance Indicators | info.worldbank.org/governance/wgi | Annual |
| Rule of law index | World Justice Project | worldjusticeproject.org | Annual |
| State capacity / bureaucratic quality | ICRG (partial free access) | prsgroup.com | Monthly |
| Congressional / parliamentary approval | Pew / Gallup | pewresearch.org | Periodic |
| Industrial lobbying and coalition data (US) | OpenSecrets | opensecrets.org | Ongoing |

### Handoff to State Bus

```json
{
  "sender_capacity": {
    "size_asymmetry": "float (1–5)",
    "strategic_dependencies": "float (1–5)",
    "market_gravity": "float (1–5)",
    "institutional_effectiveness": "float (1–5)",
    "composite": "float (1–5)"
  },
  "target_capacity": {
    "size_asymmetry": "float (1–5)",
    "strategic_dependencies": "float (1–5)",
    "market_gravity": "float (1–5)",
    "institutional_effectiveness": "float (1–5)",
    "composite": "float (1–5)"
  },
  "leverage_holder": "SENDER | TARGET | BALANCED",
  "leverage_differential": "float",
  "chokepoints_identified": ["array of string — critical dependencies named"],
  "coalition_potential": "HIGH | MODERATE | LOW",
  "bilateral_vulnerability": {
    "sender_exposure": "float (0–10)",
    "target_exposure": "float (0–10)"
  }
}
```

---

## Agent 5C — Strategic Utility Classifier

**Role:** Intent and time horizon owner. Runs in parallel with 5A and 5B. Infers the sender's strategic objective from instrument design, deployment context, and geopolitical relationship type.

### Responsibilities

- Infer the sender's strategic intent from instrument design and stated policy context
- Classify into one of the six strategic utility categories
- Estimate the realistic time horizon for the instrument's intended effect
- Assess escalation probability — will this instrument escalate to a higher utility category?
- Apply the **pain tolerance adjustment** — existential security threat vs. economic dispute contexts have very different escalation tolerances
- Assess whether the geopolitical backdrop makes quick reversal likely or structural repositioning necessary

### The Six Strategic Utility Categories

| Utility | Primary Aim | Time Horizon | Escalation to Next Level |
|---|---|---|---|
| Pressure / Coercion | Force policy change without long-term damage | Days to months | Moderate — if target does not comply within months |
| Disruption / Degradation | Cripple near/medium-term capabilities | Months to years | Low-moderate — usually a deliberate sustained strategy |
| Attrition / Destruction | Exhaust and topple the target in the long run | Multi-year | Low — already at high commitment level |
| De-Risking | Remedy critical vulnerabilities while maintaining openness | Multi-year | Very low — cooperative intent |
| Autonomy | Achieve self-sufficiency in critical sectors | Years to decades | Very low — strategic patience posture |
| Dominance | Drive out rivals and set global standards | Decades | Low — a generational industrial strategy |

### Escalation Probability Matrix

```
Base escalation probability by current utility:
  Pressure / Coercion  →  Disruption:    35% if target non-compliance after 90 days
  Disruption           →  Attrition:     20% if degradation insufficient after 18 months
  Attrition            →  Hot conflict:  10% per year of sustained attrition
  De-Risking           →  Autonomy:      25% over 5 years
  Autonomy             →  Dominance:     15% over 10 years

Modifier — Existential security context (e.g., Sino-American rivalry):
  +15% to all escalation probabilities vs. pure economic dispute baseline

Modifier — Domestic political pressure on sender:
  +10% if sender's institutional effectiveness score < 3 (implementation difficulties)
  -10% if coalition_potential = HIGH (burden sharing reduces escalation incentive)
```

### Pain Tolerance Assessment

Based on geopolitical relationship type and existential stakes:

| Context | Pain Tolerance | Implication |
|---|---|---|
| Existential security threat (e.g., Sino-American rivalry) | Very high | Sender willing to accept significant economic pain. Long duration expected. |
| Regional power competition | Moderate-high | Sustained pressure possible but domestic politics limits duration |
| Trade dispute between allies | Low | Short duration. Quick reversal likely. Temporary damage mitigation viable. |
| Sanctions against rogue state | High | Long duration. Sender faces limited internal opposition. |

### Data Sources

#### Escalation & Intent Assessment

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Sanctions design and legal basis | OFAC / EU / UN Sanctions databases | ofac.treas.gov / sanctionsmap.eu / un.org/securitycouncil/sanctions | Ongoing |
| Historical sanctions effectiveness cases | PIIE Sanctions Database | piie.com | Periodic |
| Escalation and retaliation history | Global Sanctions Database (GSDB) | globalsanctionsdatabase.com | Annual |
| Diplomatic event data | GDELT Project | gdeltproject.org | Daily |
| UN Security Council voting records | UN Bibliographic Information System | unbisnet.un.org | Ongoing |
| Geopolitical relationship classification | Correlates of War Project | correlatesofwar.org | Periodic |
| Alliance structures and commitments | ATOP Alliance Data | atopdata.org | Periodic |

### Handoff to State Bus

```json
{
  "utility_classification": "PRESSURE_COERCION | DISRUPTION_DEGRADATION | ATTRITION_DESTRUCTION | DE_RISKING | AUTONOMY | DOMINANCE",
  "utility_label": "string — human readable",
  "time_horizon": "string — estimated duration",
  "escalation_probability": "float (0–1.0)",
  "escalation_next_level": "string — what the next escalation looks like",
  "pain_tolerance": "HIGH | MODERATE | LOW",
  "reversal_likelihood": "HIGH | MODERATE | LOW",
  "geopolitical_context": "string — relationship type classification"
}
```

---

## Supervisor Agent — "The Strategist"

**Role:** Runs convergence after all three parallel agents complete. Detects inconsistencies across attribute scores, capacity assessment, and strategic utility. Produces the unified `GeoRiskProfile`. Routes to Agent 5D.

### Convergence Logic Rules

| # | Condition | Resolution |
|---|---|---|
| 1 | Impact ≥ 4 AND Circumvention ≤ 2 AND Utility = ATTRITION | Classify HIGH SEVERITY — long-duration repositioning required |
| 2 | Visibility ≥ 4 AND Coalition Potential = LOW | Downgrade instrument effectiveness — retaliation likely without allied support |
| 3 | Target holds critical chokepoint dependency AND sender controls it | Escalation probability increases by one tier regardless of stated utility |
| 4 | Instrument faces legal challenge or administration change | Re-run Agent 5A with Speed score reduced by 2 — implementation uncertainty |
| 5 | Utility = DE_RISKING or AUTONOMY AND Framework 1 stage = MP3 | Classify as structural multi-year trend — weight as portfolio reallocation signal, not volatility event |
| 6 | Agent 5A severity HIGH but Agent 5B shows low bilateral dependency | Flag inconsistency — instrument may be poorly targeted or largely symbolic |
| 7 | Agent 5C identifies ATTRITION but Agent 5A shows high circumvention (≥ 4) | Flag instrument design gap — recommend monitoring for secondary instrument package |

### GeoRiskProfile Output Schema

```json
{
  "instrument_name": "string",
  "sender": "string",
  "target": "string",
  "severity_score": "float",
  "severity_classification": "LOW | MODERATE | HIGH | CRITICAL",
  "utility_classification": "string",
  "leverage_holder": "string",
  "escalation_probability": "float",
  "retaliation_risk": "HIGH | MODERATE | LOW",
  "time_horizon": "string",
  "structural_vs_transient": "STRUCTURAL | TRANSIENT",
  "active_flags": ["array of flag strings"],
  "inconsistencies_detected": ["array of string — flagged gaps"],
  "confidence": "HIGH | MODERATE | LOW"
}
```

---

## Agent 5D — Investment Translation Agent

**Role:** Portfolio implication owner. Receives the converged `GeoRiskProfile` from the Supervisor. Translates geoeconomic risk into specific investment signals across asset classes, sectors, and geographies. The only agent that integrates with Framework 1 state bus data.

### Responsibilities

- Map the geoeconomic risk profile to first-order shocks (directly targeted sectors) and second-order shocks (supply chain spillovers, financial contagion)
- Identify reshoring and friend-shoring beneficiary geographies and sectors
- Calibrate signal magnitude using Framework 1's cycle stage — the same instrument has different implications in an Early Cycle vs. Stage 5 Declining Empire environment
- Flag if the geoeconomic instrument should change the scenario type in Framework 1 (e.g., ATTRITION utility escalation triggers WAR_ECONOMY loop)
- Integrate options market implied volatility to assess whether the risk is already priced

### Instrument-to-Investment Translation Matrix

| Utility Classification | First-Order Shock | Second-Order Shock | Beneficiaries |
|---|---|---|---|
| Pressure / Coercion | Targeted sector equities decline on announcement | Supply chain partners face uncertainty | Domestic alternatives to targeted goods; reversal trade if resolved |
| Disruption / Degradation | Tech / export sector stocks in target economy decline | Innovation pipeline of target slows — 3–5 year effect | Friend-shoring geographies (India, Mexico, SE Asia, Vietnam) |
| Attrition / Destruction | Broad risk-off in target economy; commodity supply disruption possible | Financial system fragmentation; correspondent banking stress | Defense, domestic energy producers, strategic minerals, reshoring manufacturers |
| De-Risking | Limited immediate market impact | Supply chain restructuring over 3–7 years | Domestic industrial champions in strategic sectors; supply chain diversification plays |
| Autonomy | Domestic subsidy beneficiaries rise; foreign incumbents at risk | Standards fragmentation — dual ecosystems emerge | Domestic technology and manufacturing champions of the sender |
| Dominance | Foreign industry incumbents face existential price competition | Global standards may shift — IP-sensitive industries affected | Sender's domestic champions; standards-compliant companies globally |

### Framework 1 Cycle Stage Modifier

The same instrument applied in different macro contexts has different investment implications:

| Framework 1 Stage | Modifier Effect on Instrument Signal |
|---|---|
| Early Cycle (Stage 1–2) | Instrument causes temporary volatility — recovery expected. Weight as tactical, not structural. |
| Bubble / Top (Stage 3–4) | Instrument may be the pin that bursts the bubble. Escalate defensive positioning. |
| Depression / MP3 (Stage 5+) | Instrument compounds existing capital flight and currency pressure. Weight as structural. War economy overlay activates. |
| Normalization | Instrument disrupts recovery trajectory. Monitor for policy reversal. |

### WAR_ECONOMY Upgrade Trigger

```
IF utility_classification = ATTRITION_DESTRUCTION
   AND escalation_probability > 0.50
   AND Framework_1.empire_stage >= 4:

  → Publish WAR_ECONOMY_TRIGGER flag to both state buses
  → Framework 1 Agent 4 activates war economy portfolio overlay:
      Long:  Defense, domestic energy, strategic minerals, domestic manufacturing
      Avoid: Global supply chain-dependent multinationals, EM sovereign debt
  → Time horizon reclassified as STRUCTURAL (5–10 year repositioning)
```

### Data Sources

#### Sector Exposure & Supply Chain

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Sector-level supply chain exposure | OECD TiVA + World Bank GVC data | oecd.org/sti/ind | Annual |
| Friend-shoring / trade diversion beneficiary tracking | UN Comtrade trend analysis | comtradeplus.un.org | Monthly |
| Equity sector performance by event type | Yahoo Finance / FRED | finance.yahoo.com | Daily |
| Options implied volatility by sector (VIX, sector VIX) | CBOE | cboe.com | Daily |
| ETF flows by geography and sector | ETF.com | etf.com | Daily |
| Corporate earnings geographic exposure | SEC EDGAR (10-K revenue segment filings) | sec.gov/edgar | Quarterly |

### Handoff to State Bus

```json
{
  "first_order_shocks": [
    {
      "sector": "string",
      "geography": "string",
      "direction": "LONG | SHORT | AVOID | WATCH",
      "conviction": "HIGH | MODERATE | LOW",
      "time_horizon": "string",
      "rationale": "string"
    }
  ],
  "second_order_shocks": ["array — same structure"],
  "beneficiaries": [
    {
      "geography": "string",
      "sector": "string",
      "thesis": "string — why this entity benefits",
      "time_horizon": "string"
    }
  ],
  "structural_vs_transient": "STRUCTURAL | TRANSIENT",
  "war_economy_upgrade": "boolean",
  "framework1_signal_update": {
    "scenario_type_change": "boolean",
    "jurisdiction_risk_delta": "float",
    "recommended_action": "string | null"
  }
}
```

---

## Cross-Framework Integration Protocol

The two frameworks are designed to produce maximum output when run together. The integration is bidirectional.

### Signal Flow

```
FRAMEWORK 1 → FRAMEWORK 2
  Provides: scenario_type, empire_stage, mp_stage
  Purpose:  Agent 5D uses these to calibrate instrument investment implications
            by macro context. Stage 5 + MP3 amplifies any instrument's
            structural portfolio implications.

FRAMEWORK 2 → FRAMEWORK 1
  Provides: utility_classification, escalation_probability
  Purpose:  Framework 1 Agent 4 uses these to update jurisdiction_risk score
            and activate WAR_ECONOMY loop if threshold is crossed.

JOINT FLAG ACTIVATION
  Condition: Geo escalation_probability > 70%
             AND Big Cycle empire_stage >= 4
  Result:    Both supervisors jointly activate WAR_ECONOMY flag
             Full war economy portfolio overlay applied across both outputs
```

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              CROSS-FRAMEWORK INTEGRATION LAYER                   │
│                                                                  │
│  Framework 1 Supervisor  ◄────────────────►  Framework 2 Supervisor │
│       (The Architect)         shared           (The Strategist)  │
│                               state bus                          │
│                                                                  │
│  Shared signals:                                                 │
│  • scenario_type          →  instrument calibration              │
│  • empire_stage           →  structural vs. transient flag       │
│  • mp_stage               →  portfolio weight modifier           │
│  • utility_classification →  jurisdiction_risk delta             │
│  • escalation_probability →  WAR_ECONOMY joint trigger           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Cadence

| Scan Type | Agents Run | Trigger | Recommended Frequency |
|---|---|---|---|
| Full Instrument Analysis | All 5 agents | New instrument announced or major escalation | On event |
| Escalation Monitor | Agent 5C only vs. cached outputs | Scheduled | Weekly |
| Portfolio Refresh | Agent 5D only vs. cached GeoRiskProfile | Scheduled | Monthly |
| Deep Bilateral Review | Agents 5A + 5B + 5C | Bilateral relationship milestone (summit, treaty, rupture) | On event |

### Trigger Events Forcing Re-Run

- New sanctions package, tariff announcement, or export control list update
- Bilateral diplomatic rupture — ambassador recalled, treaty suspended, or security agreement signed
- Supply chain shock in a critical goods category (semiconductors, rare earths, energy, food)
- Financial network action — SWIFT exclusion, FX reserve freeze, correspondent banking withdrawal
- Ally realignment signal — new preferential trade agreement, security agreement, or military posturing
- Instrument reversed, waived, or subject to legal challenge

---

## Coverage Gaps & Limitations

| Gap | Impact | Mitigation |
|---|---|---|
| Capital flows data lags 12–18 months (UNCTAD) | Agent 5B bilateral FDI exposure may miss recent reversals | Supplement with IMF monthly FX reserve data and central bank quarterly reports |
| Circumvention data is qualitative and sparse | Agent 5A circumvention scoring relies on case reports, not systematic data | Use UN Comtrade anomalous bilateral trade growth as quantitative proxy |
| ICRG institutional quality ratings are proprietary | Agent 5B institutional effectiveness scoring is approximated | Combine World Bank WGI + World Justice Project Rule of Law as free proxy |
| Real-time sector-level options volatility requires Bloomberg | Agent 5D cannot fully assess whether risk is already priced | Use CBOE sector VIX products and ETF implied volatility as partial proxy |
| Firm-level geographic revenue exposure requires paid data vendors | Agent 5D first-order shock mapping is approximated at sector level | SEC EDGAR 10-K geographic segment data covers US-listed companies reasonably well |
| Parliamentary / lobbying influence mapping outside the US is limited | Agent 5B institutional effectiveness for non-US senders may be underscored | Supplement with academic governance indices and press analysis |
