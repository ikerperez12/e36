/**
 * E36 Scroll Cine — Service Worker
 *
 * Strategy:
 *  - APP_SHELL: cache-first (HTML, CSS-in-HTML, JS-in-HTML, manifest, BMW logo, posters)
 *  - VIDEOS:    network passthrough (Vercel serves Range/bytes correctly)
 *  - API:       network-only, never cached
 *
 * Bump CACHE_VERSION when shipping changes that need to invalidate caches.
 */

const CACHE_VERSION = 'e36-v6';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const VIDEO_CACHE = `${CACHE_VERSION}-video`;

const SHELL_URLS = [
  './',
  './index.html',
  './legal.html',
  './E36%20-%20Scroll%20Cine.html',
  './manifest.webmanifest',
  './assets/bmw-logo.png',
  './assets/og-image.jpg',
  './assets/posters/intro.jpg',
  './assets/posters/01.jpg',
  './assets/posters/02.jpg',
  './assets/posters/03.jpg',
  './assets/posters/04.jpg',
  './assets/posters/05.jpg',
  './assets/posters/06.jpg',
  './assets/posters/07.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) return;

  // Never cache cross-origin (Google Fonts handle their own caching)
  if (url.origin !== self.location.origin) return;

  // Videos must bypass Cache API entirely. Browsers use Range requests for MP4
  // playback/seek and Cache API cannot safely store those partial responses.
  if (url.pathname.startsWith('/videos/')) {
    return;
  }

  // Posters: cache-first.
  if (url.pathname.startsWith('/assets/posters/') ||
      url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // HTML / shell: network-first, falling back to cache (so updates ship fast).
  if (req.destination === 'document' ||
      req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }

  // Default: cache-first.
  event.respondWith(cacheFirst(req, SHELL_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
    return fresh;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  return cached || (await networkPromise) || Response.error();
}
