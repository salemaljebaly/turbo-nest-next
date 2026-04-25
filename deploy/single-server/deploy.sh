#!/bin/sh
set -eu

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing deploy/single-server/.env"
  echo "Copy .env.example to .env and fill in production values."
  exit 1
fi

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy start ==="

docker compose --env-file .env -f docker-compose.yml build api web
docker compose --env-file .env -f docker-compose.yml up -d postgres redis minio
docker compose --env-file .env -f docker-compose.yml up -d api web caddy

docker compose --env-file .env -f docker-compose.yml ps

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy ok ==="
