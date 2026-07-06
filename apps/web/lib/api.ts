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

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

type ApiSuccessEnvelope<T> = {
  data: T;
};

type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

function isApiError(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: { code?: unknown; message?: unknown } }).error
      ?.code === "string" &&
    typeof (value as { error?: { code?: unknown; message?: unknown } }).error
      ?.message === "string"
  );
}

function isApiSuccess<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  return typeof value === "object" && value !== null && "data" in value;
}

function isApiResponse<T>(value: unknown): value is ApiEnvelope<T> {
  return isApiError(value) || isApiSuccess<T>(value);
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
  const { headers, ...requestOptions } = options ?? {};
  const requestBody = requestOptions.body;
  const isFormData =
    typeof FormData !== "undefined" && requestBody instanceof FormData;
  const requestHeaders = new Headers(headers);
  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // required for Better Auth cookie sessions
    ...requestOptions,
    headers: requestHeaders,
  });

  const responseBody = await parseJson(res);

  if (!res.ok) {
    const err = toErrorMessage(
      responseBody,
      res.statusText || "Request failed",
    );
    throw new ApiError(res.status, err.code, err.message, err.details);
  }

  if (responseBody === undefined) {
    return undefined as T;
  }

  if (!isApiResponse<T>(responseBody)) {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "The API response does not match the expected envelope.",
      responseBody,
    );
  }

  if (isApiError(responseBody)) {
    throw new ApiError(
      res.status,
      responseBody.error.code,
      responseBody.error.message,
      responseBody.error.details,
    );
  }

  if (!isApiSuccess<T>(responseBody)) {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "The API response does not match the expected success envelope.",
      responseBody,
    );
  }

  return responseBody.data;
}

async function download(path: string, filename: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const body = await parseJson(response);
    const err = toErrorMessage(body, response.statusText || "Export failed");
    throw new ApiError(response.status, err.code, err.message, err.details);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

  download,
};

export { ApiError };
