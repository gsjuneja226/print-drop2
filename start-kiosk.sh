#!/bin/bash
# PrintDrop Kiosk Startup Script
# Usage: chmod +x start-kiosk.sh && ./start-kiosk.sh
# Set KIOSK_ID before running: export KIOSK_ID=KIOSK_001

KIOSK_ID=${KIOSK_ID:-"KIOSK_001"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_LOCAL_PATH="$SCRIPT_DIR/.env.local"

# Ensure KIOSK_ID is defined in .env.local
echo "Verifying persistent kiosk identification..."
node -e "const fs = require('fs'); const path = require('path'); const envPath = '$ENV_LOCAL_PATH'; let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''; const lines = content.split(/\r?\n/); const hasId = lines.some(line => line.trim() && !line.trim().startsWith('#') && line.trim().split('=')[0].trim() === 'KIOSK_ID'); if (!hasId) { const id = 'KIOSK_' + Math.random().toString(36).substring(2, 10).toUpperCase(); const sep = (content.endsWith('\n') || content.length === 0) ? '' : '\n'; fs.appendFileSync(envPath, sep + 'KIOSK_ID=' + id + '\n'); console.log('Generated persistent KIOSK_ID: ' + id); } else { console.log('Persistent KIOSK_ID already configured.'); }"

# Try to parse KIOSK_ID if not explicitly set
if [ -z "$KIOSK_ID" ]; then
  for env_file in "$SCRIPT_DIR/.env.local" "$SCRIPT_DIR/.env"; do
    if [ -f "$env_file" ]; then
      ENV_VAL=$(grep -E "^KIOSK_ID=" "$env_file" | cut -d'=' -f2)
      if [ ! -z "$ENV_VAL" ]; then
        ENV_VAL=$(echo "$ENV_VAL" | sed -e "s/^['\"]//" -e "s/['\"]$//" | xargs)
        KIOSK_ID="$ENV_VAL"
        break
      fi
    fi
  done
fi
KIOSK_ID=${KIOSK_ID:-"KIOSK_001"}

# Try to parse NEXT_PUBLIC_APP_URL from local env files if not explicitly set
if [ -z "$APP_URL" ]; then
  for env_file in "$SCRIPT_DIR/.env.local" "$SCRIPT_DIR/.env"; do
    if [ -f "$env_file" ]; then
      ENV_VAL=$(grep -E "^NEXT_PUBLIC_APP_URL=" "$env_file" | cut -d'=' -f2)
      if [ ! -z "$ENV_VAL" ]; then
        ENV_VAL=$(echo "$ENV_VAL" | sed -e "s/^['\"]//" -e "s/['\"]$//" | xargs)
        APP_URL="$ENV_VAL"
        break
      fi
    fi
  done
fi

APP_URL=${APP_URL:-"http://localhost:3000"}
KIOSK_URL="$APP_URL/kiosk/$KIOSK_ID"

echo "========================================="
echo "   PrintDrop Kiosk: $KIOSK_ID"
echo "   URL: $KIOSK_URL"
echo "========================================="

# Start print server
cd "$(dirname "$0")/print-server"
npm install --silent 2>/dev/null
node index.js &
PRINT_PID=$!
echo "✓ Print server started (PID: $PRINT_PID)"
sleep 2

# Open kiosk in Chrome fullscreen
CHROME=""
for cmd in google-chrome chromium-browser chromium google-chrome-stable; do
  command -v "$cmd" &>/dev/null && CHROME="$cmd" && break
done

if [ -n "$CHROME" ]; then
  "$CHROME" \
    --kiosk \
    --disable-infobars \
    --noerrdialogs \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --no-first-run \
    --disable-default-apps \
    "$KIOSK_URL"
else
  echo "Chrome not found. Open $KIOSK_URL manually in fullscreen."
  wait
fi

kill $PRINT_PID 2>/dev/null
echo "Kiosk stopped."
