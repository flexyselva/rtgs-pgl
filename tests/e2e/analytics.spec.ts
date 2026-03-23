/**
 * Analytics E2E tests
 *
 * Covers:
 *   - POST /api/track   — event ingestion, auth, field validation
 *   - GET  /api/analytics — retrieval, auth, days parameter
 *   - /analytics.html   — access control, dashboard rendering, tab interactions
 *   - Admin bar         — analytics link on season3.html
 *   - trackEvent        — events fired when pages are visited
 *
 * Note: analytics events have no test-isolation equivalent (unlike results which
 * use X-Test-Mode). Events written here persist in the real KV analytics keys.
 * Test events use the event name prefix "e2e_" so they're identifiable in the dashboard.
 */

import { test, expect } from '@playwright/test';
import { setSession }    from './helpers/auth';

const BASE      = 'https://rtgs-pgl.selvaraj-s.workers.dev';
const WRITE_KEY = 'rtgs-kv-w-2026';
const WRONG_KEY = 'not-the-key';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/track
// ─────────────────────────────────────────────────────────────────────────────
test.describe('POST /api/track', () => {

  test('valid event returns 200 { ok: true }', async ({ request }) => {
    const res = await request.post(`${BASE}/api/track`, {
      headers: { 'Content-Type': 'application/json' },
      data: { event: 'e2e_ping', page: '/', persona: 'fan', username: 'guest' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('invalid JSON returns 400', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ bad json }',
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });

  test('response includes CORS header', async ({ request }) => {
    const res = await request.post(`${BASE}/api/track`, {
      headers: { 'Content-Type': 'application/json' },
      data: { event: 'e2e_cors_check', page: '/', persona: 'fan', username: 'guest' },
    });
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

  test('tracked event is retrievable via GET /api/analytics', async ({ request }) => {
    const uniqueEvent = `e2e_verify_${Date.now()}`;

    await request.post(`${BASE}/api/track`, {
      headers: { 'Content-Type': 'application/json' },
      data: { event: uniqueEvent, page: '/test', persona: 'admin', username: 'admin' },
    });

    const res = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const body = await res.json();
    const found = body.events.find((e: Record<string, string>) => e.event === uniqueEvent);
    expect(found).toBeDefined();
  });

  test('stored event has all required fields', async ({ request }) => {
    const uniqueEvent = `e2e_fields_${Date.now()}`;

    await request.post(`${BASE}/api/track`, {
      headers: { 'Content-Type': 'application/json' },
      data: { event: uniqueEvent, page: '/season3.html', persona: 'captain', username: 'captain.d' },
    });

    const res = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const body = await res.json();
    const ev = body.events.find((e: Record<string, string>) => e.event === uniqueEvent);

    expect(ev).toMatchObject({
      event:    uniqueEvent,
      page:     '/season3.html',
      persona:  'captain',
      username: 'captain.d',
    });
    expect(ev.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
    expect(typeof ev.country).toBe('string');       // country present (may be empty string)
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics
// ─────────────────────────────────────────────────────────────────────────────
test.describe('GET /api/analytics', () => {

  test('without auth header returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorised');
  });

  test('wrong write key returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics`, {
      headers: { 'X-Write-Key': WRONG_KEY },
    });
    expect(res.status()).toBe(401);
  });

  test('correct write key returns 200 with events array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
  });

  test('response includes CORS header', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

  test('days=1 returns fewer or equal events than days=7', async ({ request }) => {
    const [res1, res7] = await Promise.all([
      request.get(`${BASE}/api/analytics?days=1`, { headers: { 'X-Write-Key': WRITE_KEY } }),
      request.get(`${BASE}/api/analytics?days=7`, { headers: { 'X-Write-Key': WRITE_KEY } }),
    ]);
    const count1 = (await res1.json()).events.length;
    const count7 = (await res7.json()).events.length;
    expect(count1).toBeLessThanOrEqual(count7);
  });

  test('days capped at 30 — days=100 does not error', async ({ request }) => {
    const res = await request.get(`${BASE}/api/analytics?days=100`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
  });

  test('OPTIONS preflight returns CORS headers', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/analytics`, {
      method: 'OPTIONS',
      headers: {
        'Origin': BASE,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-Write-Key',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// /analytics.html — access control
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Analytics dashboard — access control', () => {

  test('fan (no session) is redirected away from /analytics.html', async ({ page }) => {
    await page.goto('/analytics.html');
    await expect(page).not.toHaveURL(/analytics\.html/);
  });

  test('captain is redirected away from /analytics.html', async ({ page }) => {
    await page.goto('/season3.html');
    await setSession(page, 'captain-d');
    await page.goto('/analytics.html');
    await expect(page).not.toHaveURL(/analytics\.html/);
  });

  test('admin can access /analytics.html', async ({ page }) => {
    await page.goto('/season3.html');
    await setSession(page, 'admin');
    await page.goto('/analytics.html');
    await expect(page).toHaveURL(/analytics\.html/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// /analytics.html — dashboard rendering
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Analytics dashboard — rendering', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/season3.html');
    await setSession(page, 'admin');
    await page.goto('/analytics.html');
    // Wait for data to load (loading state clears)
    await page.waitForFunction(
      () => !document.getElementById('mainContent')?.textContent?.includes('Loading'),
      { timeout: 10_000 },
    );
  });

  test('shows "Usage Analytics" in nav', async ({ page }) => {
    await expect(page.locator('.nav-title')).toContainText('Usage Analytics');
  });

  test('shows back link to /season3.html', async ({ page }) => {
    await expect(page.locator('.nav-back')).toHaveAttribute('href', '/season3.html');
  });

  test('shows 3 range tabs', async ({ page }) => {
    await expect(page.locator('.range-tab')).toHaveCount(3);
  });

  test('7 days tab is active by default', async ({ page }) => {
    await expect(page.locator('.range-tab.active')).toContainText('7 days');
  });

  test('shows 4 summary cards', async ({ page }) => {
    await expect(page.locator('.card')).toHaveCount(4);
  });

  test('summary card labels are correct', async ({ page }) => {
    const labels = page.locator('.card-label');
    await expect(labels.nth(0)).toContainText('Total Events');
    await expect(labels.nth(1)).toContainText('Unique Users');
    await expect(labels.nth(2)).toContainText('Active Days');
    await expect(labels.nth(3)).toContainText('Top Action');
  });

  test('no error message shown after load', async ({ page }) => {
    await expect(page.locator('#mainContent')).not.toContainText('Could not load analytics');
  });

  test('clicking 14 days tab becomes active', async ({ page }) => {
    await page.locator('.range-tab').nth(1).click();
    await page.waitForFunction(
      () => !document.getElementById('mainContent')?.textContent?.includes('Loading'),
      { timeout: 10_000 },
    );
    await expect(page.locator('.range-tab.active')).toContainText('14 days');
  });

  test('clicking 30 days tab becomes active', async ({ page }) => {
    await page.locator('.range-tab').nth(2).click();
    await page.waitForFunction(
      () => !document.getElementById('mainContent')?.textContent?.includes('Loading'),
      { timeout: 10_000 },
    );
    await expect(page.locator('.range-tab.active')).toContainText('30 days');
  });

  test('recent events table is rendered (or empty-note shown)', async ({ page }) => {
    // Either a table or the empty-note div must be present
    const table    = page.locator('.table-section table');
    const emptyMsg = page.locator('.empty-note');
    const either   = await table.count() > 0 || await emptyMsg.count() > 0;
    expect(either).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// season3.html — admin bar analytics link
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin bar — analytics link', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/season3.html');
    await setSession(page, 'admin');
  });

  test('analytics link is visible in admin bar', async ({ page }) => {
    await expect(page.locator('.admin-bar a[href="/analytics.html"]')).toBeVisible();
  });

  test('analytics link navigates to dashboard', async ({ page }) => {
    await page.locator('.admin-bar a[href="/analytics.html"]').click();
    await expect(page).toHaveURL(/analytics\.html/);
    await expect(page.locator('.nav-title')).toContainText('Usage Analytics');
  });

  test('analytics link is not visible to captain', async ({ page }) => {
    await setSession(page, 'captain-d');
    // Admin bar itself is not shown for captains
    await expect(page.locator('#adminBarWrap')).not.toBeVisible();
  });

  test('analytics link is not visible to fan', async ({ page }) => {
    await setSession(page, 'fan');
    await expect(page.locator('#adminBarWrap')).not.toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// trackEvent integration — events fired on page visits
// ─────────────────────────────────────────────────────────────────────────────
test.describe('trackEvent integration', () => {

  test('visiting season3.html fires a page_view event', async ({ page, request }) => {
    const before = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const countBefore = (await before.json()).events.length;

    await page.goto('/season3.html');
    await page.waitForLoadState('networkidle');

    const after = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const eventsAfter = (await after.json()).events as Record<string, string>[];
    expect(eventsAfter.length).toBeGreaterThan(countBefore);

    const pageViews = eventsAfter.filter(
      e => e.event === 'page_view' && e.page === '/season3.html',
    );
    expect(pageViews.length).toBeGreaterThan(0);
  });

  test('visiting index.html fires a page_view event', async ({ page, request }) => {
    const before = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const countBefore = (await before.json()).events.length;

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const after = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const eventsAfter = (await after.json()).events as Record<string, string>[];
    expect(eventsAfter.length).toBeGreaterThan(countBefore);

    const pageViews = eventsAfter.filter(
      e => e.event === 'page_view' && e.page === '/',
    );
    expect(pageViews.length).toBeGreaterThan(0);
  });

  test('opening a match modal fires a match_view event', async ({ page, request }) => {
    await page.goto('/season3.html');
    await setSession(page, 'admin');

    const before = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const countBefore = (await before.json()).events.length;

    // Click a match row to open the detail modal
    await page.locator('table tbody tr').first().click();
    await page.waitForLoadState('networkidle');

    const after = await request.get(`${BASE}/api/analytics?days=1`, {
      headers: { 'X-Write-Key': WRITE_KEY },
    });
    const eventsAfter = (await after.json()).events as Record<string, string>[];
    expect(eventsAfter.length).toBeGreaterThan(countBefore);

    const matchViews = eventsAfter.filter(e => e.event === 'match_view');
    expect(matchViews.length).toBeGreaterThan(0);
  });

});
