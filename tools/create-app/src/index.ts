#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolve } from "node:path";
import {
  isStorageProvider,
  parseArgs,
  slugify,
  titleize,
  type ScaffoldOptions,
} from "./options.js";
import { scaffoldApp } from "./scaffold.js";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  p.intro(pc.bgCyan(pc.black(" create-turbo-nest-next ")));

  const defaults = {
    projectName: args.projectName ?? "my-app",
    slug: args.slug ?? slugify(args.projectName ?? "my-app"),
    includeWorker: args.includeWorker ?? true,
    includeAi: args.includeAi ?? true,
    storageProvider: args.storageProvider ?? "minio",
    runInstall: args.runInstall ?? false,
    runInfra: args.runInfra ?? false,
  } as const;

  const answers = args.yes
    ? defaults
    : await p.group(
        {
          projectName: () =>
            p.text({
              message: "Project name",
              initialValue: defaults.projectName,
              validate: (value) =>
                slugify(value).length > 0 ? undefined : "Enter a project name.",
            }),
          slug: ({ results }) =>
            p.text({
              message: "Project slug",
              initialValue: slugify(String(results.projectName)),
              validate: (value) =>
                slugify(value) === value && value.length > 0
                  ? undefined
                  : "Use lowercase letters, numbers, and hyphens.",
            }),
          includeWorker: () =>
            p.confirm({
              message: "Include the background worker app?",
              initialValue: defaults.includeWorker,
            }),
          includeAi: () =>
            p.confirm({
              message: "Include the optional AI package and chat widget?",
              initialValue: defaults.includeAi,
            }),
          storageProvider: () =>
            p.select({
              message: "Storage provider",
              initialValue: defaults.storageProvider,
              options: [
                {
                  value: "minio",
                  label: "MinIO for local S3-compatible storage",
                },
                { value: "s3", label: "External S3-compatible storage" },
              ],
            }),
          runInstall: () =>
            p.confirm({
              message: "Run pnpm install now?",
              initialValue: defaults.runInstall,
            }),
          runInfra: ({ results }) =>
            p.confirm({
              message: "Start infra and run migrations after install?",
              initialValue: Boolean(results.runInstall) && defaults.runInfra,
            }),
        },
        {
          onCancel: () => {
            p.cancel("Scaffolding cancelled.");
            process.exit(0);
          },
        },
      );

  const slug = slugify(String(answers.slug));
  const storageProvider = isStorageProvider(answers.storageProvider)
    ? answers.storageProvider
    : defaults.storageProvider;
  const targetDir = resolve(args.targetDir ?? slug);
  const options: ScaffoldOptions = {
    projectName: String(answers.projectName),
    slug,
    targetDir,
    includeWorker: Boolean(answers.includeWorker),
    includeAi: Boolean(answers.includeAi),
    storageProvider,
    runInstall: Boolean(answers.runInstall),
    runInfra: Boolean(answers.runInfra) && Boolean(answers.runInstall),
  };

  const spinner = p.spinner();
  try {
    spinner.start("Preparing project");
    const result = await scaffoldApp(options, (message) =>
      spinner.message(message),
    );
    spinner.stop(`Created ${pc.green(titleize(result.slug))}`);
    p.outro(nextSteps(result.targetDir, options));
  } catch (error) {
    spinner.stop("Scaffolding failed");
    p.cancel(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function nextSteps(targetDir: string, options: ScaffoldOptions) {
  const lines = [
    `${pc.bold("Next steps")}`,
    `cd ${targetDir}`,
    options.runInstall ? undefined : "pnpm install",
    options.runInfra ? undefined : "pnpm infra:up && pnpm db:migrate",
    "pnpm dev",
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

await main();
