// Vercel Serverless / Edge Function for Google Crawl & Search Engine Indexing Cron
// Invoked on schedule: "0 */2 * * *" (Every 2 hours)

export const config = {
  runtime: 'edge',
};

const BASE_URL = 'https://predictpro.guru';
const INDEXNOW_KEY = 'predictpro789xyz456indexnow';
const SUPABASE_PING_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co/functions/v1/ping-search-engines';

const PRIORITY_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/best-bets`,
  `${BASE_URL}/predict`,
  `${BASE_URL}/live`,
  `${BASE_URL}/value-bets`,
  `${BASE_URL}/correct-score`,
  `${BASE_URL}/btts`,
  `${BASE_URL}/accumulator`,
  `${BASE_URL}/standings`,
  `${BASE_URL}/dropping-odds`,
  `${BASE_URL}/screener`,
  `${BASE_URL}/recommendations`,
  `${BASE_URL}/tournaments`,
  `${BASE_URL}/track-record`,
  `${BASE_URL}/premier-league-predictions`,
  `${BASE_URL}/champions-league-predictions`,
  `${BASE_URL}/la-liga-predictions`,
  `${BASE_URL}/bundesliga-predictions`,
  `${BASE_URL}/serie-a-predictions`,
  `${BASE_URL}/kpl-predictions`,
  `${BASE_URL}/world-cup-predictions`,
  `${BASE_URL}/afcon-predictions`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/methodology`,
  `${BASE_URL}/sitemap`,
  `${BASE_URL}/seo-indexing`
];

export default async function handler(request: Request) {
  const now = new Date().toISOString();

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  let indexNowStatus = 'skipped';
  let supabaseStatus = 'skipped';

  // 1. Submit to IndexNow (Bing, Yandex, Seznam, Naver)
  try {
    const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: 'predictpro.guru',
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/predictpro-indexnow-key.txt`,
        urlList: PRIORITY_URLS,
      }),
    });
    indexNowStatus = `http_${indexNowRes.status}`;
  } catch (err) {
    indexNowStatus = err instanceof Error ? err.message : 'error';
  }

  // 2. Trigger Supabase Edge Function to maintain search engine ping records
  try {
    const edgeRes = await fetch(SUPABASE_PING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: PRIORITY_URLS }),
    });
    supabaseStatus = `http_${edgeRes.status}`;
  } catch (err) {
    supabaseStatus = err instanceof Error ? err.message : 'error';
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Google crawl and search engine indexing cycle executed',
      executedAt: now,
      targetDomain: BASE_URL,
      urlsProcessed: PRIORITY_URLS.length,
      cronSchedule: '0 */2 * * * (Every 2 Hours)',
      indexNow: indexNowStatus,
      supabasePing: supabaseStatus,
      googlebotDirective: 'Sitemap in robots.txt actively declared & pinged',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
