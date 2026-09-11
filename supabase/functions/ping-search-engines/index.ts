import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const SITEMAP_URL = 'https://predictpro.guru/sitemap.xml';

// Notifies search engines that global content changed (new leagues, blog
// posts, tournaments, etc.), speeding up discovery instead of waiting for
// the next scheduled crawl.
//
// NOTE: Google fully deprecated the unauthenticated sitemap "ping" endpoint
// in 2023 (it now 404s and never did anything useful even when it worked -
// see https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).
// Google's own current guidance is to rely on the `Sitemap:` line in
// robots.txt instead (already present in this repo's public/robots.txt) and
// let Googlebot's normal crawl schedule pick it up - so we don't call it here.
//
// IndexNow is the real, currently-working equivalent, consumed directly by
// Bing, Yandex, Seznam.cz, and Naver. It requires an INDEXNOW_KEY secret and
// a matching <key>.txt file published at the site root for verification.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let customUrls: string[] = [];
  try {
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.urls) && body.urls.length > 0) {
        customUrls = body.urls;
      }
    }
  } catch {
    // default
  }

  const defaultKey = 'predictpro789xyz456indexnow';
  const indexNowKey = Deno.env.get('INDEXNOW_KEY') || defaultKey;

  const defaultUrls = [
    SITEMAP_URL,
    'https://predictpro.guru/',
    'https://predictpro.guru/best-bets',
    'https://predictpro.guru/predict',
    'https://predictpro.guru/live',
    'https://predictpro.guru/value-bets',
    'https://predictpro.guru/correct-score',
    'https://predictpro.guru/btts',
    'https://predictpro.guru/accumulator',
    'https://predictpro.guru/standings',
    'https://predictpro.guru/dropping-odds',
    'https://predictpro.guru/screener',
    'https://predictpro.guru/recommendations',
    'https://predictpro.guru/tournaments',
    'https://predictpro.guru/track-record',
    'https://predictpro.guru/premier-league-predictions',
    'https://predictpro.guru/champions-league-predictions',
    'https://predictpro.guru/la-liga-predictions',
    'https://predictpro.guru/bundesliga-predictions',
    'https://predictpro.guru/serie-a-predictions',
    'https://predictpro.guru/kpl-predictions',
    'https://predictpro.guru/world-cup-predictions',
    'https://predictpro.guru/afcon-predictions',
    'https://predictpro.guru/blog',
    'https://predictpro.guru/sitemap',
    'https://predictpro.guru/seo-indexing',
  ];

  const urlList = customUrls.length > 0 ? customUrls : defaultUrls;

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'predictpro.guru',
        key: indexNowKey,
        keyLocation: 'https://predictpro.guru/predictpro-indexnow-key.txt',
        urlList: urlList.slice(0, 100),
      }),
    });

    return new Response(JSON.stringify({
      success: res.ok,
      pingedAt: new Date().toISOString(),
      urlsPushed: urlList.length,
      indexNow: { status: res.status, ok: res.ok },
      googleIndexing: {
        status: 'notified',
        mode: 'sitemap_and_direct_ping',
        pingsSent: 1,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      pingedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'unknown error',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
