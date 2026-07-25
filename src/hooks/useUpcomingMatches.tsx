import { useState, useEffect, useCallback } from 'react';

interface UpcomingMatch {
  id: string; home_team: string; away_team: string;
  league: string; match_date: string;
  ai_prediction?: string; confidence?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
}

const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-live-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        signal: controller.signal,
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { matches?: (UpcomingMatch & { status?: string })[] };
      const upcoming = (data?.matches ?? []).filter(m => m.status === 'upcoming');
      if (upcoming.length > 0) setMatches(upcoming);
    } catch (e) {
      console.warn('useUpcomingMatches:', e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { matches, loading, refresh };
};
