import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting daily predictions automation...');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const results: {
      timestamp: string;
      liveMatches: any[];
      upcomingFixtures: any[];
      predictionsGenerated: number;
      errors: string[];
    } = {
      timestamp: new Date().toISOString(),
      liveMatches: [],
      upcomingFixtures: [],
      predictionsGenerated: 0,
      errors: []
    };

    // 1. Fetch Live Matches from Football-Data.org
    try {
      console.log('📡 Fetching live matches from Football-Data.org...');
      const liveResponse = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
        headers: { 'X-Auth-Token': footballDataToken || '' }
      });

      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        results.liveMatches = liveData.matches?.slice(0, 10) || [];
        console.log(`✅ Fetched ${results.liveMatches.length} live matches`);
      } else {
        console.log(`⚠️ Football-Data API returned ${liveResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching live matches:', error);
      results.errors.push('Failed to fetch live matches');
    }

    // 2. Fetch Upcoming Fixtures
    try {
      console.log('📅 Fetching upcoming fixtures...');
      const upcomingResponse = await fetch('https://api.football-data.org/v4/matches?status=SCHEDULED', {
        headers: { 'X-Auth-Token': footballDataToken || '' }
      });

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        results.upcomingFixtures = upcomingData.matches?.slice(0, 20) || [];
        console.log(`✅ Fetched ${results.upcomingFixtures.length} upcoming fixtures`);
      }
    } catch (error) {
      console.error('❌ Error fetching upcoming fixtures:', error);
      results.errors.push('Failed to fetch upcoming fixtures');
    }

    // 3. Get existing predictions from database and merge
    try {
      console.log('🔮 Fetching predictions from database...');
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select('*')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true })
        .limit(50);

      if (!error && predictions) {
        console.log(`✅ Found ${predictions.length} predictions in database`);
        
        // Merge predictions with live matches
        results.liveMatches = results.liveMatches.map((match: any) => {
          const prediction = predictions.find((p: any) => 
            p.match_id === match.id?.toString() ||
            (p.home_team.toLowerCase().includes(match.homeTeam?.name?.toLowerCase()) &&
             p.away_team.toLowerCase().includes(match.awayTeam?.name?.toLowerCase()))
          );
          return prediction ? { ...match, prediction: prediction.prediction, confidence: prediction.confidence, reasoning: prediction.reasoning } : match;
        });

        // Merge predictions with upcoming fixtures
        results.upcomingFixtures = results.upcomingFixtures.map((match: any) => {
          const prediction = predictions.find((p: any) => 
            p.match_id === match.id?.toString() ||
            (p.home_team.toLowerCase().includes(match.homeTeam?.name?.toLowerCase()) &&
             p.away_team.toLowerCase().includes(match.awayTeam?.name?.toLowerCase()))
          );
          return prediction ? { ...match, prediction: prediction.prediction, confidence: prediction.confidence, reasoning: prediction.reasoning } : match;
        });
      }
    } catch (error) {
      console.error('❌ Error fetching predictions:', error);
      results.errors.push('Failed to fetch predictions from database');
    }

    // 4. Calculate accuracy stats from predictions history
    try {
      const { data: historyStats } = await supabase
        .from('predictions_history')
        .select('is_correct, confidence')
        .not('is_correct', 'is', null);

      if (historyStats && historyStats.length > 0) {
        const correct = historyStats.filter(h => h.is_correct).length;
        const accuracy = Math.round((correct / historyStats.length) * 100);
        console.log(`📊 Platform accuracy: ${accuracy}% (${correct}/${historyStats.length})`);
      }
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
    }

    console.log('✅ Daily automation completed successfully');
    console.log(`📊 Summary: ${results.liveMatches.length} live, ${results.upcomingFixtures.length} upcoming, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fatal error in daily automation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
