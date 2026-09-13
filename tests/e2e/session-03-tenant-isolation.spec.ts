import { expect, test, type Page } from "@playwright/test";

const tenantA = {
  email: process.env.E2E_TENANT_A_EMAIL,
  password: process.env.E2E_TENANT_A_PASSWORD,
};
const tenantB = {
  email: process.env.E2E_TENANT_B_EMAIL,
  password: process.env.E2E_TENANT_B_PASSWORD,
};

const tenantAMarker = process.env.E2E_TENANT_A_MARKER ?? "RLS Marker Tenant A";
const tenantBMarker = process.env.E2E_TENANT_B_MARKER ?? "RLS Marker Tenant B";
const tenantASiteMarker = process.env.E2E_TENANT_A_SITE_MARKER ?? "[PK-DEMO] Principal Facility — Faisalabad";
const tenantAOpportunityMarker = process.env.E2E_TENANT_A_OPPORTUNITY_MARKER ?? "Al-Noor Textile Industries (Pvt.) Ltd. — 193 kWp Solar";
const tenantACustomerId = process.env.E2E_TENANT_A_CUSTOMER_ID ?? "30000000-0000-4000-8000-000000000001";
const tenantBCustomerId = process.env.E2E_TENANT_B_CUSTOMER_ID ?? "30000000-0000-4000-8000-000000000002";

const hasCredentials = Boolean(tenantA.email && tenantA.password && tenantB.email && tenantB.password);

test.skip(!hasCredentials, "Session 03 E2E requires E2E_TENANT_A/B email and password secrets.");

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").first().fill(email);
  await page.getByLabel("Password").first().fill(password);
  await page.getByRole("button", { name: "Sign in to HelioCoreOS" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signOut(page: Page) {
  await page.goto("/dashboard");
  const signOutButton = page.getByRole("button", { name: /sign out/i });
  if (await signOutButton.count()) {
    await signOutButton.first().click();
  } else {
    await page.context().clearCookies();
  }
}

test("Tenant A and Tenant B are isolated through the real Neon application path", async ({ page }) => {
  await signIn(page, tenantA.email!, tenantA.password!);

  await page.goto("/dashboard/customers");
  await expect(page.getByTestId("customers-neon-register")).toBeVisible();
  await expect(page.getByText(tenantAMarker, { exact: true })).toBeVisible();
  await expect(page.getByText(tenantBMarker, { exact: true })).toHaveCount(0);

  await page.goto("/dashboard/sites");
  await expect(page.getByTestId("sites-neon-register")).toBeVisible();
  await expect(page.getByText(tenantASiteMarker, { exact: true })).toBeVisible();

  await page.goto("/dashboard/opportunities");
  await expect(page.getByTestId("opportunities-neon-register")).toBeVisible();
  await expect(page.getByText(tenantAOpportunityMarker, { exact: true })).toBeVisible();

  await page.goto(`/dashboard/customers/${tenantBCustomerId}`);
  await expect(page.getByText(tenantBMarker, { exact: true })).toHaveCount(0);

  await signOut(page);
  await signIn(page, tenantB.email!, tenantB.password!);

  await page.goto("/dashboard/customers");
  await expect(page.getByTestId("customers-neon-register")).toBeVisible();
  await expect(page.getByText(tenantBMarker, { exact: true })).toBeVisible();
  await expect(page.getByText(tenantAMarker, { exact: true })).toHaveCount(0);

  await page.goto("/dashboard/sites");
  await expect(page.getByTestId("sites-neon-register")).toBeVisible();
  await expect(page.getByText(tenantASiteMarker, { exact: true })).toHaveCount(0);

  await page.goto("/dashboard/opportunities");
  await expect(page.getByTestId("opportunities-neon-register")).toBeVisible();
  await expect(page.getByText(tenantAOpportunityMarker, { exact: true })).toHaveCount(0);

  await page.goto(`/dashboard/customers/${tenantACustomerId}`);
  await expect(page.getByText(tenantAMarker, { exact: true })).toHaveCount(0);
});
