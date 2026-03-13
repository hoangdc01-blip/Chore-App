#!/bin/bash
set -e

echo "🏠 Family Chores App — Mac Dev Setup"
echo "======================================"
echo ""

# 1. Check/install Homebrew
if ! command -v brew &>/dev/null; then
  echo "📦 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "✅ Homebrew already installed"
fi

# 2. Check/install nvm + Node.js
if ! command -v node &>/dev/null; then
  echo "📦 Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  echo "📦 Installing Node.js (from .nvmrc)..."
  nvm install
  nvm use
else
  echo "✅ Node.js $(node -v) already installed"
fi

# 3. Check/install Ollama
if ! command -v ollama &>/dev/null; then
  echo "📦 Installing Ollama..."
  brew install ollama
else
  echo "✅ Ollama already installed"
fi

# 4. Start Ollama and pull models
echo "🤖 Starting Ollama and pulling AI models..."
echo "   This may take a while on first run..."
ollama serve &>/dev/null &
sleep 3

# Detect RAM and pick best model
RAM_GB=$(sysctl -n hw.memorysize | awk '{print int($1/1024/1024/1024)}')
echo "   Detected ${RAM_GB}GB RAM"

if [ "$RAM_GB" -ge 32 ]; then
  TEXT_MODEL="qwen2.5:14b"
  echo "   Using qwen2.5:14b (best for ${RAM_GB}GB RAM)"
elif [ "$RAM_GB" -ge 16 ]; then
  TEXT_MODEL="qwen2.5:7b"
  echo "   Using qwen2.5:7b (good for ${RAM_GB}GB RAM)"
else
  TEXT_MODEL="qwen2.5:3b"
  echo "   Using qwen2.5:3b (lightweight for ${RAM_GB}GB RAM)"
fi

ollama pull "$TEXT_MODEL"
ollama pull llava:7b

# 5. Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# 6. Set up .env.local
if [ ! -f .env.local ]; then
  echo ""
  echo "⚙️  Setting up environment..."
  cp .env.example .env.local
  # Update text model based on RAM detection
  sed -i '' "s/VITE_OLLAMA_TEXT_MODEL=qwen2.5:7b/VITE_OLLAMA_TEXT_MODEL=${TEXT_MODEL}/" .env.local
  echo ""
  echo "📝 Created .env.local from .env.example"
  echo "   Edit .env.local to add your Firebase keys (if using Firebase sync)"
  echo "   Or set VITE_USE_FIREBASE=false for local-only mode"
else
  echo "✅ .env.local already exists"
fi

echo ""
echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "To start developing:"
echo "  npm run dev"
echo ""
echo "AI model: ${TEXT_MODEL}"
echo "Vision model: llava:7b"
echo "======================================"
