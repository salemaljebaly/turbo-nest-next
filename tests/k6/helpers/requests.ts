import { check } from "k6";
import http from "k6/http";
import { API_BASE_URL, WEB_BASE_URL } from "../config";
import type { AuthSession } from "./auth";

export function hitLanding() {
  const res = http.get(`${WEB_BASE_URL}/`);
  check(res, {
    "landing: 200": (response) => response.status === 200,
  });
}

export function hitHealth() {
  const res = http.get(`${API_BASE_URL}/health`);
  check(res, {
    "health: 200": (response) => response.status === 200,
  });
}

export function hitAuthenticatedApi(session: AuthSession | null) {
  if (!session) {
    return;
  }

  const res = http.get(`${API_BASE_URL}/v1/users/me`, {
    headers: {
      Cookie: session.cookieHeader,
    },
  });

  check(res, {
    "users me: 200": (response) => response.status === 200,
  });
}
