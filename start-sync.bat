@echo off
echo Starting SDSS System Synchronization...

echo.
echo 1. Starting Next.js Frontend...
start "Next.js" cmd /k "npm run dev"

echo.
echo 2. Starting Python ML Backend...
start "Python ML" cmd /k "python main.py"

echo.
echo 3. Starting MQTT Worker...
start "MQTT Worker" cmd /k "npm run mqtt:worker"

echo.
echo 4. Starting MQTT Simulator...
start "MQTT Simulator" cmd /k "npm run mqtt:sim"

echo.
echo 5. Waiting for services to initialize...
timeout /t 10 /nobreak > nul

echo.
echo 6. Running system sync check...
npm run sync

echo.
echo All services started! Check the individual windows for status.
echo.
echo Data Flow:
echo MQTT Simulator ^> MQTT Worker ^> Next.js API (database) + Python ML (processing)
echo Next.js Frontend ^> Python ML Backend ^> Database (predictions)
echo.
pause
