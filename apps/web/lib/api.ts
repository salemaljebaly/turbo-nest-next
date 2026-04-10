import type { ApiResponse } from '@repo/types';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include', // required for Better Auth cookie sessions
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.success) {
    const err = !body.success ? body.error : { code: 'UNKNOWN', message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }

  return body.data;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  patch: <T>(path: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  put: <T>(path: string, body: unknown, options?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  delete: <T>(path: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
    request<T>(path, { method: 'DELETE', ...options }),
};

export { ApiError };
