const CACHE_NAME = 'dailyflow-pwa-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=5',
  './db.js?v=5',
  './app.js?v=5',
  './manifest.json',
  './icon.svg'
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
