import {
  Queue,
  Worker,
  type JobsOptions,
  type Processor,
  type WorkerOptions,
} from "bullmq";
import IORedis from "ioredis";
import { z } from "zod";

export const QUEUE_NAMES = {
  default: "default",
  mail: "mail",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface JobPayloadMap {
  "template.ping": {
    message: string;
  };
}

export type JobName = keyof JobPayloadMap;

export interface EnqueueJobOptions {
  queue?: QueueName;
  jobsOptions?: JobsOptions;
}

export interface QueueRuntimeOptions {
  redisUrl?: string;
  prefix?: string;
}

const pingPayloadSchema = z.object({
  message: z.string().min(1),
});

const jobSchemas: {
  [Name in JobName]: z.ZodType<JobPayloadMap[Name]>;
} = {
  "template.ping": pingPayloadSchema,
};

export function createRedisConnection(redisUrl?: string) {
  const url = redisUrl ?? process.env["REDIS_URL"];
  if (!url) {
    throw new Error("REDIS_URL environment variable is required for queues");
  }

  return new IORedis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
  });
}

export function createQueue(
  name: QueueName,
  options: QueueRuntimeOptions = {},
) {
  return new Queue(name, {
    connection: createRedisConnection(options.redisUrl),
    prefix: options.prefix ?? process.env["QUEUE_PREFIX"],
  });
}

export async function enqueueJob<Name extends JobName>(
  name: Name,
  payload: JobPayloadMap[Name],
  options: EnqueueJobOptions = {},
) {
  const queue = createQueue(options.queue ?? QUEUE_NAMES.default);
  const parsedPayload = jobSchemas[name].parse(payload);

  try {
    return await queue.add(name, parsedPayload, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: 5000,
      ...options.jobsOptions,
    });
  } finally {
    await queue.close();
  }
}

export function createWorker(
  name: QueueName,
  processor: Processor<JobPayloadMap[JobName], unknown, JobName>,
  options: QueueRuntimeOptions &
    Omit<WorkerOptions, "connection" | "prefix"> = {},
) {
  return new Worker<JobPayloadMap[JobName], unknown, JobName>(name, processor, {
    ...options,
    connection: createRedisConnection(options.redisUrl),
    prefix: options.prefix ?? process.env["QUEUE_PREFIX"],
  });
}
