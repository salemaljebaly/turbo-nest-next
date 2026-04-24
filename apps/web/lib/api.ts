import { isApiError, isApiResponse } from "@repo/types";
import type { paths } from "./api-schema";

const BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";
const EMPTY_RESPONSE_STATUSES = new Set([204, 205, 304]);

type ApiSchemaPath = keyof paths & string;
export type ApiPath = ApiSchemaPath extends `/api${infer Path}`
  ? Path extends ""
    ? "/"
    : Path
  : never;

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  if (EMPTY_RESPONSE_STATUSES.has(res.status)) {
    return undefined;
  }

  const text = await res.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "The API returned a response that is not valid JSON.",
      text,
    );
  }
}

function toErrorMessage(body: unknown, fallback: string) {
  if (isApiError(body)) {
    return body.error;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { message?: unknown }).message === "string"
  ) {
    return {
      code: "HTTP_ERROR",
      message: (body as { message: string }).message,
      details: body,
    };
  }

  return {
    code: "HTTP_ERROR",
    message: fallback,
    details: body,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // required for Better Auth cookie sessions
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const body = await parseJson(res);

  if (!res.ok) {
    const err = toErrorMessage(body, res.statusText || "Request failed");
    throw new ApiError(res.status, err.code, err.message, err.details);
  }

  if (body === undefined) {
    return undefined as T;
  }

  if (!isApiResponse<T>(body)) {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "The API response does not match the expected envelope.",
      body,
    );
  }

  if (!body.success) {
    throw new ApiError(
      res.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }

  return body.data;
}

export const api = {
  get: <T>(path: ApiPath, options?: Omit<RequestInit, "method" | "body">) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(
    path: ApiPath,
    body: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),

  patch: <T>(
    path: ApiPath,
    body: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    }),

  put: <T>(
    path: ApiPath,
    body: unknown,
    options?: Omit<RequestInit, "method" | "body">,
  ) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body), ...options }),

  delete: <T>(path: ApiPath, options?: Omit<RequestInit, "method" | "body">) =>
    request<T>(path, { method: "DELETE", ...options }),
};

export { ApiError };
