// PredictPro Service Worker v2
const CACHE = 'predictpro-v2';
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
  // Don't intercept Supabase or external API calls
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('rapidapi.com') ||
      url.hostname.includes('googleapis.com') || url.hostname.includes('stripe.com')) return;

  // Network first for HTML, cache fallback for assets
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/').then(r => r || fetch(e.request)))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
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
