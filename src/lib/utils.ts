import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Slår ihop klassnamn villkorligt (clsx) och löser Tailwind-konflikter (twMerge).
 * Används genomgående i UI-komponenterna för att kunna skicka in `className`-overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
