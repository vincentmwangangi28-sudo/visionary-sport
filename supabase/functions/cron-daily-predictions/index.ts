import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// Well-spaced realistic 2026/27 season fixtures without schedule collisions
const FIXTURES = [
  // Day +1 (Friday / Early Weekend)
  { home: 'Arsenal', away: 'Chelsea', league: 'Premier League', is_premium: false, dayOffset: 1, hour: 17 },
  { home: 'Marseille', away: 'Lyon', league: 'Ligue 1', is_premium: false, dayOffset: 1, hour: 21 },
  { home: 'Tusker FC', away: 'Bandari', league: 'KPL', is_premium: false, dayOffset: 1, hour: 15 },
  { home: 'Morocco', away: 'Ivory Coast', league: 'AFCON Qualifier', is_premium: false, dayOffset: 1, hour: 20 },
  { home: 'Inter Miami', away: 'LA Galaxy', league: 'MLS', is_premium: false, dayOffset: 1, hour: 23 },

  // Day +2 (Saturday / Sunday)
  { home: 'Liverpool', away: 'Manchester City', league: 'Premier League', is_premium: true, dayOffset: 2, hour: 16 },
  { home: 'Real Madrid', away: 'Atlético Madrid', league: 'La Liga', is_premium: false, dayOffset: 2, hour: 21 },
  { home: 'Borussia Dortmund', away: 'Bayer Leverkusen', league: 'Bundesliga', is_premium: true, dayOffset: 2, hour: 18 },
  { home: 'Inter Milan', away: 'Juventus', league: 'Serie A', is_premium: false, dayOffset: 2, hour: 20 },
  { home: 'Paris Saint-Germain', away: 'AS Monaco', league: 'Ligue 1', is_premium: false, dayOffset: 2, hour: 20 },
  { home: 'Gor Mahia', away: 'AFC Leopards', league: 'KPL', is_premium: false, dayOffset: 2, hour: 15 },
  { home: 'Nigeria', away: 'Senegal', league: 'AFCON Qualifier', is_premium: false, dayOffset: 2, hour: 17 },

  // Day +3 & +4 (Midweek European fixtures)
  { home: 'Bayern Munich', away: 'Eintracht Frankfurt', league: 'Bundesliga', is_premium: false, dayOffset: 3, hour: 15 },
  { home: 'Barcelona', away: 'Athletic Club', league: 'La Liga', is_premium: false, dayOffset: 3, hour: 21 },
  { home: 'AC Milan', away: 'AS Roma', league: 'Serie A', is_premium: false, dayOffset: 4, hour: 20 },
];

serve(async (req) => {
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];

  // Check if we already have sufficient fresh predictions
  const { count } = await supabase.from('predictions').select('*', { count: 'exact', head: true }).gte('match_date', todayIso);
  if ((count ?? 0) >= 12) {
    return new Response(JSON.stringify({ message: 'Already populated', count }), { headers: { 'Content-Type': 'application/json' } });
  }

  let generated = 0;
  for (const fixture of FIXTURES) {
    try {
      const matchDateObj = new Date(now);
      matchDateObj.setDate(matchDateObj.getDate() + fixture.dayOffset);
      matchDateObj.setHours(fixture.hour, 0, 0, 0);
      const matchDateIso = matchDateObj.toISOString();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({
          home_team: fixture.home,
          away_team: fixture.away,
          league: fixture.league,
          is_premium: fixture.is_premium,
          match_date: matchDateIso,
        }),
      });
      if (res.ok) generated++;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.error('Failed to generate fixture:', fixture.home, 'vs', fixture.away, e);
    }
  }

  return new Response(JSON.stringify({ success: true, generated, total: FIXTURES.length }), { headers: { 'Content-Type': 'application/json' } });
});
