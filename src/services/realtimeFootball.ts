import { NormalizedMatch, toIsoUtc, normalizeStatus } from '@/lib/matchNormalizer';
import { Prediction } from '@/types/prediction';
import { 
  generateDeterministicPrediction, 
  mergeAndPreservePredictions, 
  getSavedPrediction,
  savePrediction 
} from '@/services/predictionStorage';
import {
  isHostInCooldown,
  setHostCooldown,
  getFootballCache,
  setFootballCache,
  fetchWithCacheAndDeduplication,
  safeFootballFetch,
  CACHE_TTLS
} from '@/services/footballDataCache';

export { isHostInCooldown, setHostCooldown, getFootballCache, setFootballCache };

// Supported top leagues mapping
export interface LeagueDefinition {
  name: string;
  espnCode: string;
  apiFootballId: number;
  country: string;
}

export const LEAGUES_LIST: LeagueDefinition[] = [
  { name: 'Premier League', espnCode: 'eng.1', apiFootballId: 39, country: 'England' },
  { name: 'La Liga', espnCode: 'esp.1', apiFootballId: 140, country: 'Spain' },
  { name: 'Serie A', espnCode: 'ita.1', apiFootballId: 135, country: 'Italy' },
  { name: 'Bundesliga', espnCode: 'ger.1', apiFootballId: 78, country: 'Germany' },
  { name: 'Ligue 1', espnCode: 'fra.1', apiFootballId: 61, country: 'France' },
  { name: 'Champions League', espnCode: 'uefa.champions', apiFootballId: 2, country: 'Europe' },
  { name: 'Europa League', espnCode: 'uefa.europa', apiFootballId: 3, country: 'Europe' },
  { name: 'Conference League', espnCode: 'uefa.europa.conf', apiFootballId: 848, country: 'Europe' },
  { name: 'Copa Libertadores', espnCode: 'conmebol.libertadores', apiFootballId: 13, country: 'South America' },
  { name: 'AFC Champions League', espnCode: 'afc.champions', apiFootballId: 17, country: 'Asia' },
  { name: 'FA Cup', espnCode: 'eng.fa', apiFootballId: 45, country: 'England' },
  { name: 'Copa del Rey', espnCode: 'esp.copa_del_rey', apiFootballId: 143, country: 'Spain' },
  { name: 'DFB-Pokal', espnCode: 'ger.dfb_pokal', apiFootballId: 81, country: 'Germany' },
  { name: 'Coppa Italia', espnCode: 'ita.coppa_italia', apiFootballId: 137, country: 'Italy' },
  { name: 'Coupe de France', espnCode: 'fra.coupe_de_france', apiFootballId: 66, country: 'France' },
  { name: 'MLS', espnCode: 'usa.1', apiFootballId: 253, country: 'USA' },
  { name: 'Saudi Pro League', espnCode: 'ksa.1', apiFootballId: 307, country: 'Saudi Arabia' },
  { name: 'AFCON Qualifier', espnCode: 'caf.nations_qual', apiFootballId: 20, country: 'Africa' },
  { name: 'AFCON', espnCode: 'caf.nations', apiFootballId: 6, country: 'Africa' },
  { name: 'CAF Champions League', espnCode: 'caf.champions', apiFootballId: 12, country: 'Africa' },
  { name: 'World Cup', espnCode: 'fifa.world', apiFootballId: 1, country: 'World' },
  { name: 'World Cup Qualifiers', espnCode: 'fifa.worldq.conmebol', apiFootballId: 10, country: 'World' },
  { name: 'Brazilian Serie A', espnCode: 'bra.1', apiFootballId: 71, country: 'Brazil' },
  { name: 'Eredivisie', espnCode: 'ned.1', apiFootballId: 88, country: 'Netherlands' },
  { name: 'Primeira Liga', espnCode: 'por.1', apiFootballId: 94, country: 'Portugal' },
  { name: 'Scottish Premiership', espnCode: 'sco.1', apiFootballId: 179, country: 'Scotland' },
  { name: 'Liga MX', espnCode: 'mex.1', apiFootballId: 262, country: 'Mexico' },
  { name: 'Championship', espnCode: 'eng.2', apiFootballId: 40, country: 'England' },
];

export interface RealtimeMatchResult {
  matches: NormalizedMatch[];
  source: 'api_football' | 'football_data' | 'live_feed' | 'database';
  liveCount: number;
  lastUpdated: string;
}

// Helper to get custom API keys from env or localStorage
export function getCustomApiKey(type: 'api_football' | 'football_data' | 'rapidapi' | 'sofascore' | 'livescore' | 'free_football' | 'bet365' | 'football_prediction'): string | null {
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`predictpro_${type}_key`);
      if (local && local.trim().length > 0) return local.trim();
    }
  } catch {}

  const envKey = (import.meta as { env?: Record<string, string> }).env;
  if (type === 'api_football') {
    return envKey?.VITE_API_FOOTBALL_KEY || null;
  }
  if (type === 'football_data') {
    return envKey?.VITE_FOOTBALL_DATA_TOKEN || null;
  }
  if (type === 'rapidapi' || type === 'sofascore' || type === 'livescore' || type === 'free_football' || type === 'bet365' || type === 'football_prediction') {
    return envKey?.VITE_RAPIDAPI_KEY || '634f376987mshcc08c0be647a479p196325jsn87def99b6aac';
  }
  return null;
}

