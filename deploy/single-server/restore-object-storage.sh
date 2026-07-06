#!/usr/bin/env bash
set -Eeuo pipefail

archive="${1:?object storage archive is required}"
cd "$(dirname "$0")"

docker compose --env-file .env -f docker-compose.yml up -d --wait rustfs
docker run --rm \
  -v "$(pwd)/$archive:/restore.tar.gz:ro" \
  -v "single-server_rustfs_data:/data" \
  alpine sh -c 'cd /data && tar -xzf /restore.tar.gz'
