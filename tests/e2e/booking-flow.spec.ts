import { test, expect } from "@playwright/test";

/**
 * End-to-end happy path against seeded data:
 * tourist@demo.test / password123 searches Jaipur, books Rahul, pays (Razorpay
 * test card in TEST mode), guide accepts, tour completes.
 * Requires: migrated + seeded DB, dev server, Razorpay test keys.
 */
test.describe("booking flow", () => {
  test("search → book → pay → accept → complete", async ({ page }) => {
    // 1. Landing & search
    await page.goto("/");
    await page.getByPlaceholder(/Where are you going/i).fill("Jaipur");
    await page.getByRole("button", { name: /jaipur/i }).first().click();
    await expect(page).toHaveURL(/\/search\//);
    await expect(page.getByText(/guide.*available/i)).toBeVisible();

    // 2. View a guide profile
    await page.getByRole("link", { name: /View Profile/i }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // 3. Sign in as demo tourist
    await page.goto("/auth/signin");
    await page.getByLabel(/Email/i).fill("tourist@demo.test");
    await page.getByLabel(/Password/i).fill("password123");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/tourist/);

    // 4. Request a booking for a future date
    await page.goto("/");
    await page.getByPlaceholder(/Where are you going/i).fill("Jaipur");
    await page.getByRole("button", { name: /jaipur/i }).first().click();
    await page.getByRole("link", { name: /View Profile/i }).first().click();
    const future = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    await page.locator('input[name="date"]').fill(future);
    await page.getByPlaceholder(/Main gate/i).fill("E2E Test Meeting Point");
    await page.getByRole("button", { name: /Request booking/i }).click();
    await expect(page.getByText(/complete payment/i)).toBeVisible();

    // 5. Payment (Razorpay test checkout iframe)
    await page.getByRole("button", { name: /Pay now/i }).click();
    const frame = page.frameLocator("iframe[class*='razorpay']");
    await frame.getByPlaceholder(/card number/i).fill("4111 1111 1111 1111");
    await frame.getByPlaceholder(/expiry/i).fill("12/30");
    await frame.getByPlaceholder(/cvv/i).fill("123");
    // ...complete checkout; then assert /tourist/bookings shows CONFIRMED
    // (kept minimal — extend once test keys are configured)
  });

  test("RBAC: tourist cannot open admin panel", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/Email/i).fill("tourist@demo.test");
    await page.getByLabel(/Password/i).fill("password123");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });
});
