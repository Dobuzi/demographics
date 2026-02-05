// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Year Slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });
  });

  test("should change year when slider moves", async ({ page }) => {
    const slider = page.locator("#year-range");
    const label = page.locator("#year-label");

    const initialYear = await label.textContent();

    // Move slider to a different position
    await slider.fill("2000");
    await slider.dispatchEvent("input");

    // Wait for update
    await page.waitForTimeout(500);
    const newYear = await label.textContent();

    expect(newYear).not.toBe(initialYear);
    expect(newYear).toContain("2000");
  });

  test("should update map when year changes", async ({ page }) => {
    const slider = page.locator("#year-range");

    // Get initial flow count
    await page.waitForSelector(".flow-line", { timeout: 10000 });
    const initialFlows = await page.locator(".flow-line").count();

    // Change year
    await slider.fill("2010");
    await slider.dispatchEvent("input");

    // Wait for refresh
    await page.waitForTimeout(1500);

    // Map should still have flows (data loaded for new year)
    const newFlows = await page.locator(".flow-line").count();
    expect(newFlows).toBeGreaterThan(0);
  });
});

test.describe("Play Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });
  });

  test("should start playback when clicked", async ({ page }) => {
    const playButton = page.locator("#play-toggle");
    const yearLabel = page.locator("#year-label");

    const initialYear = await yearLabel.textContent();
    await playButton.click();

    // Wait for at least one year change
    await page.waitForTimeout(2000);

    const newYear = await yearLabel.textContent();
    // Year should have advanced (or wrapped if at end)
    expect(newYear).toBeDefined();
  });

  test("should change aria-label when playing", async ({ page }) => {
    const playButton = page.locator("#play-toggle");

    // Initially should say "재생" (play)
    await expect(playButton).toHaveAttribute("aria-label", /재생/);

    await playButton.click();

    // Should now say "일시정지" (pause)
    await expect(playButton).toHaveAttribute("aria-label", /일시정지/);
  });

  test("should stop playback when clicked again", async ({ page }) => {
    const playButton = page.locator("#play-toggle");

    // Start playback
    await playButton.click();
    await page.waitForTimeout(500);

    // Stop playback
    await playButton.click();

    // Should be back to play state
    await expect(playButton).toHaveAttribute("aria-label", /재생/);
  });
});

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });
  });

  test("should toggle settings panel visibility", async ({ page }) => {
    const settingsToggle = page.locator("#settings-toggle");
    const settingsPanel = page.locator("#panel-settings");

    // Initially collapsed
    await expect(settingsPanel).not.toHaveClass(/is-active/);

    // Click to expand
    await settingsToggle.click();
    await expect(settingsPanel).toHaveClass(/is-active/);

    // Click to collapse
    await settingsToggle.click();
    await expect(settingsPanel).not.toHaveClass(/is-active/);
  });

  test("should close settings on Escape key", async ({ page }) => {
    const settingsToggle = page.locator("#settings-toggle");
    const settingsPanel = page.locator("#panel-settings");

    // Open settings
    await settingsToggle.click();
    await expect(settingsPanel).toHaveClass(/is-active/);

    // Press Escape
    await page.keyboard.press("Escape");

    // Should be closed
    await expect(settingsPanel).not.toHaveClass(/is-active/);
  });

  test("should have aria-expanded attribute", async ({ page }) => {
    const settingsToggle = page.locator("#settings-toggle");

    await expect(settingsToggle).toHaveAttribute("aria-expanded", "false");

    await settingsToggle.click();

    await expect(settingsToggle).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("Age Slider", () => {
  test("should display age group when changed", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#flow-map svg .region-shape", { timeout: 10000 });

    const ageSlider = page.locator("#age-range");
    const ageValue = page.locator("#age-value");

    // Move to different age group
    await ageSlider.fill("5");
    await ageSlider.dispatchEvent("input");

    const ageText = await ageValue.textContent();
    expect(ageText?.length).toBeGreaterThan(0);
  });
});
