// Vercel Edge Middleware
// 1. Serves RFC 8288 / RFC 9727 Link headers for agent discovery on all HTML/Markdown responses
// 2. Implements Markdown for Agents content negotiation (Accept: text/markdown)
// 3. Ensures extensionless /.well-known/* discovery endpoints and /mcp return proper Content-Type
import { next } from '@vercel/edge';
import { buildLinkHeader, buildMarkdownForRoute, handleMcpJsonRpc } from './src/server/agentDiscovery';

export const config = {
  matcher: ['/((?!_vercel|assets|.*\\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$).*)'],
};

const CANONICAL: Record<string, string> = {
  '/':                             'https://predictpro.guru/',
  '/premier-league-predictions':   'https://predictpro.guru/premier-league-predictions',
  '/champions-league-predictions': 'https://predictpro.guru/champions-league-predictions',
  '/la-liga-predictions':          'https://predictpro.guru/la-liga-predictions',
  '/bundesliga-predictions':       'https://predictpro.guru/bundesliga-predictions',
  '/serie-a-predictions':          'https://predictpro.guru/serie-a-predictions',
  '/ligue-1-predictions':          'https://predictpro.guru/ligue-1-predictions',
  '/kpl-predictions':              'https://predictpro.guru/kpl-predictions',
  '/jackpot-predictions':          'https://predictpro.guru/jackpot-predictions',
  '/us-soccer-predictions':        'https://predictpro.guru/us-soccer-predictions',
  '/btts':                         'https://predictpro.guru/btts',
  '/correct-score':                'https://predictpro.guru/correct-score',
  '/value-bets':                   'https://predictpro.guru/value-bets',
  '/live-scores':                  'https://predictpro.guru/live-scores',
  '/standings':                    'https://predictpro.guru/standings',
  '/upcoming':                     'https://predictpro.guru/upcoming',
  '/recommendations':              'https://predictpro.guru/recommendations',
  '/blog':                         'https://predictpro.guru/blog',
  '/pricing':                      'https://predictpro.guru/pricing',
  '/about':                        'https://predictpro.guru/about',
  '/responsible-gaming':           'https://predictpro.guru/responsible-gaming',
  '/disclaimer':                   'https://predictpro.guru/responsible-gaming',
  '/sitemap':                      'https://predictpro.guru/sitemap',
};

export default async function middleware(request: Request) {
  const url     = new URL(request.url);
  const rawPath = url.pathname;
  const path    = rawPath.replace(/\/$/, '') || '/';
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  const proto   = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');

  if (
    (url.hostname === 'predictpro.guru' && proto === 'http') ||
    url.hostname === 'www.predictpro.guru'
  ) {
    const targetUrl = `https://predictpro.guru${url.pathname}${url.search}`;
    return Response.redirect(targetUrl, 301);
  }

  // Health & Status Endpoint for RFC 9727 API Catalog
  if (path === '/api/health' || path === '/api/status') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'PredictPro.guru Quantitative Football Analytics',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  }

  // MCP Streamable HTTP Endpoint (/mcp) & A2A JSON-RPC Endpoint (/api/a2a)
  if (path === '/mcp' || path === '/api/a2a') {
    let bodyObj: any = {};
    if (request.method === 'POST') {
      try {
        bodyObj = await request.json();
      } catch {
        bodyObj = {};
      }
    }
    return new Response(JSON.stringify(handleMcpJsonRpc(bodyObj)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Pass through static discovery files in /.well-known/*, /auth.md, /openapi.json, /llms*.txt
  if (
    rawPath.startsWith('/.well-known/') ||
    rawPath === '/auth.md' ||
    rawPath === '/openapi.json' ||
    rawPath === '/llms.txt' ||
    rawPath === '/llms-full.txt'
  ) {
    const res = next();
    res.headers.set('Access-Control-Allow-Origin', '*');
    if (rawPath === '/.well-known/api-catalog') {
      res.headers.set('Content-Type', 'application/linkset+json; charset=utf-8');
    } else if (rawPath === '/auth.md' || rawPath.endsWith('.md')) {
      res.headers.set('Content-Type', 'text/markdown; charset=utf-8');
    } else if (rawPath.endsWith('.txt')) {
      res.headers.set('Content-Type', 'text/plain; charset=utf-8');
    } else if (!rawPath.endsWith('.zone')) {
      res.headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    return res;
  }

  const canonical = CANONICAL[path] ?? `https://predictpro.guru${path}`;
  const linkHeader = buildLinkHeader(canonical);

  // Markdown for Agents content negotiation (Accept: text/markdown)
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (accept.includes('text/markdown') && !rawPath.startsWith('/api/')) {
    const { markdown, tokens } = buildMarkdownForRoute(path);
    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'X-Markdown-Tokens': String(tokens),
        'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
        'Link': linkHeader,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  const response = next();

  response.headers.append(
    'Set-Cookie',
    `pp_country=${country}; Path=/; Max-Age=86400; SameSite=Lax`,
  );

  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  response.headers.set('Vary', 'Accept');
  response.headers.set('Content-Signal', 'ai-train=yes, search=yes, ai-input=yes');
  response.headers.set('Link', linkHeader);

  return response;
}
