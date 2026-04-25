import { check } from "k6";
import http from "k6/http";
import { API_BASE_URL, invalidCredentials } from "./config";

export function getHealth() {
  const res = http.get(`${API_BASE_URL}/health`);

  check(res, {
    "health status is 200": (response) => response.status === 200,
    "health response is fast": (response) => response.timings.duration < 500,
  });
}

export function postInvalidSignIn() {
  const res = http.post(
    `${API_BASE_URL}/auth/sign-in/email`,
    JSON.stringify(invalidCredentials),
    {
      headers: {
        "Content-Type": "application/json",
      },
      responseCallback: http.expectedStatuses(401),
    },
  );

  check(res, {
    "invalid sign-in returns 401": (response) => response.status === 401,
    "invalid sign-in is not a server error": (response) =>
      response.status < 500,
  });
}
