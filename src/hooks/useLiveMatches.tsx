import { useState, useEffect, useCallback } from 'react';
import { normalizeIncomingMatch } from '@/lib/matchNormalizer';
import type { NormalizedMatch } from '@/lib/matchNormalizer';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';

interface Match {
  id: string; home_team: string; away_team: string;
  home_score?: number | null; away_score?: number | null;
  status: string; minute?: number | null; league: string;
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-live-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json() as { matches?: any[]; live_count?: number; source?: string };

      const incoming: NormalizedMatch[] = (payload?.matches ?? []).map(normalizeIncomingMatch);
      // add `league` field expected by UI from competition
      const shaped = incoming.map(m => ({ ...m, league: (m as any).competition ?? '' })) as unknown as Match[];

      if (shaped.length > 0) {
        setMatches(shaped);
        setSource(payload.source === 'live' ? 'live' : (payload.live_count && payload.live_count > 0 ? 'live' : 'upcoming'));
        setLastUpdated(new Date().toLocaleTimeString('en-KE'));
      }
    } catch (e) {
      // Silent fail — pages gracefully show empty state
      console.warn('useLiveMatches:', e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30_000);
    return () => clearInterval(iv);
  }, [refresh]);

  return { matches, loading, source, lastUpdated, refresh };
};
