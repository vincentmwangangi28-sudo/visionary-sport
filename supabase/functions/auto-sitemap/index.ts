import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';
const VALID_ROUTES = ['/', '/leaderboard', '/performance', '/news', '/insights', '/about', '/rewards', '/shop'];

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSportsEventSchema(pred: any, matchId: string) {
  const startDate = pred.match_date || new Date().toISOString();
  const endDate = new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${pred.home_team} vs ${pred.away_team}`,
    "sport": pred.sport || "Football",
    "description": `AI prediction for ${pred.home_team} vs ${pred.away_team}: ${pred.prediction} (${pred.confidence}% confidence). ${(pred.reasoning || '').substring(0, 200)}`,
    "startDate": startDate,
    "endDate": endDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
    "image": `${BASE_URL}/og-image.png`,
    "organizer": { "@type": "Organization", "name": pred.league, "url": BASE_URL },
    "performer": [
      { "@type": "SportsTeam", "name": pred.home_team },
      { "@type": "SportsTeam", "name": pred.away_team }
    ],
    "homeTeam": { "@type": "SportsTeam", "name": pred.home_team },
    "awayTeam": { "@type": "SportsTeam", "name": pred.away_team },
    "location": {
      "@type": "Place",
      "name": `${pred.league} Venue`,
      "address": { "@type": "PostalAddress", "addressCountry": "GB" }
    },
    "offers": {
      "@type": "Offer",
      "url": `${BASE_URL}/match/${matchId}`,
      "price": "0",
      "priceCurrency": "KES",
      "availability": "https://schema.org/InStock",
      "validFrom": pred.created_at || new Date().toISOString()
    },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Recommended Outcome", "value": pred.prediction },
      { "@type": "PropertyValue", "name": "Confidence Score", "value": `${pred.confidence}%` },
      { "@type": "PropertyValue", "name": "AI Reasoning", "value": (pred.reasoning || 'Expert AI analysis').substring(0, 300) },
      { "@type": "PropertyValue", "name": "AI Model", "value": pred.ai_model || "google/gemini-2.5-flash" }
    ]
  };
}

function buildArticleSchema(article: any) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt || article.title,
    "image": article.featured_image || `${BASE_URL}/og-image.png`,
    "datePublished": article.created_at,
    "dateModified": article.updated_at || article.created_at,
    "author": { "@type": "Organization", "name": "PredictPro Guru", "url": BASE_URL },
    "publisher": {
      "@type": "Organization",
      "name": "PredictPro Guru",
      "url": BASE_URL,
      "logo": { "@type": "ImageObject", "url": `${BASE_URL}/og-image.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE_URL}/news/${article.slug}` },
    "articleSection": article.category || "Sports News",
    "keywords": (article.tags || []).join(', ')
  };
}

function buildFAQSchema(faqs: any[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };
}

async function pingIndexNow(urls: string[]) {
  if (urls.length === 0) return { success: false, reason: 'no_urls' };
  try {
    // IndexNow uses the host as the key - generate a simple key
    const key = 'predictpro-indexnow-key';
    const resp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'predictpro.guru',
        key,
        keyLocation: `${BASE_URL}/${key}.txt`,
        urlList: urls.slice(0, 100) // IndexNow limit
      })
    });
    return { success: resp.ok || resp.status === 202, status: resp.status };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function pingGoogleIndexing(supabaseUrl: string, urls: string[]) {
  if (urls.length === 0) return { success: false, reason: 'no_urls' };
  try {
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/google-indexing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ urls: urls.slice(0, 200), type: 'URL_UPDATED' }),
    });
    const data = await resp.json();
    return { success: resp.ok, ...data };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}


  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];

    // Fetch dynamic content in parallel
    const [predictionsResult, newsResult, faqsResult] = await Promise.all([
      supabase.from('predictions')
        .select('match_id, home_team, away_team, created_at, sport, match_date, league, prediction, confidence, reasoning, ai_model')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('news_articles')
        .select('slug, updated_at, created_at, title, featured_image, excerpt, category, tags, author')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('match_faqs')
        .select('match_id, question, answer')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    // === Deduplicate matches ===
    const uniqueMatches = new Map();
    if (predictionsResult.data) {
      for (const pred of predictionsResult.data) {
        if (pred.match_id && !uniqueMatches.has(pred.match_id)) {
          uniqueMatches.set(pred.match_id, pred);
        }
      }
    }

    // Group FAQs by match_id
    const faqsByMatch = new Map<string, any[]>();
    if (faqsResult.data) {
      for (const faq of faqsResult.data) {
        if (!faqsByMatch.has(faq.match_id)) faqsByMatch.set(faq.match_id, []);
        faqsByMatch.get(faq.match_id)!.push(faq);
      }
    }

    // === 1. Main Sitemap ===
    const staticPages = VALID_ROUTES.map(route => ({
      loc: route,
      priority: route === '/' ? '1.0' : ['/news', '/leaderboard'].includes(route) ? '0.9' : '0.7',
      changefreq: ['/', '/news', '/leaderboard'].includes(route) ? 'hourly' : 'daily',
    }));

    let mainXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const allUrls: string[] = [];

    for (const page of staticPages) {
      mainXml += `  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      allUrls.push(`${BASE_URL}${page.loc}`);
    }

    for (const [matchId, pred] of uniqueMatches) {
      const lastmod = pred.created_at?.split('T')[0] || today;
      mainXml += `  <url>\n    <loc>${BASE_URL}/match/${matchId}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      allUrls.push(`${BASE_URL}/match/${matchId}`);
    }

    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.slug && article.slug.length > 0) {
          const lastmod = article.updated_at?.split('T')[0] || today;
          mainXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`;
          allUrls.push(`${BASE_URL}/news/${article.slug}`);
        }
      }
    }
    mainXml += '</urlset>';

    // === 2. Image Sitemap ===
    let imageXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    imageXml += `  <url>\n    <loc>${BASE_URL}/</loc>\n    <image:image>\n      <image:loc>${BASE_URL}/og-image.png</image:loc>\n      <image:title>PredictPro - AI Sports Predictions Kenya</image:title>\n    </image:image>\n  </url>\n`;

    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.featured_image && article.slug) {
          imageXml += `  <url>\n    <loc>${BASE_URL}/news/${article.slug}</loc>\n    <image:image>\n      <image:loc>${escapeXml(article.featured_image)}</image:loc>\n      <image:title>${escapeXml(article.title || 'Sports News')}</image:title>\n    </image:image>\n  </url>\n`;
        }
      }
    }
    imageXml += '</urlset>';

    // === 3. Video Sitemap (empty structure) ===
    const videoXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n</urlset>';

    // === 4. Sitemap Index ===
    let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/image-sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += `  <sitemap>\n    <loc>${BASE_URL}/video-sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    indexXml += '</sitemapindex>';

    const mainUrlCount = staticPages.length + uniqueMatches.size + (newsResult.data?.filter(a => a.slug).length || 0);
    const imageUrlCount = 1 + (newsResult.data?.filter(a => a.featured_image && a.slug).length || 0);

    // === Store sitemaps ===
    await Promise.all([
      supabase.from('seo_metadata').upsert({
        page_path: '/sitemap.xml', title: 'Main Sitemap', description: 'PredictPro main sitemap',
        structured_data: { xml_content: mainXml, generated_at: new Date().toISOString(), url_count: mainUrlCount }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/sitemap-index.xml', title: 'Sitemap Index', description: 'PredictPro sitemap index',
        structured_data: { xml_content: indexXml, generated_at: new Date().toISOString(), sitemap_count: 3 }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/image-sitemap.xml', title: 'Image Sitemap', description: 'PredictPro image sitemap',
        structured_data: { xml_content: imageXml, generated_at: new Date().toISOString(), url_count: imageUrlCount }
      }, { onConflict: 'page_path' }),
      supabase.from('seo_metadata').upsert({
        page_path: '/video-sitemap.xml', title: 'Video Sitemap', description: 'PredictPro video sitemap',
        structured_data: { xml_content: videoXml, generated_at: new Date().toISOString(), url_count: 0 }
      }, { onConflict: 'page_path' }),
    ]);

    // === Generate SportsEvent + FAQ schemas for each match ===
    const schemaPromises = [];
    for (const [matchId, pred] of uniqueMatches) {
      const sportsSchema = buildSportsEventSchema(pred, matchId);
      const matchFaqs = faqsByMatch.get(matchId);
      const faqSchema = buildFAQSchema(matchFaqs || []);

      schemaPromises.push(
        supabase.from('seo_metadata').upsert({
          page_path: `/match/${matchId}`,
          title: `${pred.home_team} vs ${pred.away_team}`,
          description: `AI prediction: ${pred.prediction} (${pred.confidence}%)`,
          structured_data: {
            sports_event_schema: sportsSchema,
            faq_schema: faqSchema,
            generated_at: new Date().toISOString()
          }
        }, { onConflict: 'page_path' })
      );
    }

    // === Generate Article schemas for news ===
    if (newsResult.data) {
      for (const article of newsResult.data) {
        if (article.slug) {
          const articleSchema = buildArticleSchema(article);
          schemaPromises.push(
            supabase.from('seo_metadata').upsert({
              page_path: `/news/${article.slug}`,
              title: article.title,
              description: article.excerpt || article.title,
              og_image: article.featured_image,
              structured_data: {
                article_schema: articleSchema,
                generated_at: new Date().toISOString()
              }
            }, { onConflict: 'page_path' })
          );
        }
      }
    }

    await Promise.all(schemaPromises);

    // === Ping IndexNow + Google Indexing API in parallel ===
    const [indexNowResult, googleIndexResult] = await Promise.all([
      pingIndexNow(allUrls),
      pingGoogleIndexing(supabaseUrl, allUrls),
    ]);

    // === Store SEO health summary ===
    await supabase.from('seo_metadata').upsert({
      page_path: '/seo-health',
      title: 'SEO Health Dashboard',
      description: 'Latest SEO health metrics',
      structured_data: {
        generated_at: new Date().toISOString(),
        total_urls: mainUrlCount,
        total_images: imageUrlCount,
        total_schemas: uniqueMatches.size + (newsResult.data?.filter(a => a.slug).length || 0),
        total_faqs: faqsResult.data?.length || 0,
        indexnow_status: indexNowResult,
        google_indexing_status: googleIndexResult,
        sitemaps: {
          main: { url_count: mainUrlCount, status: 'valid' },
          image: { url_count: imageUrlCount, status: 'valid' },
          video: { url_count: 0, status: 'valid' },
          index: { sitemap_count: 3, status: 'valid' }
        }
      }
    }, { onConflict: 'page_path' });

    console.log(`Sitemaps generated | Main: ${mainUrlCount} | Images: ${imageUrlCount} | Schemas: ${uniqueMatches.size} | Articles: ${newsResult.data?.filter(a => a.slug).length || 0} | IndexNow: ${indexNowResult.success} | Google: ${googleIndexResult.success}`);

    return new Response(JSON.stringify({
      success: true,
      sitemaps: { main: { url_count: mainUrlCount }, image: { url_count: imageUrlCount }, video: { url_count: 0 } },
      schemas: { sports_events: uniqueMatches.size, articles: newsResult.data?.filter(a => a.slug).length || 0, faqs: faqsByMatch.size },
      indexnow: indexNowResult,
      google_indexing: googleIndexResult,
      generated_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Auto sitemap error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
