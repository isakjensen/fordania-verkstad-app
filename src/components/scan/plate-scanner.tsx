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
  Plus,
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
import { addScannedVehicle } from "@/app/(workshop)/scanna/actions";

type Mode = "scanning" | "manual";

/** Så många gånger samma skylt måste läsas innan vi litar på avläsningen. */
const REQUIRED_VOTES = 3;
/** Hur många av de senaste avläsningarna vi räknar röster bland. */
const VOTE_WINDOW = 5;
/** Minsta teckensäkerhet från OCR för att en avläsning ska räknas. */
const MIN_CHAR_SCORE = 0.55;
/** Paus mellan skanningar (ms) – inferensen tar tid ändå. */
const SCAN_GAP = 200;

/** Siktrutans andel av skärmen (bredd × höjd). Detektionen sker något
 *  generösare än så, se DETECT_*-fraktionerna. */
const GUIDE_W = 0.86;
const GUIDE_H = 0.16;
const DETECT_W = 0.9;
const DETECT_H = 0.24;

/** Det bekräftade resultatet efter röstning. */
interface ScanResult {
  plate: string;
  matches: PlateMatch[];
}

/**
 * Räknar ut vilken del av KÄLLBILDEN som motsvarar siktrutan. Videon visas
 * med `object-cover` i en helskärmsruta, så bara mitten av kamerabilden syns
 * – och vi vill BARA läsa av det som ligger i ramen, annars fångar detektorn
 * bakgrundsbilar och läser fel skylt.
 */
function guideRegion(
  vw: number,
  vh: number,
  containerAR: number,
  wFrac: number,
  hFrac: number,
) {
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
  const w = visW * wFrac;
  const h = visH * hFrac;
  return { x: visX + (visW - w) / 2, y: visY + (visH - h) / 2, w, h };
}

