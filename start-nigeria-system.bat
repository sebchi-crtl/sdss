@echo off
echo Starting Nigeria SDSS Flood Prediction System...
echo.

echo [1/3] Starting Python FastAPI service...
start "Nigeria ML API" cmd /k "python main.py"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Next.js development server...
start "Nigeria Web App" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Running API tests...
python test-nigeria-api.py

echo.
echo System started! 
echo - Python API: http://localhost:8200
echo - Web App: http://localhost:3000
echo - Nigeria States: http://localhost:3000/nigeria-states
echo.
echo Press any key to exit...
pause > nul
