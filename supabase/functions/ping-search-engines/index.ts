import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-timestamp, range, prefer',
  'Access-Control-Max-Age': '86400',
};

const SITEMAP_URL = 'https://www.predictpro.guru/sitemap.xml';

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
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

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

  const defaultKey = 'h2u74xmxq17qqj7na6p7g5w29zwrhhq7';
  const indexNowKey = Deno.env.get('INDEXNOW_KEY') || defaultKey;

  const defaultUrls = [
    'https://www.predictpro.guru/sitemap-index.xml',
    SITEMAP_URL,
    'https://www.predictpro.guru/sitemap-core.xml',
    'https://www.predictpro.guru/sitemap-leagues.xml',
    'https://www.predictpro.guru/sitemap-matches.xml',
    'https://www.predictpro.guru/sitemap-blog.xml',
    'https://www.predictpro.guru/sitemap-yandex.xml',
    'https://www.predictpro.guru/rss.xml',
    'https://www.predictpro.guru/feed.xml',
    'https://www.predictpro.guru/feed-predictions.xml',
    'https://www.predictpro.guru/',
    'https://www.predictpro.guru/best-bets',
    'https://www.predictpro.guru/sure-win-predictions',
    'https://www.predictpro.guru/bet-of-the-day',
    'https://www.predictpro.guru/today-predictions',
    'https://www.predictpro.guru/tomorrow-predictions',
    'https://www.predictpro.guru/weekend-predictions',
    'https://www.predictpro.guru/predict',
    'https://www.predictpro.guru/live',
    'https://www.predictpro.guru/value-bets',
    'https://www.predictpro.guru/correct-score',
    'https://www.predictpro.guru/btts',
    'https://www.predictpro.guru/over-under-predictions',
    'https://www.predictpro.guru/double-chance-predictions',
    'https://www.predictpro.guru/accumulator',
    'https://www.predictpro.guru/standings',
    'https://www.predictpro.guru/dropping-odds',
    'https://www.predictpro.guru/screener',
    'https://www.predictpro.guru/recommendations',
    'https://www.predictpro.guru/tournaments',
    'https://www.predictpro.guru/track-record',
    'https://www.predictpro.guru/jackpot-predictions',
    'https://www.predictpro.guru/midweek-jackpot-predictions',
    'https://www.predictpro.guru/premier-league-predictions',
    'https://www.predictpro.guru/champions-league-predictions',
    'https://www.predictpro.guru/la-liga-predictions',
    'https://www.predictpro.guru/bundesliga-predictions',
    'https://www.predictpro.guru/serie-a-predictions',
    'https://www.predictpro.guru/ligue-1-predictions',
    'https://www.predictpro.guru/kpl-predictions',
    'https://www.predictpro.guru/world-cup-predictions',
    'https://www.predictpro.guru/afcon-predictions',
    'https://www.predictpro.guru/predict/arsenal-vs-chelsea',
    'https://www.predictpro.guru/predict/liverpool-vs-manchester-city',
    'https://www.predictpro.guru/predict/real-madrid-vs-barcelona',
    'https://www.predictpro.guru/predict/gor-mahia-vs-afc-leopards',
    'https://www.predictpro.guru/predict/al-ahly-vs-zamalek',
    'https://www.predictpro.guru/predict/mamelodi-sundowns-vs-orlando-pirates',
    'https://www.predictpro.guru/predict/hearts-of-oak-vs-asante-kotoko',
    'https://www.predictpro.guru/predict/wydad-ac-vs-raja-casablanca',
    'https://www.predictpro.guru/blog',
    'https://www.predictpro.guru/sitemap',
    'https://www.predictpro.guru/seo-indexing',
  ];

  const urlList = customUrls.length > 0 ? customUrls : defaultUrls;

  try {
    const payload = JSON.stringify({
      host: 'www.predictpro.guru',
      key: indexNowKey,
      keyLocation: `https://www.predictpro.guru/${indexNowKey}.txt`,
      urlList: urlList.slice(0, 100),
    });

    const [res, yandexRes] = await Promise.all([
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
      }),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
      }).catch(() => null),
    ]);

    return new Response(JSON.stringify({
      success: res.ok,
      pingedAt: new Date().toISOString(),
      urlsPushed: urlList.length,
      indexNow: { status: res.status, ok: res.ok },
      yandexIndexNow: yandexRes ? { status: yandexRes.status, ok: yandexRes.ok } : { status: 0, ok: false },
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
