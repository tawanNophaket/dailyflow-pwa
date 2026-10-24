const CACHE_NAME = 'dailyflow-pwa-v12';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=12',
  './db.js?v=12',
  './app.js?v=12',
  './manifest.json?v=12',
  './apple-touch-icon.png',
  './apple-touch-icon.png?v=12',
  './icon.svg',
  './icon.svg?v=12',
  './assets/app-icon-192.png?v=12',
  './assets/app-icon-512.png?v=12',
  './assets/jay-1.jpg?v=12',
  './assets/jay-2.jpg?v=12',
  './assets/jay-3.jpg?v=12',
  './assets/jay-4.jpg?v=12',
  './assets/jay-5.jpg?v=12',
  './assets/jay-6.jpg?v=12'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      let deletedOldCache = false;
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
          deletedOldCache = true;
        }
      }
      await self.clients.claim();
      if (deletedOldCache) {
        const windowClients = await self.clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
          client.navigate(client.url);
        }
      }
    })()
  );
});

// Handle Mobile / Browser Notification Tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Network-First Strategy with Offline Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
