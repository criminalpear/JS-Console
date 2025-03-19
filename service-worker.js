const CACHE_NAME = 'js-console-cache-v2';
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
      console.log('Caching files');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
