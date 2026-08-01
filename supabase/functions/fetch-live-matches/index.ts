import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiveMatchRaw {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  time?: string | null;
  league?: string;
  date?: string;
}

interface NormalizedMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_score?: number | null;
  away_score?: number | null;
  competition?: string;
  match_date: string; // ISO UTC string
  status: 'live' | 'halftime' | 'finished' | 'upcoming' | 'postponed' | 'cancelled' | 'unknown';
  minute?: number | null;
  prediction?: string;
  confidence?: number;
}

function toIsoUtc(dateStr?: string, timeStr?: string) {
  if (!dateStr) return new Date().toISOString();
  // If already full ISO, return as-is
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes('T')) return d.toISOString();
  } catch {}

  // If date only (YYYY-MM-DD) and time provided, combine and treat as UTC
  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const t = timeStr && timeStr.length > 0 ? timeStr : '00:00:00';
    return new Date(dateStr + 'T' + t + 'Z').toISOString();
  }

  // Fallback: try to parse and normalize
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeStatus(raw?: string): NormalizedMatch['status'] {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s === 'live' || s === "1h" || s === "2h" || s.includes("live") || s === "in-play") return 'live';
  if (s === 'ht' || s === 'halftime') return 'halftime';
  if (s === 'ft' || s === 'finished' || s === 'full-time') return 'finished';
  if (s === 'ns' || s === 'scheduled' || s === 'upcoming' || s === 'ns' || s === 'not started') return 'upcoming';
  if (s.includes('post') || s.includes('postponed')) return 'postponed';
  if (s.includes('canc') || s.includes('cancel')) return 'cancelled';
  return 'unknown';
}

// Lightweight prediction generator (fallback)
function generatePrediction(match: NormalizedMatch): { prediction: string; confidence: number } {
  const home = match.home_score ?? null;
  const away = match.away_score ?? null;
  if (home === null || away === null) return { prediction: 'Draw', confidence: 50 };
  const diff = (home ?? 0) - (away ?? 0);
  if (diff > 0) return { prediction: 'Home Win', confidence: Math.min(90, 50 + diff * 10) };
  if (diff < 0) return { prediction: 'Away Win', confidence: Math.min(90, 50 + Math.abs(diff) * 10) };
  return { prediction: 'Draw', confidence: 55 };
}

// Try multiple upstream sources and return a normalized schema expected by the frontend
async function fetchFromFootballDataAPI(apiToken?: string): Promise<NormalizedMatch[]> {
  if (!apiToken) return [];
  try {
    const res = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
      headers: { 'X-Auth-Token': apiToken }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.matches || !Array.isArray(data.matches)) return [];
    return data.matches.map((m: any) => {
      const match_date = toIsoUtc(m.utcDate);
      const status = normalizeStatus(m.status?.short ?? m.status ?? 'live');
      const minute = typeof m.minute === 'number' ? m.minute : undefined;
      const normalized: NormalizedMatch = {
        id: String(m.id),
        home_team: m.homeTeam?.name ?? m.homeTeam?.shortName ?? m.homeTeam?.tla ?? 'Unknown',
        away_team: m.awayTeam?.name ?? m.awayTeam?.shortName ?? m.awayTeam?.tla ?? 'Unknown',
        home_score: (m.score?.fullTime?.home ?? null),
        away_score: (m.score?.fullTime?.away ?? null),
        competition: m.competition?.name ?? undefined,
        match_date,
        status,
        minute: minute ?? null,
      };
      const { prediction, confidence } = generatePrediction(normalized);
      return { ...normalized, prediction, confidence };
    });
  } catch (e) {
    console.error('Football Data API error', e);
    return [];
  }
}

