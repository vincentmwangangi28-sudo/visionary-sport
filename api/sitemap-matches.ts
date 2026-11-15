// Serverless / Edge Handler: Automated Dynamic Match Sitemap Generator (/sitemap-matches.xml & /api/sitemap-matches)
// Crawls active match slugs from Supabase (predictions & matches tables) + active matchday slate
// and publishes canonical /predict/<slug> URLs in Sitemaps XML 0.9 + Google Image Sitemap 1.1 format.

import {
  buildDynamicMatchesSitemapXml,
  resolveLiveMatchSlugs,
} from '../src/server/seoPrerenderService.ts';

const BASE_URL = process.env.SITE_URL || 'https://www.predictpro.guru';

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    });
  }

  try {
    const reqUrl = new URL(request.url || '/sitemap-matches.xml', BASE_URL);
    const forceRefresh =
      reqUrl.searchParams.get('refresh') === 'true' ||
      reqUrl.searchParams.get('force') === 'true' ||
      reqUrl.searchParams.get('force') === '1';
    const format = (reqUrl.searchParams.get('format') || 'xml').toLowerCase();

    if (format === 'json') {
      const liveMatches = await resolveLiveMatchSlugs(BASE_URL, {
        forceRefresh,
        crawlSupabase: true,
      });
      return new Response(
        JSON.stringify(
          {
            success: true,
            endpoint: '/sitemap-matches.xml',
            baseUrl: BASE_URL,
            generatedAt: new Date().toISOString(),
            totalActiveMatchSlugs: liveMatches.length,
            matches: liveMatches,
          },
          null,
          2
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const xml = await buildDynamicMatchesSitemapXml(BASE_URL, {
      forceRefresh,
      crawlSupabase: true,
      persistToPublic: true,
    });

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, s-maxage=1800, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'all',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to generate dynamic /sitemap-matches.xml',
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
