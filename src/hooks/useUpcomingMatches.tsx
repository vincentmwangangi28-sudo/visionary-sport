import { useState, useEffect, useCallback } from 'react';

interface UpcomingMatch {
  id: string; home_team: string; away_team: string;
  league: string; match_date: string;
  ai_prediction?: string; confidence?: number;
  home_odds?: number; draw_odds?: number; away_odds?: number;
}

const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

function normalizeIncomingMatch(raw: any): UpcomingMatch {
  const iso = raw.match_date
    ? new Date(raw.match_date).toISOString()
    : raw.date && raw.time
      ? new Date(`${raw.date}T${raw.time}Z`).toISOString()
      : raw.date
        ? new Date(`${raw.date}T00:00:00Z`).toISOString()
        : new Date().toISOString();

  return {
    id: String(raw.id ?? raw.match_id ?? `${raw.homeTeam ?? raw.home_team}-${raw.awayTeam ?? raw.away_team}`),
    home_team: raw.home_team ?? raw.homeTeam ?? raw.home_team_name ?? raw.strHomeTeam ?? 'Unknown',
    away_team: raw.away_team ?? raw.awayTeam ?? raw.away_team_name ?? raw.strAwayTeam ?? 'Unknown',
    league: raw.league ?? raw.competition ?? raw.league_name ?? raw.strLeague ?? 'Unknown',
    match_date: iso,
    ai_prediction: raw.prediction ?? raw.ai_prediction ?? raw.predicted_outcome,
    confidence: raw.confidence ?? raw.confidence_score ?? 0,
    home_odds: raw.home_odds,
    draw_odds: raw.draw_odds,
    away_odds: raw.away_odds,
  };
}

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-upcoming-matches`, {
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
      const data = await res.json() as { matches?: any[] };

      const incoming = (data?.matches ?? []).map(normalizeIncomingMatch);
      if (incoming.length > 0) setMatches(incoming);
    } catch (e) {
      console.warn('useUpcomingMatches:', e instanceof Error ? e.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { matches, loading, refresh };
};
