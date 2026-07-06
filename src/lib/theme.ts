"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export const THEME_KEY = "fv-theme";

/**
 * Skript som körs före paint för att undvika "flash of wrong theme".
 * Default är alltid ljust – mörkt/system används bara om användaren valt det.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'light';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='system'&&m);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveDark(theme: Theme) {
  return theme === "dark" || (theme === "system" && systemPrefersDark());
}

export function applyTheme(theme: Theme) {
  const dark = resolveDark(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

function getStored(): Theme {
  if (typeof window === "undefined") return "light";
  const t = window.localStorage.getItem(THEME_KEY);
  return t === "light" || t === "dark" || t === "system" ? t : "light";
}

/**
 * Tema-hook: läser/sparar val och håller `system`-läget i synk med OS:et.
 * Returnerar `null` för theme tills komponenten monterats (undviker
 * hydreringsskillnad).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(getStored());
  }, []);

  // Följ OS-ändringar när "system" är valt.
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  function setTheme(next: Theme) {
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    setThemeState(next);
  }

  return { theme, setTheme };
}
