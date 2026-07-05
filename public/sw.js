/*
 * Fordania Verkstad – service worker (PWA/offline).
 *
 * Strategi:
 *  - Sidnavigeringar (HTML/RSC): network-first. Färsk data när nätet finns,
 *    annars senast sparade version av sidan, och som sista utväg /offline.
 *  - Statiska, hashade assets (_next/static, fonter, bilder): cache-first.
 *  - /api/* rörs aldrig (auth och muterande flöden ska alltid gå mot nätet).
 *
 * Höj VERSION vid brytande ändringar för att slänga gamla cachar.
 */
const VERSION = "fv-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {}),
  );
  // Aktivera den nya versionen direkt.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Auth/API: alltid nätverk, aldrig cache.
  if (url.pathname.startsWith("/api")) return;

  // Sidnavigeringar → network-first med offline-fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Statiska, oföränderliga (hashade) resurser → cache-first.
  if (
    url.pathname.startsWith("/_next/static") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico|gif)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Övrigt (t.ex. RSC-flightdata vid klientnavigering) → network-first.
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}
