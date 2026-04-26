# Deployment Foundation

Use this as the short checklist for production hardening.

## Local Services

- Dev stack: `pnpm infra:up`
- Isolated test stack: `pnpm infra:test:up`
- Stop test stack: `pnpm infra:test:down`

The test stack uses separate ports and temporary storage so it does not touch local dev data.

## Database

Tune Postgres connections per environment:

- `DB_POOL_MAX`
- `DB_IDLE_TIMEOUT`
- `DB_CONNECT_TIMEOUT`

Start small, then raise pool size only after checking database CPU, locks, and connection count.

## Queues

Queues are optional. Add jobs through `@repo/jobs`, then run workers only when needed:

```bash
pnpm worker:dev
```

Use queues for slow or bursty work. Do not queue reads that need an immediate user response.

## Observability

The API uses a generic observability interface. Sentry is enabled only when `SENTRY_DSN` is set.

Keep `SENTRY_TRACES_SAMPLE_RATE=0` by default, then raise it carefully in staging or production.

Use [Sentry smoke testing](./sentry.md) after configuring a real DSN.

## Browser Tests

The web app has a Playwright foundation for auth and protected-route flows:

```bash
pnpm web:test:browser
```

Install browsers once if Playwright asks for it:

```bash
pnpm --filter=@repo/web exec playwright install chromium
```
