"use client";

import { createContext, useContext } from "react";

/**
 * Bär id:t på den arbetsorder som just släppts vid drag-och-släpp. Kortet med
 * det id:t spelar en "glid in"-animation när det renderas på sin nya plats.
 * Context används för att slippa tråda propen genom alla memo:ade rad-/cell-lager.
 */
const MovedContext = createContext<string | null>(null);

export const MovedProvider = MovedContext.Provider;

/** True om ordern precis flyttats hit och ska animeras in. */
export function useJustMoved(jobId: string): boolean {
  return useContext(MovedContext) === jobId;
}

/** Rå-id:t på den order som just flyttats (eller null). */
export function useMovedId(): string | null {
  return useContext(MovedContext);
}
