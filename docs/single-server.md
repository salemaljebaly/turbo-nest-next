# Single-Server Containers

This profile deploys the template to one server with Docker Compose. It follows
the same operational shape as the DAM project, but runs every runtime dependency
as a container.

## What Runs

- Caddy: HTTPS and reverse proxy
- Web: Next.js standalone image
- API: bundled NestJS image
- Postgres 17
- Redis 8
- RustFS S3-compatible object storage
- Worker: optional Compose profile
- Migrator: one-shot Drizzle migration profile
- Alloy: optional Grafana Cloud logs and metrics profile

## Server Prerequisites

- Ubuntu or Debian server
- Docker and Docker Compose plugin
- Git access to the repo
- DNS records:
  - `APP_DOMAIN` -> server IP
  - `API_DOMAIN` -> server IP

Only ports `22`, `80`, and `443` should be public. Do not expose Postgres,
Redis, or RustFS directly.

## First Setup

```bash
git clone git@github.com:salemaljebaly/turbo-nest-next.git /opt/turbo-nest-next
cd /opt/turbo-nest-next/deploy/single-server
cp .env.example .env
```

Edit `.env` and set real domains and secrets.

Run the first deployment:

```bash
./deploy.sh
```

`deploy.sh` builds the API, web, worker, and migrator images, starts
dependencies with `--wait`, runs the migration profile, starts runtime services,
and checks `APP_HEALTH_URL` when configured.

Run database migrations manually when needed:

```bash
docker compose --env-file .env -f docker-compose.yml \
  --profile migration run --rm migrate
```

## Daily Deploy

```bash
cd /opt/turbo-nest-next
git fetch --all --prune
git checkout main
git pull --ff-only
deploy/single-server/deploy.sh
```

Queued CI deploys use:

- `enqueue-deploy.sh` to validate and queue an exact commit.
- `async-deploy.sh` to fetch that commit and run deploy in the background.
- `install-ci-access.sh` to install host commands for a restricted deploy user.
- `remote-deploy.sh` for a developer-triggered SSH deploy.
- `redeploy.sh` for a pull-and-redeploy on the host.

## Worker

The worker is optional:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml \
  --profile worker up -d worker
```

## Operations

Check containers:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml ps
```

Follow logs:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml logs -f api web caddy
```

Restart one service:

```bash
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml restart api
```

## Observability

Enable Alloy after setting Grafana Cloud variables in `.env`:

```bash
docker compose --env-file .env -f docker-compose.yml \
  --profile observability up -d alloy
```

See [Observability](./observability.md).

## Backups

Use [S3 backups](./backups.md) for the single-server profile. At minimum, a
production server needs:

- Postgres dump backups
- object storage backups
- restore test steps

Do not consider backups complete until restore has been tested.

Restore helpers:

- `restore-postgres.sh`: restore a PostgreSQL dump.
- `restore-object-storage.sh`: restore a generic object storage archive.
- `recover-latest.sh`: restore latest database and object storage archives.
- `restore-drill.sh`: run the latest restore path as a drill.
