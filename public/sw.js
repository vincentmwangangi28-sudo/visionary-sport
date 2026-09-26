// PredictPro Service Worker v10 - Strict MIME, SEO & Agentic Crawler Fast-Path
const CACHE_VERSION = 'v10';
const CACHE_STATIC = `predictpro-static-${CACHE_VERSION}`;
const CACHE_IMAGES = `predictpro-images-${CACHE_VERSION}`;
const CACHE_DATA = `predictpro-data-${CACHE_VERSION}`;

const ALL_CACHES = [CACHE_STATIC, CACHE_IMAGES, CACHE_DATA];
const MAX_IMAGE_CACHE_ENTRIES = 250;

// Essential static shell assets to pre-cache on install
const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/robots.txt',
  '/llms.txt',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/icon-192.png',
  '/icon-512.png',
];

const ROBOTS_TXT_FALLBACK = `# PredictPro Robots.txt & Search Engine Directives
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_vercel/

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://predictpro.guru/sitemap.xml
`;

const LLMS_TXT_FALLBACK = `# PredictPro — AI Football Predictions

> PredictPro (https://predictpro.guru) is an AI-powered football prediction and quantitative sports analytics platform providing daily match predictions, Expected Goals (xG) models, bivariate Poisson scorelines, +EV value bets, 17-game jackpot picks, live scores, and league standings across 40+ global competitions.

## Core Prediction Markets

- [Today's AI Football Predictions](https://predictpro.guru/): Daily AI match predictions, confidence scores, and live fixtures across 40+ global leagues.
- [Best Banker Bets Today](https://predictpro.guru/best-bets): High-confidence (75%+ to 92%) 1X2 straight win and Double Chance banker selections.
- [Daily Value Bets (+EV)](https://predictpro.guru/value-bets): Positive Expected Value wagers where AI Poisson probability exceeds bookmaker implied odds.
- [BTTS & Over 2.5 Goals Predictions](https://predictpro.guru/btts): Both Teams to Score and Over/Under 2.5 goal expectancy tips.
- [Exact Correct Score Predictions](https://predictpro.guru/correct-score): Bivariate Poisson 90-minute scoreline probability matrices.
- [Smart Accumulator Builder](https://predictpro.guru/accumulator): Low-correlation 3-fold and 5-fold multibet slip generator.

## League Prediction Hubs

- [English Premier League Predictions](https://predictpro.guru/premier-league-predictions): AI match previews, xG stats, and odds for every EPL fixture.
- [UEFA Champions League Predictions](https://predictpro.guru/champions-league-predictions): 36-team league phase and knockout tie AI predictions.
- [Spanish La Liga Predictions](https://predictpro.guru/la-liga-predictions): Tactical match forecasts and value picks for La Liga.
- [German Bundesliga Predictions](https://predictpro.guru/bundesliga-predictions): High-tempo Over 2.5 goals, BTTS, and 1X2 Bundesliga tips.
- [Italian Serie A Predictions](https://predictpro.guru/serie-a-predictions): Defensive xGA and match outcome forecasts for Serie A.
- [FKF Kenya Premier League Predictions](https://predictpro.guru/kpl-predictions): Kenyan Premier League match predictions and M-Pesa VIP tips.
- [17-Game Mega Jackpot Predictions](https://predictpro.guru/jackpot-predictions): SportPesa Mega Jackpot and Betika Midweek banker and Double Chance combinations.
- [US Soccer & MLS Predictions](https://predictpro.guru/us-soccer-predictions): Major League Soccer moneyline (+/-), goal spreads, and AI picks.
`;

// Domains hosting official team logos & match media
const TRUSTED_IMAGE_HOSTS = [
  'a.espncdn.com',
  'upload.wikimedia.org',
  'media.api-sports.io',
  'api-football.com',
  'images.unsplash.com',
];

// Third-party analytics, ads, and auth origins that must NEVER be intercepted by the Service Worker
const BYPASS_EXTERNAL_HOSTS = [
  'clarity.ms',
  'googletagmanager.com',
  'google-analytics.com',
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'adtrafficquality.google',
  'google.com',
  'google.co.ke',
  'accounts.google.com',
  'ahrefs.com',
];

// Helper: Trim cache to avoid unbounded growth
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    }
  } catch (err) {
    // Non-critical cache maintenance
  }
}

