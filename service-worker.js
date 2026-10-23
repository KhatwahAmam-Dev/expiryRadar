const CACHE_NAME = 'expiry-tool-v3';
const JSON_URL = 'https://raw.githubusercontent.com/CahSragen77/masterDataJson/main/ms_item.json';
const APP_SHELL = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/app.js', './js/config.js', './js/db.js', './js/utils.js',
  './js/auth.js', './js/master.js', './js/scanner.js',
  './js/scan-form.js', './js/scan-list.js', './js/export.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => {
      c.add(JSON_URL).catch(() => {});
      return c.addAll(APP_SHELL).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  if (url === JSON_URL) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(JSON_URL, clone));
          return res;
        })
        .catch(() => caches.match(JSON_URL))
    );
    return;
  }

  if (e.request.method === 'GET') {
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
  }
});
