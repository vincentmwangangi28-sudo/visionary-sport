const CACHE_VERSION = 'v1';
const STATIC_CACHE = `predictpro-static-${CACHE_VERSION}`;
const API_CACHE = `predictpro-api-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.ico'];

// Install — pre-cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   /assets/*  → Cache-first (immutable hashed files)
//   /rest/v1/* → Network-first with 5min cache (Supabase API)
//   else       → Network-first, fall back to cache (pages)
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Hashed assets — cache forever
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Supabase REST API — network-first, 5min cache
  if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/rest/')) {
    e.respondWith(
      fetch(request).then(res => {
        const clone = res.clone();
        caches.open(API_CACHE).then(c => c.put(request, clone));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Pages — network-first, fall back to cached index.html (SPA)
  e.respondWith(
    fetch(request).catch(() =>
      caches.match(request) || caches.match('/')
    )
  );
});
