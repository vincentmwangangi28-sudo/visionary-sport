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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Generating accuracy reports...');

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get all verified predictions from the past week
    const { data: verifications, error: verError } = await supabase
      .from('match_verifications')
      .select(`
        *,
        predictions (
          home_team,
          away_team,
          league,
          sport,
          confidence,
          prediction
        )
      `)
      .gte('verified_at', weekAgo.toISOString());

    if (verError) {
      throw new Error(`Failed to fetch verifications: ${verError.message}`);
    }

    if (!verifications?.length) {
      console.log('No verifications found for the past week');
      return new Response(
        JSON.stringify({ success: true, message: 'No data to generate reports' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate stats by league
    const byLeague: Record<string, { total: number; correct: number }> = {};
    const bySport: Record<string, { total: number; correct: number }> = {};
    const byConfidenceRange: Record<string, { total: number; correct: number }> = {
      '90-100': { total: 0, correct: 0 },
      '75-89': { total: 0, correct: 0 },
      '60-74': { total: 0, correct: 0 },
      '50-59': { total: 0, correct: 0 },
    };

    let totalPredictions = 0;
    let correctPredictions = 0;

    for (const v of verifications) {
      if (!v.predictions) continue;
      
      const pred = v.predictions;
      totalPredictions++;
      if (v.is_correct) correctPredictions++;

      // By league
      if (!byLeague[pred.league]) {
        byLeague[pred.league] = { total: 0, correct: 0 };
      }
      byLeague[pred.league].total++;
      if (v.is_correct) byLeague[pred.league].correct++;

      // By sport
      const sport = pred.sport || 'football';
      if (!bySport[sport]) {
        bySport[sport] = { total: 0, correct: 0 };
      }
      bySport[sport].total++;
      if (v.is_correct) bySport[sport].correct++;

      // By confidence range
      const conf = pred.confidence;
      let range = '50-59';
      if (conf >= 90) range = '90-100';
      else if (conf >= 75) range = '75-89';
      else if (conf >= 60) range = '60-74';
      
      byConfidenceRange[range].total++;
      if (v.is_correct) byConfidenceRange[range].correct++;
    }

    // Calculate accuracy percentages
    const byLeagueWithAccuracy = Object.entries(byLeague).reduce((acc, [league, stats]) => {
      acc[league] = {
        ...stats,
        accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0
      };
      return acc;
    }, {} as Record<string, any>);

    const bySportWithAccuracy = Object.entries(bySport).reduce((acc, [sport, stats]) => {
      acc[sport] = {
        ...stats,
        accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0
      };
      return acc;
    }, {} as Record<string, any>);

    const byConfidenceWithAccuracy = Object.entries(byConfidenceRange).reduce((acc, [range, stats]) => {
      acc[range] = {
        ...stats,
        accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0
      };
      return acc;
    }, {} as Record<string, any>);

    // Find top performing leagues
    const topPerformingLeagues = Object.entries(byLeagueWithAccuracy)
      .filter(([_, stats]) => stats.total >= 3)
      .sort((a, b) => parseFloat(b[1].accuracy) - parseFloat(a[1].accuracy))
      .slice(0, 5)
      .map(([league]) => league);

    // Insert weekly report
    const { error: insertError } = await supabase
      .from('accuracy_reports')
      .insert({
        report_date: today.toISOString().split('T')[0],
        period_type: 'weekly',
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_percent: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
        by_league: byLeagueWithAccuracy,
        by_sport: bySportWithAccuracy,
        by_confidence_range: byConfidenceWithAccuracy,
        top_performing_leagues: topPerformingLeagues
      });

    if (insertError) {
      console.error('Failed to insert report:', insertError);
    }

    console.log(`📊 Report generated: ${totalPredictions} predictions, ${correctPredictions} correct`);

    return new Response(
      JSON.stringify({
        success: true,
        totalPredictions,
        correctPredictions,
        accuracy: totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0,
        byLeague: byLeagueWithAccuracy,
        bySport: bySportWithAccuracy,
        byConfidenceRange: byConfidenceWithAccuracy,
        topPerformingLeagues
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Accuracy report error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
