# API Platform

## Error Envelope

All API errors use one response shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable",
    "details": {},
    "requestId": "request-id",
    "path": "/api/v1/resource",
    "timestamp": "2026-07-06T00:00:00.000Z"
  }
}
```

Services should throw `AppException` from
`apps/api/src/common/errors/app.exception.ts`. Shared codes live in
`apps/api/src/common/errors/error-codes.ts` and the client-facing union is
exported from `packages/types`.

Feature codes should use `RESOURCE_ACTION_PROBLEM` names such as
`PROJECT_NOT_FOUND`. Add new codes to both the API registry and
`packages/types/src/error-codes.ts` so frontend code can localize them.

ValidationPipe errors are normalized to `VALIDATION_FAILED` with per-field
details. Unexpected 5xx errors are logged and captured through observability,
then returned as `INTERNAL_SERVER_ERROR` without internal details.

## Idempotency

Use `@Idempotent()` on POST handlers that may be retried by clients. Requests
must include `Idempotency-Key`. The interceptor hashes method, URL, and body,
stores the in-progress key in `idempotency_keys`, replays completed responses,
and returns `IDEMPOTENCY_CONFLICT` if the same key is reused for a different
payload.

## Rate Limits

Use `@RateLimit({ limit, windowSeconds })` on handlers that need route-specific
limits. The global interceptor uses Redis when configured and an in-memory
bucket otherwise. Limit failures return `RATE_LIMITED` and set `Retry-After`.

## Query Safety

Use helpers from `apps/api/src/common/query-safety.ts` for copyable list
endpoints:

- `boundedIntegerLimit()` clamps page sizes to 1-100.
- `validateUuidCursor()` rejects malformed UUID cursors.
- `containsLikePattern()` escapes `%`, `_`, and `\` before SQL LIKE searches.
- `parseSort()` accepts only whitelisted sort columns.

The `projects` module demonstrates all four helpers.

## CSV Responses

Use `writeCsv()` from `apps/api/src/common/csv-response.ts` for exports. It sets
CSV headers, quotes cells, writes a UTF-8 BOM, and prefixes spreadsheet formula
cells to avoid formula injection.

## Metrics

`GET /api/metrics` serves Prometheus text metrics. Set `METRICS_TOKEN` or
`METRICS_TOKEN_FILE` to require `Authorization: Bearer <token>`. HTTP latency
uses normalized paths to avoid high-cardinality route labels. Queue metrics are
collected from BullMQ when `REDIS_URL` is configured.

## Health Indicators

`GET /api/health` reports:

- `database`: Drizzle `SELECT 1`.
- `redis`: Redis ping, or healthy with `not configured`.
- `storage`: `STORAGE_ENDPOINT` HEAD check, or healthy with `not configured`.
- `worker`: heartbeat from `QUEUE_PREFIX:runtime:worker:heartbeat`.

Set `WORKER_HEALTH_REQUIRED=true` when production health should fail if no
current worker heartbeat is present.

Custom indicators should extend `HealthIndicator`, expose `isHealthy(key)`, add
the provider to `HealthModule`, and include the check in `HealthController`.

## Dev-Only Controllers

Local testing helpers can be implemented as controllers under `apps/api/src/health`
or a feature module, but they must return 404 or be excluded when
`NODE_ENV === "production"`. Keep them documented and avoid importing them into
production-only modules.

## Example Module

`apps/api/src/projects` is the neutral reference module for new features. It
demonstrates DTO validation, authenticated owner scoping, `AppException` codes,
idempotent create, rate-limited list, safe search/sort/pagination, CSV export,
OpenAPI decorators, RBAC, audit annotations, maker-checker approval, realtime
events, notifications, and focused service tests.