async function fetchFromAPISports(apiKey?: string): Promise<NormalizedMatch[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: { 'x-apisports-key': apiKey }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = data.response || [];
    return arr.map((f: any) => {
      const match_date = toIsoUtc(f.fixture?.date);
      const status = normalizeStatus(f.fixture?.status?.short ?? f.fixture?.status?.long);
      const minute = f.fixture?.status?.elapsed ?? null;
      const normalized: NormalizedMatch = {
        id: String(f.fixture?.id),
        home_team: f.teams?.home?.name ?? 'Unknown',
        away_team: f.teams?.away?.name ?? 'Unknown',
        home_score: f.goals?.home ?? null,
        away_score: f.goals?.away ?? null,
        competition: f.league?.name ?? undefined,
        match_date,
        status,
        minute,
      };
      const { prediction, confidence } = generatePrediction(normalized);
      return { ...normalized, prediction, confidence };
    });
  } catch (e) {
    console.error('API-Sports error', e);
    return [];
  }
}

async function fetchFromTheSportsDB(): Promise<NormalizedMatch[]> {
  try {
    const res = await fetch('https://www.thesportsdb.com/api/v2/json/60130162/livescore.php?s=Soccer');
    const data = await res.json();
    if (!data.events || data.events.length === 0) return [];
    return data.events.map((ev: any) => {
      // TheSportsDB often provides dateEvent and strTime without timezone — treat as UTC midnight if missing time
      const date = ev.dateEvent || ev.date || undefined;
      const time = ev.strTime || ev.time || '00:00:00';
      const match_date = toIsoUtc(date, time);
      const status = normalizeStatus(ev.strStatus || 'live');
      const normalized: NormalizedMatch = {
        id: ev.idEvent ? String(ev.idEvent) : `${ev.strHomeTeam}-${ev.strAwayTeam}`,
        home_team: ev.strHomeTeam ?? 'Unknown',
        away_team: ev.strAwayTeam ?? 'Unknown',
        home_score: ev.intHomeScore ? parseInt(ev.intHomeScore) : null,
        away_score: ev.intAwayScore ? parseInt(ev.intAwayScore) : null,
        competition: ev.strLeague ?? undefined,
        match_date,
        status,
        minute: null,
      };
      const { prediction, confidence } = generatePrediction(normalized);
      return { ...normalized, prediction, confidence };
    });
  } catch (e) {
    console.error('TheSportsDB error', e);
    return [];
  }
}

function generateMockLiveMatches(): NormalizedMatch[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'mock-1', home_team: 'Manchester United', away_team: 'Liverpool', home_score: 1, away_score: 2,
      competition: 'Premier League', match_date: now, status: 'live', minute: 67, prediction: 'Away Win', confidence: 74,
    },
    {
      id: 'mock-2', home_team: 'Barcelona', away_team: 'Real Madrid', home_score: 2, away_score: 2,
      competition: 'La Liga', match_date: now, status: 'live', minute: 78, prediction: 'Draw', confidence: 52,
    },
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const apisportsKey = Deno.env.get('RAPIDAPI_KEY');
    const predictProKey = Deno.env.get('PREDICTPRO_API_KEY');

    let matches: NormalizedMatch[] = [];

    // 1. Football Data API (preferred)
    if (footballDataToken) {
      matches = await fetchFromFootballDataAPI(footballDataToken);
    }

    // 2. API-Sports fallback
    if (matches.length === 0 && apisportsKey) {
      matches = await fetchFromAPISports(apisportsKey);
    }

    // 3. TheSportsDB fallback
    if (matches.length === 0) {
      matches = await fetchFromTheSportsDB();
    }

    // 4. Attach/generate predictions
    if (matches.length > 0) {
      // If external PredictPro available we could merge here (kept simple for compatibility)
      matches = matches.map(m => {
        if (!m.prediction || !m.confidence) {
          const { prediction, confidence } = generatePrediction(m);
          return { ...m, prediction, confidence };
        }
        return m;
      });
    }

    if (matches.length === 0) matches = generateMockLiveMatches();

    return new Response(JSON.stringify({ success: true, matches, source: matches[0]?.id?.startsWith('mock') ? 'demo' : 'live', lastUpdated: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=30, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    const mock = generateMockLiveMatches();
    return new Response(JSON.stringify({ success: true, matches: mock, source: 'demo', lastUpdated: new Date().toISOString(), error: 'Using demo data' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
