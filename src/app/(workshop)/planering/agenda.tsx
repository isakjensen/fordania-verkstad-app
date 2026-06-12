"use client";

import { useMemo, useState, useEffect } from "react";
import { Car, CalendarRange } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LicensePlate } from "@/components/ui/license-plate";
import { cn } from "@/lib/utils";
import type { ScheduleJob } from "@/lib/data/schedule";
import { statusMeta, statusLabels, priorityLabels } from "./calendar-meta";
import {
  WEEKDAYS_SHORT,
  WEEKDAYS_LONG,
  MONTHS,
  toParam,
  hm,
  startOfWeek,
  addDays,
  sameDay,
  isoDow,
  initialsOf,
} from "./calendar-utils";

function dayDiff(a: Date, b: Date) {
  const d0 = new Date(a);
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(b);
  d1.setHours(0, 0, 0, 0);
  return Math.round((d0.getTime() - d1.getTime()) / 86400000);
}
function relativeLabel(d: Date, today: Date) {
  const diff = dayDiff(d, today);
  if (diff === 0) return "Idag";
  if (diff === 1) return "Imorgon";
  if (diff === -1) return "Igår";
  return WEEKDAYS_LONG[isoDow(d)];
}

/**
 * Agendavy för iPad-stående / mobil: en veckorad med datumchips och en
 * tidslinje över vald dags arbetsordrar (tidsskena till vänster, status-prickar
 * och en "nu"-markör för idag). Helt touch-baserad – tryck på en order öppnar
 * detaljpanelen.
 */
export function Agenda({
  anchorISO,
  jobs,
  onOpen,
}: {
  anchorISO: string;
  jobs: ScheduleJob[];
  onOpen: (job: ScheduleJob) => void;
}) {
  const anchor = useMemo(() => new Date(anchorISO), [anchorISO]);
  const now = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(anchor);

  // När veckan/ankaret byts (via ‹ › i sidhuvudet) – välj om dagen.
  useEffect(() => {
    setSelected(anchor);
  }, [anchor]);

  const weekStart = startOfWeek(selected);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Gruppera ordrar per dag.
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleJob[]>();
    for (const j of jobs) {
      if (!j.scheduledStart) continue;
      const key = toParam(new Date(j.scheduledStart));
      const arr = map.get(key) ?? [];
      arr.push(j);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledStart as Date).getTime() -
          new Date(b.scheduledStart as Date).getTime(),
      );
    }
    return map;
  }, [jobs]);

  const dayJobs = byDay.get(toParam(selected)) ?? [];
  const isToday = sameDay(selected, now);
  // Var "nu"-linjen ska ligga (index bland dagens ordrar).
  const nowIndex = isToday
    ? dayJobs.filter(
        (j) =>
          j.scheduledStart && new Date(j.scheduledStart).getTime() <= now.getTime(),
      ).length
    : -1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Veckorad med datumchips */}
      <div className="grid grid-cols-7 gap-1 border-b border-line pb-3">
        {weekDays.map((d) => {
          const isSel = sameDay(d, selected);
          const dayIsToday = sameDay(d, now);
          const count = (byDay.get(toParam(d)) ?? []).length;
          const weekend = isoDow(d) >= 5;
          return (
            <button
              key={toParam(d)}
              type="button"
              onClick={() => setSelected(d)}
              aria-pressed={isSel}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl py-2 transition-colors",
                isSel ? "bg-brand-600 shadow-card" : "active:bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "text-[0.6rem] font-semibold uppercase tracking-wide",
                  isSel
                    ? "text-white/75"
                    : weekend
                      ? "text-muted-foreground/55"
                      : "text-muted-foreground",
                )}
              >
                {WEEKDAYS_SHORT[isoDow(d)]}
              </span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-[0.95rem] font-bold tabular-nums",
                  isSel
                    ? "bg-white/15 text-white ring-1 ring-inset ring-white/30"
                    : dayIsToday
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink",
                )}
              >
                {d.getDate()}
              </span>
              <span
                className={cn(
                  "h-1 w-4 rounded-full transition-colors",
                  count === 0
                    ? "bg-transparent"
                    : isSel
                      ? "bg-white/80"
                      : "bg-brand-400",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {/* Scrollyta: vald dags rubrik + tidslinje */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 bg-canvas/95 px-0.5 pt-4 pb-3 backdrop-blur">
          <h2 className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-ink">
              {relativeLabel(selected, now)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {selected.getDate()} {MONTHS[selected.getMonth()]}
            </span>
          </h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              dayJobs.length === 0
                ? "text-muted-foreground"
                : "bg-brand-50 text-brand-700",
            )}
          >
            {dayJobs.length === 0
              ? "Inget inplanerat"
              : `${dayJobs.length} ${dayJobs.length === 1 ? "order" : "ordrar"}`}
          </span>
        </div>

        {dayJobs.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-muted/40 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarRange className="size-6" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">
              Inga inplanerade arbetsordrar denna dag.
            </p>
          </div>
        ) : (
          <ul className="pb-4">
            {dayJobs.map((job, i) => (
              <TimelineItem
                key={job.id}
                job={job}
                onOpen={onOpen}
                showNowBefore={i === nowIndex}
                now={now}
              />
            ))}
            {nowIndex === dayJobs.length ? <NowMarker now={now} /> : null}
          </ul>
        )}
      </div>
    </div>
  );
}

