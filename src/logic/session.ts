/**
 * session.ts — Session expiry and inactivity timeout logic extracted from
 * season3.html (SESSION_TIMEOUT_MS / inactivity check) and auth.js
 * (DEFAULT_SESSION shape).
 *
 * No DOM, no fetch, no sessionStorage dependencies.
 */

export interface Session {
  username: string;
  role: string;
  team: string | null;
  display: string;
  token?: string;
  /** Unix epoch ms at which the session expires (optional). */
  exp?: number;
}

/**
 * The default (unauthenticated) session — mirrors auth.js DEFAULT_SESSION.
 */
export const DEFAULT_SESSION: Session = {
  username: 'guest',
  role:     'fan',
  team:     null,
  display:  'Player / Fan',
};

/**
 * Returns true if the session has an expiry timestamp (`exp`) and the
 * current time (nowMs) is past it.
 *
 * If `exp` is absent the session is considered not expired.
 */
export function isSessionExpired(session: Session, nowMs: number): boolean {
  if (session.exp === undefined) return false;
  return nowMs > session.exp;
}

/**
 * Returns true if the user has been inactive for longer than `timeoutMs`.
 *
 * Mirrors the inactivity check in season3.html:
 *   if (Date.now() - _lastActivity > SESSION_TIMEOUT_MS) { … }
 */
export function isInactivityTimeout(
  lastActivityMs: number,
  nowMs: number,
  timeoutMs: number,
): boolean {
  return (nowMs - lastActivityMs) > timeoutMs;
}
