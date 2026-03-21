/**
 * Admin persona E2E tests — season3.html
 *
 * All writes go through X-Test-Mode: 1 (isolated KV key).
 * The apiDelete helper cleans up before/after each test.
 */

import { test, expect } from '@playwright/test';
import { setSession } from './helpers/auth';
import { apiDelete, apiGet, apiPost } from './helpers/api';

const BASE = 'https://rtgs-pgl.selvaraj-s.workers.dev';

test.describe('Admin persona', () => {
  test.beforeEach(async ({ page }) => {
    await apiDelete(BASE);
    await page.goto('/season3.html');  // navigate first so sessionStorage is accessible
    await setSession(page, 'admin');
  });

  test.afterEach(async () => {
    await apiDelete(BASE);
  });

  test('admin bar is visible after login', async ({ page }) => {
    const adminBar = page.locator('.admin-bar').first();
    await expect(adminBar).toBeVisible();
  });

  test('admin bar contains instructional text', async ({ page }) => {
    await expect(page.locator('.admin-bar')).toContainText(/Admin Mode/i);
  });

  test('user display shows "Admin" in nav', async ({ page }) => {
    await expect(page.locator('body')).toContainText('Admin');
  });

  test('Sign Out button is visible', async ({ page }) => {
    const signOut = page.locator('button:has-text("Sign Out"), .nav-logout').first();
    await expect(signOut).toBeVisible();
  });

  test('edit buttons (✎) appear on match rows', async ({ page }) => {
    // Admin should see edit buttons on schedule rows
    const editBtns = page.locator('button:has-text("✎")');
    await expect(editBtns.first()).toBeVisible();
  });

  test('clicking a match row opens a result modal', async ({ page }) => {
    // Click first edit button
    await page.locator('button:has-text("✎")').first().click();
    // A modal/overlay/form should appear
    const modal = page.locator('.modal, .result-modal, [id*="modal"], [class*="modal"]').first();
    await expect(modal).toBeVisible();
  });
});

// ── API-level admin write tests (using fetch, not browser UI) ────────────────

test.describe('Admin — KV write/read via API', () => {

  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('can write a result and read it back', async () => {
    await apiPost(BASE, { '1': { points: { d: 1, r: 0 }, course: 'Prestige GC', date: 'Apr 2026' } });
    const data = await apiGet(BASE);
    expect((data['1'] as { points: { d: number; r: number } }).points).toEqual({ d: 1, r: 0 });
  });

  test('can record a halve (d:0.5 r:0.5)', async () => {
    await apiPost(BASE, { '3': { points: { d: 0.5, r: 0.5 } } });
    const data = await apiGet(BASE);
    expect((data['3'] as { points: { d: number; r: number } }).points).toEqual({ d: 0.5, r: 0.5 });
  });

  test('merges results without overwriting previous entries', async () => {
    await apiPost(BASE, { '1': { points: { d: 1, r: 0 } } });
    await apiPost(BASE, { '2': { points: { d: 0, r: 1 } } });
    const data = await apiGet(BASE);
    expect(data['1']).toBeDefined();
    expect(data['2']).toBeDefined();
  });

  test('can correct a previously recorded result', async () => {
    await apiPost(BASE, { '1': { points: { d: 1, r: 0 } } });
    await apiPost(BASE, { '1': { points: { d: 0.5, r: 0.5 } } }); // correction
    const data = await apiGet(BASE);
    expect((data['1'] as { points: { d: number; r: number } }).points).toEqual({ d: 0.5, r: 0.5 });
  });

  test('DELETE clears test results', async () => {
    await apiPost(BASE, { '5': { points: { d: 1, r: 0 } } });
    await apiDelete(BASE);
    const data = await apiGet(BASE);
    expect(Object.keys(data)).toHaveLength(0);
  });
});
