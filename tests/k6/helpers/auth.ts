import { check } from "k6";
import http from "k6/http";
import { API_BASE_URL, AUTH_EMAIL, AUTH_PASSWORD } from "../config";

export type AuthSession = {
  cookieHeader: string;
};

export function signIn(): AuthSession | null {
  if (!AUTH_EMAIL || !AUTH_PASSWORD) {
    return null;
  }

  const res = http.post(
    `${API_BASE_URL}/auth/sign-in/email`,
    JSON.stringify({
      email: AUTH_EMAIL,
      password: AUTH_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  check(res, {
    "auth sign-in: 200": (response) => response.status === 200,
    "auth sign-in: session cookie": (response) =>
      Object.keys(response.cookies).some((name) =>
        name.startsWith("better-auth.session_token"),
      ),
  });

  const cookieHeader = Object.entries(res.cookies)
    .flatMap(([name, cookies]) =>
      cookies.map((cookie) => `${name}=${cookie.value}`),
    )
    .join("; ");

  return cookieHeader ? { cookieHeader } : null;
}
