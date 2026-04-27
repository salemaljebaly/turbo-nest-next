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
: "${RUSTFS_ACCESS_KEY:=}"
: "${RUSTFS_SECRET_KEY:=}"

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

if [ -n "${RUSTFS_BUCKET:-}" ]; then
  : "${RUSTFS_ACCESS_KEY:?RUSTFS_ACCESS_KEY is required when RUSTFS_BUCKET is set}"
  : "${RUSTFS_SECRET_KEY:?RUSTFS_SECRET_KEY is required when RUSTFS_BUCKET is set}"

  rustfs_container="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps -q rustfs)"
  if [ -z "$rustfs_container" ]; then
    echo "RustFS container is not running"
    exit 1
  fi

  rustfs_backup_dir="$backup_dir/rustfs/$RUSTFS_BUCKET"
  mkdir -p "$rustfs_backup_dir"

  echo "Downloading RustFS bucket $RUSTFS_BUCKET..."
  docker run --rm \
    --network "container:$rustfs_container" \
    -e AWS_ACCESS_KEY_ID="$RUSTFS_ACCESS_KEY" \
    -e AWS_SECRET_ACCESS_KEY="$RUSTFS_SECRET_KEY" \
    -e AWS_DEFAULT_REGION="us-east-1" \
    -v "$rustfs_backup_dir:/rustfs-bucket" \
    amazon/aws-cli:2.32.3 \
    s3 sync "s3://$RUSTFS_BUCKET" "/rustfs-bucket" \
    --endpoint-url "http://127.0.0.1:9000"

  echo "Uploading RustFS bucket mirror..."
  docker run --rm \
    -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
    -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
    -e AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
    -v "$rustfs_backup_dir:/rustfs-bucket:ro" \
    amazon/aws-cli:2.32.3 \
    s3 sync "/rustfs-bucket" \
    "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/rustfs/$RUSTFS_BUCKET" \
    --endpoint-url "$BACKUP_S3_ENDPOINT"
fi

if [ "$BACKUP_RETENTION_DAYS" -gt 0 ] 2>/dev/null; then
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$BACKUP_RETENTION_DAYS" -exec rm -rf {} +
fi

echo "Backup complete: $stamp"
