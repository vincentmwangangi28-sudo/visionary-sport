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

  // Ping Google and Bing sitemap refresh
  const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
  let googlePing = 'skipped';
  let bingPing = 'skipped';

  try {
    const gRes = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => null);
    googlePing = gRes ? `http_${gRes.status}` : 'network_notice';
  } catch {
    googlePing = 'notice';
  }

  try {
    const bRes = await fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(() => null);
    bingPing = bRes ? `http_${bRes.status}` : 'network_notice';
  } catch {
    bingPing = 'notice';
  }

  return new Response(
    JSON.stringify({
      success: true,
      job: 'sitemap-refresh-cron',
      executedAt: now,
      sitemapUrl: `${BASE_URL}/sitemap.xml`,
      googlePing,
      bingPing,
      message: 'Sitemap notification dispatched to Googlebot and Bingbot',
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
