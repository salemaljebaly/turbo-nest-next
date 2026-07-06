import { z } from "zod";
import { ErrorCodeSchema } from "./error-codes.js";

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema.or(z.string()),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
    path: z.string().optional(),
    timestamp: z.string().optional(),
  }),
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = z.infer<typeof ApiErrorSchema>;

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiSuccess<T = unknown>(
  value: unknown,
): value is ApiSuccess<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { success?: unknown }).success === true &&
    "data" in value
  );
}

export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }

  const error = (value as { error?: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

export function isApiResponse<T = unknown>(
  value: unknown,
): value is ApiResponse<T> {
  return isApiSuccess<T>(value) || isApiError(value);
}
