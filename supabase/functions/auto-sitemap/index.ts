import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';

// Valid static routes that exist in the app
const VALID_ROUTES = ['/', '/leaderboard', '/performance', '/news', '/insights', '/about', '/rewards', '/shop'];

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        .select('match_id, home_team, away_team, created_at, sport, match_date, league, prediction, confidence, reasoning')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('news_articles')
        .select('slug, updated_at, title, featured_image, excerpt, category')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // === 1. Main Sitemap ===
    const staticPages = VALID_ROUTES.map(route => ({
      loc: route,
      priority: route === '/' ? '1.0' : route === '/news' ? '0.9' : route === '/leaderboard' ? '0.9' : '0.7',
      changefreq: ['/', '/news', '/leaderboard'].includes(route) ? 'hourly' : 'daily',
    }));

    let mainXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    mainXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const page of staticPages) {
      mainXml += `  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    // Match pages — deduplicate and only include valid match_ids
    const uniqueMatches = new Map();
    if (predictionsResult.data) {
      for (const pred of predictionsResult.data) {
        if (pred.match_id && !uniqueMatches.has(pred.match_id)) {
          uniqueMatches.set(pred.match_id, pred);
        }
      }
      for (const [matchId, pred] of uniqueMatches) {
        mainXml += `  <url>\n    <loc>${BASE_URL}/match/${matchId}</loc>\n    <lastmod>${pred.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }

    // News pages — only published with valid slugs
    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.slug && article.slug.length > 0) {
          mainXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <lastmod>${article.updated_at?.split('T')[0] || today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`;
        }
      }
    }
    mainXml += '</urlset>';

    // === 2. Image Sitemap ===
    let imageXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    imageXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    imageXml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    imageXml += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <image:image>\n      <image:loc>${BASE_URL}/og-image.png</image:loc>\n      <image:title>PredictPro - AI Sports Predictions Kenya</image:title>\n    </image:image>\n  </url>\n`;

    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.featured_image && article.slug) {
          const safeTitle = escapeXml(article.title || 'Sports News');
          imageXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <image:image>\n      <image:loc>${escapeXml(article.featured_image)}</image:loc>\n      <image:title>${safeTitle}</image:title>\n    </image:image>\n  </url>\n`;
        }
      }
    }
    imageXml += '</urlset>';

    // === 3. Video Sitemap (valid empty structure) ===
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

    const mainUrlCount = staticPages.length + uniqueMatches.size + (newsResult.data?.filter(a => a.slug).length || 0);
    const imageUrlCount = 1 + (newsResult.data?.filter(a => a.featured_image && a.slug).length || 0);

    // Store all sitemaps
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

    // Generate SportsEvent schema for each match and store
    if (predictionsResult.data) {
      const schemaPromises = [];
      for (const [matchId, pred] of uniqueMatches) {
        const startDate = pred.match_date || new Date().toISOString();
        const endDate = new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
        
        const schema = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": `${pred.home_team} vs ${pred.away_team}`,
          "description": `AI prediction: ${pred.prediction} (${pred.confidence}% confidence)`,
          "startDate": startDate,
          "endDate": endDate,
          "eventStatus": "https://schema.org/EventScheduled",
          "organizer": { "@type": "Organization", "name": pred.league },
          "homeTeam": { "@type": "SportsTeam", "name": pred.home_team },
          "awayTeam": { "@type": "SportsTeam", "name": pred.away_team },
          "image": "https://predictpro.guru/og-image.png",
          "offers": {
            "@type": "Offer",
            "url": `${BASE_URL}/match/${matchId}`,
            "price": "0",
            "priceCurrency": "KES"
          },
          "additionalProperty": [
            { "@type": "PropertyValue", "name": "Recommended Outcome", "value": pred.prediction },
            { "@type": "PropertyValue", "name": "Confidence Score", "value": `${pred.confidence}%` }
          ]
        };

        schemaPromises.push(
          supabase.from('seo_metadata').upsert({
            page_path: `/match/${matchId}`,
            title: `${pred.home_team} vs ${pred.away_team}`,
            description: `AI prediction: ${pred.prediction} (${pred.confidence}%)`,
            structured_data: { sports_event_schema: schema, generated_at: new Date().toISOString() }
          }, { onConflict: 'page_path' })
        );
      }
      await Promise.all(schemaPromises);
    }

    console.log(`Sitemaps generated | Main: ${mainUrlCount} URLs | Images: ${imageUrlCount} | Schemas: ${uniqueMatches.size}`);

    return new Response(JSON.stringify({
      success: true,
      sitemaps: {
        main: { url_count: mainUrlCount },
        image: { url_count: imageUrlCount },
        video: { url_count: 0 },
      },
      schemas_generated: uniqueMatches.size,
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
