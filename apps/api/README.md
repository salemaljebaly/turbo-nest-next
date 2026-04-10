# API

NestJS API for the monorepo template.

## Run

```bash
cp .env.example .env
pnpm --filter=@repo/api dev
```

The app reads env files from the current working directory first, then falls back to the monorepo root `.env`.
Running the API package directly now prebuilds `@repo/db`, so it works on a fresh clone without needing a separate root build first.

## Important routes

- `GET /api`
- `GET /api/health`
- `GET /api/docs`
- `ALL /api/auth/*`
- `GET /api/v1/users/me`

## Notes

- Better Auth is wired through a Nest provider instead of import-time bootstrapping.
- Email delivery uses SMTP. In development, MailHog works with the default `.env.example`.
- The example users module is intentionally limited to the current authenticated user instead of exposing a public user listing.
- Copy [apps/api/.env.example](/Users/lamah/development/turborepo-nestjs-nextjs-template/apps/api/.env.example) when you want the API to run independently of the root `.env`.
- If you extract this app into its own repo, bring `packages/db`, `packages/types`, `packages/eslint-config`, and `packages/typescript-config` with it or publish those packages first.
