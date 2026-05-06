// Daily automation using SportAPI7: fetch today's fixtures, generate AI predictions + news.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAPID_HOST = 'sportapi7.p.rapidapi.com';
const SPORTS = ['football', 'basketball', 'tennis'];
const MAX_PER_SPORT = 8;

async function callAIWithRetry(key: string, messages: unknown[], maxRetries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages }),
      });
      if (r.ok) {
        const d = await r.json();
        return d.choices?.[0]?.message?.content || null;
      }
      if (r.status === 429 || r.status === 402) {
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 3000));
        continue;
      }
      console.error('AI error', r.status);
      return null;
    } catch (e) {
      console.error('AI exception', e);
    }
  }
  return null;
}

async function fetchScheduled(sport: string, date: string, rapidKey: string) {
  const r = await fetch(`https://${RAPID_HOST}/api/v1/sport/${sport}/scheduled-events/${date}`, {
    headers: { 'x-rapidapi-host': RAPID_HOST, 'x-rapidapi-key': rapidKey },
  });
  if (!r.ok) {
    console.error(`SportAPI7 ${sport} ${date} failed:`, r.status);
    return [];
  }
  const j = await r.json().catch(() => ({}));
  return (j.events ?? []) as any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const rapidKey = Deno.env.get('SPORTAPI7_RAPIDAPI_KEY');
    if (!lovableKey || !rapidKey) {
      return new Response(JSON.stringify({ error: 'Missing keys' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const date = new Date().toISOString().split('T')[0];
    let predictionsGenerated = 0;
    let newsGenerated = 0;
    const errors: string[] = [];

    for (const sport of SPORTS) {
      const events = await fetchScheduled(sport, date, rapidKey);
      console.log(`[${sport}] ${events.length} events on ${date}`);
      const slice = events.slice(0, MAX_PER_SPORT);

      for (const e of slice) {
        const home = e.homeTeam?.name;
        const away = e.awayTeam?.name;
        const league = e.tournament?.name || sport;
        if (!home || !away) continue;
        const matchDate = e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : new Date().toISOString();
        const matchId = `sportapi7-${sport}-${e.id}`;

        const { data: existing } = await supabase.from('predictions').select('id').eq('match_id', matchId).maybeSingle();
        if (existing) continue;

        const content = await callAIWithRetry(lovableKey, [
          { role: 'system', content: `You are an expert ${sport} analyst. Respond exactly: Prediction: [Home Win|Away Win|Draw], Confidence: [50-95], Reasoning: [2 sentences].` },
          { role: 'user', content: `Match: ${home} vs ${away} in ${league} on ${matchDate}.` },
        ]);
        if (!content) { errors.push(`AI failed: ${home} vs ${away}`); continue; }

        const pm = content.match(/Prediction:\s*\[?(Home Win|Away Win|Draw)\]?/i);
        const cm = content.match(/Confidence:\s*\[?(\d+)\]?/i);
        const rm = content.match(/Reasoning:\s*\[?([\s\S]+?)$/i);

        const { error: insErr } = await supabase.from('predictions').insert({
          match_id: matchId,
          home_team: home,
          away_team: away,
          league,
          match_date: matchDate,
          prediction: pm ? pm[1] : 'Draw',
          confidence: cm ? Math.min(95, Math.max(50, parseInt(cm[1]))) : 65,
          reasoning: rm ? rm[1].trim().slice(0, 500) : content.slice(0, 200),
          ai_model: 'google/gemini-2.5-flash',
          is_premium: false,
        });
        if (insErr) { errors.push(`DB ${home} vs ${away}: ${insErr.message}`); continue; }
        predictionsGenerated++;

        // Generate one short news article per high-confidence pick
        if (cm && parseInt(cm[1]) >= 75) {
          const article = await callAIWithRetry(lovableKey, [
            { role: 'system', content: 'You are a sports journalist. Write a 150-word match preview article. First line is the title.' },
            { role: 'user', content: `Preview: ${home} vs ${away} (${league}). AI prediction: ${pm?.[1]} (${cm[1]}% confidence). Reasoning: ${rm?.[1] ?? ''}` },
          ]);
          if (article) {
            const lines = article.trim().split('\n').filter(Boolean);
            const title = lines[0].replace(/^#+\s*/, '').slice(0, 200);
            const body = lines.slice(1).join('\n\n').trim() || article;
            const slug = `${home}-vs-${away}-${date}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 100);
            await supabase.from('news_articles').insert({
              title,
              slug: `${slug}-${e.id}`,
              content: body,
              excerpt: body.slice(0, 200),
              category: 'Match Preview',
              tags: [sport, league, home, away],
              author: 'PredictPro AI',
              is_published: true,
            });
            newsGenerated++;
          }
        }
        await new Promise(r => setTimeout(r, 800));
      }
    }

    return new Response(JSON.stringify({
      success: true, date, predictionsGenerated, newsGenerated,
      errors: errors.length ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('sportapi7-daily error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
