#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"

# Generate self-signed cert if not exists
if [ ! -f "$CERT_DIR/selfsigned.crt" ]; then
  mkdir -p "$CERT_DIR"
  echo "Generating self-signed SSL certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/selfsigned.key" \
    -out "$CERT_DIR/selfsigned.crt" \
    -subj "/C=US/ST=Local/L=Local/O=FamilyChores/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:0.0.0.0" 2>/dev/null
fi

# Inject runtime environment variables into env-config.js
ENV_FILE="/usr/share/nginx/html/env-config.js"
cat > "$ENV_FILE" << ENVEOF
window.__ENV__ = {
  VITE_USE_FIREBASE: "${VITE_USE_FIREBASE:-false}",
  VITE_FIREBASE_API_KEY: "${VITE_FIREBASE_API_KEY:-}",
  VITE_FIREBASE_AUTH_DOMAIN: "${VITE_FIREBASE_AUTH_DOMAIN:-}",
  VITE_FIREBASE_PROJECT_ID: "${VITE_FIREBASE_PROJECT_ID:-}",
  VITE_FIREBASE_STORAGE_BUCKET: "${VITE_FIREBASE_STORAGE_BUCKET:-}",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "${VITE_FIREBASE_MESSAGING_SENDER_ID:-}",
  VITE_FIREBASE_APP_ID: "${VITE_FIREBASE_APP_ID:-}",
  VITE_OLLAMA_URL: "${VITE_OLLAMA_URL:-http://ollama:11434}",
  VITE_OLLAMA_TEXT_MODEL: "${VITE_OLLAMA_TEXT_MODEL:-qwen2.5:7b}",
  VITE_OLLAMA_VISION_MODEL: "${VITE_OLLAMA_VISION_MODEL:-llava:7b}"
};
ENVEOF

echo "Environment config written to env-config.js"

# Execute CMD (nginx)
exec "$@"