// 1. Installation: Pre-cache core shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async cache => {
      try {
        await cache.addAll(STATIC_SHELL_ASSETS);
      } catch (err) {
        console.warn('[SW] Core asset pre-cache finished with partial matches:', err);
      }
    })
  );
});

// 2. Activation: Clean up older cache versions immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (!ALL_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Check if request is for compiled JS/CSS/Wasm/Font static code bundles
function isStaticCodeOrStyleAsset(request, url) {
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    return true;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/src/')) {
    return true;
  }
  return /\.(js|mjs|cjs|ts|tsx|css|wasm|map|woff2?|ttf|eot)(\?.*)?$/i.test(url.pathname);
}

// Check if request is for third-party analytics/ad tracking beacons
function isBypassedExternalHost(url) {
  if (url.origin === self.location.origin) return false;
  return BYPASS_EXTERNAL_HOSTS.some(
    host => url.hostname === host || url.hostname.endsWith('.' + host)
  );
}

// Check if request is for team logos or same-origin/trusted images (never third-party tracking pixels)
function isImageRequest(request, url) {
  if (isStaticCodeOrStyleAsset(request, url)) return false;
  if (isBypassedExternalHost(url)) return false;

  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedHost = TRUSTED_IMAGE_HOSTS.some(host => url.hostname.includes(host));

  if (!isSameOrigin && !isTrustedHost) {
    return false;
  }

  if (request.destination === 'image') return true;
  if (isTrustedHost) return true;
  return /\.(png|jpg|jpeg|svg|webp|gif|ico)(\?.*)?$/i.test(url.pathname);
}

// Check if request is for API / dynamic football data
function isDataOrApiRequest(request, url) {
  if (isStaticCodeOrStyleAsset(request, url)) return false;
  if (isBypassedExternalHost(url)) return false;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/functions/v1/')) return true;
  if (url.hostname.includes('supabase.co')) return true;
  if (
    url.hostname.includes('api-sports.io') ||
    url.hostname.includes('football-data.org') ||
    url.hostname.includes('site.api.espn.com') ||
    url.hostname.includes('thesportsdb.com')
  ) {
    return true;
  }
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json') && !url.pathname.endsWith('.json')) return true;
  return false;
}

// Check if request is specifically for football match data, fixtures, or predictions API endpoints
function isMatchDataRequest(request, url) {
  if (isStaticCodeOrStyleAsset(request, url)) return false;
  if (isBypassedExternalHost(url)) return false;

  // For same-origin requests, ONLY match explicit /api/ endpoints (never SPA routes or /assets/*.js chunks!)
  if (url.origin === self.location.origin) {
    return url.pathname.startsWith('/api/');
  }

  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/')) return true;
  if (
    url.hostname.includes('api-sports.io') ||
    url.hostname.includes('football-data.org') ||
    url.hostname.includes('site.api.espn.com') ||
    url.hostname.includes('thesportsdb.com')
  ) {
    return true;
  }
  return isDataOrApiRequest(request, url);
}

