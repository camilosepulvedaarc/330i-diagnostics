// Offline cache. Bump VERSION after any change.
const VERSION = 'diag-v8';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'obd.js', 'dtc.js', 'manifest.json', 'icon.svg', 'car.webp', 'apple-touch-icon.png', 'car-xray.webp'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Network first so updates show up; cache when offline (e.g. in a garage).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // no-cache = always ask GitHub if the file changed (it otherwise keeps files 10 min).
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => {
    const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
