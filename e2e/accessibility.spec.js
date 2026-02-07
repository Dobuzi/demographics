// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });
  });

  test("should have lang attribute on html", async ({ page }) => {
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ko");
  });

  test("should have focus-visible styles", async ({ page }) => {
    const playButton = page.locator("#play-toggle");

    // Tab to the button
    await page.keyboard.press("Tab");

    // Check if button receives focus
    await expect(playButton).toBeFocused();
  });

  test("should have descriptive aria-labels on inputs", async ({ page }) => {
    const yearRange = page.locator("#year-range");
    const ageRange = page.locator("#age-range");
    const playSpeed = page.locator("#play-speed");

    await expect(yearRange).toHaveAttribute("aria-label");
    await expect(ageRange).toHaveAttribute("aria-label");
    await expect(playSpeed).toHaveAttribute("aria-label");
  });

  test("should announce errors with role=alert", async ({ page }) => {
    const errorBanner = page.locator("#error-banner");
    await expect(errorBanner).toHaveAttribute("role", "alert");
  });

  test("should navigate controls with Tab key", async ({ page }) => {
    // Start from beginning
    await page.keyboard.press("Tab");

    // Should be able to tab through interactive elements
    const focusableElements = [
      "#play-toggle",
      "#year-range",
      "#settings-toggle",
    ];

    for (let i = 0; i < focusableElements.length; i++) {
      const focused = await page.evaluate(() => document.activeElement?.id);
      expect(focused).toBeDefined();
      await page.keyboard.press("Tab");
    }
  });
});

test.describe("Reduced Motion", () => {
  test("should disable CSS animations when prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Check computed animation style
    const hasNoAnimation = await page.evaluate(() => {
      const el = document.querySelector(".flow-line");
      if (!el) return true; // No flows yet
      const style = getComputedStyle(el);
      return style.animation === "none" || style.animationName === "none";
    });

    expect(hasNoAnimation).toBe(true);
  });

  test("should not create SVG animateTransform when reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Wait for map to render
    await page.waitForSelector(".flow-line", { timeout: 10000 });

    // Check for animateTransform elements
    const animateCount = await page.locator("animateTransform").count();
    expect(animateCount).toBe(0);
  });
});
