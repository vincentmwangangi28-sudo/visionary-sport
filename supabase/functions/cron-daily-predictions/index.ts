import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// Top leagues we generate real predictions for (API-Football league IDs)
const LEAGUES: { id: number; name: string; premiumEvery?: number }[] = [
  { id: 39, name: 'Premier League', premiumEvery: 4 },
  { id: 140, name: 'La Liga', premiumEvery: 4 },
  { id: 78, name: 'Bundesliga', premiumEvery: 5 },
  { id: 135, name: 'Serie A', premiumEvery: 5 },
  { id: 61, name: 'Ligue 1', premiumEvery: 5 },
  { id: 2, name: 'Champions League', premiumEvery: 3 },
];

const DAYS_AHEAD = 5;
const MAX_FIXTURES_PER_RUN = 24;

interface ApiFootballFixture {
  fixture: { id: number; date: string };
  league: { id: number; name: string };
  teams: { home: { name: string }; away: { name: string } };
}

async function fetchLeagueFixtures(
  leagueId: number,
  from: string,
  to: string,
  rapidKey: string | null,
  apiSportsKey: string | null
): Promise<ApiFootballFixture[]> {
  // Prefer a direct API-Sports key when available (no RapidAPI proxy overhead/limits)
  if (apiSportsKey) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${new Date().getFullYear()}&from=${from}&to=${to}`,
        { headers: { 'x-apisports-key': apiSportsKey } }
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.response)) return json.response;
      } else {
        console.warn(`API-Sports fixtures HTTP ${res.status} for league ${leagueId}`);
      }
    } catch (e) {
      console.warn(`API-Sports fixtures fetch failed for league ${leagueId}:`, e);
    }
  }

  if (rapidKey) {
    try {
      const res = await fetch(
        `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=${new Date().getFullYear()}&from=${from}&to=${to}`,
        { headers: { 'X-RapidAPI-Key': rapidKey, 'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com' } }
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.response)) return json.response;
      } else {
        console.warn(`RapidAPI fixtures HTTP ${res.status} for league ${leagueId}`);
      }
    } catch (e) {
      console.warn(`RapidAPI fixtures fetch failed for league ${leagueId}:`, e);
    }
  }

  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const rapidKey = Deno.env.get('X_RAPIDAPI_KEY') || Deno.env.get('RAPIDAPI_KEY') || null;
  const apiSportsKey = Deno.env.get('API_SPORTS_KEY') || null;

  if (!rapidKey && !apiSportsKey) {
    console.error('No fixtures provider configured (missing X_RAPIDAPI_KEY / RAPIDAPI_KEY / API_SPORTS_KEY secret).');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No football fixtures API key configured. Set X_RAPIDAPI_KEY (RapidAPI) or API_SPORTS_KEY (direct API-Sports) as a Supabase secret.',
        generated: 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const now = new Date();
  const from = now.toISOString().split('T')[0];
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + DAYS_AHEAD);
  const to = toDate.toISOString().split('T')[0];

  // Pull existing match_ids so we never regenerate/duplicate a fixture we already have
  const { data: existingRows } = await supabase
    .from('predictions')
    .select('match_id')
    .not('match_id', 'is', null);
  const existingIds = new Set((existingRows || []).map((r: { match_id: string }) => r.match_id));

  let generated = 0;
  let skippedExisting = 0;
  let fetchedTotal = 0;
  const errors: string[] = [];

  for (const league of LEAGUES) {
    if (generated >= MAX_FIXTURES_PER_RUN) break;

    const fixtures = await fetchLeagueFixtures(league.id, from, to, rapidKey, apiSportsKey);
    fetchedTotal += fixtures.length;

    let leagueIdx = 0;
    for (const fx of fixtures) {
      if (generated >= MAX_FIXTURES_PER_RUN) break;

      const matchId = `af-${fx.fixture?.id}`;
      if (!fx.fixture?.id || existingIds.has(matchId)) {
        skippedExisting++;
        continue;
      }

      const homeTeam = fx.teams?.home?.name;
      const awayTeam = fx.teams?.away?.name;
      if (!homeTeam || !awayTeam) continue;

      leagueIdx++;
      const isPremium = !!league.premiumEvery && leagueIdx % league.premiumEvery === 0;

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-prediction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({
            home_team: homeTeam,
            away_team: awayTeam,
            league: league.name,
            match_date: fx.fixture.date,
            fixture_id: matchId,
            is_premium: isPremium,
          }),
        });
        if (res.ok) {
          generated++;
          existingIds.add(matchId);
        } else {
          errors.push(`${homeTeam} vs ${awayTeam}: generate-prediction HTTP ${res.status}`);
        }
      } catch (e) {
        errors.push(`${homeTeam} vs ${awayTeam}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }

      // Stay well under provider & downstream AI rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      generated,
      skippedExisting,
      fetchedTotal,
      window: { from, to },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
