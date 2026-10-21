import { handleFootballRequest } from '../src/server/footballHandler';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(request.url);
    const isHighlights = url.pathname.includes('/api/highlights') || url.searchParams.get('type') === 'highlights';
    let params: {
      type?: string;
      league?: string;
      homeTeam?: string;
      awayTeam?: string;
      query?: string;
      date?: string;
    } = {
      type: isHighlights ? 'highlights' : (url.searchParams.get('type') || 'upcoming'),
      league: url.searchParams.get('league') || url.searchParams.get('leagueCode') || undefined,
      homeTeam: url.searchParams.get('homeTeam') || url.searchParams.get('home') || undefined,
      awayTeam: url.searchParams.get('awayTeam') || url.searchParams.get('away') || undefined,
      query: url.searchParams.get('query') || url.searchParams.get('q') || undefined,
      date: url.searchParams.get('date') || undefined,
    };

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      params = {
        ...params,
        ...body,
        type: isHighlights && !body.type ? 'highlights' : (body.type || params.type),
      };
    }

    const data = await handleFootballRequest(params);
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
      JSON.stringify({ success: false, error: err?.message || 'Failed to fetch football data' }),
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
