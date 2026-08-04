import Link from "next/link";
import { AlignLeft, Car, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/components/ui/license-plate";
import { statusMeta, statusLabels } from "../planering/calendar-meta";
import { DoneToggle } from "./done-toggle";
import type { JobForDay } from "@/lib/data/schedule";

const tf = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});

/** "2 h", "45 min", "1 h 30 min" – hur lång tid uppdraget är avsatt. */
function duration(min: number | null | undefined) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/**
 * Ett uppdrag i mekanikerns dag.
 *
 * Kortet är byggt för en telefon i en verkstad: tiden och registreringsnumret
 * är det man letar efter, klar-knappen är det man trycker på, och resten är
 * stödinformation. Därför ligger tid och status överst, skylten som kortets
 * rubrik, och knappen ensam längst ner där tummen når.
 *
 * Statusen bärs av en färgad kant i vänsterkanten i stället för ännu en bricka
 * – då går det att skanna en hel dag på kanterna utan att läsa ett ord. Det
 * uppdrag som pågår lyfts dessutom med en ram och en tydlig etikett, och
 * klara uppdrag tonas ner så att det som återstår är det som syns.
 */
export function JobCard({
  job,
  isNext,
}: {
  job: JobForDay;
  /** Nästa uppdrag som inte påbörjats – markeras som "Härnäst". */
  isNext?: boolean;
}) {
  const meta = statusMeta[job.status] ?? statusMeta.planned;
  const ongoing = job.status === "in_progress";
  const done = job.status === "done";
  const dur = duration(job.durationMin);
  const vehicle = job.vehicles[0]?.vehicle ?? null;
  const extraVehicles = Math.max(0, job.vehicles.length - 1);

  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface shadow-card transition-colors",
        ongoing
          ? "border-info/45 ring-1 ring-info/25"
          : "border-line hover:border-line-strong",
        done && "opacity-70",
      )}
    >
      {/* Statusfärgad kant. Ligger som ett eget lager i kortets vänsterkant
          så den följer hörnradien utan att påverka innehållets padding. */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", meta.accent)}
      />

      {/* Hela kortet öppnar arbetsordern. Länken är ett genomskinligt lager
          ovanpå, inte en wrapper – annars hamnar klar-knappen inuti en länk. */}
      <Link
        href={`/arbetsordrar/${job.id}`}
        aria-label={`Öppna ${job.type}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <div className="py-3.5 pl-5 pr-3.5">
        {/* Rad 1: tid och status. Får radbrytas: på en smal telefon ryms inte
            alltid tid + brådskande + "Väntar på delar" på samma rad, och då är
            en ny rad snyggare än tre hopklämda halvor. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p className="whitespace-nowrap text-[0.95rem] font-bold tabular-nums text-ink">
            {job.scheduledStart ? tf.format(new Date(job.scheduledStart)) : "—"}
            {job.scheduledEnd ? (
              <span className="font-semibold text-muted-foreground">
                {"–"}
                {tf.format(new Date(job.scheduledEnd))}
              </span>
            ) : null}
          </p>
          {dur ? (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {dur}
            </span>
          ) : null}

          <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            {job.priority === "high" && !done ? (
              <span className="whitespace-nowrap rounded-full bg-danger-soft px-2 py-0.5 text-[0.7rem] font-bold text-danger">
                Brådskande
              </span>
            ) : null}
            {ongoing ? (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-info-soft px-2.5 py-0.5 text-[0.7rem] font-bold text-info">
                {/* Pulsen säger "just nu" utan att skrika. */}
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-info/60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-info" />
                </span>
                Pågår nu
              </span>
            ) : isNext ? (
              <span className="whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-0.5 text-[0.7rem] font-bold text-brand-700">
                Härnäst
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold",
                  meta.badge,
                )}
              >
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", meta.dot)}
                />
                {statusLabels[job.status] ?? job.status}
              </span>
            )}
          </span>
        </div>

        {/* Rad 2: fordonet – kortets rubrik. Skylten är det mekanikern letar
            efter när hen står vid bilen. */}
        <div className="mt-2.5 flex items-center gap-2.5">
          {vehicle ? (
            <LicensePlate value={vehicle.regNo} className="shrink-0" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
              <Car className="size-4.5" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {job.type}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {vehicle
                ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
                  "Okänt fordon"
                : "Inget fordon kopplat"}
              {extraVehicles ? ` · +${extraVehicles} fordon till` : ""}
            </span>
          </span>
        </div>

        {/* Rad 3: beskrivningen, klippt till två rader så ett långt stycke
            inte trycker ner knappen ur bild. */}
        {job.description ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-muted-foreground">
            <AlignLeft className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{job.description}</span>
          </p>
        ) : null}

        {/* Rad 4: handlingen. Ensam på sin rad, där tummen når. */}
        <div className="mt-3 flex items-center gap-2">
          <DoneToggle jobId={job.id} done={done} />
          <span className="relative z-20 ml-auto inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
            Öppna
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>
    </li>
  );
}
