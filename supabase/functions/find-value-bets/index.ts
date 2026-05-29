import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// Value = (AI probability * bookmaker odds) - 1. If > 0, it's a value bet
function calcValuePct(aiProb: number, decimalOdds: number) {
  return ((aiProb / 100) * decimalOdds - 1) * 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: predictions } = await supabase.from('predictions')
    .select('id, home_team, away_team, match_date, league, prediction, confidence, home_odds, away_odds, draw_odds')
    .gte('match_date', new Date().toISOString().split('T')[0])
    .not('home_odds', 'is', null)
    .order('match_date').limit(20);

  const valueBets = (predictions ?? []).flatMap(p => {
    const bets = [];
    const homeProb = p.prediction === 'Home Win' ? p.confidence : p.prediction === 'Draw' ? 30 : 100 - p.confidence;
    const drawProb = p.prediction === 'Draw' ? p.confidence : 25;
    const awayProb = p.prediction === 'Away Win' ? p.confidence : p.prediction === 'Draw' ? 30 : 100 - p.confidence;

    if (p.home_odds) {
      const val = calcValuePct(homeProb, p.home_odds);
      if (val > 5) bets.push({ ...p, market: 'Home Win', odds: p.home_odds, aiProbability: homeProb, valuePct: Math.round(val), edge: val > 15 ? 'strong' : 'moderate' });
    }
    if (p.draw_odds) {
      const val = calcValuePct(drawProb, p.draw_odds);
      if (val > 5) bets.push({ ...p, market: 'Draw', odds: p.draw_odds, aiProbability: drawProb, valuePct: Math.round(val), edge: val > 15 ? 'strong' : 'moderate' });
    }
    if (p.away_odds) {
      const val = calcValuePct(awayProb, p.away_odds);
      if (val > 5) bets.push({ ...p, market: 'Away Win', odds: p.away_odds, aiProbability: awayProb, valuePct: Math.round(val), edge: val > 15 ? 'strong' : 'moderate' });
    }
    return bets;
  }).sort((a, b) => b.valuePct - a.valuePct).slice(0, 10);

  return new Response(JSON.stringify({ success: true, valueBets }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
