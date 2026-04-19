#!/usr/bin/env bash
# =============================================================================
# STEEP Analysis Platform — Start Script (Linux / macOS)
# =============================================================================
# Usage: npm run go   (or bash scripts/start.sh directly)
# What it does:
#   1. Ensures Ollama server is running (starts it in background if not)
#   2. Starts Next.js dev server (npm run dev)
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[STEEP]${RESET} $*"; }
success() { echo -e "${GREEN}[STEEP]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[STEEP]${RESET} $*"; }

# ── Ensure Ollama is running ───────────────────────────────────────────────────
if curl -sf http://localhost:11434/api/version &>/dev/null; then
  success "Ollama server is running"
else
  warn "Ollama server not detected — starting it now..."
  if ! command -v ollama &>/dev/null; then
    echo -e "\033[0;31m[STEEP] ERROR:\033[0m Ollama is not installed. Run 'npm run setup' first."
    exit 1
  fi
  nohup ollama serve > /tmp/ollama-steep.log 2>&1 &
  echo $! > /tmp/ollama-steep.pid
  info "Waiting for Ollama server..."
  for i in $(seq 1 20); do
    if curl -sf http://localhost:11434/api/version &>/dev/null; then
      success "Ollama server is ready"
      break
    fi
    if [ $i -eq 20 ]; then
      echo -e "\033[0;31m[STEEP] ERROR:\033[0m Ollama server failed to start. Check /tmp/ollama-steep.log"
      exit 1
    fi
    sleep 1
  done
fi

# ── Start Next.js ─────────────────────────────────────────────────────────────
info "Starting STEEP Analysis Platform..."
echo ""
echo -e "  ${CYAN}http://localhost:3000${RESET}"
echo ""
npm run dev
