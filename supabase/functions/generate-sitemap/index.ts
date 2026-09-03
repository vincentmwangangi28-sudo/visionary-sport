import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().split('T')[0];

  const { data: leagues } = await supabase.from('predictions')
    .select('league').gte('match_date', today).order('league');

  const uniqueLeagues = [...new Set((leagues ?? []).map(l => l.league))];

  const { data: posts } = await supabase.from('blog_posts')
    .select('slug, published_at, created_at')
    .order('published_at', { ascending: false });

  // Every real route in the app (kept in sync with src/App.tsx)
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
    { url: '/blog', priority: '0.85', freq: 'daily' },
    { url: '/dropping-odds', priority: '0.8', freq: 'hourly' },
    { url: '/screener', priority: '0.8', freq: 'daily' },
    { url: '/track-record', priority: '0.8', freq: 'daily' },
    { url: '/statistics', priority: '0.8', freq: 'daily' },
    { url: '/tipsters', priority: '0.8', freq: 'hourly' },
    { url: '/tournaments', priority: '0.8', freq: 'daily' },
    { url: '/insights', priority: '0.75', freq: 'daily' },
    { url: '/players', priority: '0.75', freq: 'weekly' },
    { url: '/leaderboard', priority: '0.75', freq: 'daily' },
    { url: '/sports', priority: '0.75', freq: 'daily' },
    { url: '/archive', priority: '0.7', freq: 'daily' },
    { url: '/methodology', priority: '0.65', freq: 'monthly' },
    { url: '/bankroll', priority: '0.7', freq: 'monthly' },
    { url: '/shop', priority: '0.8', freq: 'weekly' },
    { url: '/about', priority: '0.6', freq: 'monthly' },
    // Dedicated league prediction hub pages
    { url: '/premier-league-predictions', priority: '0.9', freq: 'daily' },
    { url: '/champions-league-predictions', priority: '0.9', freq: 'daily' },
    { url: '/kpl-predictions', priority: '0.9', freq: 'daily' },
    { url: '/la-liga-predictions', priority: '0.9', freq: 'daily' },
    { url: '/bundesliga-predictions', priority: '0.9', freq: 'daily' },
    { url: '/serie-a-predictions', priority: '0.9', freq: 'daily' },
    { url: '/world-cup-predictions', priority: '0.85', freq: 'daily' },
    { url: '/afcon-predictions', priority: '0.85', freq: 'daily' },
  ];

  const blogUrls = (posts ?? []).map(p => {
    const lastmod = (p.published_at ?? p.created_at ?? today).toString().split('T')[0];
    return `  <url><loc>https://predictpro.guru/blog/${encodeURIComponent(p.slug)}</loc><changefreq>monthly</changefreq><priority>0.6</priority><lastmod>${lastmod}</lastmod></url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url><loc>https://predictpro.guru${p.url}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority><lastmod>${today}</lastmod></url>`).join('\n')}
${uniqueLeagues.map(l => `  <url><loc>https://predictpro.guru/?league=${encodeURIComponent(l)}</loc><changefreq>daily</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`).join('\n')}
${blogUrls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
});
