import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import type { ScaffoldOptions } from "./options.js";
import { titleize } from "./options.js";

type JsonObject = Record<string, unknown>;

const SOURCE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

export type ScaffoldResult = {
  targetDir: string;
  slug: string;
  installed: boolean;
  infraStarted: boolean;
};

export function templateRoot() {
  return process.env["CREATE_APP_TEMPLATE_ROOT"] ?? SOURCE_ROOT;
}

export async function scaffoldApp(
  options: ScaffoldOptions,
  onStep: (message: string) => void = () => undefined,
): Promise<ScaffoldResult> {
  const root = templateRoot();
  const targetDir = resolve(options.targetDir);

  await assertWritableTarget(targetDir);
  onStep(`Copying template into ${pc.cyan(targetDir)}`);
  await copyTemplate(root, targetDir);

  onStep("Applying project names and options");
  await rewriteTemplate(targetDir, options);
  await stripScaffolderReferences(targetDir);
  await applyOptionManifest(targetDir, options);
  await createEnvFile(targetDir);

  if (options.runInstall) {
    onStep("Installing dependencies");
    await run("pnpm", ["install", "--no-frozen-lockfile"], targetDir);
  }

  if (options.runInfra) {
    onStep("Starting local infrastructure");
    await run("pnpm", ["infra:up"], targetDir);
    await run("pnpm", ["db:migrate"], targetDir);
  }

  return {
    targetDir,
    slug: options.slug,
    installed: options.runInstall,
    infraStarted: options.runInfra,
  };
}

