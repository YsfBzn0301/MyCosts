/* Service Worker – Offline-Fähigkeit & schnelles Laden.
 *
 * Alle Pfade sind relativ zum Scope des Service Workers. So funktioniert die App
 * sowohl unter "/" als auch unter einem Unterpfad wie GitHub Pages (/MyCosts/).
 *
 *  - App-Shell wird beim Install vorgeladen.
 *  - Navigation: Network-first, Fallback auf die gecachte index.html (offline).
 *  - Übrige GET-Requests (gehashte Bundles, Icons): Cache-first.
 */
const CACHE = 'fixkosten-v2';
const SCOPE = self.registration.scope;
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'].map(
  (path) => new URL(path, SCOPE).href,
);
const INDEX = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(INDEX, response.clone());
    return response;
  } catch {
    return (await cache.match(INDEX)) || (await cache.match(SCOPE)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}
