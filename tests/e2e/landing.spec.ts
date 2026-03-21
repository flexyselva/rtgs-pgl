/**
 * Landing page smoke tests — index.html
 * Verifies branding, navigation, and default Player/Fan state.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page title contains RTGS', async ({ page }) => {
    await expect(page).toHaveTitle(/RTGS/i);
  });

  test('RTGS PGL heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /RTGS/i }).first()).toBeVisible();
  });

  test('Season 3 link is present', async ({ page }) => {
    const s3Link = page.locator('a[href*="season3"]').first();
    await expect(s3Link).toBeVisible();
  });

  test('Sign In button is visible in header by default', async ({ page }) => {
    await expect(page.locator('.header-signin')).toBeVisible();
  });

  test('login overlay is hidden by default', async ({ page }) => {
    await expect(page.locator('#loginOverlay')).toHaveClass(/hidden/);
  });

  test('clicking Sign In opens the login overlay', async ({ page }) => {
    await page.click('.header-signin');
    await expect(page.locator('#loginOverlay')).not.toHaveClass(/hidden/);
  });

  test('page loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/');
    expect(errors).toHaveLength(0);
  });
});
