#!/usr/bin/env bash
set -Eeuo pipefail

echo "Starting restore drill against local single-server compose project"
"$(dirname "$0")/recover-latest.sh"
docker compose --env-file "$(dirname "$0")/.env" -f "$(dirname "$0")/docker-compose.yml" ps
