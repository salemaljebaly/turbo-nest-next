# S3 Backups

The single-server profile includes scripts for S3-compatible backups.

Backups cover:

- Postgres custom-format dumps
- MinIO bucket mirroring to a remote S3-compatible bucket

The scripts work with AWS S3, Hetzner Object Storage, Cloudflare R2, Backblaze
B2 S3, MinIO, RustFS, or any provider with compatible S3 APIs.

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
MINIO_BUCKET=uploads
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
3. Mirrors the configured MinIO bucket to S3 when `MINIO_BUCKET` is set.

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

Use `mc mirror` in the opposite direction:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml \
  exec -T \
  -e BACKUP_S3_ENDPOINT="$BACKUP_S3_ENDPOINT" \
  -e BACKUP_S3_ACCESS_KEY="$BACKUP_S3_ACCESS_KEY" \
  -e BACKUP_S3_SECRET_KEY="$BACKUP_S3_SECRET_KEY" \
  -e BACKUP_S3_BUCKET="$BACKUP_S3_BUCKET" \
  -e BACKUP_S3_PREFIX="$BACKUP_S3_PREFIX" \
  -e MINIO_BUCKET="$MINIO_BUCKET" \
  minio sh -eu -c '
    mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
    mc alias set backup "$BACKUP_S3_ENDPOINT" "$BACKUP_S3_ACCESS_KEY" "$BACKUP_S3_SECRET_KEY" --api S3v4
    mc mirror --overwrite "backup/$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/minio/$MINIO_BUCKET" "local/$MINIO_BUCKET"
  '
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
