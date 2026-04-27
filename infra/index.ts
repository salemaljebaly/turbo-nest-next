import * as cloudflare from "@pulumi/cloudflare";
import * as hcloud from "@pulumi/hcloud";
import * as pulumi from "@pulumi/pulumi";

import { buildCloudInit } from "./cloud-init";

const stack = pulumi.getStack();
const project = pulumi.getProject();
const config = new pulumi.Config(project);

const appDomain = process.env.APP_DOMAIN;
const apiDomain = process.env.API_DOMAIN;
const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID;
const githubRepo = process.env.GITHUB_REPO;
const githubToken = process.env.GITHUB_TOKEN;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const postgresPassword = process.env.POSTGRES_PASSWORD;
const redisPassword = process.env.REDIS_PASSWORD;
const rustfsAccessKey = process.env.RUSTFS_ACCESS_KEY;
const rustfsSecretKey = process.env.RUSTFS_SECRET_KEY;

if (!appDomain) throw new pulumi.RunError("APP_DOMAIN must be set in .env");
if (!apiDomain) throw new pulumi.RunError("API_DOMAIN must be set in .env");
if (!cloudflareZoneId)
  throw new pulumi.RunError("CLOUDFLARE_ZONE_ID must be set in .env");
if (!githubRepo) throw new pulumi.RunError("GITHUB_REPO must be set in .env");
if (!githubToken) throw new pulumi.RunError("GITHUB_TOKEN must be set in .env");
if (!betterAuthSecret)
  throw new pulumi.RunError("BETTER_AUTH_SECRET must be set in .env");
if (!postgresPassword)
  throw new pulumi.RunError("POSTGRES_PASSWORD must be set in .env");
if (!redisPassword)
  throw new pulumi.RunError("REDIS_PASSWORD must be set in .env");
if (!rustfsAccessKey)
  throw new pulumi.RunError("RUSTFS_ACCESS_KEY must be set in .env");
if (!rustfsSecretKey)
  throw new pulumi.RunError("RUSTFS_SECRET_KEY must be set in .env");

const sshPublicKey = config.require("sshPublicKey");
const serverType = config.get("serverType") ?? "cax21";
const location = config.get("location") ?? "nbg1";
const cloudflareProxied = config.getBoolean("cloudflareProxied") ?? false;

const namePrefix = `${project}-${stack}`;
const normalizedSshPublicKey = sshPublicKey.trim();

function dnsRecordName(domain: string): string {
  const domainParts = domain.split(".");

  return domainParts.length > 2 ? domainParts.slice(0, -2).join(".") : "@";
}

const userData = buildCloudInit({
  apiDomain,
  appDomain,
  appName: process.env.APP_NAME,
  backupRetentionDays: process.env.BACKUP_RETENTION_DAYS,
  backupS3AccessKey: process.env.BACKUP_S3_ACCESS_KEY,
  backupS3Bucket: process.env.BACKUP_S3_BUCKET,
  backupS3Endpoint: process.env.BACKUP_S3_ENDPOINT,
  backupS3Prefix: process.env.BACKUP_S3_PREFIX,
  backupS3Region: process.env.BACKUP_S3_REGION,
  backupS3SecretKey: process.env.BACKUP_S3_SECRET_KEY,
  betterAuthSecret,
  githubRef: process.env.GITHUB_REF,
  githubRepo,
  githubToken,
  rustfsAccessKey,
  rustfsBucket: process.env.RUSTFS_BUCKET,
  rustfsSecretKey,
  postgresPassword,
  redisPassword,
  sentryDsn: process.env.SENTRY_DSN,
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
  sentryRelease: process.env.SENTRY_RELEASE,
  sentrySampleRate: process.env.SENTRY_SAMPLE_RATE,
  sentrySmokeTestEnabled: process.env.SENTRY_SMOKE_TEST_ENABLED,
  sentryTracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
  smtpFrom: process.env.SMTP_FROM,
  smtpHost: process.env.SMTP_HOST,
  smtpPass: process.env.SMTP_PASS,
  smtpPort: process.env.SMTP_PORT,
  smtpSecure: process.env.SMTP_SECURE,
  smtpUser: process.env.SMTP_USER,
});

const sshKey = new hcloud.SshKey(
  `${namePrefix}-ssh-key`,
  {
    name: `${namePrefix}-ssh-key`,
    publicKey: normalizedSshPublicKey,
  },
  {
    ignoreChanges: ["name", "publicKey"],
  },
);

const firewall = new hcloud.Firewall(`${namePrefix}-firewall`, {
  name: `${namePrefix}-firewall`,
  rules: [
    {
      description: "Allow SSH",
      direction: "in",
      port: "22",
      protocol: "tcp",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
    {
      description: "Allow HTTP",
      direction: "in",
      port: "80",
      protocol: "tcp",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
    {
      description: "Allow HTTPS",
      direction: "in",
      port: "443",
      protocol: "tcp",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
    {
      description: "Allow all outbound TCP",
      destinationIps: ["0.0.0.0/0", "::/0"],
      direction: "out",
      port: "1-65535",
      protocol: "tcp",
    },
    {
      description: "Allow all outbound UDP",
      destinationIps: ["0.0.0.0/0", "::/0"],
      direction: "out",
      port: "1-65535",
      protocol: "udp",
    },
    {
      description: "Allow all outbound ICMP",
      destinationIps: ["0.0.0.0/0", "::/0"],
      direction: "out",
      protocol: "icmp",
    },
  ],
});

const server = new hcloud.Server(namePrefix, {
  image: "ubuntu-24.04",
  location,
  name: namePrefix,
  publicNets: [
    {
      ipv4Enabled: true,
      ipv6Enabled: true,
    },
  ],
  serverType,
  sshKeys: [sshKey.id],
  userData,
});

new hcloud.FirewallAttachment(`${namePrefix}-firewall-attachment`, {
  firewallId: firewall.id.apply(Number),
  serverIds: [server.id.apply(Number)],
});

new cloudflare.DnsRecord(`${namePrefix}-app-dns`, {
  content: server.ipv4Address,
  name: dnsRecordName(appDomain),
  proxied: cloudflareProxied,
  ttl: cloudflareProxied ? 1 : 300,
  type: "A",
  zoneId: cloudflareZoneId,
});

new cloudflare.DnsRecord(`${namePrefix}-api-dns`, {
  content: server.ipv4Address,
  name: dnsRecordName(apiDomain),
  proxied: cloudflareProxied,
  ttl: cloudflareProxied ? 1 : 300,
  type: "A",
  zoneId: cloudflareZoneId,
});

export const serverIp = server.ipv4Address;
export const sshCommand = pulumi.interpolate`ssh root@${server.ipv4Address}`;
export const appUrl = `https://${appDomain}`;
export const apiUrl = `https://${apiDomain}/api`;
