import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getSavedPredictionsList, mergeAndPreservePredictions } from '@/services/predictionStorage';

export type SyncTriggerSource =
  | 'midnight_rollover'
  | 'tab_visible'
  | 'network_online'
  | 'morning_lineup_window'
  | 'odds_movement_window'
  | 'league_filter_change'
  | 'manual_user'
  | 'init_cold_start';

export interface SyncTriggerConfig {
  id: string;
  name: string;
  category: 'Autonomous' | 'Event-Driven' | 'Scheduled Window';
  description: string;
  recommendedSchedule: string;
  enabled: boolean;
  frequency: string;
}

export interface MatchSyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncDate: string | null;
  nextScheduledMidnight: string | null;
  syncSource: 'cron_api' | 'edge_function' | 'realtime_feed' | 'cache' | null;
  lastTrigger: SyncTriggerSource | null;
  syncSummary: string | null;
  error: string | null;
  matchesCount: number;
  autoEnabled: boolean;
  activeTriggers: string[];
}

const LAST_SYNC_KEY = 'predictpro_last_match_sync_timestamp';
const LAST_SYNC_DATE_KEY = 'predictpro_last_match_sync_date';
const SYNC_SUMMARY_KEY = 'predictpro_match_sync_summary';
const AUTO_SYNC_ENABLED_KEY = 'predictpro_auto_match_sync_enabled';
const TRIGGER_SETTINGS_KEY = 'predictpro_match_sync_trigger_settings';

/**
 * Suggested Trigger Catalogs & Defaults
 */
export const SUGGESTED_TRIGGERS: SyncTriggerConfig[] = [
  {
    id: 'midnight_rollover',
    name: 'Midnight Rollover (00:00:05)',
    category: 'Autonomous',
    description: 'Autonomous zero-delay rollover at midnight to purge yesterday results and prime today fixtures.',
    recommendedSchedule: '0 0 * * *',
    enabled: true,
    frequency: 'Daily at 00:00:05',
  },
  {
    id: 'morning_lineup_window',
    name: 'Morning Confirmed Lineups & Odds Window (09:00 UTC)',
    category: 'Scheduled Window',
    description: 'Syncs starting team rosters, injury confirmations, and early market odds drift.',
    recommendedSchedule: '0 9 * * *',
    enabled: true,
    frequency: 'Daily at 09:00 UTC',
  },
  {
    id: 'afternoon_peak_window',
    name: 'Pre-Match Afternoon Peak Window (14:00 UTC)',
    category: 'Scheduled Window',
    description: 'Refreshes high-conviction Bankers of the Day right before European/African afternoon kickoffs.',
    recommendedSchedule: '0 14 * * *',
    enabled: true,
    frequency: 'Daily at 14:00 UTC',
  },
  {
    id: 'tab_visible',
    name: 'Tab Focus / Device Wake Resumption',
    category: 'Event-Driven',
    description: 'Triggers when user switches back to the tab or unlocks phone if data is stale (> 30 min).',
    recommendedSchedule: 'On visibilitychange',
    enabled: true,
    frequency: 'Stale-while-revalidate',
  },
  {
    id: 'network_online',
    name: 'Network Reconnection Pulse',
    category: 'Event-Driven',
    description: 'Fires immediately when an offline client reconnects to Wi-Fi/cellular to pull fresh lines.',
    recommendedSchedule: 'On window.online',
    enabled: true,
    frequency: 'On connectivity restore',
  },
  {
    id: 'post_match_reconciliation',
    name: 'Evening Full-Time Settlement Window (22:00 UTC)',
    category: 'Scheduled Window',
    description: 'Reconciles finalized match scores, hit rates, and prediction validation matrix.',
    recommendedSchedule: '0 22 * * *',
    enabled: true,
    frequency: 'Daily at 22:00 UTC',
  },
  {
    id: 'hourly_odds_drift',
    name: 'Intraday Match Odds Drift Watcher',
    category: 'Autonomous',
    description: 'Periodic lightweight pulse to catch sudden bookmaker market shifts on upcoming ties.',
    recommendedSchedule: '0 */3 * * *',
    enabled: false,
    frequency: 'Every 3 hours',
  },
];

/**
 * Calculates the exact millisecond timestamp of the next local midnight
 */
export function getNextMidnightMs(): number {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 5, 0 // 5 seconds past midnight
  );
  return nextMidnight.getTime();
}

