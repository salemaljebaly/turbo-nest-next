# Web

Next.js frontend for the monorepo template.

## Run

```bash
cp .env.example .env.local
pnpm --filter=@repo/web dev
```

## Routes

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/accept-invitation/[invitationId]`

## Notes

- Better Auth client uses `NEXT_PUBLIC_AUTH_URL` and expects the API to expose `/api/auth/*`.
- Shared button/card primitives are sourced from `@repo/ui`, while app-specific shadcn wrappers live in `components/ui`.
- React Query is configured in `app/providers.tsx`.
- Copy [apps/web/.env.example](/Users/lamah/development/turborepo-nestjs-nextjs-template/apps/web/.env.example) to `apps/web/.env.local` when you want to run the frontend independently of the root `.env`.
- If you extract this app into its own repo, move or publish `packages/ui`, `packages/types`, `packages/eslint-config`, and `packages/typescript-config`.
