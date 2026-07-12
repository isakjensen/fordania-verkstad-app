"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Keyboard,
  X,
  Loader2,
  Check,
  ChevronRight,
  Search,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  extractPlateCandidates,
  matchPlate,
  normalizePlate,
  isSwedishPlate,
  type ScanFleetVehicle,
  type PlateMatch,
} from "@/lib/plate-ocr";
import { scanFrame, warmUpPlateReader } from "@/lib/plate-alpr";

type Mode = "scanning" | "manual";

/** Avstånd upp till detta räknas som en säker flottaträff (av 6 tecken). */
const CONFIDENT = 1;
/** Så många bildrutor i rad måste peka på samma bil innan vi öppnar den. */
const STABLE_HITS = 2;
/** Minsta teckensäkerhet från OCR för att en avläsning ska räknas. */
const MIN_CHAR_SCORE = 0.5;
/** Paus mellan skanningar (ms) – inferensen tar tid ändå. */
const SCAN_GAP = 250;

export function PlateScanner({ fleet }: { fleet: ScanFleetVehicle[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scanning");
  const [modelsReady, setModelsReady] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlateMatch[]>([]);
  const [locked, setLocked] = useState<PlateMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  // Rullande röstning: senaste bilars id för att kräva stabilitet.
  const lastVehicleRef = useRef<string | null>(null);
  const hitCountRef = useRef(0);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const open = useCallback(
    (id: string) => {
      scanningRef.current = false;
      stopCamera();
      router.push(`/scanna/${id}`);
    },
    [router, stopCamera],
  );

  // En skanning av aktuell videobild.
  const scanOnce = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    let reading_;
    try {
      reading_ = await scanFrame(video, { minDetectionScore: 0.5 });
    } catch {
      return;
    }
    if (!scanningRef.current) return;
    if (!reading_ || reading_.score < MIN_CHAR_SCORE) return;

    // Bara svenska skyltformat får agera – utländska ignoreras helt.
    const candidates = extractPlateCandidates(reading_.text).filter(
      isSwedishPlate,
    );
    if (candidates.length === 0) return;

    setReading(candidates[0]);

    const ranked = matchPlate(candidates, fleet).slice(0, 4);
    setSuggestions(ranked);

    const best = ranked[0];
    if (best && best.distance <= CONFIDENT) {
      // Kräv att samma bil dyker upp i flera bildrutor i rad.
      if (lastVehicleRef.current === best.vehicle.id) {
        hitCountRef.current += 1;
      } else {
        lastVehicleRef.current = best.vehicle.id;
        hitCountRef.current = 1;
      }
      if (hitCountRef.current >= STABLE_HITS) {
        setLocked(best);
        open(best.vehicle.id);
      }
    } else {
      // Ingen säker träff – nollställ räknaren.
      lastVehicleRef.current = null;
      hitCountRef.current = 0;
    }
  }, [fleet, open]);

  // Skanningsloop – körs så länge kameran är igång.
  const runLoop = useCallback(async () => {
    while (scanningRef.current) {
      await scanOnce();
      if (!scanningRef.current) break;
      await new Promise((r) => setTimeout(r, SCAN_GAP));
    }
  }, [scanOnce]);

  const startCamera = useCallback(async () => {
    setError(null);
    setReading(null);
    setSuggestions([]);
    setLocked(null);
    lastVehicleRef.current = null;
    hitCountRef.current = 0;
    setMode("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      scanningRef.current = true;
      void runLoop();
    } catch (err) {
      stopCamera();
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Kameran nekades. Tillåt kamera i webbläsaren, eller skriv in reg.nr."
          : name === "NotFoundError"
            ? "Ingen kamera hittades. Skriv in reg.nr i stället."
            : "Kunde inte öppna kameran. Skriv in reg.nr i stället.",
      );
      setMode("manual");
    }
  }, [runLoop, stopCamera]);

  // Öppna kameran direkt när sidan visas + värm upp modellerna parallellt.
  useEffect(() => {
    warmUpPlateReader()
      .then(() => setModelsReady(true))
      .catch(() => setModelsReady(true)); // modellerna laddas ändå vid första skanningen
    void startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = normalizePlate(query);
    const list = q
      ? fleet.filter((v) => normalizePlate(v.regNo).includes(q))
      : fleet;
    return list.slice(0, 30);
  }, [fleet, query]);

  const switchToManual = useCallback(() => {
    stopCamera();
    setMode("manual");
  }, [stopCamera]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-4">
      {/* Rubrik */}
      <div className="mb-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Verkstad
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-ink">
          Skanna skylt
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Håll mobilen mot registreringsskylten inom ramen – bilen hämtas
          automatiskt.
        </p>
      </div>

      {/* ---------- SKANNING ---------- */}
      {mode === "scanning" && (
        <div className="flex flex-1 flex-col">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-ink">
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />

            {/* Skyltguide + skannlinje */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  "relative h-[26%] w-[86%] overflow-hidden rounded-lg ring-2 shadow-[0_0_0_1000px_rgb(9_16_28/0.45)] transition-colors",
                  locked ? "ring-success" : "ring-white/90",
                )}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-ink">
                  {locked ? "Bil hittad!" : "Håll skylten inom ramen"}
                </span>
                {!locked && (
                  <span className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-brand-400/90" />
                )}
              </div>
            </div>

            {/* Status uppe till vänster */}
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {locked ? (
                <>
                  <Check className="size-3.5 text-success" />
                  Öppnar…
                </>
              ) : !modelsReady ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Laddar skannern…
                </>
              ) : reading ? (
                <>
                  <ScanLine className="size-3.5 text-brand-300" />
                  {reading}
                </>
              ) : (
                <>
                  <ScanLine className="size-3.5 animate-pulse text-brand-300" />
                  Letar efter skylt…
                </>
              )}
            </div>

            {/* Stäng/byt till manuell */}
            <button
              type="button"
              onClick={switchToManual}
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-ink/50 text-white backdrop-blur-sm active:bg-ink/70"
              aria-label="Skriv in reg.nr i stället"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Närmaste träffar – dyker upp direkt, tryckbara om man vill välja själv */}
          {suggestions.length > 0 && !locked ? (
            <div className="mt-4">
              <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Närmaste fordon
              </p>
              <div className="flex flex-col gap-2">
                {suggestions.map((m) => (
                  <button
                    key={m.vehicle.id}
                    type="button"
                    onClick={() => open(m.vehicle.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      m.distance <= CONFIDENT
                        ? "border-brand-200 bg-brand-50 active:bg-brand-100"
                        : "border-line bg-surface active:bg-surface-muted",
                    )}
                  >
                    <LicensePlate value={m.vehicle.regNo} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {[m.vehicle.brand, m.vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </span>
                    <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {modelsReady
                ? "Rikta kameran mot skylten så läser appen den automatiskt."
                : "Förbereder skannern första gången…"}
            </p>
          )}

          <button
            type="button"
            onClick={switchToManual}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink-soft transition-colors active:bg-surface-muted"
          >
            <Keyboard className="size-4.5" />
            Skriv in reg.nr i stället
          </button>
        </div>
      )}

      {/* ---------- MANUELL ---------- */}
      {mode === "manual" && (
        <div className="flex flex-1 flex-col">
          {error ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm text-ink-soft">
              <TriangleAlert className="size-4.5 shrink-0 text-warning" />
              {error}
            </div>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputMode="text"
              placeholder="Sök reg.nr…"
              className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base font-semibold uppercase tracking-wide text-ink outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-brand-400"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => open(v.id)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors active:bg-surface-muted"
              >
                <LicensePlate value={v.regNo} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                </span>
                <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Inget fordon matchar “{query}”.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setQuery("");
              void startCamera();
            }}
            className="mt-4 flex items-center justify-center gap-2 py-2 text-center text-sm font-semibold text-brand-700 active:text-brand-800"
          >
            <ScanLine className="size-4.5" />
            Skanna med kameran i stället
          </button>
        </div>
      )}
    </div>
  );
}
