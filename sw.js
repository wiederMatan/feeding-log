const CACHE_NAME = 'yh-v3';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];
const FONT_ORIGIN = 'https://fonts.googleapis.com';
const FONT_STATIC = 'https://fonts.gstatic.com';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for Firebase / Firestore
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Cache-first for fonts
  if (url.origin === FONT_ORIGIN || url.origin === FONT_STATIC) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) =>
          cached ||
          fetch(e.request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
            return res;
          })
      )
    );
    return;
  }

  // Cache-first for app shell, network fallback
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
      .catch(() => caches.match('/index.html'))
  );
});
