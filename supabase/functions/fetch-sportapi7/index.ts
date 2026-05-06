import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOST = 'sportapi7.p.rapidapi.com';
const BASE = `https://${HOST}/api/v1`;

// Sport slugs supported by SportAPI7
const ALLOWED_SPORTS = new Set([
  'football', 'basketball', 'tennis', 'baseball', 'ice-hockey',
  'american-football', 'rugby', 'cricket', 'handball', 'volleyball',
  'mma', 'boxing', 'esports', 'darts', 'snooker', 'table-tennis',
]);

async function rapidFetch(path: string, key: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'x-rapidapi-host': HOST,
      'x-rapidapi-key': key,
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get('SPORTAPI7_RAPIDAPI_KEY');
    if (!key) {
      return new Response(JSON.stringify({ success: false, error: 'SPORTAPI7_RAPIDAPI_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const type = (body.type || url.searchParams.get('type') || 'live').toString();
    const sport = (body.sport || url.searchParams.get('sport') || 'football').toString();

    if (!ALLOWED_SPORTS.has(sport)) {
      return new Response(JSON.stringify({ success: false, error: `Unsupported sport: ${sport}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let path = '';
    if (type === 'live') {
      path = `/sport/${sport}/events/live`;
    } else if (type === 'scheduled') {
      const date = (body.date || url.searchParams.get('date') || new Date().toISOString().split('T')[0]).toString();
      path = `/sport/${sport}/scheduled-events/${date}`;
    } else if (type === 'event') {
      const eventId = body.eventId || url.searchParams.get('eventId');
      if (!eventId) {
        return new Response(JSON.stringify({ success: false, error: 'eventId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      path = `/event/${eventId}`;
    } else if (type === 'pitches') {
      const eventId = body.eventId || url.searchParams.get('eventId');
      const atBatId = body.atBatId || url.searchParams.get('atBatId');
      if (!eventId || !atBatId) {
        return new Response(JSON.stringify({ success: false, error: 'eventId and atBatId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      path = `/event/${eventId}/atbat/${atBatId}/pitches`;
    } else if (type === 'raw') {
      const rawPath = (body.path || url.searchParams.get('path') || '').toString();
      if (!rawPath.startsWith('/')) {
        return new Response(JSON.stringify({ success: false, error: 'path must start with /' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      path = rawPath;
    } else {
      return new Response(JSON.stringify({ success: false, error: `Unknown type: ${type}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[fetch-sportapi7] ${type} ${sport} -> ${path}`);
    const result = await rapidFetch(path, key);

    // Normalize football live/scheduled events to the live-matches shape
    let matches: unknown[] | undefined;
    if ((type === 'live' || type === 'scheduled') && result.ok) {
      const events = (result.data as any)?.events ?? [];
      matches = events.map((e: any) => ({
        id: `sportapi7-${e.id}`,
        homeTeam: e.homeTeam?.name,
        awayTeam: e.awayTeam?.name,
        homeScore: e.homeScore?.current ?? null,
        awayScore: e.awayScore?.current ?? null,
        status: e.status?.description || e.status?.type || 'unknown',
        time: e.time?.currentPeriodStartTimestamp ? `${Math.floor((Date.now() / 1000 - e.time.currentPeriodStartTimestamp) / 60)}'` : null,
        league: e.tournament?.name,
        country: e.tournament?.category?.country?.name,
        date: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null,
        sport,
      }));
    }

    return new Response(JSON.stringify({
      success: result.ok,
      status: result.status,
      source: 'sportapi7',
      type,
      sport,
      matches,
      data: result.data,
      lastUpdated: new Date().toISOString(),
    }), {
      status: result.ok ? 200 : result.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[fetch-sportapi7] error:', err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
