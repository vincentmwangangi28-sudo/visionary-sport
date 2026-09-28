import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { 
  mergeAndPreservePredictions, 
  getSavedPredictionsList 
} from '@/services/predictionStorage';
import {
  isPlayedOrPastMatch,
  filterOutPlayedMatches,
  sortMatchesByDatePriority,
} from '@/lib/dateFilterUtils';

export type { Prediction };
export { getPrediction, getConfidence };

const PAGE_SIZE = 12;
const queryKeys = { predictions: { list: (p: number) => ['predictions', 'list', p] } };

// Strictly ignore any match that has already kicked off, is in-play, or has been played/settled
function excludePlayedMatches(list: Prediction[]): Prediction[] {
  return filterOutPlayedMatches(list);
}

// Filter out duplicate or conflicting schedule matches while preserving earliest upcoming date priority
function sanitizeAndDeduplicatePredictions(list: Prediction[]): Prediction[] {
  // Sort chronologically first so the earliest upcoming match for any team wins deduplication
  const sortedInput = sortMatchesByDatePriority(excludePlayedMatches(list));
  const seenTeams = new Map<string, number>(); // team -> timestamp ms
  const seenFixtures = new Set<string>();
  const sanitized: Prediction[] = [];

  for (const pred of sortedInput) {
    if (!pred.home_team || !pred.away_team) continue;
    if (isPlayedOrPastMatch(pred)) continue;

    const matchTime = new Date(pred.match_date).getTime();
    const fixKey = `${pred.home_team.toLowerCase()}-${pred.away_team.toLowerCase()}-${String(pred.match_date).split('T')[0]}`;
    if (seenFixtures.has(fixKey)) continue;
    seenFixtures.add(fixKey);
    
    // Check if either team is scheduled within 18 hours of this match (same day conflict)
    const homeLast = seenTeams.get(pred.home_team.toLowerCase());
    const awayLast = seenTeams.get(pred.away_team.toLowerCase());
    const tooCloseHome = homeLast && Math.abs(matchTime - homeLast) < 18 * 3600 * 1000;
    const tooCloseAway = awayLast && Math.abs(matchTime - awayLast) < 18 * 3600 * 1000;

    if (tooCloseHome || tooCloseAway) {
      continue;
    }

    seenTeams.set(pred.home_team.toLowerCase(), matchTime);
    seenTeams.set(pred.away_team.toLowerCase(), matchTime);
    sanitized.push(pred);
  }

  return sortMatchesByDatePriority(sanitized);
}

export const usePredictions = (page = 1, league?: string) => {
  const { isPremium } = useSubscription();

  const query = useQuery({
    queryKey: [...queryKeys.predictions.list(page), league ?? 'all'],
    queryFn: async () => {
      const combinedPredictions: Prediction[] = [];
      const seenMatchupKeys = new Set<string>();

      const pushIfValidUpcoming = (item: Prediction) => {
        if (!item || !item.home_team || !item.away_team) return;
        if (isPlayedOrPastMatch(item)) return;
        const pairKey = `${item.home_team.trim().toLowerCase()}-${item.away_team.trim().toLowerCase()}`;
        if (seenMatchupKeys.has(pairKey)) return;
        seenMatchupKeys.add(pairKey);
        combinedPredictions.push({
          ...item,
          status: 'pending',
        });
      };

      // 1. Fetch real-time live upcoming fixtures from RapidAPI & ESPN sports feeds
      try {
        const realtimeFixtures = await fetchRealtimeUpcomingFixtures(league);
        if (realtimeFixtures && realtimeFixtures.length > 0) {
          for (const item of realtimeFixtures) {
            pushIfValidUpcoming(item);
          }
        }
      } catch (err) {
        console.warn('Realtime fixtures fetch warning:', err);
      }

      // 2. Query Supabase for strictly upcoming (future) pending predictions ordered by match_date ascending
      if (combinedPredictions.length < 18) {
        try {
          const nowIso = new Date().toISOString();
          const twoWeeksIso = new Date(Date.now() + 14 * 86400000).toISOString();
          let q = supabase
            .from('predictions')
            .select('*')
            .gt('match_date', nowIso)
            .lte('match_date', twoWeeksIso)
            .eq('status', 'pending')
            .order('match_date', { ascending: true })
            .order('confidence', { ascending: false });

          if (league && league !== 'All') {
            q = q.eq('league', league);
          }

          const { data, error } = await q;
          if (!error && data && data.length > 0) {
            for (const item of data as Prediction[]) {
              pushIfValidUpcoming(item);
            }
          }
        } catch (err) {
          console.warn('Supabase predictions query warning:', err);
        }
      }

      // 3. Only fall back to updated default fixtures if live feeds and DB returned zero matches
      if (combinedPredictions.length === 0) {
        let updatedDefaultList = getUpdatedDefaultPredictions();
        if (league && league !== 'All') {
          const leagueFiltered = updatedDefaultList.filter(p => p.league?.toLowerCase() === league.toLowerCase());
          if (leagueFiltered.length > 0) {
            updatedDefaultList = leagueFiltered;
          }
        }
        for (const item of updatedDefaultList) {
          pushIfValidUpcoming(item);
        }
      }

      // Merge with persistent prediction registry to lock values across refreshes (excluding any played matches)
      const preserved = mergeAndPreservePredictions(combinedPredictions);

      // Final deduplication, strict played-match exclusion & Date Priority sorting (earliest upcoming first)
      const cleanList = sortMatchesByDatePriority(
        sanitizeAndDeduplicatePredictions(preserved.length > 0 ? preserved : combinedPredictions)
      );

      const start = (page - 1) * PAGE_SIZE;
      const paginated = cleanList.slice(start, start + PAGE_SIZE);
      return {
        predictions: paginated,
        allPredictions: cleanList,
        total: cleanList.length,
        isRealTime: true,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Gate premium predictions for free users
  const rawList = query.data?.predictions ?? [];
  const gated = rawList.map(p => {
    const outcome = getPrediction(p);
    if (p.is_premium && !isPremium() && !outcome.includes('🔒')) {
      return {
        ...p,
        prediction: '🔒 Premium',
        predicted_outcome: '🔒 Premium',
        analysis: 'Upgrade to Pro to unlock this premium mathematical prediction.',
        reasoning: 'Full probability vector and statistical metrics restricted to Pro subscribers.',
        confidence: 0,
        confidence_score: 0,
        home_odds: undefined,
        draw_odds: undefined,
        away_odds: undefined,
      };
    }
    return p;
  });

  const total = query.data?.total ?? gated.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { ...query, predictions: gated, totalPages, pageSize: PAGE_SIZE, isRealTime: true };
};
