import { useState, useEffect, useCallback } from 'react';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { 
  getSavedPrediction, 
  getSavedPredictionsList,
  generateDeterministicPrediction,
} from '@/services/predictionStorage';
import { Prediction } from '@/types/prediction';
import {
  isPlayedOrPastMatch,
  sortMatchesByDatePriority,
} from '@/lib/dateFilterUtils';

export interface UpcomingMatch extends Prediction {
  ai_prediction?: string;
  is_realtime?: boolean;
}

/**
 * Deduplicates fixtures by team matchup, strictly ignores any played/finished/in-play/past match,
 * and sorts by Date Priority (Today -> Tomorrow -> Future dates, earliest kickoff first).
 */
export function deduplicateUpcomingMatches(list: UpcomingMatch[]): UpcomingMatch[] {
  const sortedByDate = sortMatchesByDatePriority(list);
  const seenPairs = new Set<string>();
  const sanitized: UpcomingMatch[] = [];

  for (const m of sortedByDate) {
    if (!m.home_team || !m.away_team) continue;
    // Strictly ignore any match that has already kicked off, is in-play, or has been played/settled
    if (isPlayedOrPastMatch(m)) continue;

    const pairKey = `${m.home_team.trim().toLowerCase()} vs ${m.away_team.trim().toLowerCase()}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    sanitized.push(m);
  }

  return sortMatchesByDatePriority(sanitized);
}

/**
 * Converts a valid upcoming prediction or raw fixture into a verified UpcomingMatch with AI model reasoning.
 * Returns null if the match has already been played, settled, or kicked off.
 */
function toUpcomingMatch(p: Partial<Prediction>, isRealtime = false): UpcomingMatch | null {
  if (!p || isPlayedOrPastMatch(p)) {
    return null;
  }

  const home = (p.home_team || '').trim();
  const away = (p.away_team || '').trim();
  if (!home || !away) return null;

  const league = p.league || 'Football League';
  const matchDateIso = new Date(p.match_date as string).toISOString();

  // Check saved predictions or generate deterministic modeling
  const saved = getSavedPrediction(home, away, matchDateIso);
  const det = generateDeterministicPrediction(home, away, league, matchDateIso);

  const outcome = p.predicted_outcome || p.prediction || saved?.predicted_outcome || saved?.prediction || det.prediction;
  const conf = p.confidence_score ?? p.confidence ?? saved?.confidence_score ?? saved?.confidence ?? det.confidence;

  const homeOdds = Number(p.home_odds ?? saved?.home_odds ?? det.home_odds ?? 2.10);
  const drawOdds = Number(p.draw_odds ?? saved?.draw_odds ?? det.draw_odds ?? 3.30);
  const awayOdds = Number(p.away_odds ?? saved?.away_odds ?? det.away_odds ?? 3.40);

  return {
    id: p.id || `upc-${home.toLowerCase().replace(/\s+/g, '-')}-${away.toLowerCase().replace(/\s+/g, '-')}`,
    match_id: p.match_id || `match-${home.slice(0, 3).toLowerCase()}-${away.slice(0, 3).toLowerCase()}`,
    home_team: home,
    away_team: away,
    league,
    match_date: matchDateIso,
    prediction: outcome,
    predicted_outcome: outcome,
    ai_prediction: outcome,
    confidence: conf,
    confidence_score: conf,
    home_odds: homeOdds,
    draw_odds: drawOdds,
    away_odds: awayOdds,
    analysis: p.analysis || saved?.analysis || det.analysis,
    reasoning: p.reasoning || saved?.reasoning || det.reasoning,
    status: 'pending',
    is_premium: Boolean(p.is_premium),
    created_at: p.created_at || new Date().toISOString(),
    is_realtime: isRealtime,
  };
}

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>(() => {
    const saved = getSavedPredictionsList();
    const sourcePool = saved.length >= 6 ? saved : getUpdatedDefaultPredictions();
    const mapped = sourcePool
      .map((p) => toUpcomingMatch(p, true))
      .filter((m): m is UpcomingMatch => m !== null);
    return deduplicateUpcomingMatches(mapped);
  });

  const [loading, setLoading] = useState(false);
  const [isRealTime, setIsRealTime] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Query real-time upcoming verified matches across international leagues
      const realtimePicks = await fetchRealtimeUpcomingFixtures();
      
      const realMatches: UpcomingMatch[] = realtimePicks
        .map((p) => toUpcomingMatch(p, true))
        .filter((m): m is UpcomingMatch => m !== null);

      const combined: UpcomingMatch[] = [...realMatches];

      // 2. Only fall back to updated default fixtures if live feeds returned zero matches
      if (combined.length === 0) {
        const updatedDefaults = getUpdatedDefaultPredictions()
          .map((p) => toUpcomingMatch(p, false))
          .filter((m): m is UpcomingMatch => m !== null);
        combined.push(...updatedDefaults);
      }

      // 3. Deduplicate, ignore any played/past matches, and sort strictly by Date Priority
      const sanitized = deduplicateUpcomingMatches(combined);
      setMatches(sanitized);
      setIsRealTime(realMatches.length > 0);
    } catch (e) {
      console.warn('useUpcomingMatches refresh fallback:', e instanceof Error ? e.message : 'fetch failed');
      const saved = getSavedPredictionsList();
      const sourcePool = saved.length > 0 ? saved : getUpdatedDefaultPredictions();
      const offlineList = sourcePool
        .map((p) => toUpcomingMatch(p, false))
        .filter((m): m is UpcomingMatch => m !== null);
      setMatches(deduplicateUpcomingMatches(offlineList));
      setIsRealTime(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000); // 60-second fixture sync & played-match pruning
    return () => {
      clearInterval(interval);
    };
  }, [refresh]);

  return { matches, loading, isRealTime, refresh };
};