// Helper: Network fetch with timeout
function fetchWithTimeout(request, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(request)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// 3. Fetch Event: Intelligent multi-tier caching
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only intercept HTTP/HTTPS GET requests
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  if (!url.protocol.startsWith('http')) return;
  if (req.method !== 'GET') return;

  // Immediately bypass third-party analytics, ads, and tracking pixels
  if (isBypassedExternalHost(url)) {
    return;
  }

  // Let any other non-trusted external requests pass directly through to browser
  if (
    url.origin !== self.location.origin &&
    !isImageRequest(req, url) &&
    !isDataOrApiRequest(req, url) &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('fonts.gstatic.com')
  ) {
    return;
  }

  // A0. Instant Fast-Path for /robots.txt and /llms.txt (SEO & Agentic Browsing Audits)
  if (
    url.origin === self.location.origin &&
    (url.pathname === '/robots.txt' || url.pathname === '/llms.txt')
  ) {
    event.respondWith(
      (async () => {
        const isRobots = url.pathname === '/robots.txt';
        const fallbackBody = isRobots ? ROBOTS_TXT_FALLBACK : LLMS_TXT_FALLBACK;
        const contentType = isRobots
          ? 'text/plain; charset=utf-8'
          : 'text/markdown; charset=utf-8';

        try {
          const cache = await caches.open(CACHE_STATIC);
          const cached = await cache.match(url.pathname);
          if (cached && cached.status === 200) {
            // Revalidate in background without delaying response
            fetchWithTimeout(req, 1500)
              .then(res => {
                if (res && res.status === 200) {
                  cache.put(url.pathname, res.clone()).catch(() => {});
                }
              })
              .catch(() => {});
            return cached;
          }

          const netRes = await fetchWithTimeout(req, 1200);
          if (netRes && netRes.status === 200) {
            const text = await netRes.clone().text();
            // Ensure static host did not return an HTML SPA fallback
            if (!text.trim().toLowerCase().startsWith('<!doctype')) {
              cache.put(url.pathname, netRes.clone()).catch(() => {});
              return new Response(text, {
                status: 200,
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=3600',
                },
              });
            }
          }
        } catch {
          // Network timed out or offline; serve guaranteed valid fallback below
        }

        return new Response(fallbackBody, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      })()
    );
    return;
  }

  // A. Navigation (SPA HTML Entrypoint) - Network-first with instant offline fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const netRes = await fetchWithTimeout(req, 3000);
          if (netRes && netRes.status === 200) {
            const cache = await caches.open(CACHE_STATIC);
            cache.put(req, netRes.clone()).catch(() => {});
            return netRes;
          }
        } catch (err) {
          // Network failed or timed out
        }

        const cache = await caches.open(CACHE_STATIC);
        const cached = (await cache.match(req)) || (await cache.match('/index.html')) || (await cache.match('/'));
        if (cached) {
          return cached;
        }

        return new Response('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>PredictPro - Offline</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;background:#090d16;color:#e2e8f0;"><main id="main-content"><h1>PredictPro is Offline</h1><p>Please check your internet connection and reload.</p><button onclick="location.reload()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Retry</button></main></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })()
    );
    return;
  }

  // B. Team Logos & Trusted Images - Cache-First without forcing synthetic CORS mode
  if (isImageRequest(req, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_IMAGES);
        const cached = await cache.match(req);
        if (cached) {
          return cached;
        }

        try {
          const netRes = await fetch(req);
          if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
            cache.put(req, netRes.clone()).catch(() => {});
            setTimeout(() => trimCache(CACHE_IMAGES, MAX_IMAGE_CACHE_ENTRIES), 1000);
            return netRes;
          }
        } catch (err) {
          // Network fetch failed
        }

        // Return deterministic fallback SVG shield badge
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#334155"/><text x="16" y="20" fill="#fff" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">⚽</text></svg>',
          { headers: { 'Content-Type': 'image/svg+xml' } }
        );
      })()
    );
    return;
  }

  // C. Match Predictions & Dynamic Sports Data - Stale-While-Revalidate (SWR) Strategy
  if (isMatchDataRequest(req, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_DATA);
        const cached = await cache.match(req);

        // Helper: broadcast background revalidation update to all clients
        const notifyClients = async (urlStr, status) => {
          const payload = {
            type: 'MATCH_DATA_REVALIDATED',
            url: urlStr,
            status,
            timestamp: new Date().toISOString(),
          };
          try {
            const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of clients) {
              client.postMessage(payload);
            }
          } catch {
            // non-blocking
          }
        };

        // Background revalidation task: fetch fresh data from network and update cache
        const revalidatePromise = (async () => {
          try {
            const netRes = await fetchWithTimeout(req.clone(), 5000);
            if (netRes && (netRes.ok || netRes.status === 200 || netRes.type === 'opaque')) {
              await cache.put(req, netRes.clone());
              await notifyClients(req.url, netRes.status);
              return netRes;
            }
          } catch {
            // Background revalidation failed (offline or timeout); cached stale data remains safely served
          }
          return null;
        })();

        // 1. If cached match data is present, serve it immediately (Stale-While-Revalidate)!
        if (cached) {
          event.waitUntil(revalidatePromise);

          const newHeaders = new Headers(cached.headers);
          newHeaders.set('X-PredictPro-Strategy', 'stale-while-revalidate');
          newHeaders.set('X-PredictPro-Cache', 'STALE');
          newHeaders.set('X-PredictPro-Offline', navigator.onLine ? 'false' : 'true');

          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: newHeaders,
          });
        }

        // 2. If not yet in cache, await network fetch
        try {
          const freshRes = await revalidatePromise;
          if (freshRes) {
            return freshRes;
          }
        } catch {
          // ignore
        }

        // 3. Fallback to offline matches snapshot if available
        const snapshotUrl = new URL('/api/offline-matches-snapshot', self.location.origin).href;
        const snapshotCached = await cache.match(snapshotUrl);
        if (snapshotCached) {
          const snapHeaders = new Headers(snapshotCached.headers);
          snapHeaders.set('X-PredictPro-Strategy', 'stale-while-revalidate');
          snapHeaders.set('X-PredictPro-Cache', 'SNAPSHOT-FALLBACK');
          snapHeaders.set('X-PredictPro-Offline', 'true');
          return new Response(snapshotCached.body, {
            status: 200,
            statusText: 'OK',
            headers: snapHeaders,
          });
        }

        // 4. Safe fallback JSON response
        return new Response(
          JSON.stringify({
            ok: true,
            offline: true,
            data: [],
            cached_matches: [],
            strategy: 'stale-while-revalidate',
            message: 'PredictPro offline match cache fallback'
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-PredictPro-Offline': 'true',
              'X-PredictPro-Strategy': 'stale-while-revalidate',
              'X-PredictPro-Cache': 'EMPTY-FALLBACK'
            }
          }
        );
      })()
    );
    return;
  }

  // D. Same-Origin Static Assets & Dynamic Chunks (/assets/*.js, .css, fonts)
  if (url.origin === self.location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      (async () => {
        const isJsScript = req.destination === 'script' || /\.(js|mjs)(\?.*)?$/i.test(url.pathname);
        const isCssStyle = req.destination === 'style' || /\.css(\?.*)?$/i.test(url.pathname);

        const cache = await caches.open(CACHE_STATIC);
        let cached = await cache.match(req);

        // Guard against any previously poisoned cache entry with wrong MIME type
        if (cached && isJsScript) {
          const cachedType = (cached.headers.get('content-type') || '').toLowerCase();
          if (!cachedType.includes('javascript') && !cachedType.includes('ecmascript')) {
            await cache.delete(req).catch(() => {});
            cached = null;
          }
        }

        // For hashed Vite assets (/assets/*), serve valid cached JS/CSS immediately for zero-latency module loading
        if (cached && url.pathname.startsWith('/assets/')) {
          return cached;
        }

        try {
          const netRes = await fetch(req);
          if (netRes && netRes.status === 200) {
            const netType = (netRes.headers.get('content-type') || '').toLowerCase();
            const validMime =
              isJsScript
                ? netType.includes('javascript') || netType.includes('ecmascript')
                : isCssStyle
                  ? netType.includes('css')
                  : true;

            if (validMime) {
              cache.put(req, netRes.clone()).catch(() => {});
              return netRes;
            }
          } else if (netRes && netRes.type === 'opaque') {
            cache.put(req, netRes.clone()).catch(() => {});
            return netRes;
          }
        } catch (err) {
          // Network failed (offline or network glitch)
        }

        // Return verified cached version if available
        if (cached) {
          return cached;
        }

        if (isCssStyle) {
          return new Response('/* Offline CSS fallback */', {
            status: 200,
            headers: { 'Content-Type': 'text/css' }
          });
        }

        // For missing JS chunks or other offline assets, return 503 so lazyWithRetry can cleanly retry or refresh
        return new Response('Resource offline or chunk rotated', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })()
    );
    return;
  }
});

