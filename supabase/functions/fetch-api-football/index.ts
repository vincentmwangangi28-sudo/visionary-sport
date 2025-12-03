import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const X_RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Transform matches to our format
    const transformedMatches = matches.map((match) => ({
      id: `api-football-${match.fixture.id}`,
      match_id: `api-football-${match.fixture.id}`,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeScore: match.goals.home,
      awayScore: match.goals.away,
      status: match.fixture.status.short,
      statusLong: match.fixture.status.long,
      time: match.fixture.status.elapsed ? `${match.fixture.status.elapsed}'` : null,
      league: match.league.name,
      leagueLogo: match.league.logo,
      country: match.league.country,
      date: match.fixture.date,
      homeLogo: match.teams.home.logo,
      awayLogo: match.teams.away.logo,
    }));

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
