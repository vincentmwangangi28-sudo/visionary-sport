import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';

// Ping Google Search Console to notify of sitemap update
async function pingGoogleSearchConsole(sitemapUrl: string): Promise<boolean> {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const response = await fetch(pingUrl);
    console.log(`Google Search Console ping: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('GSC ping failed:', error);
    return false;
  }
}

// Ping Bing Webmaster Tools
async function pingBingWebmaster(sitemapUrl: string): Promise<boolean> {
  try {
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const response = await fetch(pingUrl);
    console.log(`Bing Webmaster ping: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error('Bing ping failed:', error);
    return false;
  }
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
    
    // Static pages with Kenya-focused SEO
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

    // Get dynamic content
    const [predictionsResult, newsResult, faqsResult] = await Promise.all([
      supabase.from('predictions')
        .select('match_id, home_team, away_team, created_at, sport, match_date')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('news_articles')
        .select('slug, updated_at, title')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('match_faqs')
        .select('match_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    // Build sitemap XML with image tags for better indexing
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      if (page.loc === '/') {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${BASE_URL}/og-image.jpg</image:loc>\n`;
        xml += `      <image:title>PredictPro - AI Sports Predictions Kenya</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }

    // Match detail pages with SEO-friendly URLs
    if (predictionsResult.data) {
      const uniqueMatches = new Map();
      for (const pred of predictionsResult.data) {
        if (!uniqueMatches.has(pred.match_id)) {
          uniqueMatches.set(pred.match_id, pred);
        }
      }
      
      for (const [matchId, pred] of uniqueMatches) {
        // Create SEO-friendly slug
        const slug = `${pred.home_team?.toLowerCase().replace(/\s+/g, '-')}-vs-${pred.away_team?.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '');
        
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/match/${matchId}</loc>\n`;
        xml += `    <lastmod>${pred.created_at.split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // News article pages with news sitemap extension
    if (newsResult.data) {
      for (const article of newsResult.data) {
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/news/${article.slug}</loc>\n`;
        xml += `    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.75</priority>\n`;
        xml += `    <news:news>\n`;
        xml += `      <news:publication>\n`;
        xml += `        <news:name>PredictPro</news:name>\n`;
        xml += `        <news:language>en</news:language>\n`;
        xml += `      </news:publication>\n`;
        xml += `      <news:publication_date>${article.updated_at || today}</news:publication_date>\n`;
        xml += `      <news:title>${article.title?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'Sports News'}</news:title>\n`;
        xml += `    </news:news>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += '</urlset>';

    const urlCount = staticPages.length + (predictionsResult.data?.length || 0) + (newsResult.data?.length || 0);

    // Store updated sitemap in SEO metadata
    await supabase.from('seo_metadata').upsert({
      page_path: '/sitemap.xml',
      title: 'Sitemap',
      description: 'PredictPro Sitemap',
      structured_data: { 
        xml_content: xml,
        generated_at: new Date().toISOString(),
        url_count: urlCount
      }
    }, { onConflict: 'page_path' });

    // Ping search engines to notify of sitemap update
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    const [googlePing, bingPing] = await Promise.all([
      pingGoogleSearchConsole(sitemapUrl),
      pingBingWebmaster(sitemapUrl)
    ]);

    console.log(`Sitemap generated with ${urlCount} URLs | Google ping: ${googlePing} | Bing ping: ${bingPing}`);

    return new Response(xml, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'noindex'
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
