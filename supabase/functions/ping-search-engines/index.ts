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

  const indexNowKey = Deno.env.get('INDEXNOW_KEY');
  if (!indexNowKey) {
    return new Response(JSON.stringify({
      success: false,
      pingedAt: new Date().toISOString(),
      error: 'INDEXNOW_KEY not configured. Generate one at https://www.bing.com/indexnow, publish <key>.txt at the site root, then set INDEXNOW_KEY as a Supabase secret.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'predictpro.guru',
        key: indexNowKey,
        keyLocation: `https://predictpro.guru/${indexNowKey}.txt`,
        urlList: [SITEMAP_URL, 'https://predictpro.guru/'],
      }),
    });
    return new Response(JSON.stringify({
      success: res.ok,
      pingedAt: new Date().toISOString(),
      indexNow: { status: res.status },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      pingedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : 'unknown error',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
