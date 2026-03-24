/**
 * points.ts — Pure scoring/points logic extracted from season3.html.
 *
 * No DOM, no fetch, no sessionStorage dependencies.
 */

export type Points = { d: number; r: number };
export type Team = 'D' | 'R';
export type OutcomeValue = 'd' | 'r' | 'half';

/**
 * Converts a match outcome string into a Points object.
 *  'd'    → Team D wins    → { d: 1,   r: 0   }
 *  'r'    → Team R wins    → { d: 0,   r: 1   }
 *  'half' → Match halved   → { d: 0.5, r: 0.5 }
 */
export function outcomeToPoints(outcome: OutcomeValue): Points {
  if (outcome === 'd')    return { d: 1,   r: 0   };
  if (outcome === 'r')    return { d: 0,   r: 1   };
  /* 'half' */            return { d: 0.5, r: 0.5 };
}

/**
 * Returns the winning threshold — the points total a team must reach to win.
 */
export function getWinningThreshold(): number {
  return 14.5;
}

/**
 * Sums points for a given team across all matches.
 * Only matches where status === 'played' (or where status is absent, i.e. legacy
 * confirmed results) contribute to the total.
 */
export function getTeamTotal(
  matches: Array<{ points: Points | null; status?: string }>,
  team: Team,
): number {
  let total = 0;
  for (const m of matches) {
    // Legacy results have no status field — treated as 'played' (confirmed).
    const isPlayed = m.status === 'played' || m.status === undefined;
    if (isPlayed && m.points !== null && m.points !== undefined) {
      total += team === 'D' ? m.points.d : m.points.r;
    }
  }
  return total;
}

/**
 * Returns true if the given team won the match.
 */
export function isMatchWon(points: Points, team: Team): boolean {
  return team === 'D' ? points.d > points.r : points.r > points.d;
}

/**
 * Returns true if the match was halved (both teams scored equally).
 */
export function isMatchHalved(points: Points): boolean {
  return points.d === points.r;
}
