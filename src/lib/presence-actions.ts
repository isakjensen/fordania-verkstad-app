"use server";

import { getSession } from "@/lib/session";
import { touchPresence } from "@/lib/presence";

/** Heartbeat från klienten – markerar inloggad användare som aktiv. */
export async function pingPresence(): Promise<void> {
  const session = await getSession();
  if (session?.user?.id) {
    await touchPresence(session.user.id);
  }
}
