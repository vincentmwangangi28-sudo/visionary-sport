/**
 * PredictPro Guru — Production Service Worker (v8)
 *
 * Implements Stale-While-Revalidate (SWR) caching for static assets and match data
 * alongside full PWABuilder & Store Packaging compliance:
 * 1. Stale-While-Revalidate for Static Assets (icons, manifest, widgets, fonts, images, bundles)
 * 2. Stale-While-Revalidate for Match Data & Predictions (/api/football, /api/highlights, Supabase REST)
 *    with background BroadcastChannel + client postMessage revalidation notifications
 * 3. Offline Navigation Support (cached app shell + rich offline HTML fallback)
 * 4. Background Sync ('sync' event listener for queued predictions & betslip sync)
 * 5. Periodic Sync ('periodicsync' event listener for scheduled live score & xG updates)
 * 6. Push Notifications ('push', 'notificationclick', 'pushsubscriptionchange' listeners)
 */

const CACHE_VERSION = 'predictpro-v8';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGES_CACHE = `${CACHE_VERSION}-images`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

const ACTIVE_CACHES = [STATIC_CACHE, IMAGES_CACHE, DATA_CACHE];
const MAX_IMAGE_CACHE_ENTRIES = 80;
const MAX_DATA_CACHE_ENTRIES = 60;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/widgets/banker-template.json',
  '/widgets/banker-data.json',
];

