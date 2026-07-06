import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "FORBIDDEN",
  "CONFLICT",
  "RATE_LIMITED",
  "IDEMPOTENCY_CONFLICT",
  "INVALID_CURSOR",
  "INVALID_LIMIT",
  "PROJECT_NOT_FOUND",
  "PROJECT_ARCHIVED",
  "INTERNAL_SERVER_ERROR",
]);

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
