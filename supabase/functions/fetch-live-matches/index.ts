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

interface NormalizedMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_score?: number | null;
  away_score?: number | null;
  competition?: string;
  match_date: string;
  status: 'live' | 'halftime' | 'finished' | 'upcoming' | 'postponed' | 'cancelled' | 'unknown';
  minute?: number | null;
  prediction?: string;
  confidence?: number;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  home_logo?: string | null;
  away_logo?: string | null;
}

function toIsoUtc(dateStr?: string) {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

function generatePrediction(home: string, away: string, homeScore: number | null = null, awayScore: number | null = null) {
  let homeProb = 0.45;
  let drawProb = 0.28;
  let awayProb = 0.27;

  if (homeScore !== null && awayScore !== null) {
    const diff = homeScore - awayScore;
    if (diff > 0) {
      homeProb = Math.min(0.90, 0.58 + diff * 0.14);
      awayProb = Math.max(0.05, 0.18 - diff * 0.07);
      drawProb = 1 - homeProb - awayProb;
    } else if (diff < 0) {
      awayProb = Math.min(0.90, 0.58 + Math.abs(diff) * 0.14);
      homeProb = Math.max(0.05, 0.18 - Math.abs(diff) * 0.07);
      drawProb = 1 - homeProb - awayProb;
    } else {
      drawProb = 0.46;
      homeProb = 0.30;
      awayProb = 0.24;
    }
  }

  let outcome = 'Home Win';
  let conf = Math.round(homeProb * 100);

  if (awayProb > homeProb && awayProb > drawProb) {
    outcome = 'Away Win';
    conf = Math.round(awayProb * 100);
  } else if (drawProb > homeProb && drawProb > awayProb) {
    outcome = 'Draw';
    conf = Math.round(drawProb * 100);
  }

  return {
    prediction: outcome,
    confidence: Math.min(94, Math.max(55, conf)),
    home_odds: Number((1 / Math.max(0.1, homeProb) * 0.95).toFixed(2)),
    draw_odds: Number((1 / Math.max(0.1, drawProb) * 0.95).toFixed(2)),
    away_odds: Number((1 / Math.max(0.1, awayProb) * 0.95).toFixed(2)),
  };
}

async function fetchFromEspnScoreboards(): Promise<NormalizedMatch[]> {
  const matches: NormalizedMatch[] = [];
  
  const promises = LEAGUES.map(async (league) => {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.events || []).map((e: any) => ({ ...e, _league: league.name }));
    } catch {
      return [];
    }
  });

  const eventsList = await Promise.all(promises);
  const events = eventsList.flat();

  for (const ev of events) {
    const comp = ev.competitions?.[0] || {};
    const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
    const homeTeam = homeComp?.team?.displayName || homeComp?.team?.name;
    const awayTeam = awayComp?.team?.displayName || awayComp?.team?.name;
    if (!homeTeam || !awayTeam) continue;

    const homeLogo = homeComp?.team?.logo || null;
    const awayLogo = awayComp?.team?.logo || null;
    const homeScore = homeComp?.score !== undefined ? parseInt(String(homeComp.score), 10) : null;
    const awayScore = awayComp?.score !== undefined ? parseInt(String(awayComp.score), 10) : null;

    const state = ev.status?.type?.state;
    const desc = (ev.status?.type?.description || '').toLowerCase();
    let status: NormalizedMatch['status'] = 'upcoming';
    let minute: number | null = null;

    if (state === 'in') {
      status = 'live';
      minute = parseInt(String(ev.status?.displayClock || '45').replace("'", ''), 10) || 45;
      if (desc.includes('half') || desc.includes('ht')) status = 'halftime';
    } else if (state === 'post' || desc.includes('final')) {
      status = 'finished';
    }

    const pred = generatePrediction(homeTeam, awayTeam, state === 'in' || state === 'post' ? homeScore : null, state === 'in' || state === 'post' ? awayScore : null);

    matches.push({
      id: `espn-${ev.id || `${homeTeam}-${awayTeam}`}`,
      home_team: homeTeam,
      away_team: awayTeam,
      competition: ev._league || 'Football Match',
      match_date: toIsoUtc(ev.date),
      status,
      minute,
      home_score: state === 'in' || state === 'post' ? homeScore : null,
      away_score: state === 'in' || state === 'post' ? awayScore : null,
      home_logo: homeLogo,
      away_logo: awayLogo,
      ...pred,
    });
  }

  return matches;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const matches = await fetchFromEspnScoreboards();
    const liveCount = matches.filter(m => m.status === 'live' || m.status === 'halftime').length;

    return new Response(JSON.stringify({ 
      success: true, 
      matches, 
      live_count: liveCount,
      source: 'live_feed', 
      lastUpdated: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=15, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in fetch-live-matches:', error);
    return new Response(JSON.stringify({ success: false, matches: [], source: 'error', error: String(error) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
