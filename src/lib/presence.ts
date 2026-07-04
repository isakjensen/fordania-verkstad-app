import "server-only";
import { db } from "@/lib/db";

/** Tidsfönster (ms) inom vilket en användare räknas som "inne nu". */
export const PRESENCE_WINDOW_MS = 3 * 60_000;
/** Uppdatera inte oftare än så här (skoning av DB vid många navigeringar). */
const THROTTLE_MS = 45_000;

/**
 * Markerar användaren som aktiv nu (uppdaterar lastSeenAt), men som mest
 * ungefär en gång per THROTTLE_MS. Får aldrig kasta.
 */
export async function touchPresence(userId: string): Promise<void> {
  try {
    await db.user.updateMany({
      where: {
        id: userId,
        OR: [
          { lastSeenAt: null },
          { lastSeenAt: { lt: new Date(Date.now() - THROTTLE_MS) } },
        ],
      },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    // Närvaro får aldrig stoppa en sidladdning.
  }
}

/** True om användaren varit aktiv inom närvarofönstret. */
export function isOnline(lastSeenAt: Date | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < PRESENCE_WINDOW_MS;
}
