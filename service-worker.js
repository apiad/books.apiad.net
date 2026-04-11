const CACHE_NAME = 'computist-v1';
const MAX_ENTRIES = 50;

// Only cache /books/{book}/ URLs (book content chapters), not landing page
// Matches patterns like: /books/tsoc/intro.html, /books/mhai/chapter1.html, etc.
// Excludes: /books (landing page), /books/ (landing page)
const BOOK_CHAPTER_PATTERN = /^\/books\/[^\/]+\/[^/]+\.html$/;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only cache HTTP/HTTPS requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Only cache book chapter pages in /books/{book}/ directory
  // Must match: /books/tsoc/intro.html
  // Must NOT match: /books, /books/, /books/tsoc
  if (!BOOK_CHAPTER_PATTERN.test(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Only cache successful responses
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
            trimCache(cache);
          }
          return networkResponse;
        }).catch(() => {
          // If offline and no cache, return nothing (page won't load)
          return cachedResponse;
        });

        // Return cached immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

function trimCache(cache) {
  cache.keys().then(requests => {
    if (requests.length > MAX_ENTRIES) {
      // Keep the most recent entries (FIFO - first in, first out)
      const toDelete = requests.slice(0, requests.length - MAX_ENTRIES);
      toDelete.forEach(request => {
        cache.delete(request);
      });
    }
  });
}