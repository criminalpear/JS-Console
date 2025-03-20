const CACHE_NAME = 'js-console-cache-v4'; // Increment version to force cache update
const FILES_TO_CACHE = [
  '/JS-Console/',
  '/JS-Console/index.html',
  '/JS-Console/launcher.html',
  '/JS-Console/css/styles.css',
  '/JS-Console/js/scripts.js',
  '/JS-Console/js/utils.js',
  '/JS-Console/js/snake.js',
  '/JS-Console/js/tictactoe.js',
  '/JS-Console/manifest.json',
  '/JS-Console/images/icon-192x192.png',
  '/JS-Console/images/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting()) // Force immediate activation
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request) // Try network first
      .then((response) => {
        // Cache the fresh response
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((response) => {
          return response || caches.match('/JS-Console/index.html');
        });
      })
  );
});
