// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Page Load", () => {
  test("should load the page with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/인구이동/);
  });

  test("should display the SVG map container", async ({ page }) => {
    await page.goto("/");
    const svg = page.locator("#flow-map svg");
    await expect(svg).toBeVisible();
  });

  test("should have correct ARIA attributes on SVG", async ({ page }) => {
    await page.goto("/");
    const svg = page.locator("#flow-map svg");
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute("aria-label", "인구 이동 지도");
  });

  test("should display year label", async ({ page }) => {
    await page.goto("/");
    const yearLabel = page.locator("#year-label");
    await expect(yearLabel).toBeVisible();
    await expect(yearLabel).toHaveText(/\d{4}/);
  });

  test("should display stat total", async ({ page }) => {
    await page.goto("/");
    const statTotal = page.locator("#stat-total");
    // Wait for data to load
    await expect(statTotal).toBeVisible({ timeout: 10000 });
  });

  test("should register service worker", async ({ page }) => {
    await page.goto("/");
    // Wait for SW to register
    await page.waitForTimeout(1000);
    const swRegistrations = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return [];
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.map((r) => r.active?.scriptURL || r.installing?.scriptURL);
    });
    expect(swRegistrations.some((url) => url?.includes("sw.js"))).toBe(true);
  });
});
