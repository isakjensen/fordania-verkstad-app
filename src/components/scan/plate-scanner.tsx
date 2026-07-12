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
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  matchPlate,
  normalizePlate,
  isSwedishPlate,
  type ScanFleetVehicle,
  type PlateMatch,
} from "@/lib/plate-ocr";
import { scanFrame, warmUpPlateReader } from "@/lib/plate-alpr";

type Mode = "scanning" | "manual";

/** Så många gånger samma skylt måste läsas innan vi litar på avläsningen. */
const REQUIRED_VOTES = 3;
/** Hur många av de senaste avläsningarna vi räknar röster bland. */
const VOTE_WINDOW = 5;
/** Minsta teckensäkerhet från OCR för att en avläsning ska räknas. */
const MIN_CHAR_SCORE = 0.55;
/** Paus mellan skanningar (ms) – inferensen tar tid ändå. */
const SCAN_GAP = 200;

/** Det bekräftade resultatet efter röstning. */
interface ScanResult {
  plate: string;
  matches: PlateMatch[];
  /** Exakt träff i registret (avstånd 0) – då öppnar vi bilen direkt. */
  exact: PlateMatch | null;
}

/**
 * Räknar ut vilken del av KÄLLBILDEN som motsvarar rutan användaren siktar
 * med. Videon visas med `object-cover` i en 4:3-ruta, så bara mitten av
 * kamerabilden syns – och vi vill BARA läsa av det som ligger i den synliga
 * ramen, annars fångar detektorn bakgrundsbilar och läser fel skylt.
 */
function guideRegion(vw: number, vh: number) {
  const containerAR = 4 / 3;
  const sourceAR = vw / vh;
  let visW: number, visH: number, visX: number, visY: number;
  if (sourceAR > containerAR) {
    // Bredare källa: hela höjden syns, sidorna beskärs.
    visH = vh;
    visW = vh * containerAR;
    visX = (vw - visW) / 2;
    visY = 0;
  } else {
    // Högre källa: hela bredden syns, topp/botten beskärs.
    visW = vw;
    visH = vw / containerAR;
    visX = 0;
    visY = (vh - visH) / 2;
  }
  // Något generösare än den synliga ramen (0.86 × 0.26) så en skylt som inte
  // är perfekt centrerad ändå fångas – men fortfarande bara mittområdet.
  const wFrac = 0.9;
  const hFrac = 0.42;
  const w = visW * wFrac;
  const h = visH * hFrac;
  return {
    x: visX + (visW - w) / 2,
    y: visY + (visH - h) / 2,
    w,
    h,
  };
}

