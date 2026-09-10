import { expect, test } from "@playwright/test";

const protectedRegisters = [
  "/dashboard/opportunities",
  "/dashboard/customers",
  "/dashboard/sites",
];

test.describe("HelioCoreOS component foundation", () => {
  for (const route of protectedRegisters) {
    test(`protects ${route} for anonymous users`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("public app shell still renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HelioCoreOS/i);
  });
});
