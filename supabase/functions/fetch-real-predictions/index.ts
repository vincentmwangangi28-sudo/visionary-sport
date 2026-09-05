import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read cached active predictions from Supabase database
    const today = new Date().toISOString().split('T')[0];
    const { data: dbPredictions, error: dbErr } = await supabase
      .from('predictions')
      .select('*')
      .gte('match_date', today)
      .order('confidence_score', { ascending: false })
      .limit(50);

    if (!dbErr && dbPredictions && dbPredictions.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        source: 'database-cache',
        count: dbPredictions.length,
        predictions: dbPredictions,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try external Football Prediction API if configured
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (rapidApiKey) {
      try {
        const res = await fetch('https://football-prediction-api.p.rapidapi.com/api/v2/predictions', {
          headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': 'football-prediction-api.p.rapidapi.com',
          },
        });
        if (res.ok) {
          const apiData = await res.json();
          if (apiData?.data && Array.isArray(apiData.data) && apiData.data.length > 0) {
            const mapped = apiData.data.map((item: any) => ({
              home_team: item.home_team,
              away_team: item.away_team,
              league: item.competition_name || item.competition_cluster,
              match_date: item.start_date,
              predicted_outcome: item.prediction === '1' ? 'Home Win' : item.prediction === '2' ? 'Away Win' : 'Draw',
              confidence_score: Math.round(item.prediction_risk === 'low' ? 82 : item.prediction_risk === 'medium' ? 74 : 64),
              home_odds: item.odds?.['1'] ? parseFloat(item.odds['1']) : 2.0,
              draw_odds: item.odds?.['X'] ? parseFloat(item.odds['X']) : 3.2,
              away_odds: item.odds?.['2'] ? parseFloat(item.odds['2']) : 3.5,
              analysis: `Consensus prediction: ${item.prediction}. Expected goals: ${item.odds_expected_goals || '2.4'}.`,
            }));

            return new Response(JSON.stringify({
              success: true,
              source: 'football-prediction-api',
              count: mapped.length,
              predictions: mapped,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (apiErr) {
        console.warn('football-prediction-api lookup failed:', apiErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      source: 'local-engine',
      predictions: [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
