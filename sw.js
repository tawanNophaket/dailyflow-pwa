const CACHE_NAME = 'dailyflow-pwa-v8';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=8',
  './db.js?v=8',
  './app.js?v=8',
  './manifest.json',
  './icon.svg',
  './assets/role-model-1.jpg',
  './assets/role-model-2.jpg',
  './assets/role-model-3.jpg',
  './assets/role-model-4.jpg',
  './assets/role-model-5.jpg'
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
