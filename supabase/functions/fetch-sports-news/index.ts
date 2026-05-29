import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const NEWS_SOURCES = [
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', category: 'global' },
  { name: 'Goal.com', url: 'https://www.goal.com/feeds/en/news', category: 'global' },
  { name: 'ESPN FC', url: 'https://www.espn.com/espn/rss/soccer/news', category: 'global' },
  { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'global' },
];

function parseRSS(xml: string, sourceName: string, category: string) {
  const items: { title: string; description: string; link: string; pubDate: string; source: string; category: string; imageUrl?: string }[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s)?.[1] || '';
    const link = item.match(/<link>(.*?)<\/link>|<link\s[^>]*href="([^"]*)">/)?.[1] || '';
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
    const imageUrl = item.match(/<media:content[^>]*url="([^"]*)"/) ?.[1] ||
                     item.match(/src="(https?:\/\/[^"]*(?:jpg|jpeg|png|webp)[^"]*)"/)?.[1];
    const cleanDesc = desc.replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#\d+;/g,'').trim().slice(0, 200);
    if (title && link) items.push({ title: title.replace(/<[^>]+>/g,'').trim(), description: cleanDesc, link: link.trim(), pubDate, source: sourceName, category, imageUrl });
  }
  return items.slice(0, 5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'all';
    const sources = category === 'all' ? NEWS_SOURCES : NEWS_SOURCES.filter(s => s.category === category);

    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const res = await fetch(source.url, { headers: { 'User-Agent': 'PredictPro/1.0 NewsBot' }, signal: AbortSignal.timeout(5000) });
        const xml = await res.text();
        return parseRSS(xml, source.name, source.category);
      })
    );

    const articles = results
      .filter((r): r is PromiseFulfilledResult<typeof results[0] extends PromiseFulfilledResult<infer T> ? T : never> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 30);

    return new Response(JSON.stringify({ success: true, articles, count: articles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
