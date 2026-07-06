import { describe, expect, it } from "vitest";
import { parseArgs, slugify, titleize } from "../src/options.js";

describe("create-app options", () => {
  it("normalizes project names into package-safe slugs", () => {
    expect(slugify("Acme Admin Platform!")).toBe("acme-admin-platform");
    expect(titleize("acme-admin-platform")).toBe("Acme Admin Platform");
  });

  it("parses noninteractive flags", () => {
    expect(
      parseArgs([
        "My App",
        "--yes",
        "--no-worker",
        "--no-ai",
        "--storage",
        "s3",
        "--install",
        "--target",
        "/tmp/my-app",
      ]),
    ).toMatchObject({
      yes: true,
      projectName: "My App",
      includeWorker: false,
      includeAi: false,
      storageProvider: "s3",
      runInstall: true,
      targetDir: "/tmp/my-app",
    });
  });
});
