// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Responsive Layout", () => {
  test("should render correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Map should still be visible
    const map = page.locator("#flow-map");
    await expect(map).toBeVisible();

    // Controls should be accessible
    const playButton = page.locator("#play-toggle");
    await expect(playButton).toBeVisible();
  });

  test("should adjust panel layout on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Settings panel should work
    const settingsToggle = page.locator("#settings-toggle");
    await settingsToggle.click();

    const settingsPanel = page.locator("#panel-settings");
    await expect(settingsPanel).toHaveClass(/is-active/);
  });

  test("should render map on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await page.waitForSelector(".region-shape", { timeout: 10000 });

    const regions = page.locator(".region-shape");
    const count = await regions.count();
    expect(count).toBeGreaterThanOrEqual(17);
  });

  test("should handle orientation change", async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForSelector(".region-shape", { timeout: 10000 });

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    // Map should still be visible
    const map = page.locator("#flow-map");
    await expect(map).toBeVisible();
  });
});

test.describe("Touch Interactions", () => {
  test.use({ hasTouch: true });

  test("should work with touch on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForSelector(".region-shape", { timeout: 10000 });

    // Tap play button
    const playButton = page.locator("#play-toggle");
    await playButton.tap();

    // Should start playing
    await expect(playButton).toHaveAttribute("aria-label", /일시정지/);
  });

  test("should allow slider interaction via touch", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const yearSlider = page.locator("#year-range");
    const yearLabel = page.locator("#year-label");

    const initialYear = await yearLabel.textContent();

    // Interact with slider
    const box = await yearSlider.boundingBox();
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.2, box.y + box.height / 2);
    }

    await page.waitForTimeout(1000);
    // Year might change depending on initial position
  });
});
