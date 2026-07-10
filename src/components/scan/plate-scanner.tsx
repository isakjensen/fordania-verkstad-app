"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Keyboard,
  X,
  Loader2,
  Check,
  ChevronRight,
  RotateCcw,
  Search,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  recognizePlate,
  extractPlateCandidates,
  matchPlate,
  normalizePlate,
  type ScanFleetVehicle,
  type PlateMatch,
} from "@/lib/plate-ocr";

type Mode = "intro" | "camera" | "processing" | "review" | "manual";

/** Avstånd upp till detta räknas som en säker träff (av 6 tecken). */
const CONFIDENT = 1;

export function PlateScanner({ fleet }: { fleet: ScanFleetVehicle[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("intro");
  const [matches, setMatches] = useState<PlateMatch[]>([]);
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setMode("camera");
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
  }, [stopCamera]);

  // Städa alltid upp kameran när komponenten lämnas.
  useEffect(() => stopCamera, [stopCamera]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    // Beskär till mittbandet där skylten ligger (samma yta som guiden) –
    // ger Tesseract mycket bättre träff än hela bilden.
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cw = vw * 0.86;
    const ch = vh * 0.26;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, cw, ch);

    stopCamera();
    setMode("processing");
    try {
      const text = await recognizePlate(canvas);
      const candidates = extractPlateCandidates(text);
      setReading(candidates[0] ?? normalizePlate(text).slice(0, 7) ?? null);
      const ranked = matchPlate(candidates, fleet).slice(0, 5);
      setMatches(ranked);
      setMode("review");
    } catch {
      setError("Kunde inte läsa skylten. Försök igen eller skriv in reg.nr.");
      setMode("manual");
    }
  }, [fleet, stopCamera]);

  const open = useCallback(
    (id: string) => router.push(`/scanna/${id}`),
    [router],
  );

  const filtered = useMemo(() => {
    const q = normalizePlate(query);
    const list = q
      ? fleet.filter((v) => normalizePlate(v.regNo).includes(q))
      : fleet;
    return list.slice(0, 30);
  }, [fleet, query]);

  const best = matches[0];
  const confident = best && best.distance <= CONFIDENT;

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
          Rikta kameran mot registreringsskylten så hämtas bilen och dess
          arbetsordrar.
        </p>
      </div>

      {/* ---------- INTRO ---------- */}
      {mode === "intro" && (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            onClick={startCamera}
            className="group relative flex aspect-4/3 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-line bg-linear-to-b from-[#dcebfb] to-white text-brand-700 transition-colors active:from-[#cfe3f8]"
          >
            <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[0_8px_20px_-6px_rgb(26_100_189/0.6)]">
              <Camera className="size-8" strokeWidth={1.75} />
            </span>
            <span className="text-base font-bold">Öppna kameran</span>
            <span className="text-xs text-muted-foreground">
              {fleet.length} fordon i registret
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3.5 text-sm font-semibold text-ink-soft transition-colors active:bg-surface-muted"
          >
            <Keyboard className="size-4.5" />
            Skriv in reg.nr i stället
          </button>
        </div>
      )}

      {/* ---------- KAMERA ---------- */}
      {mode === "camera" && (
        <div className="flex flex-1 flex-col">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-ink">
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />
            {/* Skyltguide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[26%] w-[86%] rounded-lg ring-2 ring-white/90 shadow-[0_0_0_1000px_rgb(9_16_28/0.45)]">
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-ink">
                  Håll skylten inom ramen
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode("intro");
              }}
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-ink/50 text-white backdrop-blur-sm active:bg-ink/70"
              aria-label="Stäng kameran"
            >
              <X className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={capture}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 text-base font-bold text-white shadow-[0_8px_20px_-8px_rgb(26_100_189/0.7)] active:bg-brand-700"
          >
            <ScanLine className="size-5" />
            Läs skylten
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode("manual");
            }}
            className="mt-2 py-2 text-center text-sm font-semibold text-muted-foreground active:text-ink"
          >
            Skriv in reg.nr i stället
          </button>
        </div>
      )}

      {/* ---------- BEARBETAR ---------- */}
      {mode === "processing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <Loader2 className="size-9 animate-spin text-brand-600" />
          <div>
            <p className="text-base font-bold text-ink">Läser skylten…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Känner igen registreringsnumret
            </p>
          </div>
        </div>
      )}

      {/* ---------- RESULTAT / VÄLJ ---------- */}
      {mode === "review" && (
        <div className="flex flex-1 flex-col">
          {reading ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Avläst:{" "}
              <span className="font-semibold text-ink">{reading}</span>
            </p>
          ) : null}

          {confident ? (
            <button
              type="button"
              onClick={() => open(best.vehicle.id)}
              className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left transition-colors active:bg-brand-100"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <Check className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <LicensePlate value={best.vehicle.regNo} size="md" />
                <span className="mt-1.5 block truncate text-sm font-semibold text-ink">
                  {[best.vehicle.brand, best.vehicle.model]
                    .filter(Boolean)
                    .join(" ") || "Okänt fordon"}
                </span>
                <span className="text-xs text-brand-700">Öppna bilen</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-brand-600" />
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft px-3 py-2.5 text-sm text-ink-soft">
              <TriangleAlert className="size-4.5 shrink-0 text-warning" />
              Osäker träff – välj rätt bil nedan.
            </div>
          )}

          {/* Alternativ / närmaste träffar */}
          <p className="mb-1.5 mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {confident ? "Inte rätt? Närmaste andra" : "Närmaste fordon"}
          </p>
          <div className="flex flex-col gap-2">
            {matches.slice(confident ? 1 : 0, 4).map((m) => (
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

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink-soft active:bg-surface-muted"
            >
              <RotateCcw className="size-4.5" />
              Skanna igen
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink-soft active:bg-surface-muted"
            >
              <Keyboard className="size-4.5" />
              Skriv in
            </button>
          </div>
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
              setMode("intro");
            }}
            className="mt-4 py-2 text-center text-sm font-semibold text-muted-foreground active:text-ink"
          >
            ← Tillbaka
          </button>
        </div>
      )}

      {/* Dold canvas för bildinfångning */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
