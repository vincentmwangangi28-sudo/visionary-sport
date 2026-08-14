// PredictPro Service Worker v3
const CACHE = 'predictpro-v3';
const STATIC = ['/', '/best-bets', '/live', '/news', '/correct-score', '/btts', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Only ever handle plain http(s) GET requests. Skip everything else outright:
  // chrome-extension:, moz-extension:, data:, blob: schemes (Cache API rejects these),
  // non-GET methods, and any cross-origin request (ads, analytics, third-party APIs) —
  // those are the browser's problem to fetch or block, not ours to intercept/cache.
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (!url.protocol.startsWith('http')) return;
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/').then(r => r || Response.error()))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || Response.error());
    })
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'PredictPro', {
      body: data.body || 'New prediction available!',
      icon: '/icon-192.png',
      badge: '/favicon-32x32.png',
      tag: data.tag || 'predictpro',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});
