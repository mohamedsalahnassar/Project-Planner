#!/usr/bin/env bash
set -e

PORT=${PORT:-8000}
ENTRY="Project_Planner_App.html"

if command -v npx >/dev/null 2>&1; then
  echo "Starting server using Node's http-server..."
  echo "Open http://localhost:${PORT}/${ENTRY} in your browser. Press Ctrl+C to stop."
  exec npx http-server -p "$PORT"
elif command -v python3 >/dev/null 2>&1; then
  echo "Starting server using Python's http.server..."
  echo "Open http://localhost:${PORT}/${ENTRY} in your browser. Press Ctrl+C to stop."
  exec python3 -m http.server "$PORT"
else
  echo "Error: Neither Node.js (with npx) nor Python 3 was found."
  echo "Please install Node.js from https://nodejs.org/ or Python 3 from https://www.python.org/downloads/."
  exit 1
fi
