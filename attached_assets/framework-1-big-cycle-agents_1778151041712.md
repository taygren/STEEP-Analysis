# Framework 1: Dalio Big Cycle Engine — Multi-Agent Pipeline

> **Architecture:** Sequential-with-feedback  
> **Layers Covered:** 1 (Five Forces), 2A (Debt Sustainability), 2B (Bubble Detection), 3 (Scenario), 4 (Decision Matrix)  
> **Agent Count:** 5 (4 Specialists + 1 Supervisor)  
> **Checkpoint:** #1 — May 06, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPERVISOR — "THE ARCHITECT"                      │
│         Orchestrates pipeline · Resolves conflicts · Synthesizes     │
└────────────┬────────────────────────────────────────────────────────┘
             │ routes + monitors shared state bus
    ┌────────▼────────┐    ┌──────────────────┐    ┌─────────────────┐
    │   AGENT 1       │───▶│    AGENT 2        │───▶│   AGENT 3       │
    │  Five Forces    │    │  Debt Analyst     │    │  Scenario       │
    │  Diagnostician  │    │  + Bubble Detect  │    │  Architect      │
    └─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                            │
                                                   ┌────────▼────────┐
                                                   │   AGENT 4       │
                                                   │  Decision Matrix│
                                                   │  Executor       │
                                                   └────────┬────────┘
                                                            │
                                               ┌────────────▼──────────┐
                                               │  SUPERVISOR SYNTHESIS  │
                                               │  Unified Report Output │
                                               └───────────────────────┘
