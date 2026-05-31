import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const FIXTURES = [
  // EPL
  { home: 'Arsenal', away: 'Man City', league: 'Premier League', is_premium: false },
  { home: 'Liverpool', away: 'Chelsea', league: 'Premier League', is_premium: false },
  { home: 'Tottenham', away: 'Newcastle', league: 'Premier League', is_premium: false },
  { home: 'Man United', away: 'Everton', league: 'Premier League', is_premium: false },
  // La Liga
  { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', is_premium: false },
  { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga', is_premium: false },
  // UCL
  { home: 'Bayern Munich', away: 'Real Madrid', league: 'Champions League', is_premium: true },
  { home: 'Manchester City', away: 'PSG', league: 'Champions League', is_premium: true },
  // Serie A
  { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A', is_premium: false },
  { home: 'Juventus', away: 'Napoli', league: 'Serie A', is_premium: false },
  // Bundesliga
  { home: 'Bayern Munich', away: 'Dortmund', league: 'Bundesliga', is_premium: false },
  { home: 'Leverkusen', away: 'RB Leipzig', league: 'Bundesliga', is_premium: false },
  // Ligue 1
  { home: 'PSG', away: 'Marseille', league: 'Ligue 1', is_premium: false },
  // KPL
  { home: 'Gor Mahia', away: 'AFC Leopards', league: 'KPL', is_premium: false },
  { home: 'Tusker FC', away: 'Bandari', league: 'KPL', is_premium: false },
  // MLS
  { home: 'Inter Miami', away: 'LA Galaxy', league: 'MLS', is_premium: false },
  // AFCON
  { home: 'Nigeria', away: 'Senegal', league: 'AFCON Qualifier', is_premium: false },
  { home: 'Morocco', away: 'Egypt', league: 'AFCON Qualifier', is_premium: false },
];

serve(async (req) => {
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const GEMINI_KEY = Deno.env.get('LOVABLE_API_KEY');
  const RAPID_KEY = Deno.env.get('X_RAPIDAPI_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const matchDate = tomorrow.toISOString().split('T')[0];

  // Check if we already have predictions for tomorrow
  const { count } = await supabase.from('predictions').select('*', { count: 'exact', head: true }).gte('match_date', matchDate);
  if ((count ?? 0) >= 10) return new Response(JSON.stringify({ message: 'Already generated', count }), { headers: { 'Content-Type': 'application/json' } });

  let generated = 0;
  for (const fixture of FIXTURES) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ ...fixture, match_date: `${matchDate}T${12 + Math.floor(Math.random() * 8)}:00:00Z` }),
      });
      if (res.ok) generated++;
      await new Promise(r => setTimeout(r, 500)); // rate limit
    } catch (e) { console.error('Failed:', fixture.home, 'vs', fixture.away, e); }
  }

  return new Response(JSON.stringify({ success: true, generated, total: FIXTURES.length }), { headers: { 'Content-Type': 'application/json' } });
});
