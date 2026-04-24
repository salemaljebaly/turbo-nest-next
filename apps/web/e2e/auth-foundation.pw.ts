import { expect, test } from "@playwright/test";

test.describe("auth foundation", () => {
  test("renders sign-in and sign-up entry points", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(
      page.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
  });

  test("redirects protected dashboard requests to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard$/);
  });
});
