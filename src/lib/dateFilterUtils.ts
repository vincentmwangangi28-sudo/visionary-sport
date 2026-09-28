import { Prediction } from '@/types/prediction';

export type DateFilterType = 'all' | 'today' | 'tomorrow' | 'weekend';

export interface DateGroupedMatches<T> {
  dateKey: string;       // YYYY-MM-DD in local time
  label: string;         // e.g. "Today", "Tomorrow", "Wednesday, Sep 30"
  subLabel: string;      // e.g. "Mon, Sep 28"
  isToday: boolean;
  isTomorrow: boolean;
  matches: T[];
}

const PLAYED_OR_ACTIVE_STATUSES = new Set([
  'finished',
  'ft',
  'aet',
  'pen',
  'completed',
  'settled',
  'won',
  'lost',
  'void',
  'postponed',
  'cancelled',
  'canceled',
  'abandoned',
  'live',
  'in_play',
  'inplay',
  '1h',
  '2h',
  'ht',
  'halftime',
]);

/**
 * Returns true if a match has already kicked off, is currently in-play, or has already been played/settled.
 * Predictions and Upcoming views must strictly ignore these matches.
 */
export function isPlayedOrPastMatch(item: {
  match_date?: string | Date | null;
  status?: string | null;
  result?: string | null;
  home_score?: number | null;
  away_score?: number | null;
}): boolean {
  if (!item || !item.match_date) return true;

  // 1. Check explicit status
  if (item.status) {
    const normStatus = String(item.status).trim().toLowerCase();
    if (PLAYED_OR_ACTIVE_STATUSES.has(normStatus)) {
      return true;
    }
  }

  // 2. Check if result is already settled
  if (
    item.result !== undefined &&
    item.result !== null &&
    String(item.result).trim() !== '' &&
    String(item.result).trim().toLowerCase() !== 'pending'
  ) {
    return true;
  }

  // 3. Check if a live/final score is already recorded
  if (
    (item.home_score !== undefined && item.home_score !== null) ||
    (item.away_score !== undefined && item.away_score !== null)
  ) {
    return true;
  }

  // 4. Check kickoff timestamp: if kickoff is in the past (<= now), it has already started or been played
  const kickoffMs = new Date(item.match_date).getTime();
  if (isNaN(kickoffMs) || kickoffMs <= Date.now()) {
    return true;
  }

  return false;
}

/**
 * Filters a list of matches/predictions to exclude any played, in-play, settled, or past-kickoff matches.
 */
export function filterOutPlayedMatches<
  T extends {
    match_date?: string | Date | null;
    status?: string | null;
    result?: string | null;
    home_score?: number | null;
    away_score?: number | null;
  }
>(items: T[]): T[] {
  return items.filter((item) => !isPlayedOrPastMatch(item));
}

/**
 * Returns local YYYY-MM-DD key for date grouping and calendar-day sorting.
 */
export function getLocalDateKey(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '9999-12-31';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Sorts matches strictly by Date in ascending order:
 * 1. Exact kickoff timestamp ascending (most immediate upcoming matches at the top)
 * 2. Optional tie-breaker (e.g. regional relevance or AI confidence) only when kickoff timestamps are identical
 */
export function sortMatchesByDatePriority<
  T extends {
    match_date?: string | Date | null;
    confidence?: number;
    confidence_score?: number;
  }
>(items: T[], tieBreaker?: (a: T, b: T) => number): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.match_date ? new Date(a.match_date).getTime() : Number.MAX_SAFE_INTEGER;
    const timeB = b.match_date ? new Date(b.match_date).getTime() : Number.MAX_SAFE_INTEGER;

    const validTimeA = isNaN(timeA) ? Number.MAX_SAFE_INTEGER : timeA;
    const validTimeB = isNaN(timeB) ? Number.MAX_SAFE_INTEGER : timeB;

    // Primary sort: strict ascending order by match_date so the most immediate matches appear at the top
    if (validTimeA !== validTimeB) {
      return validTimeA - validTimeB;
    }

    if (tieBreaker) {
      const tb = tieBreaker(a, b);
      if (tb !== 0) return tb;
    }

    const confA = a.confidence_score ?? a.confidence ?? 60;
    const confB = b.confidence_score ?? b.confidence ?? 60;
    return confB - confA;
  });
}

