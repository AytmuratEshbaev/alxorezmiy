// ============================================
// SERVICE WORKER — Minimal offline cache
// ============================================
// Cache-first strategy for static assets, network-first for pages.

const CACHE_VERSION = 'v3.14-h1-revert';
const STATIC_CACHE = `alxorezmiy-static-${CACHE_VERSION}`;
const PAGE_CACHE = `alxorezmiy-pages-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/css/style.css',
  '/css/dark-theme.css',
  '/css/responsive.css',
  '/js/site-shell.js',
  '/js/theme.js',
  '/js/i18n.js',
  '/js/main.js',
  '/assets/icons/favicon.svg',
  '/manifest.json'
];

// Install — pre-cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.includes(CACHE_VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategy depends on resource
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Skip Firebase, ImageKit, API requests
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_vercel/')) return;
  if (url.pathname.startsWith('/admin/')) return;

  // Static assets — cache first
  if (/\.(css|js|svg|woff2?|png|jpg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        }
        return resp;
      }))
    );
    return;
  }

  // HTML pages — network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(PAGE_CACHE).then(c => c.put(request, clone));
        }
        return resp;
      }).catch(() => caches.match(request).then(c => c || caches.match('/404.html')))
    );
  }
});
