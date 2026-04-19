# STEEP Analysis Platform

AI-powered STEEP (Social, Technological, Economic, Environmental, Political) analysis tool that runs entirely on your local machine using [Ollama](https://ollama.ai) — no API keys, no cloud costs, no data leaving your machine.

---

## What it does

Enter any company, trend, or technology topic and the platform runs six sequential AI agents (one per STEEP dimension + a synthesis agent) to generate structured intelligence:

- **Overview** — posture badge, executive summary, per-dimension driver cards, cross-dimension insights, and a full per-dimension evidence accordion (drivers, signals, forecasts, opportunities, risks)
- **3D Force Map** — interactive Three.js globe visualising driver relationships; click any node for a detail panel
- **Forecast Roadmap** — near / mid / long-term milestones, each with a trigger point (⚡), risk bullets, and accelerant bullets; toggle between Card and Timeline views

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | `node --version` to check |
| npm 9+ | bundled with Node 18 |
| RAM | 8 GB minimum, 16 GB recommended |
| Disk | ~2 GB free for the default model cache |
| OS | macOS, Linux, or Windows 10/11 |

> **Ollama** is automatically installed by the setup script. You do not need to install it manually.

---

## Quick start

### macOS / Linux

```bash
git clone https://github.com/your-org/steep-platform.git
cd steep-platform
npm run setup          # installs Ollama, pulls llama3.2:3b, installs npm deps
npm run go             # starts Ollama (if not running) + Next.js
```

Open **http://localhost:5000** in your browser.

### Windows (PowerShell)

```powershell
git clone https://github.com/your-org/steep-platform.git
cd steep-platform
npm run setup:win      # installs Ollama, pulls model, installs deps
npm run go             # starts Ollama + Next.js
```

### Shortcut after first setup

```bash
npm run go    # starts Ollama (if not already running) + Next.js on port 5000
```

---

## npm scripts

| Command | Description |
|---|---|
| `npm run setup` | First-time setup — macOS/Linux (Ollama + model pull + npm install) |
| `npm run setup:win` | First-time setup — Windows PowerShell |
| `npm run go` | Start Ollama (if needed) + Next.js dev server |
| `npm run dev` | Next.js dev server only (assumes Ollama already running) |
| `npm run dev:ollama` | Same as `go` — starts Ollama then Next.js via `start-dev.sh` |
| `npm run build` | Production build |
| `npm run start` | Serve production build on port 5000 |

---

## Default model

The default model is `llama3.2:3b` (~2 GB, CPU-friendly). You can switch models in the **Ollama** panel inside the app at any time.

### Model comparison

| Model | Size | Speed | Quality | Best for |
|---|---|---|---|---|
| `llama3.2:3b` *(default)* | ~2 GB | ⚡⚡⚡ | ★★☆ | Low-RAM machines, quick tests |
| `llama3.1:8b` | ~5 GB | ⚡⚡ | ★★★ | Balanced — recommended if RAM allows |
| `mistral:7b` | ~4 GB | ⚡⚡ | ★★★ | Strong reasoning |
| `qwen2.5:7b` | ~5 GB | ⚡⚡ | ★★★ | Strong instruction following |
| `phi4:14b` | ~9 GB | ⚡ | ★★★★ | Best quality, requires 16 GB RAM |

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `STEEP_DEFAULT_MODEL` | `llama3.2:3b` | Model used for analysis |

Create a `.env.local` file in the project root to override defaults:

```env
OLLAMA_BASE_URL=http://localhost:11434
STEEP_DEFAULT_MODEL=llama3.2:3b
```

---

## Project structure

```
steep-platform/
├── app/
│   ├── layout.jsx              # Root Next.js layout
│   ├── page.jsx                # Full UI — tabs, agents, state, all components
│   ├── globals.css             # Tailwind base + custom animations
│   └── api/
│       ├── health/route.js     # GET  /api/health  — Ollama connectivity check
│       ├── models/route.js     # GET  /api/models  — list installed models
│       ├── pull/route.js       # POST /api/pull    — stream model pull progress
│       └── analyze/route.js   # POST /api/analyze — run agents (NDJSON stream)
├── scripts/
│   ├── setup.sh                # macOS/Linux first-time setup
│   ├── setup.ps1               # Windows first-time setup
│   └── start.sh                # macOS/Linux start (Ollama check + Next.js)
├── start-dev.sh                # Replit / direct start script
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── package-lock.json
```

---

## How it works

```
Browser
  │
  ├─ GET  /api/health    ──► Ollama /api/version
  ├─ GET  /api/models    ──► Ollama /api/tags
  ├─ POST /api/pull      ──► Ollama /api/pull  (NDJSON stream)
  └─ POST /api/analyze   ──► Ollama /api/chat  (NDJSON stream, 6 agents)
                                  │
                          llama3.2:3b (local CPU/GPU)
```

All Ollama calls are proxied through Next.js API routes — the browser never calls `localhost:11434` directly.

Agents run **sequentially** (5 dimension agents then 1 synthesis agent) because a local CPU/GPU processes one LLM request at a time. Each agent result streams to the UI as soon as it finishes, so you see progress in real time.

**Token budgets per agent:**
- Dimension agents (Social / Technological / Economic / Environmental / Political): 1500 tokens each
- Synthesis agent: 2500 tokens (roadmap, posture, executive summary, cross-dimension insights)

---

## Troubleshooting

### "Ollama not reachable" in the status bar

- Run `ollama serve` in a terminal and reload the page
- Confirm nothing else is using port 11434: `lsof -i :11434`
- Windows: check the Ollama tray icon (system tray, bottom-right)

### Analysis completes but roadmap is empty

- Switch to `llama3.2:3b` — it fits within the 2500-token synthesis budget more reliably than larger models on CPU
- Try a shorter, more specific subject (e.g. "electric vehicles" instead of "the future of mobility")

### Model pull stuck at 0%

- Check your internet connection
- Pull manually: `ollama pull llama3.2:3b`
- Partial downloads resume automatically on retry

### Windows: execution policy error

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Deploying to Vercel

> Vercel serverless functions cannot run Ollama locally. You need a **publicly accessible Ollama instance**.

### Option A — Expose local Ollama via Cloudflare Tunnel (free)

```bash
cloudflared tunnel --url http://localhost:11434
# Copy the generated https://xyz.trycloudflare.com URL
```

### Option B — Run Ollama on a VPS

```bash
curl -fsSL https://ollama.ai/install.sh | sh
OLLAMA_HOST=0.0.0.0 ollama serve &
ollama pull llama3.2:3b
```

### Deploy steps

1. Push to GitHub
2. Import into Vercel: **vercel.com → New Project → Import Git Repository**
3. Set environment variables in Vercel dashboard:
   - `OLLAMA_BASE_URL` = your public Ollama URL
   - `STEEP_DEFAULT_MODEL` = `llama3.2:3b`
4. Deploy — `vercel.json` sets a 60 s timeout on API routes

---

## License

MIT
