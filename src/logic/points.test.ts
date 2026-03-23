import { describe, it, expect } from 'vitest';
import {
  outcomeToPoints,
  getTeamTotal,
  getWinningThreshold,
  isMatchWon,
  isMatchHalved,
} from './points';
import type { Points } from './points';

// ── outcomeToPoints ──────────────────────────────────────────────────────────

describe('outcomeToPoints', () => {
  it("'d' returns Team D win { d:1, r:0 }", () => {
    expect(outcomeToPoints('d')).toEqual({ d: 1, r: 0 });
  });

  it("'r' returns Team R win { d:0, r:1 }", () => {
    expect(outcomeToPoints('r')).toEqual({ d: 0, r: 1 });
  });

  it("'half' returns halved { d:0.5, r:0.5 }", () => {
    expect(outcomeToPoints('half')).toEqual({ d: 0.5, r: 0.5 });
  });
});

// ── getWinningThreshold ──────────────────────────────────────────────────────

describe('getWinningThreshold', () => {
  it('returns 14.5', () => {
    expect(getWinningThreshold()).toBe(14.5);
  });
});

// ── getTeamTotal ─────────────────────────────────────────────────────────────

describe('getTeamTotal', () => {
  it('returns 0 for an empty match list', () => {
    expect(getTeamTotal([], 'D')).toBe(0);
    expect(getTeamTotal([], 'R')).toBe(0);
  });

  it('sums only matches with status === played for Team D', () => {
    const matches = [
      { points: { d: 1,   r: 0   }, status: 'played' },
      { points: { d: 0.5, r: 0.5 }, status: 'played' },
      { points: { d: 0,   r: 1   }, status: 'played' },
    ];
    expect(getTeamTotal(matches, 'D')).toBe(1.5);
  });

  it('sums only matches with status === played for Team R', () => {
    const matches = [
      { points: { d: 1,   r: 0   }, status: 'played' },
      { points: { d: 0.5, r: 0.5 }, status: 'played' },
      { points: { d: 0,   r: 1   }, status: 'played' },
    ];
    expect(getTeamTotal(matches, 'R')).toBe(1.5);
  });

  it('ignores matches with status pending', () => {
    const matches = [
      { points: { d: 1, r: 0 }, status: 'played'  },
      { points: { d: 1, r: 0 }, status: 'pending' },
    ];
    expect(getTeamTotal(matches, 'D')).toBe(1);
  });

  it('ignores matches with status disputed', () => {
    const matches = [
      { points: { d: 1, r: 0 }, status: 'played'   },
      { points: { d: 1, r: 0 }, status: 'disputed' },
    ];
    expect(getTeamTotal(matches, 'D')).toBe(1);
  });

  it('ignores matches with status tbd (no points)', () => {
    const matches = [
      { points: null, status: 'tbd' },
    ];
    expect(getTeamTotal(matches, 'D')).toBe(0);
  });

  it('treats legacy results (no status field) as played', () => {
    // Legacy confirmed results written before the approval workflow had no status key
    const matches: Array<{ points: Points | null; status?: string }> = [
      { points: { d: 1,   r: 0   } },   // no status — legacy confirmed
      { points: { d: 0.5, r: 0.5 } },   // no status — legacy confirmed
    ];
    expect(getTeamTotal(matches, 'D')).toBe(1.5);
    expect(getTeamTotal(matches, 'R')).toBe(0.5);
  });

  it('mixes legacy and status-bearing results correctly', () => {
    const matches: Array<{ points: Points | null; status?: string }> = [
      { points: { d: 1, r: 0 } },                      // legacy → played
      { points: { d: 1, r: 0 }, status: 'played'   },  // explicit played
      { points: { d: 1, r: 0 }, status: 'pending'  },  // excluded
      { points: null,            status: 'tbd'      },  // excluded
    ];
    expect(getTeamTotal(matches, 'D')).toBe(2);
  });

  it('returns correct total across all 40 matches (all Team D wins)', () => {
    const matches = Array.from({ length: 40 }, () => ({
      points: { d: 1, r: 0 } as Points,
      // no status = legacy
    }));
    expect(getTeamTotal(matches, 'D')).toBe(40);
    expect(getTeamTotal(matches, 'R')).toBe(0);
  });
});

// ── isMatchWon ───────────────────────────────────────────────────────────────

describe('isMatchWon', () => {
  it('Team D wins when d > r', () => {
    expect(isMatchWon({ d: 1, r: 0 }, 'D')).toBe(true);
  });

  it('Team D does not win when r > d', () => {
    expect(isMatchWon({ d: 0, r: 1 }, 'D')).toBe(false);
  });

  it('Team D does not win when halved', () => {
    expect(isMatchWon({ d: 0.5, r: 0.5 }, 'D')).toBe(false);
  });

  it('Team R wins when r > d', () => {
    expect(isMatchWon({ d: 0, r: 1 }, 'R')).toBe(true);
  });

  it('Team R does not win when d > r', () => {
    expect(isMatchWon({ d: 1, r: 0 }, 'R')).toBe(false);
  });

  it('Team R does not win when halved', () => {
    expect(isMatchWon({ d: 0.5, r: 0.5 }, 'R')).toBe(false);
  });

  it('edge case: 0/0 — neither team wins', () => {
    expect(isMatchWon({ d: 0, r: 0 }, 'D')).toBe(false);
    expect(isMatchWon({ d: 0, r: 0 }, 'R')).toBe(false);
  });
});

// ── isMatchHalved ────────────────────────────────────────────────────────────

describe('isMatchHalved', () => {
  it('returns true for 0.5 / 0.5', () => {
    expect(isMatchHalved({ d: 0.5, r: 0.5 })).toBe(true);
  });

  it('returns false for 1 / 0', () => {
    expect(isMatchHalved({ d: 1, r: 0 })).toBe(false);
  });

  it('returns false for 0 / 1', () => {
    expect(isMatchHalved({ d: 0, r: 1 })).toBe(false);
  });

  it('edge case: 0/0 is considered halved (equal scores)', () => {
    expect(isMatchHalved({ d: 0, r: 0 })).toBe(true);
  });
});
