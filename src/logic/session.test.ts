import { describe, it, expect } from 'vitest';
import { isSessionExpired, isInactivityTimeout, DEFAULT_SESSION } from './session';
import type { Session } from './session';

// ── DEFAULT_SESSION ──────────────────────────────────────────────────────────

describe('DEFAULT_SESSION', () => {
  it('has role fan', () => {
    expect(DEFAULT_SESSION.role).toBe('fan');
  });

  it('has username guest', () => {
    expect(DEFAULT_SESSION.username).toBe('guest');
  });

  it('has team null', () => {
    expect(DEFAULT_SESSION.team).toBeNull();
  });

  it('has display Player / Fan', () => {
    expect(DEFAULT_SESSION.display).toBe('Player / Fan');
  });
});

// ── isSessionExpired ─────────────────────────────────────────────────────────

describe('isSessionExpired', () => {
  it('returns false when session has no exp field', () => {
    const session: Session = { username: 'captain.d', role: 'captain', team: 'D', display: 'Capt D' };
    expect(isSessionExpired(session, Date.now())).toBe(false);
  });

  it('returns false when exp is in the future', () => {
    const futureExp = Date.now() + 60_000; // 1 minute from now
    const session: Session = { username: 'admin', role: 'admin', team: null, display: 'Admin', exp: futureExp };
    expect(isSessionExpired(session, Date.now())).toBe(false);
  });

  it('returns true when exp is in the past', () => {
    const pastExp = Date.now() - 1_000; // 1 second ago
    const session: Session = { username: 'captain.r', role: 'captain', team: 'R', display: 'Capt R', exp: pastExp };
    expect(isSessionExpired(session, Date.now())).toBe(true);
  });

  it('returns true when nowMs exactly equals exp (boundary)', () => {
    const exp = 1_700_000_000_000;
    const session: Session = { username: 'admin', role: 'admin', team: null, display: 'Admin', exp };
    // nowMs === exp → NOT expired (nowMs > exp is the condition)
    expect(isSessionExpired(session, exp)).toBe(false);
  });

  it('returns true when nowMs is one millisecond past exp', () => {
    const exp = 1_700_000_000_000;
    const session: Session = { username: 'admin', role: 'admin', team: null, display: 'Admin', exp };
    expect(isSessionExpired(session, exp + 1)).toBe(true);
  });

  it('DEFAULT_SESSION (no exp) is never expired', () => {
    expect(isSessionExpired(DEFAULT_SESSION, Date.now())).toBe(false);
    expect(isSessionExpired(DEFAULT_SESSION, Number.MAX_SAFE_INTEGER)).toBe(false);
  });
});

// ── isInactivityTimeout ──────────────────────────────────────────────────────

describe('isInactivityTimeout', () => {
  const THIRTY_MINUTES_MS = 30 * 60 * 1000; // 1_800_000 ms — mirrors season3.html

  it('returns false when no time has elapsed', () => {
    const now = Date.now();
    expect(isInactivityTimeout(now, now, THIRTY_MINUTES_MS)).toBe(false);
  });

  it('returns false when elapsed time is just under the limit', () => {
    const now = 2_000_000_000_000;
    const last = now - THIRTY_MINUTES_MS + 1; // 1 ms under threshold
    expect(isInactivityTimeout(last, now, THIRTY_MINUTES_MS)).toBe(false);
  });

  it('returns false when elapsed time equals the limit exactly (boundary)', () => {
    const now = 2_000_000_000_000;
    const last = now - THIRTY_MINUTES_MS; // exactly at threshold
    expect(isInactivityTimeout(last, now, THIRTY_MINUTES_MS)).toBe(false);
  });

  it('returns true when elapsed time is just over the limit', () => {
    const now = 2_000_000_000_000;
    const last = now - THIRTY_MINUTES_MS - 1; // 1 ms over threshold
    expect(isInactivityTimeout(last, now, THIRTY_MINUTES_MS)).toBe(true);
  });

  it('returns true when well past the timeout (user has been idle for hours)', () => {
    const now = 2_000_000_000_000;
    const last = now - 2 * THIRTY_MINUTES_MS; // double the timeout
    expect(isInactivityTimeout(last, now, THIRTY_MINUTES_MS)).toBe(true);
  });

  it('works with a custom timeout value', () => {
    const now = 10_000;
    const last = 0;
    expect(isInactivityTimeout(last, now, 9_999)).toBe(true);
    expect(isInactivityTimeout(last, now, 10_001)).toBe(false);
  });

  it('lastActivity equal to now means no inactivity', () => {
    const now = Date.now();
    expect(isInactivityTimeout(now, now, 1)).toBe(false);
  });
});