export async function assertWritableTarget(targetDir: string) {
  try {
    const target = await stat(targetDir);
    if (!target.isDirectory()) {
      throw new Error(`${targetDir} exists and is not a directory.`);
    }
    const entries = await import("node:fs/promises").then((fs) =>
      fs.readdir(targetDir),
    );
    if (entries.length > 0) {
      throw new Error(`${targetDir} already exists and is not empty.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(targetDir, { recursive: true });
  }
}

async function copyTemplate(sourceRoot: string, targetDir: string) {
  await cp(sourceRoot, targetDir, {
    recursive: true,
    filter: (source) => shouldCopy(sourceRoot, source),
  });
}

function shouldCopy(sourceRoot: string, source: string) {
  const rel = normalizePath(relative(sourceRoot, source));
  if (!rel) return true;

  if (rel === "tools/create-app" || rel.startsWith("tools/create-app/")) {
    return false;
  }

  const parts = rel.split("/");
  if (parts.some((part) => EXCLUDED_DIRS.has(part))) return false;

  const name = basename(source);
  if (
    name === ".env" ||
    name === ".env.local" ||
    name === ".env.test.local" ||
    name === ".env.production.local" ||
    name === ".env.development.local"
  ) {
    return false;
  }

  return true;
}

export async function rewriteTemplate(
  targetDir: string,
  options: Pick<ScaffoldOptions, "slug" | "storageProvider">,
) {
  const title = titleize(options.slug);
  const replacements: Array<[RegExp, string]> = [
    [/turbo-nest-next/g, options.slug],
    [/turbo_nest_next/g, options.slug.replaceAll("-", "_")],
    [/Template Admin/g, `${title} Admin`],
    [/Production starter/g, title],
    [/template\.ping/g, `${options.slug}.ping`],
    [/template-test/g, `${options.slug}-test`],
    [/todo:/g, `${options.slug}:`],
  ];

  await visitFiles(targetDir, async (file) => {
    if (!isTextFile(file)) return;
    const before = await readFile(file, "utf8");
    let after = before;
    for (const [pattern, value] of replacements) {
      after = after.replace(pattern, value);
    }
    if (options.storageProvider === "minio") {
      after = after
        .replace(
          /STORAGE_ENDPOINT=http:\/\/localhost:9000/g,
          "STORAGE_ENDPOINT=http://localhost:9100",
        )
        .replace(
          /STORAGE_ACCESS_KEY=rustfsadmin/g,
          "STORAGE_ACCESS_KEY=minioadmin",
        )
        .replace(
          /STORAGE_SECRET_KEY=rustfsadmin/g,
          "STORAGE_SECRET_KEY=minioadmin",
        );
    }
    if (before !== after) await writeFile(file, after);
  });
}

async function applyOptionManifest(
  targetDir: string,
  options: ScaffoldOptions,
) {
  if (!options.includeWorker) {
    await removePaths(targetDir, ["apps/worker"]);
    await updateJson(join(targetDir, "package.json"), (json) => {
      const scripts = json["scripts"];
      if (isJsonObject(scripts)) {
        delete scripts["worker:dev"];
        delete scripts["worker:start"];
      }
    });
    await removeLines(targetDir, [
      ["apps/api/Dockerfile", /COPY apps\/worker\/package\.json/],
      ["apps/web/Dockerfile", /COPY apps\/worker\/package\.json/],
      ["deploy/single-server/deploy.sh", /worker/],
    ]);
    await removeYamlService(
      join(targetDir, "deploy/single-server/docker-compose.yml"),
      "worker",
    );
  }

  if (!options.includeAi) {
    await removePaths(targetDir, [
      "apps/api/src/ai",
      "apps/web/components/chat-widget.tsx",
      "docs/ai.md",
      "packages/ai",
      "packages/db/src/schema/ai.ts",
      "packages/db/drizzle/0004_icy_pet_avengers.sql",
      "packages/db/drizzle/meta/0004_snapshot.json",
    ]);
    await stripAiReferences(targetDir);
  }

  if (options.storageProvider === "s3") {
    await removeYamlService(
      join(targetDir, "docker/docker-compose.yml"),
      "rustfs",
    );
    await removeYamlService(
      join(targetDir, "docker/docker-compose.yml"),
      "minio",
    );
    await removeYamlService(
      join(targetDir, "docker/docker-compose.test.yml"),
      "rustfs",
    );
    await removeYamlService(
      join(targetDir, "docker/docker-compose.test.yml"),
      "minio",
    );
    await removeYamlService(
      join(targetDir, "deploy/single-server/docker-compose.yml"),
      "rustfs",
    );
  }
}

async function stripScaffolderReferences(targetDir: string) {
  await removePaths(targetDir, ["docs/create-app.md"]);
  await updateJson(join(targetDir, "package.json"), (json) => {
    const scripts = json["scripts"];
    if (isJsonObject(scripts)) {
      delete scripts["create:dev"];
      delete scripts["create:build"];
      delete scripts["create:test"];
      delete scripts["create:test:e2e"];
    }
  });
  await removeLines(targetDir, [
    ["README.md", /Create-app scaffolder|create-turbo-nest-next/],
    ["pnpm-workspace.yaml", /tools\/\*/],
  ]);
}

async function stripAiReferences(targetDir: string) {
  await updateJson(join(targetDir, "apps/api/package.json"), (json) => {
    const dependencies = json["dependencies"];
    if (isJsonObject(dependencies)) {
      delete dependencies["@repo/ai"];
      delete dependencies["ai"];
    }
    const scripts = json["scripts"];
    if (isJsonObject(scripts)) {
      scripts["deps:prepare"] = String(scripts["deps:prepare"])
        .replace(" && pnpm --filter=@repo/ai build", "")
        .trim();
    }
  });
  await updateJson(join(targetDir, "apps/web/package.json"), (json) => {
    const dependencies = json["dependencies"];
    if (isJsonObject(dependencies)) {
      delete dependencies["@ai-sdk/react"];
      delete dependencies["ai"];
    }
  });
  await updateJson(
    join(targetDir, "packages/db/drizzle/meta/_journal.json"),
    (json) => {
      if (Array.isArray(json["entries"])) {
        json["entries"] = json["entries"].filter(
          (entry) =>
            !isJsonObject(entry) || entry["tag"] !== "0004_icy_pet_avengers",
        );
      }
    },
  );
  await editFileIfExists(
    join(targetDir, "apps/api/src/common/errors/error-codes.ts"),
    (text) =>
      text.replace(
        /\n\s{2}AI_NOT_CONFIGURED: \{\n\s{4}status: HttpStatus\.SERVICE_UNAVAILABLE,\n\s{4}message: 'AI provider credentials are not configured',\n\s{2}\},/,
        "",
      ),
  );

  await removeLines(targetDir, [
    ["apps/api/src/app.module.ts", /AiModule/],
    ["apps/web/app/dashboard/page.tsx", /ChatWidget/],
    ["packages/db/src/schema/index.ts", /\.\/ai\.js/],
    ["packages/types/src/error-codes.ts", /AI_NOT_CONFIGURED/],
    ["apps/web/lib/i18n.ts", /AI_NOT_CONFIGURED/],
    [
      "apps/api/src/config/env.validation.ts",
      /AI_PROVIDER|AI_MODEL|ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY/,
    ],
    ["README.md", /AI package|AI assistant/],
    [
      ".env.example",
      /AI_PROVIDER|AI_MODEL|ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|AI chat widget/,
    ],
    [
      "deploy/single-server/.env.example",
      /AI_PROVIDER|AI_MODEL|ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY/,
    ],
    [
      "deploy/single-server/docker-compose.yml",
      /AI_PROVIDER|AI_MODEL|ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY/,
    ],
  ]);
}

async function createEnvFile(targetDir: string) {
  const source = join(targetDir, ".env.example");
  const target = join(targetDir, ".env");
  try {
    await stat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await cp(source, target);
  }
}

async function removePaths(targetDir: string, paths: string[]) {
  await Promise.all(
    paths.map((path) =>
      rm(join(targetDir, path), { force: true, recursive: true }),
    ),
  );
}

async function removeLines(
  targetDir: string,
  entries: Array<[string, RegExp]>,
) {
  for (const [path, pattern] of entries) {
    const file = join(targetDir, path);
    await editFileIfExists(file, (text) =>
      text
        .split("\n")
        .filter((line) => !pattern.test(line))
        .join("\n"),
    );
  }
}

async function removeYamlService(file: string, serviceName: string) {
  await editFileIfExists(file, (text) => {
    const lines = text.split("\n");
    const start = lines.findIndex((line) => line === `  ${serviceName}:`);
    if (start === -1) return text;
    let end = start + 1;
    while (
      end < lines.length &&
      !/^\s{2}[a-zA-Z0-9_-]+:/.test(lines[end] ?? "")
    ) {
      end += 1;
    }
    lines.splice(start, end - start);
    return lines
      .join("\n")
      .replace(new RegExp(`\\n  ${serviceName}_data:\\n`, "g"), "\n");
  });
}

async function updateJson(file: string, mutate: (json: JsonObject) => void) {
  await editFileIfExists(file, (text) => {
    const json = JSON.parse(text) as JsonObject;
    mutate(json);
    return `${JSON.stringify(json, null, 2)}\n`;
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function editFileIfExists(file: string, edit: (text: string) => string) {
  try {
    const before = await readFile(file, "utf8");
    const after = edit(before);
    if (before !== after) await writeFile(file, after);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function visitFiles(
  dir: string,
  visitor: (file: string) => Promise<void>,
) {
  const fs = await import("node:fs/promises");
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await visitFiles(fullPath, visitor);
    } else if (entry.isFile()) {
      await visitor(fullPath);
    }
  }
}

function isTextFile(file: string) {
  const name = basename(file);
  if (name.startsWith(".env")) return true;
  return TEXT_EXTENSIONS.has(name.slice(name.lastIndexOf(".")));
}

function normalizePath(path: string) {
  return path.split(sep).join("/");
}

async function run(command: string, args: string[], cwd: string) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: "true" },
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else
        reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
    child.on("error", reject);
  });
}
