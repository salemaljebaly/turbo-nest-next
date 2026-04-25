import type { Options } from "k6/options";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const WEB_BASE_URL = trimTrailingSlash(
  __ENV.WEB_BASE_URL ?? "http://localhost:3000",
);

export const API_BASE_URL = trimTrailingSlash(
  __ENV.API_BASE_URL ?? "http://localhost:3001/api",
);

export const AUTH_EMAIL = __ENV.AUTH_EMAIL;
export const AUTH_PASSWORD = __ENV.AUTH_PASSWORD;

export const commonThresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<750"],
};

export const smokeOptions: Options = {
  vus: 1,
  iterations: 5,
  thresholds: commonThresholds,
};

export const loadOptions: Options = {
  thresholds: commonThresholds,
  stages: [
    { duration: "20s", target: 5 },
    { duration: "1m", target: 20 },
    { duration: "20s", target: 0 },
  ],
};

export const stressOptions: Options = {
  thresholds: {
    http_req_failed: ["rate<0.20"],
    http_req_duration: ["p(95)<3000"],
  },
  stages: [
    { duration: "20s", target: 10 },
    { duration: "40s", target: 50 },
    { duration: "40s", target: 100 },
    { duration: "40s", target: 200 },
    { duration: "20s", target: 0 },
  ],
};
