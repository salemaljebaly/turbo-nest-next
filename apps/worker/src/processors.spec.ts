import { describe, expect, it, vi } from "vitest";
import {
  createMaintenanceProcessor,
  deleteExpiredIdempotencyKeys,
  processDefaultJob,
  processNotificationJob,
} from "./processors.js";

function cleanupDb(deletedRows: unknown[] = []) {
  const returning = vi.fn().mockResolvedValue(deletedRows);
  const where = vi.fn(() => ({ returning }));
  const deleteFn = vi.fn(() => ({ where }));

  return {
    db: { delete: deleteFn },
    deleteFn,
    where,
  };
}

describe("worker processors", () => {
  it("processes default queue ping jobs", async () => {
    await expect(
      processDefaultJob({
        id: "job-1",
        name: "template.ping",
        data: { message: "hello" },
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it("processes notification queue send jobs", async () => {
    await expect(
      processNotificationJob({
        id: "job-2",
        name: "notification.send",
        data: { notificationId: "0197c899-7612-7000-8000-000000000001" },
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it("deletes expired idempotency keys during daily cleanup", async () => {
    const { db, deleteFn, where } = cleanupDb([{ id: "one" }, { id: "two" }]);
    const now = new Date("2026-07-07T00:00:00.000Z");

    await expect(
      deleteExpiredIdempotencyKeys(db as never, now),
    ).resolves.toBe(2);
    expect(deleteFn).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();
  });

  it("runs daily cleanup from the maintenance queue", async () => {
    const { db } = cleanupDb([{ id: "one" }]);
    const processor = createMaintenanceProcessor(db as never);

    await expect(
      processor({
        id: "job-3",
        name: "maintenance.daily-cleanup",
        data: {},
      }),
    ).resolves.toMatchObject({ ok: true, expiredIdempotencyKeysDeleted: 1 });
  });
});
