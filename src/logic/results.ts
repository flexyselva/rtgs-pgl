/**
 * results.ts — KV result merge and applyStoredResults logic extracted from
 * src/index.ts (worker merge) and season3.html (applyStoredResults).
 *
 * No DOM, no fetch, no sessionStorage dependencies.
 */

import type { Points } from './points';

export type StoredResult = {
  points: Points;
  status?: string;
  submittedBy?: string;
  submittedAt?: string;
  course?: string;
  date?: string;
  netScore?: string;
};

/**
 * Merges an incoming partial update into an existing results map.
 *
 * Mirrors the worker merge logic in src/index.ts:
 *   - spread existing then incoming (incoming wins on conflicts)
 *   - any key whose incoming value is null is deleted from the result
 *
 * The existing map is never mutated — a new object is returned.
 */
export function mergeResults(
  existing: Record<string, StoredResult>,
  incoming: Record<string, StoredResult | null>,
): Record<string, StoredResult> {
  const merged: Record<string, StoredResult | null> = { ...existing, ...incoming };
  for (const k of Object.keys(incoming)) {
    if (incoming[k] === null) {
      delete merged[k];
    }
  }
  return merged as Record<string, StoredResult>;
}

// ── Match shape used by applyStoredResults ───────────────────────────────────

export interface MatchRecord {
  id: number | string;
  status: string;
  points: Points | null;
  approvalStatus?: string;
  submittedBy?: string | null;
  submittedAt?: string | null;
  course?: string;
  date?: string;
  singles?: { netScore?: string | null; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Pure function version of the season3.html `applyStoredResults` function.
 *
 * Returns a new array of match records with stored results overlaid.
 * The original array and its objects are NOT mutated.
 *
 * Status mapping (mirrors season3.html lines 1441-1446):
 *   stored.status === 'confirmed'  → match.status = 'played'
 *   stored.status === 'pending'    → match.status = 'pending'
 *   stored.status === 'disputed'   → match.status = 'disputed'
 *   no stored.status (legacy)      → treated as 'confirmed' → match.status = 'played'
 */
export function applyStoredResults(
  matches: Array<MatchRecord>,
  stored: Record<string, StoredResult>,
): Array<MatchRecord> {
  return matches.map(m => {
    const key = String(m.id);
    const r = stored[key];
    if (!r) return { ...m };

    const approvalStatus = r.status || 'confirmed'; // legacy → confirmed
    const matchStatus    = approvalStatus === 'confirmed' ? 'played' : approvalStatus;

    const updated: MatchRecord = {
      ...m,
      approvalStatus,
      submittedBy:  r.submittedBy  ?? null,
      submittedAt:  r.submittedAt  ?? null,
      points:       r.points,
      status:       matchStatus,
    };

    if (r.course !== undefined) updated.course = r.course;
    if (r.date   !== undefined) updated.date   = r.date;

    if (m.singles && r.netScore !== undefined) {
      updated.singles = { ...m.singles, netScore: r.netScore };
    }

    return updated;
  });
}
