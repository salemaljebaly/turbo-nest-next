#!/bin/sh
set -eu

cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_OBJECT="${1:-}"

if [ -z "$BACKUP_OBJECT" ]; then
  echo "Usage: $0 s3/path/to/postgres.dump"
  echo "Example: $0 single-server/postgres/postgres-20260425-030000.dump"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_DB:=appdb}"
: "${BACKUP_DIR:=/tmp/turbo-nest-next-backups}"
: "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT is required}"
: "${BACKUP_S3_REGION:=auto}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY is required}"
: "${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY is required}"

restore_dir="$BACKUP_DIR/restore"
mkdir -p "$restore_dir"
restore_file="$restore_dir/postgres.dump"

echo "Downloading Postgres dump..."
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  -e AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
  -v "$restore_dir:/restore" \
  amazon/aws-cli:2.32.3 \
  s3 cp "s3://$BACKUP_S3_BUCKET/$BACKUP_OBJECT" "/restore/postgres.dump" \
  --endpoint-url "$BACKUP_S3_ENDPOINT"

echo "Restoring Postgres dump into $POSTGRES_DB..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  < "$restore_file"

echo "Restore complete."
