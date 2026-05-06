# STEEP Analysis Platform

AI-powered STEEP Analysis Platform using Groq/Cerebras cloud inference with Tavily research. Six coordinated agents analyse any subject and return structured intelligence across five tabs, plus geoeconomic Big Cycle assessment, a Thought Leadership publishing system, and an Innovator Illumination company spotlight directory.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **3D Visualization**: Three.js
- **Charts**: Recharts (RadarChart, BarChart)
- **AI Backend**: Groq cloud API + Cerebras (OpenAI-compatible SSE streaming)
- **Key-Value Store**: Vercel KV (file-backed JSON fallback for dev/Replit — `.steep-data/kv.json`)
- **Port**: 5000

## Project Structure

```
app/
  page.jsx              — Main UI (single-page, ~3800 lines), 'use client'
  layout.jsx            — Root layout
  globals.css           — Global styles
  api/
    analyze/route.js      — Proxies to Groq with retry-on-ratelimit (SSE stream)
    research/route.js     — Proxies to Tavily for fresh sources (last-6-month window)
    health/route.js       — Probes Groq + Cerebras in parallel
    models/route.js       — Returns curated model catalog
    fundamentals/route.js — Yahoo Finance fundamentals for public companies
    sentiment/route.js    — Adanos sentiment signals
    macro/route.js        — Yahoo Finance + BLS macro indicators
    snapshot/route.js     — AI time-bound intelligence snapshot (cached in KV)
    big-cycle/route.js    — Big Cycle Decision Engine geoeconomic assessment
    thought-leadership/
      route.js            — Public list of published thought leadership posts (incl. heroImageUrl)
      admin/route.js      — Admin CRUD (requires x-admin-token header); schema incl. heroImageUrl
      [id]/route.js       — Single published post fetch (full contentMarkdown for article view)
    innovator-illumination/
      route.js            — Public list of published innovator profiles
      admin/route.js      — Admin CRUD; schema adds logoUrl, techSegment, solutionOverview
      [id]/route.js       — Single innovator fetch
    upload-image/route.js — Image upload (admin token required); saves to public/uploads/
lib/
  kv.js                 — Vercel KV wrapper; dev fallback uses file-backed JSON (.steep-data/kv.json) shared via globalThis to avoid Next.js module-isolation issues
  bigCycle/engine.js    — Instrument attributes, capacity definitions, scoring logic, LLM prompts
  quantumComputingExample.js — Pre-run example
  appleExample.js       — Pre-run Apple example (with full fundamentals + thesis)
  walmartExample.js     — Pre-run Walmart example (tariff/Big Cycle/Snapshot)
scripts/
  post-merge.sh         — Post-merge setup (npm install)
start-dev.sh            — Replit startup script (starts Ollama legacy + Next.js)
vercel.json             — Vercel function timeouts
```

## UI Navigation

### Top Tab Bar (core + gated)
- **Overview**: Posture badge, executive summary, Intelligence Snapshot panel, STEEP dimension cards, evidence accordion, cross-dimension insights, sentiment/macro strips
- **Force Map (3D)**: Three.js globe, node click opens detail side panel
- **Roadmap**: Near/mid/long-term milestones, triggers, risks & accelerants
- **Investment Thesis** *(requires public company ticker)*: Fundamentals, AI-generated thesis, valuation snapshot
- **Data Viz** *(unlocked after analysis)*: STEEP radar chart, opportunities vs risks bar chart, driver impact distribution, confidence bars, market KPI cards
- **Big Cycle** *(unlocked after analysis)*: Geoeconomic instrument scoring, strategic utility classification, US capacity assessments, company positioning

### Sidebar-Only Destinations (Intelligence section)
- **Thought Leadership**: Always accessible; lists published GEO intelligence briefs; admin mode (in-memory token) unlocks full CRUD editor
- **Innovator Illumination**: Always accessible; logo-card grid of technology solution providers; admin mode unlocks Add Innovator modal (2-step: auth → form with logoUrl, techSegment, solutionOverview, content, geo tags, hero image); KV namespace `innovatorillumination:*`

### Sidebar Tools section
- **STEEP Analysis**: Shortcut back to the home/idle landing screen
- **RASCEF Generator**: AI prompt architect

## How It Runs

The Replit workflow runs `bash start-dev.sh` which:
1. Starts Ollama in the background (legacy, unused — harmless)
2. Starts Next.js on port 5000

The AI backend is Groq (primary) or Cerebras, not Ollama.

## Key Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GROQ_API_KEY` | Yes (or Cerebras) | — | Groq API key (`gsk_...`) |
| `CEREBRAS_API_KEY` | No | — | Cerebras Cloud API key — unlocks additional models |
| `TAVILY_API_KEY` | No | — | Tavily search — enables fresh web evidence |
| `STEEP_DEFAULT_MODEL` | No | `llama-3.3-70b-versatile` | Override default model |
| `KV_REST_API_URL` | No (prod) | — | Vercel KV endpoint — snapshot caching |
| `KV_REST_API_TOKEN` | No (prod) | — | Vercel KV token — snapshot caching |
| `ADMIN_PUBLISH_TOKEN` | No | — | Thought Leadership admin token (x-admin-token header) |

## Rate Limit Handling

Groq free tier: 12,000 TPM on Llama 3.3 70B.
- `analyze/route.js` retries on 429 up to 4 times, parsing retry delay from Groq's error message
- 3-second pause before synthesis agent call
- Dimension agents: 1,200 max_tokens; synthesis agent: 1,800 max_tokens

## Security Notes

- Next.js 14.2.x
- GROQ_API_KEY / CEREBRAS_API_KEY are server-side only — never exposed to the browser
- `cleanApiKey()` helper strips accidental `NAME=value` or quoted formats
- Admin routes protected by `ADMIN_PUBLISH_TOKEN` env var; all admin methods check header
