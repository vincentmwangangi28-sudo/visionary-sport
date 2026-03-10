import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://predictpro.guru';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const feedType = url.searchParams.get('type') || 'news';

    let items = '';

    if (feedType === 'news') {
      const { data: articles } = await supabase
        .from('news_articles')
        .select('title, slug, excerpt, category, created_at, author, featured_image')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (articles) {
        for (const article of articles) {
          items += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${BASE_URL}/news/${article.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/news/${article.slug}</guid>
      <description>${escapeXml(article.excerpt || article.title)}</description>
      <category>${escapeXml(article.category)}</category>
      <author>${escapeXml(article.author || 'PredictPro AI')}</author>
      <pubDate>${new Date(article.created_at).toUTCString()}</pubDate>${article.featured_image ? `
      <enclosure url="${escapeXml(article.featured_image)}" type="image/jpeg" />` : ''}
    </item>`;
        }
      }
    } else if (feedType === 'predictions') {
      const { data: predictions } = await supabase
        .from('predictions')
        .select('match_id, home_team, away_team, league, prediction, confidence, match_date, created_at')
        .eq('is_premium', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (predictions) {
        for (const pred of predictions) {
          const title = `${pred.home_team} vs ${pred.away_team} - ${pred.prediction}`;
          items += `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${BASE_URL}/match/${pred.match_id}</link>
      <guid isPermaLink="true">${BASE_URL}/match/${pred.match_id}</guid>
      <description>${escapeXml(`${pred.league}: ${pred.prediction} (${pred.confidence}% confidence)`)}</description>
      <category>${escapeXml(pred.league)}</category>
      <pubDate>${new Date(pred.created_at).toUTCString()}</pubDate>
    </item>`;
        }
      }
    }

    const feedTitle = feedType === 'news' ? 'PredictPro - Sports News Kenya' : 'PredictPro - AI Predictions';
    const feedDesc = feedType === 'news'
      ? 'Latest sports news and analysis from PredictPro Kenya'
      : 'AI-powered sports predictions with 85%+ accuracy';

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${BASE_URL}</link>
    <description>${feedDesc}</description>
    <language>en-KE</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>${feedTitle}</title>
      <link>${BASE_URL}</link>
    </image>${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate RSS feed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
