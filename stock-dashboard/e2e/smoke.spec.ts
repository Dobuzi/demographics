/**
 * E2E smoke test for the Stock Dashboard.
 * Run: npx playwright test e2e/smoke.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Stock Dashboard', () => {
  test('loads the dashboard page', async ({ page }) => {
    await page.goto('/');

    // Header is visible
    await expect(page.locator('h1')).toContainText('Stock Dashboard');

    // Ticker input is present
    const input = page.locator('input[aria-label="Ticker symbol input"]');
    await expect(input).toBeVisible();

    // Default tickers are shown
    await expect(page.locator('[role="list"][aria-label="Ticker list"]')).toBeVisible();
  });

  test('can add and remove a ticker', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[aria-label="Ticker symbol input"]');
    await input.fill('MSFT');
    await page.locator('button', { hasText: 'Add' }).click();

    // MSFT chip should appear
    await expect(page.locator('[role="listitem"]', { hasText: 'MSFT' })).toBeVisible();

    // Remove it
    await page.locator('[aria-label="Remove MSFT"]').click();
    await expect(page.locator('[role="listitem"]', { hasText: 'MSFT' })).not.toBeVisible();
  });

  test('shows price performance section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Price Performance')).toBeVisible();
  });

  test('shows financial statements section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Financial Statements')).toBeVisible();
  });

  test('shows news section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=News')).toBeVisible();
  });
});
