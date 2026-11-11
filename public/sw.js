/**
 * PredictPro Guru — Production Service Worker (v5)
 *
 * Lightweight, zero-overhead service worker:
 * - Never intercepts online HTML navigation requests (eliminates sw.js:173 Fetch failed loading logs
 *   and navigation preload / redirect race conditions).
 * - Never intercepts cross-origin requests or API routes.
 * - Provides an instant offline HTML fallback ONLY when the browser is actually offline.
 */

const CACHE_VERSION = 'predictpro-v7';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_ASSETS = [
  '/favicon.svg',
];

// ---------------------------------------------------------------------------
// 1. INSTALL — Precache minimal offline shell metadata
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url)
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
// 2. ACTIVATE — Purge ALL older caches (v1, v2, v3, v4, v5)
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE]);

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
// 3. FETCH — Block Netlify HUD watermark & provide offline navigation fallback
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

  // Block Netlify-injected HUD / Collaborative Drawer watermark scripts
  if (url.pathname.startsWith('/.netlify/scripts/')) {
    event.respondWith(
      new Response('/* blocked */', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      })
    );
    return;
  }

  // When online, let the browser and Netlify CDN (immutable /assets/* caching) handle all requests natively.
  if (self.navigator && self.navigator.onLine !== false) {
    return;
  }

  if (url.origin !== self.location.origin) return;

  const isNav =
    request.mode === 'navigate' ||
    request.destination === 'document';

  if (isNav) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cachedPage =
            (await caches.match(request).catch(() => null)) ||
            (await caches.match('/index.html').catch(() => null)) ||
            (await caches.match('/').catch(() => null));
          if (cachedPage) return cachedPage;

          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PredictPro — Offline</title></head><body style="font-family:system-ui,sans-serif;background:#090d16;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;"><main><h1>You are currently offline</h1><p>Please check your connection to view live football predictions and xG analytics.</p></main></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
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
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_VERSION,
        staticCount: 2,
        matchDataCount: 0,
        logoCount: 0,
        dynamicCount: 0,
        totalItems: 2,
        updatedAt: new Date().toISOString(),
      });
    }
  }
});
