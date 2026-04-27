# S3 Backups

The single-server profile includes scripts for S3-compatible backups.

Backups cover:

- Postgres custom-format dumps
- RustFS bucket mirroring to a remote S3-compatible bucket

The scripts work with AWS S3, Hetzner Object Storage, Cloudflare R2, Backblaze
B2 S3, RustFS, or any provider with compatible S3 APIs.

## Configure

Edit `deploy/single-server/.env`:

```env
BACKUP_DIR=/tmp/turbo-nest-next-backups
BACKUP_S3_ENDPOINT=https://s3.example.com
BACKUP_S3_REGION=auto
BACKUP_S3_BUCKET=template-backups
BACKUP_S3_PREFIX=single-server
BACKUP_S3_ACCESS_KEY=change-me
BACKUP_S3_SECRET_KEY=change-me
BACKUP_RETENTION_DAYS=7
RUSTFS_BUCKET=uploads
RUSTFS_ACCESS_KEY=change-me
RUSTFS_SECRET_KEY=change-me
```

Use credentials that can write only to the backup bucket.
Remote retention should be enforced with the S3 provider lifecycle policy. The
script only removes old local backup working directories.

## Run Backup

```bash
deploy/single-server/backup.sh
```

The script:

1. Creates a Postgres `pg_dump --format=custom` dump.
2. Uploads the dump to S3.
3. Mirrors the configured RustFS bucket to S3 when `RUSTFS_BUCKET` is set.

## Restore Postgres

List backups with your S3 provider tooling, then restore one object:

```bash
deploy/single-server/restore-postgres.sh \
  single-server/postgres/postgres-20260425-030000.dump
```

The restore uses:

```bash
pg_restore --clean --if-exists
```

Run restores in staging first. Restoring into production replaces existing
tables from the dump.

## Restore Object Storage

Use AWS CLI in the opposite direction:

```bash
set -a
. deploy/single-server/.env
set +a

restore_dir=/tmp/turbo-nest-next-rustfs-restore
mkdir -p "$restore_dir"

docker run --rm \
  -e BACKUP_S3_ENDPOINT="$BACKUP_S3_ENDPOINT" \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  -e AWS_DEFAULT_REGION="$BACKUP_S3_REGION" \
  -v "$restore_dir:/restore" \
  amazon/aws-cli:2.32.3 \
  s3 sync "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/rustfs/$RUSTFS_BUCKET" \
  "/restore" \
  --endpoint-url "$BACKUP_S3_ENDPOINT"

rustfs_container="$(docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml ps -q rustfs)"

docker run --rm \
  --network "container:$rustfs_container" \
  -e AWS_ACCESS_KEY_ID="$RUSTFS_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$RUSTFS_SECRET_KEY" \
  -e AWS_DEFAULT_REGION="us-east-1" \
  -v "$restore_dir:/restore:ro" \
  amazon/aws-cli:2.32.3 \
  s3 sync "/restore" "s3://$RUSTFS_BUCKET" \
  --endpoint-url "http://127.0.0.1:9000"
```

## Schedule

Use cron or a systemd timer on the server:

```cron
0 3 * * * cd /opt/turbo-nest-next && deploy/single-server/backup.sh >> /var/log/turbo-nest-next-backup.log 2>&1
```

## Rule

Backup is not complete until restore is tested. At minimum, test:

- Postgres restore into a clean staging database
- object storage mirror restore into an empty bucket
- application startup after restore
