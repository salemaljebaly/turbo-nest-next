import { idempotencyKeys, lt, type Database } from "@repo/db";
import { type JobName, type JobPayloadMap } from "@repo/jobs";

type WorkerJob<Name extends JobName = JobName> = {
  id?: string;
  name: Name;
  data: JobPayloadMap[Name];
};

export async function deleteExpiredIdempotencyKeys(
  db: Database,
  now = new Date(),
) {
  const deleted = await db
    .delete(idempotencyKeys)
    .where(lt(idempotencyKeys.expiresAt, now))
    .returning({ id: idempotencyKeys.id });
  return deleted.length;
}

export async function processDefaultJob(job: WorkerJob) {
  switch (job.name) {
    case "template.ping":
      console.info("Processed template ping job", {
        id: job.id,
        data: job.data,
      });
      return { ok: true, processedAt: new Date().toISOString() };
    default:
      return unsupportedJob(job.name);
  }
}

export function createMaintenanceProcessor(db: Database) {
  return async function processMaintenanceJob(job: WorkerJob) {
    switch (job.name) {
      case "maintenance.daily-cleanup": {
        const expiredIdempotencyKeysDeleted =
          await deleteExpiredIdempotencyKeys(db);
        console.info("Processed daily cleanup job", {
          id: job.id,
          expiredIdempotencyKeysDeleted,
        });
        return {
          ok: true,
          processedAt: new Date().toISOString(),
          expiredIdempotencyKeysDeleted,
        };
      }
      default:
        return unsupportedJob(job.name);
    }
  };
}

export async function processNotificationJob(job: WorkerJob) {
  switch (job.name) {
    case "notification.send":
      console.info("Processed notification send job", {
        id: job.id,
        data: job.data,
      });
      return { ok: true, processedAt: new Date().toISOString() };
    default:
      return unsupportedJob(job.name);
  }
}

function unsupportedJob(name: string): never {
  throw new Error(`Unsupported job: ${name}`);
}
