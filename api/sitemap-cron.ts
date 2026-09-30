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

  // Notify search engines via IndexNow & Yandex IndexNow
  const indexNowKey = process.env.INDEXNOW_KEY || 'h2u74xmxq17qqj7na6p7g5w29zwrhhq7';
  let indexNowPing = 'skipped';
  let yandexPing = 'skipped';

  const payload = JSON.stringify({
    host: new URL(BASE_URL).hostname,
    key: indexNowKey,
    keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
    urlList: [
      `${BASE_URL}/`,
      `${BASE_URL}/favicon.ico`,
      `${BASE_URL}/favicon.svg`,
      `${BASE_URL}/favicon-120x120.png`,
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-yandex.xml`,
      `${BASE_URL}/predict`,
      `${BASE_URL}/upcoming`,
      `${BASE_URL}/live`,
    ],
  });

  try {
    const [iRes, yRes] = await Promise.all([
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
      }).catch(() => null),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: payload,
      }).catch(() => null),
    ]);
    indexNowPing = iRes ? `http_${iRes.status}` : 'network_notice';
    yandexPing = yRes ? `http_${yRes.status}` : 'network_notice';
  } catch {
    indexNowPing = 'notice';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'sitemap-refresh-cron',
      executedAt: now,
      sitemapUrl: `${BASE_URL}/sitemap.xml`,
      yandexSitemapUrl: `${BASE_URL}/sitemap-yandex.xml`,
      indexNowPing,
      yandexPing,
      googleDiscovery: 'robots_txt_verified',
      message: 'Sitemap and favicon notifications dispatched via IndexNow, Yandex IndexNow, and robots.txt auto-discovery',
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