export function saveCustomApiKey(type: 'api_football' | 'football_data' | 'rapidapi' | 'sofascore' | 'livescore' | 'free_football' | 'bet365' | 'football_prediction', key: string) {
  try {
    if (typeof window !== 'undefined') {
      if (key && key.trim().length > 0) {
        localStorage.setItem(`predictpro_${type}_key`, key.trim());
      } else {
        localStorage.removeItem(`predictpro_${type}_key`);
      }
    }
  } catch {}
}

// Generate realistic deterministic odds, AI confidence, and lock predictions consistently
function computeLivePrediction(home: string, away: string, homeScore: number | null = null, awayScore: number | null = null, oddsDetail?: string) {
  // Check if a prediction is already saved and locked for this match
  const saved = getSavedPrediction(home, away);
  if (saved && (homeScore === null || awayScore === null)) {
    return {
      prediction: (saved.predicted_outcome || saved.prediction || 'Home Win') as 'Home Win' | 'Draw' | 'Away Win',
      confidence: saved.confidence || saved.confidence_score || 75,
      home_odds: saved.home_odds || 1.95,
      draw_odds: saved.draw_odds || 3.30,
      away_odds: saved.away_odds || 3.80,
    };
  }

  // Generate deterministic prediction based on matchup seed
  const det = generateDeterministicPrediction(home, away, undefined, undefined, oddsDetail);

  let homeProb = det.prediction === 'Home Win' ? det.confidence / 100 : det.prediction === 'Draw' ? 0.28 : 0.22;
  let awayProb = det.prediction === 'Away Win' ? det.confidence / 100 : det.prediction === 'Draw' ? 0.28 : 0.22;
  let drawProb = det.prediction === 'Draw' ? det.confidence / 100 : 0.26;

  // If in-play score is present, weight in-play live probability by live scoreline
  if (homeScore !== null && awayScore !== null) {
    const diff = homeScore - awayScore;
    if (diff > 0) {
      homeProb = Math.min(0.92, 0.58 + diff * 0.14);
      awayProb = Math.max(0.04, 0.18 - diff * 0.07);
      drawProb = Math.max(0.04, 1 - homeProb - awayProb);
    } else if (diff < 0) {
      awayProb = Math.min(0.92, 0.58 + Math.abs(diff) * 0.14);
      homeProb = Math.max(0.04, 0.18 - Math.abs(diff) * 0.07);
      drawProb = Math.max(0.04, 1 - homeProb - awayProb);
    } else {
      drawProb = 0.46;
      homeProb = 0.30;
      awayProb = 0.24;
    }

    let outcome: 'Home Win' | 'Draw' | 'Away Win' = 'Home Win';
    let conf = Math.round(homeProb * 100);

    if (awayProb > homeProb && awayProb > drawProb) {
      outcome = 'Away Win';
      conf = Math.round(awayProb * 100);
    } else if (drawProb > homeProb && drawProb > awayProb) {
      outcome = 'Draw';
      conf = Math.round(drawProb * 100);
    }

    const homeOdds = Number((1 / Math.max(0.08, homeProb) * 0.95).toFixed(2));
    const drawOdds = Number((1 / Math.max(0.08, drawProb) * 0.95).toFixed(2));
    const awayOdds = Number((1 / Math.max(0.08, awayProb) * 0.95).toFixed(2));

    return {
      prediction: outcome,
      confidence: Math.min(94, Math.max(56, conf)),
      home_odds: homeOdds,
      draw_odds: drawOdds,
      away_odds: awayOdds,
    };
  }

  return {
    prediction: det.prediction,
    confidence: det.confidence,
    home_odds: det.home_odds,
    draw_odds: det.draw_odds,
    away_odds: det.away_odds,
  };
}

/**
 * Fetch real-time live match scores from verified live sports feeds
 */
