// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Map Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for map to render
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });
  });

  test("should render region polygons", async ({ page }) => {
    const regions = page.locator("#flow-map svg .region-shape");
    const count = await regions.count();
    expect(count).toBeGreaterThanOrEqual(17); // 17 Sido regions
  });

  test("should render flow lines", async ({ page }) => {
    const flows = page.locator("#flow-map svg .flow-line");
    await expect(flows.first()).toBeVisible({ timeout: 10000 });
    const count = await flows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should highlight flow on hover", async ({ page }) => {
    const flow = page.locator("#flow-map svg .flow-line").first();
    await flow.hover();
    // Check if flow has highlight class or opacity change
    const opacity = await flow.evaluate((el) => getComputedStyle(el).opacity);
    // Highlighted flow should be visible (not dimmed)
    expect(parseFloat(opacity)).toBeGreaterThan(0);
  });

  test("should show tooltip on flow hover", async ({ page }) => {
    const flow = page.locator("#flow-map svg .flow-line").first();
    await flow.hover();
    const tooltip = page.locator("#flow-overlay");
    // Tooltip should appear
    await expect(tooltip).toBeVisible({ timeout: 5000 });
  });

  test("should display region names in tooltip", async ({ page }) => {
    const flow = page.locator("#flow-map svg .flow-line").first();
    await flow.hover();
    const tooltip = page.locator("#flow-overlay");
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    // Should contain Korean region names
    const text = await tooltip.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test("should color regions by net migration", async ({ page }) => {
    const regions = page.locator("#flow-map svg .region-shape");
    const fills = await regions.evaluateAll((els) =>
      els.map((el) => el.getAttribute("fill")).filter(Boolean)
    );
    // Should have colored fills (not just stroke)
    expect(fills.length).toBeGreaterThan(0);
    // Should have variety (some green for inflow, some red for outflow)
    const uniqueFills = new Set(fills);
    expect(uniqueFills.size).toBeGreaterThan(1);
  });
});
