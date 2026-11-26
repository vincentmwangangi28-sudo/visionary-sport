import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { 
  mergeAndPreservePredictions, 
  generateDeterministicPrediction,
  savePrediction,
  getSavedPredictionsList,
} from '@/services/predictionStorage';
import {
  isPlayedOrPastMatch,
  filterOutPlayedMatches,
  sortMatchesByDatePriority,
} from '@/lib/dateFilterUtils';
import {
  applyAdminEditorialOverridesToPredictions,
  ADMIN_SYNC_EVENT,
} from '@/services/adminOverrideSyncService';

export type { Prediction };
export { getPrediction, getConfidence };

function matchesLeagueFilter(predLeague: string | undefined, targetLeague: string | undefined): boolean {
  if (!targetLeague || targetLeague === 'All') return true;
  if (!predLeague) return false;
  const pL = predLeague.toLowerCase().trim();
  const tL = targetLeague.toLowerCase().trim();
  if (tL === 'kpl' || tL.includes('kenya') || tL.includes('fkf')) {
    return pL === 'kpl' || pL.includes('kenya') || pL.includes('fkf');
  }
  if (tL === 'premier league' || tL === 'epl' || tL === 'english premier league') {
    return pL === 'premier league' || pL === 'english premier league' || pL === 'epl';
  }
  if (tL === 'champions league' || tL === 'ucl' || tL === 'uefa champions league') {
    return pL === 'champions league' || pL === 'uefa champions league' || pL === 'ucl';
  }
  if (tL === 'afcon' || tL === 'caf') {
    return pL.includes('afcon') || pL.includes('caf') || pL.includes('kenya') || pL.includes('fkf') || pL.includes('psl') || pL.includes('npfl') || pL.includes('egypt');
  }
  return pL === tL || pL.includes(tL) || tL.includes(pL);
}

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

const REAL_UPCOMING_STORAGE_KEY = 'predictpro_real_upcoming_v6_full_slate';

const INITIAL_PAYLOAD_CACHE = new Map<string, {
  payload: {
    allPredictions: Prediction[];
    total: number;
    isRealTime: boolean;
  };
  updatedAt: number;
}>();

function getCachedInitialPredictionsPayload(league?: string): {
  payload: {
    allPredictions: Prediction[];
    total: number;
    isRealTime: boolean;
  };
  updatedAt: number | undefined;
} {
  const key = league?.toLowerCase() ?? 'all';
  const cached = INITIAL_PAYLOAD_CACHE.get(key);
  if (cached && cached.payload.allPredictions.length > 0) {
    return cached;
  }

  let seed: Prediction[] = [];
  let storedTimestamp: number | undefined;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('predictpro_real_upcoming_v1');
      localStorage.removeItem('predictpro_real_upcoming_v3');
      localStorage.removeItem('predictpro_real_upcoming_v5_espn_live');
      const raw = localStorage.getItem(REAL_UPCOMING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { timestamp: number; fixtures: Prediction[] };
        if (
          parsed &&
          Array.isArray(parsed.fixtures) &&
          parsed.fixtures.length >= 12 &&
          Date.now() - parsed.timestamp < 30 * 60_000
        ) {
          const validStored = filterOutPlayedMatches(parsed.fixtures);
          if (validStored.length >= 12) {
            seed = validStored;
            storedTimestamp = parsed.timestamp;
          }
        }
      }
    } catch {
      // ignore localStorage read errors
    }
  }

  if (seed.length === 0) {
    seed = getSavedPredictionsList().filter(
      (p) => (p.is_realtime || String(p.id).startsWith('espn-real-') || String(p.id).startsWith('real-match-')) && !isPlayedOrPastMatch(p)
    );
  }

  if (league && league !== 'All') {
    const filtered = seed.filter((p) => matchesLeagueFilter(p.league, league));
    seed = filtered;
  }
  const cleanList = sortMatchesByDatePriority(sanitizeAndDeduplicatePredictions(seed));
  const payload = {
    allPredictions: cleanList,
    total: cleanList.length,
    isRealTime: true,
  };
  if (cleanList.length > 0) {
    const resolvedUpdatedAt = storedTimestamp ?? (Date.now() - 240_000);
    const entry = { payload, updatedAt: resolvedUpdatedAt };
    INITIAL_PAYLOAD_CACHE.set(key, entry);
    return entry;
  }
  return { payload, updatedAt: undefined };
}

