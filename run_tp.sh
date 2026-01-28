#!/bin/bash

DISMANTLER=$(jq -r .dismantler /home/moon/Desktop/work_linux/twiceparts/tp_importer/current.json)
CONFIG_PATH="/home/moon/Desktop/work_linux/twiceparts/tp_importer/dismantlers/$DISMANTLER/config.json"

pkill -f "Twice-Parts-Dismantler.*npm run dev" 2>/dev/null || true
pkill -f "Twice-Parts-Master.*npm run dev" 2>/dev/null || true
pkill -f "Twice-Parts-API.*npm run dev" 2>/dev/null || true

kill $(lsof -t -i:3000) 2>/dev/null || true
kill $(lsof -t -i:5173) 2>/dev/null || true
kill $(lsof -t -i:5174) 2>/dev/null || true

sleep 3

cd /home/moon/Desktop/work_linux/twiceparts/tp_API
npm run dev &

sleep 6

cd /home/moon/Desktop/work_linux/twiceparts/tp_frontend
npm run dev &

sleep 1

cd /home/moon/Desktop/work_linux/twiceparts/tp_master
npm run dev &

sleep 1


# Trap SIGINT (Ctrl+C) to kill all background processes before exiting
trap 'echo "   Interrupting..."; 
      sleep 1
      pkill -f "Twice-Parts-Dismantler.*npm run dev" 2>/dev/null || true;
      pkill -f "Twice-Parts-Master.*npm run dev" 2>/dev/null || true;
      pkill -f "Twice-Parts-API.*npm run dev" 2>/dev/null || true;
      kill $(jobs -p) 2>/dev/null; 
      echo "All processes terminated"; 
      exit' INT

# Wait for user to press Ctrl+C
echo ""
echo "TP Suite is running. Press Ctrl+C to stop all processes."
wait
