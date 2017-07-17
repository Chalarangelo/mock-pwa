var cacheName = 'mockPWA-v1';
var filesToCache = [
  './',
  './index.html',
  'https://gitcdn.link/repo/Chalarangelo/mini.css/master/dist/mini-pwa.min.css',
  './manifest.json',
  './icons/apple-icon-57x57.png',
  './icons/apple-icon-60x60.png',
  './icons/apple-icon-72x72.png',
  './icons/apple-icon-76x76.png',
  './icons/apple-icon-114x114.png',
  './icons/apple-icon-120x120.png',
  './icons/apple-icon-144x144.png',
  './icons/apple-icon-152x152.png',
  './icons/apple-icon-180x180.png',
  './icons/android-icon-192x192.png',
  './icons/favicon-256x256.png',
  './icons/favicon-512x512.png',
  './icons/favicon-32x32.png',
  './icons/favicon-96x96.png',
  './icons/favicon-16x16.png',
  './static/js/bundle.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(cacheName)
    .then(function(cache) {
      return cache.addAll(filesToCache)
        .then(function() {
          self.skipWaiting();
        });
      }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys()
    .then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName)
          return caches.delete(key);
      }));
  }));
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request)
    .then(function(response) {
      return response || fetch(e.request)
        .then(function (resp){
          return caches.open(cacheName)
            .then(function(cache){
              cache.put(e.request, resp.clone());
              return resp;
          })
        }).catch(function(event){
          console.log('Error fetching data!');
        })
      })
  );
});
