@echo off
setlocal
title MediBook HMS

set "ROOT=%~dp0"

echo ============================================
echo   MediBook HMS - starting all services
echo ============================================
echo.

:: --- Check npm is available ---
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found on PATH.
    echo Install Node.js from https://nodejs.org and try again.
    pause
    exit /b 1
)

:: --- First-run setup: install dependencies if missing ---
if not exist "%ROOT%server\node_modules" (
    echo Installing server dependencies...
    pushd "%ROOT%server"
    call npm install --no-audit --no-fund
    popd
    echo.
)
if not exist "%ROOT%client\node_modules" (
    echo Installing client dependencies...
    pushd "%ROOT%client"
    call npm install --no-audit --no-fund
    popd
    echo.
)

:: --- Warn about missing env config ---
if not exist "%ROOT%server\.env" (
    echo [WARN] server\.env not found. The API will try mongodb://127.0.0.1:27017/medibook.
    echo        For MongoDB Atlas, copy server\.env.example to server\.env first.
    echo.
)

:: --- Launch API and web client in their own windows ---
echo Starting API server  -  http://localhost:5000
start "MediBook API" /D "%ROOT%server" cmd /k npm run dev

echo Starting web client  -  http://localhost:5173
start "MediBook Web" /D "%ROOT%client" cmd /k npm run dev

echo.
echo Both services are starting in separate windows.
echo   Web app:  http://localhost:5173
echo   API:      http://localhost:5000
echo Close a window to stop that service.
echo.

:: --- Give Vite a moment, then open the app in the default browser ---
timeout /t 4 /nobreak >nul
start "" http://localhost:5173

endlocal
