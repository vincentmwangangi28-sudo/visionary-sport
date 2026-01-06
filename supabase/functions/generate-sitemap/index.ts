import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.predictpro.guru';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const today = new Date().toISOString().split('T')[0];

    // Static routes
    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'hourly' },
      { loc: '/leaderboard', priority: '0.9', changefreq: 'hourly' },
      { loc: '/performance', priority: '0.85', changefreq: 'daily' },
      { loc: '/shop', priority: '0.85', changefreq: 'weekly' },
      { loc: '/rewards', priority: '0.8', changefreq: 'weekly' },
      { loc: '/news', priority: '0.85', changefreq: 'daily' },
      { loc: '/insights', priority: '0.8', changefreq: 'weekly' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    ];

    // Fetch recent predictions for dynamic URLs
    const { data: predictions } = await supabase
      .from('predictions')
      .select('match_id, home_team, away_team, match_date, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // Build URL entries
    const urlEntries: string[] = [];

    // Add static routes
    for (const route of staticRoutes) {
      urlEntries.push(`
  <url>
    <loc>${BASE_URL}${route.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
    }

    // Add prediction pages (if you have individual prediction pages)
    if (predictions && predictions.length > 0) {
      for (const pred of predictions) {
        const matchDate = pred.match_date?.split('T')[0] || today;
        const slug = `${pred.home_team.toLowerCase().replace(/\s+/g, '-')}-vs-${pred.away_team.toLowerCase().replace(/\s+/g, '-')}-${matchDate}`;
        
        urlEntries.push(`
  <url>
    <loc>${BASE_URL}/predictions/${slug}</loc>
    <lastmod>${matchDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }

    // Add daily predictions page
    urlEntries.push(`
  <url>
    <loc>${BASE_URL}/predictions/${today}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries.join('')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
