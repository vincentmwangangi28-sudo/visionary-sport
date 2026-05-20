import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const MAJOR_LEAGUES = [
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
  { id: 2, name: 'Champions League' },
  { id: 3, name: 'Europa League' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // ── Auth: require CRON_SECRET header ─────────────────────────────────────
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      console.warn('Unauthorized cron attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    console.warn('⚠️  CRON_SECRET not set — endpoint is unprotected');
  }

  console.log('Cron: Starting daily predictions generation...');

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const X_RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let predictionsGenerated = 0;
  let matchesProcessed = 0;

  try {
    if (X_RAPIDAPI_KEY) {
      const today = new Date().toISOString().split('T')[0];
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const league of MAJOR_LEAGUES) {
        try {
          console.log(`Fetching matches for ${league.name}...`);
          const response = await fetch(
            `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${league.id}&from=${today}&to=${threeDaysLater}&season=${new Date().getFullYear()}&status=NS`,
            { headers: { 'X-RapidAPI-Key': X_RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' } }
          );

          if (!response.ok) { console.error(`Failed to fetch ${league.name} matches`); continue; }

          const data = await response.json() as { response: Array<{ fixture: { id: number; date: string }; teams: { home: { name: string }; away: { name: string } } }> };
          const matches = data.response ?? [];
          matchesProcessed += matches.length;

          for (const match of matches.slice(0, 5)) {
            const matchId = `api-football-${match.fixture.id}`;
            const { data: existing } = await supabase.from('predictions').select('id').eq('match_id', matchId).maybeSingle();
            if (existing) continue;

            let prediction = 'Home Win';
            let confidence = 65;
            let reasoning = 'Based on historical performance and current form.';

            if (LOVABLE_API_KEY) {
              try {
                const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [
                      { role: 'system', content: 'You are a sports prediction AI. Respond ONLY with valid JSON: {"prediction":"Home Win"|"Away Win"|"Draw","confidence":50-95,"reasoning":"<100 words"}' },
                      { role: 'user', content: `Predict: ${match.teams.home.name} vs ${match.teams.away.name} — ${league.name} — ${match.fixture.date}` }
                    ],
                  }),
                });
                if (aiRes.ok) {
                  const aiData = await aiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
                  const content = aiData.choices?.[0]?.message?.content ?? '';
                  const parsed = JSON.parse(content) as { prediction?: string; confidence?: number; reasoning?: string };
                  prediction = parsed.prediction ?? prediction;
                  confidence = parsed.confidence ?? confidence;
                  reasoning = parsed.reasoning ?? reasoning;
                }
              } catch { console.log('AI parse error — using defaults'); }
            }

            const { error: insertError } = await supabase.from('predictions').insert({
              match_id: matchId,
              home_team: match.teams.home.name,
              away_team: match.teams.away.name,
              league: league.name,
              match_date: match.fixture.date,
              prediction,
              confidence,
              reasoning,
              ai_model: 'google/gemini-2.5-flash',
              is_premium: confidence >= 80,
            });

            if (insertError) console.error('Insert error:', insertError);
            else predictionsGenerated++;

            await new Promise(r => setTimeout(r, 500));
          }
        } catch (e) { console.error(`Error processing ${league.name}:`, e); }
      }
    }

    const summary = { success: true, timestamp: new Date().toISOString(), matches_processed: matchesProcessed, predictions_generated: predictionsGenerated };
    console.log('Cron: complete', summary);
    return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Cron error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Cron job failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
