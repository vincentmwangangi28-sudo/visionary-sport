import { useState, useEffect, useCallback } from 'react';
import { callEdgeFn } from '@/lib/callEdgeFunction';

interface Match {
  id: string; home_team: string; away_team: string;
  home_score?: number; away_score?: number;
  status: string; minute?: number; league: string;
  match_date: string; ai_prediction?: string; confidence?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
}

export const useLiveMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'upcoming'>('upcoming');
  const [lastUpdated, setLastUpdated] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await callEdgeFn('fetch-live-matches') as { matches?: Match[]; live_count?: number };
      if (data?.matches?.length > 0) {
        setMatches(data.matches);
        setSource(data.live_count && data.live_count > 0 ? 'live' : 'upcoming');
        setLastUpdated(new Date().toISOString());
      }
    } catch (e) {
      console.error('useLiveMatches error:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  return { matches, loading, source, lastUpdated, refresh };
};
