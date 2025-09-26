@echo off
echo Stopping existing FastAPI service...
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak > nul

echo Starting Nigeria SDSS FastAPI service...
python main.py
