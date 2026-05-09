/**
 * E36 Scroll Cine - Service Worker cache reset
 *
 * Earlier releases cached the HTML shell and posters. That made some returning
 * mobile browsers keep a broken build until users opened an incognito tab.
 * This release intentionally purges every E36 cache and lets the network /
 * browser HTTP cache handle all requests.
 */

const RESET_VERSION = 'e36-cache-reset-20260509-2';
const CACHE_PREFIX = 'e36-';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    purgeE36Caches()
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'E36_CACHE_RESET', version: RESET_VERSION });
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
  if (event.data?.type === 'PURGE_E36_CACHES') {
    event.waitUntil(purgeE36Caches());
  }
});

self.addEventListener('fetch', (event) => {
  // Network-only. Do not call respondWith(); this avoids stale HTML and avoids
  // breaking MP4 Range requests in Safari, Firefox, Brave, Chrome and Edge.
  if (event.request.method === 'GET') return;
});

async function purgeE36Caches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}
