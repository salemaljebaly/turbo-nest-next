export interface CloudInitOptions {
  apiDomain: string;
  appDomain: string;
  appName?: string;
  backupRetentionDays?: string;
  backupS3AccessKey?: string;
  backupS3Bucket?: string;
  backupS3Endpoint?: string;
  backupS3Prefix?: string;
  backupS3Region?: string;
  backupS3SecretKey?: string;
  betterAuthSecret: string;
  githubRef?: string;
  githubRepo: string;
  githubToken: string;
  minioBucket?: string;
  minioRootPassword: string;
  minioRootUser: string;
  postgresPassword: string;
  redisPassword: string;
  sentryDsn?: string;
  sentryEnvironment?: string;
  sentryRelease?: string;
  sentrySampleRate?: string;
  sentrySmokeTestEnabled?: string;
  sentryTracesSampleRate?: string;
  smtpFrom?: string;
  smtpHost?: string;
  smtpPass?: string;
  smtpPort?: string;
  smtpSecure?: string;
  smtpUser?: string;
}

function indentBlock(value: string, spaces: number): string {
  const prefix = " ".repeat(spaces);

  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function escapeEnv(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"');
}

function envLine(key: string, value: string): string {
  return `${key}="${escapeEnv(value)}"`;
}

export function buildCloudInit(options: CloudInitOptions): string {
  const {
    apiDomain,
    appDomain,
    appName,
    backupRetentionDays,
    backupS3AccessKey,
    backupS3Bucket,
    backupS3Endpoint,
    backupS3Prefix,
    backupS3Region,
    backupS3SecretKey,
    betterAuthSecret,
    githubRef,
    githubRepo,
    githubToken,
    minioBucket,
    minioRootPassword,
    minioRootUser,
    postgresPassword,
    redisPassword,
    sentryDsn,
    sentryEnvironment,
    sentryRelease,
    sentrySampleRate,
    sentrySmokeTestEnabled,
    sentryTracesSampleRate,
    smtpFrom,
    smtpHost,
    smtpPass,
    smtpPort,
    smtpSecure,
    smtpUser,
  } = options;

  const githubTokenBase64 = Buffer.from(githubToken, "utf8").toString("base64");

  const appUrl = `https://${appDomain}`;
  const apiUrl = `https://${apiDomain}`;

  const envFile = [
    envLine("APP_DOMAIN", appDomain),
    envLine("API_DOMAIN", apiDomain),
    envLine("API_IMAGE", "turbo-nest-next-api:single-server"),
    envLine("WEB_IMAGE", "turbo-nest-next-web:single-server"),
    envLine("WORKER_IMAGE", "turbo-nest-next-worker:single-server"),
    envLine("NODE_VERSION", "22"),
    envLine("APP_NAME", appName ?? "MyApp"),
    envLine("APP_URL", appUrl),
    envLine("CORS_ORIGINS", appUrl),
    envLine("BETTER_AUTH_URL", apiUrl),
    envLine("NEXT_PUBLIC_API_URL", `${apiUrl}/api`),
    envLine("NEXT_PUBLIC_AUTH_URL", apiUrl),
    envLine("BETTER_AUTH_SECRET", betterAuthSecret),
    envLine("POSTGRES_PASSWORD", postgresPassword),
    envLine("REDIS_PASSWORD", redisPassword),
    envLine("MINIO_ROOT_USER", minioRootUser),
    envLine("MINIO_ROOT_PASSWORD", minioRootPassword),
    envLine("POSTGRES_USER", "postgres"),
    envLine("POSTGRES_DB", "appdb"),
    envLine(
      "DATABASE_URL",
      `postgresql://postgres:${postgresPassword}@postgres:5432/appdb`,
    ),
    envLine("DB_POOL_MAX", "10"),
    envLine("DB_IDLE_TIMEOUT", "20"),
    envLine("DB_CONNECT_TIMEOUT", "10"),
    envLine("REDIS_URL", `redis://:${redisPassword}@redis:6379`),
    envLine("QUEUE_PREFIX", "template"),
    envLine("SENTRY_DSN", sentryDsn ?? ""),
    envLine("SENTRY_ENVIRONMENT", sentryEnvironment ?? "production"),
    envLine("SENTRY_RELEASE", sentryRelease ?? ""),
    envLine("SENTRY_SAMPLE_RATE", sentrySampleRate ?? "1"),
    envLine("SENTRY_TRACES_SAMPLE_RATE", sentryTracesSampleRate ?? "0"),
    envLine("SENTRY_SMOKE_TEST_ENABLED", sentrySmokeTestEnabled ?? "false"),
    envLine("SMTP_HOST", smtpHost ?? ""),
    envLine("SMTP_PORT", smtpPort ?? ""),
    envLine("SMTP_SECURE", smtpSecure ?? "false"),
    envLine("SMTP_USER", smtpUser ?? ""),
    envLine("SMTP_PASS", smtpPass ?? ""),
    envLine("SMTP_FROM", smtpFrom ?? "MyApp <noreply@example.com>"),
    envLine("BACKUP_DIR", "/var/backups/turbo-nest-next"),
    envLine("BACKUP_S3_ENDPOINT", backupS3Endpoint ?? ""),
    envLine("BACKUP_S3_REGION", backupS3Region ?? "auto"),
    envLine("BACKUP_S3_BUCKET", backupS3Bucket ?? ""),
    envLine("BACKUP_S3_PREFIX", backupS3Prefix ?? "single-server"),
    envLine("BACKUP_S3_ACCESS_KEY", backupS3AccessKey ?? ""),
    envLine("BACKUP_S3_SECRET_KEY", backupS3SecretKey ?? ""),
    envLine("BACKUP_RETENTION_DAYS", backupRetentionDays ?? "7"),
    envLine("MINIO_BUCKET", minioBucket ?? "uploads"),
  ].join("\n");

  const bootstrapScript = `#!/bin/bash
set -euxo pipefail

exec >> /var/log/turbo-nest-next-init.log 2>&1

install -d -m 0700 /root/.config/turbo-nest-next
base64 -d /root/.github_token.b64 > /root/.config/turbo-nest-next/github_token
chmod 600 /root/.config/turbo-nest-next/github_token
rm -f /root/.github_token.b64

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker

install -d -m 0755 /opt/turbo-nest-next

if [ ! -d /opt/turbo-nest-next/.git ]; then
  GITHUB_TOKEN=$(cat /root/.config/turbo-nest-next/github_token)
  git clone --depth=1 --branch "${githubRef ?? "main"}" "https://x-access-token:$GITHUB_TOKEN@github.com/${githubRepo}.git" /opt/turbo-nest-next
fi

install -m 0600 /etc/turbo-nest-next.env /opt/turbo-nest-next/deploy/single-server/.env

cd /opt/turbo-nest-next
deploy/single-server/deploy.sh

if [ -n "${backupS3Endpoint ?? ""}" ] && [ -n "${backupS3Bucket ?? ""}" ]; then
  systemctl enable --now turbo-nest-next-backup.timer
fi
`;

  const deployScript = `#!/bin/bash
set -euxo pipefail

exec >> /var/log/turbo-nest-next-deploy.log 2>&1
echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy start ==="

cd /opt/turbo-nest-next

git fetch --all --prune
git checkout "${githubRef ?? "main"}"
git pull --ff-only

install -m 0600 /etc/turbo-nest-next.env deploy/single-server/.env
deploy/single-server/deploy.sh

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) deploy ok ==="
`;

  const backupService = `[Unit]
Description=turbo-nest-next backup to S3
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/turbo-nest-next
ExecStart=/opt/turbo-nest-next/deploy/single-server/backup.sh
StandardOutput=journal
StandardError=journal`;

  const backupTimer = `[Unit]
Description=Daily turbo-nest-next backup

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true
RandomizedDelaySec=15min

[Install]
WantedBy=timers.target`;

  return `#cloud-config
package_update: true
packages:
  - ca-certificates
  - curl
  - git
  - gnupg
  - ufw
write_files:
  - path: /root/.github_token.b64
    permissions: '0600'
    owner: root:root
    content: |
${indentBlock(githubTokenBase64, 6)}
  - path: /etc/turbo-nest-next.env
    permissions: '0600'
    owner: root:root
    content: |
${indentBlock(envFile, 6)}
  - path: /usr/local/bin/bootstrap-turbo-nest-next.sh
    permissions: '0700'
    owner: root:root
    content: |
${indentBlock(bootstrapScript, 6)}
  - path: /usr/local/bin/deploy-turbo-nest-next.sh
    permissions: '0755'
    owner: root:root
    content: |
${indentBlock(deployScript, 6)}
  - path: /etc/systemd/system/turbo-nest-next-backup.service
    permissions: '0644'
    owner: root:root
    content: |
${indentBlock(backupService, 6)}
  - path: /etc/systemd/system/turbo-nest-next-backup.timer
    permissions: '0644'
    owner: root:root
    content: |
${indentBlock(backupTimer, 6)}
runcmd:
  - [ufw, allow, "22/tcp"]
  - [ufw, allow, "80/tcp"]
  - [ufw, allow, "443/tcp"]
  - [bash, -lc, "set -euxo pipefail; exec >> /var/log/turbo-nest-next-init.log 2>&1; yes | ufw enable"]
  - [systemctl, daemon-reload]
  - [bash, -lc, "/usr/local/bin/bootstrap-turbo-nest-next.sh"]
  - [bash, -lc, "echo 'turbo-nest-next init completed successfully' >> /var/log/turbo-nest-next-init.log"]
`;
}
