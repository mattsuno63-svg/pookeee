@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   CHIUSURA PROCESSI TOURNEYHUB
echo ========================================
echo.

echo Terminazione processi Node.js...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js terminato
) else (
    echo [--] Nessun processo Node.js in esecuzione
)

echo.
echo Pulizia cache Next.js (opzionale)...
if exist ".next" (
    rmdir /s /q .next 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Cartella .next eliminata
    )
)

echo.
echo ========================================
echo   COMPLETATO
echo ========================================
echo.
pause