/**
 * Groups sorted upcoming matches into chronological calendar date sections (Today, Tomorrow, Day +2, etc.)
 */
export function groupMatchesByDate<T extends { match_date?: string | Date | null }>(
  items: T[]
): DateGroupedMatches<T>[] {
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowKey = getLocalDateKey(tomorrow);

  const groupsMap = new Map<string, T[]>();

  for (const item of items) {
    if (!item.match_date) continue;
    const key = getLocalDateKey(item.match_date);
    const existing = groupsMap.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groupsMap.set(key, [item]);
    }
  }

  const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => a.localeCompare(b));

  return sortedKeys.map((dateKey) => {
    const groupItems = groupsMap.get(dateKey) || [];
    const sampleDate = groupItems[0]?.match_date ? new Date(groupItems[0].match_date) : new Date(dateKey);
    const isToday = dateKey === todayKey;
    const isTomorrow = dateKey === tomorrowKey;

    const formattedShort = sampleDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const formattedFull = sampleDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const label = isToday
      ? 'Today’s Upcoming Matches'
      : isTomorrow
      ? 'Tomorrow’s Fixtures'
      : formattedFull;

    return {
      dateKey,
      label,
      subLabel: formattedShort,
      isToday,
      isTomorrow,
      matches: groupItems,
    };
  });
}

/**
 * Checks if a given match timestamp falls within today, tomorrow, or this upcoming weekend.
 * Strictly ignores any match whose kickoff time has already passed.
 */
export function matchesDateFilter(matchDate: string | Date, filter: DateFilterType): boolean {
  const d = new Date(matchDate);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  // Strictly ignore matches that have already started or been played
  if (d.getTime() <= now.getTime()) return false;

  if (filter === 'all') return true;

  // "Today": from now to end of today (23:59:59)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // "Tomorrow": start of tomorrow to end of tomorrow
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  if (filter === 'today') {
    return d >= now && d <= todayEnd;
  }

  if (filter === 'tomorrow') {
    return d >= tomorrowStart && d <= tomorrowEnd;
  }

  if (filter === 'weekend') {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

    let fridayStart: Date;
    let sundayEnd: Date;

    if (dayOfWeek === 0) {
      const friday = new Date(todayStart);
      friday.setDate(friday.getDate() - 2);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else if (dayOfWeek === 6) {
      const friday = new Date(todayStart);
      friday.setDate(friday.getDate() - 1);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setDate(sunday.getDate() + 1);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else if (dayOfWeek === 5) {
      const friday = new Date(todayStart);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setDate(sunday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else {
      const daysUntilFriday = 5 - dayOfWeek;
      const friday = new Date(todayStart);
      friday.setDate(friday.getDate() + daysUntilFriday);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setDate(sunday.getDate() + daysUntilFriday + 2);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    }

    const effectiveStart = fridayStart < now ? now : fridayStart;
    return d >= effectiveStart && d <= sundayEnd;
  }

  return true;
}

/**
 * Computes the item counts for each date bucket from a collection of upcoming predictions
 */
export function calculateDateFilterCounts(items: Prediction[]): Record<DateFilterType, number> {
  let allCount = 0;
  let todayCount = 0;
  let tomorrowCount = 0;
  let weekendCount = 0;

  for (const item of items) {
    if (isPlayedOrPastMatch(item)) continue;
    allCount++;
    if (matchesDateFilter(item.match_date, 'today')) todayCount++;
    if (matchesDateFilter(item.match_date, 'tomorrow')) tomorrowCount++;
    if (matchesDateFilter(item.match_date, 'weekend')) weekendCount++;
  }

  return {
    all: allCount,
    today: todayCount,
    tomorrow: tomorrowCount,
    weekend: weekendCount,
  };
}

