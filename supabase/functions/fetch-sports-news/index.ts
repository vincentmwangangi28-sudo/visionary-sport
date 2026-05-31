import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const SOURCES = [
  { name: 'BBC Sport',      url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',      region: 'global' },
  { name: 'Sky Sports',     url: 'https://www.skysports.com/rss/12040',                   region: 'global' },
  { name: 'ESPN FC',        url: 'https://www.espn.com/espn/rss/soccer/news',             region: 'americas' },
  { name: 'AS USA',         url: 'https://en.as.com/rss/latest_news.xml',                 region: 'global' },
  { name: 'L\'Équipe',      url: 'https://www.lequipe.fr/rss/actu_rss_Football.xml',      region: 'europe' },
  { name: 'Marca',          url: 'https://www.marca.com/rss/futbol.xml',                  region: 'europe' },
  { name: 'Gazzetta Sport', url: 'https://www.gazzetta.it/rss/calcio.xml',               region: 'europe' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rss/4719148.cms',   region: 'asia' },
  { name: 'Kick Off SA',    url: 'https://www.kickoff.com/rss',                           region: 'africa' },
];

function parseRSS(xml: string, sourceName: string, region: string) {
  const items: unknown[] = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const m of matches) {
    const i = m[1];
    const title = (i.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || i.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<[^>]+>/g,'').trim();
    const link  = (i.match(/<link>(.*?)<\/link>/)?.[1] || i.match(/<guid>(https?:\/\/[^<]+)<\/guid>/)?.[1] || '').trim();
    const pubDate = i.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
    const imageUrl = i.match(/url="(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp))/)?.[1];
    const desc = (i.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || i.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').trim().slice(0, 160);
    if (title && link) items.push({ title, description: desc, link, pubDate, source: sourceName, region, imageUrl });
    if (items.length >= 5) break;
  }
  return items;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const region = url.searchParams.get('region') || 'all';
  const sources = region === 'all' ? SOURCES : SOURCES.filter(s => s.region === region || s.region === 'global');

  const results = await Promise.allSettled(
    sources.map(async s => {
      const res = await fetch(s.url, { headers: { 'User-Agent': 'PredictPro/2.0 Bot (+https://predictpro.guru)' }, signal: AbortSignal.timeout(6000) });
      return parseRSS(await res.text(), s.name, s.region);
    })
  );

  const articles = results
    .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a: unknown, b: unknown) => new Date((b as { pubDate: string }).pubDate).getTime() - new Date((a as { pubDate: string }).pubDate).getTime())
    .slice(0, 40);

  return new Response(JSON.stringify({ success: true, articles, count: articles.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
  });
});
