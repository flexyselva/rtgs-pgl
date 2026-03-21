/**
 * Fan / Player persona tests — season3.html
 * Default unauthenticated view: read-only, no admin controls.
 */

import { test, expect } from '@playwright/test';

test.describe('Fan / Player persona', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh context per test = no session by default → fan view
    await page.goto('/season3.html');
  });

  test('season3 page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/season3/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('standings or schedule section is visible', async ({ page }) => {
    // At least one of these sections must exist
    const table = page.locator('table, .schedule-table').first();
    await expect(table).toBeVisible();
  });

  test('no admin edit buttons are visible', async ({ page }) => {
    // Admin edit buttons (✎) should not appear for fan
    const editBtns = page.locator('[data-action="edit"], .edit-btn, button:has-text("✎")');
    await expect(editBtns).toHaveCount(0);
  });

  test('no admin bar is visible', async ({ page }) => {
    // Admin bar exists in DOM but should be hidden for fans
    const adminBarWrap = page.locator('#adminBarWrap');
    if (await adminBarWrap.count() > 0) {
      await expect(adminBarWrap).not.toBeVisible();
    }
  });

  test('Sign In link is visible in nav', async ({ page }) => {
    // Fan sees a Sign In link (not a user chip)
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('KV results load without error (GET /api/results returns 200)', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/results') && r.request().method() === 'GET'),
      page.goto('/season3.html'),
    ]);
    expect(response.status()).toBe(200);
  });
});