export interface UsePredictionsOptions {
  page?: number;
  limit?: number;
  league?: string;
}

export type PredictionsDataHybrid = Prediction[] & {
  predictions: Prediction[];
  allPredictions: Prediction[];
  total: number;
  isRealTime: boolean;
};

function enrichPredictionAliases(p: Prediction): Prediction {
  let formattedTime = p.time;
  if (!formattedTime) {
    if (typeof p.match_date === 'string' && p.match_date.length >= 16 && p.match_date[10] === 'T') {
      formattedTime = `${p.match_date.slice(11, 16)} UTC`;
    } else if (p.match_date) {
      const d = new Date(p.match_date);
      formattedTime = !isNaN(d.getTime()) ? `${d.toISOString().slice(11, 16)} UTC` : '15:00 UTC';
    } else {
      formattedTime = '15:00 UTC';
    }
  }

  return {
    ...p,
    homeTeam: p.homeTeam || p.home_team,
    awayTeam: p.awayTeam || p.away_team,
    matchDate: p.matchDate || p.match_date,
    time: formattedTime,
  };
}

export const usePredictions = (
  pageOrOptions: number | UsePredictionsOptions = 1,
  leagueArg?: string
) => {
  const page =
    typeof pageOrOptions === 'number'
      ? Math.max(1, pageOrOptions)
      : Math.max(1, pageOrOptions?.page ?? 1);
  const effectivePageSize =
    typeof pageOrOptions === 'object' && pageOrOptions?.limit
      ? Math.max(1, pageOrOptions.limit)
      : PAGE_SIZE;
  const league =
    typeof pageOrOptions === 'object' && pageOrOptions?.league
      ? pageOrOptions.league
      : leagueArg;

  useSubscription();
  const queryClient = useQueryClient();
  const leagueKey = league?.toLowerCase() ?? 'all';

  const cachedInitial = getCachedInitialPredictionsPayload(league);
  const hasInitialData = cachedInitial.payload.allPredictions.length > 0;

  const query = useQuery({
    queryKey: queryKeys.predictions.list(leagueKey),
    ...(hasInitialData
      ? {
          initialData: cachedInitial.payload,
          initialDataUpdatedAt: cachedInitial.updatedAt,
        }
      : {}),
    queryFn: async () => {

      const combinedPredictions: Prediction[] = [];
      const seenMatchupKeys = new Set<string>();

      const pushIfValidUpcoming = (item: Prediction) => {
        if (!item || !item.home_team || !item.away_team) return;
        if (isPlayedOrPastMatch(item)) return;
        if (league && league !== 'All' && !matchesLeagueFilter(item.league, league)) return;
        const datePart = item.match_date ? String(item.match_date).slice(0, 10) : 'nodate';
        const pairKey = `${item.home_team.trim().toLowerCase()}-${item.away_team.trim().toLowerCase()}-${datePart}`;
        if (seenMatchupKeys.has(pairKey)) return;
        seenMatchupKeys.add(pairKey);
        combinedPredictions.push({
          ...item,
          status: 'pending',
        });
      };

      // 1a. Fast server-side real upcoming fixtures (/api/football?type=upcoming)
      const isBrowserOffline =
        typeof navigator !== 'undefined' && navigator.onLine === false;
      let serverNetworkFailed = isBrowserOffline;

      if (!isBrowserOffline) {
        try {
          let json: any = null;
          try {
            const url =
              league && league !== 'All'
                ? `/api/football?type=upcoming&league=${encodeURIComponent(league)}`
                : '/api/football?type=upcoming';
            const res = await fetch(url, {
              headers: { Accept: 'application/json' },
            });
            const ct = res.headers.get('content-type') || '';
            if (res.ok && ct.includes('application/json')) {
              json = await res.json();
            }
          } catch {
            // Static host — invoke handleFootballRequest directly
          }

          const serverFixtures = Array.isArray(json?.fixtures) ? (json.fixtures as Prediction[]) : [];
          const hasUpcomingFromServer =
            !json?.offline && serverFixtures.some((item) => item && !isPlayedOrPastMatch(item));

          if (!hasUpcomingFromServer) {
            const { handleFootballRequest } = await import('@/server/footballHandler');
            json = await handleFootballRequest({
              type: 'upcoming',
              league: league && league !== 'All' ? league : undefined,
            });
          }

          if (Array.isArray(json?.fixtures) && json.fixtures.length > 0) {
            for (const item of json.fixtures as Prediction[]) {
              pushIfValidUpcoming(item);
            }
          }
        } catch {
          serverNetworkFailed = true;
        }
      }

      // 1b. Supplement from client-side ESPN & RapidAPI sports feeds only when online and server returned < 12 matches
      if (!serverNetworkFailed && combinedPredictions.length < 12) {
        try {
          const { fetchRealtimeUpcomingFixtures } = await import('@/services/realtimeFootball');
          const realtimeFixtures = await fetchRealtimeUpcomingFixtures(league);
          if (realtimeFixtures && realtimeFixtures.length > 0) {
            for (const item of realtimeFixtures) {
              pushIfValidUpcoming(item);
            }
          }
        } catch {
          // silent fallback
        }
      }

      // Merge with persistent prediction registry to lock values across refreshes (excluding any played matches)
      const preserved = mergeAndPreservePredictions(combinedPredictions);

      let sourceList = preserved.length > 0 ? preserved : combinedPredictions;
      if (sourceList.length === 0) {
        const savedFallback = getSavedPredictionsList().filter(
          (p) =>
            (p.is_realtime || String(p.id).startsWith('espn-real-') || String(p.id).startsWith('real-match-')) &&
            !isPlayedOrPastMatch(p) &&
            (!league || league === 'All' || matchesLeagueFilter(p.league, league))
        );
        sourceList = savedFallback;
      }

      // Final deduplication, strict played-match exclusion & Date Priority sorting (earliest upcoming first)
      const cleanList = sortMatchesByDatePriority(
        sanitizeAndDeduplicatePredictions(sourceList)
      );

      const resultPayload = {
        allPredictions: cleanList,
        total: cleanList.length,
        isRealTime: true,
      };

      if (cleanList.length > 0) {
        INITIAL_PAYLOAD_CACHE.set(leagueKey, {
          payload: resultPayload,
          updatedAt: Date.now(),
        });
      }
      if ((!league || league === 'All') && cleanList.length > 0 && typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            REAL_UPCOMING_STORAGE_KEY,
            JSON.stringify({ timestamp: Date.now(), fixtures: cleanList.slice(0, 48) })
          );
        } catch {
          // ignore storage quota errors
        }
      }

      return resultPayload;
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAdminSync = () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    };
    const onRecoverOnline = () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    };
    window.addEventListener(ADMIN_SYNC_EVENT, onAdminSync);
    window.addEventListener('storage', onAdminSync);
    window.addEventListener('online', onRecoverOnline);
    window.addEventListener('predictpro:match-data-revalidated', onRecoverOnline);
    return () => {
      window.removeEventListener(ADMIN_SYNC_EVENT, onAdminSync);
      window.removeEventListener('storage', onAdminSync);
      window.removeEventListener('online', onRecoverOnline);
      window.removeEventListener('predictpro:match-data-revalidated', onRecoverOnline);
    };
  }, [queryClient]);

  // All predictions are 100% free and unlocked across the entire platform, enriched with Admin Editorial Overrides & MOTD pin
  const gatedAll = useMemo(() => {
    const rawAll = query.data?.allPredictions ?? [];
    const enriched = rawAll.map((rawItem) => enrichPredictionAliases(rawItem));
    return applyAdminEditorialOverridesToPredictions(enriched);
  }, [query.data?.allPredictions]);

  const gatedPage = useMemo(() => {
    const start = Math.max(0, (page - 1) * effectivePageSize);
    return gatedAll.slice(start, start + effectivePageSize);
  }, [gatedAll, page, effectivePageSize]);

  const total = gatedAll.length;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));

  const gatedData = useMemo<PredictionsDataHybrid>(() => {
    const hybrid = [...gatedAll] as PredictionsDataHybrid;
    Object.assign(hybrid, {
      predictions: gatedPage,
      allPredictions: gatedAll,
      total,
      isRealTime: true,
    });
    return hybrid;
  }, [gatedPage, gatedAll, total]);

  return {
    ...query,
    data: gatedData,
    loading: query.isLoading,
    generatePrediction,
    predictions: gatedPage,
    allPredictions: gatedAll,
    totalPages,
    pageSize: effectivePageSize,
    isRealTime: true,
  };
};
