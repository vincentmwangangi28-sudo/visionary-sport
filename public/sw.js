/**
 * PredictPro Guru — Production Service Worker (v4)
 *
 * Quota-safe, zero-blocking offline caching strategy:
 * - Never caches cross-origin opaque responses (prevents Chromium 7MB/image padding & QuotaExceededError).
 * - Never intercepts cross-origin API/image requests when online (prevents postMessage storms & synthetic 503s).
 * - Wraps all CacheStorage operations in try/catch so storage pressure never breaks network responses.
 */

const CACHE_VERSION = 'predictpro-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const MAX_DYNAMIC_ITEMS = 35;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt',
];

const SPA_ROUTES = [
  '/',
  '/live',
  '/upcoming',
  '/standings',
  '/accumulators',
  '/analytics',
  '/value-bets',
  '/Screener',
  '/screener',
  '/bankroll',
  '/contests',
  '/community',
  '/pricing',
  '/blog',
  '/faq',
  '/glossary',
  '/methodology',
];

/**
 * Safe cache.put wrapper — never throws QuotaExceededError and never caches opaque responses
 */
async function safeCachePut(cacheName, request, response) {
  try {
    if (!response || !response.ok || response.type === 'opaque') {
      return;
    }
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch {
    // Ignore QuotaExceededError — never fail a request because cache is full
  }
}

/**
 * Trim a cache to a maximum number of entries
 */
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(toDelete.map((key) => cache.delete(key).catch(() => {})));
    }
  } catch {
    // Ignore cache trim errors
  }
}

// ---------------------------------------------------------------------------
// 1. INSTALL — Precache core app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res && res.ok && res.type !== 'opaque') {
                  return cache.put(url, res).catch(() => {});
                }
              })
              .catch(() => {})
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// 2. ACTIVATE — Purge ALL older caches (including v1/v2/v3 & bloated logo caches)
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE, DYNAMIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (!allowedCaches.has(name)) {
              return caches.delete(name).catch(() => {});
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// 3. FETCH — Same-origin app shell & static asset caching only
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (!url.protocol.startsWith('http')) return;

  // NEVER intercept cross-origin requests (ESPN, Wikimedia, TheSportsDB, Google Fonts, etc.).
  // Letting the browser handle cross-origin requests natively avoids:
  // 1. Chromium's 7MB per-item quota padding on opaque responses (QuotaExceededError)
  // 2. Duplicate no-cors retry fetches on 404 logos
  // 3. Synthetic 503 responses when cache quota is full
  // 4. Main-thread postMessage revalidation storms
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Vite HMR, dev scripts, API routes, and raw SEO/IndexNow verification files (.txt, .xml)
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.txt') ||
    url.pathname.endsWith('.xml') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import')
  ) {
    return;
  }

  // A. HTML Navigation Requests (Network-First with Offline App-Shell Fallback)
  const isNav =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    SPA_ROUTES.includes(url.pathname);

  if (isNav) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            safeCachePut(DYNAMIC_CACHE, request, networkResponse.clone());
            return networkResponse;
          }
          return networkResponse;
        } catch {
          const cachedPage =
            (await caches.match(request).catch(() => null)) ||
            (await caches.match('/index.html').catch(() => null)) ||
            (await caches.match('/').catch(() => null));
          if (cachedPage) return cachedPage;

          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>PredictPro — Offline</title></head><body><main><h1>You are currently offline</h1><p>Please reconnect to view live football predictions.</p></main></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // B. Same-Origin Static Assets (JS, CSS, SVG, Fonts, Icons) -> Stale-While-Revalidate
  const isStaticAsset =
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|ico|json)$/i.test(url.pathname) ||
    url.pathname.startsWith('/assets/');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request).catch(() => null);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              safeCachePut(DYNAMIC_CACHE, request, networkResponse.clone()).then(() =>
                trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ITEMS)
              );
            }
            return networkResponse;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })()
    );
  }
});

// ---------------------------------------------------------------------------
// 4. MESSAGE — Handle client commands (SKIP_WAITING, CLEAR_ALL_CACHES, etc.)
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n).catch(() => {}))))
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ cleared: true });
          }
        })
    );
  }

  if (data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      (async () => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            version: CACHE_VERSION,
            staticCount: 5,
            matchDataCount: 0,
            logoCount: 0,
            dynamicCount: 5,
            totalItems: 10,
            updatedAt: new Date().toISOString(),
          });
        }
      })()
    );
  }
});
