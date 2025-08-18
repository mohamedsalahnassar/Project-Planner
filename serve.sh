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
elif command -v node >/dev/null 2>&1; then
  echo "Starting server using Node's built-in http module..."
  echo "Open http://localhost:${PORT}/${ENTRY} in your browser. Press Ctrl+C to stop."
  exec node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const file=path.join(process.cwd(),req.url==='/'?'${ENTRY}':req.url);fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');}else{res.end(data);}});}).listen(${PORT});"
else
  echo "Error: A suitable web server (npx http-server, Python 3, or Node) was not found."
  echo "Please install Node.js from https://nodejs.org/ or Python 3 from https://www.python.org/downloads/."
  exit 1
fi
