import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// League IDs for API-Football
const LEAGUES = {
  'Premier League': 39,
  'La Liga': 140,
  'Serie A': 135,
  'Bundesliga': 78,
  'Ligue 1': 61,
  'Champions League': 2,
  'Europa League': 3,
  'MLS': 253,
  'CAF Champions League': 12,
  'Kenyan Premier League': 276,
  'World Cup': 1,
};

interface APIFootballMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

function normalizeStatus(raw?: string) {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s.includes('live') || s === 'in-play' || s === '1h' || s === '2h') return 'live';
  if (s === 'ht' || s === 'halftime') return 'halftime';
  if (s === 'ft' || s.includes('full') || s.includes('finished')) return 'finished';
  if (s.includes('post') || s.includes('postponed')) return 'postponed';
  if (s.includes('canc') || s.includes('cancel')) return 'cancelled';
  if (s === 'ns' || s === 'scheduled' || s === 'not started' || s === 'upcoming') return 'upcoming';
  return 'unknown';
}

function toIsoUtc(dateStr?: string, timeStr?: string) {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes('T')) return d.toISOString();
  } catch {}
  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const t = timeStr && timeStr.length > 0 ? timeStr : '00:00:00';
    return new Date(dateStr + 'T' + t + 'Z').toISOString();
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const X_RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
    if (!X_RAPIDAPI_KEY) {
      console.error('X_RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { type = 'live', league = null, date = null } = body;

    let endpoint = '';
    const currentSeason = new Date().getFullYear();

    if (type === 'live') {
      endpoint = 'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all';
    } else if (type === 'upcoming') {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      endpoint = `https://api-football-v1.p.rapidapi.com/v3/fixtures?from=${targetDate}&to=${nextWeek}&status=NS`;

      if (league && LEAGUES[league as keyof typeof LEAGUES]) {
        endpoint += `&league=${LEAGUES[league as keyof typeof LEAGUES]}&season=${currentSeason}`;
      }
    } else if (type === 'results') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      endpoint = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${yesterday}&status=FT`;
    }

    console.log(`Fetching from API-Football: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API-Football error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch from API-Football' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const matches: APIFootballMatch[] = data.response || [];

    console.log(`Fetched ${matches.length} matches from API-Football`);

    // Transform matches to canonical schema (snake_case, ISO date)
    const transformedMatches = matches.map((m) => {
      const matchDate = toIsoUtc(m.fixture.date);
      const status = normalizeStatus(m.fixture.status.short ?? m.fixture.status.long);
      const minute = m.fixture.status.elapsed ?? null;

      return {
        id: `api-football-${m.fixture.id}`,
        home_team: m.teams.home.name,
        away_team: m.teams.away.name,
        competition: m.league?.name,
        match_date: matchDate,
        status,
        minute,
        home_score: m.goals.home ?? null,
        away_score: m.goals.away ?? null,
        home_logo: m.teams.home.logo ?? null,
        away_logo: m.teams.away.logo ?? null,
        prediction: null,
        confidence: null,
      };
    });

    // Filter by major leagues for better user experience
    const majorLeagueIds = Object.values(LEAGUES);
    const filteredMatches = transformedMatches.filter((match) => {
      const originalMatch = matches.find((m) => `api-football-${m.fixture.id}` === match.id);
      return originalMatch && majorLeagueIds.includes(originalMatch.league.id);
    });

    return new Response(
      JSON.stringify({
        success: true,
        matches: filteredMatches.length > 0 ? filteredMatches : transformedMatches.slice(0, 50),
        total: filteredMatches.length || transformedMatches.length,
        source: 'api-football',
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-api-football:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
