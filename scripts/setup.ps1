# =============================================================================
# STEEP Analysis Platform — Setup Script (Windows PowerShell)
# =============================================================================
# Usage: npm run setup:win   (or .\scripts\setup.ps1 directly)
# What it does:
#   1. Installs Ollama if not already installed (silent MSI/EXE install)
#   2. Starts ollama serve as a background job if not already running
#   3. Pulls the default model (llama3.1:8b)
#   4. Installs Node dependencies
#   5. Copies .env.example -> .env.local (if not present)
# =============================================================================

$ErrorActionPreference = "Stop"

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Info    { param($msg) Write-Host "[STEEP] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[STEEP] $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "[STEEP] $msg" -ForegroundColor Yellow }
function Write-Err     { param($msg) Write-Host "[STEEP] ERROR: $msg" -ForegroundColor Red; exit 1 }

$DefaultModel = if ($env:STEEP_DEFAULT_MODEL) { $env:STEEP_DEFAULT_MODEL } else { "llama3.1:8b" }
$OllamaSetupUrl = "https://ollama.ai/download/OllamaSetup.exe"
$OllamaSetupPath = "$env:TEMP\OllamaSetup.exe"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║    STEEP Analysis Platform — Setup           ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ── Step 1: Check / Install Ollama ────────────────────────────────────────────
Write-Info "Checking for Ollama..."

$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($null -ne $ollamaCmd) {
    $ver = (ollama --version 2>$null) -replace ".*?(\d+\.\d+\.\d+).*", '$1'
    Write-Success "Ollama already installed (version: $ver)"
} else {
    Write-Info "Ollama not found. Downloading installer..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $OllamaSetupUrl -OutFile $OllamaSetupPath -UseBasicParsing
    } catch {
        Write-Err "Failed to download Ollama installer: $_`nVisit https://ollama.ai to install manually."
    }

    Write-Info "Running Ollama installer silently (this may take a minute)..."
    $proc = Start-Process -FilePath $OllamaSetupPath -ArgumentList "/S" -Wait -PassThru
    if ($proc.ExitCode -ne 0) {
        Write-Err "Ollama installer exited with code $($proc.ExitCode)"
    }

    # Refresh PATH so 'ollama' is available in this session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")

    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Err "Ollama installed but 'ollama' command not found. Try reopening your terminal."
    }
    Write-Success "Ollama installed successfully"
}

# ── Step 2: Start ollama serve ────────────────────────────────────────────────
Write-Info "Checking if Ollama server is running..."

function Test-OllamaRunning {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 3
        return $r.StatusCode -eq 200
    } catch { return $false }
}

if (Test-OllamaRunning) {
    Write-Success "Ollama server is already running"
} else {
    Write-Info "Starting Ollama server as a background process..."
    $job = Start-Job -ScriptBlock { ollama serve 2>&1 | Out-File "$env:TEMP\ollama-steep.log" -Append }
    Write-Info "Waiting for Ollama server to be ready (job id: $($job.Id))..."

    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-OllamaRunning) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Err "Ollama server did not start within 30 seconds.`nCheck $env:TEMP\ollama-steep.log for details."
    }
    Write-Success "Ollama server is ready"
}

# ── Step 3: Pull the default model ────────────────────────────────────────────
Write-Info "Checking if model '$DefaultModel' is available locally..."

$installedRaw = ollama list 2>$null
$installedModels = ($installedRaw -split "`n" | Select-Object -Skip 1 | ForEach-Object { ($_ -split "\s+")[0] })

if ($installedModels -contains $DefaultModel) {
    Write-Success "Model '$DefaultModel' is already cached — no download needed"
} else {
    Write-Warn "Model '$DefaultModel' not found locally. Pulling now..."
    Write-Warn "This is a one-time download (~5 GB for llama3.1:8b). Grab a coffee ☕"
    Write-Host ""
    $pullResult = ollama pull $DefaultModel
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to pull model '$DefaultModel'. Check your internet connection."
    }
    Write-Host ""
    Write-Success "Model '$DefaultModel' is ready"
}

# ── Step 4: Install Node dependencies ─────────────────────────────────────────
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Set-Location $ProjectDir
Write-Info "Installing Node.js dependencies..."

if (-not (Test-Path "package.json")) {
    Write-Err "package.json not found in $ProjectDir. Are you in the right directory?"
}

npm install
if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed" }
Write-Success "Node dependencies installed"

# ── Step 5: Create .env.local ─────────────────────────────────────────────────
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Success "Created .env.local from .env.example"
    } else {
        Write-Warn ".env.example not found — creating minimal .env.local"
        @"
OLLAMA_BASE_URL=http://localhost:11434
STEEP_DEFAULT_MODEL=$DefaultModel
"@ | Out-File ".env.local" -Encoding utf8
        Write-Success "Created .env.local"
    }
} else {
    Write-Info ".env.local already exists — skipping"
}

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Start the app:  " -NoNewline; Write-Host "npm run dev" -ForegroundColor Cyan -NoNewline; Write-Host "  (or " -NoNewline; Write-Host "npm run go" -ForegroundColor Cyan -NoNewline; Write-Host ")"
Write-Host "  Open browser:   " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
