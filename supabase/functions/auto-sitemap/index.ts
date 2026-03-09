import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';

async function pingSearchEngines(sitemapUrl: string) {
  const pings = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];
  const results = await Promise.allSettled(
    pings.map(async (url) => {
      const res = await fetch(url);
      return { url, status: res.status, ok: res.ok };
    })
  );
  return results.map((r) => r.status === 'fulfilled' ? r.value : { ok: false });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Fetch dynamic content in parallel
    const [predictionsResult, newsResult] = await Promise.all([
      supabase.from('predictions')
        .select('match_id, home_team, away_team, created_at, sport, match_date')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('news_articles')
        .select('slug, updated_at, title, featured_image')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // === 1. Main Sitemap (pages + matches + news) ===
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'hourly' },
      { loc: '/leaderboard', priority: '0.9', changefreq: 'hourly' },
      { loc: '/performance', priority: '0.85', changefreq: 'daily' },
      { loc: '/news', priority: '0.9', changefreq: 'hourly' },
      { loc: '/insights', priority: '0.8', changefreq: 'weekly' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
      { loc: '/rewards', priority: '0.75', changefreq: 'daily' },
      { loc: '/shop', priority: '0.7', changefreq: 'weekly' },
    ];

    let mainXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    mainXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const page of staticPages) {
      mainXml += `  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Match pages
    if (predictionsResult.data) {
      const uniqueMatches = new Map();
      for (const pred of predictionsResult.data) {
        if (!uniqueMatches.has(pred.match_id)) uniqueMatches.set(pred.match_id, pred);
      }
      for (const [matchId, pred] of uniqueMatches) {
        mainXml += `  <url>\n    <loc>${BASE_URL}/match/${matchId}</loc>\n    <lastmod>${pred.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }

    // News pages
    if (newsResult.data) {
      for (const article of newsResult.data) {
        mainXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`;
      }
    }
    mainXml += '</urlset>';

    // === 2. Image Sitemap ===
    let imageXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    imageXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    imageXml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Static images
    imageXml += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <image:image>\n      <image:loc>${BASE_URL}/og-image.png</image:loc>\n      <image:title>PredictPro - AI Sports Predictions Kenya</image:title>\n    </image:image>\n  </url>\n`;

    // News article images
    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.featured_image) {
          const safeTitle = (article.title || 'Sports News').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          imageXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <image:image>\n      <image:loc>${article.featured_image}</image:loc>\n      <image:title>${safeTitle}</image:title>\n    </image:image>\n  </url>\n`;
        }
      }
    }
    imageXml += '</urlset>';

    // === 3. Video Sitemap (placeholder structure) ===
    let videoXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    videoXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    videoXml += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';
    videoXml += '</urlset>';

    // === 4. Sitemap Index ===
    let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/image-sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/video-sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += '</sitemapindex>';

    const mainUrlCount = staticPages.length + (predictionsResult.data?.length || 0) + (newsResult.data?.length || 0);
    const imageUrlCount = 1 + (newsResult.data?.filter(a => a.featured_image).length || 0);

    // Store all sitemaps in seo_metadata
    await Promise.all([
      supabase.from('seo_metadata').upsert({
        page_path: '/sitemap.xml',
        title: 'Main Sitemap',
        description: 'PredictPro main sitemap',
        structured_data: { xml_content: mainXml, generated_at: new Date().toISOString(), url_count: mainUrlCount }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/sitemap-index.xml',
        title: 'Sitemap Index',
        description: 'PredictPro sitemap index',
        structured_data: { xml_content: indexXml, generated_at: new Date().toISOString(), sitemap_count: 3 }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/image-sitemap.xml',
        title: 'Image Sitemap',
        description: 'PredictPro image sitemap',
        structured_data: { xml_content: imageXml, generated_at: new Date().toISOString(), url_count: imageUrlCount }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/video-sitemap.xml',
        title: 'Video Sitemap',
        description: 'PredictPro video sitemap',
        structured_data: { xml_content: videoXml, generated_at: new Date().toISOString(), url_count: 0 }
      }, { onConflict: 'page_path' }),
    ]);

    // Ping search engines for all sitemaps
    const pingResults = await Promise.all([
      pingSearchEngines(`${BASE_URL}/sitemap-index.xml`),
      pingSearchEngines(`${BASE_URL}/sitemap.xml`),
    ]);

    console.log(`Sitemaps generated | Main: ${mainUrlCount} URLs | Images: ${imageUrlCount} | Pings sent`);

    return new Response(JSON.stringify({
      success: true,
      sitemaps: {
        main: { url_count: mainUrlCount },
        image: { url_count: imageUrlCount },
        video: { url_count: 0 },
      },
      pings: pingResults,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Auto sitemap error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
