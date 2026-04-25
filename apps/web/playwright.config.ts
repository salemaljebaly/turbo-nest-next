import { defineConfig, devices } from "@playwright/test";

declare global {
  var E2E_TEST_EMAIL: string | undefined;
  var E2E_TEST_PASSWORD: string | undefined;
}

globalThis.E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
globalThis.E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.pw.ts",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm exec next dev --port 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_API_URL:
            process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/api",
          NEXT_PUBLIC_AUTH_URL:
            process.env.NEXT_PUBLIC_AUTH_URL ?? "http://127.0.0.1:3001",
        },
      },
});
