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

Run database migrations from a trusted environment before serving real traffic:

```bash
pnpm db:migrate
```

The current production API image is optimized for runtime and does not include a
general-purpose migration runner. Add a dedicated migration job before using
this profile for unattended production deploys.

## Daily Deploy

```bash
cd /opt/turbo-nest-next
git fetch --all --prune
git checkout main
git pull --ff-only
deploy/single-server/deploy.sh
```

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

## Backups

Use [S3 backups](./backups.md) for the single-server profile. At minimum, a
production server needs:

- Postgres dump backups
- object storage backups
- restore test steps

Do not consider backups complete until restore has been tested.
