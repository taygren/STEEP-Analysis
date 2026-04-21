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
| `GROQ_API_KEY` | Yes | — | Groq API key (`gsk_...`) |
| `TAVILY_API_KEY` | No | — | Tavily search key (`tvly-...`) — when set, agents fetch fresh sources from the last 6 months and ground their evidence in real URLs. Without it, the system gracefully degrades to training-data evidence with staleness flags. |
| `STEEP_DEFAULT_MODEL` | No | `llama-3.3-70b-versatile` | Override default model |

## Models (Groq)

| Model ID | Label | Notes |
|---|---|---|
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Default — best quality |
| `llama-3.1-8b-instant` | Llama 3.1 8B Instant | Fastest, higher rate-limit headroom |
| `llama3-8b-8192` | Llama 3 8B | Solid baseline, 8k context |
| `mixtral-8x7b-32768` | Mixtral 8×7B | Strong reasoning, 32k context |
| `gemma2-9b-it` | Gemma 2 9B | Good instruction following |

## Rate Limit Handling

Groq free tier: 12,000 TPM on Llama 3.3 70B.
- analyze/route.js retries on 429 up to 4 times, parsing retry delay from Groq's error message
- 3-second pause inserted before synthesis agent call
- Dimension agents: 1,200 max_tokens; synthesis agent: 1,800 max_tokens

## UI Tabs

- **Overview**: Posture badge, executive summary, dimension driver cards, cross-dimension insights, evidence accordion
- **Force Map (3D)**: Three.js globe, node click opens detail side panel, auto-rotate toggle
- **Roadmap**: Near/mid/long-term milestones, trigger points, risks & accelerants, Card/Timeline toggle

## Security Notes

- Next.js 14.2.x
- GROQ_API_KEY is server-side only — never exposed to the browser
- cleanApiKey() helper in analyze/route.js and health/route.js strips accidental `NAME=value` or quoted formats
