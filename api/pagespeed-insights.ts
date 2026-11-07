import {
  handlePageSpeedInsightsRequest,
  PageSpeedStrategy,
} from '../src/server/pagespeedHandler';

export default async function handler(request: Request) {
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

  try {
    const reqUrl = new URL(request.url);
    let body: Record<string, any> = {};
    if (request.method === 'POST') {
      body = await request.json().catch(() => ({}));
    }

    const strategyRaw = String(
      reqUrl.searchParams.get('strategy') ||
        reqUrl.searchParams.get('form_factor') ||
        body.strategy ||
        'mobile'
    ).toLowerCase();
    const strategy: PageSpeedStrategy =
      strategyRaw === 'desktop' ? 'desktop' : 'mobile';
    const url = String(
      reqUrl.searchParams.get('url') || body.url || 'https://predictpro.guru'
    );
    const force =
      reqUrl.searchParams.get('force') === 'true' ||
      reqUrl.searchParams.get('force') === '1' ||
      Boolean(body.force);

    const result = await handlePageSpeedInsightsRequest({
      url,
      strategy,
      force,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to run PageSpeed Insights audit',
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
