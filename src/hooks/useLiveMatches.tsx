import { useState, useEffect, useCallback } from 'react';

interface Match {
  id: string; home_team: string; away_team: string;
  home_score?: number | null; away_score?: number | null;
  status: string; minute?: number | null; league: string;
  match_date: string; ai_prediction?: string; confidence?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
}

const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

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
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { matches?: Match[]; live_count?: number };
      
      if (data?.matches?.length > 0) {
        setMatches(data.matches);
        setSource(data.live_count && data.live_count > 0 ? 'live' : 'upcoming');
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
