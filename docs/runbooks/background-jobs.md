# Background Jobs

Last reviewed: 2026-07-06

The worker registers recurring BullMQ schedules from
`apps/worker/src/schedules.ts`. Queue payload contracts live in
`packages/jobs`, and API modules enqueue work through injectable services so
business rules stay behind module boundaries.

| Job                         | Schedule        | Consumer | Purpose                         |
| --------------------------- | --------------- | -------- | ------------------------------- |
| `maintenance.daily-cleanup` | `0 2 * * *`     | worker   | Example daily maintenance hook. |
| `notification.send`         | queued on write | worker   | Dispatch notification payloads. |

Recurring jobs should use bounded retry attempts, exponential backoff, and
retention limits for completed and failed jobs. Queue consumers should log JSON
with `event`, `jobId`, queue lag, attempt count, and result counts.

## Add A Schedule

1. Add the job name and payload schema in `packages/jobs`.
2. Add a schedule entry in `apps/worker/src/schedules.ts`.
3. Register the processor in `apps/worker/src/main.ts`.
4. Add or update tests in `apps/worker/src/schedules.spec.ts`.
5. Document the job here.

## Alerts

Page operations when any condition persists for five minutes:

- queue lag exceeds 120 seconds;
- a recurring job exhausts all attempts;
- any queue has more than 1,000 waiting jobs;
- the worker heartbeat is stale in `/api/health`.

Retry jobs through BullMQ or an audited admin operation. Do not repair
background-job state by editing production PostgreSQL rows by hand unless a
runbook explicitly requires it.
