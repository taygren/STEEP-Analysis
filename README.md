# STEEP Analysis Platform

AI-powered strategic intelligence platform. Six coordinated agents analyse any company, trend, or technology across the five STEEP dimensions — Social, Technological, Economic, Environmental, Political — and produce a structured intelligence package spanning posture assessment, a 3D force map, a forecast roadmap, investment thesis, data visualisations, and a geoeconomic Big Cycle assessment.

Powered by [Groq](https://groq.com) cloud inference (Llama 3.3 70B by default) with optional [Cerebras](https://cerebras.ai) support and [Tavily](https://tavily.com) real-time web research. No local GPU required.

---

## What it produces

| Tab | Contents |
|---|---|
| **Overview** | Posture badge, executive summary, Intelligence Snapshot panel, per-dimension driver cards with impact / velocity / confidence scores, sentiment strip, macro indicator strip, cross-dimension insights, full evidence accordion |
| **Force Map (3D)** | Interactive Three.js globe with force-directed driver nodes — click any node to open a detail panel |
| **Roadmap** | Near / mid / long-term milestones with trigger points, confidence bars, risks & accelerants, and card / timeline view toggle |
| **Investment Thesis** | Live fundamentals (price, P/E, market cap, revenue) fetched from Yahoo Finance, plus an AI-generated bull/bear/catalyst thesis and SOTP valuation snapshot — only shown for public company tickers |
| **Data Viz** | STEEP radar chart, opportunities vs risks bar chart, driver impact distribution, per-dimension confidence bars, and market KPI cards — all rendered with Recharts |
| **Big Cycle** | Geoeconomic instrument scoring (impact, reversibility, timeline), strategic utility classification, US capacity assessments, and company-specific positioning and cycle-adaptation guidance |
| **Thought Leadership** | Always-accessible sidebar destination; lists published GEO intelligence briefs; admin mode (token in localStorage) unlocks a full CRUD editor |

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | `node --version` to check |
| npm 9+ | Bundled with Node 18 |
| Groq API key | Free at [console.groq.com](https://console.groq.com) — no credit card required |

Tavily and Cerebras keys are optional but recommended for richer results.

---

## Quick start

```bash
git clone https://github.com/your-org/steep-analysis-platform.git
cd steep-analysis-platform
npm install
```

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=gsk_your_key_here

# Optional — enables real-time web evidence
TAVILY_API_KEY=tvly_your_key_here

# Optional — unlocks additional fast models
CEREBRAS_API_KEY=your_cerebras_key_here
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:5000** in your browser.

---

## npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 5000 |
| `npm run build` | Production build |
| `npm run start` | Serve production build on port 5000 |
| `npm run lint` | ESLint check |

---

## Pre-run examples

Three fully-populated examples are available in the sidebar — no API keys needed to explore them:

| Example | Highlights |
|---|---|
| **Quantum Computing** | Technology sector — academic-to-commercial pipeline, error correction race, national security dimensions |
| **Apple (AAPL)** | Consumer tech — India manufacturing pivot, Vision Pro installed base, services margin story; full investment thesis |
| **Walmart (WMT)** | Retail — 145 % China tariff crisis ($8–10 B COGS exposure), Flipkart IPO catalyst, Walmart Connect advertising flywheel, SNAP benefit cut risk; full investment thesis, Snapshot, and Big Cycle |

---

## Models

The default model is **Llama 3.3 70B** on Groq's free tier. Switch at any time in the sidebar.

| Model | Provider | Context | Speed | Best for |
|---|---|---|---|---|
| `llama-3.3-70b-versatile` *(default)* | Groq | 128 k | Fast | Best analysis quality |
| `llama-3.1-8b-instant` | Groq | 128 k | Fastest | Quick tests, higher rate-limit headroom |
| `llama3-8b-8192` | Groq | 8 k | Fast | Solid baseline |
| `mixtral-8x7b-32768` | Groq | 32 k | Fast | Strong reasoning tasks |
| `gemma2-9b-it` | Groq | 8 k | Fast | Instruction-following |
| `llama-4-scout-17b-16e-instruct` | Groq | 128 k | Fast | Latest Llama 4 Scout |
| Cerebras models | Cerebras | varies | Very fast | Ultra-low latency |

> **Rate limits:** Groq's free tier allows 12,000 tokens/minute on Llama 3.3 70B. The platform automatically retries on 429 errors (up to 4 attempts with backoff) and inserts a short pause before the synthesis agent. If you hit limits frequently, switch to Llama 3.1 8B Instant, which has a higher per-minute quota.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes (or Cerebras) | — | Groq API key (`gsk_...`) |
| `CEREBRAS_API_KEY` | No | — | Cerebras Cloud API key — unlocks fast Cerebras models |
| `TAVILY_API_KEY` | No | — | Tavily search — enables real-time web evidence per dimension |
| `STEEP_DEFAULT_MODEL` | No | `llama-3.3-70b-versatile` | Override the default model selection |
| `KV_REST_API_URL` | No (prod) | — | Vercel KV endpoint — used to cache Intelligence Snapshots |
| `KV_REST_API_TOKEN` | No (prod) | — | Vercel KV token — required alongside `KV_REST_API_URL` |
| `ADMIN_PUBLISH_TOKEN` | No | — | Bearer token for Thought Leadership admin routes (`x-admin-token` header) |

In development and on Replit, KV falls back to an in-memory `Map` — no external store needed.

---

## How it works

```
Browser
  │
  ├─ GET  /api/health             ──► Groq + Cerebras connectivity probe
  ├─ GET  /api/models             ──► Curated model catalogue
  ├─ GET  /api/fundamentals?q=WMT ──► Yahoo Finance price / P/E / revenue
  ├─ GET  /api/sentiment          ──► Adanos sentiment signals
  ├─ GET  /api/macro              ──► Yahoo Finance + BLS macro indicators
  ├─ GET  /api/snapshot           ──► AI time-bound brief (KV-cached, TTL 6 h)
  ├─ POST /api/big-cycle          ──► Geoeconomic instrument assessment
  ├─ GET  /api/thought-leadership ──► Public list of published briefs
  ├─ *    /api/thought-leadership/admin  ──► CRUD (requires x-admin-token)
  │
  └─ POST /api/analyze            ──► Groq /openai/v1/chat/completions (SSE stream)
                                            │
                                    6 agents run sequentially:
                                    Social → Technological → Economic →
                                    Environmental → Political → Synthesis
```

Each agent call streams tokens back to the browser in real time via Server-Sent Events. Results appear dimension by dimension as they complete — no waiting for all six agents to finish.

**Token budget per agent:**
- Dimension agents: 1,200 tokens each
- Synthesis agent: 1,800 tokens (roadmap, posture, executive summary, cross-dimension insights)
- Big Cycle engine: 1,600 tokens

When Tavily is configured, each dimension agent also fires a parallel web search for fresh evidence before its LLM call.

---

## Project structure

```
steep-analysis-platform/
├── app/
│   ├── layout.jsx                    # Root Next.js layout
│   ├── page.jsx                      # Full UI — all tabs, agents, state machine
│   ├── globals.css                   # Tailwind base + custom animations
│   └── api/
│       ├── analyze/route.js          # POST — proxies to Groq/Cerebras (SSE stream)
│       ├── research/route.js         # POST — Tavily web search per dimension
│       ├── health/route.js           # GET  — Groq + Cerebras connectivity probe
│       ├── models/route.js           # GET  — curated model catalogue
│       ├── fundamentals/route.js     # GET  — Yahoo Finance fundamentals
│       ├── sentiment/route.js        # GET  — Adanos sentiment signals
│       ├── macro/route.js            # GET  — macro indicators (Yahoo + BLS)
│       ├── snapshot/route.js         # GET  — KV-cached AI intelligence snapshot
│       ├── big-cycle/route.js        # POST — Big Cycle geoeconomic engine
│       └── thought-leadership/
│           ├── route.js              # GET  — public list of briefs
│           └── admin/route.js        # GET/POST/PUT/DELETE — token-gated CRUD
├── lib/
│   ├── kv.js                         # Vercel KV wrapper (in-memory fallback for dev)
│   ├── bigCycle/engine.js            # Instrument attributes, scoring logic, LLM prompts
│   ├── quantumComputingExample.js    # Pre-run example — Quantum Computing
│   ├── appleExample.js               # Pre-run example — Apple (with thesis)
│   └── walmartExample.js             # Pre-run example — Walmart (tariff/Big Cycle)
├── scripts/
│   └── post-merge.sh                 # Runs npm install after branch merges
├── start-dev.sh                      # Replit startup script
├── vercel.json                       # Vercel function timeouts (60 s on analyze)
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## UI navigation

### Sidebar (always visible)
- **Subject input** and quick-pick dropdown (14 trends + 15 companies)
- **Model selector**
- **Run STEEP Analysis** button
- **Thought Leadership** — GEO intelligence briefs, always accessible
- **Examples** — Quantum Computing, Apple, Walmart (load instantly, no API calls)

### Top tab bar (unlocked after analysis)
Tabs appear progressively as agents complete. Investment Thesis only appears when the subject is a recognised public company ticker.

### Keyboard shortcuts
- `Enter` in the subject field starts an analysis

---

## Deploying to Vercel

The project ships with `vercel.json` that sets a 60-second timeout on the analyze route (needed for six sequential agent calls).

1. Push your repository to GitHub
2. Go to **vercel.com → New Project → Import Git Repository**
3. Add environment variables in **Settings → Environment Variables**:
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY` (optional)
   - `CEREBRAS_API_KEY` (optional)
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` (optional — from a Vercel KV store)
   - `ADMIN_PUBLISH_TOKEN` (optional — for Thought Leadership admin)
4. Deploy — Vercel picks up `vercel.json` automatically

> Set `GROQ_API_KEY` directly as a plain environment variable in the Vercel dashboard — do **not** use the `@groq_api_key` Secret syntax from the CLI.

---

## Troubleshooting

### "Groq — Not connected" in the sidebar
- Confirm `GROQ_API_KEY` is set in `.env.local` (key starts with `gsk_`)
- Restart the dev server after editing `.env.local`
- Check [console.groq.com](https://console.groq.com) to verify the key is active

### Analysis stops partway through or roadmap is empty
- The synthesis agent likely hit Groq's rate limit — the platform retries automatically, but wait a moment if it fails
- Switch to **Llama 3.1 8B Instant** for a higher per-minute token quota

### Analysis hangs or times out on Vercel
- The Hobby plan's 60-second function timeout matches `vercel.json`. If all six agents consistently time out, switch to a faster model or upgrade to a Vercel Pro plan for a longer timeout

### Investment Thesis tab does not appear
- The tab only renders for subjects recognised as public company tickers (e.g. `WMT`, `AAPL`, `NVDA`). Enter the ticker symbol in the subject field

### Intelligence Snapshot shows "unavailable"
- The snapshot route is working correctly — the AI call may have encountered a rate limit. It is cached once it succeeds (6-hour TTL in production with Vercel KV)

---

## Security

- `GROQ_API_KEY`, `CEREBRAS_API_KEY`, and `TAVILY_API_KEY` are server-side only — never exposed to the browser
- `cleanApiKey()` helper strips accidental `NAME=value` or quoted key formats before any API call
- Thought Leadership admin routes require an `x-admin-token` header matching `ADMIN_PUBLISH_TOKEN`; all write methods validate this header before any mutation

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| 3D visualisation | Three.js |
| Charts | Recharts (RadarChart, BarChart, custom) |
| AI inference | Groq cloud API + Cerebras (OpenAI-compatible SSE) |
| Web research | Tavily Search API |
| Key-value cache | Vercel KV (in-memory fallback for dev) |
| Deployment | Vercel |

---

## License

MIT
