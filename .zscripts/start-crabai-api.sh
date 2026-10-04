#!/bin/bash
# Start the crabAI FastAPI backend if it isn't already running.
# Safe to call multiple times — won't double-start.

PID_FILE=/tmp/crabai-api.pid
LOG_FILE=/tmp/crabai-api.log

# If pidfile exists and process is alive, do nothing.
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "crabai-api already running (pid=$PID)"
    exit 0
  fi
fi

cd /home/z/my-project/mini-services/crabai-api
nohup uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "started, pid=$NEW_PID"
sleep 8

# Verify
if kill -0 "$NEW_PID" 2>/dev/null; then
  echo "alive after 8s, OK"
else
  echo "ERROR: process died, check $LOG_FILE"
  tail -20 "$LOG_FILE"
fi