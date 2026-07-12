/*
 * Fordania Verkstad – service worker (PWA/offline).
 *
 * Mål: man ska kunna TITTA på sidor man redan öppnat medan man hade nät,
 * även när nätet försvinner – men aldrig se inaktuell data. Ingenting
 * skrivs offline; alla muterande flöden går alltid mot nätet.
 *
 * Strategi:
 *  - Sidnavigeringar (hela HTML-sidor): network-first. Färsk data när nätet
 *    finns, annars senast sparade kopia (< 24 h), och som sista utväg /offline.
 *  - RSC-flightdata (bakgrundsdatan Next.js hämtar vid klick inne i appen):
 *    network-first i en EGEN cache, med nyckeln normaliserad (utan `_rsc`-hash)
 *    så att offline-träffar faktiskt hittas. Egen cache = krockar aldrig med
 *    HTML-sidorna.
 *  - Statiska, hashade assets (_next/static, fonter, bilder): cache-first,
 *    utan utgång (de är oföränderliga inom en version).
 *  - /api/* rörs aldrig (auth och muterande flöden ska alltid gå mot nätet).
 *
 * Färskhet: alla cachade SIDOR och RSC-svar tidsstämplas. Är kopian äldre än
 * 24 h serveras den inte offline – den slängs och man får offline-sidan i
 * stället. Statiska assets har ingen utgång. Höj VERSION vid brytande
 * ändringar för att slänga alla gamla cachar.
 */
const VERSION = "fv-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const RSC_CACHE = `${VERSION}-rsc`;
const OFFLINE_URL = "/offline";

// Hur länge en cachad sida/RSC-kopia får visas offline innan den räknas som
// för gammal och slängs. 24 timmar.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
      .then(() => sweepExpired())
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

  // Statiska, oföränderliga (hashade) resurser → cache-first, ingen utgång.
  // ALPR-modellerna (.onnx) och WASM-körtiden (.wasm) är stora och ändras
  // sällan – de laddas EN gång och lever sedan offline i PWA:n (annars
  // skulle skannern hämta tiotals MB varje gång man är online).
  if (
    url.pathname.startsWith("/_next/static") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico|gif|onnx|wasm)$/.test(
      url.pathname,
    )
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // RSC-flightdata (klientnavigering/prefetch) → egen cache, normaliserad
  // nyckel utan `_rsc`-hash, 24 h utgång.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    event.respondWith(
      networkFirst(event, {
        cacheName: RSC_CACHE,
        key: normalizedKey(url),
        navigate: false,
      }),
    );
    return;
  }

  // Sidnavigeringar → network-first med offline-fallback, 24 h utgång.
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(event, { cacheName: PAGE_CACHE, navigate: true }),
    );
    return;
  }

  // Övrigt same-origin → network-first, 24 h utgång.
  event.respondWith(
    networkFirst(event, { cacheName: PAGE_CACHE, navigate: false }),
  );
});

// Nyckel utan `_rsc`-hashen så att samma route matchar även när hashen
// skiljer sig mellan tillfällena.
function normalizedKey(url) {
  const u = new URL(url.href);
  u.searchParams.delete("_rsc");
  return u.toString();
}

async function networkFirst(event, { cacheName, key, navigate }) {
  const cache = await caches.open(cacheName);
  const cacheKey = key ?? event.request;
  try {
    const response = await fetch(event.request);
    // Spara en tidsstämplad kopia i bakgrunden (blockerar inte svaret).
    if (response && response.ok) {
      event.waitUntil(putStamped(cache, cacheKey, response.clone()));
    }
    return response;
  } catch {
    const cached = await cache.match(cacheKey, { ignoreVary: true });
    if (cached && !isExpired(cached)) return cached;
    // För gammal kopia → släng den, visa aldrig inaktuell data.
    if (cached) await cache.delete(cacheKey, { ignoreVary: true });
    if (navigate) {
      const pages = await caches.open(PAGE_CACHE);
      const offline = await pages.match(OFFLINE_URL);
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

// Lagra svaret med en tidsstämpel i en extra header så vi kan mäta ålder.
async function putStamped(cache, key, response) {
  try {
    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.set("sw-cached-at", String(Date.now()));
    const stamped = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await cache.put(key, stamped);
  } catch {
    /* fullt lagringsutrymme e.d. – strunta i det, appen fungerar ändå */
  }
}

function isExpired(response) {
  const at = Number(response.headers.get("sw-cached-at"));
  if (!at) return false; // ingen stämpel (t.ex. /offline) → räknas inte som gammal
  return Date.now() - at > MAX_AGE_MS;
}

// Städa bort utgångna sido-/RSC-kopior (körs vid aktivering av ny SW).
async function sweepExpired() {
  for (const name of [PAGE_CACHE, RSC_CACHE]) {
    try {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      await Promise.all(
        requests.map(async (req) => {
          const res = await cache.match(req);
          if (res && isExpired(res)) await cache.delete(req);
        }),
      );
    } catch {
      /* ignorera – städning är inte kritisk */
    }
  }
}
