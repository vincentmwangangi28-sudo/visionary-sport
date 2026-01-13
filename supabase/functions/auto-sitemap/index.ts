import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];
    
    // Static pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'hourly' },
      { loc: '/leaderboard', priority: '0.9', changefreq: 'hourly' },
      { loc: '/performance', priority: '0.85', changefreq: 'daily' },
      { loc: '/news', priority: '0.9', changefreq: 'hourly' },
      { loc: '/insights', priority: '0.8', changefreq: 'weekly' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    ];

    // Get dynamic content
    const [predictionsResult, newsResult] = await Promise.all([
      supabase.from('predictions')
        .select('match_id, created_at, sport')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('news_articles')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Match detail pages
    if (predictionsResult.data) {
      for (const pred of predictionsResult.data) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/match/${pred.match_id}</loc>\n`;
        xml += `    <lastmod>${pred.created_at.split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // News article pages
    if (newsResult.data) {
      for (const article of newsResult.data) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/news/${article.slug}</loc>\n`;
        xml += `    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.75</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += '</urlset>';

    // Store updated sitemap in SEO metadata
    await supabase.from('seo_metadata').upsert({
      page_path: '/sitemap.xml',
      title: 'Sitemap',
      description: 'PredictPro Sitemap',
      structured_data: { 
        xml_content: xml,
        generated_at: new Date().toISOString(),
        url_count: staticPages.length + (predictionsResult.data?.length || 0) + (newsResult.data?.length || 0)
      }
    }, { onConflict: 'page_path' });

    // Log sitemap generation
    console.log(`Sitemap generated with ${staticPages.length + (predictionsResult.data?.length || 0) + (newsResult.data?.length || 0)} URLs`);

    return new Response(xml, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
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