const PRECACHE_MATCH_ENDPOINTS = [
  '/api/football?type=upcoming',
  '/api/football?type=live',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#10B981" />
  <title>PredictPro — Offline Mode</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #060A12;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #0F172A;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      padding: 28px 24px;
    }
    .badge {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #10B981;
      color: #060A12;
      font-weight: 900;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    p { font-size: 13px; color: #94A3B8; line-height: 1.55; margin-bottom: 20px; }
    button {
      background: #10B981;
      color: #060A12;
      border: 0;
      border-radius: 10px;
      padding: 11px 20px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="badge">PP</div>
    <h1>PredictPro Offline Mode</h1>
    <p>Your connection is temporarily offline. Cached Expected Goals (xG) models and match predictions remain available and will revalidate automatically when your network reconnects.</p>
    <button type="button" onclick="window.location.reload()">Retry Connection</button>
  </main>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Helper utilities for Stale-While-Revalidate (SWR) & cache pruning
// ---------------------------------------------------------------------------

/**
 * Trims a cache to a maximum number of entries (FIFO) to keep storage lean.
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const deleteCount = keys.length - maxEntries;
      await Promise.all(
        keys.slice(0, deleteCount).map((key) => cache.delete(key).catch(() => {}))
      );
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Broadcasts match data revalidation events to all open clients and BroadcastChannel
 * so React Query can refresh UI state seamlessly after background SWR updates.
 */
async function notifyClientsMatchDataRevalidated(url, tag = 'stale-while-revalidate') {
  const payload = {
    type: 'MATCH_DATA_REVALIDATED',
    strategy: 'stale-while-revalidate',
    url,
    tag,
    timestamp: new Date().toISOString(),
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('predictpro-match-swr');
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // BroadcastChannel optional
  }

  try {
    const clientList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    clientList.forEach((client) => {
      client.postMessage(payload);
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Determines whether a request URL is a Vite development module that should never be
 * cached by the Service Worker (prevents duplicate React instances in dev mode).
 */
function isViteDevModuleRequest(url) {
  return (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/')
  );
}

/**
 * Determines whether a request targets match data, fixtures, live scores, or predictions.
 */
function isMatchDataRequest(url) {
  if (url.origin === self.location.origin) {
    return (
      url.pathname.startsWith('/api/football') ||
      url.pathname.startsWith('/api/matches') ||
      url.pathname.startsWith('/api/predictions') ||
      url.pathname.startsWith('/api/highlights') ||
      url.pathname.startsWith('/api/offline-matches-snapshot')
    );
  }
  // Supabase REST read queries for predictions, matches, and cached_fixtures
  if (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/')) {
    return (
      url.pathname.includes('/predictions') ||
      url.pathname.includes('/matches') ||
      url.pathname.includes('/cached_fixtures') ||
      url.pathname.includes('/daily_picks')
    );
  }
  return false;
}

/**
 * Determines whether a request targets static assets (production JS/CSS bundles,
 * fonts, icons, manifest, widgets, or team crest images).
 */
function isStaticAssetRequest(url, request) {
  if (isViteDevModuleRequest(url)) return false;

  if (url.origin === self.location.origin) {
    if (
      PRECACHE_ASSETS.includes(url.pathname) ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/widgets/') ||
      /\.(?:js|css|woff2?|ttf|otf|eot|svg|png|jpe?g|webp|avif|ico|json)$/i.test(url.pathname)
    ) {
      return true;
    }
  }

  // External fonts and canonical team crest CDNs
  const destination = request.destination || '';
  if (
    destination === 'font' ||
    destination === 'image' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname.includes('crests.football-data.org') ||
    url.hostname.includes('media.api-sports.io') ||
    url.hostname.includes('a.espncdn.com') ||
    url.hostname.includes('upload.wikimedia.org')
  ) {
    return true;
  }

  return false;
}

/**
 * Stale-While-Revalidate (SWR) handler for Static Assets & Images.
 * Serves cached asset immediately if available while fetching an updated copy
 * in the background to populate STATIC_CACHE or IMAGES_CACHE.
 */
async function staleWhileRevalidateStaticAsset(event, request, url) {
  const isImage =
    request.destination === 'image' ||
    /\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname);
  const targetCacheName =
    isImage && !PRECACHE_ASSETS.includes(url.pathname) ? IMAGES_CACHE : STATIC_CACHE;

  const cache = await caches.open(targetCacheName);
  const cachedResponse = await cache.match(request);

  const networkRevalidatePromise = fetch(request)
    .then(async (networkResponse) => {
      if (
        networkResponse &&
        (networkResponse.status === 200 || networkResponse.type === 'opaque')
      ) {
        await cache.put(request, networkResponse.clone()).catch(() => {});
        if (targetCacheName === IMAGES_CACHE) {
          await trimCache(IMAGES_CACHE, MAX_IMAGE_CACHE_ENTRIES);
        }
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    event.waitUntil(networkRevalidatePromise);
    return cachedResponse;
  }

  const freshResponse = await networkRevalidatePromise;
  if (freshResponse) {
    return freshResponse;
  }

  // Fallback for JSON/widget static files when completely offline and uncached
  if (url.pathname.endsWith('.json')) {
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response('', { status: 504, statusText: 'Offline' });
}

/**
 * Stale-While-Revalidate (SWR) handler for Match Data & Predictions.
 * Immediately returns cached match data/predictions for instant offline & low-latency UX,
 * while revalidating from the network in the background and broadcasting updates.
 */
async function staleWhileRevalidateMatchData(event, request) {
  const cache = await caches.open(DATA_CACHE);
  const cachedResponse = await cache.match(request);

  const revalidatePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        const clone = networkResponse.clone();
        try {
          const bodyBuffer = await clone.arrayBuffer();
          const headers = new Headers(clone.headers);
          headers.set('x-sw-cache-strategy', 'stale-while-revalidate');
          headers.set('x-sw-cached-at', new Date().toISOString());

          const stampedResponse = new Response(bodyBuffer, {
            status: clone.status,
            statusText: clone.statusText,
            headers,
          });

          await cache.put(request, stampedResponse);
          await trimCache(DATA_CACHE, MAX_DATA_CACHE_ENTRIES);
          await notifyClientsMatchDataRevalidated(request.url, 'stale-while-revalidate');
        } catch {
          await cache.put(request, networkResponse.clone()).catch(() => {});
        }
      }
      return networkResponse;
    })
    .catch(() => null);

  // Stale-While-Revalidate: serve cached match payload immediately, revalidate in background
  if (cachedResponse) {
    event.waitUntil(revalidatePromise);
    return cachedResponse;
  }

  // No cached entry yet — wait for network response
  const networkResponse = await revalidatePromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Offline fallback snapshot check
  const snapshotFallback = await cache.match('/api/offline-matches-snapshot');
  if (snapshotFallback) {
    return snapshotFallback;
  }

  return new Response(
    JSON.stringify({
      matches: [],
      data: [],
      offline: true,
      cached: false,
      strategy: 'stale-while-revalidate',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-sw-offline-fallback': 'true',
      },
    }
  );
}

// ---------------------------------------------------------------------------
// 1. INSTALL — Precache app shell, icons, widgets & initial match data
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.allSettled([
      caches.open(STATIC_CACHE).then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res && res.ok && res.type !== 'opaque') {
                  return cache.put(url, res);
                }
              })
              .catch(() => {})
          )
        )
      ),
      caches.open(DATA_CACHE).then((dataCache) =>
        Promise.allSettled(
          PRECACHE_MATCH_ENDPOINTS.map((endpoint) =>
            fetch(endpoint)
              .then((res) => {
                if (res && res.ok) {
                  return dataCache.put(endpoint, res);
                }
              })
              .catch(() => {})
          )
        )
      ),
    ]).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// 2. ACTIVATE — Purge outdated caches & claim clients immediately
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set(ACTIVE_CACHES);

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
// 3. FETCH — Stale-While-Revalidate for Match Data & Static Assets + Offline Nav
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

  // Never intercept Vite dev server HMR or raw source module requests
  if (isViteDevModuleRequest(url)) {
    return;
  }

  // A. Match Data & Predictions API -> Stale-While-Revalidate (DATA_CACHE)
  if (isMatchDataRequest(url)) {
    event.respondWith(staleWhileRevalidateMatchData(event, request));
    return;
  }

  const isNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') || '').includes('text/html');

  // B. HTML Navigation Requests -> Network-First with SWR Shell Update & Offline Fallback
  if (isNavigation && url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches
              .open(STATIC_CACHE)
              .then((cache) => {
                cache.put(request, clone.clone()).catch(() => {});
                if (url.pathname === '/') {
                  cache.put('/', clone).catch(() => {});
                }
              })
              .catch(() => {});
          }
          return networkResponse;
        } catch {
          const cachedResponse =
            (await caches.match(request).catch(() => null)) ||
            (await caches.match('/').catch(() => null)) ||
            (await caches.match('/index.html').catch(() => null));

          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // C. Static Assets (bundles, icons, manifest, widgets, fonts, images) -> Stale-While-Revalidate
  if (isStaticAssetRequest(url, request)) {
    event.respondWith(staleWhileRevalidateStaticAsset(event, request, url));
  }
});

