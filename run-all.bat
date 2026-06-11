@echo off
title PrintDrop System Launcher
echo ====================================================
echo             PrintDrop Full-Stack Launcher
echo ====================================================

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

echo Starting Next.js Web App in a new window...
start "PrintDrop-NextJS" cmd /c "npm run dev"

echo Waiting 5 seconds for Next.js server to boot...
timeout /t 5

cd print-server
:: Ensure dependencies are present
if not exist "node_modules\" (
    echo Installing print server dependencies...
    call npm install --silent
)
cd ..

:: Free port 3001 if already bound
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Terminating legacy process running on port 3001 ^(PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting Local Kiosk Print Server in a new window...
start "PrintDrop-Kiosk-Server" /MIN cmd /c "cd print-server && node index.js"

echo Waiting 3 seconds for Kiosk Print Server...
timeout /t 3

echo Launching Chrome in Kiosk Mode...
start /wait chrome --kiosk --disable-infobars --noerrdialogs --disable-session-crashed-bubble --disable-features=TranslateUI --no-first-run --disable-default-apps "%KIOSK_URL%"

echo.
echo Chrome closed. Cleaning up all background systems...
taskkill /F /FI "WINDOWTITLE eq PrintDrop-NextJS*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PrintDrop-Kiosk-Server*" >nul 2>&1
echo Done.
