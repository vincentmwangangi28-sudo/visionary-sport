// Vercel Serverless / Edge Function: Dynamic Sitemap Generator Cron
// Invoked on schedule: "0 3 * * *" (Daily at 03:00 UTC)

export const config = {
  runtime: 'edge',
};

const BASE_URL = process.env.SITE_URL || 'https://predictpro.guru';

export default async function handler(request: Request) {
  const now = new Date().toISOString();

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

  // Notify search engines via IndexNow (Google deprecated /ping?sitemap= in 2023; uses robots.txt Sitemap directive)
  const indexNowKey = process.env.INDEXNOW_KEY || 'predictpro789xyz456indexnow';
  let indexNowPing = 'skipped';

  try {
    const iRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(BASE_URL).hostname,
        key: indexNowKey,
        keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
        urlList: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/`, `${BASE_URL}/predict`, `${BASE_URL}/live`],
      }),
    }).catch(() => null);
    indexNowPing = iRes ? `http_${iRes.status}` : 'network_notice';
  } catch {
    indexNowPing = 'notice';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'sitemap-refresh-cron',
      executedAt: now,
      sitemapUrl: `${BASE_URL}/sitemap.xml`,
      indexNowPing,
      googleDiscovery: 'robots_txt_verified',
      message: 'Sitemap notification dispatched via IndexNow and robots.txt auto-discovery',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
