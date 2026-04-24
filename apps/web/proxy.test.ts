import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function createRequest(pathname: string, sessionToken?: string) {
  const request = new NextRequest(`http://localhost:3000${pathname}`);

  if (sessionToken) {
    request.cookies.set("better-auth.session_token", sessionToken);
  }

  return request;
}

describe("proxy", () => {
  it("redirects anonymous dashboard requests to sign in", () => {
    const response = proxy(createRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?callbackUrl=%2Fdashboard",
    );
  });

  it("redirects authenticated auth requests to dashboard", () => {
    const response = proxy(createRequest("/sign-in", "session"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });
});
