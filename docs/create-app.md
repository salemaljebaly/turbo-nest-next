# Create-App Scaffolder

`tools/create-app` is the future `npx create-turbo-nest-next` package. It copies
this template without Git history, rewrites project names, applies option
manifests, generates `.env` from `.env.example`, and can optionally install
dependencies plus start infra.

## Local Usage

```bash
pnpm create:dev my-app
```

For noninteractive runs:

```bash
pnpm create:dev my-app --yes --target /tmp/my-app --no-ai --storage minio --no-install
```

Options:

- `--worker` / `--no-worker`
- `--ai` / `--no-ai`
- `--storage minio|s3`
- `--install` / `--no-install`
- `--infra` / `--no-infra`

`--infra` only runs when install is enabled, because the generated app needs its
own `node_modules` first.

## Option Manifest

The manifest strips optional surfaces instead of leaving dead imports:

- Worker off: removes `apps/worker`, root worker scripts, worker deploy service,
  and worker Dockerfile package-copy references.
- AI off: removes `packages/ai`, `apps/api/src/ai`, the dashboard chat widget,
  AI env vars, AI package dependencies, and the AI conversation migration/schema
  export.
- Storage `minio`: points local storage env vars at MinIO.
- Storage `s3`: removes local RustFS/MinIO compose services so external
  S3-compatible storage is expected.

After scaffolding without install, run:

```bash
pnpm install
pnpm lint
pnpm check-types
pnpm build
```

## Validation

The package ships unit tests for argument parsing and a smoke e2e command:

```bash
pnpm create:test
pnpm create:test:e2e
```

For release qualification, scaffold the supported matrix into temporary
directories, run `pnpm install --no-frozen-lockfile`, then run
`pnpm lint && pnpm check-types && pnpm build` in each generated app.
