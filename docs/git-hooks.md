# Git Hooks

Husky is enabled through the root `prepare` script.

## Pre-Commit

`pre-commit` runs `pnpm lint-staged`.

This keeps commits formatted without running the full repo checks on every
small edit.

## Commit Message

`commit-msg` enforces Conventional Commits:

```text
feat(api): add posts module
fix(web): handle empty api response
docs: update deployment notes
```

Allowed types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, and `infra`.

## Pre-Push

`pre-push` runs:

```bash
pnpm verify:push
```

That command runs linting, type checks, unit tests, and API contract checks. It
intentionally does not build Docker images because that is too slow for every
push.

For emergency local-only bypasses:

```bash
SKIP_GIT_HOOKS=1 git push
```

Use bypasses only when the same checks will run in CI or another environment.
