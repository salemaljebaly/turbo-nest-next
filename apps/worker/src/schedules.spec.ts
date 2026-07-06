import { describe, expect, it, vi } from "vitest";
import { QUEUE_NAMES } from "@repo/jobs";
import {
  RECURRING_SCHEDULES,
  registerRecurringSchedules,
} from "./schedules.js";

describe("recurring schedules", () => {
  it("registers daily cleanup with retries and closes the queue", async () => {
    const queue = {
      upsertJobScheduler: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const factory = vi.fn(() => queue);

    await registerRecurringSchedules(factory);

    expect(factory).toHaveBeenCalledWith(QUEUE_NAMES.maintenance);
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith(
      "maintenance.daily-cleanup",
      { pattern: RECURRING_SCHEDULES.dailyCleanup, tz: "UTC" },
      {
        name: "maintenance.daily-cleanup",
        data: {},
        opts: expect.objectContaining({
          attempts: 5,
          backoff: { type: "exponential", delay: 30_000 },
          removeOnFail: 5000,
        }),
      },
    );
    expect(queue.close).toHaveBeenCalled();
  });
});
