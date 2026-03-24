import { describe, it, expect } from 'vitest';
import {
  canSubmitResult,
  canApproveResult,
  transitionStatus,
  buildResultPayload,
} from './approval';

// ── canSubmitResult ──────────────────────────────────────────────────────────

describe('canSubmitResult', () => {
  // Admin — always allowed regardless of current status
  it('admin can submit when status is tbd', () => {
    expect(canSubmitResult('admin', 'tbd')).toBe(true);
  });

  it('admin can submit when status is pending', () => {
    expect(canSubmitResult('admin', 'pending')).toBe(true);
  });

  it('admin can submit when status is confirmed', () => {
    expect(canSubmitResult('admin', 'confirmed')).toBe(true);
  });

  it('admin can submit when status is disputed', () => {
    expect(canSubmitResult('admin', 'disputed')).toBe(true);
  });

  // Captain — only when tbd
  it('captain can submit when status is tbd', () => {
    expect(canSubmitResult('captain', 'tbd')).toBe(true);
  });

  it('captain cannot submit when status is pending', () => {
    expect(canSubmitResult('captain', 'pending')).toBe(false);
  });

  it('captain cannot submit when status is confirmed', () => {
    expect(canSubmitResult('captain', 'confirmed')).toBe(false);
  });

  it('captain cannot submit when status is disputed', () => {
    expect(canSubmitResult('captain', 'disputed')).toBe(false);
  });

  // Fan — never
  it('fan cannot submit regardless of status', () => {
    expect(canSubmitResult('fan', 'tbd')).toBe(false);
    expect(canSubmitResult('fan', 'pending')).toBe(false);
    expect(canSubmitResult('fan', 'confirmed')).toBe(false);
    expect(canSubmitResult('fan', 'disputed')).toBe(false);
  });
});

// ── canApproveResult ─────────────────────────────────────────────────────────

describe('canApproveResult', () => {
  // Admin — can approve pending or disputed (any submitter)
  it('admin can approve a pending result', () => {
    expect(canApproveResult('admin', 'pending', 'captain.d', 'admin')).toBe(true);
  });

  it('admin can approve a disputed result', () => {
    expect(canApproveResult('admin', 'disputed', 'captain.d', 'admin')).toBe(true);
  });

  it('admin cannot approve a tbd match (nothing to approve)', () => {
    expect(canApproveResult('admin', 'tbd', 'captain.d', 'admin')).toBe(false);
  });

  it('admin cannot approve an already-confirmed match', () => {
    expect(canApproveResult('admin', 'confirmed', 'captain.d', 'admin')).toBe(false);
  });

  // Captain — can approve pending submitted by a different user
  it('captain can approve pending result submitted by the other captain', () => {
    expect(canApproveResult('captain', 'pending', 'captain.d', 'captain.r')).toBe(true);
  });

  it('captain cannot approve their own pending result', () => {
    expect(canApproveResult('captain', 'pending', 'captain.d', 'captain.d')).toBe(false);
  });

  it('captain cannot approve a disputed result', () => {
    expect(canApproveResult('captain', 'disputed', 'captain.d', 'captain.r')).toBe(false);
  });

  it('captain cannot approve a confirmed result', () => {
    expect(canApproveResult('captain', 'confirmed', 'captain.d', 'captain.r')).toBe(false);
  });

  it('captain cannot approve a tbd match', () => {
    expect(canApproveResult('captain', 'tbd', 'captain.d', 'captain.r')).toBe(false);
  });

  // Fan — never
  it('fan cannot approve any result', () => {
    expect(canApproveResult('fan', 'pending', 'captain.d', 'guest')).toBe(false);
    expect(canApproveResult('fan', 'disputed', 'captain.d', 'guest')).toBe(false);
  });
});

// ── transitionStatus ─────────────────────────────────────────────────────────

