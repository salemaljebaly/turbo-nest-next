import { QUEUE_NAMES, createQueue } from "@repo/jobs";

export const RECURRING_SCHEDULES = {
  dailyCleanup: "0 2 * * *",
} as const;

type SchedulableQueue = Pick<
  ReturnType<typeof createQueue>,
  "upsertJobScheduler" | "close"
>;

type QueueFactory = (
  name: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
) => SchedulableQueue;

const recurringJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 30_000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

export async function registerRecurringSchedules(
  queueFactory: QueueFactory = createQueue,
) {
  const maintenance = queueFactory(QUEUE_NAMES.maintenance);
  try {
    await maintenance.upsertJobScheduler(
      "maintenance.daily-cleanup",
      {
        pattern: RECURRING_SCHEDULES.dailyCleanup,
        tz: "UTC",
      },
      {
        name: "maintenance.daily-cleanup",
        data: {},
        opts: recurringJobOptions,
      },
    );
  } finally {
    await maintenance.close();
  }
}
