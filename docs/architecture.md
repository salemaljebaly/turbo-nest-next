# Architecture

This template starts as a modular monolith because that keeps small and medium
products fast to build. The boundaries are explicit so larger products can split
pieces later without rewriting the app.

## Runtime Apps

- `apps/api`: NestJS REST API. Owns auth, HTTP contracts, database access, and
  backend orchestration.
- `apps/web`: Next.js app. Talks to the API through the typed API client and
  does not import backend/database internals.

## Shared Packages

- `packages/db`: Drizzle schema, migrations, and database connection helpers.
- `packages/types`: shared transport schemas and API response helpers.
- `packages/ui`: reusable UI primitives.
- `packages/eslint-config` and `packages/typescript-config`: shared quality
  rules.

## Contracts

The API is the boundary between frontend and backend:

```bash
pnpm api:generate
pnpm api:check
```

`api:generate` writes:

- `apps/api/openapi.json`
- `apps/web/lib/api-schema.ts`

`api:check` fails when generated contract files are stale.

## Import Rules

- Web code imports UI through `@/components/ui/*`.
- Web code must not import `@repo/db` or API internals.
- API code must not import UI modules.
- Shared packages should stay framework-light unless their package name makes
  the framework dependency obvious.

## API Shape

Normal API endpoints return the standard envelope:

```json
{ "success": true, "data": {} }
```

Framework-owned endpoints, such as Better Auth and health checks, keep their own
response shape.
