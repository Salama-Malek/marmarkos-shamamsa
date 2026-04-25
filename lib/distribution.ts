// Fairness ranking for assigning a part. Given the candidate set (deacons
// marked PRESENT for this liturgy) and per-deacon history for the part being
// assigned, return them sorted from most-deserving to least.
//
// Ranking rules, in order:
//   1. Deacons who have NEVER done this part before come first
//      (badge: "first time").
//   2. Then by ascending count (fewer = higher priority).
//   3. Then by ascending lastAssignedDate (longer ago = higher priority).
//   4. Tie-break: alphabetical by name (stable, locale-aware).

import type { Deacon } from '@/types';

export type FairnessBadge = 'first-time' | 'rare' | 'long-time' | null;

export interface RankedCandidate {
  deacon: Deacon;
  count: number;
  lastDate?: string;
  badge: FairnessBadge;
  /** Days since last assignment of this part. undefined if never. */
  daysSinceLast?: number;
}

const RARE_THRESHOLD = 3; // strictly less than 3 times → "rare"
const LONG_TIME_DAYS = 56; // 8 weeks → "long time"

export function rankCandidates(
  candidates: Deacon[],
  history: Map<string, { count: number; lastDate: string | null }>,
  today: Date = new Date(),
): RankedCandidate[] {
  const todayMs = today.getTime();
  const ranked: RankedCandidate[] = candidates.map((deacon) => {
    const entry = history.get(deacon.id);
    const count = entry?.count ?? 0;
    const lastDate = entry?.lastDate ?? undefined;
    const daysSinceLast = lastDate
      ? Math.max(0, Math.floor((todayMs - new Date(lastDate).getTime()) / 86400000))
      : undefined;
    let badge: FairnessBadge = null;
    if (count === 0) badge = 'first-time';
    else if (count < RARE_THRESHOLD) badge = 'rare';
    else if (daysSinceLast !== undefined && daysSinceLast >= LONG_TIME_DAYS) badge = 'long-time';
    return { deacon, count, lastDate, daysSinceLast, badge };
  });

  ranked.sort((a, b) => {
    // Never-done first.
    if (a.count === 0 && b.count !== 0) return -1;
    if (b.count === 0 && a.count !== 0) return 1;
    // Then by count ascending.
    if (a.count !== b.count) return a.count - b.count;
    // Then by lastDate ascending (older = higher priority). Missing dates
    // already handled above (count===0 path).
    if (a.lastDate && b.lastDate) {
      if (a.lastDate !== b.lastDate) return a.lastDate < b.lastDate ? -1 : 1;
    } else if (a.lastDate && !b.lastDate) {
      return 1;
    } else if (!a.lastDate && b.lastDate) {
      return -1;
    }
    // Stable alphabetical fallback.
    return a.deacon.name.localeCompare(b.deacon.name, 'ar');
  });

  return ranked;
}
