import "dotenv/config";

import {
  QUEUE_NAMES,
  createRedisConnection,
  createWorker,
  workerHeartbeatKey,
} from "@repo/jobs";
import { registerRecurringSchedules } from "./schedules.js";

const heartbeat = process.env["REDIS_URL"]
  ? createRedisConnection(process.env["REDIS_URL"])
  : null;

async function writeHeartbeat() {
  await heartbeat?.set(
    workerHeartbeatKey(process.env["QUEUE_PREFIX"] ?? "template"),
    new Date().toISOString(),
    "EX",
    120,
  );
}

const worker = createWorker(QUEUE_NAMES.default, async (job) => {
  switch (job.name) {
    case "template.ping":
      console.info("Processed template ping job", {
        id: job.id,
        message: (job.data as { message: string }).message,
        processedAt: new Date().toISOString(),
      });
      return { ok: true, processedAt: new Date().toISOString() };
    case "maintenance.daily-cleanup":
      console.info("Processed daily cleanup job", {
        id: job.id,
        processedAt: new Date().toISOString(),
      });
      return { ok: true, processedAt: new Date().toISOString() };
    case "notification.send":
      console.info("Processed notification send job", {
        id: job.id,
        notificationId: (job.data as { notificationId: string }).notificationId,
        processedAt: new Date().toISOString(),
      });
      return { ok: true, processedAt: new Date().toISOString() };
    default:
      throw new Error(`Unsupported job: ${job.name satisfies never}`);
  }
});

void registerRecurringSchedules();
void writeHeartbeat();
const heartbeatTimer = setInterval(() => void writeHeartbeat(), 30_000);
heartbeatTimer.unref();

worker.on("completed", (job) => {
  console.info(`Job completed: ${job.name}#${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.name ?? "unknown"}#${job?.id}`, error);
});

async function shutdown(signal: NodeJS.Signals) {
  console.info(`Received ${signal}; closing worker`);
  clearInterval(heartbeatTimer);
  await heartbeat?.quit().catch(() => undefined);
  await worker.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