```

Each agent publishes a structured output to the **shared state bus**. No agent reads raw inputs from prior agents — only from the bus. This makes the pipeline modular and each agent independently replaceable.

---

## Shared State Bus Schema

```json
{
  "country": "string",
  "timestamp": "ISO-8601",
  "layer1": "ForcesDiagnostic",
  "layer2a": "DebtSustainability",
  "layer2b": "BubbleAlert",
  "layer3": "Scenario",
  "layer4": "DecisionMatrix",
  "flags": ["CRITICAL_DEBT", "WAR_ECONOMY", "JURISDICTION_RISK", "BUBBLE_ALERT"],
  "supervisor": "SynthesisReport"
}
```

---

## Agent 1 — Five Forces Diagnostician

**Layer:** 1  
**Role:** Ground truth provider for the full pipeline. All downstream agents treat this output as the authoritative empire stage and power posture classification.

### Responsibilities

- Ingest raw country and macro data across all five force dimensions
- Score each force 0–10 (10 = maximum stress / declining)
- Apply weighted composite to classify empire stage (1–6) and power posture
- Identify the **dominant force** — the single most stressed dimension driving the composite
- Output `power_trajectory` signal: is the composite score improving or deteriorating vs. prior period?

### Scoring Weights

| Force | Weight | Rationale |
|---|---|---|
| Debt / Money / Economic | 30% | Leading indicator — debt stress precedes all other cycle shifts |
| Internal Order | 25% | Political stability drives policy coherence and capital confidence |
| External Order | 20% | Reserve currency and trade share determine adjustment room |
| Technology / Innovation | 15% | Partial offset to debt stress — productivity can extend the cycle |
| Nature / Climate | 10% | Supply shock multiplier — amplifies existing vulnerabilities |

### Empire Stage Classification

| Stage | Score Range | Label | Investment Posture |
|---|---|---|---|
| 1 | 0.0 – 2.5 | New Order / Rising | Aggressive long |
| 2 | 2.5 – 4.0 | Building Power | Growth |
| 3 | 4.0 – 5.5 | Peak Power | Balanced / selective |
| 4 | 5.5 – 7.0 | Overextension | Defensive rotation begins |
| 5 | 7.0 – 9.0 | Decline | Wealth preservation priority |
| 6 | 9.0 – 10.0 | Crisis / Reset | Maximum defensive posture |

### Data Sources

#### Debt / Money Node

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Government debt-to-GDP | IMF World Economic Outlook Database | imf.org/en/Publications/WEO | Semi-annual |
| Total credit (public + private) | BIS Total Credit Statistics | bis.org/statistics/totcredit | Quarterly |
| Debt service ratios | BIS Debt Service Ratio Database | bis.org/statistics/dsr | Quarterly |
| Primary fiscal balance | IMF Fiscal Monitor | imf.org/en/Publications/FM | Semi-annual |
| Central bank balance sheet | Fed H.4.1 / ECB / BOJ releases | federalreserve.gov/releases/h41 | Weekly |
| Money supply (M2, M3) | FRED — Federal Reserve | fred.stlouisfed.org | Weekly / Monthly |

#### Internal Order Node

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Political polarization / democratic backsliding | V-Dem Institute | v-dem.net | Annual |
| Political stability index | World Bank Governance Indicators | info.worldbank.org/governance/wgi | Annual |
| Wealth / income inequality (Gini, top decile) | World Inequality Database | wid.world | Annual |
| Social unrest / protest events | ACLED | acleddata.com | Weekly |
| Political freedom scores | Freedom House | freedomhouse.org | Annual |
| Government trust / approval | Pew Research Global Attitudes | pewresearch.org/global | Annual |

#### External Order Node

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Reserve currency share | IMF COFER Database | imf.org/external/np/sta/cofer | Quarterly |
| Global trade share by country | WTO Statistics Portal | stats.wto.org | Annual |
| Military expenditure | SIPRI Military Expenditure Database | sipri.org/databases/milex | Annual |
| Current account balance | IMF Balance of Payments | imf.org/en/Data | Quarterly |
| Foreign exchange reserves | IMF IFS / World Bank | data.worldbank.org | Monthly |
| Bilateral trade flows | UN Comtrade | comtradeplus.un.org | Monthly |

#### Nature / Climate Node

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Climate vulnerability index | ND-GAIN Country Index | gain.nd.edu | Annual |
| Natural disaster economic losses | EM-DAT International Disaster Database | emdat.be | Ongoing |
| Food security index | FAOSTAT | fao.org/faostat | Annual |
| Water stress index | WRI Aqueduct | wri.org/aqueduct | Annual |

#### Technology Node

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| R&D spending as % GDP | World Bank | data.worldbank.org | Annual |
| Patent filings by country | WIPO Statistics Database | wipo.int/ipstats | Annual |
| AI readiness / adoption index | Oxford Government AI Readiness Index | oxfordinsights.com | Annual |
| Technology exports share | UN Comtrade / World Bank HiTech Exports | data.worldbank.org | Annual |
| Internet penetration / digital infrastructure | ITU ICT Development Index | itu.int/itu-d/reports | Annual |

### Handoff to State Bus

```json
{
  "empire_stage": "integer (1–6)",
  "composite_score": "float (0–10)",
  "dominant_force": "string — which of the five forces is most stressed",
  "power_posture": "rising | neutral | declining",
  "power_trajectory": "improving | stable | deteriorating",
  "force_scores": {
    "debt": "float",
    "internal_order": "float",
    "external_order": "float",
    "nature": "float",
    "technology": "float"
  }
}
```

---

## Agent 2 — Debt Sustainability Analyst

**Layer:** 2A (Debt Sustainability) + 2B (Bubble Detection)  
**Role:** Quantifies the debt trap and detects bubble conditions. Issues the `CRITICAL_DEBT_FLAG` that forces supervisor escalation to crisis-mode routing.

### Responsibilities

- Run the debt sustainability equation (i−g differential, Ponzi finance threshold detection)
- Classify current Monetary Policy stage (MP1 / MP2 / MP3)
- Compute printing probability score
- Execute the 7-point bubble detection algorithm against the asset or market under analysis
- Issue `CRITICAL_DEBT_FLAG` when `i−g > 2` AND `debt/income > 1.5` simultaneously

### Debt Sustainability Logic

**Core equation:**

```
Debt Burden Trajectory = Debt × (1 + i) / Income × (1 + g)

