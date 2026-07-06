#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing deploy/single-server/.env"
  echo "Copy .env.example to .env and fill in production values."
  exit 1
fi

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy start ==="

profiles=(--profile worker --profile observability --profile migration)

docker compose --env-file .env -f docker-compose.yml "${profiles[@]}" build api web worker migrate
docker compose --env-file .env -f docker-compose.yml "${profiles[@]}" up -d --wait postgres redis rustfs
docker compose --env-file .env -f docker-compose.yml --profile migration run --rm migrate
docker compose --env-file .env -f docker-compose.yml "${profiles[@]}" up -d --wait api web caddy worker

health_url="${APP_HEALTH_URL:-${NEXT_PUBLIC_API_URL:-}/health}"
if [[ -n "$health_url" ]]; then
  echo "Health-checking $health_url"
  for _ in {1..24}; do
    if curl --fail --silent --max-time 5 "$health_url" >/dev/null; then
      docker compose --env-file .env -f docker-compose.yml "${profiles[@]}" ps
      echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy ok ==="
      exit 0
    fi
    sleep 5
  done
  echo "Health check failed: $health_url" >&2
  docker compose --env-file .env -f docker-compose.yml "${profiles[@]}" logs api --tail 80
  exit 1
fi

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy ok ==="
