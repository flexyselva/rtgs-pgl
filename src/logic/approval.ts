/**
 * approval.ts — Approval state machine and permission logic extracted from
 * season3.html (saveResult / approveResult / disputeResult flows).
 *
 * No DOM, no fetch, no sessionStorage dependencies.
 */

import type { Points, OutcomeValue } from './points';
import { outcomeToPoints } from './points';

export type ApprovalStatus = 'tbd' | 'pending' | 'confirmed' | 'disputed';
export type UserRole = 'admin' | 'captain' | 'fan';

export interface ResultPayload {
  points: Points;
  status: ApprovalStatus;
  submittedBy: string;
  submittedAt: string;
  course?: string;
  date?: string;
  netScore?: string;
}

/**
 * Returns true if the given role may submit a new result for a match that
 * currently has the given approval status.
 *
 * Rules (from season3.html saveResult):
 *   admin   — may always submit (override any state)
 *   captain — may only submit when the match is 'tbd' (no result yet)
 *   fan     — never
 */
export function canSubmitResult(role: UserRole, currentStatus: ApprovalStatus): boolean {
  if (role === 'fan') return false;
  if (role === 'admin') return true;
  // captain
  return currentStatus === 'tbd';
}

/**
 * Returns true if the given user may approve a pending/disputed result.
 *
 * Rules (from season3.html approveResult + openResultModal):
 *   admin   — can approve whenever status is 'pending' or 'disputed'
 *   captain — can approve only when status is 'pending' AND the submitter is
 *             a different user (can't approve own submission)
 *   fan     — never
 */
export function canApproveResult(
  role: UserRole,
  currentStatus: ApprovalStatus,
  submitterUsername: string,
  currentUsername: string,
): boolean {
  if (role === 'fan') return false;
  if (role === 'admin') {
    return currentStatus === 'pending' || currentStatus === 'disputed';
  }
  // captain
  if (currentStatus !== 'pending') return false;
  return submitterUsername !== currentUsername;
}

/**
 * Transitions the approval status according to an action.
 *
 * Valid transitions:
 *   submit        tbd        → pending    (captain or admin)
 *   approve       pending    → confirmed  (other captain or admin)
 *   dispute       pending    → disputed   (other captain or admin)
 *   admin-override any       → confirmed  (admin only)
 *
 * Returns an Error for invalid transitions or insufficient role.
 */
export function transitionStatus(
  current: ApprovalStatus,
  action: 'submit' | 'approve' | 'dispute' | 'admin-override',
  role: UserRole,
): ApprovalStatus | Error {
  if (action === 'admin-override') {
    if (role !== 'admin') return new Error('Only admins may use admin-override');
    return 'confirmed';
  }

  if (action === 'submit') {
    if (role === 'fan') return new Error('Fans may not submit results');
    if (current !== 'tbd') return new Error(`Cannot submit: current status is '${current}', expected 'tbd'`);
    return 'pending';
  }

  if (action === 'approve') {
    if (role === 'fan') return new Error('Fans may not approve results');
    if (current !== 'pending') return new Error(`Cannot approve: current status is '${current}', expected 'pending'`);
    return 'confirmed';
  }

  if (action === 'dispute') {
    if (role === 'fan') return new Error('Fans may not dispute results');
    if (current !== 'pending') return new Error(`Cannot dispute: current status is '${current}', expected 'pending'`);
    return 'disputed';
  }

  return new Error(`Unknown action: ${action}`);
}

/**
 * Builds a ResultPayload from raw form values.
 *
 * - New submissions always have status 'pending' (this is for captain
 *   submissions; admin direct-confirm should use admin-override flow).
 * - submittedAt is derived from the provided ISO timestamp string.
 */
export function buildResultPayload(
  outcome: OutcomeValue,
  submittedBy: string,
  course: string,
  date: string,
  netScore?: string,
): ResultPayload {
  const payload: ResultPayload = {
    points:      outcomeToPoints(outcome),
    status:      'pending',
    submittedBy,
    submittedAt: new Date().toISOString(),
    course,
    date,
  };
  if (netScore !== undefined && netScore !== '') {
    payload.netScore = netScore;
  }
  return payload;
}
