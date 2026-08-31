import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchRealtimeLiveMatches, 
  fetchRealtimeUpcomingFixtures, 
  fetchRealtimeStandingsTable,
  LEAGUES_LIST, 
  getCustomApiKey,
  LeagueDefinition,
  isHostInCooldown,
  setHostCooldown
} from '@/services/realtimeFootball';
import {
  getSportmonksApiKey,
  fetchSportmonksLiveScores,
  fetchSportmonksPredictions,
  fetchSportmonksSeasonStandings,
  SPORTMONKS_LEAGUE_CONFIGS
} from '@/services/sportmonksFootball';
import { fetchSportscorePredictions } from '@/services/sportscoreFootball';
import { 
  mergeAndPreservePredictions, 
  getSavedPredictionsList 
} from '@/services/predictionStorage';
import type { NormalizedMatch } from '@/lib/matchNormalizer';
import type { Prediction } from '@/types/prediction';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { FALLBACK_STANDINGS, CURRENT_SEASON_STANDINGS, StandingRow } from '@/data/standingsData';
import { callEdgeFn } from '@/lib/callEdgeFunction';

/**
 * Standardized Football API Error with status codes and debugging metadata
 */
export class FootballApiError extends Error {
  public statusCode?: number;
  public provider?: string;
  public endpoint?: string;
  public isAuthError: boolean;
  public isServiceUnavailable: boolean;
  public timestamp: string;

