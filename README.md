# STEEP Analysis Platform

AI-powered STEEP (Social, Technological, Economic, Environmental, Political) analysis tool that runs entirely on your local machine using [Ollama](https://ollama.ai) — no API keys, no cloud costs.

## What it does

Enter any company, trend, or technology topic and the platform spins up six parallel AI agents (one per STEEP dimension + a synthesis agent) to generate structured intelligence:

- **Executive Overview** — synthesised narrative with key drivers, opportunities, and risks
- **3D Force Map** — interactive Three.js visualisation of STEEP driver relationships
- **Forecast Roadmap** — timeline view of signals by short / medium / long-term horizon
- **Risk / Opportunity / Disruption Matrix** — impact × likelihood grid
- **Evidence Base** — full per-dimension agent output with collapsible detail

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 or later |
| npm | 9 or later |
| RAM | 8 GB minimum (16 GB recommended) |
| Disk | ~6 GB free (for model cache) |
| OS | macOS, Linux, or Windows 10/11 |

> **Ollama** is automatically installed by the setup script. You do **not** need to install it manually.

---

## Quick start

### macOS / Linux

```bash
git clone https://github.com/your-org/steep-platform.git
cd steep-platform
npm run setup          # installs Ollama, pulls model, installs deps
npm run dev            # start the app
```

Open **http://localhost:3000** in your browser.

### Windows (PowerShell)

```powershell
git clone https://github.com/your-org/steep-platform.git
cd steep-platform
npm run setup:win      # installs Ollama, pulls model, installs deps
npm run dev            # start the app
```

> **First-time setup** downloads the `llama3.1:8b` model (~5 GB). This is a one-time operation — the model is permanently cached in `~/.ollama/models`.

### Shortcut (after setup)

```bash
npm run go    # starts Ollama (if not running) + Next.js in one command
```

---

## Available npm scripts

| Command | Description |
|---|---|
| `npm run setup` | Full setup for macOS/Linux (Ollama + model + deps) |
| `npm run setup:win` | Full setup for Windows PowerShell |
| `npm run dev` | Start Next.js development server |
| `npm run go` | Start Ollama (if needed) + Next.js |
| `npm run build` | Production build |
| `npm run start` | Serve production build |

---

## Model selection

The default model is `llama3.1:8b`. You can switch models in the **Ollama** panel inside the app, or change the default by editing `.env.local`:

```env
STEEP_DEFAULT_MODEL=llama3.1:8b
```

### Model comparison

| Model | Size | Speed | Quality | Best for |
|---|---|---|---|---|
| `llama3.2:3b` | ~2 GB | ⚡⚡⚡ | ★★☆ | Low-RAM machines, quick tests |
| `llama3.1:8b` *(default)* | ~5 GB | ⚡⚡ | ★★★ | Balanced — recommended |
| `mistral:7b` | ~4 GB | ⚡⚡ | ★★★ | Strong reasoning |
| `qwen2.5:7b` | ~5 GB | ⚡⚡ | ★★★ | Strong instruction following |
| `phi4:14b` | ~9 GB | ⚡ | ★★★★ | Best quality, requires 16 GB RAM |

The app will prompt you to pull a model if it isn't already cached. Pulls are streamed in real time with a progress bar.

---

## Configuration

Copy `.env.example` to `.env.local` (done automatically by setup scripts):

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `STEEP_DEFAULT_MODEL` | `llama3.1:8b` | Model used for analysis |

---

## Project structure

```
steep-platform/
├── app/
│   ├── layout.jsx              # Root Next.js layout
│   ├── page.jsx                # Main STEEP UI (all tabs + agent logic)
│   ├── globals.css             # Tailwind base + custom animations
│   └── api/
│       ├── health/route.js     # GET  /api/health  — Ollama connectivity check
│       ├── models/route.js     # GET  /api/models  — list installed models
│       ├── pull/route.js       # POST /api/pull    — stream model pull progress
│       └── analyze/route.js   # POST /api/analyze — stream agent inference
├── scripts/
│   ├── setup.sh                # macOS/Linux setup
│   ├── setup.ps1               # Windows setup
│   └── start.sh                # macOS/Linux start (with Ollama check)
├── .env.example
├── vercel.json
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## Deploying to Vercel

> Vercel's serverless functions cannot run Ollama — you need a **publicly accessible Ollama instance** (your own server, a VPS, or a tunnel).

### Option A — Expose your local Ollama via Cloudflare Tunnel (free)

```bash
# On your machine, while Ollama is running:
cloudflared tunnel --url http://localhost:11434
# Copy the generated https://xyz.trycloudflare.com URL
```

### Option B — Run Ollama on a VPS (DigitalOcean, Hetzner, etc.)

```bash
# On your VPS:
curl -fsSL https://ollama.ai/install.sh | sh
OLLAMA_HOST=0.0.0.0 ollama serve &
ollama pull llama3.1:8b
```

### Deploy steps

1. Push the repo to GitHub
2. Import into Vercel: **vercel.com → New Project → Import Git Repository**
3. Add environment variables in Vercel dashboard:
   - `OLLAMA_BASE_URL` = your public Ollama URL (e.g. `https://your-vps.example.com:11434`)
   - `STEEP_DEFAULT_MODEL` = `llama3.1:8b`
4. Deploy — Vercel will pick up `vercel.json` which sets 60s timeout on the API routes

> **Hobby plan** allows 60s serverless function duration (enough for streaming).  
> **Pro plan** can be configured up to 300s for very long analyses.

### Securing your public Ollama instance

If exposing Ollama publicly, add a reverse proxy (Nginx/Caddy) with bearer token auth, or restrict by IP. Ollama has no built-in authentication.

---

## How it works

```
Browser
  │
  ├─ GET  /api/health    ──► Ollama /api/version
  ├─ GET  /api/models    ──► Ollama /api/tags
  ├─ POST /api/pull      ──► Ollama /api/pull  (NDJSON stream)
  └─ POST /api/analyze   ──► Ollama /api/chat  (NDJSON stream)
                                  │
                          llama3.1:8b (local GPU/CPU)
```

All Ollama calls are proxied through Next.js API routes — the browser never calls `localhost:11434` directly. This means the same codebase works locally and on Vercel (where `OLLAMA_BASE_URL` points to a remote instance).

Agents run **sequentially** (one per STEEP dimension, then synthesis) since a local GPU processes one LLM request at a time. Each agent's result is streamed to the UI as soon as it completes.

---

## Troubleshooting

### "Ollama not reachable" status indicator

- Run `ollama serve` in a terminal and reload the page
- Check that nothing else is using port 11434
- On Windows: check that the Ollama tray icon is running (system tray, bottom-right)

### Analysis returns empty or malformed results

- Try a smaller/simpler topic first to verify the model is working
- Switch to `llama3.2:3b` for faster, more reliable structured output on low-RAM machines
- Check the browser console for streaming errors

### Model pull stuck at 0%

- Check your internet connection
- Try pulling manually: `ollama pull llama3.1:8b`
- The model may already be partially cached — re-running the pull will resume

### Windows: execution policy error

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## License

MIT — see [LICENSE](LICENSE)