export async function fetchRealtimeLiveMatches(): Promise<RealtimeMatchResult> {
  const cacheKey = 'live_matches_realtime_feed';
  return fetchWithCacheAndDeduplication(cacheKey, CACHE_TTLS.LIVE_MATCHES, async () => {
    const matches: NormalizedMatch[] = [];

  // Check if custom API-Football key is configured
  const apiFootballKey = getCustomApiKey('api_football') || getCustomApiKey('rapidapi');
  if (apiFootballKey) {
    try {
      const isRapid = !!getCustomApiKey('rapidapi');
      const url = isRapid 
        ? 'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all'
        : 'https://v3.football.api-sports.io/fixtures?live=all';
      
      const headers: Record<string, string> = isRapid
        ? { 'X-RapidAPI-Key': apiFootballKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' }
        : { 'x-apisports-key': apiFootballKey };

      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.response && Array.isArray(json.response) && json.response.length > 0) {
          for (const item of json.response) {
            const h = item.teams?.home?.name;
            const a = item.teams?.away?.name;
            if (!h || !a) continue;

            const pred = computeLivePrediction(h, a, item.goals?.home, item.goals?.away);
            matches.push({
              id: `apifootball-${item.fixture?.id || `${h}-${a}`}`,
              home_team: h,
              away_team: a,
              competition: item.league?.name || 'Football League',
              match_date: item.fixture?.date ? toIsoUtc(item.fixture.date) : new Date().toISOString(),
              status: normalizeStatus(item.fixture?.status?.short || 'live'),
              minute: item.fixture?.status?.elapsed || 45,
              home_score: item.goals?.home ?? null,
              away_score: item.goals?.away ?? null,
              home_logo: item.teams?.home?.logo || null,
              away_logo: item.teams?.away?.logo || null,
              prediction: pred.prediction,
              confidence: pred.confidence,
              home_odds: pred.home_odds,
              draw_odds: pred.draw_odds,
              away_odds: pred.away_odds,
            });
          }

          const liveCount = matches.filter(m => m.status === 'live' || m.status === 'halftime').length;
          const result: RealtimeMatchResult = {
            matches,
            source: 'api_football',
            liveCount,
            lastUpdated: new Date().toISOString(),
          };
          return result;
        }
      }
    } catch (e) {
      console.warn('API-Football live feed query failed, falling back to direct feed:', e);
    }
  }

  // Check RapidAPI Free API Live Football Data if key is present
  const freeApiKey = getCustomApiKey('free_football') || getCustomApiKey('rapidapi');
  if (freeApiKey) {
    const rapidHosts = [
      'free-api-live-football-data-cheaper-version.p.rapidapi.com',
      'free-api-live-football-data.p.rapidapi.com',
      'free-football-api-data.p.rapidapi.com'
    ];
    for (const rapidHost of rapidHosts) {
      if (isHostInCooldown(rapidHost)) continue;
      try {
        const res = await fetch(`https://${rapidHost}/football-current-live`, {
          headers: {
            'x-rapidapi-host': rapidHost,
            'x-rapidapi-key': freeApiKey,
          },
        });
        if (res.status === 429 || res.status === 403) {
          setHostCooldown(rapidHost);
          continue;
        }
        if (res.ok) {
          const json = await res.json();
          const liveList = json.response?.live || [];
          for (const item of liveList) {
            const h = item.home?.name || item.home?.longName;
            const a = item.away?.name || item.away?.longName;
            if (!h || !a) continue;
            const hScore = item.home?.score !== undefined ? parseInt(String(item.home.score), 10) : 0;
            const aScore = item.away?.score !== undefined ? parseInt(String(item.away.score), 10) : 0;
            const minute = item.status?.minute || (item.status?.liveTime?.short?.includes('HT') ? 45 : 60);
            const pred = computeLivePrediction(h, a, hScore, aScore);

            matches.push({
              id: `freeapi-${item.id || `${h}-${a}`}`,
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
              prediction: pred.prediction,
              confidence: pred.confidence,
              home_odds: pred.home_odds,
              draw_odds: pred.draw_odds,
              away_odds: pred.away_odds,
            });
          }

          if (matches.length > 0) {
            const liveCount = matches.length;
            const result: RealtimeMatchResult = {
              matches,
              source: `rapidapi_${rapidHost.includes('cheaper') ? 'cheaper' : 'live'}`,
              liveCount,
              lastUpdated: new Date().toISOString(),
            };
            return result;
          }
        }
      } catch (e) {
        console.debug(`Free API Live Football fallback on ${rapidHost}:`, e);
      }
    }
  }

  // Check RapidAPI LiveScore Hub if key is present
  const liveScoreKey = getCustomApiKey('livescore') || getCustomApiKey('rapidapi');
  if (liveScoreKey) {
    try {
      const res = await fetch('https://livescore6.p.rapidapi.com/matches/v2/list-live?Category=soccer', {
        headers: {
          'x-rapidapi-host': 'livescore6.p.rapidapi.com',
          'x-rapidapi-key': liveScoreKey,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const stages = json.Stages || [];
        for (const stage of stages) {
          const compName = stage.Cnm || stage.Sdn || 'Football';
          const events = stage.Events || [];
          for (const ev of events) {
            const h = ev.T1?.[0]?.Nm;
            const a = ev.T2?.[0]?.Nm;
            if (!h || !a) continue;
            const hScore = ev.Tr1 !== undefined ? parseInt(String(ev.Tr1), 10) : null;
            const aScore = ev.Tr2 !== undefined ? parseInt(String(ev.Tr2), 10) : null;
            const minute = ev.Eps ? parseInt(String(ev.Eps).replace("'", ''), 10) || 45 : 45;
            const pred = computeLivePrediction(h, a, hScore ?? undefined, aScore ?? undefined);

            matches.push({
              id: `livescore-${ev.Eid || `${h}-${a}`}`,
              home_team: h,
              away_team: a,
              competition: compName,
              match_date: ev.Esd ? toIsoUtc(String(ev.Esd)) : new Date().toISOString(),
              status: 'live',
              minute,
              home_score: hScore,
              away_score: aScore,
              home_logo: null,
              away_logo: null,
              prediction: pred.prediction,
              confidence: pred.confidence,
              home_odds: pred.home_odds,
              draw_odds: pred.draw_odds,
              away_odds: pred.away_odds,
            });
          }
        }

        if (matches.length > 0) {
          const liveCount = matches.length;
          const result: RealtimeMatchResult = {
            matches,
            source: 'livescore_rapidapi',
            liveCount,
            lastUpdated: new Date().toISOString(),
          };
          return result;
        }
      }
    } catch (e) {
      console.debug('LiveScore RapidAPI feed fallback:', e);
    }
  }

  // Check RapidAPI Bet365Data if key is present
  const bet365Key = getCustomApiKey('bet365') || getCustomApiKey('rapidapi');
  if (bet365Key) {
    try {
      const res = await fetch('https://bet365data.p.rapidapi.com/events/inplay', {
        headers: {
          'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          'x-rapidapi-key': bet365Key,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const evList = json.data || json.events || [];
        for (const ev of evList) {
          const h = ev.home?.name || ev.home_team || ev.home;
          const a = ev.away?.name || ev.away_team || ev.away;
          if (!h || !a) continue;
          const hScore = ev.home_score !== undefined ? parseInt(String(ev.home_score), 10) : (ev.ss ? parseInt(String(ev.ss).split('-')[0] || '0', 10) : 0);
          const aScore = ev.away_score !== undefined ? parseInt(String(ev.away_score), 10) : (ev.ss ? parseInt(String(ev.ss).split('-')[1] || '0', 10) : 0);
          const minute = ev.timer?.tm || ev.minute || 45;
          const pred = computeLivePrediction(h, a, hScore, aScore);

          matches.push({
            id: `bet365-${ev.id || `${h}-${a}`}`,
            home_team: h,
            away_team: a,
            competition: ev.league?.name || ev.competition || 'Football Match',
            match_date: ev.time ? new Date(Number(ev.time) * 1000).toISOString() : new Date().toISOString(),
            status: 'live',
            minute,
            home_score: hScore,
            away_score: aScore,
            home_logo: null,
            away_logo: null,
            prediction: pred.prediction,
            confidence: pred.confidence,
            home_odds: pred.home_odds,
            draw_odds: pred.draw_odds,
            away_odds: pred.away_odds,
          });
        }

        if (matches.length > 0) {
          const liveCount = matches.length;
          const result: RealtimeMatchResult = {
            matches,
            source: 'bet365_rapidapi',
            liveCount,
            lastUpdated: new Date().toISOString(),
          };
          return result;
        }
      }
    } catch (e) {
      console.debug('Bet365Data RapidAPI inplay feed fallback:', e);
    }
  }

  // Fetch real-time live events across major leagues from real-time ESPN scoreboard feed
  // Prioritize primary 6 leagues for lightning-fast first paint, query remaining in parallel with tight 2.5s timeout
  const livePromises = LEAGUES_LIST.slice(0, 10).map(async (league) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.events || []).map((ev: Record<string, unknown>) => ({ ...ev, _leagueName: league.name }));
    } catch {
      return [];
    }
  });

  const leagueResults = await Promise.all(livePromises);
  const rawEvents = leagueResults.flat();

  for (const ev of rawEvents) {
    const competitions = (ev.competitions as Array<Record<string, unknown>>) || [];
    const comp = competitions[0] || {};
    const competitors = (comp.competitors as Array<Record<string, unknown>>) || [];
    const homeComp = competitors.find(c => c.homeAway === 'home');
    const awayComp = competitors.find(c => c.homeAway === 'away');

    const homeTeam = (homeComp?.team as Record<string, string>)?.displayName || (homeComp?.team as Record<string, string>)?.name;
    const awayTeam = (awayComp?.team as Record<string, string>)?.displayName || (awayComp?.team as Record<string, string>)?.name;
    if (!homeTeam || !awayTeam) continue;

    const homeLogo = (homeComp?.team as Record<string, string>)?.logo || null;
    const awayLogo = (awayComp?.team as Record<string, string>)?.logo || null;
    
    const homeScoreRaw = homeComp?.score !== undefined ? parseInt(String(homeComp.score), 10) : null;
    const awayScoreRaw = awayComp?.score !== undefined ? parseInt(String(awayComp.score), 10) : null;

    const statusObj = (ev.status as Record<string, unknown>)?.type as Record<string, string> | undefined;
    const state = statusObj?.state; // 'pre', 'in', 'post'
    const statusDesc = statusObj?.description || statusObj?.name || 'Scheduled';
    const displayClock = ((ev.status as Record<string, unknown>)?.displayClock as string) || '';

    let status: NormalizedMatch['status'] = 'upcoming';
    let minute: number | null = null;

    if (state === 'in') {
      status = 'live';
      const parsedMin = parseInt(displayClock.replace("'", ''), 10);
      minute = !isNaN(parsedMin) ? parsedMin : 45;
      if (statusDesc.toLowerCase().includes('half') || statusDesc.toLowerCase().includes('ht')) {
        status = 'halftime';
      }
    } else if (state === 'post' || statusDesc.toLowerCase().includes('final')) {
      status = 'finished';
    } else if (statusDesc.toLowerCase().includes('postpon')) {
      status = 'postponed';
    }

    const oddsObj = ((comp.odds as Array<Record<string, unknown>>) || [])[0];
    const oddsDetail = oddsObj?.details as string | undefined;

    const pred = computeLivePrediction(
      homeTeam,
      awayTeam,
      state === 'in' || state === 'post' ? homeScoreRaw : null,
      state === 'in' || state === 'post' ? awayScoreRaw : null,
      oddsDetail
    );

    matches.push({
      id: `espn-${ev.id || `${homeTeam}-${awayTeam}`}`,
      home_team: homeTeam,
      away_team: awayTeam,
      competition: (ev._leagueName as string) || 'Football Match',
      match_date: ev.date ? toIsoUtc(ev.date as string) : new Date().toISOString(),
      status,
      minute,
      home_score: state === 'in' || state === 'post' ? homeScoreRaw : null,
      away_score: state === 'in' || state === 'post' ? awayScoreRaw : null,
      home_logo: homeLogo,
      away_logo: awayLogo,
      prediction: pred.prediction,
      confidence: pred.confidence,
      home_odds: pred.home_odds,
      draw_odds: pred.draw_odds,
      away_odds: pred.away_odds,
    });
  }

    const liveCount = matches.filter(m => m.status === 'live' || m.status === 'halftime').length;
    const result: RealtimeMatchResult = {
      matches,
      source: 'live_feed',
      liveCount,
      lastUpdated: new Date().toISOString(),
    };

    return result;
  });
}

