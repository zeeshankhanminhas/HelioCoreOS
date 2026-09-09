import { expect, test } from "@playwright/test";

test.describe("Opportunities foundation", () => {
  test("protects the opportunity register for anonymous users", async ({ page }) => {
    await page.goto("/dashboard/opportunities");
    await expect(page).toHaveURL(/\/login/);
  });

  test("public app shell still renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HelioCoreOS/i);
  });
});
