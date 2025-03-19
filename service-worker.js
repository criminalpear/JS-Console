// Service Worker for JS-Console PWA
const CACHE_NAME = 'js-console-cache-v2';
const FILES_TO_CACHE = [
  '/JS-Console/',
  '/JS-Console/index.html',
  '/JS-Console/launcher.html', // Ensure this is listed
  '/JS-Console/css/styles.css',
  '/JS-Console/js/scripts.js',
  '/JS-Console/js/utils.js',
  '/JS-Console/js/snake.js',
  '/JS-Console/js/tictactoe.js',
  '/JS-Console/manifest.json',
  '/JS-Console/images/icon-192x192.png',
  '/JS-Console/images/icon-512x512.png'
];

// Install event: Cache all critical files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Installing and caching files');
      return cache.addAll(FILES_TO_CACHE);
    }).catch((error) => {
      console.error('Cache addAll failed:', error);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/JS-Console/').then((response) => {
        return response || fetch(event.request);
      }).catch(() => {
        return caches.match('/JS-Console/index.html');
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        console.log('Fetch failed, no cache or network available');
      })
    );
  }
});
