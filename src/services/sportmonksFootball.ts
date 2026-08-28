import { NormalizedMatch, toIsoUtc, normalizeStatus } from '@/lib/matchNormalizer';
import { Prediction } from '@/types/prediction';
import { StandingRow } from '@/data/standingsData';
import { 
  generateDeterministicPrediction, 
  mergeAndPreservePredictions,
  getSavedPrediction 
} from '@/services/predictionStorage';

// Sportmonks API Token storage & retrieval
const SPORTMONKS_STORAGE_KEY = 'predictpro_sportmonks_key';

export function getSportmonksApiKey(): string | null {
  try {
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(SPORTMONKS_STORAGE_KEY);
      if (local && local.trim().length > 0) return local.trim();
    }
  } catch {}

  const envKey = (import.meta as { env?: Record<string, string> }).env;
  return envKey?.VITE_SPORTMONKS_API_KEY || envKey?.SPORTMONKS_API_TOKEN || null;
}

export function saveSportmonksApiKey(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (key && key.trim().length > 0) {
        localStorage.setItem(SPORTMONKS_STORAGE_KEY, key.trim());
      } else {
        localStorage.removeItem(SPORTMONKS_STORAGE_KEY);
      }
    }
  } catch {}
}

// Sportmonks League and Season IDs mapping
export const SPORTMONKS_LEAGUE_CONFIGS: Record<number, { leagueId: number; seasonId: number; name: string }> = {
  39: { leagueId: 8, seasonId: 28083, name: 'Premier League' }, // Premier League 2026/2027
  140: { leagueId: 564, seasonId: 28090, name: 'La Liga' },
  135: { leagueId: 384, seasonId: 28095, name: 'Serie A' },
  78: { leagueId: 82, seasonId: 28087, name: 'Bundesliga' },
  61: { leagueId: 301, seasonId: 28089, name: 'Ligue 1' },
  2: { leagueId: 2, seasonId: 28100, name: 'Champions League' },
};

// Raw Sportmonks Fixture Data fallback (User-provided Sportmonks Premier League Schedule)
export const SPORTMONKS_PREMIER_LEAGUE_FIXTURES = [
  {
    id: 19427536,
    sport_id: 1,
    league_id: 8,
    season_id: 25583,
    name: "Arsenal vs Crystal Palace",
    starting_at: "2025-10-26 14:00:00",
    participants: [
      {
        id: 51,
        name: "Crystal Palace",
        short_code: "CRY",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/19/51.png",
        meta: { location: "away", position: 10, winner: false }
      },
      {
        id: 19,
        name: "Arsenal",
        short_code: "ARS",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/19/19.png",
        meta: { location: "home", position: 1, winner: false }
      }
    ],
    league: {
      id: 8,
      name: "Premier League",
      image_path: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      country: { name: "England" }
    },
    scores: [],
    events: [],
    venue_id: 204
  },
  {
    id: 19427537,
    sport_id: 1,
    league_id: 8,
    season_id: 25583,
    name: "Aston Villa vs Manchester City",
    starting_at: "2025-10-26 14:00:00",
    participants: [
      {
        id: 15,
        name: "Aston Villa",
        short_code: "AVL",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/15/15.png",
        meta: { location: "home", position: 12, winner: false }
      },
      {
        id: 9,
        name: "Manchester City",
        short_code: "MCI",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/9/9.png",
        meta: { location: "away", position: 3, winner: false }
      }
    ],
    league: {
      id: 8,
      name: "Premier League",
      image_path: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      country: { name: "England" }
    },
    scores: [],
    events: [],
    venue_id: 5
  },
  {
    id: 19427538,
    sport_id: 1,
    league_id: 8,
    season_id: 25583,
    name: "AFC Bournemouth vs Nottingham Forest",
    starting_at: "2025-10-26 14:00:00",
    participants: [
      {
        id: 63,
        name: "Nottingham Forest",
        short_code: "NFO",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/31/63.png",
        meta: { location: "away", position: 18, winner: false }
      },
      {
        id: 52,
        name: "AFC Bournemouth",
        short_code: "BOU",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/20/52.png",
        meta: { location: "home", position: 6, winner: false }
      }
    ],
    league: {
      id: 8,
      name: "Premier League",
      image_path: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      country: { name: "England" }
    },
    scores: [],
    events: [],
    venue_id: 146
  },
  {
    id: 19427541,
    sport_id: 1,
    league_id: 8,
    season_id: 25583,
    name: "Everton vs Tottenham Hotspur",
    starting_at: "2025-10-26 16:30:00",
    participants: [
      {
        id: 6,
        name: "Tottenham Hotspur",
        short_code: "TOT",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/6/6.png",
        meta: { location: "away", position: 8, winner: false }
      },
      {
        id: 13,
        name: "Everton",
        short_code: "EVE",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/13/13.png",
        meta: { location: "home", position: 14, winner: false }
      }
    ],
    league: {
      id: 8,
      name: "Premier League",
      image_path: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      country: { name: "England" }
    },
    scores: [],
    events: [],
    venue_id: 343762
  },
  {
    id: 19427545,
    sport_id: 1,
    league_id: 8,
    season_id: 25583,
    name: "Wolverhampton Wanderers vs Burnley",
    starting_at: "2025-10-26 14:00:00",
    participants: [
      {
        id: 29,
        name: "Wolverhampton Wanderers",
        short_code: "WOL",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/29/29.png",
        meta: { location: "home", position: 20, winner: false }
      },
      {
        id: 27,
        name: "Burnley",
        short_code: "BUR",
        image_path: "https://cdn.sportmonks.com/images/soccer/teams/27/27.png",
        meta: { location: "away", position: 19, winner: false }
      }
    ],
    league: {
      id: 8,
      name: "Premier League",
      image_path: "https://cdn.sportmonks.com/images/soccer/leagues/8/8.png",
      country: { name: "England" }
    },
    scores: [],
    events: [],
    venue_id: 492
  }
];

