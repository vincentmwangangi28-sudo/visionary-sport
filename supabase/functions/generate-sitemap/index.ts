import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().split('T')[0];

  const { data: leagues } = await supabase.from('predictions')
    .select('league').gte('match_date', today).order('league');

  const uniqueLeagues = [...new Set((leagues ?? []).map(l => l.league))];

  const staticPages = [
    { url: '/', priority: '1.0', freq: 'hourly' },
    { url: '/best-bets', priority: '0.95', freq: 'daily' },
    { url: '/predict', priority: '0.95', freq: 'daily' },
    { url: '/live', priority: '0.9', freq: 'always' },
    { url: '/value-bets', priority: '0.9', freq: 'daily' },
    { url: '/correct-score', priority: '0.9', freq: 'daily' },
    { url: '/btts', priority: '0.9', freq: 'daily' },
    { url: '/standings', priority: '0.85', freq: 'daily' },
    { url: '/accumulator', priority: '0.85', freq: 'daily' },
    { url: '/news', priority: '0.85', freq: 'hourly' },
    { url: '/highlights', priority: '0.85', freq: 'hourly' },
    { url: '/statistics', priority: '0.8', freq: 'daily' },
    { url: '/tipsters', priority: '0.8', freq: 'hourly' },
    { url: '/players', priority: '0.75', freq: 'weekly' },
    { url: '/leaderboard', priority: '0.75', freq: 'daily' },
    { url: '/sports', priority: '0.75', freq: 'daily' },
    { url: '/bankroll', priority: '0.7', freq: 'monthly' },
    { url: '/shop', priority: '0.8', freq: 'weekly' },
    { url: '/about', priority: '0.6', freq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url><loc>https://predictpro.guru${p.url}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority><lastmod>${today}</lastmod></url>`).join('\n')}
${uniqueLeagues.map(l => `  <url><loc>https://predictpro.guru/?league=${encodeURIComponent(l)}</loc><changefreq>daily</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
});
