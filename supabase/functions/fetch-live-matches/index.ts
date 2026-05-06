import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  prediction?: string;
  confidence?: number;
}

// Fetch from Football Data API
async function fetchFromFootballDataAPI(apiToken?: string): Promise<LiveMatch[]> {
  if (!apiToken) {
    console.log('⏭️ Skipping Football Data API: No API token');
    return [];
  }

  console.log('🔄 Trying Football Data API...');
  try {
    const response = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
      headers: { 'X-Auth-Token': apiToken }
    });

    if (!response.ok) {
      console.error(`❌ Football Data API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.matches || data.matches.length === 0) {
      console.log('⚠️ Football Data API: No live matches');
      return [];
    }

    const matches: LiveMatch[] = data.matches.map((match: any) => ({
      id: match.id.toString(),
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
      status: 'LIVE',
      time: `${match.minute || 0}'`,
      league: match.competition.name,
      date: match.utcDate.split('T')[0],
    }));

    console.log(`✅ Football Data API: Found ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ Football Data API error:', error);
    return [];
  }
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

// Fetch from SportAPI7 (RapidAPI) - multi-sport fallback
async function fetchFromSportAPI7(apiKey?: string): Promise<LiveMatch[]> {
  if (!apiKey) {
    console.log('⏭️ Skipping SportAPI7: No API key');
    return [];
  }
  console.log('🔄 Trying SportAPI7...');
  try {
    const response = await fetch('https://sportapi7.p.rapidapi.com/api/v1/sport/football/events/live', {
      headers: {
        'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    });
    if (!response.ok) {
      console.error(`❌ SportAPI7 error: ${response.status}`);
      return [];
    }
    const data = await response.json();
    const events = data?.events || [];
    if (events.length === 0) {
      console.log('⚠️ SportAPI7: No live matches');
      return [];
    }
    const matches: LiveMatch[] = events.map((e: any) => ({
      id: `sportapi7-${e.id}`,
      homeTeam: e.homeTeam?.name || 'Home',
      awayTeam: e.awayTeam?.name || 'Away',
      homeScore: e.homeScore?.current ?? null,
      awayScore: e.awayScore?.current ?? null,
      status: e.status?.description || 'LIVE',
      time: e.time?.currentPeriodStartTimestamp
        ? `${Math.max(0, Math.floor((Date.now() / 1000 - e.time.currentPeriodStartTimestamp) / 60))}'`
        : '0\'',
      league: e.tournament?.name || 'Unknown',
      date: e.startTimestamp
        ? new Date(e.startTimestamp * 1000).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    }));
    console.log(`✅ SportAPI7: Found ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ SportAPI7 error:', error);
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
      headers: { 'x-apisports-key': apiKey }
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

// Fetch AI predictions from the database
async function fetchDBPredictions(supabase: any, matches: LiveMatch[]): Promise<Map<string, { prediction: string; confidence: number }>> {
  const predictionsMap = new Map();

  if (matches.length === 0) return predictionsMap;

  try {
    // Match by match_id (fd-{id} format used by our prediction system)
    const matchIds = matches.map(m => `fd-${m.id}`);

    const { data, error } = await supabase
      .from('predictions')
      .select('match_id, prediction, confidence')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ DB predictions error:', error.message);
      return predictionsMap;
    }

    if (data && data.length > 0) {
      // Use the most recent prediction per match
      for (const pred of data) {
        const rawId = pred.match_id.replace('fd-', '');
        if (!predictionsMap.has(rawId)) {
          predictionsMap.set(rawId, {
            prediction: pred.prediction,
            confidence: pred.confidence,
          });
        }
      }
      console.log(`✅ DB predictions: Found ${predictionsMap.size} predictions for live matches`);
    } else {
      console.log('⚠️ DB predictions: No matching predictions found');
    }
  } catch (error) {
    console.error('❌ DB predictions fetch error:', error);
  }

  return predictionsMap;
}

// Generate prediction based on current score (fallback)
function generatePrediction(match: LiveMatch): { prediction: string; confidence: number } {
  const { homeScore, awayScore } = match;
  
  if (homeScore === null || awayScore === null) {
    return { prediction: 'Draw', confidence: 50 };
  }
  
  const scoreDiff = homeScore - awayScore;
  const time = parseInt(match.time) || 0;
  const timeRemaining = 90 - time;
  
  let confidence = 50;
  let prediction = 'Draw';
  
  if (scoreDiff > 0) {
    prediction = 'Home Win';
    confidence = Math.min(50 + (scoreDiff * 15) + ((90 - timeRemaining) / 90 * 30), 95);
  } else if (scoreDiff < 0) {
    prediction = 'Away Win';
    confidence = Math.min(50 + (Math.abs(scoreDiff) * 15) + ((90 - timeRemaining) / 90 * 30), 95);
  } else {
    prediction = 'Draw';
    confidence = Math.max(35, 60 - ((90 - timeRemaining) / 90 * 20));
  }
  
  return { prediction, confidence: Math.round(confidence) };
}

// Fallback: Generate mock live data for demo purposes
function generateMockLiveMatches(): LiveMatch[] {
  console.log('🎭 Generating mock live matches for demo');
  return [
    {
      id: 'mock-1', homeTeam: 'Manchester United', awayTeam: 'Liverpool',
      homeScore: 1, awayScore: 2, status: 'LIVE', time: '67\'',
      league: 'Premier League', date: new Date().toISOString().split('T')[0],
      prediction: 'Away Win', confidence: 74,
    },
    {
      id: 'mock-2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid',
      homeScore: 2, awayScore: 2, status: 'LIVE', time: '78\'',
      league: 'La Liga', date: new Date().toISOString().split('T')[0],
      prediction: 'Draw', confidence: 52,
    },
    {
      id: 'mock-3', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund',
      homeScore: 3, awayScore: 1, status: 'LIVE', time: '82\'',
      league: 'Bundesliga', date: new Date().toISOString().split('T')[0],
      prediction: 'Home Win', confidence: 88,
    },
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📡 Fetching live matches...');
    
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let matches: LiveMatch[] = [];

    // 1. Try Football Data API first
    if (footballDataToken) {
      matches = await fetchFromFootballDataAPI(footballDataToken);
    }

    // 2. If no matches, try API-Sports
    if (matches.length === 0 && rapidApiKey) {
      matches = await fetchFromAPISports(rapidApiKey);
    }

    // 3. If no matches, try TheSportsDB (free)
    if (matches.length === 0) {
      matches = await fetchFromTheSportsDB();
    }

    // 4. Merge with AI predictions from our database
    if (matches.length > 0) {
      const dbPredictions = await fetchDBPredictions(supabase, matches);
      
      matches = matches.map(match => {
        const dbPred = dbPredictions.get(match.id);
        if (dbPred) {
          return { ...match, prediction: dbPred.prediction, confidence: dbPred.confidence };
        }
        // Fallback to score-based prediction
        const { prediction, confidence } = generatePrediction(match);
        return { ...match, prediction, confidence };
      });
    }

    // 5. If still no matches, use mock data
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
