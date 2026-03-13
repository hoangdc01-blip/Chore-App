# Family Chores App — Installation Guide

## Quick Start (One Command)

### Windows
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Open PowerShell and run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File setup.ps1
   ```
3. Open https://localhost:3443

### Mac
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   ```bash
   brew install --cask docker
   ```
2. Open Docker Desktop and wait for it to start
3. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
4. Open https://localhost:3443

### Linux
1. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
2. Log out and back in, then:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

---

## macOS Security (Gatekeeper)

macOS may block scripts and Docker from running. Here's how to fix each issue:

### "setup.sh cannot be opened because it is from an unidentified developer"
```bash
# Option 1: Remove quarantine attribute
xattr -d com.apple.quarantine setup.sh

# Option 2: Allow in System Settings
# Go to: System Settings > Privacy & Security > scroll down
# Click "Allow Anyway" next to the blocked app
```

### "Docker Desktop" is blocked
1. Open **System Settings > Privacy & Security**
2. Scroll down to find the blocked message
3. Click **"Open Anyway"**
4. If asked, enter your Mac password

### Docker needs permissions
On first run, Docker Desktop may ask for:
- **Network access** — Click **Allow** (needed for containers to communicate)
- **File sharing** — Click **Allow** (needed for volumes/data storage)

### Ollama native (non-Docker) is blocked
If you installed Ollama directly (not via Docker):
```bash
# Remove quarantine
xattr -d com.apple.quarantine /usr/local/bin/ollama

# Or allow in System Settings > Privacy & Security > Allow Anyway
```

### Full Disk Access (if setup.sh fails)
1. Open **System Settings > Privacy & Security > Full Disk Access**
2. Click **+** and add **Terminal** (or iTerm2 / your terminal app)

---

## Phone & Tablet Access (iPhone / iPad / Android)

Your phone connects to the app running on your computer via WiFi.

### Step 1: Find your computer's IP address

**Mac:**
```bash
ipconfig getifaddr en0
```

**Windows (PowerShell):**
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" }).IPAddress
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

### Step 2: Open on your phone
Open Safari (iPhone/iPad) or Chrome (Android) and go to:
```
https://YOUR_COMPUTER_IP:3443
```
Example: `https://192.168.1.100:3443`

### Step 3: Accept the security certificate

You'll see a warning like "Your connection is not private" — this is normal for self-signed certificates on a local network.

**iPhone / iPad (Safari):**
1. Tap **"Show Details"**
2. Tap **"visit this website"**
3. Tap **"Visit Website"** in the popup
4. Enter your phone passcode if asked

**Android (Chrome):**
1. Tap **"Advanced"**
2. Tap **"Proceed to [IP address] (unsafe)"**

> This is safe! The certificate is self-signed by your own computer. Your data never leaves your local network.

### Step 4: Add to Home Screen (optional, recommended)
Make it feel like a real app:

**iPhone / iPad:**
1. Tap the **Share** button (square with arrow)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**

**Android:**
1. Tap the **three dots** menu
2. Tap **"Add to Home screen"**
3. Tap **"Add"**

---

## Dedicated iPad as Family Dashboard

Want an iPad always showing the chores? Perfect for a kitchen wall mount:

1. Follow the phone setup steps above
2. Add to Home Screen
3. Enable **Guided Access** to lock the iPad to the app:
   - Go to **Settings > Accessibility > Guided Access**
   - Turn it **ON**
   - Set a passcode
   - Open the Family Chores app
   - Triple-click the **side button** to start Guided Access
4. Optional: Enable **Auto-Lock: Never** in Settings > Display & Brightness
5. Optional: Plug in the charger so it stays on

---

## Voice Input (AI Buddy)

Voice input uses the Web Speech API which requires HTTPS. The Docker setup includes HTTPS automatically.

If voice input doesn't work on phones:
1. Make sure you're using `https://` (not `http://`)
2. Accept the security certificate (see Step 3 above)
3. When Buddy asks for microphone permission, tap **Allow**
4. On iPhone: make sure Safari has microphone access in Settings > Safari > Microphone

---

## Managing the App

```bash
# Start the app
docker compose up -d

# Stop the app
docker compose down

# View logs
docker compose logs -f

# Restart after code changes
docker compose up -d --build

# Change AI model
VITE_OLLAMA_TEXT_MODEL=qwen2.5:14b docker compose up -d

# Pull a different model manually
docker exec $(docker compose ps -q ollama) ollama pull qwen2.5:14b
```

---

## AI Model Recommendations

| RAM | Recommended Model | Speed | Quality |
|-----|------------------|-------|---------|
| 8GB | qwen2.5:3b | Fast | Basic |
| 16GB | qwen2.5:7b | Good | Good |
| 32GB+ | qwen2.5:14b | Good (Apple Silicon) / Slower (Intel/AMD) | Best |

The setup script auto-detects your RAM and picks the best model.

To change models later:
```bash
# Pull new model
docker exec $(docker compose ps -q ollama) ollama pull qwen2.5:14b

# Restart with new model
VITE_OLLAMA_TEXT_MODEL=qwen2.5:14b docker compose up -d
```

---

## Firebase Sync (Optional)

By default, the app uses localStorage (data stays on each device separately).

To sync data across ALL devices (PC, phone, tablet):

1. Create a free Firebase project at https://console.firebase.google.com
2. Enable Firestore Database and Authentication
3. Copy your Firebase config values
4. Create a `.env` file in the project root:
   ```bash
   VITE_USE_FIREBASE=true
   VITE_FIREBASE_API_KEY=your-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
5. Restart: `docker compose up -d --build`

---

## Troubleshooting

### "Buddy is sleeping" error
Ollama isn't running or models aren't pulled yet.
```bash
# Check if Ollama container is running
docker compose ps

# Check Ollama logs
docker compose logs ollama

# Re-pull models
docker exec $(docker compose ps -q ollama) ollama pull qwen2.5:7b
```

### App loads but AI doesn't respond
The Ollama container might still be loading the model.
```bash
# Check Ollama is ready
curl http://localhost:11434/api/tags
```

### Phone can't connect
1. Make sure phone and computer are on the **same WiFi network**
2. Check your computer's firewall allows ports 3443 and 11434
3. Try: `https://YOUR_IP:3443` (not http)

### Windows Firewall blocking
```powershell
# Allow ports through Windows Firewall
netsh advfirewall firewall add rule name="Family Chores HTTPS" dir=in action=allow protocol=TCP localport=3443
netsh advfirewall firewall add rule name="Family Chores HTTP" dir=in action=allow protocol=TCP localport=3000
```

### Mac Firewall blocking
1. **System Settings > Network > Firewall**
2. Click **Options**
3. Add Docker Desktop → **Allow incoming connections**