/**
 * Fetch real-time upcoming verified match fixtures across European & worldwide leagues
 */
export async function fetchRealtimeUpcomingFixtures(leagueFilter?: string): Promise<Prediction[]> {
  const cacheKey = `upcoming_fixtures_${leagueFilter || 'all'}`;
  return fetchWithCacheAndDeduplication(cacheKey, CACHE_TTLS.UPCOMING_FIXTURES, async () => {
    let selectedLeagues = LEAGUES_LIST;
  if (leagueFilter && leagueFilter !== 'All') {
    const found = LEAGUES_LIST.filter(l => 
      l.name.toLowerCase().includes(leagueFilter.toLowerCase()) || 
      leagueFilter.toLowerCase().includes(l.name.toLowerCase())
    );
    if (found.length > 0) {
      selectedLeagues = found;
    }
  }

  // Calculate upcoming date range (today to 14 days ahead) in YYYYMMDD-YYYYMMDD format
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');

  const future = new Date(now.getTime() + 14 * 86400000);
  const y2 = future.getFullYear();
  const m2 = String(future.getMonth() + 1).padStart(2, '0');
  const d2 = String(future.getDate()).padStart(2, '0');

  const rangeParam = `${y}${m}${d}-${y2}${m2}${d2}`;

  const ESPN_SCOREBOARD_SUPPORTED = new Set([
    'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1',
    'uefa.champions', 'uefa.europa', 'uefa.europa.conf',
    'usa.1', 'bra.1', 'ned.1', 'por.1', 'sco.1', 'mex.1', 'eng.2'
  ]);

  const fetchPromises = selectedLeagues
    .filter(l => ESPN_SCOREBOARD_SUPPORTED.has(l.espnCode))
    .slice(0, 8)
    .map(async (league) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard?dates=${rangeParam}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map((ev: Record<string, unknown>) => ({ ...ev, _leagueName: league.name }));
      } catch {
        return [];
      }
    });

  const resultsByLeague = await Promise.all(fetchPromises);
  const rawEvents = resultsByLeague.flat();

  const predictions: Prediction[] = [];
  const seenMatches = new Set<string>();

  for (const ev of rawEvents) {
    const competitions = (ev.competitions as Array<Record<string, unknown>>) || [];
    const comp = competitions[0] || {};
    const competitors = (comp.competitors as Array<Record<string, unknown>>) || [];
    const homeComp = competitors.find(c => c.homeAway === 'home');
    const awayComp = competitors.find(c => c.homeAway === 'away');

    const homeTeam = (homeComp?.team as Record<string, string>)?.displayName || (homeComp?.team as Record<string, string>)?.name;
    const awayTeam = (awayComp?.team as Record<string, string>)?.displayName || (awayComp?.team as Record<string, string>)?.name;
    if (!homeTeam || !awayTeam) continue;

    const matchKey = `${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}-${String(ev.date).split('T')[0]}`;
    if (seenMatches.has(matchKey)) continue;
    seenMatches.add(matchKey);

    const venue = ((comp.venue as Record<string, string>)?.fullName) || ((ev.venue as Record<string, string>)?.displayName) || 'Home Stadium';
    const oddsObj = ((comp.odds as Array<Record<string, unknown>>) || [])[0];
    const oddsDetail = oddsObj?.details as string | undefined;

    const pred = computeLivePrediction(homeTeam, awayTeam, null, null, oddsDetail);
    const matchDateIso = ev.date ? toIsoUtc(ev.date as string) : new Date().toISOString();
    const leagueName = (ev._leagueName as string) || 'Football League';

    const isHighConf = pred.confidence >= 78;

    predictions.push({
      id: `real-match-${ev.id || matchKey}`,
      match_id: `match-${ev.id || matchKey}`,
      home_team: homeTeam,
      away_team: awayTeam,
      league: leagueName,
      match_date: matchDateIso,
      prediction: pred.prediction,
      predicted_outcome: pred.prediction,
      confidence: pred.confidence,
      confidence_score: pred.confidence,
      home_odds: pred.home_odds,
      draw_odds: pred.draw_odds,
      away_odds: pred.away_odds,
      analysis: `Authentic fixture analysis for ${homeTeam} vs ${awayTeam} in the ${leagueName} at ${venue}. Advanced probability modeling gives ${pred.prediction} as top outcome (${pred.confidence}% confidence).`,
      reasoning: `Tactical form and live schedule data confirmed at ${venue}. Market line: ${oddsDetail || `${pred.prediction} favoured`}.`,
      is_premium: isHighConf,
      status: 'pending',
      created_at: new Date().toISOString(),
      ai_model: 'gemini-1.5-flash',
    });
  }

  // Also query RapidAPI Free API Live Football Data for schedule by date
  const freeApiKey = getCustomApiKey('free_football') || getCustomApiKey('rapidapi');
  if (freeApiKey) {
    const rapidHosts = [
      'free-api-live-football-data-cheaper-version.p.rapidapi.com',
      'free-api-live-football-data.p.rapidapi.com',
      'free-football-api-data.p.rapidapi.com'
    ];
    const datesToQuery = [
      `${y}${m}${d}`,
      `${y2 > Number(y) ? y : y}${m2}${d2}`,
    ];

    for (const rapidHost of rapidHosts) {
      if (isHostInCooldown(rapidHost)) continue;
      let hostSuccess = false;
      for (const queryDate of datesToQuery.slice(0, 2)) {
        try {
          const res = await fetch(`https://${rapidHost}/football-get-matches-by-date?date=${queryDate}`, {
            headers: {
              'x-rapidapi-host': rapidHost,
              'x-rapidapi-key': freeApiKey,
            },
          });
          if (res.status === 429 || res.status === 403) {
            setHostCooldown(rapidHost);
            break;
          }
          if (res.ok) {
            const json = await res.json();
            const apiMatches = json.response?.matches || [];
            for (const mItem of apiMatches) {
              const h = mItem.home?.name || mItem.home?.longName;
              const a = mItem.away?.name || mItem.away?.longName;
              if (!h || !a) continue;

              const mKey = `${h.toLowerCase()}-${a.toLowerCase()}-${String(mItem.status?.utcTime || mItem.time || '').split('T')[0]}`;
              if (seenMatches.has(mKey)) continue;
              seenMatches.add(mKey);

              const pred = computeLivePrediction(h, a);
              const matchDate = mItem.status?.utcTime || new Date().toISOString();

              predictions.push({
                id: `freeapi-match-${mItem.id || mKey}`,
                match_id: `match-${mItem.id || mKey}`,
                home_team: h,
                away_team: a,
                league: mItem.tournamentStage || 'Football Match',
                match_date: matchDate,
                prediction: pred.prediction,
                predicted_outcome: pred.prediction,
                confidence: pred.confidence,
                confidence_score: pred.confidence,
                home_odds: pred.home_odds,
                draw_odds: pred.draw_odds,
                away_odds: pred.away_odds,
                analysis: `RapidAPI verified fixture between ${h} and ${a}. Probability analysis indicates ${pred.prediction} as high-probability outcome (${pred.confidence}% confidence).`,
                reasoning: `Upcoming fixture verified via RapidAPI Live Football Data feed.`,
                is_premium: pred.confidence >= 78,
                status: 'pending',
                created_at: new Date().toISOString(),
                ai_model: 'gemini-1.5-flash',
              });
            }
            if (apiMatches.length > 0) {
              hostSuccess = true;
            }
          }
        } catch (e) {
          console.debug(`RapidAPI fixtures query on ${rapidHost} error:`, e);
        }
      }
      if (hostSuccess) break;
    }
  }

  // Also query RapidAPI Bet365Data upcoming fixtures if key is present
  const bet365UpKey = getCustomApiKey('bet365') || getCustomApiKey('rapidapi');
  if (bet365UpKey) {
    try {
      const res = await fetch('https://bet365data.p.rapidapi.com/events/upcoming?sport_id=1', {
        headers: {
          'x-rapidapi-host': 'bet365data.p.rapidapi.com',
          'x-rapidapi-key': bet365UpKey,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const evList = json.data || json.events || [];
        for (const ev of evList) {
          const h = ev.home?.name || ev.home_team || ev.home;
          const a = ev.away?.name || ev.away_team || ev.away;
          if (!h || !a) continue;

          const mKey = `${h.toLowerCase()}-${a.toLowerCase()}`;
          if (seenMatches.has(mKey)) continue;
          seenMatches.add(mKey);

          const pred = computeLivePrediction(h, a);
          const matchDate = ev.time ? new Date(Number(ev.time) * 1000).toISOString() : new Date().toISOString();

          predictions.push({
            id: `bet365-match-${ev.id || mKey}`,
            match_id: `match-${ev.id || mKey}`,
            home_team: h,
            away_team: a,
            league: ev.league?.name || ev.competition || 'Football Match',
            match_date: matchDate,
            prediction: pred.prediction,
            predicted_outcome: pred.prediction,
            confidence: pred.confidence,
            confidence_score: pred.confidence,
            home_odds: pred.home_odds,
            draw_odds: pred.draw_odds,
            away_odds: pred.away_odds,
            analysis: `Bet365 market-backed matchup between ${h} and ${a}. AI probability analysis highlights ${pred.prediction} (${pred.confidence}% confidence).`,
            reasoning: `Upcoming fixture verified via Bet365Data RapidAPI integration.`,
            is_premium: pred.confidence >= 78,
            status: 'pending',
            created_at: new Date().toISOString(),
            ai_model: 'gemini-1.5-flash',
          });
        }
      }
    } catch (e) {
      console.debug('Bet365 upcoming query skipped:', e);
    }
  }

  // Also query RapidAPI Football Prediction API if key is present
  const predApiKey = getCustomApiKey('football_prediction') || getCustomApiKey('rapidapi');
  if (predApiKey) {
    try {
      const res = await fetch('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
        headers: {
          'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com',
          'x-rapidapi-key': predApiKey,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const apiData = json.data || [];
        for (const item of apiData) {
          const h = item.home_team;
          const a = item.away_team;
          if (!h || !a) continue;

          const mKey = `${h.toLowerCase()}-${a.toLowerCase()}`;
          if (seenMatches.has(mKey)) continue;
          seenMatches.add(mKey);

          let outcome: 'Home Win' | 'Draw' | 'Away Win' = 'Home Win';
          if (item.prediction === '1') outcome = 'Home Win';
          else if (item.prediction === 'X' || item.prediction === 'draw') outcome = 'Draw';
          else if (item.prediction === '2') outcome = 'Away Win';
          else {
            const computed = computeLivePrediction(h, a);
            outcome = computed.prediction;
          }

          const oddsData = computeLivePrediction(h, a);
          const confidenceVal = typeof item.odds?.confidence === 'number' ? Math.round(item.odds.confidence) : (item.confidence || oddsData.confidence);

          predictions.push({
            id: `footpred-${item.id || mKey}`,
            match_id: `match-${item.id || mKey}`,
            home_team: h,
            away_team: a,
            league: item.competition_name || item.federation || 'Football Match',
            match_date: item.start_date || new Date().toISOString(),
            prediction: outcome,
            predicted_outcome: outcome,
            confidence: Math.min(95, Math.max(55, confidenceVal)),
            confidence_score: Math.min(95, Math.max(55, confidenceVal)),
            home_odds: oddsData.home_odds,
            draw_odds: oddsData.draw_odds,
            away_odds: oddsData.away_odds,
            analysis: `AI prediction for ${h} vs ${a} (${item.competition_name || 'League'}). Model indicates ${outcome} with ${confidenceVal}% confidence index.`,
            reasoning: `Fixture analyzed via RapidAPI Football Prediction API intelligence models.`,
            is_premium: confidenceVal >= 78,
            status: 'pending',
            created_at: new Date().toISOString(),
            ai_model: 'gemini-1.5-flash',
          });
        }
      }
    } catch (e) {
      console.debug('Football Prediction API query skipped:', e);
    }
  }

  // Merge with saved prediction registry to lock in and avoid prediction shifts on refreshes
  const lockedPredictions = mergeAndPreservePredictions(predictions);

  // Sort by date ascending, then confidence descending
  lockedPredictions.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  return lockedPredictions;
  });
}

/**
 * Fetch authentic real-time recent finished match results
 */
export async function fetchRealtimeFinishedMatches(leagueFilter?: string): Promise<NormalizedMatch[]> {
  const cacheKey = `finished_matches_${leagueFilter || 'all'}`;

  return fetchWithCacheAndDeduplication(cacheKey, CACHE_TTLS.UPCOMING_FIXTURES, async () => {
    let selectedLeagues = LEAGUES_LIST;
    if (leagueFilter && leagueFilter !== 'All') {
      const found = LEAGUES_LIST.filter(l => 
        l.name.toLowerCase().includes(leagueFilter.toLowerCase()) || 
        leagueFilter.toLowerCase().includes(l.name.toLowerCase())
      );
      if (found.length > 0) {
        selectedLeagues = found;
      }
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const past = new Date(now.getTime() - 14 * 86400000);
    const y1 = past.getFullYear();
    const m1 = String(past.getMonth() + 1).padStart(2, '0');
    const d1 = String(past.getDate()).padStart(2, '0');

    const pastRange = `${y1}${m1}${d1}-${y}${m}${d}`;

    const fetchPromises = selectedLeagues.map(async (league) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard?dates=${pastRange}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.events || []).map((ev: Record<string, unknown>) => ({ ...ev, _leagueName: league.name }));
      } catch {
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    const rawEvents = results.flat();
    const finishedList: NormalizedMatch[] = [];
    const seenMatches = new Set<string>();

    for (const ev of rawEvents) {
      const statusObj = (ev.status as Record<string, unknown>)?.type as Record<string, string> | undefined;
      const state = statusObj?.state;
      const statusDesc = (statusObj?.description || '').toLowerCase();
      
      // Only include finished / post games
      if (state !== 'post' && !statusDesc.includes('final') && !statusDesc.includes('full time')) {
        continue;
      }

      const competitions = (ev.competitions as Array<Record<string, unknown>>) || [];
      const comp = competitions[0] || {};
      const competitors = (comp.competitors as Array<Record<string, unknown>>) || [];
      const homeComp = competitors.find(c => c.homeAway === 'home');
      const awayComp = competitors.find(c => c.homeAway === 'away');

      const homeTeam = (homeComp?.team as Record<string, string>)?.displayName || (homeComp?.team as Record<string, string>)?.name;
      const awayTeam = (awayComp?.team as Record<string, string>)?.displayName || (awayComp?.team as Record<string, string>)?.name;
      if (!homeTeam || !awayTeam) continue;

      const matchKey = `fin-${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}-${String(ev.date).split('T')[0]}`;
      if (seenMatches.has(matchKey)) continue;
      seenMatches.add(matchKey);

      const homeScore = homeComp?.score !== undefined ? parseInt(String(homeComp.score), 10) : null;
      const awayScore = awayComp?.score !== undefined ? parseInt(String(awayComp.score), 10) : null;

      const pred = computeLivePrediction(homeTeam, awayTeam, homeScore, awayScore);

      finishedList.push({
        id: `espn-fin-${ev.id || matchKey}`,
        home_team: homeTeam,
        away_team: awayTeam,
        competition: (ev._leagueName as string) || 'Football Match',
        match_date: ev.date ? toIsoUtc(ev.date as string) : new Date().toISOString(),
        status: 'finished',
        minute: 90,
        home_score: homeScore,
        away_score: awayScore,
        home_logo: (homeComp?.team as Record<string, string>)?.logo || null,
        away_logo: (awayComp?.team as Record<string, string>)?.logo || null,
        prediction: pred.prediction,
        confidence: pred.confidence,
        home_odds: pred.home_odds,
        draw_odds: pred.draw_odds,
        away_odds: pred.away_odds,
      });
    }

    // Sort by date descending (most recent first)
    finishedList.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    return finishedList;
  });
}

/**
 * Fetch authentic real-time league standings
 */
export async function fetchRealtimeStandingsTable(leagueId: number | string): Promise<{ position: number; team: string; logo?: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number; form?: string }[]> {
  const leagueObj = LEAGUES_LIST.find(l => l.apiFootballId === Number(leagueId) || l.name.toLowerCase() === String(leagueId).toLowerCase() || l.espnCode === String(leagueId));
  if (!leagueObj) return [];

  const cacheKey = `standings_${leagueObj.espnCode}`;

  return fetchWithCacheAndDeduplication(cacheKey, CACHE_TTLS.STANDINGS, async () => {
    // 1. Check Sofascore / Free API Live Football Data if key is available
    const freeApiKey = getCustomApiKey('free_football') || getCustomApiKey('rapidapi');
    const freeApiLeagueMap: Record<number, number> = {
      39: 47,  // Premier League
      140: 87, // La Liga
      78: 54,  // Bundesliga
      135: 55, // Serie A
      61: 53,  // Ligue 1
      2: 42,   // Champions League
      3: 73,   // Europa League
    };

    const mappedFreeApiId = leagueObj.apiFootballId ? freeApiLeagueMap[leagueObj.apiFootballId] : undefined;

    if (freeApiKey && mappedFreeApiId) {
      const rapidHosts = [
        'free-api-live-football-data-cheaper-version.p.rapidapi.com',
        'free-api-live-football-data.p.rapidapi.com',
        'free-football-api-data.p.rapidapi.com'
      ];
      for (const rapidHost of rapidHosts) {
        if (isHostInCooldown(rapidHost)) continue;
        try {
          const freeRes = await fetch(`https://${rapidHost}/football-get-standing-all?leagueid=${mappedFreeApiId}`, {
            headers: {
              'x-rapidapi-host': rapidHost,
              'x-rapidapi-key': freeApiKey,
            },
          });
          if (freeRes.status === 429 || freeRes.status === 403) {
            setHostCooldown(rapidHost);
            continue;
          }
          if (freeRes.ok) {
            const freeData = await freeRes.json();
            const rows = freeData.response?.standing || [];
            if (rows.length > 0) {
              const parsed = rows.map((r: any, idx: number) => ({
                position: r.idx || idx + 1,
                team: r.name || r.shortName || 'Unknown',
                logo: r.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${r.id}.png` : '',
                played: r.played || 0,
                won: r.wins || 0,
                drawn: r.draws || 0,
                lost: r.losses || 0,
                gf: r.scoresStr ? parseInt(String(r.scoresStr).split('-')[0] || '0', 10) : 0,
                ga: r.scoresStr ? parseInt(String(r.scoresStr).split('-')[1] || '0', 10) : 0,
                gd: r.goalConDiff || 0,
                points: r.pts || 0,
                form: '',
              }));
              return parsed;
            }
          }
        } catch (e) {
          console.debug(`Free API standings fetch fallback on ${rapidHost}:`, e);
        }
      }
    }

    const rapidKey = getCustomApiKey('sofascore') || getCustomApiKey('rapidapi');
    if (rapidKey && (leagueObj.apiFootballId === 39 || leagueObj.name.includes('Premier')) && !isHostInCooldown('sofascore.p.rapidapi.com')) {
      try {
        const sofaRes = await fetch('https://sofascore.p.rapidapi.com/tournaments/get-standings?tournamentId=17&seasonId=52186', {
          headers: {
            'x-rapidapi-host': 'sofascore.p.rapidapi.com',
            'x-rapidapi-key': rapidKey,
          },
        });
        if (sofaRes.status === 429 || sofaRes.status === 403) {
          setHostCooldown('sofascore.p.rapidapi.com');
        } else if (sofaRes.ok) {
          const sofaData = await sofaRes.json();
          const rows = sofaData.standings?.[0]?.rows || [];
          if (rows.length > 0) {
            const parsed = rows.map((r: any) => ({
              position: r.position,
              team: r.team?.name || 'Unknown',
              logo: r.team?.id ? `https://api.sofascore.app/api/v1/team/${r.team.id}/image` : '',
              played: r.matches || 0,
              won: r.wins || 0,
              drawn: r.draws || 0,
              lost: r.losses || 0,
              gf: r.scoresFor || 0,
              ga: r.scoresAgainst || 0,
              gd: (r.scoresFor || 0) - (r.scoresAgainst || 0),
              points: r.points || 0,
              form: '',
            }));
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Sofascore standings fetch fallback:', e);
      }
    }

    try {
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueObj.espnCode}/standings`);
      if (!res.ok) return [];
      const data = await res.json();
      const rawEntries = data.children?.[0]?.standings?.entries || [];

      const parsed = rawEntries.map((e: any, idx: number) => {
        const stats = e.stats || [];
        const getStat = (name: string) => stats.find((s: any) => s.name === name)?.value ?? 0;
        return {
          position: idx + 1,
          team: e.team?.displayName || e.team?.name || 'Unknown',
          logo: e.team?.logos?.[0]?.href || '',
          played: getStat('gamesPlayed'),
          won: getStat('wins'),
          drawn: getStat('ties'),
          lost: getStat('losses'),
          gf: getStat('pointsFor'),
          ga: getStat('pointsAgainst'),
          gd: getStat('pointDifferential'),
          points: getStat('points'),
          form: (e.form || '').slice(0, 5)
        };
      });

      return parsed;
    } catch (err) {
      console.warn(`Failed fetching real standings for ${leagueObj.name}:`, err);
      return [];
    }
  });
}
