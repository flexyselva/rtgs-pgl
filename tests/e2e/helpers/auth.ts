/**
 * Auth helpers for E2E tests.
 *
 * loginViaUI  — fills the login overlay on the landing page (tests real UI flow)
 * setSession  — injects sessionStorage directly (fast setup for season3 page tests)
 */

import { Page } from '@playwright/test';

export type Role = 'admin' | 'captain-d' | 'captain-r' | 'fan';

const CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin:     { username: 'admin',     password: 'rtgs@2026'  },
  'captain-d': { username: 'captain.d', password: 'dhurandhar' },
  'captain-r': { username: 'captain.r', password: 'rushabh'    },
};

const SESSION_MAP: Record<string, object> = {
  admin:     { username: 'admin',     role: 'admin',   team: null, display: 'Admin' },
  'captain-d': { username: 'captain.d', role: 'captain', team: 'D',  display: 'Capt · Team Dhurandhar' },
  'captain-r': { username: 'captain.r', role: 'captain', team: 'R',  display: 'Capt · Team Rushabh' },
  fan:       { username: 'guest',     role: 'fan',     team: null, display: 'Player / Fan' },
};

/** Login via the overlay UI on the current page (expects login overlay to be accessible). */
export async function loginViaUI(page: Page, role: Exclude<Role, 'fan'>): Promise<void> {
  const creds = CREDENTIALS[role];
  // Open the login overlay via Sign In button
  await page.click('.header-signin');
  await page.waitForSelector('#loginOverlay:not(.hidden)');
  await page.fill('#loginUser', creds.username);
  await page.fill('#loginPass', creds.password);
  await page.click('.login-btn');
  await page.waitForSelector('#loginOverlay.hidden');
}

/**
 * Inject sessionStorage directly — faster for season3.html tests.
 * The page must already be loaded (navigated) before calling this.
 */
export async function setSession(page: Page, role: Role): Promise<void> {
  const session = SESSION_MAP[role];
  await page.evaluate((s) => {
    sessionStorage.setItem('rtgs_session', JSON.stringify(s));
  }, session);
  await page.reload();
}

/** Clear session (revert to fan / Player view). Page must already be loaded. */
export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.removeItem('rtgs_session'));
  await page.reload();
}
