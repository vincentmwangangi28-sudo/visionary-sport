/**
 * Static Host API Bridge (Render Static Sites / GitHub Pages / Static CDNs)
 *
 * When deployed as a pure Static Site (e.g. Render Static Site where `/* -> /index.html`
 * returns `text/html` for `/api/*` URLs), this bridge transparently intercepts
 * `/api/football`, `/api/highlights`, `/api/health`, `/api/status`, and `/api/keepalive`
 * requests and resolves them in-browser using our CORS-safe ESPN `handleFootballRequest`
 * engine with in-flight request deduplication and 25-second response caching.
 */

let isInstalled = false;
let isStaticHostConfirmed = false;

const responseCache = new Map<string, { timestamp: number; payload: unknown }>();
const inflightRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 25_000;

function parseFootballParamsFromUrl(urlObj: URL): {
  type?: string;
  league?: string;
  eventId?: string;
  homeTeam?: string;
  awayTeam?: string;
  query?: string;
  date?: string;
} {
  const isHighlights =
    urlObj.pathname.includes('/api/highlights') ||
    urlObj.searchParams.get('type') === 'highlights';

  return {
    type: isHighlights ? 'highlights' : urlObj.searchParams.get('type') || 'upcoming',
    league:
      urlObj.searchParams.get('league') ||
      urlObj.searchParams.get('leagueCode') ||
      undefined,
    eventId: urlObj.searchParams.get('eventId') || undefined,
    homeTeam:
      urlObj.searchParams.get('homeTeam') ||
      urlObj.searchParams.get('home') ||
      undefined,
    awayTeam:
      urlObj.searchParams.get('awayTeam') ||
      urlObj.searchParams.get('away') ||
      undefined,
    query:
      urlObj.searchParams.get('query') ||
      urlObj.searchParams.get('q') ||
      undefined,
    date: urlObj.searchParams.get('date') || undefined,
  };
}

async function executeClientFootballHandler(urlObj: URL): Promise<Response> {
  const cacheKey = `${urlObj.pathname}${urlObj.search}`;
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return new Response(JSON.stringify(cached.payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-PredictPro-Bridge': 'static-edge-cache',
      },
    });
  }

  let pending = inflightRequests.get(cacheKey);
  if (!pending) {
    const params = parseFootballParamsFromUrl(urlObj);
    pending = import('@/server/footballHandler')
      .then(({ handleFootballRequest }) => handleFootballRequest(params))
      .then((data) => {
        responseCache.set(cacheKey, { timestamp: Date.now(), payload: data });
        return data;
      })
      .finally(() => {
        inflightRequests.delete(cacheKey);
      });
    inflightRequests.set(cacheKey, pending);
  }

  const result = await pending;
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-PredictPro-Bridge': 'static-edge-direct',
    },
  });
}

export function initStaticHostApiBridge(): void {
  if (isInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }
  isInstalled = true;

  // Skip monkey-patching in AI Studio preview (.run.app) or local Express dev server
  // where backend /api/* routes run natively and window.fetch uses a platform getter.
  const hostname = window.location.hostname || '';
  if (hostname.endsWith('.run.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  const bridgedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let urlString = '';
    try {
      if (typeof input === 'string') {
        urlString = input;
      } else if (input instanceof URL) {
        urlString = input.href;
      } else if (input && typeof input === 'object' && 'url' in input) {
        urlString = input.url;
      }
    } catch {
      return nativeFetch(input, init);
    }

    if (!urlString) {
      return nativeFetch(input, init);
    }

    let urlObj: URL | null = null;
    try {
      urlObj = new URL(urlString, window.location.origin);
    } catch {
      return nativeFetch(input, init);
    }

    // Only intercept same-origin /api/* routes
    if (urlObj.origin !== window.location.origin || !urlObj.pathname.startsWith('/api/')) {
      return nativeFetch(input, init);
    }

    const isFootballOrHighlights =
      urlObj.pathname.startsWith('/api/football') ||
      urlObj.pathname.startsWith('/api/highlights');

    const isHealthOrKeepalive =
      urlObj.pathname === '/api/health' ||
      urlObj.pathname === '/api/status' ||
      urlObj.pathname === '/api/keepalive';

    // If static host is already confirmed, resolve immediately without a redundant network roundtrip
    if (isStaticHostConfirmed) {
      if (isFootballOrHighlights) {
        return executeClientFootballHandler(urlObj);
      }
      if (isHealthOrKeepalive) {
        return new Response(
          JSON.stringify({
            ok: true,
            status: 'healthy',
            mode: 'static_edge_cdn',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }
    }

    // Otherwise perform the native fetch and inspect if the host returned SPA HTML instead of JSON
    try {
      const response = await nativeFetch(input, init);
      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (contentType.includes('text/html') || response.status === 404 || response.status === 405) {
        isStaticHostConfirmed = true;
        if (isFootballOrHighlights) {
          return executeClientFootballHandler(urlObj);
        }
        if (isHealthOrKeepalive) {
          return new Response(
            JSON.stringify({
              ok: true,
              status: 'healthy',
              mode: 'static_edge_cdn',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            }
          );
        }
      }

      return response;
    } catch (err) {
      if (isFootballOrHighlights) {
        return executeClientFootballHandler(urlObj);
      }
      throw err;
    }
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: bridgedFetch,
      configurable: true,
      writable: true,
    });
  } catch {
    // Fallback if window.fetch is non-configurable in a restricted iframe environment
  }
}
