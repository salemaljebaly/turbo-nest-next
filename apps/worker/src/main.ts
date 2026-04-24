import "dotenv/config";

import { QUEUE_NAMES, createWorker } from "@repo/jobs";

const worker = createWorker(QUEUE_NAMES.default, async (job) => {
  switch (job.name) {
    case "template.ping":
      console.info("Processed template ping job", job.data);
      return { ok: true };
    default:
      throw new Error(`Unsupported job: ${job.name satisfies never}`);
  }
});

worker.on("completed", (job) => {
  console.info(`Job completed: ${job.name}#${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job failed: ${job?.name ?? "unknown"}#${job?.id}`, error);
});

async function shutdown(signal: NodeJS.Signals) {
  console.info(`Received ${signal}; closing worker`);
  await worker.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
