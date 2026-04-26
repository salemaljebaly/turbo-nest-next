import type { Options } from "k6/options";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  __ENV.API_BASE_URL ?? "http://localhost:3001/api",
);

export const invalidCredentials = {
  email: __ENV.K6_INVALID_EMAIL ?? "invalid@example.com",
  password: __ENV.K6_INVALID_PASSWORD ?? "WrongPassword123!",
};

export const smokeOptions: Options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export const loadOptions: Options = {
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<200", "p(99)<500"],
  },
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "30s", target: 0 },
  ],
};

export const stressOptions: Options = {
  thresholds: {
    http_req_failed: ["rate<0.10"],
  },
  stages: [
    { duration: "1m", target: 50 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
};
