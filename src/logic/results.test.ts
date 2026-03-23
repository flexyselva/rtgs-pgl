import { describe, it, expect } from 'vitest';
import { mergeResults, applyStoredResults } from './results';
import type { StoredResult, MatchRecord } from './results';

// ── mergeResults ─────────────────────────────────────────────────────────────

describe('mergeResults', () => {
  it('returns an empty map when both existing and incoming are empty', () => {
    expect(mergeResults({}, {})).toEqual({});
  });

  it('returns existing results unchanged when incoming is empty', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    };
    expect(mergeResults(existing, {})).toEqual(existing);
  });

  it('adds new keys from incoming', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    };
    const incoming: Record<string, StoredResult | null> = {
      '2': { points: { d: 0, r: 1 }, status: 'pending' },
    };
    const result = mergeResults(existing, incoming);
    expect(result['1']).toBeDefined();
    expect(result['2']).toBeDefined();
  });

  it('incoming values overwrite existing values for the same key', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'pending' },
    };
    const incoming: Record<string, StoredResult | null> = {
      '1': { points: { d: 0.5, r: 0.5 }, status: 'confirmed' },
    };
    const result = mergeResults(existing, incoming);
    expect(result['1'].points).toEqual({ d: 0.5, r: 0.5 });
    expect(result['1'].status).toBe('confirmed');
  });

  it('null in incoming deletes the key from the merged result', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    };
    const incoming: Record<string, StoredResult | null> = {
      '1': null,
    };
    const result = mergeResults(existing, incoming);
    expect(result['1']).toBeUndefined();
  });

  it('null delete does not affect other keys', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
      '2': { points: { d: 0, r: 1 }, status: 'confirmed' },
    };
    const incoming: Record<string, StoredResult | null> = {
      '1': null,
    };
    const result = mergeResults(existing, incoming);
    expect(result['1']).toBeUndefined();
    expect(result['2']).toBeDefined();
  });

  it('preserves all existing keys when incoming is a partial update', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1,   r: 0   }, status: 'confirmed' },
      '2': { points: { d: 0,   r: 1   }, status: 'confirmed' },
      '3': { points: { d: 0.5, r: 0.5 }, status: 'confirmed' },
    };
    const incoming: Record<string, StoredResult | null> = {
      '3': { points: { d: 1, r: 0 }, status: 'pending' }, // override only match 3
    };
    const result = mergeResults(existing, incoming);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['1']).toEqual(existing['1']);
    expect(result['2']).toEqual(existing['2']);
    expect(result['3'].points).toEqual({ d: 1, r: 0 });
  });

  it('does not mutate the existing object', () => {
    const existing: Record<string, StoredResult> = {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    };
    const existingCopy = JSON.parse(JSON.stringify(existing));
    mergeResults(existing, { '1': null });
    expect(existing).toEqual(existingCopy);
  });

  it('handles all 40 matches in a single merge', () => {
    const existing: Record<string, StoredResult> = {};
    for (let i = 1; i <= 40; i++) {
      existing[String(i)] = { points: { d: 1, r: 0 }, status: 'confirmed' };
    }
    const incoming: Record<string, StoredResult | null> = {
      '5': null,
      '10': { points: { d: 0, r: 1 }, status: 'confirmed' },
    };
    const result = mergeResults(existing, incoming);
    expect(Object.keys(result)).toHaveLength(39); // 40 - 1 deleted
    expect(result['5']).toBeUndefined();
    expect(result['10'].points).toEqual({ d: 0, r: 1 });
  });
});

// ── applyStoredResults ───────────────────────────────────────────────────────

const baseMatch = (id: number, status = 'tbd'): MatchRecord => ({
  id,
  status,
  points: null,
  course: 'TBD',
  date:   'Apr 2026',
});

