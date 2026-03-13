const CACHE_NAME = 'family-chores-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/env-config.js',
  '/manifest.json'
];

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for API/dynamic
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Ollama API calls - always go to network
  if (url.port === '11434' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) {
    return;
  }

  // Skip Firebase/external requests
  if (url.origin !== self.location.origin) return;

  // Don't cache env-config.js (runtime env vars change)
  if (url.pathname === '/env-config.js') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for hashed assets (immutable)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML/other (SPA navigation)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request) || caches.match('/index.html'))
  );
});
