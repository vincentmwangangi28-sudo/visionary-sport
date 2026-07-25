const CACHE_VERSION = 'v2';
const STATIC_CACHE = `predictpro-static-${CACHE_VERSION}`;
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // NEVER intercept: non-GET, chrome extensions, Supabase (auth/rest/functions), AdSense, Vercel analytics
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googlesyndication.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('vercel.com') ||
    url.pathname.startsWith('/_vercel/')
  ) return;

  // Hashed assets (/assets/*) — cache forever (immutable)
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

  // Static files (icons, manifest, robots) — cache first
  if (url.pathname.match(/\.(ico|png|jpg|jpeg|webp|svg|json|txt|xml)$/)) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        return res;
      }).catch(() => new Response('Not found', { status: 404 })))
    );
    return;
  }

  // SPA navigation — network first, fallback to index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
  }
});
