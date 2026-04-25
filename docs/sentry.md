# Sentry

Sentry is optional. The API only sends events when `SENTRY_DSN` is set.

## Environment

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=
SENTRY_SAMPLE_RATE=1
SENTRY_TRACES_SAMPLE_RATE=0
SENTRY_SMOKE_TEST_ENABLED=false
```

Keep `SENTRY_TRACES_SAMPLE_RATE=0` by default, then raise it deliberately in
staging or production.

## Smoke Test

The API includes a disabled-by-default smoke endpoint:

```text
GET /api/v1/observability/sentry-smoke
```

When `SENTRY_SMOKE_TEST_ENABLED=false`, the endpoint returns `404`.

To test Sentry manually:

1. Set a real `SENTRY_DSN`.
2. Set `SENTRY_SMOKE_TEST_ENABLED=true`.
3. Start the API.
4. Request the smoke endpoint:

```bash
curl -i http://localhost:3001/api/v1/observability/sentry-smoke
```

Expected result:

- API returns `500`.
- The exception filter captures `Sentry smoke test error`.
- Sentry receives the event with request tags such as method, path, status code,
  and request id.

Turn `SENTRY_SMOKE_TEST_ENABLED=false` after testing. Do not leave the smoke
route enabled in production.

## Logs

The API request logger writes structured JSON with:

- `requestId`
- `method`
- `path`
- `statusCode`
- `durationMs`

This keeps local logs useful even when Sentry is disabled.
