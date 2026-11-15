// Serverless / Edge Endpoint: /api/brave-search
// Proxies Brave Web Search & Brave News Search requests using server-side BRAVE_SEARCH_API_KEY

import { handleBraveSearchRequest } from '../src/server/braveSearchHandler.ts';

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  }

  try {
    const reqUrl = new URL(request.url || '/api/brave-search', 'https://www.predictpro.guru');
    let q = reqUrl.searchParams.get('q') || reqUrl.searchParams.get('query') || undefined;
    let type = reqUrl.searchParams.get('type') || 'all';
    let count = reqUrl.searchParams.get('count') || '8';
    let freshness = reqUrl.searchParams.get('freshness') || undefined;
    let force =
      reqUrl.searchParams.get('force') === 'true' ||
      reqUrl.searchParams.get('refresh') === 'true';

    if (request.method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      q = body.q || body.query || q;
      type = body.type || type;
      count = body.count || count;
      freshness = body.freshness || freshness;
      force = Boolean(body.force || body.refresh || force);
    }

    const data = await handleBraveSearchRequest({
      q,
      type,
      count,
      freshness,
      force,
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Brave Search API handler failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
