@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo   AVVIO TOURNEYHUB
echo ========================================
echo.

echo Controllo dipendenze...
if not exist "node_modules" (
    echo Installazione dipendenze...
    call npm install
    echo.
)

echo Avvio server di sviluppo su http://localhost:3001
echo Premi Ctrl+C per fermare.
echo.
call npm run dev -- --port 3001
