# STINT Studio

Applied Strategy & Intelligence — a personal portfolio and practitioner toolkit by Taylor Grenawalt. AI-powered STEEP Analysis, RASCEF Generator, Thought Leadership briefs, Innovator Illumination directory, and an About/Studio Updates panel. Uses Groq/Cerebras cloud inference with Tavily research.

## Run & Operate
- **Start**: `bash start-dev.sh` (port 5000)
- **Workflow**: "Start application" → `bash start-dev.sh`
- **Required env**: `GROQ_API_KEY` (primary LLM), `ADMIN_PUBLISH_TOKEN` (admin CRUD for TL, II, Studio Updates)
- **Optional env**: `CEREBRAS_API_KEY`, `TAVILY_API_KEY`, `STEEP_DEFAULT_MODEL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`

## Stack
- **Framework**: Next.js 14 (App Router), `app/` directory
- **Styling**: Tailwind CSS
- **3D**: Three.js
- **Charts**: Recharts (RadarChart, BarChart)
- **AI**: Groq cloud API + Cerebras (OpenAI-compatible SSE streaming)
- **KV Store**: Vercel KV (prod) / file-backed JSON fallback (`.steep-data/kv.json`) via `lib/kv.js`

## Where things live
```
app/
  page.jsx                  — Main SPA (~6600 lines), 'use client'; all STEEP logic
  layout.jsx                — Root layout + metadata (STINT Studio branding)
  components/
    AboutPanel.jsx          — About/bio/Studio Updates panel (standalone 'use client')
    StandaloneMarkdown.jsx  — Markdown renderer for standalone post/profile pages
  api/
    analyze/route.js        — Groq SSE proxy, retry-on-ratelimit
    research/route.js       — Tavily search proxy
    health/route.js         — Groq + Cerebras health probes
    models/route.js         — Model catalog
    fundamentals/route.js   — Yahoo Finance fundamentals
    sentiment/route.js      — Adanos sentiment signals
    macro/route.js          — Macro indicators
    snapshot/route.js       — AI time-bound intelligence snapshot (KV cached)
    big-cycle/route.js      — Big Cycle geoeconomic engine
    prediction-markets/route.js
    thought-leadership/route.js + admin/route.js + [id]/route.js
    innovator-illumination/route.js + admin/route.js + [id]/route.js
    studio-updates/route.js + admin/route.js + [id]/route.js
    upload-image/route.js
  thought-leadership/[id]/  — Standalone shareable TL post page
  innovator-illumination/[id]/ — Standalone shareable innovator profile page
lib/
  kv.js                     — KV abstraction (Vercel KV or file-backed)
  bigCycle/engine.js        — Big Cycle scoring + LLM prompts
  quantumComputingExample.js / appleExample.js / walmartExample.js
scripts/post-merge.sh
start-dev.sh
```

## Architecture decisions
- **Single-file SPA**: `app/page.jsx` is intentionally monolithic — all STEEP analysis state, reducers, agents, and tab components live together to avoid prop-drilling across a complex multi-agent state machine.
- **KV fallback**: `lib/kv.js` uses `globalThis` to share one file-backed store across all Next.js API routes (which compile as isolated modules), avoiding per-route empty Maps.
- **SSE streaming**: All LLM calls stream via `analyze/route.js` so the UI can show per-agent progress in real time.
- **Admin auth**: A single `ADMIN_PUBLISH_TOKEN` env var gates all three admin endpoints (TL, II, Studio Updates) via `x-admin-token` header; the token is in-memory only (no localStorage).
- **Standalone pages**: TL and II posts have standalone Next.js pages at `/thought-leadership/[id]` and `/innovator-illumination/[id]` with full OG metadata for social sharing.

## Product
- **Landing page**: Portfolio homepage with Toolkit / Insights / Studio sections
- **Sidebar sections**: Toolkit (STEEP, RASCEF), Insights (Thought Leadership, Innovator Illumination), Studio (About)
- **STEEP Analysis**: 6-agent analysis → Overview, Force Map (3D), Roadmap, Investment Thesis, Data Viz, Big Cycle, Prediction Markets tabs
- **Thought Leadership**: Published intelligence briefs with admin CRUD; KV namespace `thoughtleadership:*`
- **Innovator Illumination**: Company spotlight directory with admin CRUD; KV namespace `innovatorillumination:*`
- **Studio Updates**: Admin-managed changelog/updates feed; KV namespace `studioupdates:*`
- **About panel**: Studio mission, Taylor Grenawalt bio, Studio Updates feed; `app/components/AboutPanel.jsx`

## User preferences
- Brand name: **STINT Studio** / "Applied Strategy & Intelligence"
- No "powerful", "easy", "cutting-edge", "amazing", or demo/marketing language
- Taylor Grenawalt bio text is verbatim — do not paraphrase or shorten

## Gotchas
- Rate limit: Groq free tier 12k TPM on Llama 3.3 70B; `analyze/route.js` retries on 429 up to 4×
- Dimension agents: 1,200 max_tokens; synthesis: 1,800 max_tokens; 3s pause before synthesis
- `cleanApiKey()` in route files strips accidental `NAME=value` or quoted key formats
- Print CSS uses `.print-hide` / `.print-article` classes defined in `globals.css`

## Pointers
- KV schema: see `lib/kv.js` and the three `admin/route.js` files for field definitions
- Big Cycle logic: `lib/bigCycle/engine.js`
- Standalone page OG metadata: `app/thought-leadership/[id]/page.jsx`, `app/innovator-illumination/[id]/page.jsx`