// ---------------------------------------------------------------------------
// 4. BACKGROUND SYNC — Revalidate match data & predictions when back online
// ---------------------------------------------------------------------------
async function syncPredictionsAndFixtures(tag) {
  try {
    const cache = await caches.open(DATA_CACHE);
    await Promise.allSettled(
      PRECACHE_MATCH_ENDPOINTS.map(async (endpoint) => {
        const response = await fetch(endpoint, { cache: 'no-store' });
        if (response && response.ok) {
          await cache.put(endpoint, response.clone());
        }
      })
    );
    await notifyClientsMatchDataRevalidated('/api/football', tag);
  } catch {
    // Will retry on next connectivity window
  }
}

self.addEventListener('sync', (event) => {
  if (
    event.tag === 'predictpro-sync-predictions' ||
    event.tag === 'sync-predictions' ||
    event.tag === 'sync-betslip' ||
    event.tag
  ) {
    event.waitUntil(syncPredictionsAndFixtures(event.tag));
  }
});

// ---------------------------------------------------------------------------
// 5. PERIODIC BACKGROUND SYNC — Refresh live scores & daily xG in background
// ---------------------------------------------------------------------------
self.addEventListener('periodicsync', (event) => {
  if (
    event.tag === 'predictpro-periodic-live-scores' ||
    event.tag === 'content-sync' ||
    event.tag === 'update-predictions' ||
    event.tag
  ) {
    event.waitUntil(syncPredictionsAndFixtures(event.tag));
  }
});

