import { Prediction } from '@/types/prediction';

export type DateFilterType = 'all' | 'today' | 'tomorrow' | 'weekend';

/**
 * Checks if a given match timestamp falls within today, tomorrow, or this upcoming weekend.
 * Handles local date boundaries and edge-cases (such as matches kickoff late night).
 */
export function matchesDateFilter(matchDate: string | Date, filter: DateFilterType): boolean {
  if (filter === 'all') return true;

  const d = new Date(matchDate);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  // "Today": from start of today (00:00:00) to end of today (23:59:59)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // "Tomorrow": start of tomorrow to end of tomorrow
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  if (filter === 'today') {
    // Also include fixtures that kicked off up to 3 hours ago if today
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    const startBoundary = threeHoursAgo < todayStart ? threeHoursAgo : todayStart;
    return d >= startBoundary && d <= todayEnd;
  }

  if (filter === 'tomorrow') {
    return d >= tomorrowStart && d <= tomorrowEnd;
  }

  if (filter === 'weekend') {
    // Football weekend is Friday evening (from 16:00) through Sunday 23:59:59
    // or through Monday morning 04:00 (for South American / late fixtures).
    // Let's determine this week's Friday, Saturday, Sunday.
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

    let fridayStart: Date;
    let sundayEnd: Date;

    if (dayOfWeek === 0) {
      // It's Sunday right now! The weekend is today (and yesterday/Friday)
      const friday = new Date(todayStart);
      friday.setDate(friday.getDate() - 2);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else if (dayOfWeek === 6) {
      // It's Saturday right now!
      const friday = new Date(todayStart);
      friday.setDate(friday.getDate() - 1);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setDate(sunday.getDate() + 1);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else if (dayOfWeek === 5) {
      // It's Friday right now!
      const friday = new Date(todayStart);
      friday.setHours(16, 0, 0, 0);
      fridayStart = friday;

      const sunday = new Date(todayEnd);
      sunday.setDate(sunday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);
      sundayEnd = sunday;
    } else {
      // Monday (1), Tuesday (2), Wednesday (3), Thursday (4):
      // Upcoming weekend starts this coming Friday 16:00
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

    return d >= fridayStart && d <= sundayEnd;
  }

  return true;
}

/**
 * Computes the item counts for each date bucket from a collection of predictions
 */
export function calculateDateFilterCounts(items: Prediction[]): Record<DateFilterType, number> {
  let allCount = 0;
  let todayCount = 0;
  let tomorrowCount = 0;
  let weekendCount = 0;

  for (const item of items) {
    if (!item.match_date) continue;
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
