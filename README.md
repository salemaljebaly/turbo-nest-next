# turbo-nest-next

Production-ready monorepo with a **NestJS REST API** and **Next.js** frontend.

## Stack

| Layer         | Package                    | Version  |
| ------------- | -------------------------- | -------- |
| Monorepo      | Turborepo + pnpm           | 2.9 / 10 |
| Backend       | NestJS                     | 11.x     |
| API docs      | @nestjs/swagger (OpenAPI)  | —        |
| Auth          | Better Auth                | 1.6.x    |
| ORM           | Drizzle ORM                | 0.45.x   |
| Database      | PostgreSQL 17              | —        |
| Cache         | Redis 8                    | —        |
| Storage       | MinIO                      | —        |
| Frontend      | Next.js (App Router)       | 16.2     |
| UI            | shadcn/ui — **luma** style | v4       |
| Styling       | Tailwind CSS               | v4       |
| Data fetching | TanStack Query             | v5       |
| Shared types  | Zod                        | 4.x      |
| Testing       | Vitest                     | 4.x      |
| CI            | GitHub Actions             | —        |

## Structure

```
.
├── apps/
│   ├── api/                        # NestJS REST API (port 3001)
│   │   └── src/
│   │       ├── auth/               # Better Auth integration + AuthGuard
│   │       ├── common/filters/     # Global exception filter
│   │       ├── database/           # Drizzle DB module (NestJS DI)
│   │       ├── health/             # GET /api/health (DB + Redis probes)
│   │       └── users/              # Example feature module (GET /api/v1/users/me)
│   └── web/                        # Next.js frontend (port 3000)
│       ├── app/                    # App Router pages + layouts
│       ├── components/ui/          # app-level shadcn/ui entrypoints
│       └── lib/
│           ├── api.ts              # Type-safe API client
│           └── auth/client.ts      # Better Auth client
├── packages/
│   ├── db/                         # Drizzle schema + migrations
│   ├── types/                      # Shared Zod schemas
│   ├── ui/                         # Shared UI primitives consumed by app wrappers
│   ├── eslint-config/              # Shared ESLint configs
│   └── typescript-config/          # Shared tsconfigs
├── docker/
│   └── docker-compose.yml          # PostgreSQL · Redis · MinIO · MailHog
└── .env.example
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set BETTER_AUTH_SECRET to a random 32-char string:
# openssl rand -base64 32
```

For local development, the API will read `.env` from either `apps/api/.env` or the monorepo root `.env`.
This means you can run the API standalone or as part of the workspace without changing code.

### 3. Start infrastructure

```bash
pnpm infra:up
```

### 4. Run migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start development

```bash
pnpm dev
```

| Service                | URL                                         |
| ---------------------- | ------------------------------------------- |
| Web                    | http://localhost:3000                       |
| API                    | http://localhost:3001/api                   |
| Swagger                | http://localhost:3001/api/docs              |
| Health                 | http://localhost:3001/api/health            |
| Invitation accept flow | http://localhost:3000/accept-invitation/:id |
| MinIO console          | http://localhost:9001                       |
| MailHog UI             | http://localhost:8025                       |

## Commands

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Start all apps in watch mode                    |
| `pnpm build`       | Build all apps and packages                     |
| `pnpm test`        | Run Vitest across all packages                  |
| `pnpm api:dev`     | Run only the API, including `@repo/db` prebuild |
| `pnpm web:dev`     | Run only the web app                            |
| `pnpm infra:up`    | Start PostgreSQL, Redis, MinIO, and MailHog     |
| `pnpm infra:down`  | Stop local infrastructure                       |
| `pnpm lint`        | Lint all packages                               |
| `pnpm check-types` | TypeScript check all packages                   |
| `pnpm format`      | Format with Prettier                            |
| `pnpm db:generate` | Generate Drizzle migrations                     |
| `pnpm db:migrate`  | Apply migrations                                |
| `pnpm db:studio`   | Open Drizzle Studio                             |

## How-to

Short guides:

- [Before you start](./docs/before-you-start.md)
- [Architecture](./docs/architecture.md)
- [Scaling path](./docs/scaling.md)
- [shadcn presets](./docs/shadcn.md)
- [Single-server containers](./docs/single-server.md)
- [Sentry](./docs/sentry.md)
- [Git hooks](./docs/git-hooks.md)

### Add a new feature module to the API

```bash
cd apps/api
cp .env.example .env
nest generate module features/posts
nest generate controller features/posts
nest generate service features/posts
```

### Add a shadcn/ui component to apps/web

```bash
cd apps/web
pnpm dlx shadcn@latest add input dialog table
```

UI ownership rule:

- App code imports UI through `@/components/ui/*`.
- `apps/web/components/ui/*` is the app-level shadcn surface and may re-export shared primitives.
- `packages/ui` owns reusable primitives only; do not import it directly from app routes/components unless you are intentionally creating a new app-level wrapper.

### Add a shared DB table

1. Create `packages/db/src/schema/posts.ts`
2. Export it from `packages/db/src/schema/index.ts`
3. Run `pnpm db:generate && pnpm db:migrate`

### Add a shared type/schema

Add to `packages/types/src/`, export from `packages/types/src/index.ts`.
Import in any app: `import { MySchema } from '@repo/types'`

### Use the API client in Next.js

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () => api.get<Post[]>("/posts"),
  });
}
```

### Use auth in Next.js

```typescript
"use client";
import { useSession, signIn, signOut } from "@/lib/auth/client";

export function UserMenu() {
  const { data: session } = useSession();
  // ...
}
```

### Email delivery

- Development uses MailHog SMTP by default via `SMTP_HOST=localhost` and `SMTP_PORT=1025`.
- Production requires a real SMTP server. Set `SMTP_HOST`, `SMTP_PORT`, and ideally `SMTP_FROM`.
- Optional auth is supported with `SMTP_USER` and `SMTP_PASS`.

### Protect an API endpoint

```typescript
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { AuthGuard, type SessionRequest } from "../auth/auth.guard.js";

@Controller({ path: "posts", version: "1" })
export class PostsController {
  @Get("drafts")
  @UseGuards(AuthGuard)
  getDrafts(@Req() req: SessionRequest) {
    // req.session.user is typed and guaranteed to be present
    return this.postsService.getDraftsByUser(req.session.user.id);
  }
}
```

### Reuse the API outside the monorepo

- The API now resolves env files from its own working directory first, then falls back to the monorepo root.
- Running `pnpm dev` or `pnpm start:prod` from `apps/api` now prebuilds `@repo/db`, so the API package works directly from its own directory on a fresh clone.
- Shared packages are still workspace dependencies. If you extract the API into a separate repo, move or publish `packages/db`, `packages/types`, `packages/eslint-config`, and `packages/typescript-config`.
- Start by copying [apps/api/.env.example](/Users/lamah/development/turborepo-nestjs-nextjs-template/apps/api/.env.example) to `apps/api/.env` when you want the API to run independently of the root `.env`.

### Reuse the web app outside the monorepo

- The web app only requires `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_AUTH_URL`.
- Start by copying [apps/web/.env.example](/Users/lamah/development/turborepo-nestjs-nextjs-template/apps/web/.env.example) to `apps/web/.env.local`.
- If you extract the web app into a separate repo, move or publish `packages/ui`, `packages/types`, `packages/eslint-config`, and `packages/typescript-config`.
