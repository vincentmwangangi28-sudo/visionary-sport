import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpcomingMatchRaw {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  date?: string;
  time?: string;
  prediction?: string;
  confidence?: number;
}

interface NormalizedMatch {
  id: string;
  home_team: string;
  away_team: string;
  competition?: string;
  match_date: string; // ISO UTC
  status: 'upcoming' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled' | 'unknown';
  minute?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  home_logo?: string | null;
  away_logo?: string | null;
  prediction?: string;
  confidence?: number;
}

function toIsoUtc(dateStr?: string, timeStr?: string) {
  if (!dateStr) return new Date().toISOString();
  // If already full ISO, return as-is
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes('T')) return d.toISOString();
  } catch {}

  // If date only (YYYY-MM-DD) and time provided, combine and treat as UTC
  if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const t = timeStr && timeStr.length > 0 ? timeStr : '00:00:00';
    return new Date(dateStr + 'T' + t + 'Z').toISOString();
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function generatePrediction(match: NormalizedMatch): { prediction: string; confidence: number } {
  const home = match.home_score ?? null;
  const away = match.away_score ?? null;
  if (home === null || away === null) return { prediction: 'Draw', confidence: 50 };
  const diff = (home ?? 0) - (away ?? 0);
  if (diff > 0) return { prediction: 'Home Win', confidence: Math.min(90, 50 + diff * 10) };
  if (diff < 0) return { prediction: 'Away Win', confidence: Math.min(90, 50 + Math.abs(diff) * 10) };
  return { prediction: 'Draw', confidence: 55 };
}

function normalizeStatus(raw?: string): NormalizedMatch['status'] {
  if (!raw) return 'upcoming';
  const s = String(raw).toLowerCase();
  if (s.includes('live') || s === 'in-play') return 'live';
  if (s === 'ht' || s === 'halftime') return 'halftime';
  if (s === 'ft' || s.includes('full')) return 'finished';
  if (s.includes('post') || s.includes('postponed')) return 'postponed';
  if (s.includes('canc') || s.includes('cancel')) return 'cancelled';
  return 'upcoming';
}

// Fetch scheduled matches from Football Data API
async function fetchFromFootballDataAPI(apiToken?: string): Promise<NormalizedMatch[]> {
  if (!apiToken) return [];
  try {
    const response = await fetch('https://api.football-data.org/v4/matches?status=SCHEDULED', {
      headers: { 'X-Auth-Token': apiToken }
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.matches || !Array.isArray(data.matches)) return [];

    return data.matches.slice(0, 50).map((match: any) => {
      const match_date = toIsoUtc(match.utcDate);
      const normalized: NormalizedMatch = {
        id: String(match.id),
        home_team: match.homeTeam?.name ?? 'Unknown',
        away_team: match.awayTeam?.name ?? 'Unknown',
        competition: match.competition?.name ?? undefined,
        match_date,
        status: 'upcoming',
        minute: null,
        home_score: null,
        away_score: null,
      };
      const { prediction, confidence } = generatePrediction(normalized);
      return { ...normalized, prediction, confidence };
    });
  } catch (error) {
    console.error('Football Data API error (upcoming):', error);
    return [];
  }
}

// Fallback mock upcoming
function generateMockUpcoming(): NormalizedMatch[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = tomorrow.toISOString();
  return [
    {
      id: 'upcoming-1', home_team: 'Arsenal', away_team: 'Manchester City', competition: 'Premier League',
      match_date: iso, status: 'upcoming', minute: null, home_score: null, away_score: null, prediction: 'Home Win', confidence: 68,
    },
    {
      id: 'upcoming-2', home_team: 'PSG', away_team: 'Monaco', competition: 'Ligue 1',
      match_date: iso, status: 'upcoming', minute: null, home_score: null, away_score: null, prediction: 'Home Win', confidence: 72,
    },
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    console.log('📡 Fetching upcoming matches...');
    const footballDataToken = Deno.env.get('FOOTBALL_DATA_TOKEN') ?? Deno.env.get('FOOTBALL_DATA_API_TOKEN');
    const predictProApiKey = Deno.env.get('PREDICTPRO_API_KEY');

    let matches: NormalizedMatch[] = [];
    if (footballDataToken) {
      matches = await fetchFromFootballDataAPI(footballDataToken);
    }

    // Attach predictions if any (kept simple)
    if (matches.length > 0) {
      matches = matches.map(m => {
        if (!m.prediction || !m.confidence) {
          const { prediction, confidence } = generatePrediction(m);
          return { ...m, prediction, confidence };
        }
        return m;
      });
    }

    if (matches.length === 0) matches = generateMockUpcoming();

    return new Response(JSON.stringify({ success: true, matches, source: matches[0]?.id?.startsWith('upcoming') ? 'demo' : 'live', lastUpdated: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    const mock = generateMockUpcoming();
    return new Response(JSON.stringify({ success: true, matches: mock, source: 'demo', lastUpdated: new Date().toISOString(), error: 'Using demo data' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
