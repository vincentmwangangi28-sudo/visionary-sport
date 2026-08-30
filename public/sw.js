// PredictPro Service Worker v6 - Resilient Offline & Chunk Loading Strategy
const CACHE_VERSION = 'v6';
const CACHE_STATIC = `predictpro-static-${CACHE_VERSION}`;
const CACHE_IMAGES = `predictpro-images-${CACHE_VERSION}`;
const CACHE_DATA = `predictpro-data-${CACHE_VERSION}`;

const ALL_CACHES = [CACHE_STATIC, CACHE_IMAGES, CACHE_DATA];
const MAX_IMAGE_CACHE_ENTRIES = 250;

// Essential static shell assets to pre-cache on install
const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/icon-192.png',
  '/icon-512.png',
];

// Domains hosting official team logos & match media
const TRUSTED_IMAGE_HOSTS = [
  'a.espncdn.com',
  'upload.wikimedia.org',
  'media.api-sports.io',
  'api-football.com',
  'images.unsplash.com',
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

// Check if request is for team logos or images
function isImageRequest(request, url) {
  if (request.destination === 'image') return true;
  if (TRUSTED_IMAGE_HOSTS.some(host => url.hostname.includes(host))) return true;
  return /\.(png|jpg|jpeg|svg|webp|gif|ico)(\?.*)?$/i.test(url.pathname);
}

// Check if request is for API / dynamic football data
function isDataOrApiRequest(request, url) {
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/functions/v1/')) return true;
  if (url.hostname.includes('supabase.co')) return true;
  if (url.hostname.includes('api-sports.io') || url.hostname.includes('football-data.org')) return true;
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('application/json') && !url.pathname.endsWith('.json')) return true;
  return false;
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

  // Let third-party external scripts (Google Ads, Stripe, analytics, extensions) pass directly through to browser
  if (
    url.origin !== self.location.origin &&
    !isImageRequest(req, url) &&
    !isDataOrApiRequest(req, url) &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('fonts.gstatic.com')
  ) {
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

        return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>PredictPro - Offline</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;background:#090d16;color:#e2e8f0;"><h2>PredictPro is Offline</h2><p>Please check your internet connection and reload.</p><button onclick="location.reload()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Retry</button></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })()
    );
    return;
  }

  // B. Team Logos & Images - Cache-First with fallback
  if (isImageRequest(req, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_IMAGES);
        const cached = await cache.match(req);
        if (cached) {
          return cached;
        }

        try {
          const netRes = await fetch(req, { mode: 'cors' }).catch(() => fetch(req));
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

  // C. Match Predictions & API Data - Network-First with Timeout & Cache Fallback
  if (isDataOrApiRequest(req, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_DATA);
        try {
          const netRes = await fetchWithTimeout(req.clone(), 3000);
          if (netRes && netRes.ok) {
            cache.put(req, netRes.clone()).catch(() => {});
            return netRes;
          }
        } catch (err) {
          // Network failed or timed out
        }

        const cached = await cache.match(req);
        if (cached) {
          const newHeaders = new Headers(cached.headers);
          newHeaders.set('X-PredictPro-Offline', 'true');
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: newHeaders,
          });
        }

        // Return empty JSON structure instead of failing
        return new Response(
          JSON.stringify({ ok: true, offline: true, data: [], cached_matches: [] }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-PredictPro-Offline': 'true' }
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
        const cache = await caches.open(CACHE_STATIC);
        const cached = await cache.match(req);

        try {
          const netRes = await fetch(req);
          if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
            cache.put(req, netRes.clone()).catch(() => {});
            return netRes;
          }
        } catch (err) {
          // Network failed (offline or network glitch)
        }

        // Return cached version if available
        if (cached) {
          return cached;
        }

        // Fallback for JS/CSS so dynamic import error handlers receive a valid HTTP status or clean module
        if (req.destination === 'script' || url.pathname.endsWith('.js')) {
          return new Response('/* PredictPro Offline Chunk Fallback */\nexport default {};', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
          });
        }

        if (req.destination === 'style' || url.pathname.endsWith('.css')) {
          return new Response('/* Offline CSS fallback */', {
            status: 200,
            headers: { 'Content-Type': 'text/css' }
          });
        }

        // Generic 503 response guaranteed to be a valid Response object
        return new Response('Resource offline', {
          status: 503,
          statusText: 'Offline',
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
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(snapshotUrl, response);
    } catch {
      // ignore
    }
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

  // Clear offline cache request
  if (event.data.type === 'CLEAR_OFFLINE_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_STATIC),
        caches.delete(CACHE_IMAGES),
        caches.delete(CACHE_DATA),
      ])
    );
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
