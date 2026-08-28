import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEAGUES = [
  { code: 'eng.1', name: 'Premier League' },
  { code: 'esp.1', name: 'La Liga' },
  { code: 'ita.1', name: 'Serie A' },
  { code: 'ger.1', name: 'Bundesliga' },
  { code: 'fra.1', name: 'Ligue 1' },
  { code: 'uefa.champions', name: 'Champions League' },
  { code: 'usa.1', name: 'MLS' },
  { code: 'bra.1', name: 'Brazilian Serie A' },
  { code: 'ned.1', name: 'Eredivisie' },
  { code: 'por.1', name: 'Primeira Liga' },
  { code: 'mex.1', name: 'Liga MX' },
  { code: 'eng.2', name: 'Championship' }
];

function toIsoUtc(dateStr?: string) {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

async function fetchUpcomingFixtures(): Promise<any[]> {
  const targetDates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    targetDates.push(`${y}${m}${day}`);
  }

  const promises: Promise<any[]>[] = [];

  for (const league of LEAGUES) {
    for (const dateStr of targetDates) {
      promises.push((async () => {
        try {
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dateStr}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.events || []).map((e: any) => ({ ...e, _league: league.name }));
        } catch {
          return [];
        }
      })());
    }
  }

  const rawList = await Promise.all(promises);
  const events = rawList.flat();

  const matches: any[] = [];
  const seen = new Set<string>();

  for (const ev of events) {
    const comp = ev.competitions?.[0] || {};
    const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
    const home = homeComp?.team?.displayName || homeComp?.team?.name;
    const away = awayComp?.team?.displayName || awayComp?.team?.name;
    if (!home || !away) continue;

    const key = `${home}-${away}-${String(ev.date).split('T')[0]}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const homeLogo = homeComp?.team?.logo || null;
    const awayLogo = awayComp?.team?.logo || null;
    const venue = comp.venue?.fullName || ev.venue?.displayName || 'Home Stadium';
    const oddsDetail = comp.odds?.[0]?.details;

    matches.push({
      id: `real-${ev.id || key}`,
      home_team: home,
      away_team: away,
      competition: ev._league || 'Football League',
      match_date: toIsoUtc(ev.date),
      status: 'upcoming',
      minute: null,
      home_score: null,
      away_score: null,
      home_logo: homeLogo,
      away_logo: awayLogo,
      venue,
      odds: oddsDetail,
      prediction: 'Home Win',
      confidence: 75,
      home_odds: 1.85,
      draw_odds: 3.50,
      away_odds: 4.20,
    });
  }

  return matches;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const matches = await fetchUpcomingFixtures();

    return new Response(JSON.stringify({ 
      success: true, 
      matches, 
      count: matches.length,
      source: 'live_feed', 
      lastUpdated: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=120, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in fetch-upcoming-matches:', error);
    return new Response(JSON.stringify({ success: false, matches: [], source: 'error' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