where:
  i = Nominal interest rate
  g = Nominal GDP growth rate
```

| Condition | Classification | Printing Probability |
|---|---|---|
| i−g > 2 AND Debt/Income > 1.5 | PONZI FINANCE | 90% |
| i−g > 0 AND Debt/Income > 1.0 | UNSUSTAINABLE | 70% |
| i−g near zero, Debt/Income 0.8–1.0 | BORDERLINE | 35% |
| i−g < 0 | BEAUTIFUL DELEVERAGING | 10% |

### Monetary Policy Stage Classification

| Stage | Condition | Description |
|---|---|---|
| MP1 | Rate > 2.5% | Conventional — interest rate adjustments. Effective until rates hit 0%. |
| MP2 | 0.25% < Rate ≤ 2.5% | QE territory — balance sheet expansion, asset purchases to suppress yields. |
| MP3 | Rate ≤ 0.25% | Fiscal monetization — helicopter money, coordinated fiscal-monetary stimulus. |

### Bubble Detection Algorithm

Alert fires at **≥ 5 of 7 conditions** confirmed:

| # | Condition | Data Signal |
|---|---|---|
| 1 | Prices high relative to traditional valuation measures | Shiller CAPE > 30, P/B > 3.5 |
| 2 | Prices discounting unsustainable future appreciation | Forward P/E implies >15% annual growth for 10+ years |
| 3 | Broad bullish sentiment — "everyone is bullish" | AAII bulls > 55%, put/call ratio < 0.7 |
| 4 | Purchases financed by high leverage | Margin debt at record high, FINRA data |
| 5 | Extended forward purchases / inventory building | Commodity or RE forward contracts at extremes |
| 6 | New, inexperienced buyers entering the market | IPO volume spike, retail brokerage account openings surge |
| 7 | Stimulative monetary policy inflating the bubble | MP1 or MP2 active while bubble conditions exist |

### Data Sources

#### Debt Sustainability Inputs

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Nominal interest rates (policy + market) | FRED | fred.stlouisfed.org | Daily |
| Yield curve (10yr / 2yr Treasury) | US Treasury Direct | home.treasury.gov/data/treasury-bulletin | Daily |
| Nominal GDP growth rates | World Bank / IMF WEO | data.worldbank.org | Quarterly |
| Primary fiscal balance | IMF Fiscal Monitor | imf.org/en/Publications/FM | Semi-annual |
| Real interest rates | FRED — TIPS spreads | fred.stlouisfed.org | Daily |
| Central bank policy rate history | BIS Policy Rate Statistics | bis.org/statistics/cbpol | Monthly |

#### Bubble Detection Inputs

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Equity valuations — Shiller CAPE | Robert Shiller Data (Yale) | shillerdata.com | Monthly |
| Margin debt / leverage | FINRA Margin Statistics | finra.org/investors/learn-to-invest/advanced-investing/margin-statistics | Monthly |
| Investor sentiment — AAII Survey | AAII | aaii.com/sentimentsurvey | Weekly |
| Put / call ratio | CBOE Options Data | cboe.com/us/options/market_statistics | Daily |
| IPO volume / new issues | SEC EDGAR | sec.gov/cgi-bin/browse-edgar | Ongoing |
| Credit spreads (IG / HY) | FRED — ICE BofA Spread Indices | fred.stlouisfed.org | Daily |
| Housing valuations | FRED — Case-Shiller HPI | fred.stlouisfed.org | Monthly |

### Critical Flag Logic

```
IF i−g > 2 AND debt/income > 1.5:
  → Publish CRITICAL_DEBT_FLAG to state bus
  → Supervisor escalates to CRISIS routing
  → Agent 3 forced to INFLATIONARY or DEFLATIONARY DEPRESSION path
  → Agent 4 overrides standard allocation to PRESERVE / MP3 posture
