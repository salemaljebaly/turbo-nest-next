import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

function mockFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from the standard API envelope", async () => {
    mockFetch(
      Response.json({
        success: true,
        data: { message: "ok" },
      }),
    );

    await expect(api.get<{ message: string }>("/")).resolves.toEqual({
      message: "ok",
    });
  });

  it("supports empty success responses", async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(api.delete<void>("/")).resolves.toBeUndefined();
  });

  it("raises API errors from the error envelope", async () => {
    mockFetch(
      Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "No access",
          },
        },
        { status: 403 },
      ),
    );

    await expect(api.get("/")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "No access",
    } satisfies Partial<ApiError>);
  });

  it("rejects non-json API responses", async () => {
    mockFetch(new Response("<html />", { status: 502 }));

    await expect(api.get("/")).rejects.toMatchObject({
      status: 502,
      code: "INVALID_RESPONSE",
    } satisfies Partial<ApiError>);
  });
});
