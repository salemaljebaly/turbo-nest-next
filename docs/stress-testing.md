# Stress Testing

The template includes k6 scenarios under `tests/k6`. The setup follows the same
shape as the ReviewPin tests: TypeScript scenarios are bundled with esbuild,
then k6 exports JSON and HTML reports.

## Install k6

```bash
brew install k6
```

## Configure

```bash
cd tests/k6
cp .env.k6.example .env.k6
```

Set the target URLs:

```env
WEB_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001/api
AUTH_EMAIL=k6@example.com
AUTH_PASSWORD=change-me
```

`AUTH_EMAIL` and `AUTH_PASSWORD` are optional. When they are missing, the
authenticated `/api/v1/users/me` scenario is skipped and the public scenarios
still run.

Load the env file before running:

```bash
set -a && source tests/k6/.env.k6 && set +a
```

## Scenarios

| Scenario | Command              | Purpose                                      |
| -------- | -------------------- | -------------------------------------------- |
| Smoke    | `pnpm stress:smoke`  | quick landing, health, and optional auth API |
| Load     | `pnpm stress:load`   | moderate mixed traffic baseline              |
| Stress   | `pnpm stress:stress` | aggressive ramp to find the breaking point   |

When the scenarios are already built, you can run k6 directly from the root:

```bash
pnpm test:k6:smoke
pnpm test:k6:load
pnpm test:k6:stress
```

Reports are written to `tests/k6/dist`:

- `report-*.html`
- `report-*.json`

## What Is Covered

- public landing page
- API health endpoint
- invalid auth request handling
- authenticated API endpoint when test credentials are configured

Add file upload/download scenarios after storage flows are added to the app.

## Rules

- Run smoke locally before load or stress tests.
- Run load and stress against staging first, not a shared developer machine.
- Keep test users separate from real users.
- Record the server size, commit SHA, scenario, p95 latency, failure rate, and
  approximate requests per second after every serious run.