  constructor(message: string, options?: { statusCode?: number; provider?: string; endpoint?: string }) {
    super(message);
    this.name = 'FootballApiError';
    this.statusCode = options?.statusCode;
    this.provider = options?.provider;
    this.endpoint = options?.endpoint;
    this.isAuthError = options?.statusCode === 401 || options?.statusCode === 403;
    this.isServiceUnavailable = true;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Helper to inspect fetch response, catch 401/403 status codes, and log them explicitly for debugging.
 */
export async function validateFootballApiResponse(res: Response, endpoint: string, provider: string): Promise<boolean> {
  try {
    const urlObj = new URL(endpoint);
    if (res.status === 429 || res.status === 403 || res.status === 401) {
      setHostCooldown(urlObj.hostname, 300_000); // 5 min cooldown for exhausted/invalid keys
    }
  } catch {}

  if (res.status === 401 || res.status === 403) {
    const errorType = res.status === 401 
      ? '401 Unauthorized (Invalid / Missing API Key)' 
      : '403 Forbidden (Access Denied / Quota Exceeded)';

    console.warn(
      `[useFootballData Debug] HTTP ${errorType} received from "${provider}" at endpoint "${endpoint}". Falling back to alternate live sports data stream.`,
      {
        status: res.status,
        statusText: res.statusText,
        provider,
        endpoint,
        timestamp: new Date().toISOString(),
        guidance: 'Verify that your API keys (e.g. VITE_API_FOOTBALL_KEY, VITE_RAPIDAPI_KEY, VITE_SPORTMONKS_API_KEY) are active, valid, and have permissions for this endpoint.'
      }
    );

    return false;
  }

  if (res.status === 429) {
    return false;
  }

  if (!res.ok) {
    console.warn(`[useFootballData Warning] ${provider} returned HTTP ${res.status} for endpoint "${endpoint}".`);
    return false;
  }

  return true;
}

export interface SportmonksDiagnostic {
  isConfigured: boolean;
  hasEnvKey: boolean;
  keyLength: number;
  source: 'env' | 'localStorage' | 'none';
  status: 'valid' | 'missing' | 'empty';
  message: string;
  checkedAt: string;
}

/**
 * Diagnostic check to verify that the required environment variable
 * 'VITE_SPORTMONKS_API_KEY' is properly loaded and defined before attempting fetch requests.
 */
export function checkSportmonksEnvDiagnostic(): SportmonksDiagnostic {
  const envKey = (import.meta as { env?: Record<string, string> }).env?.VITE_SPORTMONKS_API_KEY;
  const legacyEnvToken = (import.meta as { env?: Record<string, string> }).env?.SPORTMONKS_API_TOKEN;
  
  let localStoredKey: string | null = null;
  try {
    if (typeof window !== 'undefined') {
      localStoredKey = localStorage.getItem('predictpro_sportmonks_key');
    }
  } catch {
    // Ignore storage access error
  }

  const timestamp = new Date().toISOString();

  // 1. Primary check: VITE_SPORTMONKS_API_KEY from environment
  if (envKey !== undefined) {
    if (typeof envKey === 'string' && envKey.trim().length > 0) {
      const sanitized = envKey.trim();
      return {
        isConfigured: true,
        hasEnvKey: true,
        keyLength: sanitized.length,
        source: 'env',
        status: 'valid',
        message: `[Diagnostic: PASS] VITE_SPORTMONKS_API_KEY is properly loaded and defined (length: ${sanitized.length}).`,
        checkedAt: timestamp,
      };
    } else {
      console.warn('[Sportmonks Diagnostic: WARN] VITE_SPORTMONKS_API_KEY is defined in environment but is empty.');
      return {
        isConfigured: false,
        hasEnvKey: true,
        keyLength: 0,
        source: 'none',
        status: 'empty',
        message: '[Diagnostic: EMPTY] VITE_SPORTMONKS_API_KEY is present in environment but contains an empty string.',
        checkedAt: timestamp,
      };
    }
  }

  // 2. Secondary fallback token sources
  if (legacyEnvToken && legacyEnvToken.trim().length > 0) {
    return {
      isConfigured: true,
      hasEnvKey: false,
      keyLength: legacyEnvToken.trim().length,
      source: 'env',
      status: 'valid',
      message: '[Diagnostic: PASS] SPORTMONKS_API_TOKEN fallback is loaded and defined.',
      checkedAt: timestamp,
    };
  }

  if (localStoredKey && localStoredKey.trim().length > 0) {
    return {
      isConfigured: true,
      hasEnvKey: false,
      keyLength: localStoredKey.trim().length,
      source: 'localStorage',
      status: 'valid',
      message: '[Diagnostic: PASS] Sportmonks key loaded from client localStorage.',
      checkedAt: timestamp,
    };
  }

  // 3. Neither environment variable nor fallback is defined
  return {
    isConfigured: false,
    hasEnvKey: false,
    keyLength: 0,
    source: 'none',
    status: 'missing',
    message: '[Diagnostic: NOT CONFIGURED] VITE_SPORTMONKS_API_KEY is not defined in import.meta.env. Utilizing unified live sports feeds.',
    checkedAt: timestamp,
  };
}

// Query Keys for React Query Caching
export const footballQueryKeys = {
  all: ['football'] as const,
  leagues: (country?: string) => ['football', 'leagues', country || 'all'] as const,
  liveFixtures: (leagueId?: number | string) => ['football', 'fixtures', 'live', leagueId || 'all'] as const,
  upcomingFixtures: (league?: string, daysAhead?: number) => ['football', 'fixtures', 'upcoming', league || 'all', daysAhead || 7] as const,
  standings: (leagueId: number | string, season?: number) => ['football', 'standings', leagueId, season || new Date().getFullYear()] as const,
  fixtureDetails: (fixtureId: string | number) => ['football', 'fixture', fixtureId] as const,
  h2h: (team1: string | number, team2: string | number) => ['football', 'h2h', team1, team2] as const,
};

export interface ApiFootballLeagueItem {
  id: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  countryCode?: string;
  countryFlag?: string;
  season?: number;
}

export interface ApiFootballLiveFixture {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: 'live' | 'halftime' | 'finished' | 'upcoming' | 'postponed';
  minute: number | null;
  league: string;
  league_id?: number;
  match_date: string;
  home_logo: string | null;
  away_logo: string | null;
  prediction?: string;
  confidence?: number;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  venue?: string;
  is_realtime: boolean;
}

// 1. Fetch live fixtures from Sportmonks / API-Football / RapidAPI / Live Scoreboard Feed
async function fetchLiveFixturesQuery(leagueId?: number | string): Promise<ApiFootballLiveFixture[]> {
  // 1. Diagnostic check: verify VITE_SPORTMONKS_API_KEY is properly loaded and defined before attempting fetch
  const sportmonksDiagnostic = checkSportmonksEnvDiagnostic();
  if (sportmonksDiagnostic.isConfigured) {
    try {
      const sportmonksMatches = await fetchSportmonksLiveScores();
      if (sportmonksMatches.length > 0) {
        let filtered = sportmonksMatches;
        if (leagueId && leagueId !== 'all') {
          const found = LEAGUES_LIST.find(l => l.apiFootballId === Number(leagueId) || l.name.toLowerCase() === String(leagueId).toLowerCase());
          if (found) {
            filtered = filtered.filter(m => m.competition.toLowerCase().includes(found.name.toLowerCase()));
          }
        }
        if (filtered.length > 0) {
          return filtered.map((m: NormalizedMatch) => ({
            id: m.id,
            home_team: m.home_team,
            away_team: m.away_team,
            home_score: m.home_score ?? null,
            away_score: m.away_score ?? null,
            status: m.status,
            minute: m.minute ?? null,
            league: m.competition,
            match_date: m.match_date,
            home_logo: m.home_logo ?? null,
            away_logo: m.away_logo ?? null,
            prediction: m.prediction,
            confidence: m.confidence,
            home_odds: m.home_odds,
            draw_odds: m.draw_odds,
            away_odds: m.away_odds,
            is_realtime: true,
          }));
        }
      }
    } catch (e) {
      if (e instanceof FootballApiError) throw e;
      console.warn('[useFootballData] Sportmonks live query fallback:', e);
    }
  }

  // 2. Check API-Football / RapidAPI
  const customKey = getCustomApiKey('api_football') || getCustomApiKey('rapidapi');

  if (customKey) {
    const isRapid = !!getCustomApiKey('rapidapi');
    const rapidHost = isRapid ? 'api-football-v1.p.rapidapi.com' : 'v3.football.api-sports.io';
    if (!isHostInCooldown(rapidHost)) {
      try {
        let url = isRapid 
          ? 'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all'
          : 'https://v3.football.api-sports.io/fixtures?live=all';
        
        if (leagueId && leagueId !== 'all') {
          url = isRapid
            ? `https://api-football-v1.p.rapidapi.com/v3/fixtures?live=${leagueId}`
            : `https://v3.football.api-sports.io/fixtures?live=${leagueId}`;
        }

        const headers: Record<string, string> = isRapid
          ? { 'X-RapidAPI-Key': customKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
          : { 'x-apisports-key': customKey };

        const res = await fetch(url, { headers });
        const valid = await validateFootballApiResponse(res, url, isRapid ? 'API-Football (RapidAPI)' : 'API-Football (Direct)');

        if (valid && res.ok) {
          const json = await res.json();
          if (json.response && Array.isArray(json.response)) {
            return json.response.map((item: any) => {
              const h = item.teams?.home?.name || 'Home Team';
              const a = item.teams?.away?.name || 'Away Team';
              const statusShort = (item.fixture?.status?.short || '').toLowerCase();
              let status: ApiFootballLiveFixture['status'] = 'live';
              if (statusShort === 'ht') status = 'halftime';
              else if (['ft', 'aet', 'pen'].includes(statusShort)) status = 'finished';
              else if (['ns', 'tbd'].includes(statusShort)) status = 'upcoming';
              else if (['pst', 'canc', 'abd'].includes(statusShort)) status = 'postponed';

              return {
                id: `apifootball-${item.fixture?.id || `${h}-${a}`}`,
                home_team: h,
                away_team: a,
                home_score: item.goals?.home ?? null,
                away_score: item.goals?.away ?? null,
                status,
                minute: item.fixture?.status?.elapsed || 45,
                league: item.league?.name || 'Football League',
                league_id: item.league?.id,
                match_date: item.fixture?.date || new Date().toISOString(),
                home_logo: item.teams?.home?.logo || null,
                away_logo: item.teams?.away?.logo || null,
                venue: item.fixture?.venue?.name,
                is_realtime: true,
              };
            });
          }
        }
      } catch (err) {
        if (err instanceof FootballApiError) {
          throw err;
        }
        console.warn('[useFootballData] Direct API-Football query failed, attempting unified live engine:', err);
      }
    }
  }

  // Unified fallback live match pipeline
  try {
    const result = await fetchRealtimeLiveMatches();
    let matches = result.matches || [];

    if (leagueId && leagueId !== 'all') {
      const foundLeague = LEAGUES_LIST.find(l => l.apiFootballId === Number(leagueId) || l.name.toLowerCase() === String(leagueId).toLowerCase());
      if (foundLeague) {
        matches = matches.filter(m => m.competition.toLowerCase().includes(foundLeague.name.toLowerCase()));
      }
    }

    return matches.map((m: NormalizedMatch) => ({
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      home_score: m.home_score ?? null,
      away_score: m.away_score ?? null,
      status: m.status,
      minute: m.minute ?? null,
      league: m.competition,
      match_date: m.match_date,
      home_logo: m.home_logo ?? null,
      away_logo: m.away_logo ?? null,
      prediction: m.prediction,
      confidence: m.confidence,
      home_odds: m.home_odds,
      draw_odds: m.draw_odds,
      away_odds: m.away_odds,
      is_realtime: true,
    }));
  } catch (liveErr) {
    console.debug('[useFootballData] Live matches feed quiet/off-peak, returning empty active list.');
    return [];
  }
}

// 2. Fetch supported leagues list
async function fetchLeaguesQuery(country?: string): Promise<ApiFootballLeagueItem[]> {
  const customKey = getCustomApiKey('api_football') || getCustomApiKey('rapidapi');

  if (customKey) {
    const isRapid = !!getCustomApiKey('rapidapi');
    const rapidHost = isRapid ? 'api-football-v1.p.rapidapi.com' : 'v3.football.api-sports.io';
    if (!isHostInCooldown(rapidHost)) {
      try {
        let url = isRapid 
          ? 'https://api-football-v1.p.rapidapi.com/v3/leagues'
          : 'https://v3.football.api-sports.io/leagues';
        
        if (country) {
          url += `?country=${encodeURIComponent(country)}`;
        } else {
          url += '?current=true';
        }

        const headers: Record<string, string> = isRapid
          ? { 'X-RapidAPI-Key': customKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
          : { 'x-apisports-key': customKey };

        const res = await fetch(url, { headers });
        const valid = await validateFootballApiResponse(res, url, isRapid ? 'API-Football (RapidAPI)' : 'API-Football');

        if (valid && res.ok) {
          const json = await res.json();
          if (json.response && Array.isArray(json.response)) {
            return json.response.slice(0, 30).map((item: any) => ({
              id: item.league?.id,
              name: item.league?.name,
              type: item.league?.type || 'League',
              logo: item.league?.logo,
              country: item.country?.name,
              countryCode: item.country?.code,
              countryFlag: item.country?.flag,
              season: item.seasons?.[0]?.year,
            }));
          }
        }
      } catch (err) {
        if (err instanceof FootballApiError) throw err;
        console.warn('[useFootballData] API-Football leagues query warning:', err);
      }
    }
  }

  // Fallback to preconfigured high-tier leagues
  let list = LEAGUES_LIST;
  if (country) {
    list = list.filter(l => l.country.toLowerCase() === country.toLowerCase());
  }

  return list.map((l: LeagueDefinition) => ({
    id: l.apiFootballId,
    name: l.name,
    type: 'League',
    logo: `https://media.api-sports.io/football/leagues/${l.apiFootballId}.png`,
    country: l.country,
  }));
}

// 3. Fetch upcoming fixtures (SportScore + Sportmonks + Real-time feed)
async function fetchUpcomingFixturesQuery(league?: string, _daysAhead: number = 7): Promise<Prediction[]> {
  let sportscorePredictions: Prediction[] = [];
  try {
    sportscorePredictions = await fetchSportscorePredictions();
  } catch (err) {
    if (err instanceof FootballApiError) throw err;
    console.warn('[useFootballData] SportScore predictions fetch warning:', err);
  }
  
  // Diagnostic check: verify VITE_SPORTMONKS_API_KEY before querying Sportmonks predictions
  const sportmonksDiagnostic = checkSportmonksEnvDiagnostic();
  let sportmonksPredictions: Prediction[] = [];
  if (sportmonksDiagnostic.isConfigured) {
    try {
      sportmonksPredictions = await fetchSportmonksPredictions();
    } catch (err) {
      if (err instanceof FootballApiError) throw err;
      console.warn('[useFootballData] Sportmonks upcoming predictions warning:', err);
    }
  }

  let realtimePredictions: Prediction[] = [];
  try {
    realtimePredictions = await fetchRealtimeUpcomingFixtures(league);
  } catch (err) {
    if (err instanceof FootballApiError) throw err;
    console.warn('[useFootballData] Realtime upcoming fixtures warning:', err);
  }

  // Combine, preserve saved predictions, and deduplicate
  const combined = [...sportscorePredictions, ...sportmonksPredictions, ...realtimePredictions];
  const preserved = mergeAndPreservePredictions(combined);

  if (preserved.length === 0) {
    const savedFallback = getSavedPredictionsList();
    const activeList = savedFallback.length > 0 ? savedFallback : DEFAULT_PREDICTIONS;
    return league && league !== 'All'
      ? activeList.filter(p => p.league.toLowerCase().includes(league.toLowerCase()))
      : activeList;
  }

  if (league && league !== 'All') {
    return preserved.filter(p => p.league.toLowerCase().includes(league.toLowerCase()));
  }

  return preserved;
}

// 4. Fetch standings for a specific league from Live Feeds / Sportmonks / API-Football / Cache
async function fetchStandingsQuery(leagueId: number, season?: number): Promise<{ standings: StandingRow[]; isLive: boolean }> {
  // 1. Check live ESPN Standings Feed (Real-Time table with live pts, gd, logos)
  try {
    const liveTable = await fetchRealtimeStandingsTable(leagueId);
    if (liveTable && liveTable.length > 0) {
      return { standings: liveTable, isLive: true };
    }
  } catch (e) {
    if (e instanceof FootballApiError) throw e;
    console.warn('[useFootballData] Realtime standings table fallback:', e);
  }

  // 2. Diagnostic check: verify VITE_SPORTMONKS_API_KEY before querying Sportmonks Season Standings
  const sportmonksDiagnostic = checkSportmonksEnvDiagnostic();
  if (sportmonksDiagnostic.isConfigured) {
    const sportmonksCfg = SPORTMONKS_LEAGUE_CONFIGS[leagueId];
    if (sportmonksCfg) {
      try {
        const smStandings = await fetchSportmonksSeasonStandings(sportmonksCfg.seasonId);
        if (smStandings.length > 0) {
          return { standings: smStandings, isLive: true };
        }
      } catch (err) {
        if (err instanceof FootballApiError) throw err;
        console.warn('[useFootballData] Sportmonks standings fallback:', err);
      }
    }
  }

  const customKey = getCustomApiKey('api_football') || getCustomApiKey('rapidapi');
  const targetSeason = season || new Date().getFullYear();

  // Try direct API-Football if key is configured
  if (customKey) {
    const isRapid = !!getCustomApiKey('rapidapi');
    const rapidHost = isRapid ? 'api-football-v1.p.rapidapi.com' : 'v3.football.api-sports.io';
    if (!isHostInCooldown(rapidHost)) {
      try {
        const url = isRapid
          ? `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${targetSeason}`
          : `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${targetSeason}`;

        const headers: Record<string, string> = isRapid
          ? { 'X-RapidAPI-Key': customKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
          : { 'x-apisports-key': customKey };

        const res = await fetch(url, { headers });
        const valid = await validateFootballApiResponse(res, url, isRapid ? 'API-Football Standings (RapidAPI)' : 'API-Football Standings');

        if (valid && res.ok) {
          const json = await res.json();
          const leagueObj = json.response?.[0]?.league;
          const rawStandings = leagueObj?.standings?.[0];

          if (Array.isArray(rawStandings) && rawStandings.length > 0) {
            const formatted: StandingRow[] = rawStandings.map((row: any) => ({
              position: row.rank,
              team: row.team?.name || 'Unknown Team',
              logo: row.team?.logo,
              played: row.all?.played ?? 0,
              won: row.all?.win ?? 0,
              drawn: row.all?.draw ?? 0,
              lost: row.all?.lose ?? 0,
              gf: row.all?.goals?.for ?? 0,
              ga: row.all?.goals?.against ?? 0,
              gd: row.goalsDiff ?? 0,
              points: row.points ?? 0,
              form: row.form || '',
            }));

            return { standings: formatted, isLive: true };
          }
        }
      } catch (err) {
        if (err instanceof FootballApiError) throw err;
        console.warn('[useFootballData] API-Football standings fetch warning:', err);
      }
    }
  }

  // Edge function attempt
  try {
    const edgeData = await callEdgeFn('fetch-standings', { leagueId, season: targetSeason }) as {
      standings?: StandingRow[];
      success?: boolean;
      source?: string;
    };
    if (edgeData?.standings && Array.isArray(edgeData.standings) && edgeData.standings.length > 0) {
      // Only the 'live-api' source is genuinely real-time; 'verified-feed' is the
      // edge function's own static fallback and must not be labeled as live.
      return { standings: edgeData.standings, isLive: edgeData.source === 'live-api' };
    }
  } catch {
    // Soft fail to fallback cache
  }

  // Fallback to verified standings cache
  const cached = CURRENT_SEASON_STANDINGS[leagueId] || FALLBACK_STANDINGS[leagueId] || CURRENT_SEASON_STANDINGS[39] || [];
  return { standings: cached, isLive: false };
}

/**
 * Hook to fetch and auto-refresh live football fixtures with React Query caching & error resiliency
 */
export function useLiveFixtures(options?: {
  leagueId?: number | string;
  refetchInterval?: number | false;
  enabled?: boolean;
}) {
  const { leagueId, refetchInterval = 15_000, enabled = true } = options || {};

  return useQuery({
    queryKey: footballQueryKeys.liveFixtures(leagueId),
    queryFn: () => fetchLiveFixturesQuery(leagueId),
    refetchInterval,
    staleTime: 10_000, // 10s fresh cache
    enabled,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Do not endlessly retry on 401/403 Auth errors
      if (error instanceof FootballApiError && error.isAuthError) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch available football leagues with long-term caching
 */
export function useFootballLeagues(options?: {
  country?: string;
  enabled?: boolean;
}) {
  const { country, enabled = true } = options || {};

  return useQuery({
    queryKey: footballQueryKeys.leagues(country),
    queryFn: () => fetchLeaguesQuery(country),
    staleTime: 1000 * 60 * 60 * 6, // 6 hours cache for league definitions
    gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof FootballApiError && error.isAuthError) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch verified upcoming fixtures across leagues
 */
export function useUpcomingFixtures(options?: {
  league?: string;
  daysAhead?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
}) {
  const { league, daysAhead = 7, refetchInterval = 60_000, enabled = true } = options || {};

  return useQuery({
    queryKey: footballQueryKeys.upcomingFixtures(league, daysAhead),
    queryFn: () => fetchUpcomingFixturesQuery(league, daysAhead),
    refetchInterval,
    staleTime: 45_000, // 45s cache
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof FootballApiError && error.isAuthError) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch league standings with API-Football / RapidAPI / Edge integration and caching
 */
export function useStandings(leagueId: number, season?: number) {
  return useQuery({
    queryKey: footballQueryKeys.standings(leagueId, season),
    queryFn: () => fetchStandingsQuery(leagueId, season),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof FootballApiError && error.isAuthError) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Comprehensive master hook for Football Data with robust 401/403 status detection,
 * console debugging logs, and fallback mechanism displaying 'Service Temporarily Unavailable'.
 */
export function useFootballData(options?: {
  league?: string;
  leagueId?: number | string;
  standingsLeagueId?: number;
  livePollInterval?: number | false;
}) {
  const queryClient = useQueryClient();
  const { league, leagueId, standingsLeagueId, livePollInterval = 15_000 } = options || {};

  const liveQuery = useLiveFixtures({ 
    leagueId, 
    refetchInterval: livePollInterval 
  });
  
  const leaguesQuery = useFootballLeagues();
  const upcomingQuery = useUpcomingFixtures({ league });
  const standingsQuery = useStandings(standingsLeagueId || 39);

  // Authentication & Service Availability calculations
  const liveError = liveQuery.error as (FootballApiError | Error | null);
  const upcomingError = upcomingQuery.error as (FootballApiError | Error | null);
  const standingsError = standingsQuery.error as (FootballApiError | Error | null);
  const leaguesError = leaguesQuery.error as (FootballApiError | Error | null);

  const isLiveAuthError = liveError instanceof FootballApiError && liveError.isAuthError;
  const isUpcomingAuthError = upcomingError instanceof FootballApiError && upcomingError.isAuthError;
  const isStandingsAuthError = standingsError instanceof FootballApiError && standingsError.isAuthError;
  const isLeaguesAuthError = leaguesError instanceof FootballApiError && leaguesError.isAuthError;

  const hasAuthError = isLiveAuthError || isUpcomingAuthError || isStandingsAuthError || isLeaguesAuthError;
  const authErrorStatus = (
    (liveError as FootballApiError)?.statusCode ||
    (upcomingError as FootballApiError)?.statusCode ||
    (standingsError as FootballApiError)?.statusCode ||
    (leaguesError as FootballApiError)?.statusCode ||
    (hasAuthError ? 401 : null)
  );

  const isServiceUnavailable = Boolean(
    hasAuthError || 
    liveQuery.isError || 
    (upcomingQuery.isError && (!upcomingQuery.data || upcomingQuery.data.length === 0))
  );

  const serviceUnavailableMessage = hasAuthError
    ? `Service Temporarily Unavailable: Authentication connecting (HTTP ${authErrorStatus || '401/403'}). Reconnecting live sports feed.`
    : 'Service Temporarily Unavailable: Live sports data feeds are temporarily unreachable.';

  const activeLiveCount = (liveQuery.data || []).filter(
    f => f.status === 'live' || f.status === 'halftime'
  ).length;

  const sportmonksDiagnostic = checkSportmonksEnvDiagnostic();

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: footballQueryKeys.liveFixtures() }),
      queryClient.invalidateQueries({ queryKey: footballQueryKeys.upcomingFixtures() }),
      queryClient.invalidateQueries({ queryKey: footballQueryKeys.standings(standingsLeagueId || 39) }),
    ]);
  };

  return {
    // Live Fixtures (returns live query data from active RapidAPI / ESPN / Sportmonks feeds)
    liveFixtures: liveQuery.data || [],
    isLiveLoading: liveQuery.isLoading,
    isLiveFetching: liveQuery.isFetching,
    liveError: liveQuery.error,
    activeLiveCount,
    refetchLive: liveQuery.refetch,

    // Error & Service Availability States
    isError: liveQuery.isError || upcomingQuery.isError,
    error: liveQuery.error || upcomingQuery.error || standingsQuery.error || null,
    errorMessage: liveQuery.error?.message || upcomingQuery.error?.message || null,
    isServiceUnavailable: Boolean(
      (liveQuery.isError && (!liveQuery.data || liveQuery.data.length === 0)) &&
      (upcomingQuery.isError && (!upcomingQuery.data || upcomingQuery.data.length === 0))
    ),
    serviceUnavailableMessage,
    hasAuthError,
    authErrorStatus,

    // Leagues
    leagues: leaguesQuery.data || [],
    isLeaguesLoading: leaguesQuery.isLoading,

    // Standings
    standings: standingsQuery.data?.standings || [],
    isStandingsLive: standingsQuery.data?.isLive ?? false,
    isStandingsLoading: standingsQuery.isLoading,
    refetchStandings: standingsQuery.refetch,

    // Upcoming Fixtures / Predictions
    upcomingFixtures: upcomingQuery.data || [],
    isUpcomingLoading: upcomingQuery.isLoading,
    refetchUpcoming: upcomingQuery.refetch,

    // Diagnostics
    sportmonksDiagnostic,
    isSportmonksConfigured: sportmonksDiagnostic.isConfigured,
    checkSportmonksDiagnostic: checkSportmonksEnvDiagnostic,

    // Global actions
    isLoading: liveQuery.isLoading || upcomingQuery.isLoading,
    refreshAll,
    queryClient,
  };
}

export default useFootballData;
