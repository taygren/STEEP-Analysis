#!/usr/bin/env bash
set -e

DEFAULT_MODEL="${STEEP_DEFAULT_MODEL:-llama3.2:3b}"
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

echo "==> Cleaning up any stale processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

echo "==> Starting Ollama..."
if curl -sf "${OLLAMA_BASE_URL}/api/version" > /dev/null 2>&1; then
  echo "==> Ollama already running — reusing existing instance."
else
  OLLAMA_HOST=0.0.0.0 ollama serve &
  echo "==> Waiting for Ollama to be ready..."
  for i in $(seq 1 30); do
    if curl -sf "${OLLAMA_BASE_URL}/api/version" > /dev/null 2>&1; then
      echo "==> Ollama is ready."
      break
    fi
    echo "    ... waiting (${i}/30)"
    sleep 2
  done

  if ! curl -sf "${OLLAMA_BASE_URL}/api/version" > /dev/null 2>&1; then
    echo "WARNING: Ollama did not start in time. Continuing anyway..."
  fi
fi

echo "==> Checking for model: ${DEFAULT_MODEL}"
if ! ollama list 2>/dev/null | grep -q "^${DEFAULT_MODEL}"; then
  echo "==> Model '${DEFAULT_MODEL}' not found. Pulling now (this may take a few minutes on first run)..."
  ollama pull "${DEFAULT_MODEL}"
  echo "==> Model ready."
else
  echo "==> Model '${DEFAULT_MODEL}' already available."
fi

echo "==> Starting Next.js..."
npm install
exec npm run dev