// 4. Push notifications handling
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data?.json() || {};
  } catch {
    data = { title: 'PredictPro Alert', body: e.data?.text() || 'Match update available' };
  }
  
  const options = {
    body: data.body || 'Match result or kickoff alert!',
    icon: data.icon || '/icon-192.png',
    badge: '/favicon-32x32.png',
    tag: data.tag || `predictpro-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: data.actions || [
      { action: 'view', title: 'View Match' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'PredictPro Match Alert ⚽', options)
  );
});

// 5. Client Messages: Pre-caching team logos & match snapshots on demand
self.addEventListener('message', async event => {
  if (!event.data) return;

  // Pre-cache list of team logos
  if (event.data.type === 'PRECACHE_LOGOS' && Array.isArray(event.data.urls)) {
    const cache = await caches.open(CACHE_IMAGES);
    const urls = event.data.urls.filter(u => typeof u === 'string' && u.startsWith('http'));
    
    await Promise.allSettled(
      urls.map(async logoUrl => {
        try {
          const match = await cache.match(logoUrl);
          if (!match) {
            const res = await fetch(logoUrl, { mode: 'no-cors' });
            if (res && (res.status === 200 || res.type === 'opaque')) {
              await cache.put(logoUrl, res);
            }
          }
        } catch {
          // ignore individual logo download error
        }
      })
    );
    return;
  }

  // Pre-cache match data snapshot
  if (event.data.type === 'PRECACHE_MATCH_DATA' && event.data.payload) {
    try {
      const cache = await caches.open(CACHE_DATA);
      const snapshotUrl = new URL('/api/offline-matches-snapshot', self.location.origin).href;
      const response = new Response(JSON.stringify(event.data.payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-PredictPro-Strategy': 'stale-while-revalidate',
          'X-PredictPro-Prewarmed': 'true',
        }
      });
      await cache.put(snapshotUrl, response);
    } catch {
      // ignore
    }
    return;
  }

  // Stale-While-Revalidate handshake & active confirmation
  if (event.data.type === 'ENABLE_MATCH_SWR') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'MATCH_SWR_ACTIVE', success: true });
    }
    return;
  }

  // Trigger immediate background revalidation of match data
  if (event.data.type === 'REVALIDATE_MATCH_DATA') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_DATA);
          const snapshotUrl = new URL('/api/offline-matches-snapshot', self.location.origin).href;
          if (navigator.onLine) {
            const netRes = await fetchWithTimeout(snapshotUrl, 5000).catch(() => null);
            if (netRes && netRes.ok) {
              await cache.put(snapshotUrl, netRes.clone());
            }
          }
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({
              type: 'MATCH_DATA_REVALIDATED',
              url: snapshotUrl,
              timestamp: new Date().toISOString(),
              manual: true,
            });
          }
        } catch {
          // ignore
        }
      })()
    );
    return;
  }

  // Direct show notification request
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200],
        ...options
      })
    );
    return;
  }

  // Clear offline cache request (Legacy support)
  if (event.data.type === 'CLEAR_OFFLINE_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_STATIC),
        caches.delete(CACHE_IMAGES),
        caches.delete(CACHE_DATA),
      ])
    );
    return;
  }

  // Inspect detailed cache breakdown and stale asset metrics
  if (event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      (async () => {
        try {
          const allKeys = await caches.keys();
          const staleKeys = allKeys.filter(key => !ALL_CACHES.includes(key));
          
          let staticCount = 0;
          let imagesCount = 0;
          let dataCount = 0;
          let staleEntriesCount = 0;

          if (allKeys.includes(CACHE_STATIC)) {
            const staticCache = await caches.open(CACHE_STATIC);
            const keys = await staticCache.keys();
            staticCount = keys.length;
          }

          if (allKeys.includes(CACHE_IMAGES)) {
            const imagesCache = await caches.open(CACHE_IMAGES);
            const keys = await imagesCache.keys();
            imagesCount = keys.length;
          }

          if (allKeys.includes(CACHE_DATA)) {
            const dataCache = await caches.open(CACHE_DATA);
            const keys = await dataCache.keys();
            dataCount = keys.length;
          }

          for (const staleKey of staleKeys) {
            try {
              const cache = await caches.open(staleKey);
              const keys = await cache.keys();
              staleEntriesCount += keys.length;
            } catch {
              // ignore unreadable legacy cache
            }
          }

          const responseData = {
            type: 'CACHE_STATS_RESPONSE',
            success: true,
            version: CACHE_VERSION,
            staticCount,
            imagesCount,
            dataCount,
            staleKeys,
            staleEntriesCount,
            totalEntries: staticCount + imagesCount + dataCount + staleEntriesCount,
          };

          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(responseData);
          } else if (event.source && 'postMessage' in event.source) {
            event.source.postMessage(responseData);
          }
        } catch (err) {
          const errorResp = {
            type: 'CACHE_STATS_RESPONSE',
            success: false,
            error: err && err.message ? err.message : 'Failed to inspect cache',
          };
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(errorResp);
          }
        }
      })()
    );
    return;
  }

  // Clear stale cache assets (older versions, obsolete keys, expired snapshots, excess image bloat)
  if (event.data.type === 'CLEAR_STALE_CACHE') {
    event.waitUntil(
      (async () => {
        try {
          const allKeys = await caches.keys();
          const staleKeys = allKeys.filter(key => !ALL_CACHES.includes(key));
          let deletedCachesCount = 0;
          let purgedEntriesCount = 0;

          // 1. Delete all non-active legacy caches
          await Promise.all(
            staleKeys.map(async key => {
              try {
                const cache = await caches.open(key);
                const keys = await cache.keys();
                purgedEntriesCount += keys.length;
                const deleted = await caches.delete(key);
                if (deleted) deletedCachesCount++;
              } catch {
                await caches.delete(key);
              }
            })
          );

          // 2. Prune images cache if it exceeds 100 entries to optimize storage efficiency
          if (allKeys.includes(CACHE_IMAGES)) {
            try {
              const imgCache = await caches.open(CACHE_IMAGES);
              const imgKeys = await imgCache.keys();
              if (imgKeys.length > 80) {
                const toTrim = imgKeys.slice(0, imgKeys.length - 80);
                for (const k of toTrim) {
                  await imgCache.delete(k);
                  purgedEntriesCount++;
                }
              }
            } catch {
              // ignore
            }
          }

          // 3. Clear stale snapshot if timestamp is old
          if (allKeys.includes(CACHE_DATA)) {
            try {
              const dataCache = await caches.open(CACHE_DATA);
              const snapshotUrl = new URL('/api/offline-matches-snapshot', self.location.origin).href;
              const match = await dataCache.match(snapshotUrl);
              if (match) {
                const data = await match.json().catch(() => null);
                if (data && data.timestamp) {
                  const ageMs = Date.now() - new Date(data.timestamp).getTime();
                  // Stale if older than 48 hours
                  if (ageMs > 48 * 60 * 60 * 1000) {
                    await dataCache.delete(snapshotUrl);
                    purgedEntriesCount++;
                  }
                }
              }
            } catch {
              // ignore
            }
          }

          const responseData = {
            type: 'CLEAR_STALE_CACHE_RESPONSE',
            success: true,
            deletedCachesCount,
            staleKeysDeleted: staleKeys,
            purgedEntriesCount,
            timestamp: new Date().toISOString(),
          };

          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(responseData);
          } else if (event.source && 'postMessage' in event.source) {
            event.source.postMessage(responseData);
          }
        } catch (err) {
          const errorResp = {
            type: 'CLEAR_STALE_CACHE_RESPONSE',
            success: false,
            error: err && err.message ? err.message : 'Failed to clear stale cache',
          };
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(errorResp);
          }
        }
      })()
    );
    return;
  }

  // Clear specific cache category (e.g. 'images', 'data', 'all')
  if (event.data.type === 'CLEAR_CACHE_CATEGORY') {
    const category = event.data.category || 'stale';
    event.waitUntil(
      (async () => {
        try {
          let freedCount = 0;
          if (category === 'images') {
            const cache = await caches.open(CACHE_IMAGES);
            const keys = await cache.keys();
            freedCount = keys.length;
            await caches.delete(CACHE_IMAGES);
            await caches.open(CACHE_IMAGES); // Re-open clean
          } else if (category === 'data') {
            const cache = await caches.open(CACHE_DATA);
            const keys = await cache.keys();
            freedCount = keys.length;
            await caches.delete(CACHE_DATA);
            await caches.open(CACHE_DATA); // Re-open clean
          } else if (category === 'all') {
            const allKeys = await caches.keys();
            for (const k of allKeys) {
              const cache = await caches.open(k);
              const keys = await cache.keys();
              freedCount += keys.length;
              await caches.delete(k);
            }
            // Re-warm core shell so app remains functional
            const newStatic = await caches.open(CACHE_STATIC);
            await newStatic.addAll(STATIC_SHELL_ASSETS).catch(() => {});
          }

          const responseData = {
            type: 'CLEAR_CACHE_CATEGORY_RESPONSE',
            success: true,
            category,
            freedCount,
          };

          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(responseData);
          } else if (event.source && 'postMessage' in event.source) {
            event.source.postMessage(responseData);
          }
        } catch (err) {
          const errorResp = {
            type: 'CLEAR_CACHE_CATEGORY_RESPONSE',
            success: false,
            error: err && err.message ? err.message : 'Error clearing category',
          };
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(errorResp);
          }
        }
      })()
    );
    return;
  }
});

// 6. Notification Click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;

  const targetUrl = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
