import { useState, useEffect, useCallback } from 'react';
import { normalizeIncomingMatch } from '@/lib/matchNormalizer';
import type { NormalizedMatch } from '@/lib/matchNormalizer';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { fetchRealtimeLiveMatches } from '@/services/realtimeFootball';

export interface LiveMatchItem {
  id: string;
  home_team: string;
  away_team: string;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  minute?: number | null;
  league: string;
  match_date: string;
  ai_prediction?: string;
  confidence?: number;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  home_logo?: string | null;
  away_logo?: string | null;
  is_realtime?: boolean;
}

export const useLiveMatches = () => {
  const [matches, setMatches] = useState<LiveMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'upcoming' | 'realtime_feed'>('realtime_feed');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // 1. Fetch real-time live data from live football feeds
      const realtimeData = await fetchRealtimeLiveMatches();

      let shaped: LiveMatchItem[] = [];

      if (realtimeData.matches && realtimeData.matches.length > 0) {
        shaped = realtimeData.matches.map(m => ({
          ...m,
          league: m.competition || 'Football Match',
          is_realtime: true,
        }));
      }

      // 2. Also query edge function for any database/API-Sports live events
      try {
        const payload = (await callEdgeFn('fetch-live-matches', undefined, undefined, 6000)) as {
          matches?: any[];
          source?: string;
        } | null;

        if (payload?.matches && Array.isArray(payload.matches)) {
          const edgeMatches: NormalizedMatch[] = payload.matches.map(normalizeIncomingMatch);
          const edgeShaped = edgeMatches.map(m => ({
            ...m,
            league: (m as any).competition || 'Football Match',
            is_realtime: true,
          }));

          // Merge avoiding duplicates
          const existing = new Set(shaped.map(s => `${s.home_team}-${s.away_team}`.toLowerCase()));
          for (const em of edgeShaped) {
            const key = `${em.home_team}-${em.away_team}`.toLowerCase();
            if (!existing.has(key)) {
              shaped.push(em);
            }
          }
        }
      } catch (err: unknown) {
        // Soft fail edge function silently if aborted or if network feed is already primary
        if (err instanceof Error && err.name !== 'AbortError') {
          console.debug('Live matches edge query skipped:', err.message);
        }
      }

      if (shaped.length > 0) {
        setMatches(shaped);
        setSource('realtime_feed');
        setLastUpdated(new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setIsRealTimeConnected(true);
      }
    } catch (e) {
      console.warn('useLiveMatches realtime error:', e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 20_000); // 20-second live polling

    // Real-time goal and score updates subscription via Supabase Realtime
    const channel = supabase
      .channel('live-matches-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_match_events' },
        () => {
          refresh();
        }
      )
      .subscribe(() => {
        setIsRealTimeConnected(true);
      });

    return () => {
      clearInterval(iv);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { matches, loading, source, lastUpdated, isRealTimeConnected, refresh };
};
