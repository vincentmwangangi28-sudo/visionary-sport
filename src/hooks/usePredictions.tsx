import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { matchesLeagueFilter, fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { supabase } from '@/integrations/supabase/client';
import { 
  mergeAndPreservePredictions, 
  generateDeterministicPrediction,
  savePrediction
} from '@/services/predictionStorage';
import {
  isPlayedOrPastMatch,
  filterOutPlayedMatches,
  sortMatchesByDatePriority,
} from '@/lib/dateFilterUtils';

export type { Prediction };
export { getPrediction, getConfidence };

const PAGE_SIZE = 6;
const queryKeys = { predictions: { list: (leagueKey: string) => ['predictions', 'list', leagueKey] } };

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

const INITIAL_PAYLOAD_CACHE = new Map<string, {
  allPredictions: Prediction[];
  total: number;
  isRealTime: boolean;
}>();

function getCachedInitialPredictionsPayload(league?: string) {
  const key = league?.toLowerCase() ?? 'all';
  const cached = INITIAL_PAYLOAD_CACHE.get(key);
  if (cached) return cached;

  let seed = getUpdatedDefaultPredictions();
  if (league && league !== 'All') {
    const filtered = seed.filter((p) => matchesLeagueFilter(p.league, league));
    if (filtered.length > 0) seed = filtered;
  }
  const cleanList = sortMatchesByDatePriority(sanitizeAndDeduplicatePredictions(seed));
  const payload = {
    allPredictions: cleanList,
    total: cleanList.length,
    isRealTime: true,
  };
  INITIAL_PAYLOAD_CACHE.set(key, payload);
  return payload;
}

export const usePredictions = (page = 1, league?: string) => {
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const leagueKey = league?.toLowerCase() ?? 'all';

  const initialDataPayload = getCachedInitialPredictionsPayload(league);

  const query = useQuery({
    queryKey: queryKeys.predictions.list(leagueKey),
    initialData: initialDataPayload,
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      const combinedPredictions: Prediction[] = [];
      const seenMatchupKeys = new Set<string>();

      const pushIfValidUpcoming = (item: Prediction) => {
        if (!item || !item.home_team || !item.away_team) return;
        if (isPlayedOrPastMatch(item)) return;
        if (league && league !== 'All' && !matchesLeagueFilter(item.league, league)) return;
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
            .is('result', null)
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

      // 3. Only supplement verified fallback fixtures if live feeds returned fewer than 6 matches or for regional CAF leagues
      let updatedDefaultList = getUpdatedDefaultPredictions();
      if (league && league !== 'All') {
        const leagueFiltered = updatedDefaultList.filter(p => matchesLeagueFilter(p.league, league));
        if (leagueFiltered.length > 0) {
          updatedDefaultList = leagueFiltered;
        }
      } else if (combinedPredictions.length >= 12) {
        updatedDefaultList = updatedDefaultList.filter(p => matchesLeagueFilter(p.league, 'AFCON'));
      }
      for (const item of updatedDefaultList) {
        pushIfValidUpcoming(item);
      }

      // Merge with persistent prediction registry to lock values across refreshes (excluding any played matches)
      const preserved = mergeAndPreservePredictions(combinedPredictions);

      // Final deduplication, strict played-match exclusion & Date Priority sorting (earliest upcoming first)
      const cleanList = sortMatchesByDatePriority(
        sanitizeAndDeduplicatePredictions(preserved.length > 0 ? preserved : combinedPredictions)
      );

      return {
        allPredictions: cleanList,
        total: cleanList.length,
        isRealTime: true,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    let triggered = false;
    const triggerRefetch = () => {
      if (triggered) return;
      triggered = true;
      query.refetch();
    };
    const timer = setTimeout(triggerRefetch, 50);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league]);

  const generatePrediction = async (input: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    matchDate: string;
  }) => {
    const det = generateDeterministicPrediction(input.homeTeam, input.awayTeam, input.league, input.matchDate);
    const created: Prediction = {
      id: `custom-${Date.now()}`,
      match_id: `custom-${Date.now()}`,
      home_team: input.homeTeam,
      away_team: input.awayTeam,
      league: input.league,
      match_date: new Date(input.matchDate).toISOString(),
      prediction: det.prediction,
      predicted_outcome: det.prediction,
      confidence: det.confidence,
      confidence_score: det.confidence,
      reasoning: det.reasoning,
      analysis: det.reasoning,
      home_odds: det.home_odds,
      draw_odds: det.draw_odds,
      away_odds: det.away_odds,
      status: 'pending',
      is_premium: false,
      created_at: new Date().toISOString(),
    };
    savePrediction(created, true);
    await queryClient.invalidateQueries({ queryKey: ['predictions'] });
    return created;
  };

  // Gate premium predictions consistently across allPredictions and paginated slice for free users
  const hasPremiumAccess = isPremium();
  const gatedAll = useMemo(() => {
    const rawAll = query.data?.allPredictions ?? [];
    if (hasPremiumAccess) return rawAll;
    return rawAll.map(p => {
      const outcome = getPrediction(p);
      if (p.is_premium && !outcome.includes('🔒')) {
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
  }, [query.data?.allPredictions, hasPremiumAccess]);

  const gatedPage = useMemo(() => {
    const start = Math.max(0, (page - 1) * PAGE_SIZE);
    return gatedAll.slice(start, start + PAGE_SIZE);
  }, [gatedAll, page]);

  const total = gatedAll.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const gatedData = useMemo(() => {
    if (!query.data) return undefined;
    return {
      ...query.data,
      predictions: gatedPage,
      allPredictions: gatedAll,
      total,
    };
  }, [query.data, gatedPage, gatedAll, total]);

  return {
    ...query,
    data: gatedData,
    loading: query.isLoading,
    generatePrediction,
    predictions: gatedPage,
    allPredictions: gatedAll,
    totalPages,
    pageSize: PAGE_SIZE,
    isRealTime: true,
  };
};
