const CACHE_NAME = 'mesai-takip-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.php',
  './manifest.json',
  './icon.svg'
  // Offline çalışma tam istenmediği için sadece PWA şartlarını sağlamak adına temel dosyaları ekliyoruz.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // PWA kurulumu için sw.js olması yeterli, her şeyi cache'den getirmek yerine
  // dinamik verileri her zaman sunucudan almak için Network-First veya sadece fetch yapalım.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
