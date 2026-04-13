const CACHE_NAME = 'computist-v2';
const MAX_PAGES = 50;

// Core assets to pre-cache on install
const CORE_ASSETS = [
  '/books/reader.css',
  '/books/reader.js',
  '/data.js',
  '/books/index.html',
  '/sw-register.js'
];

// Patterns
const isBookPage = (pathname) => /^\/books\/[^/]+\/[^/]+\.html$/.test(pathname) || pathname === '/books/index.html';
const isAsset = (pathname) => /\.(css|js|jpg|jpeg|png|gif|svg|woff2?|ttf|eot)$/i.test(pathname);
const isFontApi = (hostname) => hostname === 'fonts.googleapis.com' || hostname === 'fonts.gstatic.com';

// Install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for book pages and assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests over HTTP(S)
  if (event.request.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Cache book pages (stale-while-revalidate)
  if (isBookPage(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request, true));
    return;
  }

  // Cache same-origin assets (CSS, JS, images)
  if (url.origin === self.location.origin && isAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request, false));
    return;
  }

  // Cache Google Fonts (CDN)
  if (isFontApi(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event.request, false));
    return;
  }
});

function staleWhileRevalidate(request, trimPages) {
  return caches.open(CACHE_NAME).then(cache => {
    return cache.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          if (trimPages) trimCache(cache);
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    });
  });
}

function trimCache(cache) {
  cache.keys().then(requests => {
    // Only count HTML pages for the limit
    const pages = requests.filter(r => r.url.endsWith('.html'));
    if (pages.length > MAX_PAGES) {
      const toDelete = pages.slice(0, pages.length - MAX_PAGES);
      toDelete.forEach(r => cache.delete(r));
    }
  });
}
