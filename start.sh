#!/bin/bash

# SDSS Webapp Startup Script
echo "🚀 Starting SDSS Webapp..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase configuration."
    echo "See SETUP.md for details."
    exit 1
fi

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.8+"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

if [ ! -d "venv" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

echo "🎯 Starting services..."

# Start ML model server in background
echo "🧠 Starting ML model server..."
python main.py &
ML_PID=$!

# Wait a moment for ML server to start
sleep 3

# Start Next.js development server
echo "🌐 Starting Next.js application..."
npm run dev &
NEXT_PID=$!

# Wait a moment for Next.js to start
sleep 5

echo ""
echo "🎉 SDSS Webapp is starting up!"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo "🧠 ML Model: http://localhost:8200"
echo ""
echo "📋 Available commands:"
echo "  npm run mqtt:sim    - Start MQTT sensor simulator"
echo "  npm run mqtt:worker - Start MQTT worker"
echo "  npm run seed        - Populate database with sample data"
echo "  npm run alerts:evaluate - Run alert evaluation"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $ML_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
