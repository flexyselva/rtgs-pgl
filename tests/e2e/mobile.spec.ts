/**
 * Mobile layout regression tests — 375px viewport (iPhone SE)
 *
 * Ensures key UI elements are still visible and usable at mobile width.
 */

import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('Mobile layout — 375px', () => {
  test('landing page renders without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('Sign In button is visible on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header-signin')).toBeVisible();
  });

  test('season3 page renders without horizontal overflow', async ({ page }) => {
    await page.goto('/season3.html');
    // Schedule table uses a scroll wrapper — body itself should not overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('schedule table is wrapped in a horizontal scroll container', async ({ page }) => {
    await page.goto('/season3.html');
    const wrap = page.locator('.schedule-table-wrap').first();
    await expect(wrap).toBeVisible();
  });

  test('standings or table is visible on mobile', async ({ page }) => {
    await page.goto('/season3.html');
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