```

### Handoff to State Bus

```json
{
  "i_minus_g": "float",
  "debt_status": "PONZI_FINANCE | UNSUSTAINABLE | BORDERLINE | BEAUTIFUL_DELEVERAGING",
  "mp_stage": "MP1 | MP2 | MP3",
  "printing_probability": "integer (0–100)",
  "bubble_score": "integer (0–7)",
  "bubble_alert": "boolean",
  "bubble_severity": "LOW | MODERATE | HIGH | EXTREME",
  "critical_debt_flag": "boolean"
}
```

---

## Agent 3 — Scenario Architect

**Layer:** 3  
**Role:** The most context-sensitive agent. Integrates empire stage, MP stage, debt denomination, and capital flight risk into a coherent scenario narrative. Applies the critical currency regime fork. Matches to historical analogy.

### Responsibilities

- Receive `ForcesDiagnostic` (Agent 1) and `DebtSustainability` (Agent 2) from state bus
- Apply the currency regime fork to determine deflationary vs. inflationary path
- Generate full scenario narrative: mechanism, phase, warning signals, time horizon
- Match to historical analogy with confidence scoring (HIGH / MODERATE / LOW)
- Generate pre-print and post-print arbitrage signal sets
- Detect and flag the `WAR_ECONOMY` trigger when external conflict is elevated

### Currency Regime Fork — The Critical Decision

```
Debt denominated in own currency?
│
├── YES ──▶ Capital flight risk?
│           ├── LOW (< 6/10)  ──▶  DEFLATIONARY DEPRESSION PATH
│           │                       Mechanism: Asset prices fall → debtors sell
│           │                       → wealth effect collapses → spending falls
│           │                       Pre-print:  Long Gov Bonds + Gold
│           │                       Post-print: Long Gold + Equities + Real Assets
│           │                       Analogies:  US 1929–1933, US 2008, Japan 1990
│           │
│           └── HIGH (≥ 6/10) ──▶  INFLATIONARY DEPRESSION PATH
│
└── NO ───▶ Foreign currency debt
            └──▶  INFLATIONARY / HYPERINFLATIONARY PATH
                  Mechanism: Capital outflows → currency plummets
                  → import prices spike → inflation → more capital flight
                  Short: Local FX + Local Bonds
                  Long:  Gold + USD + Commodities + Foreign Assets
                  Analogies: Weimar 1919–1923, Argentina, EM crises
```

### Historical Analogy Confidence Matrix

| Scenario Type | Stage | MP Stage | Best Analogy | Confidence |
|---|---|---|---|---|
| Deflationary | 5 | MP3 | US 1933–1945 | HIGH |
| Deflationary | 4 | MP2 | US 2008–2020 | HIGH |
| Deflationary | 4–5 | MP2/MP3 | Japan 1990–present | MODERATE |
| Deflationary | 5–6 | Hard money | Dutch Empire 1780s | LOW |
| Inflationary | 5–6 | Unanchored | Weimar Germany 1919–1923 | HIGH |
| Inflationary | 4–5 | EM-style | Argentina / Turkey | MODERATE |
| Declining hegemon | 5 | MP2/MP3 | UK post-WWII 1945–1976 | MODERATE |

### WAR_ECONOMY Trigger Condition

```
IF external_order_score > 6 AND external_conflict_level > 6:
  → Publish WAR_ECONOMY flag to state bus
  → Scenario narrative appends war economy mechanism:
      External conflict → supply chains break → inflation rises
      → MP tightening impossible (debt too high) → stagflation trap
  → Agent 4 appends war economy portfolio overlay:
      Long: Defense, domestic energy, strategic minerals, reshoring
      Avoid: Global supply chain-dependent multinationals, EM debt
