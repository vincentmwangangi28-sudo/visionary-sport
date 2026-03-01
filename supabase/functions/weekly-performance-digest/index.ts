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

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    // Get weekly predictions stats
    const { data: weeklyPredictions } = await supabase
      .from('predictions')
      .select('id, league, sport, confidence, result')
      .gte('match_date', weekAgo);

    const total = weeklyPredictions?.length || 0;
    const verified = weeklyPredictions?.filter(p => p.result !== null) || [];
    const correct = verified.filter(p => p.result === 'correct');
    const accuracy = verified.length > 0 ? Math.round((correct.length / verified.length) * 100) : 0;

    // Break down by league
    const byLeague: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const p of verified) {
      if (!byLeague[p.league]) byLeague[p.league] = { total: 0, correct: 0, accuracy: 0 };
      byLeague[p.league].total++;
      if (p.result === 'correct') byLeague[p.league].correct++;
    }
    for (const league of Object.keys(byLeague)) {
      byLeague[league].accuracy = Math.round((byLeague[league].correct / byLeague[league].total) * 100);
    }

    // Break down by sport
    const bySport: Record<string, { total: number; correct: number; accuracy: number }> = {};
    for (const p of verified) {
      const sport = p.sport || 'football';
      if (!bySport[sport]) bySport[sport] = { total: 0, correct: 0, accuracy: 0 };
      bySport[sport].total++;
      if (p.result === 'correct') bySport[sport].correct++;
    }
    for (const sport of Object.keys(bySport)) {
      bySport[sport].accuracy = Math.round((bySport[sport].correct / bySport[sport].total) * 100);
    }

    // Break down by confidence range
    const byConfidence: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const ranges = [
      { label: '60-70%', min: 60, max: 70 },
      { label: '70-80%', min: 70, max: 80 },
      { label: '80-90%', min: 80, max: 90 },
      { label: '90-95%', min: 90, max: 95 },
    ];
    for (const range of ranges) {
      const inRange = verified.filter(p => p.confidence >= range.min && p.confidence < range.max);
      const correctInRange = inRange.filter(p => p.result === 'correct');
      byConfidence[range.label] = {
        total: inRange.length,
        correct: correctInRange.length,
        accuracy: inRange.length > 0 ? Math.round((correctInRange.length / inRange.length) * 100) : 0
      };
    }

    // Top performing leagues
    const topLeagues = Object.entries(byLeague)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .slice(0, 5)
      .map(([name]) => name);

    // Insert weekly report
    const { error: insertError } = await supabase
      .from('accuracy_reports')
      .upsert({
        report_date: today,
        period_type: 'weekly',
        total_predictions: total,
        correct_predictions: correct.length,
        accuracy_percent: accuracy,
        by_league: byLeague,
        by_sport: bySport,
        by_confidence_range: byConfidence,
        top_performing_leagues: topLeagues,
      }, { onConflict: 'report_date,period_type' });

    if (insertError) console.error('Report insert error:', insertError.message);

    console.log(`Weekly digest: ${total} predictions, ${accuracy}% accuracy`);

    return new Response(JSON.stringify({
      success: true,
      total_predictions: total,
      verified: verified.length,
      correct: correct.length,
      accuracy_percent: accuracy,
      top_leagues: topLeagues,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Weekly digest error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
