# Before You Start

Choose the app shape before building business features. The template stays
small by default, but a few early decisions are expensive to change later.

Better Auth organizations are already wired in the auth layer:

- server plugin in `apps/api/src/auth/auth.ts`
- client plugin in `apps/web/lib/auth/client.ts`
- organization, member, invitation, and active organization session fields in
  `packages/db/src/schema/auth.ts`
- invitation accept flow in `apps/web/app/accept-invitation/[invitationId]`

The choice below is not whether the auth plugin exists. The choice is whether
your business data should be owned by users or organizations.

## Product Mode

### Simple App

Use this when users only own their own data.

- You can ignore organization UI and organization-scoped records.
- Scope records by `userId`.
- Keep routes simple: `/api/v1/projects`, `/dashboard`, etc.

This is the fastest path for internal tools, personal apps, and small products.

### Team or SaaS App

Use this when customers work in teams, workspaces, companies, schools, clinics,
stores, or any shared account.

- Use the existing Better Auth organization plugin for teams and invitations.
- Add `organizationId` or `tenantId` to business tables from day one.
- Centralize authorization checks in API services or guards.
- Avoid assuming `userId` is the only ownership boundary.

Adding tenancy later is possible, but the hard part is migrating app data and
queries from `userId` ownership to organization ownership.

### Marketplace or Multi-Role App

Use this when users can act in different roles or across multiple accounts.

- Model roles and permissions early.
- Keep tenant context explicit in API services.
- Add tests around cross-tenant access.
- Avoid mixing admin, customer, and operator behavior in one service method.

## API and Data Rules

- Treat the API as the boundary between frontend and backend.
- Run `pnpm api:check` when controllers or DTOs change.
- Keep database access in the API, not the web app.
- For every new table, decide whether it belongs to a user or an organization.
- For every protected endpoint, decide which identity can access the record.
- If the feature is organization-based, every query should filter by the active
  organization, not only by the current user.

## UI Rules

- Add shadcn components with:

```bash
pnpm dlx shadcn@latest add -c apps/web <component>
```

- Switch presets with:

```bash
pnpm dlx shadcn@latest init -c apps/web --preset <preset-code> --template next --rtl --force --no-reinstall
```

- Use `@/components/ui/*` components and semantic tokens.
- Avoid hard-coded colors, radius, and padding unless the page needs a custom
  exception.

## Scaling Rules

- Start with the modular monolith.
- Add queues only for slow, bursty, or retryable work.
- Keep reads synchronous when the user needs an immediate response.
- Split services only when ownership, deployment, or scaling pressure is real.
- Add infrastructure complexity after runtime boundaries are stable.

## Before First Feature

Answer these questions:

- Is this app single-user or organization-based?
- Which tables need `organizationId` from day one?
- Which workflows should become background jobs?
- Which API endpoints must be versioned or public?
- Which checks must pass before a PR merges?
