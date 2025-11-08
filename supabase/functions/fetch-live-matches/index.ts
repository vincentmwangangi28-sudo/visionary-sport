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
      headers: {
        'X-Auth-Token': apiToken
      }
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

// Fetch predictions from PredictPro API
async function fetchPredictions(apiKey?: string): Promise<Map<string, { prediction: string; confidence: number }>> {
  const predictionsMap = new Map();
  
  if (!apiKey) {
    console.log('⏭️ Skipping PredictPro API: No API key');
    return predictionsMap;
  }

  console.log('🔄 Fetching predictions from PredictPro...');
  try {
    const response = await fetch('https://predictpro.ai/api/live-predictions', {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.error(`❌ PredictPro API error: ${response.status}`);
      return predictionsMap;
    }

    const data = await response.json();
    
    if (data.predictions && Array.isArray(data.predictions)) {
      data.predictions.forEach((pred: any) => {
        predictionsMap.set(pred.match_id, {
          prediction: pred.prediction,
          confidence: pred.confidence
        });
      });
      console.log(`✅ PredictPro: Loaded ${predictionsMap.size} predictions`);
    }
  } catch (error) {
    console.error('❌ PredictPro API error:', error);
  }

  return predictionsMap;
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

    const matches: LiveMatch[] = data.events.map((event: any) => {
      const match = {
        id: event.idEvent || `${event.strHomeTeam}-${event.strAwayTeam}`,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeScore: event.intHomeScore ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore ? parseInt(event.intAwayScore) : null,
        status: event.strStatus || 'LIVE',
        time: event.strProgress || event.strTime || '0',
        league: event.strLeague || 'Unknown',
        date: event.dateEvent || new Date().toISOString().split('T')[0],
      };
      const { prediction, confidence } = generatePrediction(match);
      return { ...match, prediction, confidence };
    });

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

    const matches: LiveMatch[] = data.response.map((fixture: any) => {
      const match = {
        id: fixture.fixture.id.toString(),
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        status: fixture.fixture.status.short,
        time: fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : '0\'',
        league: fixture.league.name,
        date: fixture.fixture.date.split('T')[0],
      };
      const { prediction, confidence } = generatePrediction(match);
      return { ...match, prediction, confidence };
    });

    console.log(`✅ API-Sports: Found ${matches.length} live matches`);
    return matches;
  } catch (error) {
    console.error('❌ API-Sports error:', error);
    return [];
  }
}

// Generate AI prediction based on current score
function generatePrediction(match: LiveMatch): { prediction: string; confidence: number } {
  const { homeScore, awayScore } = match;
  
  if (homeScore === null || awayScore === null) {
    return { prediction: 'Draw', confidence: 50 };
  }
  
  const scoreDiff = homeScore - awayScore;
  const time = parseInt(match.time) || 0;
  const timeRemaining = 90 - time;
  
  // Calculate confidence based on score difference and time remaining
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
      prediction: 'Away Win',
      confidence: 74,
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
      prediction: 'Draw',
      confidence: 52,
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
      prediction: 'Home Win',
      confidence: 88,
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
    
    // Get API keys from environment
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const predictProApiKey = Deno.env.get('PREDICTPRO_API_KEY');
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    let matches: LiveMatch[] = [];

    // Try multiple sources with fallback
    // 1. Try Football Data API first (primary source)
    if (footballDataToken) {
      matches = await fetchFromFootballDataAPI(footballDataToken);
    }

    // 2. If no matches, try API-Sports
    if (matches.length === 0 && rapidApiKey) {
      matches = await fetchFromAPISports(rapidApiKey);
    }

    // 3. If no matches, try TheSportsDB (free, no key required)
    if (matches.length === 0) {
      matches = await fetchFromTheSportsDB();
    }

    // 4. Fetch AI predictions from PredictPro and merge with matches
    if (matches.length > 0 && predictProApiKey) {
      const predictions = await fetchPredictions(predictProApiKey);
      
      // Merge predictions with matches
      matches = matches.map(match => {
        const pred = predictions.get(match.id);
        if (pred) {
          return { ...match, prediction: pred.prediction, confidence: pred.confidence };
        }
        // Fallback to generated predictions if API doesn't have data
        const { prediction, confidence } = generatePrediction(match);
        return { ...match, prediction, confidence };
      });
    } else if (matches.length > 0) {
      // Generate predictions if no API key available
      matches = matches.map(match => {
        const { prediction, confidence } = generatePrediction(match);
        return { ...match, prediction, confidence };
      });
    }

    // 5. If still no matches, use mock data for demo
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
