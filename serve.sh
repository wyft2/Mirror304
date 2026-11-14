#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
echo "《镜子里的304》"
echo "Open: http://127.0.0.1:8765/"
echo "Press Ctrl+C to stop."
exec python3 -m http.server 8765 --bind 127.0.0.1
