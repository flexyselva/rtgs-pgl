/**
 * Dual-captain approval flow E2E tests — season3.html
 *
 * Flow under test:
 *   1. Captain submits a result → status 'pending', row shows "Pending" badge
 *   2. Submitting captain sees "Awaiting approval" mode in modal (no action buttons)
 *   3. Other captain sees "Review" mode with Approve / Dispute buttons
 *   4. Approve → row shows confirmed score; Dispute → row shows "Disputed" badge
 *   5. Admin sees pending/disputed badge in admin bar
 *   6. Admin can force-confirm disputed/pending result via "Override & Save"
 *
 * All writes use X-Test-Mode: 1 (isolated KV key).
 */

import { test, expect, Page } from '@playwright/test';
import { setSession, clearSession } from './helpers/auth';
import { apiDelete, apiPost, apiGet } from './helpers/api';

const BASE = 'https://rtgs-pgl.selvaraj-s.workers.dev';
const URL  = `${BASE}/season3.html`;

// Helper: pre-seed a pending result for match 1 submitted by captain.d
async function seedPending(submittedBy = 'captain.d') {
  await apiPost(BASE, {
    '1': {
      points: { d: 1, r: 0 },
      status: 'pending',
      submittedBy,
      submittedAt: new Date().toISOString(),
      course: 'Test GC',
      date: 'Apr 2026',
    },
  });
}

async function seedDisputed(submittedBy = 'captain.d') {
  await apiPost(BASE, {
    '1': {
      points: { d: 1, r: 0 },
      status: 'disputed',
      submittedBy,
      submittedAt: new Date().toISOString(),
    },
  });
}

// ── Pending badge in match table ─────────────────────────────────────────────

test.describe('Pending badge in table', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('match row shows "Pending" badge after captain submits', async ({ page }) => {
    await seedPending();
    await page.goto(URL);
    await setSession(page, 'fan');
    await expect(page.locator('.status-pending').first()).toBeVisible();
    await expect(page.locator('.status-pending').first()).toContainText(/pending/i);
  });

  test('match row shows "Disputed" badge after captain disputes', async ({ page }) => {
    await seedDisputed();
    await page.goto(URL);
    await setSession(page, 'fan');
    await expect(page.locator('.status-disputed').first()).toBeVisible();
    await expect(page.locator('.status-disputed').first()).toContainText(/disputed/i);
  });

  test('pending match is NOT counted in the scoreboard', async ({ page }) => {
    await seedPending();
    await page.goto(URL);
    await setSession(page, 'fan');
    // Scoreboard should show dash (no scores) since pending is not confirmed
    const scoreD = page.locator('#scoreD');
    const scoreR = page.locator('#scoreR');
    await expect(scoreD).toHaveText('–');
    await expect(scoreR).toHaveText('–');
  });
});

// ── Captain edit button visibility ───────────────────────────────────────────

test.describe('Captain edit button visibility', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('captain sees ✎ button on their own team TBD match', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'captain-d');
    // Captain D should have at least one ✎ button on their team matches
    const editBtns = page.locator('.captain-edit-btn');
    await expect(editBtns.first()).toBeVisible();
  });

  test('captain sees ✎ button (review-btn style) on pending match they did NOT submit', async ({ page }) => {
    await seedPending('captain.d'); // submitted by D
    await page.goto(URL);
    await setSession(page, 'captain-r'); // R needs to review
    // The review button should appear
    const reviewBtn = page.locator('.captain-edit-btn.review-btn');
    await expect(reviewBtn.first()).toBeVisible();
  });

  test('fan has no ✎ buttons at all', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'fan');
    await expect(page.locator('.captain-edit-btn, .admin-edit-btn')).toHaveCount(0);
  });
});

// ── Modal modes ───────────────────────────────────────────────────────────────

test.describe('Modal mode — await (submitter captain)', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('submitting captain sees mode banner with "Awaiting" text', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-d');
    // Click the ✎ button on match 1 row
    await page.locator('.captain-edit-btn').first().click();
    await expect(page.locator('#resultModeBanner')).toBeVisible();
    await expect(page.locator('#resultModeBanner')).toContainText(/awaiting/i);
  });

  test('submitting captain sees no Save / Approve / Dispute buttons in await mode', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-d');
    await page.locator('.captain-edit-btn').first().click();
    await expect(page.locator('#resultSaveBtn')).toHaveCSS('display', 'none');
    await expect(page.locator('#resultApproveBtn')).toHaveCSS('display', 'none');
    await expect(page.locator('#resultDisputeBtn')).toHaveCSS('display', 'none');
  });
});

