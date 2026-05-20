import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
interface ApiFixture { fixture: { id: number; status: { short: string } }; teams: { home: { name: string }; away: { name: string } }; goals: { home: number | null; away: number | null }; }
function deriveResult(f: ApiFixture): 'Home Win' | 'Away Win' | 'Draw' | null {
  if (!['FT','AET','PEN'].includes(f.fixture.status.short)) return null;
  const hg = f.goals.home ?? 0, ag = f.goals.away ?? 0;
  if (hg > ag) return 'Home Win'; if (ag > hg) return 'Away Win'; return 'Draw';
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  let updated = 0, skipped = 0;
  try {
    const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: pending, error } = await supabase.from('predictions').select('id,match_id,prediction').is('result',null).lt('match_date',yesterday).limit(50);
    if (error) throw error;
    if (!pending?.length) return new Response(JSON.stringify({ success: true, updated: 0, skipped: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    for (const pred of pending) {
      const fixtureId = pred.match_id.replace('api-football-','');
      if (!fixtureId || !RAPIDAPI_KEY) { skipped++; continue; }
      try {
        const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`, { headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' } });
        if (!res.ok) { skipped++; continue; }
        const apiData = await res.json() as { response: ApiFixture[] };
        const fixture = apiData.response?.[0];
        if (!fixture) { skipped++; continue; }
        const result = deriveResult(fixture);
        if (!result) { skipped++; continue; }
        await supabase.from('predictions').update({ result }).eq('id', pred.id);
        const { data: userPreds } = await supabase.from('user_predictions').select('id,user_choice').eq('prediction_id', pred.id);
        if (userPreds) for (const up of userPreds) await supabase.from('user_predictions').update({ is_correct: up.user_choice === result }).eq('id', up.id);
        await supabase.from('predictions_history').update({ is_correct: pred.prediction === result }).eq('match_id', pred.match_id);
        updated++;
        await new Promise(r => setTimeout(r, 500));
      } catch (e) { console.error(e); skipped++; }
    }
    return new Response(JSON.stringify({ success: true, updated, skipped }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
