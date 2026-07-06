import { api, type ApiPath } from "@/lib/api";

export type AnyRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rows(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of ["items", "projects", "data", "entries"]) {
    const child = value[key];
    if (Array.isArray(child)) return child.filter(isRecord);
  }
  return [value];
}

export function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

export function idempotencyKey(prefix: string) {
  return `${prefix}:${globalThis.crypto.randomUUID()}`;
}

function pathSegment(value: string) {
  return encodeURIComponent(value);
}

function queryString(query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `?${params.toString()}` : "";
}

export const dashboardApi = {
  me: () => api.get<AnyRecord>("/v1/users/me"),
  projects: (query?: {
    search?: string;
    sort?: string;
    cursor?: string;
    limit?: number;
  }) => api.get<unknown>(`/v1/projects${queryString(query)}` as ApiPath),
  createProject: (data: { name: string; description?: string }) =>
    api.post<AnyRecord>("/v1/projects", data, {
      headers: { "Idempotency-Key": idempotencyKey("project-create") },
    }),
  approveProject: (id: string) =>
    api.post<AnyRecord>(
      `/v1/projects/${pathSegment(id)}/approve` as ApiPath,
      {},
    ),
  exportProjects: () => api.download("/v1/projects/export.csv", "projects.csv"),
  aiStatus: () => api.get<{ enabled: boolean }>("/v1/ai/status"),
};
