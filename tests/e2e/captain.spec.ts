/**
 * Captain persona E2E tests — season3.html
 *
 * Tests both Captain D (Team Dhurandhar) and Captain R (Team Rushabh).
 * All writes go through X-Test-Mode: 1 (isolated KV key).
 */

import { test, expect } from '@playwright/test';
import { setSession } from './helpers/auth';
import { apiDelete } from './helpers/api';

const BASE = 'https://rtgs-pgl.selvaraj-s.workers.dev';

test.describe('Captain D persona', () => {
  test.beforeEach(async ({ page }) => {
    await apiDelete(BASE);
    await page.goto('/season3.html');
    await setSession(page, 'captain-d');
  });

  test.afterEach(async () => { await apiDelete(BASE); });

  test('captain dashboard is visible', async ({ page }) => {
    // Captain-specific dashboard should appear
    const dashboard = page.locator('.captain-dashboard, [class*="captain"]').first();
    await expect(dashboard).toBeVisible();
  });

  test('displays Team Dhurandhar branding', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Dhurandhar/i);
  });

  test('"My Team Matches" filter button is visible', async ({ page }) => {
    const filterBtn = page.locator('button:has-text("My Team")');
    await expect(filterBtn.first()).toBeVisible();
  });

  test('Sign Out button is visible', async ({ page }) => {
    const signOut = page.locator('button:has-text("Sign Out"), .nav-logout').first();
    await expect(signOut).toBeVisible();
  });

  test('captain display name shows in nav', async ({ page }) => {
    await expect(page.locator('body')).toContainText('Capt');
  });
});

test.describe('Captain R persona', () => {
  test.beforeEach(async ({ page }) => {
    await apiDelete(BASE);
    await page.goto('/season3.html');
    await setSession(page, 'captain-r');
  });

  test.afterEach(async () => { await apiDelete(BASE); });

  test('captain dashboard is visible', async ({ page }) => {
    const dashboard = page.locator('.captain-dashboard, [class*="captain"]').first();
    await expect(dashboard).toBeVisible();
  });

  test('displays Team Rushabh branding', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Rushabh/i);
  });

  test('"My Team Matches" filter button is visible', async ({ page }) => {
    const filterBtn = page.locator('button:has-text("My Team")');
    await expect(filterBtn.first()).toBeVisible();
  });
});
