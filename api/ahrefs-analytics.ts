import {
  handleAhrefsAnalyticsRequest,
  DEFAULT_AHREFS_PROJECT_ID,
  DEFAULT_AHREFS_FROM,
  DEFAULT_AHREFS_TO,
} from '../src/server/ahrefsAnalyticsHandler';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(request.url);
    let project_id: string | number =
      url.searchParams.get('project_id') || DEFAULT_AHREFS_PROJECT_ID;
    let from = url.searchParams.get('from') || DEFAULT_AHREFS_FROM;
    let to = url.searchParams.get('to') || DEFAULT_AHREFS_TO;

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body.project_id) project_id = body.project_id;
      if (body.from) from = body.from;
      if (body.to) to = body.to;
    }

    const data = await handleAhrefsAnalyticsRequest({ project_id, from, to });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to fetch Ahrefs Web Analytics v3 stats',
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
