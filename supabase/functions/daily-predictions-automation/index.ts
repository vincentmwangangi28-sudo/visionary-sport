import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const predictProApiKey = Deno.env.get('PREDICTPRO_API_KEY');
    
    const results: {
      timestamp: string;
      liveMatches: any[];
      upcomingFixtures: any[];
      userPerformance: any;
      errors: string[];
    } = {
      timestamp: new Date().toISOString(),
      liveMatches: [],
      upcomingFixtures: [],
      userPerformance: null,
      errors: []
    };

    // 1. Fetch Live Matches
    try {
      console.log('📡 Fetching live matches...');
      const liveResponse = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
        headers: {
          'X-Auth-Token': footballDataToken || ''
        }
      });

      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        results.liveMatches = liveData.matches?.slice(0, 10) || [];
        console.log(`✅ Fetched ${results.liveMatches.length} live matches`);
      }
    } catch (error) {
      console.error('❌ Error fetching live matches:', error);
      results.errors.push('Failed to fetch live matches');
    }

    // 2. Fetch Live Predictions
    if (predictProApiKey) {
      try {
        console.log('🔮 Fetching live predictions...');
        const predictionsResponse = await fetch('https://predictpro.ai/api/live-predictions', {
          headers: {
            'x-api-key': predictProApiKey
          }
        });

        if (predictionsResponse.ok) {
          const predictionsData = await predictionsResponse.json();
          console.log('✅ Fetched live predictions');
          
          // Merge predictions with live matches
          if (results.liveMatches.length > 0 && predictionsData.predictions) {
            results.liveMatches = results.liveMatches.map((match: any) => {
              const prediction = predictionsData.predictions.find((p: any) => 
                p.match_id === match.id.toString()
              );
              return prediction ? { ...match, prediction: prediction.prediction, confidence: prediction.confidence } : match;
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching live predictions:', error);
        results.errors.push('Failed to fetch live predictions');
      }
    }

    // 3. Fetch Upcoming Fixtures
    try {
      console.log('📅 Fetching upcoming fixtures...');
      const upcomingResponse = await fetch('https://api.football-data.org/v4/matches?status=SCHEDULED', {
        headers: {
          'X-Auth-Token': footballDataToken || ''
        }
      });

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        results.upcomingFixtures = upcomingData.matches?.slice(0, 10) || [];
        console.log(`✅ Fetched ${results.upcomingFixtures.length} upcoming fixtures`);
      }
    } catch (error) {
      console.error('❌ Error fetching upcoming fixtures:', error);
      results.errors.push('Failed to fetch upcoming fixtures');
    }

    // 4. Fetch Upcoming Predictions
    if (predictProApiKey) {
      try {
        console.log('🔮 Fetching upcoming predictions...');
        const upcomingPredictionsResponse = await fetch('https://predictpro.ai/api/upcoming-predictions', {
          headers: {
            'x-api-key': predictProApiKey
          }
        });

        if (upcomingPredictionsResponse.ok) {
          const upcomingPredictionsData = await upcomingPredictionsResponse.json();
          console.log('✅ Fetched upcoming predictions');
          
          // Merge predictions with upcoming fixtures
          if (results.upcomingFixtures.length > 0 && upcomingPredictionsData.predictions) {
            results.upcomingFixtures = results.upcomingFixtures.map((match: any) => {
              const prediction = upcomingPredictionsData.predictions.find((p: any) => 
                p.match_id === match.id.toString()
              );
              return prediction ? { ...match, prediction: prediction.prediction, confidence: prediction.confidence } : match;
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching upcoming predictions:', error);
        results.errors.push('Failed to fetch upcoming predictions');
      }
    }

    // 5. Fetch User Performance
    if (predictProApiKey) {
      try {
        console.log('📈 Fetching user performance...');
        const performanceResponse = await fetch('https://predictpro.ai/api/user-performance', {
          headers: {
            'x-api-key': predictProApiKey
          }
        });

        if (performanceResponse.ok) {
          results.userPerformance = await performanceResponse.json();
          console.log('✅ Fetched user performance');
        }
      } catch (error) {
        console.error('❌ Error fetching user performance:', error);
        results.errors.push('Failed to fetch user performance');
      }
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
