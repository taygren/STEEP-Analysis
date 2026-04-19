#!/usr/bin/env bash
# =============================================================================
# STEEP Analysis Platform — Setup Script (Linux / macOS)
# =============================================================================
# Usage: npm run setup   (or bash scripts/setup.sh directly)
# What it does:
#   1. Installs Ollama if not already installed
#   2. Starts ollama serve (background) if not already running
#   3. Pulls the default model (llama3.1:8b)
#   4. Installs Node dependencies
#   5. Copies .env.example -> .env.local (if not present)
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[STEEP]${RESET} $*"; }
success() { echo -e "${GREEN}[STEEP]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[STEEP]${RESET} $*"; }
error()   { echo -e "${RED}[STEEP] ERROR:${RESET} $*" >&2; exit 1; }

DEFAULT_MODEL="${STEEP_DEFAULT_MODEL:-llama3.1:8b}"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║    STEEP Analysis Platform — Setup           ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""

# ── Step 1: Check / Install Ollama ────────────────────────────────────────────
info "Checking for Ollama..."

if command -v ollama &>/dev/null; then
  OLLAMA_VERSION=$(ollama --version 2>/dev/null | awk '{print $NF}' || echo "unknown")
  success "Ollama already installed (version: ${OLLAMA_VERSION})"
else
  info "Ollama not found. Installing via official install script..."
  if ! curl -fsSL https://ollama.ai/install.sh | sh; then
    error "Failed to install Ollama. Visit https://ollama.ai for manual install instructions."
  fi
  success "Ollama installed successfully"
fi

# ── Step 2: Start ollama serve ────────────────────────────────────────────────
info "Checking if Ollama server is running..."

if curl -sf http://localhost:11434/api/version &>/dev/null; then
  success "Ollama server is already running"
else
  info "Starting Ollama server in the background..."
  # Start as a background process; logs go to /tmp/ollama.log
  nohup ollama serve > /tmp/ollama-steep.log 2>&1 &
  OLLAMA_PID=$!
  echo $OLLAMA_PID > /tmp/ollama-steep.pid
  info "Waiting for Ollama server to be ready (pid: ${OLLAMA_PID})..."

  # Poll for up to 30 seconds
  for i in $(seq 1 30); do
    if curl -sf http://localhost:11434/api/version &>/dev/null; then
      success "Ollama server is ready"
      break
    fi
    if [ $i -eq 30 ]; then
      error "Ollama server did not start within 30 seconds. Check /tmp/ollama-steep.log"
    fi
    sleep 1
  done
fi

# ── Step 3: Pull the default model ────────────────────────────────────────────
info "Checking if model '${DEFAULT_MODEL}' is available locally..."

INSTALLED=$(ollama list 2>/dev/null | awk 'NR>1 {print $1}' || true)

if echo "${INSTALLED}" | grep -q "^${DEFAULT_MODEL}$"; then
  success "Model '${DEFAULT_MODEL}' is already cached — no download needed"
else
  warn "Model '${DEFAULT_MODEL}' not found locally. Pulling now..."
  warn "This is a one-time download (~5 GB for llama3.1:8b). Grab a coffee ☕"
  echo ""
  if ! ollama pull "${DEFAULT_MODEL}"; then
    error "Failed to pull model '${DEFAULT_MODEL}'. Check your internet connection."
  fi
  echo ""
  success "Model '${DEFAULT_MODEL}' is ready"
fi

# ── Step 4: Install Node dependencies ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${PROJECT_DIR}"
info "Installing Node.js dependencies..."

if [ ! -f "package.json" ]; then
  error "package.json not found in ${PROJECT_DIR}. Are you in the right directory?"
fi

npm install
success "Node dependencies installed"

# ── Step 5: Create .env.local ─────────────────────────────────────────────────
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    success "Created .env.local from .env.example"
  else
    warn ".env.example not found — creating minimal .env.local"
    cat > .env.local <<EOF
OLLAMA_BASE_URL=http://localhost:11434
STEEP_DEFAULT_MODEL=${DEFAULT_MODEL}
EOF
    success "Created .env.local"
  fi
else
  info ".env.local already exists — skipping"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Setup complete!${RESET}"
echo ""
echo -e "  Start the app:  ${CYAN}npm run dev${RESET}  (or ${CYAN}npm run go${RESET})"
echo -e "  Open browser:   ${CYAN}http://localhost:3000${RESET}"
echo ""
