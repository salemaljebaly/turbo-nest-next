# Project Agent Workflow

Use this workflow for every task in this repository.

Read `docs/plan/00-roadmap.md`, `docs/plan/conventions.md`, and the files that
own the behavior before editing.

## Start Of Task

- Check the current branch and worktree:

```bash
git branch --show-current
git status --short
```

- Do not overwrite or revert changes you did not make.
- If the worktree contains unrelated changes, leave them alone or ask before
  staging them.

## Implementation Rules

- Keep each task on a separate branch.
- Do not use `codex/` as a Git branch prefix.
- Keep commits focused by feature or fix.
- Prefer existing patterns in `apps/api`, `apps/web`, and `packages/*`.
- Use the API as the boundary between frontend and backend.
- Update docs when commands, setup, auth behavior, deployment, observability, or
  architecture decisions change.
- For UI work, use `@/components/ui/*` and semantic theme tokens.
- Lists of growing records must use `AdminTable` with required `searchKey`,
  `searchPlaceholder`, and pagination. Do not render unbounded record lists as
  plain `<div>` blocks.
- Related-record selectors must use `AutocompleteSelect`/`EntitySelect`, not
  plain text inputs for foreign keys.
- For tenant-aware features, decide whether records are scoped by `userId` or
  `organizationId` before adding tables or endpoints.
- Schema changes go through Drizzle: edit `packages/db/src/schema/*`, run
  `pnpm db:generate`, review generated SQL, then run `pnpm db:migrate`.

## Validation Matrix

For shared or cross-app changes:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm api:check
pnpm build
```

For frontend routes or UI changes, also run:

```bash
pnpm --filter=@repo/web test:browser
```

For Docker or deployment changes, also run the relevant image build:

```bash
pnpm docker:build:api
pnpm docker:build:web
pnpm docker:build:worker
```

## Feature Tags

Use the `todo:FeatureName` prefix in code comments to mark features that are
intentionally hidden, deferred, or gated.

```ts
// todo:FeatureName — Short description of the hidden feature.
// Why it is hidden and when to re-enable.
```

Find tags with:

```bash
grep -rn 'todo:' apps/ packages/
```

When re-enabling a feature, remove the `todo:` comments entirely.

## Publishing

- Commit with a conventional commit message.
- Push the branch.
- Open a draft PR with summary, validation performed, screenshots for UI
  changes when useful, and migration/environment/manual follow-up notes.

## Manual Follow-Ups

If a task needs external setup, such as Sentry credentials, DNS, object storage,
or server access, document the exact manual steps in the PR instead of blocking
the code change.
