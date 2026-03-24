@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo [Beograd Demo] Starting backend and frontend...

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js is not installed or not in PATH.
  echo Please install Node.js 18+ and try again.
  pause
  exit /b 1
)

if not exist "backend\package.json" (
  echo [Error] backend\package.json not found.
  pause
  exit /b 1
)

if not exist "frontend\package.json" (
  echo [Error] frontend\package.json not found.
  pause
  exit /b 1
)

where powershell >nul 2>nul
if errorlevel 1 (
  echo [Error] PowerShell is not available in PATH.
  pause
  exit /b 1
)

start "Beograd Demo - Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%backend'; if (!(Test-Path 'node_modules')) { npm install }; npm run dev"
start "Beograd Demo - Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%ROOT%frontend'; if (!(Test-Path 'node_modules')) { npm install }; npm run dev"

echo Waiting for frontend to be ready at http://localhost:3000 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(120); do { try { $r=Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -ge 200) { Start-Process 'http://localhost:3000'; exit 0 } } catch { }; Start-Sleep -Milliseconds 800 } while ((Get-Date) -lt $deadline); Start-Process 'http://localhost:3000'" >nul 2>nul

echo.
echo Backend window and Frontend window were opened.
echo Demo page has been opened (or queued) in your default browser.
echo Frontend URL: http://localhost:3000
echo Backend  URL: http://localhost:4000
echo.
echo Tip: close those two terminal windows to stop the demo.
pause
