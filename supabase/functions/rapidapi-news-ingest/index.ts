// Daily ingest: pulls news from rapidapi-multi (news-by-league + news-aggregator),
// and predictions, then stores news in games_news.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const LEAGUES = [
  { id: '52', name: 'Premier League' },
  { id: '54', name: 'Bundesliga' },
  { id: '53', name: 'La Liga' },
  { id: '55', name: 'Serie A' },
];

async function callMulti(source: string, params: Record<string, string>) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/rapidapi-multi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ source, params }),
  });
  return r.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const inserted: string[] = [];
  const errors: string[] = [];

  try {
    for (const league of LEAGUES) {
      try {
        const res = await callMulti('news-by-league', { league_id: league.id, lang: 'en', page: '1' });
        const items: any[] = res?.data?.response ?? res?.data?.articles ?? res?.data ?? [];
        const list = Array.isArray(items) ? items.slice(0, 5) : [];
        for (const item of list) {
          const title = item.title ?? item.headline ?? item.name;
          const content = item.description ?? item.content ?? item.summary ?? title;
          if (!title) continue;
          const { error } = await supabase.from('games_news').insert({
            title: String(title).slice(0, 250),
            content: String(content).slice(0, 5000),
            category: league.name,
            author: 'RapidAPI Sync',
          });
          if (error) errors.push(`${league.name}: ${error.message}`);
          else inserted.push(title);
        }
      } catch (e) {
        errors.push(`${league.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted_count: inserted.length, errors, inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
