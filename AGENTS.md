# Project Agent Workflow

Use this workflow for every task in this repository.

## Start of Task

- Check the current branch and worktree:

```bash
git branch --show-current
git status --short
```

- Read the files that own the behavior before editing.
- Do not overwrite or revert changes you did not make.
- If the worktree contains unrelated changes, leave them alone or ask before
  staging them.

## Implementation Rules

- Keep each task on a separate branch.
- Keep commits focused by feature or fix.
- Prefer existing patterns in `apps/api`, `apps/web`, and `packages/*`.
- Use the API as the boundary between frontend and backend.
- Update docs when commands, setup, auth behavior, deployment, or architecture
  decisions change.
- For UI work, use `@/components/ui/*` and semantic theme tokens so shadcn
  presets can restyle the app.
- For tenant-aware features, decide whether records are scoped by `userId` or
  `organizationId` before adding tables or endpoints.

## Validation

Run the checks that match the change. For shared or cross-app changes, prefer:

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
```

## Publishing

- Commit with a conventional commit message.
- Push the branch.
- Open a draft PR with:
  - summary
  - validation performed
  - screenshots for UI changes when useful
  - migration, environment, or manual follow-up notes

## Manual Follow-Ups

If a task needs external setup, such as Sentry credentials, DNS, cloud storage,
or server access, document the exact manual steps in the PR instead of blocking
the code change.
