// Unified RapidAPI proxy for multiple football/sports data hosts
// Supports two RapidAPI accounts via RAPIDAPI_KEY_A and RAPIDAPI_KEY_B
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Source =
  | 'players-search'        // free-api-live-football-data
  | 'predictions'           // football-prediction-api
  | 'highlights'            // sport-highlights-api
  | 'news-by-league'        // football-news11
  | 'live-stream'           // football-live-stream-api
  | 'news-aggregator';      // football-news-aggregator-live

// host -> which key bucket to use
const SOURCES: Record<Source, { host: string; keyVar: 'A' | 'B'; build: (p: Record<string, string>) => string }> = {
  'players-search': {
    host: 'free-api-live-football-data.p.rapidapi.com',
    keyVar: 'A',
    build: (p) => `/football-players-search?search=${encodeURIComponent(p.search ?? 'm')}`,
  },
  'predictions': {
    host: 'football-prediction-api.p.rapidapi.com',
    keyVar: 'B',
    build: (p) => {
      const market = p.market ?? 'classic';
      const iso = p.iso_date ?? new Date().toISOString().split('T')[0];
      const fed = p.federation ?? 'UEFA';
      return `/api/v2/predictions?market=${market}&iso_date=${iso}&federation=${fed}`;
    },
  },
  'highlights': {
    host: 'sport-highlights-api.p.rapidapi.com',
    keyVar: 'B',
    build: (p) => `/${p.sport ?? 'football'}/teams/${encodeURIComponent(p.id ?? '')}`,
  },
  'news-by-league': {
    host: 'football-news11.p.rapidapi.com',
    keyVar: 'A',
    build: (p) =>
      `/api/news-by-league?league_id=${p.league_id ?? '52'}&lang=${p.lang ?? 'en'}&page=${p.page ?? '1'}`,
  },
  'live-stream': {
    host: 'football-live-stream-api.p.rapidapi.com',
    keyVar: 'A',
    build: (p) => `/link/${p.slug ?? ''}`,
  },
  'news-aggregator': {
    host: 'football-news-aggregator-live.p.rapidapi.com',
    keyVar: 'B',
    build: (p) => `/news/${p.publisher ?? 'fourfourtwo'}/${p.league ?? 'bundesliga'}`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const source = (body.source ?? url.searchParams.get('source')) as Source;
    const params: Record<string, string> = body.params ?? Object.fromEntries(url.searchParams.entries());

    const cfg = SOURCES[source];
    if (!cfg) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid source', valid: Object.keys(SOURCES) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const key = Deno.env.get(cfg.keyVar === 'A' ? 'RAPIDAPI_KEY_A' : 'RAPIDAPI_KEY_B');
    if (!key) {
      return new Response(
        JSON.stringify({ success: false, error: `Missing RAPIDAPI_KEY_${cfg.keyVar}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const endpoint = `https://${cfg.host}${cfg.build(params)}`;
    console.log(`[rapidapi-multi] ${source} → ${endpoint}`);

    const resp = await fetch(endpoint, {
      headers: {
        'x-rapidapi-host': cfg.host,
        'x-rapidapi-key': key,
        'Content-Type': 'application/json',
      },
    });

    const text = await resp.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    return new Response(
      JSON.stringify({ success: resp.ok, source, status: resp.status, data }),
      { status: resp.ok ? 200 : resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[rapidapi-multi] error', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
