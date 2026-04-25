# Pulumi Single-Server Infrastructure

Pulumi TypeScript infrastructure for provisioning the single-server container
profile. It follows the same DAM project shape:

- Hetzner Cloud server
- Hetzner firewall
- Hetzner SSH key
- Cloudflare DNS records
- cloud-init bootstrap
- daily systemd backup timer

The application runtime still uses `deploy/single-server/docker-compose.yml`.
Pulumi owns the server and DNS; Docker Compose owns the app containers on that
server.

## Prerequisites

- Pulumi CLI
- pnpm
- Hetzner Cloud API token exported as `HCLOUD_TOKEN`
- Cloudflare API token exported as `CLOUDFLARE_API_TOKEN`
- GitHub token with read access to `GITHUB_REPO`
- Cloudflare DNS zone ID

## Configure

```bash
cd infra
pnpm install --ignore-workspace
cp .env.example .env
set -a && source .env && set +a
pulumi stack init dev
pulumi config set turbo-nest-next:sshPublicKey "$(cat ~/.ssh/id_ed25519.pub)"
pulumi config set turbo-nest-next:serverType cax21
pulumi config set turbo-nest-next:location nbg1
pulumi config set turbo-nest-next:cloudflareProxied false
```

`Pulumi.yaml` uses `backend.url: file://~`, matching the DAM local-state
approach.

## Preview And Deploy

```bash
cd infra
set -a && source .env && set +a
pnpm preview
pnpm up
pnpm outputs
```

Expected resources:

- 1 Hetzner SSH key
- 1 Hetzner firewall
- 1 Hetzner firewall attachment
- 1 Hetzner server
- 2 Cloudflare DNS records: app and API

## Bootstrap Behavior

cloud-init will:

1. Install Docker.
2. Clone `GITHUB_REPO` at `GITHUB_REF`.
3. Write `/etc/turbo-nest-next.env`.
4. Copy that env file to `deploy/single-server/.env`.
5. Run `deploy/single-server/deploy.sh`.
6. Enable `turbo-nest-next-backup.timer` when backup S3 env values are set.

Use this on a fresh server first. Existing production servers should be imported
or migrated deliberately instead of replaced.

## Operations

SSH into the server:

```bash
$(pulumi stack output sshCommand)
```

Deploy the latest configured branch again:

```bash
sudo /usr/local/bin/deploy-turbo-nest-next.sh
```

Check app containers:

```bash
cd /opt/turbo-nest-next
docker compose --env-file deploy/single-server/.env \
  -f deploy/single-server/docker-compose.yml ps
```

Check cloud-init:

```bash
journalctl -u cloud-final -n 100
tail -f /var/log/turbo-nest-next-init.log
```

## Backups

The server uses the same validated backup pattern as the single-server backup
task:

- Postgres custom-format dump
- RustFS bucket mirror
- S3-compatible remote
- restore test required before considering backups complete

The Pulumi bootstrap enables `turbo-nest-next-backup.timer` only when
`BACKUP_S3_ENDPOINT` and `BACKUP_S3_BUCKET` are set.

Manual backup:

```bash
sudo /opt/turbo-nest-next/deploy/single-server/backup.sh
```

Restore is intentionally manual:

```bash
sudo /opt/turbo-nest-next/deploy/single-server/restore-postgres.sh \
  single-server/postgres/postgres-20260425-030000.dump
```