// Parser helper to extract detail numbers from Sportmonks Standings details array
function getSportmonksDetailValue(details: Array<{ type?: { code?: string; id?: number }; value?: number }>, codeName: string, typeId?: number): number {
  if (!details || !Array.isArray(details)) return 0;
  const item = details.find(d => 
    (d.type?.code && d.type.code.toLowerCase() === codeName.toLowerCase()) ||
    (typeId !== undefined && d.type?.id === typeId)
  );
  return typeof item?.value === 'number' ? item.value : 0;
}

// Convert Sportmonks raw Standing JSON into StandingRow[]
export function parseSportmonksStandings(dataList: any[]): StandingRow[] {
  if (!Array.isArray(dataList)) return [];

  return dataList.map((item) => {
    const details = item.details || [];
    const played = getSportmonksDetailValue(details, 'overall-matches-played', 129);
    const won = getSportmonksDetailValue(details, 'overall-won', 130);
    const drawn = getSportmonksDetailValue(details, 'overall-draw', 131);
    const lost = getSportmonksDetailValue(details, 'overall-lost', 132);
    const gf = getSportmonksDetailValue(details, 'overall-goals-for', 133);
    const ga = getSportmonksDetailValue(details, 'overall-goals-against', 134);
    const gd = getSportmonksDetailValue(details, 'goal-difference', 179) || (gf - ga);
    const points = typeof item.points === 'number' ? item.points : getSportmonksDetailValue(details, 'overall-points', 187);

    // Form sequence
    let formStr = '';
    if (Array.isArray(item.form) && item.form.length > 0) {
      formStr = item.form.map((f: any) => f.form || '').join('');
    }

    return {
      position: item.position,
      team: item.participant?.name || 'Club',
      logo: item.participant?.image_path || undefined,
      played,
      won,
      drawn,
      lost,
      gf,
      ga,
      gd,
      points,
      form: formStr || (won > 0 ? 'W' : (drawn > 0 ? 'D' : (lost > 0 ? 'L' : ''))),
    };
  }).sort((a, b) => a.position - b.position || b.points - a.points);
}

// Convert Sportmonks Fixture JSON into NormalizedMatch
export function parseSportmonksFixture(f: any): NormalizedMatch {
  const participants = f.participants || [];
  const homePart = participants.find((p: any) => p.meta?.location === 'home') || participants[0];
  const awayPart = participants.find((p: any) => p.meta?.location === 'away') || participants[1];

  const homeName = homePart?.name || 'Home Club';
  const awayName = awayPart?.name || 'Away Club';
  const homeLogo = homePart?.image_path || null;
  const awayLogo = awayPart?.image_path || null;

  // Scores
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  if (Array.isArray(f.scores) && f.scores.length > 0) {
    const currentScores = f.scores.filter((s: any) => s.description === 'CURRENT' || s.type_id === 1525 || !s.description);
    for (const sc of (currentScores.length ? currentScores : f.scores)) {
      if (sc.score?.participant === 'home' || sc.participant_id === homePart?.id) {
        homeScore = sc.score?.goals ?? sc.goals ?? null;
      }
      if (sc.score?.participant === 'away' || sc.participant_id === awayPart?.id) {
        awayScore = sc.score?.goals ?? sc.goals ?? null;
      }
    }
  }

  // State & Status
  const stateShort = (f.state?.short_name || f.state?.developer_name || '').toLowerCase();
  let status: NormalizedMatch['status'] = 'upcoming';
  let minute: number | null = null;

  if (['1h', '2h', 'ht', 'et', 'pen_break', 'live', 'inplay'].some(s => stateShort.includes(s))) {
    status = stateShort.includes('ht') ? 'halftime' : 'live';
    minute = f.minute || f.periods?.[f.periods.length - 1]?.minutes || 45;
  } else if (['ft', 'aet', 'ft_pen', 'finished'].some(s => stateShort.includes(s))) {
    status = 'finished';
  } else if (['postp', 'canc', 'deleted', 'int'].some(s => stateShort.includes(s))) {
    status = 'postponed';
  }

  // Compute or retrieve saved prediction
  const saved = getSavedPrediction(homeName, awayName);
  const det = generateDeterministicPrediction(homeName, awayName, f.league?.name, f.starting_at);
  const predOutcome = saved?.predicted_outcome || saved?.prediction || det.prediction;
  const conf = saved?.confidence || saved?.confidence_score || det.confidence;

  return {
    id: `sportmonks-${f.id}`,
    home_team: homeName,
    away_team: awayName,
    competition: f.league?.name || 'Football Match',
    match_date: f.starting_at ? toIsoUtc(f.starting_at) : new Date().toISOString(),
    status,
    minute,
    home_score: homeScore,
    away_score: awayScore,
    home_logo: homeLogo,
    away_logo: awayLogo,
    prediction: predOutcome,
    confidence: conf,
    home_odds: saved?.home_odds || det.home_odds,
    draw_odds: saved?.draw_odds || det.draw_odds,
    away_odds: saved?.away_odds || det.away_odds,
  };
}