describe('applyStoredResults', () => {
  it('returns an unchanged copy when stored is empty', () => {
    const matches = [baseMatch(1), baseMatch(2)];
    const result = applyStoredResults(matches, {});
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('tbd');
    expect(result[0].points).toBeNull();
  });

  it('does not mutate original matches array', () => {
    const matches = [baseMatch(1)];
    applyStoredResults(matches, {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    });
    expect(matches[0].status).toBe('tbd');
    expect(matches[0].points).toBeNull();
  });

  it('confirmed stored result sets match status to played', () => {
    const matches = [baseMatch(1)];
    const result = applyStoredResults(matches, {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed' },
    });
    expect(result[0].status).toBe('played');
    expect(result[0].points).toEqual({ d: 1, r: 0 });
  });

  it('pending stored result sets match status to pending', () => {
    const matches = [baseMatch(1)];
    const result = applyStoredResults(matches, {
      '1': { points: { d: 1, r: 0 }, status: 'pending', submittedBy: 'captain.d' },
    });
    expect(result[0].status).toBe('pending');
    expect(result[0].approvalStatus).toBe('pending');
  });

  it('disputed stored result sets match status to disputed', () => {
    const matches = [baseMatch(1)];
    const result = applyStoredResults(matches, {
      '1': { points: { d: 0, r: 1 }, status: 'disputed', submittedBy: 'captain.d' },
    });
    expect(result[0].status).toBe('disputed');
    expect(result[0].approvalStatus).toBe('disputed');
  });

  it('legacy result (no status field) is treated as confirmed → played', () => {
    const matches = [baseMatch(3)];
    const result = applyStoredResults(matches, {
      '3': { points: { d: 0.5, r: 0.5 } }, // no status — legacy
    });
    expect(result[0].status).toBe('played');
    expect(result[0].approvalStatus).toBe('confirmed');
  });

  it('unplayed matches (no stored result) remain tbd', () => {
    const matches = [baseMatch(1), baseMatch(2), baseMatch(3)];
    const result = applyStoredResults(matches, {
      '2': { points: { d: 1, r: 0 }, status: 'confirmed' },
    });
    expect(result[0].status).toBe('tbd');
    expect(result[1].status).toBe('played');
    expect(result[2].status).toBe('tbd');
  });

  it('sets submittedBy from stored result', () => {
    const matches = [baseMatch(5)];
    const result = applyStoredResults(matches, {
      '5': { points: { d: 1, r: 0 }, status: 'pending', submittedBy: 'captain.d', submittedAt: '2026-03-21T10:00:00.000Z' },
    });
    expect(result[0].submittedBy).toBe('captain.d');
    expect(result[0].submittedAt).toBe('2026-03-21T10:00:00.000Z');
  });

  it('updates course from stored result', () => {
    const matches = [baseMatch(7)];
    const result = applyStoredResults(matches, {
      '7': { points: { d: 1, r: 0 }, status: 'confirmed', course: 'Prestige GC' },
    });
    expect(result[0].course).toBe('Prestige GC');
  });

  it('updates date from stored result', () => {
    const matches = [baseMatch(8)];
    const result = applyStoredResults(matches, {
      '8': { points: { d: 0, r: 1 }, status: 'confirmed', date: 'May 2026' },
    });
    expect(result[0].date).toBe('May 2026');
  });

  it('updates netScore on singles matches', () => {
    const matchWithSingles: MatchRecord = {
      ...baseMatch(25),
      singles: { d: 'Player D', r: 'Player R', netScore: null },
    };
    const result = applyStoredResults([matchWithSingles], {
      '25': { points: { d: 1, r: 0 }, status: 'confirmed', netScore: '3&2' },
    });
    expect((result[0].singles as { netScore: string }).netScore).toBe('3&2');
  });

  it('does not add singles.netScore to non-singles matches', () => {
    const fourballs: MatchRecord = {
      ...baseMatch(1),
      // no singles property
    };
    const result = applyStoredResults([fourballs], {
      '1': { points: { d: 1, r: 0 }, status: 'confirmed', netScore: '3&2' },
    });
    expect(result[0].singles).toBeUndefined();
  });

  it('processes all 40 matches efficiently', () => {
    const matches: MatchRecord[] = Array.from({ length: 40 }, (_, i) => baseMatch(i + 1));
    const stored: Record<string, StoredResult> = {};
    for (let i = 1; i <= 20; i++) {
      stored[String(i)] = { points: { d: 1, r: 0 }, status: 'confirmed' };
    }
    const result = applyStoredResults(matches, stored);
    const played  = result.filter(m => m.status === 'played').length;
    const unplayed = result.filter(m => m.status === 'tbd').length;
    expect(played).toBe(20);
    expect(unplayed).toBe(20);
  });
});
