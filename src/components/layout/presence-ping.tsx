"use client";

import { useEffect } from "react";
import { pingPresence } from "@/lib/presence-actions";

/**
 * Osynlig närvaro-heartbeat. Pingar servern när fliken är aktiv (vid mount,
 * var 60:e sekund samt när fliken får fokus) så att "inne nu" hålls färskt.
 */
export function PresencePing() {
  useEffect(() => {
    const ping = () => {
      if (!document.hidden) pingPresence().catch(() => {});
    };
    ping();
    const id = setInterval(ping, 60_000);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("focus", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("focus", ping);
    };
  }, []);
  return null;
}
