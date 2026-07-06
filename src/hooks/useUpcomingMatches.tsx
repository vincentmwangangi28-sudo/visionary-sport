import { useState, useEffect, useCallback } from 'react';
import { callEdgeFn } from '@/lib/callEdgeFunction';

interface UpcomingMatch {
  id: string; home_team: string; away_team: string;
  league: string; match_date: string;
  ai_prediction?: string; confidence?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
}

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'upcoming'>('upcoming');
  const [lastUpdated, setLastUpdated] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await callEdgeFn('fetch-live-matches') as { matches?: UpcomingMatch[] };
      const upcoming = (data?.matches ?? []).filter((m: UpcomingMatch & { status?: string }) => m.status === 'upcoming');
      if (upcoming.length > 0) {
        setMatches(upcoming);
        setSource('upcoming');
        setLastUpdated(new Date().toISOString());
      }
    } catch (e) {
      console.error('useUpcomingMatches error:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { matches, loading, source, lastUpdated, refresh };
};