export function PlateScanner({ fleet }: { fleet: ScanFleetVehicle[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scanning");
  const [modelsReady, setModelsReady] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  // Rullande röstning på de senaste avlästa skyltarna.
  const votesRef = useRef<string[]>([]);

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

  // Beskär videobilden till siktrutan och returnerar en canvas för avläsning.
  const roiCanvas = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const { x, y, w, h } = guideRegion(video.videoWidth, video.videoHeight);
    if (!roiCanvasRef.current) {
      roiCanvasRef.current = document.createElement("canvas");
    }
    const canvas = roiCanvasRef.current;
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  // En skanning av aktuell videobild.
  const scanOnce = useCallback(async () => {
    const canvas = roiCanvas();
    if (!canvas) return;

    let reading_;
    try {
      reading_ = await scanFrame(canvas, { minDetectionScore: 0.5 });
    } catch {
      return;
    }
    if (!scanningRef.current) return;
    if (!reading_ || reading_.score < MIN_CHAR_SCORE) return;

    // Bara giltiga svenska skyltformat får rösta – allt annat ignoreras.
    const plate = normalizePlate(reading_.text);
    if (!isSwedishPlate(plate)) return;

    // Lägg rösten i det rullande fönstret.
    const votes = votesRef.current;
    votes.push(plate);
    if (votes.length > VOTE_WINDOW) votes.shift();

    // Räkna vilken skylt som leder.
    const counts = new Map<string, number>();
    for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
    let leader = plate;
    let leaderCount = 0;
    for (const [p, c] of counts) {
      if (c > leaderCount) {
        leader = p;
        leaderCount = c;
      }
    }
    setReading(leader);
    setVoteCount(leaderCount);

    // Inte tillräckligt säkra ännu – fortsätt läsa.
    if (leaderCount < REQUIRED_VOTES) return;

    // Bekräftad avläsning. Matcha mot registret.
    const matches = matchPlate([leader], fleet);
    const exact = matches[0] && matches[0].distance === 0 ? matches[0] : null;

    if (exact) {
      // Exakt träff → öppna bilen direkt.
      open(exact.vehicle.id);
      return;
    }

    // Läste en giltig skylt men ingen exakt träff i registret. Stanna och
    // visa avläsningen + närmaste fordon i stället för att gissa fel bil.
    scanningRef.current = false;
    setResult({ plate: leader, matches: matches.slice(0, 4), exact: null });
  }, [fleet, open, roiCanvas]);

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
    setVoteCount(0);
    setResult(null);
    votesRef.current = [];
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

  // Starta om skanningen (efter ett resultat utan träff).
  const rescan = useCallback(() => {
    votesRef.current = [];
    setReading(null);
    setVoteCount(0);
    setResult(null);
    scanningRef.current = true;
    void runLoop();
  }, [runLoop]);

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
                  result ? "ring-success" : "ring-white/90",
                )}
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-ink">
                  Håll skylten inom ramen
                </span>
                {!result && (
                  <span className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-brand-400/90" />
                )}
              </div>
            </div>

            {/* Status uppe till vänster */}
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {!modelsReady ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Laddar skannern…
                </>
              ) : reading ? (
                <>
                  <ScanLine className="size-3.5 text-brand-300" />
                  {reading}
                  <span className="ml-0.5 tabular-nums text-white/70">
                    {Math.min(voteCount, REQUIRED_VOTES)}/{REQUIRED_VOTES}
                  </span>
                </>
              ) : (
                <>
                  <ScanLine className="size-3.5 animate-pulse text-brand-300" />
                  Letar efter skylt…
                </>
              )}
            </div>

            {/* Byt till manuell */}
            <button
              type="button"
              onClick={switchToManual}
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-ink/50 text-white backdrop-blur-sm active:bg-ink/70"
              aria-label="Skriv in reg.nr i stället"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Resultat: läste en giltig skylt men ingen exakt träff i registret */}
          {result ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm text-ink-soft">
                <TriangleAlert className="size-4.5 shrink-0 text-warning" />
                <span>
                  Läste{" "}
                  <span className="font-bold text-ink">{result.plate}</span> –
                  finns inte i registret. Välj rätt fordon nedan eller skanna
                  igen.
                </span>
              </div>

              {result.matches.length > 0 ? (
                <>
                  <p className="mb-1.5 mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Närmaste fordon
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.matches.map((m) => (
                      <button
                        key={m.vehicle.id}
                        type="button"
                        onClick={() => open(m.vehicle.id)}
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors active:bg-surface-muted"
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
                </>
              ) : null}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={rescan}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink-soft active:bg-surface-muted"
                >
                  <RotateCcw className="size-4.5" />
                  Skanna igen
                </button>
                <button
                  type="button"
                  onClick={switchToManual}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink-soft active:bg-surface-muted"
                >
                  <Keyboard className="size-4.5" />
                  Skriv in
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {modelsReady
                  ? "Rikta kameran mot skylten så läser appen den automatiskt."
                  : "Förbereder skannern första gången…"}
              </p>
              <button
                type="button"
                onClick={switchToManual}
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink-soft transition-colors active:bg-surface-muted"
              >
                <Keyboard className="size-4.5" />
                Skriv in reg.nr i stället
              </button>
            </>
          )}
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