```

### Data Sources

#### Currency Regime & Capital Flow Inputs

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| FX reserve levels and changes | IMF IFS Statistics | imf.org/en/Data | Monthly |
| Currency real effective exchange rate (REER) | BIS REER Statistics | bis.org/statistics/eer | Monthly |
| Capital account / FDI flows | UNCTAD Investment Statistics | unctad.org/topic/investment | Annual |
| Portfolio flow data | IMF CPIS | imf.org/en/Data | Annual |
| Balance of payments | IMF BOP Statistics | imf.org/en/Data | Quarterly |
| Currency implied volatility proxy | Yahoo Finance options chain | finance.yahoo.com | Daily |

#### Historical Analogy Reference Data

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Historical macro data (1800–present) | Jorda-Schularick-Taylor Macrohistory Database | macrohistory.net/database | Static / periodic |
| Historical crisis episodes | Reinhart-Rogoff Dataset | carmenreinhart.com/data | Static |
| Historical inflation episodes | IMF Historical Public Debt Database | imf.org/en/Publications/WP | Static / periodic |

### Handoff to State Bus

```json
{
  "scenario_type": "DEFLATIONARY_DEPRESSION | INFLATIONARY_DEPRESSION | HYPERINFLATIONARY",
  "scenario_label": "string — human-readable scenario name",
  "mechanism": "string — causal chain description",
  "phase": "string — current position within scenario arc",
  "analogy_id": "string — key from historical analogies database",
  "analogy_confidence": "HIGH | MODERATE | LOW",
  "warning_signals": ["array of string"],
  "arb_signals_pre_print": { "long": [], "short": [] },
  "arb_signals_post_print": { "long": [], "short": [] },
  "war_economy_flag": "boolean"
}
```

---

## Agent 4 — Decision Matrix Executor

**Layer:** 4  
**Role:** Final actionable output generator. Has ultimate authority over allocation recommendations. Can override any prior agent signal if jurisdiction risk exceeds threshold. Produces "The Spider's Move."

### Responsibilities

- Consume `empire_stage`, `mp_stage`, `scenario_type` from state bus
- Generate full per-asset allocation matrix with recommendation and rationale
- Apply jurisdiction risk overlay (capital controls probability, wealth confiscation risk)
- Produce "The Spider's Move" — the single-sentence primary allocation signal
- Generate position sizing guidance (full / partial / hold)
- Detect and flag both feedback loops (Wealth Confiscation, War Economy)
- Issue `JURISDICTION_OVERRIDE` if jurisdiction risk > 7/10 — prepends DIVERSIFY JURISDICTION to all recommendations regardless of other signals

### Allocation Matrix by Cycle Stage

| Cycle Stage | Key Signals | Primary Action | Core Allocation Signal |
|---|---|---|---|
| Early Cycle | Low debt, g > i, MP1 easing | LEVERAGE LONG | Equities, Real Estate, Corporate Credit |
| Bubble | Debt > 300% GDP, new buyers, tightening begins | REDUCE LEVERAGE | Rotate cyclicals → quality. Build hedges. |
| Top | Curve inversion, capacity constraints, rates peak | DEFENSIVE POSTURE | Cash + short-term gov bonds. Short bubble assets. |
| Depression (Early) — Deflationary | Asset crash, liquidity crisis | PRESERVE CAPITAL | Gov Bonds + Gold. Avoid all credit. |
| Depression (Early) — Inflationary | Currency break, capital flight | HARD ASSET PRESERVATION | Gold + USD/hard FX + Commodities. Exit local bonds. |
| MP3 Deleveraging | Zero rates, fiscal deficits monetized | SHORT CASH / LONG REAL ASSETS | Gold + TIPS + Real Assets + Innovation. Exit nominal bonds + cash. |
| Normalization | Debt stabilizing, productivity rising | RE-ENTER RISK | Equities (slowly) + Innovation sectors + Corporate Credit |

### Jurisdiction Risk Overlay

| Risk Score | Alert Level | Required Action |
|---|---|---|
| > 7/10 | CRITICAL | DIVERSIFY JURISDICTION IMMEDIATELY. Singapore, Switzerland, UAE priority. |
| 5–7/10 | ELEVATED | Begin building foreign asset base. Consider offshore legal structures. |
| 3–5/10 | MODERATE | Standard domestic positioning with partial foreign allocation. |
| < 3/10 | LOW | No jurisdiction adjustment required. |

### Feedback Loop Detection

**Wealth Confiscation Loop**
```
Trigger: empire_stage ≥ 5 AND jurisdiction_risk > 6 AND mp_stage = MP3
Mechanism: Debt unmanageable → Gov raises taxes/capital controls
           → Capital flight accelerates → Need for more printing increases
