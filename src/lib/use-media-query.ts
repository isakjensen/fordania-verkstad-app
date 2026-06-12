"use client";

import { useEffect, useState } from "react";

/**
 * Returnerar om en media query matchar. Ger `null` fram tills komponenten
 * monterats på klienten – så anropare kan rendera ett neutralt skelett under
 * SSR och undvika hydreringsskillnad.
 */
export function useMediaQuery(query: string): boolean | null {
  const [match, setMatch] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return match;
}
