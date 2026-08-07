/*
 * Fordania Verkstad – service worker (PWA/offline).
 *
 * Mål: man ska kunna TITTA på sidor man redan öppnat medan man hade nät,
 * även när nätet försvinner – men aldrig se inaktuell data. Ingenting
 * skrivs offline; alla muterande flöden går alltid mot nätet.
 *
 * Strategi:
 *  - Sidnavigeringar (hela HTML-sidor): stale-while-revalidate. Den sparade
 *    kopian visas direkt så att appen öppnas utan svart skärm, och färsk
 *    hämtas i bakgrunden. När den landat säger vi till klienten, som gör en
 *    router.refresh() och byter ut innehållet mot färsk data. Utan sparad
 *    kopia (< 24 h) väntar vi på nätet som förut, med /offline som sista utväg.
 *  - RSC-flightdata (bakgrundsdatan Next.js hämtar vid klick inne i appen):
 *    network-first i en EGEN cache, med nyckeln normaliserad (utan `_rsc`-hash)
 *    så att offline-träffar faktiskt hittas. Egen cache = krockar aldrig med
 *    HTML-sidorna.
 *  - Statiska, hashade assets (_next/static, fonter, bilder): cache-first,
 *    utan utgång (de är oföränderliga inom en version).
 *  - /api/* rörs aldrig (auth och muterande flöden ska alltid gå mot nätet).
 *
 * Färskhet: alla cachade SIDOR och RSC-svar tidsstämplas. Är kopian äldre än
 * 24 h serveras den inte – den slängs och man får offline-sidan i stället.
 * Statiska assets har ingen utgång. Höj VERSION vid brytande ändringar för att
 * slänga alla gamla cachar.
 *
 * Sekretess: sidcachen är gemensam för enheten, inte per användare. Klienten
 * tömmer den vid utloggning och vid byte av verkstad (clearOfflinePageCache i
 * lib/offline-cache.ts), så att en sparad sida ur en tidigare session aldrig
 * kan ritas upp för nästa person eller nästa tenant på samma enhet. Det är en
 * förutsättning för att sidorna får serveras ur cachen innan nätet svarat.
 */
const VERSION = "fv-v4";
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
      // Precachningen vid install är tillåten att misslyckas (nätet kan vara
      // dåligt just då). Försök igen här, annars står vi utan offline-sida
      // och en misslyckad navigering ger webbläsarens felsida i stället.
      .then(() => ensureOfflineCached())
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

  // Sidnavigeringar → stale-while-revalidate, 24 h utgång.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(event));
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

/**
 * Sidnavigeringar: visa den sparade kopian direkt och hämta färskt i bakgrunden.
 *
 * Det är det här som gör att PWA:n öppnas utan svart skärm. Network-first
 * innebar att varje öppning väntade på ett helt serversvar innan en enda pixel
 * målades – cachen användes bara när nätet var nere, så andra öppningen var
 * precis lika seg som den första.
 *
 * Kopian får inte bli stående: när bakgrundshämtningen är klar postar vi ett
 * meddelande till fönstret, som gör en router.refresh(). Innehållet byts då ut
 * mot färsk data inom någon sekund. Klick INNE i appen går fortfarande alltid
 * mot nätet (RSC-grenen ovan) – det här gäller bara första ritningen.
 */
async function staleWhileRevalidate(event) {
  const cache = await caches.open(PAGE_CACHE);
  const cached = await cache.match(event.request, { ignoreVary: true });

  const network = fetch(event.request).then(async (response) => {
    if (response && response.ok) {
      await putStamped(cache, event.request, response.clone());
    }
    return response;
  });

  if (cached && !isExpired(cached)) {
    // Servera direkt. Uppdateringen får leva vidare efter att svaret gått ut.
    event.waitUntil(
      network.then(() => notifyRevalidated()).catch(() => {}),
    );
    return cached;
  }

  // Ingen duglig kopia – uppför oss som förut och vänta på nätet.
  if (cached) await cache.delete(event.request, { ignoreVary: true });
  try {
    return await network;
  } catch {
    let offline = await cache.match(OFFLINE_URL);
    if (!offline) {
      await ensureOfflineCached();
      offline = await cache.match(OFFLINE_URL);
    }
    return offline ?? offlineFallbackResponse();
  }
}

// Talar om för öppna fönster att en sida hämtats färsk i bakgrunden, så att
// de kan byta ut den kopia de just visade mot aktuell data.
async function notifyRevalidated() {
  const windows = await self.clients.matchAll({ type: "window" });
  for (const client of windows) {
    client.postMessage({ type: "FV_REVALIDATED" });
  }
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
      let offline = await pages.match(OFFLINE_URL);
      if (!offline) {
        // Saknas den cachade offline-sidan (precachningen kan ha misslyckats)
        // – hämta den nu om nätet hunnit komma tillbaka.
        await ensureOfflineCached();
        offline = await pages.match(OFFLINE_URL);
      }
      if (offline) return offline;
      // Sista utväg: hellre ett tydligt svenskt meddelande än webbläsarens
      // egen felsida, som ser ut som att sidan inte finns.
      return offlineFallbackResponse();
    }
    return Response.error();
  }
}

// Ser till att offline-sidan finns i cachen. Tyst om den inte går att hämta.
async function ensureOfflineCached() {
  try {
    const cache = await caches.open(PAGE_CACHE);
    if (await cache.match(OFFLINE_URL)) return;
    await cache.add(OFFLINE_URL);
  } catch {
    /* nätet nere – vi försöker igen nästa gång */
  }
}

// Minimal inbyggd offline-sida som alltid kan levereras.
function offlineFallbackResponse() {
  return new Response(
    `<!doctype html><html lang="sv"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ingen anslutning</title>
<style>body{margin:0;min-height:100svh;display:grid;place-items:center;
font-family:system-ui,sans-serif;background:#f6f7f9;color:#1c2333;padding:2rem}
div{max-width:22rem;text-align:center}h1{font-size:1.125rem;margin:0 0 .5rem}
p{margin:0;font-size:.875rem;color:#5b6478}</style>
<div><h1>Ingen anslutning</h1><p>Sidan kunde inte hämtas. Kontrollera n&auml;tet och f&ouml;rs&ouml;k igen.</p></div>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
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
