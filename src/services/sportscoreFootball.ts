import { NormalizedMatch, toIsoUtc } from '@/lib/matchNormalizer';
import { Prediction } from '@/types/prediction';
import { 
  generateDeterministicPrediction, 
  mergeAndPreservePredictions,
  getSavedPrediction 
} from '@/services/predictionStorage';

const SPORTSCORE_STORAGE_KEY = 'predictpro_sportscore_key';
const DEFAULT_SPORTSCORE_KEY = '634f376987mshcc08c0be647a479p196325jsn87def99b6aac';

export function getSportscoreApiKey(): string {
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(SPORTSCORE_STORAGE_KEY);
      if (local && local.trim().length > 0) return local.trim();
    }
  } catch {}

  const envKey = (import.meta as { env?: Record<string, string> }).env;
  return envKey?.VITE_SPORTSCORE_KEY || envKey?.VITE_RAPIDAPI_KEY || DEFAULT_SPORTSCORE_KEY;
}

export function saveSportscoreApiKey(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (key && key.trim().length > 0) {
        localStorage.setItem(SPORTSCORE_STORAGE_KEY, key.trim());
      } else {
        localStorage.removeItem(SPORTSCORE_STORAGE_KEY);
      }
    }
  } catch {}
}

export const POPULAR_SPORTSCORE_TEAM_SLUGS = [
  'arsenal',
  'manchester-city',
  'liverpool',
  'chelsea',
  'manchester-united',
  'tottenham-hotspur',
  'aston-villa',
  'newcastle-united',
  'real-madrid',
  'barcelona',
  'bayern-munchen',
  'paris-saint-germain',
  'inter',
  'juventus'
];

export interface SportscoreRawMatch {
  home: string;
  away: string;
  home_logo?: string;
  away_logo?: string;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  status_text?: string;
  time: string;
  competition: string;
  competition_logo?: string;
  url?: string;
}

export interface SportscoreTeamResponse {
  sport: string;
  team: {
    name: string;
    logo: string;
    slug: string;
    url: string;
  };
  count: number;
  matches: SportscoreRawMatch[];
  updated: string;
}

/**
 * Fetch matches for a specific team slug from SportScore6 RapidAPI
 */
export async function fetchSportscoreTeamMatches(slug: string): Promise<SportscoreRawMatch[]> {
  const apiKey = getSportscoreApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://sportscore6.p.rapidapi.com/api/widget/team/?slug=${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'sportscore6.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      console.warn(`Sportscore6 returned status ${res.status} for team slug ${slug}`);
      return [];
    }

    const data: SportscoreTeamResponse = await res.json();
    return Array.isArray(data.matches) ? data.matches : [];
  } catch (err) {
    console.warn(`Sportscore6 error fetching ${slug}:`, err);
    return [];
  }
}

/**
 * Fetch fixtures across multiple top clubs and normalize them
 */
export async function fetchAllSportscoreFixtures(teamSlugs = ['arsenal', 'manchester-city', 'liverpool', 'chelsea', 'manchester-united']): Promise<NormalizedMatch[]> {
  const allMatches: SportscoreRawMatch[] = [];
  const seenMatches = new Set<string>();

  try {
    const promises = teamSlugs.map(slug => fetchSportscoreTeamMatches(slug));
    const results = await Promise.allSettled(promises);

    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const m of res.value) {
          const matchKey = `${m.home.toLowerCase()}_vs_${m.away.toLowerCase()}_${m.time ? m.time.split('T')[0] : ''}`;
          if (!seenMatches.has(matchKey)) {
            seenMatches.add(matchKey);
            allMatches.push(m);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Sportscore multiple team fetch error:', err);
  }

  return allMatches.map((m, idx) => {
    let status: NormalizedMatch['status'] = 'upcoming';
    if (m.status === 'inplay' || m.status === 'live') {
      status = 'live';
    } else if (m.status === 'finished' || m.status === 'ended') {
      status = 'finished';
    }

    const saved = getSavedPrediction(m.home, m.away);
    const det = generateDeterministicPrediction(m.home, m.away, m.competition, m.time);
    const outcome = saved?.predicted_outcome || saved?.prediction || det.prediction;
    const conf = saved?.confidence || saved?.confidence_score || det.confidence;

    return {
      id: `sportscore-${idx}-${m.home.toLowerCase().replace(/\s+/g, '-')}-${m.away.toLowerCase().replace(/\s+/g, '-')}`,
      home_team: m.home,
      away_team: m.away,
      competition: m.competition || 'Premier League',
      match_date: m.time ? toIsoUtc(m.time) : new Date().toISOString(),
      status,
      minute: status === 'live' ? 55 : null,
      home_score: m.home_score ?? null,
      away_score: m.away_score ?? null,
      home_logo: m.home_logo || null,
      away_logo: m.away_logo || null,
      prediction: outcome,
      confidence: conf,
      home_odds: saved?.home_odds || det.home_odds,
      draw_odds: saved?.draw_odds || det.draw_odds,
      away_odds: saved?.away_odds || det.away_odds,
    };
  });
}

/**
 * Fetch SportScore fixtures as AI Predictions
 */
export async function fetchSportscorePredictions(): Promise<Prediction[]> {
  const matches = await fetchAllSportscoreFixtures();

  const predictions: Prediction[] = matches.map((m) => {
    const det = generateDeterministicPrediction(m.home_team, m.away_team, m.competition, m.match_date);

    return {
      id: `sportscore-pred-${m.id}`,
      match_id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      league: m.competition,
      match_date: m.match_date,
      prediction: det.prediction,
      predicted_outcome: det.prediction,
      confidence: det.confidence,
      confidence_score: det.confidence,
      home_odds: det.home_odds,
      draw_odds: det.draw_odds,
      away_odds: det.away_odds,
      analysis: det.analysis,
      reasoning: det.reasoning,
      is_premium: det.confidence >= 78,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  });

  return mergeAndPreservePredictions(predictions);
}
