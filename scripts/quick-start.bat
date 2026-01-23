@echo off
REM DisasterReliefAI - Quick Start Script for Windows
REM This script sets up and starts the entire application

echo ==============================================
echo   DisasterReliefAI - Quick Start Script
echo ==============================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] Python found: %PYTHON_VERSION%

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB is not running. Please start MongoDB.
    echo You can start it with: net start MongoDB
    pause
)

echo.
echo ==============================================
echo   Installing Dependencies
echo ==============================================

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    call npm install
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies already installed
)

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating backend .env file...
    copy .env.example .env
    echo [OK] .env file created
)

cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
if not exist node_modules (
    call npm install
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

REM Create frontend .env if it doesn't exist
if not exist .env (
    echo Creating frontend .env file...
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo [OK] .env file created
)

cd ..

REM Install Python dependencies
echo Installing Python dependencies...
if not exist venv (
    python -m venv venv
)

call venv\Scripts\activate

python -c "import pandas" 2>nul
if %ERRORLEVEL% NEQ 0 (
    pip install -r requirements.txt
    echo [OK] Python dependencies installed
) else (
    echo [OK] Python dependencies already installed
)

REM Download NLTK data
echo Downloading NLTK data...
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True)"
echo [OK] NLTK data downloaded

echo.
echo ==============================================
echo   Starting Application
echo ==============================================

REM Start backend
echo Starting backend server...
cd backend
start "DisasterReliefAI Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
cd ..
echo [OK] Backend started on port 5000

REM Start frontend
echo Starting frontend application...
cd frontend
start "DisasterReliefAI Frontend" cmd /k "npm start"
timeout /t 5 /nobreak >nul
cd ..
echo [OK] Frontend started on port 3000

echo.
echo ==============================================
echo   DisasterReliefAI is Running!
echo ==============================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000/api
echo MongoDB: mongodb://localhost:27017
echo.
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ==============================================
echo   Application is running in separate windows
echo   Close the command windows to stop services
echo ==============================================
echo.
pause














