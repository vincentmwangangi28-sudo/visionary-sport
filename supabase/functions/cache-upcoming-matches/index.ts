import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  prediction?: string;
  confidence?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting daily upcoming matches cache update...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch matches from Football Data API
    let matches: UpcomingMatch[] = [];
    
    if (footballDataToken) {
      console.log('📡 Fetching from Football Data API...');
      try {
        const response = await fetch(
          'https://api.football-data.org/v4/matches?status=SCHEDULED',
          {
            headers: {
              'X-Auth-Token': footballDataToken,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const apiMatches = data.matches || [];
          
          matches = apiMatches.slice(0, 20).map((match: any) => {
            const matchDate = new Date(match.utcDate);
            return {
              id: `fd-${match.id}`,
              homeTeam: match.homeTeam?.name || 'TBD',
              awayTeam: match.awayTeam?.name || 'TBD',
              league: match.competition?.name || 'Unknown League',
              date: matchDate.toISOString().split('T')[0],
              time: matchDate.toTimeString().slice(0, 5),
              prediction: generatePrediction(match.homeTeam?.name, match.awayTeam?.name),
              confidence: Math.floor(Math.random() * 20) + 65,
            };
          });
          
          console.log(`✅ Fetched ${matches.length} matches from Football Data API`);
        }
      } catch (error) {
        console.error('❌ Football Data API error:', error);
      }
    }

    // If no matches from API, generate demo matches for today
    if (matches.length === 0) {
      console.log('📋 Generating demo matches...');
      matches = generateDemoMatches();
    }

    // Clear old cache and insert new matches
    console.log('🗑️ Clearing old cache...');
    const { error: deleteError } = await supabase
      .from('upcoming_matches_cache')
      .delete()
      .lt('match_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (deleteError) {
      console.error('❌ Error clearing old cache:', deleteError);
    }

    // Upsert new matches
    console.log('💾 Caching new matches...');
    for (const match of matches) {
      const { error: upsertError } = await supabase
        .from('upcoming_matches_cache')
        .upsert({
          match_id: match.id,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          league: match.league,
          match_date: `${match.date}T${match.time}:00Z`,
          match_time: match.time,
          prediction: match.prediction,
          confidence: match.confidence,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'match_id',
        });

      if (upsertError) {
        console.error(`❌ Error caching match ${match.id}:`, upsertError);
      }
    }

    console.log(`✅ Successfully cached ${matches.length} upcoming matches`);

    return new Response(
      JSON.stringify({
        success: true,
        matchesCached: matches.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Cache update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generatePrediction(homeTeam?: string, awayTeam?: string): string {
  const predictions = [
    `${homeTeam || 'Home'} Win`,
    `${awayTeam || 'Away'} Win`,
    'Draw',
    'Over 2.5 Goals',
    'Under 2.5 Goals',
    'Both Teams to Score',
  ];
  return predictions[Math.floor(Math.random() * predictions.length)];
}

function generateDemoMatches(): UpcomingMatch[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const demoMatches = [
    { home: 'Manchester United', away: 'Liverpool', league: 'Premier League', time: '15:00' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', time: '18:00' },
    { home: 'Bayern Munich', away: 'Dortmund', league: 'Bundesliga', time: '17:30' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1', time: '20:00' },
    { home: 'Juventus', away: 'AC Milan', league: 'Serie A', time: '19:45' },
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League', time: '16:30' },
    { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga', time: '21:00' },
    { home: 'Inter Milan', away: 'Napoli', league: 'Serie A', time: '18:00' },
  ];

  return demoMatches.map((match, index) => {
    const matchDate = index < 4 ? today : tomorrow;
    return {
      id: `demo-${index}-${Date.now()}`,
      homeTeam: match.home,
      awayTeam: match.away,
      league: match.league,
      date: matchDate.toISOString().split('T')[0],
      time: match.time,
      prediction: generatePrediction(match.home, match.away),
      confidence: Math.floor(Math.random() * 20) + 70,
    };
  });
}
