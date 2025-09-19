#!/bin/bash

echo "Starting SDSS System Synchronization..."

echo ""
echo "1. Starting Next.js Frontend..."
gnome-terminal --title="Next.js" -- bash -c "npm run dev; exec bash" &

echo ""
echo "2. Starting Python ML Backend..."
gnome-terminal --title="Python ML" -- bash -c "python main.py; exec bash" &

echo ""
echo "3. Starting MQTT Worker..."
gnome-terminal --title="MQTT Worker" -- bash -c "npm run mqtt:worker; exec bash" &

echo ""
echo "4. Starting MQTT Simulator..."
gnome-terminal --title="MQTT Simulator" -- bash -c "npm run mqtt:sim; exec bash" &

echo ""
echo "5. Waiting for services to initialize..."
sleep 10

echo ""
echo "6. Running system sync check..."
npm run sync

echo ""
echo "All services started! Check the individual windows for status."
echo ""
echo "Data Flow:"
echo "MQTT Simulator → MQTT Worker → Next.js API (database) + Python ML (processing)"
echo "Next.js Frontend → Python ML Backend → Database (predictions)"
echo ""
