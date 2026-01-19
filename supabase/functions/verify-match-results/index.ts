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
    const apiSportsKey = Deno.env.get('API_SPORTS_KEY');
    if (!apiSportsKey) {
      throw new Error('API_SPORTS_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting match result verification...');

    // Get unverified predictions from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .gte('match_date', yesterday.toISOString())
      .lt('match_date', today.toISOString())
      .is('result', null);

    if (predError) {
      throw new Error(`Failed to fetch predictions: ${predError.message}`);
    }

    console.log(`📋 Found ${predictions?.length || 0} unverified predictions`);

    if (!predictions?.length) {
      return new Response(
        JSON.stringify({ success: true, verified: 0, message: 'No predictions to verify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch completed fixtures from API-Sports
    const dateStr = yesterday.toISOString().split('T')[0];
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${dateStr}&status=FT`,
      {
        headers: { 'x-apisports-key': apiSportsKey }
      }
    );

    const data = await response.json();
    const completedFixtures = data.response || [];

    console.log(`⚽ Found ${completedFixtures.length} completed fixtures`);

    let verified = 0;
    let correct = 0;
    let incorrect = 0;

    for (const prediction of predictions) {
      // Find matching fixture
      const fixture = completedFixtures.find((f: any) => 
        f.teams.home.name.toLowerCase().includes(prediction.home_team.toLowerCase()) ||
        prediction.home_team.toLowerCase().includes(f.teams.home.name.toLowerCase())
      );

      if (!fixture) {
        console.log(`⏭️ No match found for ${prediction.home_team} vs ${prediction.away_team}`);
        continue;
      }

      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;
      
      // Determine actual result
      let actualResult: string;
      if (homeScore > awayScore) {
        actualResult = 'Home Win';
      } else if (awayScore > homeScore) {
        actualResult = 'Away Win';
      } else {
        actualResult = 'Draw';
      }

      // Check if prediction was correct
      const isCorrect = prediction.prediction.toLowerCase() === actualResult.toLowerCase();

      // Update prediction result
      const { error: updateError } = await supabase
        .from('predictions')
        .update({ result: isCorrect ? 'correct' : 'incorrect' })
        .eq('id', prediction.id);

      if (updateError) {
        console.error(`Failed to update prediction ${prediction.id}:`, updateError);
        continue;
      }

      // Insert verification record
      await supabase
        .from('match_verifications')
        .upsert({
          prediction_id: prediction.id,
          match_id: prediction.match_id,
          actual_result: actualResult,
          home_score: homeScore,
          away_score: awayScore,
          is_correct: isCorrect,
          verified_at: new Date().toISOString(),
          source: 'api-sports'
        }, { onConflict: 'prediction_id' });

      verified++;
      if (isCorrect) correct++;
      else incorrect++;

      console.log(`✅ Verified: ${prediction.home_team} vs ${prediction.away_team} - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    }

    // Update platform accuracy stats
    if (verified > 0) {
      const { data: todayAccuracy } = await supabase
        .from('platform_accuracy')
        .select('*')
        .eq('date', dateStr)
        .single();

      if (todayAccuracy) {
        await supabase
          .from('platform_accuracy')
          .update({
            total_predictions: todayAccuracy.total_predictions + verified,
            correct_predictions: todayAccuracy.correct_predictions + correct,
            accuracy_percent: ((todayAccuracy.correct_predictions + correct) / (todayAccuracy.total_predictions + verified)) * 100
          })
          .eq('id', todayAccuracy.id);
      } else {
        await supabase
          .from('platform_accuracy')
          .insert({
            date: dateStr,
            total_predictions: verified,
            correct_predictions: correct,
            accuracy_percent: (correct / verified) * 100
          });
      }
    }

    console.log(`🎯 Verification complete: ${verified} verified, ${correct} correct, ${incorrect} incorrect`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified, 
        correct, 
        incorrect,
        accuracy: verified > 0 ? ((correct / verified) * 100).toFixed(1) : 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Match verification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
