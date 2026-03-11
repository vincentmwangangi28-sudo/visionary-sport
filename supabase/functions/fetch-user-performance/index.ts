import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header if provided
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    // Run auth check and platform query in parallel
    const platformQuery = supabase
      .from('predictions')
      .select('result, confidence')
      .not('result', 'is', null)
      .limit(500);

    let userAuthPromise: Promise<string | null> = Promise.resolve(null);
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      userAuthPromise = supabase.auth.getUser(token).then(({ data }) => data?.user?.id || null);
    }

    // Await both in parallel
    const [platformResult, resolvedUserId] = await Promise.all([
      platformQuery,
      userAuthPromise,
    ]);

    userId = resolvedUserId;
    const allPredictions = platformResult.data;

    // Calculate platform stats
    const totalPredictions = allPredictions?.length || 0;
    const correctPredictions = allPredictions?.filter(p => p.result === 'correct').length || 0;
    const winRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 1000) / 10 : 0;
    const avgConfidence = totalPredictions > 0
      ? Math.round(allPredictions!.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPredictions * 10) / 10
      : 75;

    let userStats = null;

    // Only query user history if authenticated
    if (userId) {
      const { data: userHistory } = await supabase
        .from('predictions_history')
        .select('is_correct, confidence')
        .eq('user_id', userId)
        .limit(500);

      if (userHistory) {
        const userTotal = userHistory.length;
        const userCorrect = userHistory.filter(h => h.is_correct).length;
        userStats = {
          total_predictions: userTotal,
          correct_predictions: userCorrect,
          win_rate: userTotal > 0 ? Math.round((userCorrect / userTotal) * 1000) / 10 : 0,
          average_confidence: userTotal > 0
            ? Math.round(userHistory.reduce((sum, h) => sum + (h.confidence || 0), 0) / userTotal * 10) / 10
            : 0,
        };
      }
    }

    const response = {
      platform: {
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        win_rate: winRate,
        average_confidence: avgConfidence,
      },
      user: userStats,
      last_updated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user performance:', error);

    return new Response(
      JSON.stringify({
        platform: { total_predictions: 0, correct_predictions: 0, win_rate: 0, average_confidence: 75 },
        user: null,
        last_updated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
