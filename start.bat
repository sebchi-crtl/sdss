@echo off
echo 🚀 Starting SDSS Webapp...

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found!
    echo Please create .env.local with your Supabase configuration.
    echo See SETUP.md for details.
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

echo 📦 Installing Python dependencies...
pip install -r requirements.txt

echo 🎯 Starting services...

REM Start ML model server in background
echo 🧠 Starting ML model server...
start "ML Model Server" python main.py

REM Wait a moment for ML server to start
timeout /t 3 /nobreak >nul

REM Start Next.js development server
echo 🌐 Starting Next.js application...
start "Next.js App" npm run dev

REM Wait a moment for Next.js to start
timeout /t 5 /nobreak >nul

echo.
echo 🎉 SDSS Webapp is starting up!
echo.
echo 📊 Dashboard: http://localhost:3000
echo 🧠 ML Model: http://localhost:8200
echo.
echo 📋 Available commands:
echo   npm run mqtt:sim    - Start MQTT sensor simulator
echo   npm run mqtt:worker - Start MQTT worker
echo   npm run seed        - Populate database with sample data
echo   npm run alerts:evaluate - Run alert evaluation
echo.
echo Press any key to open the dashboard in your browser...

REM Open browser
start http://localhost:3000

echo.
echo Press any key to exit...
pause >nul
