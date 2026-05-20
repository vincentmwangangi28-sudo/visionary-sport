import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { trackFreeLimitHit } from '@/lib/analytics';

const FREE_DAILY_LIMIT = 3;
const STORAGE_KEY = 'vsp_free_views';
interface StorageEntry { date: string; count: number; }
const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useFreeTierLimit = () => {
  const { user } = useAuth() as { user: { role?: string } | null };
  const isPremium = user?.role === 'premium';
  const [viewsToday, setViewsToday] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  useEffect(() => {
    if (isPremium) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entry: StorageEntry = JSON.parse(raw);
        if (entry.date === getTodayKey()) { setViewsToday(entry.count); setLimitReached(entry.count >= FREE_DAILY_LIMIT); }
        else localStorage.removeItem(STORAGE_KEY);
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, [isPremium]);
  const recordView = useCallback(() => {
    if (isPremium) return true;
    if (limitReached) { trackFreeLimitHit(); return false; }
    const next = viewsToday + 1;
    setViewsToday(next);
    const reached = next >= FREE_DAILY_LIMIT;
    setLimitReached(reached);
    if (reached) trackFreeLimitHit();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count: next })); } catch {}
    return !reached;
  }, [isPremium, limitReached, viewsToday]);
  return { viewsToday, limitReached: !isPremium && limitReached, remainingViews: isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - viewsToday), dailyLimit: FREE_DAILY_LIMIT, recordView, isPremium };
};
