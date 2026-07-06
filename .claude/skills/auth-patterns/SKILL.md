---
name: auth-patterns
description: Use when changing Better Auth, guards, RBAC, organizations, sessions, or protected routes.
---

# Auth Patterns

- Use `AuthGuard` for authenticated API routes.
- Use `@RequirePermissions` with `PermissionsGuard` for RBAC.
- Share the role/resource/action vocabulary through `packages/types`.
- Decide `userId` versus `organizationId` scoping before adding tables.
- Frontend nav and row actions should mirror backend permissions with `can()`.
