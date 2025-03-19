// Service Worker for JS-Console PWA
const CACHE_NAME = 'js-console-cache-v1';
const FILES_TO_CACHE = [
  '/JS-Console/',             // Root URL (start_url)
  '/JS-Console/index.html',   // Main page
  '/JS-Console/css/styles.css', // Stylesheet
  '/JS-Console/js/scripts.js',  // Main script
  '/JS-Console/js/utils.js',    // Utility script
  '/JS-Console/js/snake.js',    // Snake game script
  '/JS-Console/js/tictactoe.js', // Tic-tac-toe script
  '/JS-Console/manifest.json',  // Manifest
  '/images/icon-192x192.png'    // Icon (adjust path if different)
];

// Install event: Cache all critical files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Installing and caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Force the service worker to activate immediately
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
  // Take control of the page immediately
  self.clients.claim();
});

// Fetch event: Serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  // Handle navigation requests (e.g., opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/JS-Console/index.html').then((response) => {
        return response || fetch(event.request);
      }).catch(() => {
        // Optional: Serve an offline page if index.html isn’t cached
        return caches.match('/JS-Console/offline.html');
      })
    );
  } else {
    // Handle other requests (CSS, JS, images, etc.)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((networkResponse) => {
          // Cache new resources dynamically
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        // Fallback for non-navigation requests (optional)
        console.log('Fetch failed, no cache or network available');
      })
    );
  }
});
