import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  time: string;
  league: string;
  date: string;
}

// Fetch from TheSportsDB (completely free, no API key needed)
async function fetchFromTheSportsDB(): Promise<LiveMatch[]> {
  console.log('🔄 Trying TheSportsDB...');
  try {
    const response = await fetch('https://www.thesportsdb.com/api/v2/json/60130162/livescore.php?s=Soccer');
    const data = await response.json();
    
    if (!data.events || data.events.length === 0) {
      console.log('⚠️ TheSportsDB: No live matches');
      return [];
    }

    const matches: LiveMatch[] = data.events.map((event: any) => ({
      id: event.idEvent || `${event.strHomeTeam}-${event.strAwayTeam}`,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
      awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
      status: event.strStatus || 'LIVE',
      time: event.strProgress || event.strTime || '0',
      league: event.strLeague || 'Unknown',
      date: event.dateEvent || new Date().toISOString().split('T')[0],
    }));

    console.log(`✅ TheSportsDB: Found ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ TheSportsDB error:', error);
    return [];
  }
}

// Fetch from API-Sports (requires API key)
async function fetchFromAPISports(apiKey?: string): Promise<LiveMatch[]> {
  if (!apiKey) {
    console.log('⏭️ Skipping API-Sports: No API key');
    return [];
  }

  console.log('🔄 Trying API-Sports...');
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-apisports-key': apiKey
      }
    });

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      console.log('⚠️ API-Sports: No live matches');
      return [];
    }

    const matches: LiveMatch[] = data.response.map((fixture: any) => ({
      id: fixture.fixture.id.toString(),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      status: fixture.fixture.status.short,
      time: fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : '0\'',
      league: fixture.league.name,
      date: fixture.fixture.date.split('T')[0],
    }));

    console.log(`✅ API-Sports: Found ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ API-Sports error:', error);
    return [];
  }
}

// Fallback: Generate mock live data for demo purposes
function generateMockLiveMatches(): LiveMatch[] {
  console.log('🎭 Generating mock live matches for demo');
  
  const mockMatches = [
    {
      id: 'mock-1',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      homeScore: 1,
      awayScore: 2,
      status: 'LIVE',
      time: '67\'',
      league: 'Premier League',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'mock-2',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      homeScore: 2,
      awayScore: 2,
      status: 'LIVE',
      time: '78\'',
      league: 'La Liga',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'mock-3',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      homeScore: 3,
      awayScore: 1,
      status: 'LIVE',
      time: '82\'',
      league: 'Bundesliga',
      date: new Date().toISOString().split('T')[0],
    },
  ];

  return mockMatches;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📡 Fetching live matches...');
    
    // Get API key from environment
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY');
    
    let matches: LiveMatch[] = [];

    // Try multiple sources with fallback
    // 1. Try API-Sports first (if key is available)
    if (apiSportsKey) {
      matches = await fetchFromAPISports(apiSportsKey);
    }

    // 2. If no matches, try TheSportsDB (free, no key required)
    if (matches.length === 0) {
      matches = await fetchFromTheSportsDB();
    }

    // 3. If still no matches, use mock data for demo
    if (matches.length === 0) {
      matches = generateMockLiveMatches();
    }

    console.log(`✨ Returning ${matches.length} live matches`);

    return new Response(
      JSON.stringify({
        success: true,
        matches,
        source: matches[0]?.id?.startsWith('mock') ? 'demo' : 'live',
        lastUpdated: new Date().toISOString(),
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=30, stale-while-revalidate'
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching live matches:', error);
    
    // Return mock data on error for better UX
    const mockMatches = generateMockLiveMatches();
    
    return new Response(
      JSON.stringify({
        success: true,
        matches: mockMatches,
        source: 'demo',
        lastUpdated: new Date().toISOString(),
        error: 'Using demo data',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
