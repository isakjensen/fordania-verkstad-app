"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudOff, Info, RefreshCw, WifiOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LAST_SYNC_KEY = "fv-last-sync";

/**
 * PwaManager – global klientkontroller för PWA-läget:
 *  1. Registrerar service workern (endast i produktion).
 *  2. Spårar online/offline och tidpunkten då datan senast hämtades färsk.
 *  3. Visar en tydlig offline-bar högst upp som öppnar en förklarande modal.
 *
 * Baren tar plats via CSS-variabeln `--fv-topgap` (sätts till barens
 * uppmätta höjd) så app-skalen kan knuffas ned i stället för att döljas.
 */
export function PwaManager() {
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [now, setNow] = useState(() => 0);
  const [modalOpen, setModalOpen] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Markera att vi just haft färsk data (spara tidpunkten lokalt).
  const markSynced = useCallback(() => {
    const t = Date.now();
    try {
      window.localStorage.setItem(LAST_SYNC_KEY, String(t));
    } catch {
      /* privat läge m.m. – strunta i det */
    }
    setLastSync(t);
  }, []);

  // Init: läs status + senaste synk, registrera lyssnare och service worker.
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());

    const isOnline = navigator.onLine;
    setOnline(isOnline);

    const stored = Number(window.localStorage.getItem(LAST_SYNC_KEY));
    if (stored) setLastSync(stored);
    if (isOnline) markSynced();

    const handleOnline = () => {
      setOnline(true);
      markSynced();
    };
    const handleOffline = () => setOnline(false);
    const handleVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        markSynced();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisible);

    // Håll relativ tid och senaste synk aktuella.
    const heartbeat = window.setInterval(() => {
      setNow(Date.now());
      if (navigator.onLine) markSynced();
    }, 30_000);

    // Service worker – bara i produktion (Turbopack-dev + SW-cache krockar).
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* SW ej kritisk för att appen ska fungera online */
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisible);
      window.clearInterval(heartbeat);
    };
  }, [markSynced]);

  // Reservera plats för baren (matchar dess faktiska höjd inkl. safe-area).
  useEffect(() => {
    const root = document.documentElement;
    if (mounted && !online && barRef.current) {
      const apply = () => {
        root.style.setProperty(
          "--fv-topgap",
          `${barRef.current?.offsetHeight ?? 0}px`,
        );
      };
      apply();
      const observer = new ResizeObserver(apply);
      observer.observe(barRef.current);
      return () => {
        observer.disconnect();
        root.style.setProperty("--fv-topgap", "0px");
      };
    }
    root.style.setProperty("--fv-topgap", "0px");
  }, [mounted, online]);

  const showBar = mounted && !online;

  return (
    <>
      {showBar && (
        <div
          ref={barRef}
          className="fixed inset-x-0 top-0 z-50 pt-safe animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-haspopup="dialog"
            className="flex w-full items-center justify-center gap-2 bg-warning px-3 py-2 text-center text-[0.8rem] font-semibold text-white transition-colors hover:bg-warning/90 active:bg-warning/90"
          >
            <WifiOff className="size-4 shrink-0" />
            <span>Offline-läge – visar sparad data</span>
            <Info className="size-3.5 shrink-0 opacity-80" />
          </button>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-warning-soft text-warning">
              <CloudOff className="size-6" />
            </span>
            <DialogTitle>Du är i offline-läge</DialogTitle>
            <DialogDescription>
              Enheten saknar internetanslutning. Appen fortsätter fungera och
              visar den data som senast hämtades – men den kan vara inaktuell.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 flex items-start gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-3">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Datan hämtades senast
              </p>
              <p className="text-sm font-semibold text-ink">
                {lastSync ? formatAbsolute(lastSync) : "Okänt"}
              </p>
              {lastSync ? (
                <p className="text-xs text-muted-foreground">
                  {formatRelative(lastSync, now)}
                </p>
              ) : null}
            </div>
          </div>

          <ul className="mt-1 flex flex-col gap-2.5 text-sm text-ink-soft">
            <li className="flex gap-2.5">
              <Dot />
              <span>
                Sidor du redan besökt visas från en sparad kopia och kan skilja
                sig från hur det faktiskt ser ut just nu.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Dot />
              <span>
                Ändringar och nya uppgifter kan inte sparas förrän du är online
                igen.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Dot />
              <span>
                Så fort anslutningen är tillbaka uppdateras allt automatiskt med
                färsk data.
              </span>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Dot() {
  return (
    <span
      className={cn(
        "mt-1.5 size-1.5 shrink-0 rounded-full bg-warning",
      )}
      aria-hidden
    />
  );
}

function formatAbsolute(ts: number) {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString("sv-SE");
  }
}

function formatRelative(ts: number, now: number) {
  const diff = Math.max(0, (now || Date.now()) - ts);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "för mindre än en minut sedan";
  if (min < 60) return `för ${min} min sedan`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `för ${hours} ${hours === 1 ? "timme" : "timmar"} sedan`;
  const days = Math.round(hours / 24);
  return `för ${days} ${days === 1 ? "dag" : "dagar"} sedan`;
}
