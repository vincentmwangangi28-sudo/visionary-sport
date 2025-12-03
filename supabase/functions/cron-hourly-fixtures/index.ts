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

  console.log('Cron: Starting hourly fixtures update...');
  
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const X_RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch live matches from API-Football
    let liveMatches = [];
    if (X_RAPIDAPI_KEY) {
      try {
        const liveResponse = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
          headers: {
            'X-RapidAPI-Key': X_RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
          },
        });
        
        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          liveMatches = liveData.response || [];
          console.log(`Fetched ${liveMatches.length} live matches from API-Football`);
        }
      } catch (error) {
        console.error('Error fetching live matches:', error);
      }
    }

    // Fetch upcoming matches for the next 24 hours
    let upcomingMatches = [];
    if (X_RAPIDAPI_KEY) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const upcomingResponse = await fetch(
          `https://api-football-v1.p.rapidapi.com/v3/fixtures?from=${today}&to=${tomorrow}&status=NS`,
          {
            headers: {
              'X-RapidAPI-Key': X_RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
            },
          }
        );
        
        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          upcomingMatches = upcomingData.response || [];
          console.log(`Fetched ${upcomingMatches.length} upcoming matches from API-Football`);
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      }
    }

    // Check for finished matches to update prediction results
    let finishedMatches = [];
    if (X_RAPIDAPI_KEY) {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const finishedResponse = await fetch(
          `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${yesterday}&status=FT`,
          {
            headers: {
              'X-RapidAPI-Key': X_RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
            },
          }
        );
        
        if (finishedResponse.ok) {
          const finishedData = await finishedResponse.json();
          finishedMatches = finishedData.response || [];
          console.log(`Fetched ${finishedMatches.length} finished matches for result updates`);
          
          // Update predictions with actual results
          for (const match of finishedMatches) {
            const homeGoals = match.goals?.home || 0;
            const awayGoals = match.goals?.away || 0;
            let actualResult = 'Draw';
            if (homeGoals > awayGoals) actualResult = 'Home Win';
            else if (awayGoals > homeGoals) actualResult = 'Away Win';
            
            // Try to match by team names
            const { error } = await supabase
              .from('predictions')
              .update({ result: actualResult })
              .eq('home_team', match.teams.home.name)
              .eq('away_team', match.teams.away.name)
              .is('result', null);
              
            if (error) {
              console.error('Error updating prediction result:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching finished matches:', error);
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      live_matches: liveMatches.length,
      upcoming_matches: upcomingMatches.length,
      finished_matches: finishedMatches.length,
    };

    console.log('Cron: Hourly fixtures update completed', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cron error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Cron job failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
