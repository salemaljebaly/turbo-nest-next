#!/usr/bin/env bash
set -Eeuo pipefail

backup_dir="${BACKUP_DIR:-./backups}"
latest_postgres="$(ls -t "$backup_dir"/postgres-*.sql.gz 2>/dev/null | head -1 || true)"
latest_objects="$(ls -t "$backup_dir"/object-storage-*.tar.gz 2>/dev/null | head -1 || true)"

if [[ -n "$latest_postgres" ]]; then
  "$(dirname "$0")/restore-postgres.sh" "$latest_postgres"
fi

if [[ -n "$latest_objects" ]]; then
  "$(dirname "$0")/restore-object-storage.sh" "$latest_objects"
fi