Action: JURISDICTION_OVERRIDE activated. Prioritize Singapore, Switzerland, UAE.
```

**War Economy Loop**
```
Trigger: war_economy_flag = true (from Agent 3) AND empire_stage ≥ 4
Mechanism: External conflict → Supply chains fragment → Import prices spike
           → Inflation rises → CB cannot tighten (debt too high) → Stagflation
Action: Append war economy overlay:
  Long: Defense, domestic energy, strategic minerals, domestic manufacturing
  Avoid: Global supply chain-dependent multinationals, EM debt
```

### Data Sources

#### Jurisdiction & Capital Controls

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Capital controls index | IMF AREAER | imf.org/en/Publications/AREAER | Annual |
| Economic freedom / property rights | Heritage Foundation Index | heritage.org/index | Annual |
| Rule of law / institutional quality | World Bank Governance Indicators | info.worldbank.org/governance/wgi | Annual |
| Country risk aggregator | Trading Economics | tradingeconomics.com | Ongoing |
| Corruption perceptions index | Transparency International | transparency.org | Annual |

#### Asset Class Reference

| Dataset | Source | URL | Frequency |
|---|---|---|---|
| Global equity indices | Yahoo Finance / Investing.com | finance.yahoo.com | Daily |
| Gold prices — historical + current | FRED | fred.stlouisfed.org | Daily |
| Commodity indices | World Bank Commodity Price Data (Pink Sheet) | worldbank.org/en/research/commodity-markets | Monthly |
| Inflation-linked bond yields (TIPS) | FRED | fred.stlouisfed.org | Daily |
| Global bond yields | Trading Economics | tradingeconomics.com | Daily |

### Handoff to State Bus

```json
{
  "cycle_stage": "string",
  "primary_action": "string — The Spider's Move",
  "allocation_matrix": [
    {
      "asset_class": "string",
      "recommendation": "LONG | SHORT | HOLD | AVOID | REDUCE | INCREASE",
      "conviction": "HIGH | MODERATE | LOW",
      "rationale": "string"
    }
  ],
  "jurisdiction_risk_score": "float (0–10)",
  "jurisdiction_override": "boolean",
  "jurisdiction_action": "string | null",
  "wealth_confiscation_loop_active": "boolean",
  "war_economy_loop_active": "boolean",
  "position_sizing": "FULL | PARTIAL_50 | PARTIAL_25 | HOLD"
}
```

---

## Supervisor Agent — "The Architect"

**Role:** Orchestrates the full pipeline. Detects conflicts between layer outputs. Produces the final unified synthesis. Assigns overall confidence level.

### Pipeline Orchestration Sequence

```
1. Receive country / asset configuration
2. Route to Agent 1 → wait for ForcesDiagnostic
3. Route to Agent 2 → wait for DebtSustainability + BubbleAlert
4. Check for CRITICAL_DEBT_FLAG → escalate routing if active
5. Route to Agent 3 → wait for Scenario
6. Route to Agent 4 → wait for DecisionMatrix
7. Run conflict resolution rules
8. Assign confidence level
9. Publish SynthesisReport to state bus
10. Determine re-run cadence
```

### Conflict Resolution Rules

| # | Condition | Resolution |
|---|---|---|
| 1 | layer1.empire_stage ≥ 5 AND layer2a.debt_status = PONZI_FINANCE | Escalate to CRISIS routing regardless of other signals |
| 2 | layer3.scenario = INFLATIONARY AND layer4.jurisdiction_risk > 7 | Prepend DIVERSIFY JURISDICTION to all allocation recommendations |
| 3 | layer2b.bubble_score ≥ 6 AND layer1.external_order > 6 | Activate WAR_ECONOMY feedback loop flag |
| 4 | layer1.technology < 2.0 (strong tech score) | Reduce printing_probability by 10 points as partial cycle offset |
| 5 | layer1 and layer2a disagree on cycle stage by > 1 stage | Weight layer2a (debt) as primary determinant — debt stress is the leading signal |

### Confidence Assignment

| Condition | Confidence Level |
|---|---|
| All four agents agree on cycle stage | HIGH |
| Three of four agents agree | MODERATE |
| Split — two vs. two disagreement | LOW — flag for manual review |

### SynthesisReport Output Schema

```json
{
  "country": "string",
  "timestamp": "ISO-8601",
  "confidence": "HIGH | MODERATE | LOW",
  "empire_stage": "integer",
  "cycle_stage": "string",
  "scenario_type": "string",
  "primary_action": "string — The Spider's Move",
  "printing_probability": "integer",
  "historical_analogy": "string",
  "analogy_confidence": "string",
  "active_flags": ["array of flag strings"],
  "allocation_summary": ["array of asset recommendations"],
  "feedback_loops_active": {
    "wealth_confiscation": "boolean",
    "war_economy": "boolean"
  },
  "rerun_cadence": "DAILY | WEEKLY | MONTHLY | QUARTERLY",
  "agent_agreement": "integer (1–4 agents agreeing on stage)"
}
```

---

## Execution Cadence

| Scan Type | Agents Run | Trigger | Recommended Frequency |
|---|---|---|---|
| Deep Scan | Full pipeline — all 5 agents | Scheduled or major macro event | Quarterly |
| Signal Scan | Agents 2 + 4 only | Scheduled or market dislocation | Monthly |
| Alert Scan | Supervisor only vs. cached outputs | Trigger events (see below) | Daily |

### Trigger Events Forcing Re-Run

- Central bank rate decision outside consensus expectation
- Sovereign credit rating downgrade
- Political transition — election result, coup, or constitutional change
- Currency break > 5% in a single week
- Asset price decline > 15% in a single month
- Yield curve inversion or de-inversion
- Major geopolitical escalation (war declaration, sanctions package)

---

## Cross-Framework Integration Points

This framework shares two integration points with **Framework 2 (Geoeconomic Instrument Matrix)**:

| Signal Direction | Data Shared | Purpose |
|---|---|---|
| Framework 1 → Framework 2 | `scenario_type`, `empire_stage`, `mp_stage` | Provides macro context for instrument investment translation in Agent 5D |
| Framework 2 → Framework 1 | `utility_classification`, `escalation_probability` | Feeds Agent 4 jurisdiction risk overlay and WAR_ECONOMY loop detection |
| Joint | Both supervisors share flags | If Geo escalation_probability > 70% AND Big Cycle stage ≥ 4 → jointly activate WAR_ECONOMY flag |

---

## Coverage Gaps & Limitations

| Gap | Impact | Mitigation |
|---|---|---|
| Capital flow data lags 12–18 months (UNCTAD) | Agent 3 currency regime assessment may miss recent reversals | Supplement with IMF IFS monthly FX reserve data as proxy |
| No real-time FX implied volatility (Bloomberg required) | Capital flight risk scoring in Agent 3 is approximated | Use Yahoo Finance options chain as partial proxy |
| ICRG country risk ratings are proprietary | Agent 4 jurisdiction risk may undercount granular political risk | Combine World Bank WGI + Heritage Foundation as free proxy |
| Technology node data is annual, not real-time | Agent 1 tech score cannot detect fast-moving AI adoption shifts | Supplement with WIPO quarterly patent data when available |
