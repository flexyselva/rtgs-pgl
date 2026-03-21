/**
 * Login flow E2E tests — index.html
 *
 * Tests the actual login overlay UI: open, fill, submit, and persona switch.
 */

import { test, expect } from '@playwright/test';

test.describe('Login flow — index.html', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh context per test — no session by default
    await page.goto('/');
  });

  test('Sign In button opens the login overlay', async ({ page }) => {
    await page.click('.header-signin');
    await expect(page.locator('#loginOverlay')).not.toHaveClass(/hidden/);
  });

  test('admin login succeeds and shows Admin in header', async ({ page }) => {
    await page.click('.header-signin');
    await page.fill('#loginUser', 'admin');
    await page.fill('#loginPass', 'rtgs@2026');
    await page.click('.login-btn');
    await expect(page.locator('#loginOverlay')).toHaveClass(/hidden/);
    await expect(page.locator('#headerAuth')).toContainText('Admin');
  });

  test('wrong password shows error message', async ({ page }) => {
    await page.click('.header-signin');
    await page.fill('#loginUser', 'admin');
    await page.fill('#loginPass', 'wrongpassword');
    await page.click('.login-btn');
    // Overlay should remain open and show an error
    await expect(page.locator('#loginOverlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#loginError')).not.toBeEmpty();
  });

  test('Captain D login succeeds', async ({ page }) => {
    await page.click('.header-signin');
    await page.fill('#loginUser', 'captain.d');
    await page.fill('#loginPass', 'dhurandhar');
    await page.click('.login-btn');
    await expect(page.locator('#loginOverlay')).toHaveClass(/hidden/);
    await expect(page.locator('#headerAuth')).toContainText('Dhurandhar');
  });

  test('Captain R login succeeds', async ({ page }) => {
    await page.click('.header-signin');
    await page.fill('#loginUser', 'captain.r');
    await page.fill('#loginPass', 'rushabh');
    await page.click('.login-btn');
    await expect(page.locator('#loginOverlay')).toHaveClass(/hidden/);
    await expect(page.locator('#headerAuth')).toContainText('Rushabh');
  });

  test('Sign Out reverts to Sign In button', async ({ page }) => {
    // Login first
    await page.click('.header-signin');
    await page.fill('#loginUser', 'admin');
    await page.fill('#loginPass', 'rtgs@2026');
    await page.click('.login-btn');
    await expect(page.locator('#loginOverlay')).toHaveClass(/hidden/);
    // Sign out
    await page.locator('.header-signout').click();
    await expect(page.locator('.header-signin')).toBeVisible();
  });
});
