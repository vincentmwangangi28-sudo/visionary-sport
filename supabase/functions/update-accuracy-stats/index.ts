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

  console.log('Updating platform accuracy stats...');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split('T')[0];

    // Calculate accuracy from predictions with results
    const { data: predictionsWithResults, error: predError } = await supabase
      .from('predictions')
      .select('league, prediction, result')
      .not('result', 'is', null);

    if (predError) {
      throw predError;
    }

    const totalPredictions = predictionsWithResults?.length || 0;
    let correctPredictions = 0;
    const byLeague: Record<string, { total: number; correct: number; accuracy: number }> = {};

    for (const pred of predictionsWithResults || []) {
      const isCorrect = pred.prediction?.toLowerCase() === pred.result?.toLowerCase();
      
      if (isCorrect) correctPredictions++;

      // Track by league
      if (!byLeague[pred.league]) {
        byLeague[pred.league] = { total: 0, correct: 0, accuracy: 0 };
      }
      byLeague[pred.league].total++;
      if (isCorrect) byLeague[pred.league].correct++;
    }

    // Calculate accuracy percentages
    const overallAccuracy = totalPredictions > 0 
      ? ((correctPredictions / totalPredictions) * 100).toFixed(2) 
      : 0;

    for (const league in byLeague) {
      const l = byLeague[league];
      l.accuracy = l.total > 0 ? parseFloat(((l.correct / l.total) * 100).toFixed(2)) : 0;
    }

    // Upsert today's accuracy record
    const { error: upsertError } = await supabase
      .from('platform_accuracy')
      .upsert({
        date: today,
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_percent: parseFloat(overallAccuracy as string),
        by_league: byLeague,
      }, { onConflict: 'date' });

    if (upsertError) {
      throw upsertError;
    }

    const summary = {
      success: true,
      date: today,
      total_predictions: totalPredictions,
      correct_predictions: correctPredictions,
      accuracy_percent: overallAccuracy,
      leagues_tracked: Object.keys(byLeague).length,
    };

    console.log('Accuracy stats updated:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Accuracy update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
