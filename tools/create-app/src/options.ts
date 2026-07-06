export type StorageProvider = "minio" | "s3";

export type ScaffoldOptions = {
  projectName: string;
  slug: string;
  targetDir: string;
  includeWorker: boolean;
  includeAi: boolean;
  storageProvider: StorageProvider;
  runInstall: boolean;
  runInfra: boolean;
};

export type ParsedArgs = {
  yes: boolean;
  projectName?: string;
  slug?: string;
  targetDir?: string;
  includeWorker?: boolean;
  includeAi?: boolean;
  storageProvider?: StorageProvider;
  runInstall?: boolean;
  runInfra?: boolean;
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function titleize(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { yes: false };
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--yes" || arg === "-y") {
      parsed.yes = true;
    } else if (arg === "--name" && next) {
      parsed.projectName = next;
      index += 1;
    } else if (arg === "--slug" && next) {
      parsed.slug = slugify(next);
      index += 1;
    } else if (arg === "--target" && next) {
      parsed.targetDir = next;
      index += 1;
    } else if (arg === "--worker") {
      parsed.includeWorker = true;
    } else if (arg === "--no-worker") {
      parsed.includeWorker = false;
    } else if (arg === "--ai") {
      parsed.includeAi = true;
    } else if (arg === "--no-ai") {
      parsed.includeAi = false;
    } else if (arg === "--storage" && isStorageProvider(next)) {
      parsed.storageProvider = next;
      index += 1;
    } else if (arg === "--install") {
      parsed.runInstall = true;
    } else if (arg === "--no-install") {
      parsed.runInstall = false;
    } else if (arg === "--infra") {
      parsed.runInfra = true;
    } else if (arg === "--no-infra") {
      parsed.runInfra = false;
    } else if (arg?.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (arg) {
      positional.push(arg);
    }
  }

  parsed.projectName ??= positional[0];
  return parsed;
}

export function isStorageProvider(value: unknown): value is StorageProvider {
  return value === "minio" || value === "s3";
}
