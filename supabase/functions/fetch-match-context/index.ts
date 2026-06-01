import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const RAPIDAPI_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  if (!RAPIDAPI_KEY) return new Response(JSON.stringify({ success: false, error: 'API key not configured' }), { status: 500, headers: corsHeaders });

  const { home_team, away_team } = await req.json();
  if (!home_team || !away_team) return new Response(JSON.stringify({ error: 'Missing teams' }), { status: 400, headers: corsHeaders });

  const headers = { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' };

  try {
    const [homeRes, awayRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(home_team)}`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/teams?search=${encodeURIComponent(away_team)}`, { headers }),
    ]);
    const [homeData, awayData] = await Promise.all([homeRes.json(), awayRes.json()]);
    const homeId = homeData?.response?.[0]?.team?.id;
    const awayId = awayData?.response?.[0]?.team?.id;
    if (!homeId || !awayId) return new Response(JSON.stringify({ success: false, context: null }), { headers: corsHeaders });

    const [h2hRes, homeFormRes, awayFormRes] = await Promise.all([
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures/headtohead?h2h=${homeId}-${awayId}&last=6`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${homeId}&last=5&status=FT`, { headers }),
      fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?team=${awayId}&last=5&status=FT`, { headers }),
    ]);
    const [h2h, homeForm, awayForm] = await Promise.all([h2hRes.json(), homeFormRes.json(), awayFormRes.json()]);

    const fmt = (fixtures: { teams: { home: { id: number } }; goals: { home: number; away: number } }[], teamId: number) =>
      (fixtures || []).slice(0, 5).map(f => {
        const ih = f.teams.home.id === teamId;
        const s = ih ? f.goals.home : f.goals.away;
        const c = ih ? f.goals.away : f.goals.home;
        return s > c ? 'W' : s < c ? 'L' : 'D';
      }).join('');

    const context = {
      homeForm: fmt(homeForm?.response ?? [], homeId),
      awayForm: fmt(awayForm?.response ?? [], awayId),
      h2h: (h2h?.response ?? []).slice(0, 6).map((f: { teams: { home: { name: string }; away: { name: string } }; goals: { home: number; away: number }; fixture: { date: string } }) => ({
        home: f.teams.home.name, away: f.teams.away.name,
        score: `${f.goals.home}-${f.goals.away}`, date: f.fixture.date?.slice(0, 10),
      })),
    };

    return new Response(JSON.stringify({ success: true, context }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
