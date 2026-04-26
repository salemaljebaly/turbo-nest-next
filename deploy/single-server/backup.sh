#!/bin/sh
set -eu

cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

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
: "${BACKUP_S3_PREFIX:=single-server}"
: "${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY is required}"
: "${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY is required}"
: "${BACKUP_RETENTION_DAYS:=7}"

stamp="$(date -u +%Y%m%d-%H%M%S)"
backup_dir="$BACKUP_DIR/$stamp"
mkdir -p "$backup_dir"

echo "Creating Postgres dump..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "$backup_dir/postgres.dump"

echo "Uploading Postgres dump..."
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  -e AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
  -v "$backup_dir:/backup:ro" \
  amazon/aws-cli:2.32.3 \
  s3 cp "/backup/postgres.dump" \
  "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/postgres/postgres-$stamp.dump" \
  --endpoint-url "$BACKUP_S3_ENDPOINT"

if [ -n "${MINIO_BUCKET:-}" ]; then
  echo "Mirroring MinIO bucket $MINIO_BUCKET..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T \
    -e BACKUP_S3_ENDPOINT="$BACKUP_S3_ENDPOINT" \
    -e BACKUP_S3_ACCESS_KEY="$BACKUP_S3_ACCESS_KEY" \
    -e BACKUP_S3_SECRET_KEY="$BACKUP_S3_SECRET_KEY" \
    -e BACKUP_S3_BUCKET="$BACKUP_S3_BUCKET" \
    -e BACKUP_S3_PREFIX="$BACKUP_S3_PREFIX" \
    -e MINIO_BUCKET="$MINIO_BUCKET" \
    minio sh -eu -c '
      mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
      mc alias set backup "$BACKUP_S3_ENDPOINT" "$BACKUP_S3_ACCESS_KEY" "$BACKUP_S3_SECRET_KEY" --api S3v4 >/dev/null
      mc mirror --overwrite "local/$MINIO_BUCKET" "backup/$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/minio/$MINIO_BUCKET"
    '
fi

if [ "$BACKUP_RETENTION_DAYS" -gt 0 ] 2>/dev/null; then
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$BACKUP_RETENTION_DAYS" -exec rm -rf {} +
fi

echo "Backup complete: $stamp"
