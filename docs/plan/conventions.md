# Conventions

## Feature Tags

Use `todo:FeatureName` comments for hidden or deferred code paths. Remove the
comments when the feature is enabled.

## API

- Use `AppException` for domain errors.
- Register error codes before throwing them.
- Keep frontend/backend communication behind REST API boundaries.

## Database

- Edit Drizzle schema first.
- Generate migrations with `pnpm db:generate`.
- Review SQL before applying migrations.
- Decide `userId` versus `organizationId` ownership up front.

## Frontend

- Import primitives through `@/components/ui/*`.
- Use `AdminTable` for growing record lists.
- Use `AutocompleteSelect`/`EntitySelect` for related records.
- Use `LoadingState`, `EmptyState`, and `ErrorState` for page states.

## Jobs

- Define queue contracts in `packages/jobs`.
- Enqueue through API services.
- Process recurring/background jobs in `apps/worker` unless the job must call
  module-private API services.
