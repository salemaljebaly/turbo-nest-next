import { expect, type Page, test } from "@playwright/test";

const e2eEmail = process.env.E2E_TEST_EMAIL;
const e2ePassword = process.env.E2E_TEST_PASSWORD;
const liveAuthEnabled =
  process.env.E2E_RUN_AUTH_FLOWS === "true" && e2eEmail && e2ePassword;

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(e2eEmail ?? "");
  await page.getByLabel("Password").fill(e2ePassword ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("auth flows", () => {
  test("sign-up flow shows email verification notice", async ({ page }) => {
    test.skip(
      !liveAuthEnabled,
      "Set E2E_RUN_AUTH_FLOWS=true with E2E_TEST_EMAIL/E2E_TEST_PASSWORD and a running API.",
    );

    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(e2ePassword ?? "");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("sign-in flow redirects to dashboard", async ({ page }) => {
    test.skip(
      !liveAuthEnabled,
      "Set E2E_RUN_AUTH_FLOWS=true with E2E_TEST_EMAIL/E2E_TEST_PASSWORD and a running API.",
    );

    await signIn(page);
    await expect(
      page.getByRole("heading", { name: /Welcome back/ }),
    ).toBeVisible();
  });

  test("protected route redirects logged-out users to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard$/);
  });

  test("sign-out redirects away from dashboard", async ({ page }) => {
    test.skip(
      !liveAuthEnabled,
      "Set E2E_RUN_AUTH_FLOWS=true with E2E_TEST_EMAIL/E2E_TEST_PASSWORD and a running API.",
    );

    await signIn(page);
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            message: "Invalid email or password.",
          },
        }),
      });
    });

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });
});
