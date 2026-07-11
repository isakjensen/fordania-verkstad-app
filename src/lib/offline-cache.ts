/**
 * Rensar offline-cachen med inloggat sidinnehåll (cacharna `*-pages` och
 * `*-rsc` som service workern i `public/sw.js` fyller). Anropas vid utloggning
 * och vid verkstadsbyte så att en användare aldrig kan se en annan användares
 * eller verkstads cachade sidor i offline-läge.
 *
 * Den statiska app-cachen (`*-static`, JS/CSS/ikoner) lämnas orörd – den
 * innehåller ingen känslig data och behövs för att appen ska starta offline.
 *
 * Klientfunktion: använder CacheStorage (`caches`) som finns i webbläsaren.
 * Misslyckas tyst om Cache Storage saknas (privat läge, äldre webbläsare).
 */
export async function clearOfflinePageCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.includes("-pages") || key.includes("-rsc"))
        .map((key) => caches.delete(key)),
    );
  } catch {
    /* Cache Storage ej tillgängligt – strunta i det, appen fungerar ändå */
  }
}