// ---------------------------------------------------------------------------
// 6. PUSH NOTIFICATIONS — Live Goal Alerts, 80%+ Banker Drops & Steam Alerts
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {
    title: 'PredictPro Live Football Alert',
    body: 'New 80%+ consensus match forecast and live Expected Goals (xG) update available.',
    icon: '/icon-192.png',
    badge: '/favicon-48x48.png',
    url: '/live',
    tag: 'predictpro-live-alert',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || parsed.message || payload.body,
        icon: parsed.icon || payload.icon,
        badge: parsed.badge || payload.badge,
        url: parsed.url || (parsed.data && parsed.data.url) || payload.url,
        tag: parsed.tag || payload.tag,
      };
    } catch {
      try {
        const text = event.data.text();
        if (text) payload.body = text;
      } catch {
        // use default payload
      }
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    renotify: true,
    vibrate: [150, 80, 150],
    data: {
      url: payload.url,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'View Match & xG' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/live';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .getSubscription()
      .then((subscription) => {
        if (!subscription) return;
        return fetch('/api/notifications/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        }).catch(() => {});
      })
      .catch(() => {})
  );
});

// ---------------------------------------------------------------------------
// 7. MESSAGE — Handle client commands (SWR revalidation, cache stats, cleanup)
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'TRIGGER_SYNC' || data.type === 'REVALIDATE_MATCH_DATA') {
    event.waitUntil(syncPredictionsAndFixtures('manual-swr-revalidation'));
  }

  if (data.type === 'PREWARM_OFFLINE_CACHES') {
    const urls = Array.isArray(data.urls) ? data.urls.slice(0, 40) : [];
    event.waitUntil(
      Promise.allSettled([
        syncPredictionsAndFixtures('prewarm-match-data'),
        caches.open(IMAGES_CACHE).then((imgCache) =>
          Promise.allSettled(
            urls.map((logoUrl) =>
              fetch(logoUrl, { mode: 'no-cors' })
                .then((res) => {
                  if (res) return imgCache.put(logoUrl, res);
                })
                .catch(() => {})
            )
          )
        ),
      ])
    );
  }

  if (data.type === 'CLEAR_STALE_CACHE') {
    const allowed = new Set(ACTIVE_CACHES);
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names.map((name) => (!allowed.has(name) ? caches.delete(name).catch(() => {}) : null))
          )
        )
    );
  }

  if (data.type === 'CLEAR_CACHE_CATEGORY') {
    const category = data.category;
    event.waitUntil(
      (async () => {
        if (category === 'images') {
          await caches.delete(IMAGES_CACHE).catch(() => {});
        } else if (category === 'data') {
          await caches.delete(DATA_CACHE).catch(() => {});
        } else if (category === 'all') {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n).catch(() => {})));
        }
      })()
    );
  }

  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(names.map((n) => caches.delete(n).catch(() => {})))
        )
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ cleared: true });
          }
        })
    );
  }

  if (data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      Promise.all([
        caches.open(STATIC_CACHE).then((c) => c.keys()),
        caches.open(IMAGES_CACHE).then((c) => c.keys()),
        caches.open(DATA_CACHE).then((c) => c.keys()),
      ]).then(([staticKeys, imageKeys, dataKeys]) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            version: CACHE_VERSION,
            strategy: 'stale-while-revalidate',
            staticCount: staticKeys.length,
            logoCount: imageKeys.length,
            matchDataCount: dataKeys.length,
            dynamicCount: dataKeys.length,
            totalItems: staticKeys.length + imageKeys.length + dataKeys.length,
            updatedAt: new Date().toISOString(),
          });
        }
      })
    );
  }
});
