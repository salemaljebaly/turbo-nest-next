import { z } from "zod";

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
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
  if (
    typeof value !== "object" ||
    value === null ||
    (value as { success?: unknown }).success !== false
  ) {
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