export function PlateScanner({ fleet }: { fleet: ScanFleetVehicle[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scanning");
  const [modelsReady, setModelsReady] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const votesRef = useRef<string[]>([]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Stäng skannern och gå tillbaka dit man kom ifrån (annars översikten).
  const close = useCallback(() => {
    stopCamera();
    if (window.history.length > 1) router.back();
    else router.push("/");
  }, [router, stopCamera]);

  const open = useCallback(
    (id: string) => {
      scanningRef.current = false;
      stopCamera();
      // Full sidladdning i stället för klient-navigering: skannern lever i ett
      // eget helskärmsskal, och en mjuk RSC-navigering därifrån till
      // fordonsvyn kunde landa på "sidan hittades inte" tills man laddade om.
      // En riktig navigering laddar fordonsvyn rent varje gång.
      window.location.assign(`/scanna/${id}`);
    },
    [stopCamera],
  );

  // Beskär videobilden till siktrutan och returnerar en canvas för avläsning.
  const roiCanvas = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const cw = video.clientWidth || 1;
    const ch = video.clientHeight || 1;
    const { x, y, w, h } = guideRegion(
      video.videoWidth,
      video.videoHeight,
      cw / ch,
      DETECT_W,
      DETECT_H,
    );
    if (!roiCanvasRef.current) {
      roiCanvasRef.current = document.createElement("canvas");
    }
    const canvas = roiCanvasRef.current;
    canvas.width = Math.max(1, Math.round(w));
    canvas.height = Math.max(1, Math.round(h));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

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

    const plate = normalizePlate(reading_.text);
    if (!isSwedishPlate(plate)) return;

    const votes = votesRef.current;
    votes.push(plate);
    if (votes.length > VOTE_WINDOW) votes.shift();

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

    if (leaderCount < REQUIRED_VOTES) return;

    // Bekräftad avläsning.
    const matches = matchPlate([leader], fleet);
    const exact = matches[0] && matches[0].distance === 0 ? matches[0] : null;
    if (exact) {
      open(exact.vehicle.id);
      return;
    }
    // Giltig skylt men ingen exakt träff → stanna och visa resultat.
    scanningRef.current = false;
    setResult({ plate: leader, matches: matches.slice(0, 3) });
  }, [fleet, open, roiCanvas]);

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

  useEffect(() => {
    warmUpPlateReader()
      .then(() => setModelsReady(true))
      .catch(() => setModelsReady(true));
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

  const rescan = useCallback(() => {
    votesRef.current = [];
    setReading(null);
    setVoteCount(0);
    setResult(null);
    scanningRef.current = true;
    void runLoop();
  }, [runLoop]);

  // Lägg till ett nytt fordon för den avlästa (okända) skylten.
  const addVehicle = useCallback(
    async (plate: string) => {
      setAdding(true);
      setError(null);
      const res = await addScannedVehicle(plate);
      setAdding(false);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      open(res.vehicleId);
    },
    [open],
  );

  // ---------- MANUELL (fullskärm, ljust) ----------
  if (mode === "manual") {
    return (
      <div className="flex h-full flex-col bg-canvas px-4 pt-safe pb-safe animate-sheet-up">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-lg font-bold tracking-[-0.01em] text-ink">
            Sök fordon
          </h1>
          <button
            type="button"
            onClick={close}
            className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-ink-soft active:bg-line"
            aria-label="Stäng"
          >
            <X className="size-5" />
          </button>
        </div>

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

        <div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
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
          className="mt-3 flex items-center justify-center gap-2 rounded-xl brand-fill py-3.5 text-sm font-bold"
        >
          <ScanLine className="size-4.5" />
          Skanna med kameran
        </button>
      </div>
    );
  }

  // ---------- SKANNING (fullskärm kamera) ----------
  return (
    <div className="relative h-full w-full overflow-hidden bg-ink text-white select-none animate-sheet-up">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 size-full object-cover"
      />

      {/* Siktruta + skannlinje, centrerad */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl ring-2 shadow-[0_0_0_100vmax_rgb(9_16_28/0.55)] transition-colors",
            result ? "ring-success" : "ring-white/90",
          )}
          style={{ width: `${GUIDE_W * 100}%`, height: `${GUIDE_H * 100}%` }}
        >
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-[#172230]">
            {result ? "Skylt avläst" : "Håll skylten inom ramen"}
          </span>
          {!result && (
            <span className="absolute inset-x-0 top-0 h-0.5 animate-scan bg-brand-400/90" />
          )}
        </div>
      </div>

      {/* Topprad: status + stäng */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-safe">
        <div className="mt-3 flex items-center gap-2 rounded-full bg-ink/55 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
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
        <button
          type="button"
          onClick={close}
          className="mt-3 flex size-10 items-center justify-center rounded-full bg-ink/55 backdrop-blur-sm active:bg-ink/75"
          aria-label="Stäng skannern"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Botten: resultat-kort eller enbart skriv-in-knappen */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-safe">
        {result ? (
          <div className="mb-4 rounded-2xl bg-surface p-4 text-ink shadow-lift animate-fade-up">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Avläst:</span>
              <LicensePlate value={result.plate} size="sm" />
              <span className="text-muted-foreground">
                – finns inte i registret
              </span>
            </div>

            <button
              type="button"
              onClick={() => addVehicle(result.plate)}
              disabled={adding}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl brand-fill py-3.5 text-sm font-bold disabled:opacity-60"
            >
              {adding ? (
                <Loader2 className="size-4.5 animate-spin" />
              ) : (
                <Plus className="size-4.5" />
              )}
              Lägg till {result.plate} som nytt fordon
            </button>

            {error ? (
              <p className="mt-2 text-center text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            {result.matches.length > 0 ? (
              <>
                <p className="mb-1.5 mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Menade du något av dessa?
                </p>
                <div className="flex flex-col gap-2">
                  {result.matches.map((m) => (
                    <button
                      key={m.vehicle.id}
                      type="button"
                      onClick={() => open(m.vehicle.id)}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left transition-colors active:bg-surface-muted"
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

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={rescan}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-2.5 text-sm font-semibold text-ink-soft active:bg-surface-muted"
              >
                <RotateCcw className="size-4.5" />
                Skanna igen
              </button>
              <button
                type="button"
                onClick={switchToManual}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-2.5 text-sm font-semibold text-ink-soft active:bg-surface-muted"
              >
                <Keyboard className="size-4.5" />
                Skriv in
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={switchToManual}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 py-3.5 text-sm font-bold text-[#172230] shadow-lift active:bg-white"
          >
            <Keyboard className="size-4.5" />
            Skriv in reg.nr istället
          </button>
        )}
      </div>
    </div>
  );
}
