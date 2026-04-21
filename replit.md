# STEEP Analysis Platform

AI-powered STEEP Analysis Platform using Groq cloud inference. Six coordinated agents (Social, Technological, Economic, Environmental, Political + synthesis) analyse any subject and return structured intelligence: Overview, 3D Force Map, and Forecast Roadmap.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **3D Visualization**: Three.js
- **AI Backend**: Groq cloud API (OpenAI-compatible SSE streaming)
- **Port**: 5000

## Project Structure

```
app/
  page.jsx          — Main UI (single-page, ~1600 lines)
  layout.jsx        — Root layout
  globals.css       — Global styles
  api/
    analyze/route.js  — Proxies to Groq with retry-on-ratelimit (SSE stream)
    research/route.js — Proxies to Tavily for fresh sources (last-6-month window)
    health/route.js   — Checks GROQ_API_KEY and Groq reachability
    models/route.js   — Returns curated Groq model catalog
    pull/route.js     — Returns 410 (not applicable for Groq)
scripts/            — Legacy setup scripts (not required for Groq workflow)
start-dev.sh        — Replit startup script (starts Ollama legacy + Next.js)
vercel.json         — Vercel function timeouts (60 s on analyze)
```

## How It Runs

The Replit workflow runs `bash start-dev.sh` which:
1. Starts Ollama in the background (legacy, unused — harmless)
2. Starts Next.js on port 5000

The AI backend is Groq, not Ollama. Ollama runs but is never called.

## Key Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GROQ_API_KEY` | One required | — | Groq API key (`gsk_...`) |
| `CEREBRAS_API_KEY` | One required | — | Cerebras Cloud API key — separate daily quota from Groq, often faster (~2,000 tok/sec). Either GROQ or CEREBRAS must be set; both work simultaneously and are selectable from the Provider dropdown. |
| `TAVILY_API_KEY` | No | — | Tavily search key (`tvly-...`) — when set, agents fetch fresh sources from the last 6 months and ground their evidence in real URLs. Without it, the system gracefully degrades to training-data evidence with staleness flags. |
| `STEEP_DEFAULT_MODEL` | No | `llama-3.3-70b-versatile` | Override default model |

## Providers & Models

The app supports multiple OpenAI-compatible providers. Each provider has its own daily quota — when one is exhausted, switch to the other from the Provider dropdown (or use the in-app one-click recovery banner).

**Groq** (`GROQ_API_KEY`)
| Model ID | Notes |
|---|---|
| `llama-3.3-70b-versatile` | Best quality on Groq · 100k tokens/day free |
| `llama-3.1-8b-instant`    | Fastest on Groq · separate daily quota from 70B |

**Cerebras** (`CEREBRAS_API_KEY`)
| Model ID | Notes |
|---|---|
| `llama-3.3-70b`                  | ~2,000 tok/sec · separate daily quota from Groq |
| `llama-4-scout-17b-16e-instruct` | Newest Llama 4, fast and capable |
| `llama3.1-8b`                    | Fastest, lowest token cost |

To add another provider, append an entry to `PROVIDERS` in `app/api/analyze/route.js` and `app/api/health/route.js`, plus an entry to `ALL_MODELS` in `app/api/models/route.js` and `CATALOG` in `app/page.jsx`. Any OpenAI-compatible chat-completions endpoint with SSE streaming and `response_format: { type: 'json_object' }` will work.

## Rate Limit Handling

- analyze/route.js retries per-minute (TPM) rate limits up to 6 times, parsing the retry delay from the provider's error message (handles `8m18.528s` / `1h2m3.4s` / `5.2s` formats).
- Per-day (TPD) caps and any wait > 90 seconds fail fast with `errorType: 'rate_limit_daily'` so the daily quota isn't burned on hopeless retries.
- The orchestrator aborts the run on the first daily-cap hit and surfaces an amber banner with a one-click "Switch to [other provider]" button (the alternate provider has a separate daily quota).
- Inter-agent pacing: 4 s between dimension agents, 10 s before synthesis, lets the per-minute token bucket refill on free tiers.
- Dimension agents: 1,500 max_tokens; synthesis agent: 2,200 max_tokens.

## UI Tabs

- **Overview**: Posture badge, executive summary, dimension driver cards, cross-dimension insights, evidence accordion
- **Force Map (3D)**: Three.js globe, node click opens detail side panel, auto-rotate toggle
- **Roadmap**: Near/mid/long-term milestones, trigger points, risks & accelerants, Card/Timeline toggle

## Security Notes

- Next.js 14.2.x
- GROQ_API_KEY is server-side only — never exposed to the browser
- cleanApiKey() helper in analyze/route.js and health/route.js strips accidental `NAME=value` or quoted formats
