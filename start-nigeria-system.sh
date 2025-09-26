#!/bin/bash

echo "Starting Nigeria SDSS Flood Prediction System..."
echo

echo "[1/3] Starting Python FastAPI service..."
python main.py &
FASTAPI_PID=$!
sleep 3

echo "[2/3] Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!
sleep 3

echo "[3/3] Running API tests..."
python test-nigeria-api.py

echo
echo "System started!"
echo "- Python API: http://localhost:8200"
echo "- Web App: http://localhost:3000"
echo "- Nigeria States: http://localhost:3000/nigeria-states"
echo
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $FASTAPI_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for user to stop
wait