test.describe('Modal mode — review (other captain)', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('reviewing captain sees mode banner with "Review" text', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await expect(page.locator('#resultModeBanner')).toBeVisible();
    await expect(page.locator('#resultModeBanner')).toContainText(/review/i);
  });

  test('reviewing captain sees Approve and Dispute buttons', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await expect(page.locator('#resultApproveBtn')).toBeVisible();
    await expect(page.locator('#resultDisputeBtn')).toBeVisible();
    await expect(page.locator('#resultSaveBtn')).toHaveCSS('display', 'none');
  });

  test('reviewing captain sees who submitted in modal', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await expect(page.locator('#reviewSection')).toBeVisible();
    await expect(page.locator('#reviewSubmittedBy')).toContainText('captain.d');
  });
});

// ── Approve flow ──────────────────────────────────────────────────────────────

test.describe('Captain approve flow', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('approving captain confirms the result — row shows score', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultApproveBtn').click();
    // Modal closes and status-result span should appear
    await expect(page.locator('.result-modal-overlay')).not.toHaveClass(/open/);
    await expect(page.locator('.status-result').first()).toBeVisible();
  });

  test('KV stores confirmed status after approval', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultApproveBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    const data = await apiGet(BASE) as Record<string, { status: string }>;
    expect(data['1'].status).toBe('confirmed');
  });
});

// ── Dispute flow ──────────────────────────────────────────────────────────────

test.describe('Captain dispute flow', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('disputing captain marks result as disputed — row shows Disputed badge', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultDisputeBtn').click();
    await expect(page.locator('.result-modal-overlay')).not.toHaveClass(/open/);
    await expect(page.locator('.status-disputed').first()).toBeVisible();
  });

  test('KV stores disputed status after dispute', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultDisputeBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    const data = await apiGet(BASE) as Record<string, { status: string }>;
    expect(data['1'].status).toBe('disputed');
  });
});

// ── Admin pending badge ───────────────────────────────────────────────────────

test.describe('Admin bar pending badge', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('admin bar shows pending count badge when pending results exist', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'admin');
    await expect(page.locator('.admin-bar-badge')).toBeVisible();
    await expect(page.locator('.admin-bar-badge')).toContainText('1');
  });

  test('admin bar has no badge when no pending results', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'admin');
    await expect(page.locator('.admin-bar-badge')).toHaveCount(0);
  });
});

// ── Admin override (admin-review mode) ───────────────────────────────────────

test.describe('Admin override pending/disputed', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('admin sees mode banner on pending match', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'admin');
    await page.locator('.admin-edit-btn').first().click();
    await expect(page.locator('#resultModeBanner')).toBeVisible();
    await expect(page.locator('#resultModeBanner')).toContainText(/pending/i);
  });

  test('admin sees Approve As-Is button on pending match', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'admin');
    await page.locator('.admin-edit-btn').first().click();
    await expect(page.locator('#resultApproveBtn')).toBeVisible();
    await expect(page.locator('#resultApproveBtn')).toContainText(/Approve/i);
  });

  test('admin can approve pending match — row shows confirmed score', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'admin');
    await page.locator('.admin-edit-btn').first().click();
    await page.locator('#resultApproveBtn').click();
    await expect(page.locator('.result-modal-overlay')).not.toHaveClass(/open/);
    await expect(page.locator('.status-result').first()).toBeVisible();
  });

  test('admin can override pending match via Override & Save', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'admin');
    await page.locator('.admin-edit-btn').first().click();
    // Change outcome to halve
    await page.locator('#outcomeH').check();
    await page.locator('#resultSaveBtn').click();
    await expect(page.locator('.result-modal-overlay')).not.toHaveClass(/open/);
    const data = await apiGet(BASE) as Record<string, { points: { d: number; r: number }; status: string }>;
    expect(data['1'].status).toBe('confirmed');
    expect(data['1'].points).toEqual({ d: 0.5, r: 0.5 });
  });
});

// ── Match detail modal — pending/disputed state (Observation 1) ──────────────