/**
 * Returns today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useMatchSync() {
  const queryClient = useQueryClient();

  // Load user trigger preferences
  const [triggerConfigs, setTriggerConfigs] = useState<SyncTriggerConfig[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(TRIGGER_SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return SUGGESTED_TRIGGERS.map(t => ({
            ...t,
            enabled: parsed[t.id] !== undefined ? parsed[t.id] : t.enabled,
          }));
        }
      }
    } catch {}
    return SUGGESTED_TRIGGERS;
  });

  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
        return val !== null ? val === 'true' : true;
      }
    } catch {}
    return true;
  });

  const [status, setStatus] = useState<MatchSyncStatus>(() => {
    let lastTime: string | null = null;
    let lastDate: string | null = null;
    let summary: string | null = null;

    try {
      if (typeof window !== 'undefined') {
        lastTime = localStorage.getItem(LAST_SYNC_KEY);
        lastDate = localStorage.getItem(LAST_SYNC_DATE_KEY);
        summary = localStorage.getItem(SYNC_SUMMARY_KEY);
      }
    } catch {}

    const nextMidnight = new Date(getNextMidnightMs()).toISOString();

    return {
      isSyncing: false,
      lastSyncTime: lastTime,
      lastSyncDate: lastDate,
      nextScheduledMidnight: nextMidnight,
      syncSource: null,
      lastTrigger: null,
      syncSummary: summary,
      error: null,
      matchesCount: 0,
      autoEnabled: true,
      activeTriggers: SUGGESTED_TRIGGERS.filter(t => t.enabled).map(t => t.id),
    };
  });

  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledWindowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncInProgressRef = useRef(false);
  const lastSyncTimestampRef = useRef<number>(Date.now());

  // Helper to test if a trigger is active
  const isTriggerEnabled = useCallback((triggerId: string): boolean => {
    if (!autoEnabled) return false;
    const item = triggerConfigs.find(t => t.id === triggerId);
    return item ? item.enabled : false;
  }, [autoEnabled, triggerConfigs]);

  /**
   * Dispatches triggers to the cron API endpoints and edge functions
   * to refresh match data, odds, and today's AI predictions.
   */
  const syncMatchData = useCallback(async (
    trigger: SyncTriggerSource = 'manual_user',
    forced = false
  ): Promise<boolean> => {
    if (syncInProgressRef.current) {
      return false;
    }

    const todayDate = getTodayDateString();
    const storedDate = localStorage.getItem(LAST_SYNC_DATE_KEY);
    const nowMs = Date.now();

    // Prevent aggressive re-syncs within 2 minutes unless explicitly forced by user
    if (!forced && trigger !== 'midnight_rollover' && (nowMs - lastSyncTimestampRef.current < 120000)) {
      return true;
    }

    // If midnight rollover and already done on this date, skip
    if (!forced && trigger === 'midnight_rollover' && storedDate === todayDate) {
      return true;
    }

    syncInProgressRef.current = true;
    setStatus(prev => ({
      ...prev,
      isSyncing: true,
      lastTrigger: trigger,
      error: null,
    }));

    let sourceUsed: MatchSyncStatus['syncSource'] = 'cron_api';
    let summaryMessage = '';
    let updatedCount = 0;

    try {
      // 1. Primary path: trigger the daily predictions cron API endpoint
      let cronSuccess = false;
      try {
        const cronRes = await fetch('/api/daily-predictions-cron', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trigger: `useMatchSync_${trigger}`,
            date: todayDate,
            timestamp: new Date().toISOString(),
          }),
        });

        if (cronRes.ok) {
          const cronData = await cronRes.json().catch(() => null);
          cronSuccess = true;
          sourceUsed = 'cron_api';
          summaryMessage = cronData?.data?.message || `Automated match sync executed via ${trigger}`;
        }
      } catch (cronErr) {
        console.debug('[useMatchSync] Local cron endpoint bypassed, trying edge fallback:', cronErr);
      }

      // 2. Secondary path: invoke Supabase Edge Function fallback
      if (!cronSuccess) {
        try {
          const edgeRes = await callEdgeFn(
            'cron-daily-predictions',
            { trigger, date: todayDate },
            undefined,
            12000
          );
          if (edgeRes) {
            cronSuccess = true;
            sourceUsed = 'edge_function';
            summaryMessage = edgeRes?.message || 'Edge function predictions refreshed';
          }
        } catch (edgeErr) {
          console.debug('[useMatchSync] Edge function fallback bypassed, hydrating via live feed:', edgeErr);
        }
      }

      // 3. Hydrate live upcoming fixtures
      const freshFixtures = await fetchRealtimeUpcomingFixtures('All');
      if (freshFixtures && freshFixtures.length > 0) {
        mergeAndPreservePredictions(freshFixtures);
        updatedCount = freshFixtures.length;
        if (!summaryMessage) {
          sourceUsed = 'realtime_feed';
          summaryMessage = `Synced ${updatedCount} today fixtures from live feeds`;
        }
      } else {
        const saved = getSavedPredictionsList();
        updatedCount = saved.length;
      }

      // 4. Invalidate TanStack query caches
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['predictions'] }),
        queryClient.invalidateQueries({ queryKey: ['football'] }),
        queryClient.invalidateQueries({ queryKey: ['live_matches'] }),
        queryClient.invalidateQueries({ queryKey: ['upcoming-matches'] }),
      ]);

      const nowIso = new Date().toISOString();
      const nextMidnightIso = new Date(getNextMidnightMs()).toISOString();
      lastSyncTimestampRef.current = Date.now();

      try {
        localStorage.setItem(LAST_SYNC_KEY, nowIso);
        localStorage.setItem(LAST_SYNC_DATE_KEY, todayDate);
        localStorage.setItem(SYNC_SUMMARY_KEY, summaryMessage);
      } catch {}

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: nowIso,
        lastSyncDate: todayDate,
        nextScheduledMidnight: nextMidnightIso,
        syncSource: sourceUsed,
        lastTrigger: trigger,
        syncSummary: summaryMessage,
        error: null,
        matchesCount: updatedCount,
        autoEnabled,
        activeTriggers: triggerConfigs.filter(t => t.enabled).map(t => t.id),
      }));

      return true;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Match sync encountered an error';
      console.warn('[useMatchSync] Error during match synchronization:', errorMsg);

      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMsg,
      }));
      return false;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [queryClient, autoEnabled, triggerConfigs]);

  // Toggle whole auto sync
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setAutoEnabled(enabled);
    try {
      localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
    } catch {}
    setStatus(prev => ({ ...prev, autoEnabled: enabled }));
  }, []);

  // Toggle individual trigger
  const toggleTrigger = useCallback((triggerId: string, enabled: boolean) => {
    setTriggerConfigs(prev => {
      const updated = prev.map(t => t.id === triggerId ? { ...t, enabled } : t);
      try {
        const settingObj = updated.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.enabled }), {});
        localStorage.setItem(TRIGGER_SETTINGS_KEY, JSON.stringify(settingObj));
      } catch {}
      return updated;
    });
  }, []);

  // TRIGGER 1: Autonomous Midnight Rollover (00:00:05)
  useEffect(() => {
    if (!autoEnabled || !isTriggerEnabled('midnight_rollover')) return;

    const scheduleNextMidnight = () => {
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }

      const nextMidnightMs = getNextMidnightMs();
      const msUntilMidnight = Math.max(nextMidnightMs - Date.now(), 1000);

      midnightTimerRef.current = setTimeout(async () => {
        await syncMatchData('midnight_rollover', true);
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    scheduleNextMidnight();

    return () => {
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
    };
  }, [autoEnabled, isTriggerEnabled, syncMatchData]);

  // TRIGGER 2 & 3: Scheduled Intraday Windows (09:00 UTC Morning Lineups, 14:00 UTC Pre-Match, 22:00 UTC Recap)
  useEffect(() => {
    if (!autoEnabled) return;

    const checkHourlyWindows = () => {
      const now = new Date();
      const currentUtcHour = now.getUTCHours();
      const currentUtcMinute = now.getUTCMinutes();

      // Check within the first 5 minutes of target hours
      if (currentUtcMinute <= 5) {
        if (currentUtcHour === 9 && isTriggerEnabled('morning_lineup_window')) {
          syncMatchData('morning_lineup_window', false).catch(() => {});
        } else if (currentUtcHour === 14 && isTriggerEnabled('afternoon_peak_window')) {
          syncMatchData('afternoon_peak_window', false).catch(() => {});
        } else if (currentUtcHour === 22 && isTriggerEnabled('post_match_reconciliation')) {
          syncMatchData('post_match_reconciliation', false).catch(() => {});
        }
      }
    };

    // Run check every 4 minutes
    const interval = setInterval(checkHourlyWindows, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, isTriggerEnabled, syncMatchData]);

  // TRIGGER 4: Cold Start Check (on App Mount)
  useEffect(() => {
    if (!autoEnabled) return;

    const todayDate = getTodayDateString();
    let storedDate: string | null = null;
    try {
      storedDate = localStorage.getItem(LAST_SYNC_DATE_KEY);
    } catch {}

    if (storedDate !== todayDate) {
      const initialTimer = setTimeout(() => {
        syncMatchData('init_cold_start', false).catch(() => {});
      }, 3500);
      return () => clearTimeout(initialTimer);
    }
  }, [autoEnabled, syncMatchData]);

  // TRIGGER 5: Tab Focus / Visibility Change
  useEffect(() => {
    if (!autoEnabled || !isTriggerEnabled('tab_visible')) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const todayDate = getTodayDateString();
        const storedDate = localStorage.getItem(LAST_SYNC_DATE_KEY);
        const lastSyncTimeStr = localStorage.getItem(LAST_SYNC_KEY);
        const lastSyncMs = lastSyncTimeStr ? new Date(lastSyncTimeStr).getTime() : 0;
        const isStale = Date.now() - lastSyncMs > 30 * 60 * 1000; // 30 minutes stale

        if (storedDate !== todayDate || isStale) {
          syncMatchData('tab_visible', false).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoEnabled, isTriggerEnabled, syncMatchData]);

  // TRIGGER 6: Network Reconnection Pulse
  useEffect(() => {
    if (!autoEnabled || !isTriggerEnabled('network_online')) return;

    const handleOnline = () => {
      syncMatchData('network_online', false).catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [autoEnabled, isTriggerEnabled, syncMatchData]);

  return {
    ...status,
    triggerConfigs,
    autoEnabled,
    toggleAutoSync,
    toggleTrigger,
    syncNow: () => syncMatchData('manual_user', true),
    syncWithTrigger: (trigger: SyncTriggerSource) => syncMatchData(trigger, true),
  };
}
