import "dotenv/config";

import { createDbConnection } from "@repo/db";
import {
  QUEUE_NAMES,
  createRedisConnection,
  createWorker,
  workerHeartbeatKey,
} from "@repo/jobs";
import {
  createMaintenanceProcessor,
  processDefaultJob,
  processNotificationJob,
} from "./processors.js";
import { registerRecurringSchedules } from "./schedules.js";

const database = createDbConnection();
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

const workers = [
  createWorker(QUEUE_NAMES.default, processDefaultJob),
  createWorker(QUEUE_NAMES.maintenance, createMaintenanceProcessor(database.db)),
  createWorker(QUEUE_NAMES.notifications, processNotificationJob),
];

void registerRecurringSchedules();
void writeHeartbeat();
const heartbeatTimer = setInterval(() => void writeHeartbeat(), 30_000);
heartbeatTimer.unref();

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.info(`Job completed: ${job.name}#${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Job failed: ${job?.name ?? "unknown"}#${job?.id}`, error);
  });
}

async function shutdown(signal: NodeJS.Signals) {
  console.info(`Received ${signal}; closing worker`);
  clearInterval(heartbeatTimer);
  await heartbeat?.quit().catch(() => undefined);
  await Promise.all(workers.map((worker) => worker.close()));
  await database.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
