# STEEP Analysis Platform

AI-powered STEEP Analysis Platform using Ollama for local LLM inference. No API key or cloud costs required.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **3D Visualization**: Three.js
- **AI Backend**: Ollama (local LLM inference, CPU mode)
- **Port**: 5000

## Project Structure

```
app/
  page.jsx          — Main UI (single-page app, ~1960 lines)
  layout.jsx        — Root layout
  globals.css       — Global styles
  api/
    analyze/route.js  — Proxies chat completions to Ollama (streaming NDJSON)
    health/route.js   — Health check: confirms Ollama is reachable
    models/route.js   — Lists available Ollama models
    pull/route.js     — Triggers model pulls
scripts/
  setup.sh / setup.ps1 / start.sh  — Legacy Vercel-era scripts (not used)
start-dev.sh        — Startup script: launches Ollama, pulls default model, starts Next.js
```

## How It Runs

The workflow runs `bash start-dev.sh` which:
1. Starts `ollama serve` in the background on port 11434
2. Waits up to 60 seconds for Ollama to be ready
3. Pulls the default model (`llama3.2:3b`, ~2 GB) if not already cached
4. Runs `npm install && npm run dev` to start Next.js on port 5000

On subsequent starts the model pull is skipped (already cached in `~/.ollama/models`).

## Key Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `STEEP_DEFAULT_MODEL` | `llama3.2:3b` | Model pulled/used on startup |

## Models

Models are stored in `~/.ollama/models`. Catalog (from the UI):
- `llama3.2:3b` — ~2 GB, default (CPU-friendly)
- `llama3.1:8b` — ~5 GB, best quality
- `mistral:7b` — ~4 GB, fast reasoning
- `qwen2.5:7b` — ~5 GB, excellent JSON
- `phi4:14b` — ~9 GB, highest quality (needs 16 GB VRAM)

## UI Features

### Sidebar
- **Quick-pick dropdown** — 14 curated trends + 15 companies pre-loaded; selecting one fills the subject input instantly.
- Free-text input still accepts any subject.

### ForceMap Tab (3D)
- **Side panel** slides in when a node is clicked, showing: dimension chip, direction badge, impact/velocity chips, confidence bar, full description, and all evidence bullets.
- **Auto-Rotate toggle** button pauses/resumes the ambient globe spin.

### Roadmap Tab
- **Cards / Timeline toggle** — Cards shows a responsive grid; Timeline renders a vertical connected thread.
- Each horizon shows a **Cross-Dimension Context** callout pulled from `cross_dimension_insights`.
- Milestone cards have expandable detail sections and confidence progress bars.

### Matrix Tab (Risk/Opportunity/Disruption)
- Selected item detail panel shows: full score bars (Impact, Likelihood, Composite), confidence bar, reversibility + time-sensitivity badges.
- **Strategic Context** section surfaces related `cross_dimension_insights` matching the item's dimension.
- **Related Drivers** section pulls dimension-specific agent driver evidence.

## Security Notes

- Next.js 14.2.35 (upgraded from vulnerable 14.2.5)
- CORS headers on `/api/*` allow all origins (intentional for local Ollama access)
- No external API keys or credentials needed
- All inference runs locally via Ollama
