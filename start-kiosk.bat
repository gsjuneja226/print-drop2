@echo off
title PrintDrop Kiosk Startup
set KIOSK_ID=
set APP_URL=

:: Ensure a persistent KIOSK_ID is defined in .env.local
echo Verifying persistent kiosk identification...
node -e "const fs = require('fs'); const path = require('path'); const envPath = path.join('%~dp0', '.env.local'); let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''; const lines = content.split(/\r?\n/); const hasId = lines.some(line => line.trim() && !line.trim().startsWith('#') && line.trim().split('=')[0].trim() === 'KIOSK_ID'); if (!hasId) { const id = 'KIOSK_' + Math.random().toString(36).substring(2, 10).toUpperCase(); const sep = (content.endsWith('\n') || content.length === 0) ? '' : '\n'; fs.appendFileSync(envPath, sep + 'KIOSK_ID=' + id + '\n'); console.log('Generated persistent KIOSK_ID: ' + id); } else { console.log('Persistent KIOSK_ID already configured.'); }"

:: Check for .env.local or .env to parse NEXT_PUBLIC_APP_URL and KIOSK_ID
if exist "%~dp0.env.local" (
    for /f "usebackq tokens=1,2 delims==" %%A in ("%~dp0.env.local") do (
        if "%%A"=="NEXT_PUBLIC_APP_URL" (
            set APP_URL=%%B
        )
        if "%%A"=="KIOSK_ID" (
            set KIOSK_ID=%%B
        )
    )
)
if "%APP_URL%"=="" (
    if exist "%~dp0.env" (
        for /f "usebackq tokens=1,2 delims==" %%A in ("%~dp0.env") do (
            if "%%A"=="NEXT_PUBLIC_APP_URL" (
                set APP_URL=%%B
            )
        )
    )
)
if "%KIOSK_ID%"=="" (
    if exist "%~dp0.env" (
        for /f "usebackq tokens=1,2 delims==" %%A in ("%~dp0.env") do (
            if "%%A"=="KIOSK_ID" (
                set KIOSK_ID=%%B
            )
        )
    )
)

:: Trim quotes and spaces if set
if not "%APP_URL%"=="" (
    set APP_URL=%APP_URL:"=%
    set APP_URL=%APP_URL:'=%
    for /f "tokens=*" %%A in ("%APP_URL%") do set APP_URL=%%A
)
if not "%KIOSK_ID%"=="" (
    set KIOSK_ID=%KIOSK_ID:"=%
    set KIOSK_ID=%KIOSK_ID:'=%
    for /f "tokens=*" %%A in ("%KIOSK_ID%") do set KIOSK_ID=%%A
)

:: Fallback if not found
if "%APP_URL%"=="" set APP_URL=http://localhost:3000
if "%KIOSK_ID%"=="" set KIOSK_ID=KIOSK_001

set KIOSK_URL=%APP_URL%/kiosk/%KIOSK_ID%

echo =========================================
echo    PrintDrop Kiosk: %KIOSK_ID%
echo    URL: %KIOSK_URL%
echo =========================================

cd print-server

:: Auto-install dependencies if missing
if not exist "node_modules\" (
    echo Installing print server dependencies...
    call npm install --silent
)

:: Free port 3001 if it's already in use
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Terminating legacy process running on port 3001 ^(PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting local printer server...
start "PrintDrop-Server" /MIN node index.js
cd ..
timeout /t 3

echo Launching Chrome in kiosk mode...
start /wait chrome --kiosk --disable-infobars --noerrdialogs --disable-session-crashed-bubble --disable-features=TranslateUI --no-first-run --disable-default-apps "%KIOSK_URL%"

echo Chrome closed. Cleaning up background server process...
taskkill /F /FI "WINDOWTITLE eq PrintDrop-Server*" >nul 2>&1
echo Done.