function NowMarker({ now }: { now: Date }) {
  return (
    <li className="flex items-center gap-2.5" aria-label="Nu">
      <span className="w-12 shrink-0 text-right text-[0.7rem] font-bold tabular-nums text-danger">
        {hm(now)}
      </span>
      <span className="relative flex w-2.5 shrink-0 justify-center">
        <span className="size-2.5 rounded-full bg-danger ring-4 ring-canvas" />
      </span>
      <span className="flex flex-1 items-center gap-2 py-2">
        <span className="h-px flex-1 bg-danger/50" />
        <span className="text-[0.62rem] font-bold uppercase tracking-wider text-danger">
          Nu
        </span>
      </span>
    </li>
  );
}

function TimelineItem({
  job,
  onOpen,
  showNowBefore,
  now,
}: {
  job: ScheduleJob;
  onOpen: (job: ScheduleJob) => void;
  showNowBefore: boolean;
  now: Date;
}) {
  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const primary = job.vehicles[0]?.vehicle;
  const mechs = job.mechanics.map((m) => m.user);
  const ongoing =
    start && end && start.getTime() <= now.getTime() && now.getTime() < end.getTime();

  return (
    <>
      {showNowBefore ? <NowMarker now={now} /> : null}
      <li className="flex gap-2.5">
        {/* Tidsskena */}
        <div className="flex w-12 shrink-0 flex-col items-end pt-2.5">
          <span className="text-[0.82rem] font-bold leading-none tabular-nums text-ink">
            {start ? hm(start) : "—"}
          </span>
          {end ? (
            <span className="mt-1 text-[0.7rem] leading-none tabular-nums text-muted-foreground">
              {hm(end)}
            </span>
          ) : null}
        </div>

        {/* Tidslinje (prick + linje) */}
        <div className="relative flex w-2.5 shrink-0 justify-center">
          <span className="absolute inset-y-0 w-px bg-line" aria-hidden />
          <span
            className={cn(
              "relative mt-3 size-2.5 rounded-full ring-4 ring-canvas",
              meta?.accent ?? "bg-slate-400",
            )}
            aria-hidden
          />
        </div>

        {/* Kort */}
        <button
          type="button"
          onClick={() => onOpen(job)}
          className={cn(
            "mb-2.5 flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border bg-surface p-3.5 text-left shadow-card transition-colors active:bg-surface-muted",
            ongoing ? "border-brand-300 ring-1 ring-brand-200" : "border-line",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[0.95rem] font-bold text-ink">{job.type}</span>
              {job.priority === "high" ? (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[0.68rem] font-semibold text-danger">
                  {priorityLabels[job.priority]} prio
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                meta?.badge ?? "",
              )}
            >
              <span className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-slate-400")} />
              {statusLabels[job.status] ?? job.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {primary ? (
              <>
                <LicensePlate value={primary.regNo} />
                <span className="min-w-0 truncate text-sm text-ink-soft">
                  {[primary.brand, primary.model].filter(Boolean).join(" ")}
                </span>
                {job.vehicles.length > 1 ? (
                  <span className="text-xs text-muted-foreground">
                    +{job.vehicles.length - 1}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Car className="size-4" /> Inget fordon
              </span>
            )}
            {mechs.length > 0 ? (
              <span className="ml-auto flex items-center -space-x-1.5">
                {mechs.slice(0, 3).map((m) => (
                  <Avatar
                    key={m.id}
                    initials={initialsOf(m.name)}
                    size="size-7 text-[0.6rem]"
                  />
                ))}
              </span>
            ) : null}
          </div>
        </button>
      </li>
    </>
  );
}
