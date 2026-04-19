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
  page.jsx          — Main UI (single-page app, ~1550 lines)
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

## Security Notes

- Next.js 14.2.35 (upgraded from vulnerable 14.2.5)
- CORS headers on `/api/*` allow all origins (intentional for local Ollama access)
- No external API keys or credentials needed
- All inference runs locally via Ollama