test.describe('Match detail modal — unconfirmed state', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('pending match shows "Pending Confirmation" status in detail modal', async ({ page }) => {
    await seedPending();
    await page.goto(URL);
    await setSession(page, 'fan');
    // Click the match row (not the ✎ button) to open the detail modal
    await page.locator('tr.clickable-row').first().click();
    await expect(page.locator('#modalBody')).toContainText(/Pending Confirmation/i);
  });

  test('disputed match shows "Result Disputed" status in detail modal', async ({ page }) => {
    await seedDisputed();
    await page.goto(URL);
    await setSession(page, 'fan');
    await page.locator('tr.clickable-row').first().click();
    await expect(page.locator('#modalBody')).toContainText(/Result Disputed/i);
  });

  test('pending match shows approval note in detail modal', async ({ page }) => {
    await seedPending();
    await page.goto(URL);
    await setSession(page, 'fan');
    await page.locator('tr.clickable-row').first().click();
    await expect(page.locator('.modal-pending-note')).toBeVisible();
    await expect(page.locator('.modal-pending-note')).toContainText(/pending other captain/i);
  });

  test('disputed match shows disputed note in detail modal', async ({ page }) => {
    await seedDisputed();
    await page.goto(URL);
    await setSession(page, 'fan');
    await page.locator('tr.clickable-row').first().click();
    await expect(page.locator('.modal-disputed-note')).toBeVisible();
    await expect(page.locator('.modal-disputed-note')).toContainText(/admin review/i);
  });

  test('pending match score uses amber colour class (not confirmed win colour)', async ({ page }) => {
    await seedPending();
    await page.goto(URL);
    await setSession(page, 'fan');
    await page.locator('tr.clickable-row').first().click();
    // Scores should use modal-score-unconfirmed, not modal-score-d / modal-score-r
    await expect(page.locator('.modal-score-unconfirmed').first()).toBeVisible();
    await expect(page.locator('.modal-score-d, .modal-score-r')).toHaveCount(0);
  });

  test('confirmed match still shows "Completed" and uses normal score colours', async ({ page }) => {
    await apiPost(BASE, { '1': { points: { d: 1, r: 0 }, status: 'confirmed' } });
    await page.goto(URL);
    await setSession(page, 'fan');
    await page.locator('tr.clickable-row').first().click();
    await expect(page.locator('#modalBody')).toContainText(/Completed/i);
    await expect(page.locator('.modal-score-d').first()).toBeVisible();
    await expect(page.locator('.modal-pending-note, .modal-disputed-note')).toHaveCount(0);
  });
});

// ── Captain dashboard live refresh (Observation 2) ───────────────────────────

test.describe('Captain dashboard live refresh after actions', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('after submitting, dashboard shows "Awaiting Approval" stat without reload', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'captain-d');
    await page.locator('.captain-edit-btn').first().click();
    await page.locator('#outcomeD').check();
    await page.locator('#resultSaveBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    // Dashboard should immediately reflect awaiting approval — no reload
    await expect(page.locator('.captain-db-body')).toContainText(/Awaiting Approval/i);
  });

  test('after approving, "Needs Review" stat disappears from dashboard without reload', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    // Confirm "Needs Review" is visible before approval
    await expect(page.locator('.captain-db-body')).toContainText(/Needs Review/i);
    // Approve
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultApproveBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    // "Needs Review" should be gone from dashboard without a page reload
    await expect(page.locator('.captain-db-body')).not.toContainText(/Needs Review/i);
  });

  test('after disputing, dashboard no longer shows "Needs Review" for reviewer', async ({ page }) => {
    await seedPending('captain.d');
    await page.goto(URL);
    await setSession(page, 'captain-r');
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultDisputeBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    // After disputing, the match is disputed (not pending review for this captain anymore)
    await expect(page.locator('.captain-db-body')).not.toContainText(/Needs Review/i);
  });

  test('after approving, submitting captain dashboard shows match as played (no Awaiting Approval)', async ({ page }) => {
    // Seed a result submitted by captain.r
    await seedPending('captain.r');
    await page.goto(URL);
    await setSession(page, 'captain-d'); // captain-d is the reviewer
    await page.locator('.captain-edit-btn.review-btn').first().click();
    await page.locator('#resultApproveBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    // Switch to captain-r (the submitter) — reload to simulate them checking
    await setSession(page, 'captain-r');
    await expect(page.locator('.captain-db-body')).not.toContainText(/Awaiting Approval/i);
  });
});

// ── Captain submits result flow ───────────────────────────────────────────────

test.describe('Captain submit result', () => {
  test.beforeEach(async () => { await apiDelete(BASE); });
  test.afterEach(async ()  => { await apiDelete(BASE); });

  test('captain can open edit modal on unplayed match', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'captain-d');
    await page.locator('.captain-edit-btn').first().click();
    await expect(page.locator('.result-modal-overlay')).toHaveClass(/open/);
  });

  test('captain submitting saves to KV with status=pending and submittedBy', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'captain-d');
    // Click ✎ on first match that belongs to team D
    await page.locator('.captain-edit-btn').first().click();
    await page.locator('#outcomeD').check();
    await page.locator('#resultSaveBtn').click();
    await page.waitForSelector('.result-modal-overlay:not(.open)');
    const data = await apiGet(BASE) as Record<string, { status: string; submittedBy: string }>;
    const entry = Object.values(data)[0];
    expect(entry.status).toBe('pending');
    expect(entry.submittedBy).toBe('captain.d');
  });

  test('after submission row shows Pending badge', async ({ page }) => {
    await page.goto(URL);
    await setSession(page, 'captain-d');
    await page.locator('.captain-edit-btn').first().click();
    await page.locator('#outcomeD').check();
    await page.locator('#resultSaveBtn').click();
    await expect(page.locator('.status-pending').first()).toBeVisible();
  });
});
