@echo off
echo ============================================================
echo Starting SwasthyaSetu Backend Server
echo ============================================================
echo.

cd /d "%~dp0backend"

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server...
echo.
echo IMPORTANT: Keep this window open!
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

call npm start

pause

