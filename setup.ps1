# Family Chores App — Windows Setup
# Run: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Family Chores App - Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerExists) {
    Write-Host "Docker is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Docker Desktop for Windows:"
    Write-Host "  https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    Write-Host "After installing, open Docker Desktop and wait for it to start."
    Write-Host "Then run this script again."
    exit 1
}

# Check Docker running
try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "Docker is installed but not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again."
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# 2. Detect RAM
$ramGB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
Write-Host "[OK] Detected ${ramGB}GB RAM" -ForegroundColor Green

if ($ramGB -ge 32) {
    $textModel = "qwen2.5:14b"
} elseif ($ramGB -ge 16) {
    $textModel = "qwen2.5:7b"
} else {
    $textModel = "qwen2.5:3b"
}

Write-Host "[OK] Selected AI model: $textModel" -ForegroundColor Green

# 3. Set environment
$env:VITE_OLLAMA_TEXT_MODEL = $textModel

# 4. Build and start
Write-Host ""
Write-Host "Building and starting containers..."
Write-Host "This may take a few minutes on first run..."
Write-Host ""
docker compose up -d --build

# 5. Wait for Ollama
Write-Host ""
Write-Host "Waiting for Ollama to start..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}

# 6. Pull AI models
Write-Host ""
Write-Host "Downloading AI models (this may take a while)..."
$ollamaContainer = docker compose ps -q ollama
Write-Host "  Text model: $textModel"
docker exec $ollamaContainer ollama pull $textModel
Write-Host "  Vision model: llava:7b"
docker exec $ollamaContainer ollama pull llava:7b

# 7. Get LAN IP
$lanIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1).IPAddress
if (-not $lanIP) { $lanIP = "your-pc-ip" }

# 8. Done!
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Open in browser:"
Write-Host "    https://localhost:3443"
Write-Host ""
Write-Host "  Open on phone/tablet (same WiFi):"
Write-Host "    https://${lanIP}:3443"
Write-Host ""
Write-Host "  AI model: $textModel"
Write-Host ""
Write-Host "  Manage:"
Write-Host "    Stop:    docker compose down"
Write-Host "    Start:   docker compose up -d"
Write-Host "    Logs:    docker compose logs -f"
Write-Host "    Update:  git pull && docker compose up -d --build"
Write-Host ""
Write-Host "  NOTE: On phones, you'll see a security warning"
Write-Host "  about the self-signed certificate. Tap 'Advanced'"
Write-Host "  then 'Proceed' -- this is safe on your local network."
Write-Host "==========================================" -ForegroundColor Green

# Open browser
Start-Process "https://localhost:3443"
