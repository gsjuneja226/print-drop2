#!/bin/bash
echo "===================================================="
echo "            PrintDrop Full-Stack Launcher"
echo "===================================================="

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

echo "Starting Next.js Web App in the background..."
npm run dev &
NEXT_PID=$!

echo "Waiting 5 seconds for Next.js server to boot..."
sleep 5

echo "Starting Local Kiosk Print Server in the background..."
cd print-server
npm install --silent 2>/dev/null
node index.js &
PRINT_PID=$!
cd ..

echo "Waiting 3 seconds for Kiosk Print Server..."
sleep 3

echo "Opening Kiosk page in your browser at $KIOSK_URL..."
if [ "$(uname)" == "Darwin" ]; then
    open "$KIOSK_URL"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    xdg-open "$KIOSK_URL"
fi

echo "Both servers are running in the background."
echo "Press Ctrl+C to terminate all servers."

# Trap Ctrl+C to kill background processes
trap "kill $NEXT_PID $PRINT_PID; exit" INT
wait