describe('transitionStatus', () => {
  // ── submit ──
  it('captain can submit: tbd → pending', () => {
    expect(transitionStatus('tbd', 'submit', 'captain')).toBe('pending');
  });

  it('admin can submit: tbd → pending', () => {
    expect(transitionStatus('tbd', 'submit', 'admin')).toBe('pending');
  });

  it('fan cannot submit — returns Error', () => {
    expect(transitionStatus('tbd', 'submit', 'fan')).toBeInstanceOf(Error);
  });

  it('submit when already pending returns Error (not tbd)', () => {
    expect(transitionStatus('pending', 'submit', 'captain')).toBeInstanceOf(Error);
  });

  it('submit when confirmed returns Error', () => {
    expect(transitionStatus('confirmed', 'submit', 'captain')).toBeInstanceOf(Error);
  });

  it('submit when disputed returns Error', () => {
    expect(transitionStatus('disputed', 'submit', 'captain')).toBeInstanceOf(Error);
  });

  // ── approve ──
  it('captain can approve: pending → confirmed', () => {
    expect(transitionStatus('pending', 'approve', 'captain')).toBe('confirmed');
  });

  it('admin can approve: pending → confirmed', () => {
    expect(transitionStatus('pending', 'approve', 'admin')).toBe('confirmed');
  });

  it('fan cannot approve — returns Error', () => {
    expect(transitionStatus('pending', 'approve', 'fan')).toBeInstanceOf(Error);
  });

  it('approve when disputed returns Error (must use admin-override for disputed)', () => {
    expect(transitionStatus('disputed', 'approve', 'captain')).toBeInstanceOf(Error);
  });

  it('approve when already confirmed returns Error', () => {
    expect(transitionStatus('confirmed', 'approve', 'admin')).toBeInstanceOf(Error);
  });

  it('approve when tbd returns Error', () => {
    expect(transitionStatus('tbd', 'approve', 'admin')).toBeInstanceOf(Error);
  });

  // ── dispute ──
  it('captain can dispute: pending → disputed', () => {
    expect(transitionStatus('pending', 'dispute', 'captain')).toBe('disputed');
  });

  it('admin can dispute: pending → disputed', () => {
    expect(transitionStatus('pending', 'dispute', 'admin')).toBe('disputed');
  });

  it('fan cannot dispute — returns Error', () => {
    expect(transitionStatus('pending', 'dispute', 'fan')).toBeInstanceOf(Error);
  });

  it('dispute when tbd returns Error', () => {
    expect(transitionStatus('tbd', 'dispute', 'captain')).toBeInstanceOf(Error);
  });

  it('dispute when already confirmed returns Error', () => {
    expect(transitionStatus('confirmed', 'dispute', 'admin')).toBeInstanceOf(Error);
  });

  // ── admin-override ──
  it('admin-override from tbd → confirmed', () => {
    expect(transitionStatus('tbd', 'admin-override', 'admin')).toBe('confirmed');
  });

  it('admin-override from pending → confirmed', () => {
    expect(transitionStatus('pending', 'admin-override', 'admin')).toBe('confirmed');
  });

  it('admin-override from disputed → confirmed', () => {
    expect(transitionStatus('disputed', 'admin-override', 'admin')).toBe('confirmed');
  });

  it('admin-override from confirmed → confirmed (idempotent)', () => {
    expect(transitionStatus('confirmed', 'admin-override', 'admin')).toBe('confirmed');
  });

  it('captain cannot admin-override — returns Error', () => {
    expect(transitionStatus('pending', 'admin-override', 'captain')).toBeInstanceOf(Error);
  });

  it('fan cannot admin-override — returns Error', () => {
    expect(transitionStatus('pending', 'admin-override', 'fan')).toBeInstanceOf(Error);
  });
});

// ── buildResultPayload ───────────────────────────────────────────────────────

describe('buildResultPayload', () => {
  it("outcome 'd' → points { d:1, r:0 }", () => {
    const p = buildResultPayload('d', 'captain.d', 'Prestige GC', 'Apr 2026');
    expect(p.points).toEqual({ d: 1, r: 0 });
  });

  it("outcome 'r' → points { d:0, r:1 }", () => {
    const p = buildResultPayload('r', 'captain.r', 'Kalhaar', 'May 2026');
    expect(p.points).toEqual({ d: 0, r: 1 });
  });

  it("outcome 'half' → points { d:0.5, r:0.5 }", () => {
    const p = buildResultPayload('half', 'captain.d', 'Classic GC', 'Jun 2026');
    expect(p.points).toEqual({ d: 0.5, r: 0.5 });
  });

  it('status is always pending on a new submission', () => {
    const p = buildResultPayload('d', 'captain.d', 'Course', 'Apr 2026');
    expect(p.status).toBe('pending');
  });

  it('submittedBy is set from the argument', () => {
    const p = buildResultPayload('d', 'captain.d', 'Course', 'Apr 2026');
    expect(p.submittedBy).toBe('captain.d');
  });

  it('submittedAt is a valid ISO date string', () => {
    const p = buildResultPayload('d', 'captain.d', 'Course', 'Apr 2026');
    expect(() => new Date(p.submittedAt)).not.toThrow();
    expect(new Date(p.submittedAt).toISOString()).toBe(p.submittedAt);
  });

  it('course and date are included in the payload', () => {
    const p = buildResultPayload('r', 'captain.r', 'Prestige GC', 'Oct 2026');
    expect(p.course).toBe('Prestige GC');
    expect(p.date).toBe('Oct 2026');
  });

  it('netScore is included when provided', () => {
    const p = buildResultPayload('d', 'captain.d', 'Classic GC', 'Oct 2026', '3&2');
    expect(p.netScore).toBe('3&2');
  });

  it('netScore is absent from payload when not provided', () => {
    const p = buildResultPayload('d', 'captain.d', 'Classic GC', 'Oct 2026');
    expect(p.netScore).toBeUndefined();
  });

  it('empty string netScore is treated as absent', () => {
    const p = buildResultPayload('d', 'captain.d', 'Classic GC', 'Oct 2026', '');
    expect(p.netScore).toBeUndefined();
  });
});
