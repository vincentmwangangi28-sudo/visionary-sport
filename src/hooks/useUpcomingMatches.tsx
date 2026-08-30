import { useState, useEffect, useCallback } from 'react';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { 
  getSavedPrediction, 
  getSavedPredictionsList,
  generateDeterministicPrediction,
  savePrediction 
} from '@/services/predictionStorage';

export interface UpcomingMatch {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  ai_prediction?: string;
  confidence?: number;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  is_realtime?: boolean;
}

function deduplicateMatches(list: UpcomingMatch[]): UpcomingMatch[] {
  const seenTeams = new Map<string, number>();
  const sanitized: UpcomingMatch[] = [];

  for (const m of list) {
    if (!m.home_team || !m.away_team) continue;
    const matchTime = new Date(m.match_date).getTime();
    
    const homeLast = seenTeams.get(m.home_team.toLowerCase());
    const awayLast = seenTeams.get(m.away_team.toLowerCase());
    const tooCloseHome = homeLast && Math.abs(matchTime - homeLast) < 48 * 3600 * 1000;
    const tooCloseAway = awayLast && Math.abs(matchTime - awayLast) < 48 * 3600 * 1000;

    if (tooCloseHome || tooCloseAway) continue;

    seenTeams.set(m.home_team.toLowerCase(), matchTime);
    seenTeams.set(m.away_team.toLowerCase(), matchTime);
    sanitized.push(m);
  }

  return sanitized;
}

export const useUpcomingMatches = () => {
  // Initialize immediately from cached or default predictions for instant UI rendering
  const [matches, setMatches] = useState<UpcomingMatch[]>(() => {
    const saved = getSavedPredictionsList();
    const list = saved.length > 0 ? saved : DEFAULT_PREDICTIONS;
    return deduplicateMatches(list.slice(0, 12).map(p => ({
      id: p.id,
      home_team: p.home_team,
      away_team: p.away_team,
      league: p.league,
      match_date: p.match_date,
      ai_prediction: p.prediction,
      confidence: p.confidence,
      home_odds: p.home_odds,
      draw_odds: p.draw_odds,
      away_odds: p.away_odds,
      is_realtime: false,
    })));
  });
  const [loading, setLoading] = useState(false);
  const [isRealTime, setIsRealTime] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // 1. Fetch real-time live upcoming fixtures from verified real-time sports feed
      const realtimePicks = await fetchRealtimeUpcomingFixtures();
      
      const realMatches: UpcomingMatch[] = realtimePicks.map(p => ({
        id: p.id,
        home_team: p.home_team,
        away_team: p.away_team,
        league: p.league,
        match_date: p.match_date,
        ai_prediction: p.prediction,
        confidence: p.confidence,
        home_odds: p.home_odds,
        draw_odds: p.draw_odds,
        away_odds: p.away_odds,
        is_realtime: true,
      }));

      const combined = [...realMatches];

      // 2. Only fetch database fixtures or fallbacks if real-time feed returned fewer than 6 matches
      if (combined.length < 6) {
        try {
          const data = (await callEdgeFn('fetch-upcoming-matches', undefined, undefined, 6000)) as { matches?: any[] } | null;

          if (data?.matches && Array.isArray(data.matches)) {
            const dbMatches = data.matches.map(m => {
              const h = m.home_team ?? 'Unknown';
              const a = m.away_team ?? 'Unknown';
              const saved = getSavedPrediction(h, a);
              const det = generateDeterministicPrediction(h, a, m.competition ?? m.league, m.match_date);

              return {
                id: String(m.id ?? `${h}-${a}`),
                home_team: h,
                away_team: a,
                league: m.competition ?? m.league ?? 'Football',
                match_date: m.match_date ?? new Date().toISOString(),
                ai_prediction: saved?.predicted_outcome || saved?.prediction || m.prediction || det.prediction,
                confidence: saved?.confidence || saved?.confidence_score || m.confidence || det.confidence,
                home_odds: saved?.home_odds || m.home_odds || det.home_odds,
                draw_odds: saved?.draw_odds || m.draw_odds || det.draw_odds,
                away_odds: saved?.away_odds || m.away_odds || det.away_odds,
                is_realtime: true,
              };
            });
            combined.push(...dbMatches);
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.debug('Upcoming matches edge query skipped:', err.message);
          }
        }

        if (combined.length < 6) {
          const fallbacks: UpcomingMatch[] = DEFAULT_PREDICTIONS.map(p => ({
            id: p.id,
            home_team: p.home_team,
            away_team: p.away_team,
            league: p.league,
            match_date: p.match_date,
            ai_prediction: p.prediction,
            confidence: p.confidence,
            home_odds: p.home_odds,
            draw_odds: p.draw_odds,
            away_odds: p.away_odds,
            is_realtime: false,
          }));
          combined.push(...fallbacks);
        }
      }

      const deduplicated = deduplicateMatches(combined);
      deduplicated.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
      
      setMatches(deduplicated);
      setIsRealTime(realMatches.length > 0);
    } catch (e) {
      console.warn('useUpcomingMatches error (activating offline cache):', e instanceof Error ? e.message : 'fetch failed');
      // Offline fallback: load from persistent local prediction store & defaults
      const saved = getSavedPredictionsList();
      const offlineList: UpcomingMatch[] = (saved.length > 0 ? saved : DEFAULT_PREDICTIONS).map(p => ({
        id: p.id,
        home_team: p.home_team,
        away_team: p.away_team,
        league: p.league,
        match_date: p.match_date,
        ai_prediction: p.prediction,
        confidence: p.confidence,
        home_odds: p.home_odds,
        draw_odds: p.draw_odds,
        away_odds: p.away_odds,
        is_realtime: false,
      }));
      setMatches(deduplicateMatches(offlineList));
      setIsRealTime(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000); // 1-minute fixture refresh
    return () => clearInterval(interval);
  }, [refresh]);

  return { matches, loading, isRealTime, refresh };
};