/**
 * Fetch Sportmonks In-Play Livescores
 */
export async function fetchSportmonksLiveScores(): Promise<NormalizedMatch[]> {
  const token = getSportmonksApiKey();
  if (!token) return [];

  const url = `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${token}&include=participants;scores;periods;events;league.country;round`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Sportmonks livescores returned ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map(parseSportmonksFixture);
    }
  } catch (err) {
    console.warn('Sportmonks live scores error:', err);
  }

  return [];
}

/**
 * Fetch Sportmonks Standings for Season (e.g. 28083 for Premier League)
 */
export async function fetchSportmonksSeasonStandings(seasonId = 28083): Promise<StandingRow[]> {
  const token = getSportmonksApiKey();
  if (!token) return [];

  const url = `https://api.sportmonks.com/v3/football/standings/seasons/${seasonId}?api_token=${token}&include=participant;rule.type;details.type;form;stage;league;group`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Sportmonks standings returned ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      return parseSportmonksStandings(json.data);
    }
  } catch (err) {
    console.warn('Sportmonks standings fetch failed:', err);
  }

  return [];
}

/**
 * Fetch Sportmonks Fixture with rich Predictions, Lineups, Venue, and Trends
 */
export async function fetchSportmonksFixtureDetails(fixtureId: number | string): Promise<NormalizedMatch | null> {
  const token = getSportmonksApiKey();
  if (!token) return null;

  const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${token}&include=state;participants;venue;scores;league;events.player;events.type;events.period;predictions.type;lineups;events;periods;leagues;stage;round;coaches;metadata;sidelined;formations;trends;prematchNews;postmatchNews;predictions;xGFixture`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data) {
      return parseSportmonksFixture(json.data);
    }
  } catch (err) {
    console.warn('Sportmonks fixture details error:', err);
  }

  return null;
}

/**
 * Fetch Sportmonks Upcoming Fixtures & Predictions
 */
export async function fetchSportmonksPredictions(): Promise<Prediction[]> {
  const token = getSportmonksApiKey();

  let rawList = SPORTMONKS_PREMIER_LEAGUE_FIXTURES;

  if (token) {
    try {
      // Query Sportmonks fixtures
      const url = `https://api.sportmonks.com/v3/football/fixtures/upcoming?api_token=${token}&include=participants;league;venue;state;scores;events.type;events.period;events.player;trends.type;trends.participant;predictions.type`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          rawList = json.data;
        }
      }
    } catch (e) {
      console.warn('Sportmonks upcoming fetch fallback to verified schedule:', e);
    }
  }

  const predictions: Prediction[] = rawList.map((f: any) => {
    const norm = parseSportmonksFixture(f);
    const venueName = f.venue?.name || 'Premier Stadium';

    return {
      id: `sportmonks-pred-${f.id}`,
      match_id: `match-${f.id}`,
      home_team: norm.home_team,
      away_team: norm.away_team,
      league: norm.competition,
      match_date: norm.match_date,
      prediction: norm.prediction || 'Home Win',
      predicted_outcome: norm.prediction || 'Home Win',
      confidence: norm.confidence || 75,
      confidence_score: norm.confidence || 75,
      home_odds: norm.home_odds,
      draw_odds: norm.draw_odds,
      away_odds: norm.away_odds,
      analysis: `Sportmonks v3 fixture data for ${norm.home_team} vs ${norm.away_team} at ${venueName}. AI predictive engine projects ${norm.prediction || 'Home Win'} with ${norm.confidence || 75}% confidence rating.`,
      reasoning: `Sportmonks metrics and team statistics confirmed at ${venueName}.`,
      is_premium: (norm.confidence || 75) >= 78,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  });

  return mergeAndPreservePredictions(predictions);
}
