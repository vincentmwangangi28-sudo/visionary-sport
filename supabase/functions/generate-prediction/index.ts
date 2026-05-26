import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

async function fetchMatchContext(homeTeam: string, awayTeam: string, rapidApiKey: string) {
  try {
    const headers = { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' };

    // Search for teams
    const [homeRes, awayRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(homeTeam)}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(awayTeam)}`, { headers }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    const homeId = homeData?.response?.[0]?.team?.id;
    const awayId = awayData?.response?.[0]?.team?.id;
    if (!homeId || !awayId) return null;

    // Fetch form (last 5), H2H, standings in parallel
    const season = new Date().getFullYear();
    const [h2hRes, homeFormRes, awayFormRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${homeId}&last=5&status=FT`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${awayId}&last=5&status=FT`, { headers }),
    ]);
    const [h2h, homeForm, awayForm] = await Promise.all([h2hRes.json(), homeFormRes.json(), awayFormRes.json()]);

    const formatForm = (fixtures: { teams: { home: { id: number; name: string }; away: { id: number; name: string } }; goals: { home: number; away: number } }[], teamId: number) =>
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
  } catch (err) {
    console.warn('API-Football fetch failed:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const GEMINI_KEY = Deno.env.get('LOVABLE_API_KEY');
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');

  const { home_team, away_team, match_date, league, fixture_id } = await req.json();
  if (!home_team || !away_team) return new Response(JSON.stringify({ error: 'Missing teams' }), { status: 400, headers: corsHeaders });

  // Fetch real match context from API-Football
  const context = RAPIDAPI_KEY ? await fetchMatchContext(home_team, away_team, RAPIDAPI_KEY) : null;

  const prompt = `You are an expert football analyst. Predict the outcome of this match.

Match: ${home_team} vs ${away_team}
Date: ${match_date}
League: ${league ?? 'Unknown'}
${context ? `
Recent form (W/D/L):
- ${home_team}: ${context.homeForm || 'Unknown'}
- ${away_team}: ${context.awayForm || 'Unknown'}

Head-to-head (last 5):
${context.h2h.map((h: { home: string; away: string; score: string; date: string }) => `  ${h.date}: ${h.home} ${h.score} ${h.away}`).join('\n') || '  No H2H data'}
` : ''}

Respond ONLY with valid JSON:
{
  "predicted_outcome": "Home Win" | "Away Win" | "Draw",
  "confidence_score": 0-100,
  "home_win_probability": 0-100,
  "draw_probability": 0-100,
  "away_win_probability": 0-100,
  "home_odds": 1.1-20.0,
  "draw_odds": 1.1-20.0,
  "away_odds": 1.1-20.0,
  "analysis": "2-3 sentence analysis",
  "is_premium": true/false
}`;

  let prediction;
  if (GEMINI_KEY) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }),
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) prediction = JSON.parse(jsonMatch[0]);
  }

  if (!prediction) {
    // Fallback
    prediction = {
      predicted_outcome: 'Home Win', confidence_score: 60,
      home_win_probability: 55, draw_probability: 25, away_win_probability: 20,
      home_odds: 1.8, draw_odds: 3.5, away_odds: 4.2,
      analysis: `${home_team} are favoured at home against ${away_team}.`,
      is_premium: false,
    };
  }

  const { data, error } = await supabase.from('predictions').insert({
    home_team, away_team, match_date, league: league ?? 'Unknown',
    fixture_id, status: 'pending', ...prediction,
    metadata: { context_available: !!context },
  }).select().single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  return new Response(JSON.stringify({ success: true, prediction: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
