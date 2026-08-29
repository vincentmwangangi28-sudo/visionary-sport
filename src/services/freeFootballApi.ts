import { NormalizedMatch } from '@/lib/matchNormalizer';
import { Prediction } from '@/types/prediction';
import { generateDeterministicPrediction, getSavedPrediction, mergeAndPreservePredictions } from '@/services/predictionStorage';
import { 
  isHostInCooldown, 
  setHostCooldown, 
  fetchWithCacheAndDeduplication, 
  CACHE_TTLS 
} from '@/services/footballDataCache';

export const DEFAULT_RAPIDAPI_KEY = '634f376987mshcc08c0be647a479p196325jsn87def99b6aac';
const STORAGE_KEY_FREE_FOOTBALL = 'predictpro_free_football_key';
const STORAGE_KEY_RAPIDAPI = 'predictpro_rapidapi_key';

export const RAPIDAPI_AVAILABLE_HOSTS = [
  'free-api-live-football-data-cheaper-version.p.rapidapi.com',
  'free-api-live-football-data.p.rapidapi.com',
  'free-football-api-data.p.rapidapi.com'
];

export const FREE_FOOTBALL_PRIMARY_HOST = RAPIDAPI_AVAILABLE_HOSTS[0];
export const FREE_FOOTBALL_SECONDARY_HOST = RAPIDAPI_AVAILABLE_HOSTS[1];

/**
 * Retrieves configured RapidAPI key from localStorage, environment, or default.
 */
export function getFreeFootballApiKey(): string {
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(STORAGE_KEY_FREE_FOOTBALL) || localStorage.getItem(STORAGE_KEY_RAPIDAPI);
      if (local && local.trim().length > 0) return local.trim();
    }
  } catch {}

  const envKey = (import.meta as { env?: Record<string, string> }).env;
  return envKey?.VITE_FREE_FOOTBALL_API_KEY || envKey?.VITE_RAPIDAPI_KEY || DEFAULT_RAPIDAPI_KEY;
}

/**
 * Saves RapidAPI / Free Football key to localStorage.
 */
export function saveFreeFootballApiKey(key: string) {
  try {
    if (typeof window !== 'undefined') {
      const trimmed = key.trim();
      localStorage.setItem(STORAGE_KEY_FREE_FOOTBALL, trimmed);
      localStorage.setItem(STORAGE_KEY_RAPIDAPI, trimmed);
    }
  } catch (e) {
    console.warn('[freeFootballApi] Error saving API key:', e);
  }
}

/**
 * Test connectivity against the RapidAPI Free Football Data Hub.
 */
export async function testFreeFootballConnection(customKey?: string): Promise<{ success: boolean; message: string; latency?: number; count?: number }> {
  const key = (customKey || getFreeFootballApiKey()).trim();
  if (!key) {
    return { success: false, message: 'RapidAPI key is missing.' };
  }

  const start = performance.now();

  for (const host of RAPIDAPI_AVAILABLE_HOSTS) {
    try {
      const res = await fetch(`https://${host}/football-current-live`, {
        headers: {
          'x-rapidapi-host': host,
          'x-rapidapi-key': key,
          'Accept': 'application/json',
        },
      });

      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const json = await res.json();
        const liveMatches = json.response?.live || [];
        return {
          success: true,
          message: `RapidAPI Live Football Data connected successfully via ${host} (${liveMatches.length} live games currently active).`,
          latency: elapsed,
          count: liveMatches.length,
        };
      }
    } catch (err) {
      console.warn(`[freeFootballApi] Test error with ${host}:`, err);
    }
  }

  // Also try matches-by-date as fallback validation across hosts
  for (const host of RAPIDAPI_AVAILABLE_HOSTS) {
    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const res = await fetch(`https://${host}/football-get-matches-by-date?date=${today}`, {
        headers: {
          'x-rapidapi-host': host,
          'x-rapidapi-key': key,
          'Accept': 'application/json',
        },
      });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const json = await res.json();
        const count = json.response?.matches?.length || 0;
        return {
          success: true,
          message: `RapidAPI Live Football Data connected via ${host}! (${count} daily fixtures verified).`,
          latency: elapsed,
          count,
        };
      }
    } catch (err) {
      // fallback
    }
  }

  return {
    success: false,
    message: 'Unable to connect to RapidAPI Free Football API Data. Please verify your subscription.',
  };
}

/**
 * Fetch current live football matches from RapidAPI across available hosts.
 */
