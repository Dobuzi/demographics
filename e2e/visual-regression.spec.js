// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Visual regression tests for map rendering
 * These tests capture screenshots and compare against baseline images
 */

test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    /* Wait for map to fully render */
    await page.waitForSelector("#flow-map svg", { state: "attached" });
    await page.waitForTimeout(1000); /* Allow animations to settle */
  });

  test("map renders correctly on initial load", async ({ page }) => {
    const map = page.locator(".map-shell");
    await expect(map).toHaveScreenshot("map-initial.png", {
      maxDiffPixels: 100,
      animations: "disabled",
    });
  });

  test("flow lines render with gradients", async ({ page }) => {
    const flowGroup = page.locator("#flow-lines");
    await expect(flowGroup).toBeVisible();
    await expect(flowGroup).toHaveScreenshot("flow-lines.png", {
      maxDiffPixels: 50,
      animations: "disabled",
    });
  });

  test("region shapes render with proper fills", async ({ page }) => {
    const regions = page.locator(".region-shape").first();
    await expect(regions).toBeVisible();
    const mapSvg = page.locator("#flow-map svg");
    await expect(mapSvg).toHaveScreenshot("regions.png", {
      maxDiffPixels: 100,
      animations: "disabled",
    });
  });

  test("legend panel displays correctly", async ({ page }) => {
    const legend = page.locator("#net-legend");
    await expect(legend).toBeVisible();
    await expect(legend).toHaveScreenshot("legend.png", {
      maxDiffPixels: 20,
    });
  });

  test("sidebar renders top flows correctly", async ({ page }) => {
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveScreenshot("sidebar.png", {
      maxDiffPixels: 50,
    });
  });

  test("year change updates map appearance", async ({ page }) => {
    const yearSlider = page.locator("#year-range");
    await yearSlider.fill("2000");
    await yearSlider.dispatchEvent("change");
    await page.waitForTimeout(500);
    const map = page.locator(".map-shell");
    await expect(map).toHaveScreenshot("map-year-2000.png", {
      maxDiffPixels: 100,
      animations: "disabled",
    });
  });

  test("hover state highlights flow correctly", async ({ page }) => {
    const flowLine = page.locator(".flow-line").first();
    await flowLine.hover();
    await page.waitForTimeout(200);
    const flowGroup = page.locator("#flow-lines");
    await expect(flowGroup).toHaveScreenshot("flow-hover.png", {
      maxDiffPixels: 100,
      animations: "disabled",
    });
  });

  test("settings panel opens correctly", async ({ page }) => {
    const settingsToggle = page.locator("#settings-toggle");
    await settingsToggle.click();
    await page.waitForTimeout(300);
    const settingsPanel = page.locator("#settings-panel");
    await expect(settingsPanel).toBeVisible();
    await expect(settingsPanel).toHaveScreenshot("settings-panel.png", {
      maxDiffPixels: 30,
    });
  });
});

test.describe("Visual Regression - Responsive", () => {
  test("mobile layout renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForSelector("#flow-map svg", { state: "attached" });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("mobile-layout.png", {
      maxDiffPixels: 150,
      animations: "disabled",
    });
  });

  test("tablet layout renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector("#flow-map svg", { state: "attached" });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("tablet-layout.png", {
      maxDiffPixels: 150,
      animations: "disabled",
    });
  });
});
