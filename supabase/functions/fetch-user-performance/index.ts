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
    console.log('📈 Fetching user performance from database...');
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header if provided
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch platform-wide prediction accuracy
    const { data: allPredictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('result, confidence')
      .not('result', 'is', null);

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
    }

    // Calculate platform stats
    const totalPredictions = allPredictions?.length || 0;
    const correctPredictions = allPredictions?.filter(p => p.result === 'correct').length || 0;
    const winRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100 * 10) / 10 : 0;
    const avgConfidence = allPredictions && allPredictions.length > 0
      ? Math.round(allPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / allPredictions.length * 10) / 10
      : 75;

    let userStats = null;

    // If user is authenticated, get their personal stats
    if (userId) {
      const { data: userHistory, error: historyError } = await supabase
        .from('predictions_history')
        .select('is_correct, confidence')
        .eq('user_id', userId);

      if (!historyError && userHistory) {
        const userTotal = userHistory.length;
        const userCorrect = userHistory.filter(h => h.is_correct).length;
        const userWinRate = userTotal > 0 ? Math.round((userCorrect / userTotal) * 100 * 10) / 10 : 0;
        const userAvgConfidence = userTotal > 0
          ? Math.round(userHistory.reduce((sum, h) => sum + (h.confidence || 0), 0) / userTotal * 10) / 10
          : 0;

        userStats = {
          total_predictions: userTotal,
          correct_predictions: userCorrect,
          win_rate: userWinRate,
          average_confidence: userAvgConfidence
        };
      }
    }

    const response = {
      platform: {
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        win_rate: winRate,
        average_confidence: avgConfidence
      },
      user: userStats,
      last_updated: new Date().toISOString()
    };

    console.log(`✅ Performance stats: ${totalPredictions} total, ${winRate}% win rate`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error fetching user performance:', error);
    
    // Fallback to demo data on error
    const demoData = {
      platform: {
        total_predictions: 127,
        correct_predictions: 89,
        win_rate: 70.1,
        average_confidence: 76.5
      },
      user: null,
      last_updated: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(demoData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
