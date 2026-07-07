# Platform Modules

## RBAC

Backend permissions live in `apps/api/src/auth/permissions.ts` and share the
same role/resource/action vocabulary exported from `packages/types`. The default
organization roles are `owner`, `admin`, `member`, and `viewer`.

Use `@RequirePermissions({ resource, action })` with `AuthGuard` and
`PermissionsGuard` on API handlers. `PermissionsService` resolves the active
Better Auth organization member role from `session.activeOrganizationId`.

## Separation Of Duties

Use `assertDifferentActor(requestedById, approvedById)` for maker-checker
flows. The `projects/:id/approve` endpoint demonstrates the pattern and returns
`SEPARATION_OF_DUTIES_VIOLATION` when the same actor attempts both steps.

## Resource Scoping

`ResourceScopeGuard` and `ResourceScopeService` provide a generic pattern for
restricting users to a subset of records. Attach `@RequireResourceScope({
scopeKey, param })` to a handler, and populate `session.resourceScopes` from
your own membership/profile source when a product needs scoped staff access.

## Storage

`StorageModule` provides S3-compatible presigned upload URLs and a confirm flow:

- `POST /api/v1/storage/uploads`
- `POST /api/v1/storage/uploads/:id/confirm`

Configure `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`,
`STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY`. Local compose includes RustFS
and MinIO so teams can choose either S3-compatible service.

## Notifications

`NotificationsModule` records notifications in the database and enqueues
`notification.send`. The default provider logs to the console for development.
Replace `NOTIFICATION_PROVIDER` with a real push/email/SMS provider in product
apps.

## Audit

Use `@AuditAction(action, entityType)` on mutating endpoints. The global audit
interceptor records actor, action, entity type, entity id, and request diff in
`audit_log` after the handler succeeds.

## Realtime

`RealtimeModule` exposes an authenticated Socket.IO gateway and `RealtimeService`.
Clients join `user:<id>` and, when available, `org:<id>` rooms after Better Auth
session validation. Feature modules inject `RealtimeService` and call
`emitToUser()` or `emitToOrg()`. Socket.IO CORS uses the same `CORS_ORIGINS`
allow-list as HTTP CORS and keeps credentials enabled for the session cookie.

## Worker Schedules

`apps/worker/src/schedules.ts` is the declarative repeatable-job registry. Add a
schedule by extending `RECURRING_SCHEDULES`, registering it with
`upsertJobScheduler`, and adding a processor case in `apps/worker/src/main.ts`.