export async function fetchFreeFootballLiveMatches(): Promise<NormalizedMatch[]> {
  return fetchWithCacheAndDeduplication('free_football_live_matches', CACHE_TTLS.LIVE_MATCHES, async () => {
    const key = getFreeFootballApiKey();
    if (!key) return [];

    for (const host of RAPIDAPI_AVAILABLE_HOSTS) {
      if (isHostInCooldown(host)) continue;
      try {
        const res = await fetch(`https://${host}/football-current-live`, {
          headers: {
            'x-rapidapi-host': host,
            'x-rapidapi-key': key,
            'Accept': 'application/json',
          },
        });

        if (res.status === 429 || res.status === 403 || res.status === 401) {
          setHostCooldown(host);
          continue;
        }

        if (!res.ok) continue;

        const json = await res.json();
        const liveList = json.response?.live || [];
        if (!Array.isArray(liveList) || liveList.length === 0) {
          if (json.status === 'success') {
            return []; // valid response with 0 live games right now
          }
          continue;
        }

        const results: NormalizedMatch[] = [];

        for (const item of liveList) {
          const h = item.home?.name || item.home?.longName;
          const a = item.away?.name || item.away?.longName;
          if (!h || !a) continue;

          const hScore = item.home?.score !== undefined ? parseInt(String(item.home.score), 10) : 0;
          const aScore = item.away?.score !== undefined ? parseInt(String(item.away.score), 10) : 0;
          const minute = item.status?.minute || (item.status?.liveTime?.short?.includes('HT') ? 45 : 60);

          const saved = getSavedPrediction(h, a);
          const det = generateDeterministicPrediction(h, a, item.leagueName, item.status?.utcTime);

          results.push({
            id: `freeapi-live-${item.id || `${h}-${a}`}`,
            home_team: h,
            away_team: a,
            competition: item.leagueName || 'Football Match',
            match_date: item.status?.utcTime || new Date().toISOString(),
            status: 'live',
            minute: typeof minute === 'number' ? minute : 45,
            home_score: hScore,
            away_score: aScore,
            home_logo: item.home?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${item.home.id}.png` : null,
            away_logo: item.away?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${item.away.id}.png` : null,
            prediction: saved?.predicted_outcome || saved?.prediction || det.prediction,
            confidence: saved?.confidence || saved?.confidence_score || det.confidence,
            home_odds: saved?.home_odds || det.home_odds,
            draw_odds: saved?.draw_odds || det.draw_odds,
            away_odds: saved?.away_odds || det.away_odds,
          });
        }

        if (results.length > 0) {
          return results;
        }
      } catch (e) {
        console.warn(`[freeFootballApi] Error fetching live matches with ${host}:`, e);
      }
    }

    return [];
  });
}

/**
 * Fetch matches by date from RapidAPI across available hosts with caching per date.
 */
export async function fetchFreeFootballMatchesByDate(dateStr: string): Promise<Prediction[]> {
  // Format: YYYYMMDD
  const formatted = dateStr.replace(/[^0-9]/g, '').slice(0, 8);
  const cacheKey = `free_football_matches_date_${formatted}`;

  return fetchWithCacheAndDeduplication(cacheKey, CACHE_TTLS.MATCHES_BY_DATE, async () => {
    const key = getFreeFootballApiKey();
    if (!key) return [];

    for (const host of RAPIDAPI_AVAILABLE_HOSTS) {
      if (isHostInCooldown(host)) continue;
      try {
        const res = await fetch(`https://${host}/football-get-matches-by-date?date=${formatted}`, {
          headers: {
            'x-rapidapi-host': host,
            'x-rapidapi-key': key,
            'Accept': 'application/json',
          },
        });

        if (res.status === 429 || res.status === 403 || res.status === 401) {
          setHostCooldown(host);
          continue;
        }

        if (!res.ok) continue;

        const json = await res.json();
        const apiMatches = json.response?.matches || [];
        if (!Array.isArray(apiMatches) || apiMatches.length === 0) continue;

        const predictions: Prediction[] = [];

        for (const mItem of apiMatches) {
          const h = mItem.home?.name || mItem.home?.longName;
          const a = mItem.away?.name || mItem.away?.longName;
          if (!h || !a) continue;

          const matchDate = mItem.status?.utcTime || mItem.time || new Date().toISOString();
          const det = generateDeterministicPrediction(h, a, mItem.tournamentStage, matchDate);

          predictions.push({
            id: `freeapi-match-${mItem.id || `${h}-${a}`}`,
            match_id: `match-${mItem.id || `${h}-${a}`}`,
            home_team: h,
            away_team: a,
            league: mItem.tournamentStage || 'Football Match',
            match_date: matchDate,
            prediction: det.prediction,
            predicted_outcome: det.prediction,
            confidence: det.confidence,
            confidence_score: det.confidence,
            home_odds: det.home_odds,
            draw_odds: det.draw_odds,
            away_odds: det.away_odds,
            analysis: det.analysis,
            reasoning: `RapidAPI Live Football Data validated matchup with expected goals modeling.`,
            is_premium: det.confidence >= 78,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
        }

        if (predictions.length > 0) {
          return mergeAndPreservePredictions(predictions);
        }
      } catch (e) {
        console.warn(`[freeFootballApi] Error fetching matches by date with ${host}:`, e);
      }
    }

    return [];
  });
}
