import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

async function fetchMatchContext(homeTeam: string, awayTeam: string, rapidApiKey: string) {
  try {
    const headers = { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' };
    const [homeRes, awayRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(homeTeam)}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(awayTeam)}`, { headers }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    const homeId = homeData?.response?.[0]?.team?.id;
    const awayId = awayData?.response?.[0]?.team?.id;
    if (!homeId || !awayId) return null;

    const [h2hRes, homeFormRes, awayFormRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${homeId}&last=5&status=FT`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${awayId}&last=5&status=FT`, { headers }),
    ]);
    const [h2h, homeForm, awayForm] = await Promise.all([h2hRes.json(), homeFormRes.json(), awayFormRes.json()]);

    const formatForm = (fixtures: { teams: { home: { id: number } }; goals: { home: number; away: number } }[], teamId: number) =>
      (fixtures || []).slice(0, 5).map(f => {
        const isHome = f.teams.home.id === teamId;
        const scored = isHome ? f.goals.home : f.goals.away;
        const conceded = isHome ? f.goals.away : f.goals.home;
        return scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
      }).join('');

    return {
      homeForm: formatForm(homeForm?.response ?? [], homeId),
      awayForm: formatForm(awayForm?.response ?? [], awayId),
      h2h: (h2h?.response ?? []).slice(0, 5).map((f: { teams: { home: { name: string }; away: { name: string } }; goals: { home: number; away: number }; fixture: { date: string } }) => ({
        home: f.teams.home.name, away: f.teams.away.name,
        score: `${f.goals.home}-${f.goals.away}`, date: f.fixture.date?.slice(0, 10),
      })),
    };
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const GEMINI_KEY = Deno.env.get('LOVABLE_API_KEY');
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');

  const body = await req.json();
  const { home_team, away_team, match_date, league, fixture_id, is_premium = false } = body;
  if (!home_team || !away_team) return new Response(JSON.stringify({ error: 'Missing teams' }), { status: 400, headers: corsHeaders });

  const context = RAPIDAPI_KEY ? await fetchMatchContext(home_team, away_team, RAPIDAPI_KEY) : null;

  const prompt = `You are an expert football analyst. Predict this match outcome.

Match: ${home_team} vs ${away_team}
Date: ${match_date ?? new Date().toISOString().split('T')[0]}
League: ${league ?? 'Unknown'}
${context ? `Form (W/D/L): ${home_team}: ${context.homeForm} | ${away_team}: ${context.awayForm}
H2H: ${context.h2h.map((h: { date: string; home: string; score: string; away: string }) => `${h.date} ${h.home} ${h.score} ${h.away}`).join(' | ')}` : ''}

Respond ONLY with this exact JSON (no markdown):
{"predicted_outcome":"Home Win|Away Win|Draw","confidence_score":50-95,"home_win_probability":0-100,"draw_probability":0-100,"away_win_probability":0-100,"home_odds":1.10-15.0,"draw_odds":2.5-5.0,"away_odds":1.10-15.0,"analysis":"2-3 sentence expert analysis","correct_score":"1-0"}`;

  let aiResult: Record<string, unknown> = {};
  if (GEMINI_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 400 } }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
    } catch { /* use fallback */ }
  }

  const outcome = aiResult.predicted_outcome as string || 'Home Win';
  const confidence = Math.min(95, Math.max(40, (aiResult.confidence_score as number) || 65));

  const { data, error } = await supabase.from('predictions').insert({
    match_id: fixture_id ?? `ai-${Date.now()}`,
    home_team, away_team, league: league ?? 'Unknown',
    match_date: match_date ?? new Date().toISOString(),
    prediction: outcome,
    predicted_outcome: outcome,
    confidence: confidence,
    confidence_score: confidence,
    home_odds: aiResult.home_odds as number ?? 2.0,
    draw_odds: aiResult.draw_odds as number ?? 3.2,
    away_odds: aiResult.away_odds as number ?? 3.8,
    analysis: aiResult.analysis as string ?? `${home_team} vs ${away_team} — ${outcome} predicted.`,
    reasoning: aiResult.analysis as string ?? '',
    is_premium: is_premium,
    status: 'pending',
    metadata: {
      context_available: !!context,
      home_win_probability: aiResult.home_win_probability,
      draw_probability: aiResult.draw_probability,
      away_win_probability: aiResult.away_win_probability,
      correct_score: aiResult.correct_score,
    },
    ai_model: 'gemini-1.5-flash',
  }).select().single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ success: true, prediction: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
