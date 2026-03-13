#!/bin/bash
set -e

echo ""
echo "=========================================="
echo "  Family Chores App — Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Check Docker
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Docker is not installed.${NC}"
  echo ""
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Install Docker Desktop for Mac:"
    echo "  brew install --cask docker"
    echo "  OR download from: https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "After installing, open Docker Desktop and wait for it to start."
    echo "Then run this script again."
  else
    echo "Install Docker:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker \$USER"
    echo "  newgrp docker"
    echo "Then run this script again."
  fi
  exit 1
fi

# Check Docker is running
if ! docker info &>/dev/null; then
  echo -e "${RED}Docker is installed but not running.${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

echo -e "${GREEN}✓${NC} Docker is running"

# 2. Detect RAM and pick AI model
if [[ "$OSTYPE" == "darwin"* ]]; then
  RAM_BYTES=$(sysctl -n hw.memorysize)
  RAM_GB=$((RAM_BYTES / 1024 / 1024 / 1024))
else
  RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  RAM_GB=$((RAM_KB / 1024 / 1024))
fi

echo -e "${GREEN}✓${NC} Detected ${RAM_GB}GB RAM"

if [ "$RAM_GB" -ge 32 ]; then
  TEXT_MODEL="qwen2.5:14b"
elif [ "$RAM_GB" -ge 16 ]; then
  TEXT_MODEL="qwen2.5:7b"
else
  TEXT_MODEL="qwen2.5:3b"
fi

echo -e "${GREEN}✓${NC} Selected AI model: ${TEXT_MODEL}"

# 3. Set model in environment
export VITE_OLLAMA_TEXT_MODEL="$TEXT_MODEL"

# 4. Build and start containers
echo ""
echo "Building and starting containers..."
echo "This may take a few minutes on first run..."
echo ""
docker compose up -d --build

# 5. Wait for Ollama to be ready
echo ""
echo "Waiting for Ollama to start..."
for i in $(seq 1 30); do
  if curl -s http://localhost:11434/api/tags &>/dev/null; then
    break
  fi
  sleep 2
done

# 6. Pull AI models
echo ""
echo "Downloading AI models (this may take a while)..."
echo "  Text model: ${TEXT_MODEL}"
docker exec -it $(docker compose ps -q ollama) ollama pull "$TEXT_MODEL"
echo "  Vision model: llava:7b"
docker exec -it $(docker compose ps -q ollama) ollama pull llava:7b

# 7. Get LAN IP
if [[ "$OSTYPE" == "darwin"* ]]; then
  LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")
else
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "unknown")
fi

# 8. Done!
echo ""
echo "=========================================="
echo -e "${GREEN}  Setup complete!${NC}"
echo "=========================================="
echo ""
echo "  Open in browser:"
echo "    https://localhost:3443"
echo ""
echo "  Open on phone/tablet (same WiFi):"
echo "    https://${LAN_IP}:3443"
echo ""
echo "  AI model: ${TEXT_MODEL}"
echo ""
echo "  Manage:"
echo "    Stop:    docker compose down"
echo "    Start:   docker compose up -d"
echo "    Logs:    docker compose logs -f"
echo "    Update:  git pull && docker compose up -d --build"
echo ""
echo "  NOTE: On phones, you'll see a security warning"
echo "  about the self-signed certificate. Tap 'Advanced'"
echo "  then 'Proceed' — this is safe on your local network."
echo "=========================================="
