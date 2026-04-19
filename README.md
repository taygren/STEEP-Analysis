# STEEP Analysis Platform

AI-powered strategic intelligence tool that runs six coordinated agents — one per STEEP dimension (Social, Technological, Economic, Environmental, Political) plus a synthesis agent — against any company, trend, or technology topic. Powered by [Groq](https://groq.com) cloud inference. No local GPU required.

---

## What it produces

| Output | Description |
|---|---|
| **Overview** | Posture badge, executive summary, per-dimension driver cards, cross-dimension insights, and a full evidence accordion with drivers, signals, forecasts, opportunities, and risks |
| **3D Force Map** | Interactive Three.js globe visualising driver relationships — click any node to open a detail panel |
| **Forecast Roadmap** | Near / mid / long-term milestones, each with a trigger point, confidence rating, and expandable risks & accelerants section; toggle between Card and Timeline views |

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | `node --version` to check |
| npm 9+ | Bundled with Node 18 |
| Groq API key | Free at [console.groq.com](https://console.groq.com) — no credit card required |

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
```

Then start the dev server:

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

## Models

The default model is **Llama 3.3 70B** — the highest quality model available on Groq's free tier. Switch models at any time using the selector in the sidebar.

| Model | Context | Speed | Best for |
|---|---|---|---|
| `llama-3.3-70b-versatile` *(default)* | 128k | Fast | Best analysis quality |
| `llama-3.1-8b-instant` | 128k | Fastest | Quick tests, higher rate-limit headroom |
| `llama3-8b-8192` | 8k | Fast | Solid baseline |
| `mixtral-8x7b-32768` | 32k | Fast | Strong reasoning tasks |
| `gemma2-9b-it` | 8k | Fast | Instruction-following |

> **Rate limits:** Groq's free tier allows 12,000 tokens/minute on Llama 3.3 70B. The platform automatically retries on rate-limit errors (up to 4 attempts with backoff), and inserts a short pause before the synthesis agent to stay within the budget. If you run analyses frequently, switch to Llama 3.1 8B Instant which has a higher per-minute quota.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Your Groq API key (`gsk_...`) |
| `STEEP_DEFAULT_MODEL` | No | `llama-3.3-70b-versatile` | Override the default model |

---

## Project structure

```
steep-analysis-platform/
├── app/
│   ├── layout.jsx              # Root Next.js layout
│   ├── page.jsx                # Full UI — tabs, agents, state, all components
│   ├── globals.css             # Tailwind base + custom animations
│   └── api/
│       ├── health/route.js     # GET  /api/health  — Groq connectivity check
│       ├── models/route.js     # GET  /api/models  — curated model catalog
│       ├── pull/route.js       # POST /api/pull    — returns 410 (not applicable)
│       └── analyze/route.js    # POST /api/analyze — proxies to Groq with retry
├── scripts/                    # Legacy setup scripts (not required)
├── start-dev.sh                # Replit startup script
├── vercel.json                 # Vercel function timeouts (60 s on analyze)
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## How it works

```
Browser
  │
  ├─ GET  /api/health    ──► Groq API key check
  ├─ GET  /api/models    ──► Curated model list
  └─ POST /api/analyze   ──► Groq /openai/v1/chat/completions  (SSE stream)
                                  │
                          6 agents run sequentially:
                          Social → Technological → Economic →
                          Environmental → Political → Synthesis
```

Each agent call streams tokens back to the browser in real time via Server-Sent Events. Results appear dimension by dimension as they complete, so you see progress immediately rather than waiting for all six agents to finish.

**Token budget per agent:**
- Dimension agents: 1,200 tokens output each
- Synthesis agent: 1,800 tokens output (roadmap, posture, executive summary, cross-dimension insights)

---

## UI features

### Sidebar
- **Quick-pick dropdown** — 14 curated trends and 15 companies pre-loaded; selecting one fills the subject field instantly
- Free-text input accepts any subject

### Overview tab
- Subject header with overall posture badge (Opportunistic / Cautious / Defensive / Transformative)
- Executive summary paragraph
- Per-dimension driver cards with impact / velocity / confidence scores
- Cross-dimension insights section
- Expandable Evidence accordion at the bottom — drivers, signals, forecasts, opportunities, and risks per dimension

### 3D Force Map tab
- Interactive Three.js globe with force-directed driver nodes
- Click any node to open a side panel with full details: dimension, direction, impact/velocity chips, confidence bar, description, and evidence bullets
- Auto-Rotate toggle pauses and resumes ambient globe spin

### Forecast Roadmap tab
- Near-term / Mid-term / Long-term horizon sections
- Each milestone shows a trigger point (⚡), confidence bar, and an expandable Risks & Accelerants section
- Cross-dimension context callout per horizon
- Toggle between Card grid and vertical Timeline views

---

## Deploying to Vercel

The project ships with a `vercel.json` that sets a 60-second timeout on the analyze route (needed for six sequential agent calls).

1. Push your repository to GitHub
2. Go to **vercel.com → New Project → Import Git Repository**
3. Add environment variables in the Vercel dashboard under **Settings → Environment Variables**:
   - `GROQ_API_KEY` = your Groq key
   - `STEEP_DEFAULT_MODEL` = `llama-3.3-70b-versatile` (optional)
4. Deploy — Vercel will pick up `vercel.json` automatically

> Do **not** add `GROQ_API_KEY` as a Vercel Secret via CLI (`@groq_api_key` syntax). Set it directly as a plain environment variable in the dashboard.

---

## Troubleshooting

### "Groq — Not connected" in the sidebar

- Confirm `GROQ_API_KEY` is set correctly in `.env.local` (key starts with `gsk_`)
- Restart the dev server after editing `.env.local`
- Check [console.groq.com](https://console.groq.com) to verify the key is active

### Overview or Roadmap does not populate after analysis

- The synthesis agent likely hit Groq's rate limit. The platform retries automatically — wait a moment and try again, or switch to **Llama 3.1 8B Instant** which has a higher TPM quota on the free tier.
- Try a shorter, more specific subject (e.g. "autonomous vehicles" instead of "the future of transportation")

### Analysis hangs or times out on Vercel

- Vercel's Hobby plan has a 60-second function timeout, which matches `vercel.json`. If all six agents consistently time out, upgrade to a Pro plan or reduce the number of retries by switching to a faster model.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| 3D visualization | Three.js |
| AI inference | Groq cloud API (OpenAI-compatible SSE) |
| Deployment | Vercel |

---

## License

MIT
