"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock,
  CalendarRange,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "@/components/ui/license-plate";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusMeta, statusLabels } from "./calendar-meta";
import {
  WEEKDAYS_SHORT,
  MONTHS,
  toParam,
  addDays,
  sameDay,
  startOfWeek,
  isoDow,
  hm,
  groupByMechVehicle,
  UNASSIGNED_KEY,
} from "./calendar-utils";

/**
 * Mobil/iPad-stående kalender: en vertikal dag-agenda med en veckoremsa för att
 * välja dag. Samma funktion som desktop-rutnätet fast touch-först – tryck på en
 * order för att öppna drawern där tid, mekaniker, status m.m. ändras. Byte av
 * dag inom den laddade veckan sker direkt (klientfiltrering); andra veckor
 * hämtas via navigering.
 */
export function MobileAgenda({
  fromISO,
  toISO,
  anchorISO,
  mechanics,
  jobs,
  onOpen,
  createButton,
}: {
  fromISO: string;
  toISO: string;
  anchorISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  onOpen: (job: ScheduleJob) => void;
  createButton?: React.ReactNode;
}) {
  const router = useRouter();
  const from = useMemo(() => new Date(fromISO), [fromISO]);
  const to = useMemo(() => new Date(toISO), [toISO]);

  // Vald dag – styr agendan. Initieras från ankardatumet.
  const [selected, setSelected] = useState(() => {
    const d = new Date(anchorISO);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Veckoremsan visar måndag–söndag för den valda dagens vecka.
  const weekStart = useMemo(() => startOfWeek(selected), [selected]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const inLoadedRange = (d: Date) =>
    d.getTime() >= from.getTime() && d.getTime() < to.getTime();

  function pickDay(d: Date) {
    if (inLoadedRange(d)) {
      setSelected(d); // direkt – datan finns redan
    } else {
      router.push(`/planering?view=week&date=${toParam(d)}`);
    }
  }
  function shiftWeek(delta: number) {
    const next = addDays(selected, delta * 7);
    if (inLoadedRange(next)) setSelected(next);
    else router.push(`/planering?view=week&date=${toParam(next)}`);
  }
  function goToday() {
    if (inLoadedRange(today)) setSelected(today);
    else router.push(`/planering?view=week&date=${toParam(today)}`);
  }

  // Ordrar för den valda dagen, grupperade mekaniker → ordrar (otilldelade först).
  const dayGroups = useMemo(() => {
    const dayJobs = jobs.filter(
      (j) => j.scheduledStart && sameDay(new Date(j.scheduledStart), selected),
    );
    return groupByMechVehicle(mechanics, dayJobs)
      .map((g) => {
        // Platta ut fordonsrader → unika ordrar, sorterade på starttid.
        const seen = new Set<string>();
        const list: ScheduleJob[] = [];
        for (const row of g.rows) {
          for (const job of row.jobs) {
            if (seen.has(job.id)) continue;
            seen.add(job.id);
            list.push(job);
          }
        }
        list.sort(
          (a, b) =>
            new Date(a.scheduledStart as Date).getTime() -
            new Date(b.scheduledStart as Date).getTime(),
        );
        return { key: g.key, mech: g.mech, jobs: list };
      })
      .filter((g) => g.jobs.length > 0);
  }, [jobs, mechanics, selected]);

  const totalDay = dayGroups.reduce((n, g) => n + g.jobs.length, 0);
  const monthLabel = `${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Rubrik: månad + Idag + skapa */}
      <div className="flex items-center justify-between gap-2 pb-3">
        <h2 className="text-base font-bold capitalize tracking-tight text-ink">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={goToday}>
            Idag
          </Button>
          {createButton}
        </div>
      </div>

      {/* Veckoremsa */}
      <div className="flex items-center gap-1.5 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          aria-label="Föregående vecka"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted-foreground transition-colors active:bg-surface-muted"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, today);
            const count = jobs.filter(
              (j) =>
                j.scheduledStart && sameDay(new Date(j.scheduledStart), d),
            ).length;
            return (
              <button
                key={toParam(d)}
                type="button"
                onClick={() => pickDay(d)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors",
                  isSelected
                    ? "bg-brand-600 text-white"
                    : "text-ink active:bg-surface-muted",
                )}
              >
                <span
                  className={cn(
                    "text-[0.6rem] font-semibold uppercase tracking-wide",
                    isSelected ? "text-white/80" : "text-muted-foreground",
                  )}
                >
                  {WEEKDAYS_SHORT[isoDow(d)]}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                    isSelected
                      ? "bg-white/20"
                      : isToday
                        ? "text-brand-600"
                        : "text-ink",
                  )}
                >
                  {d.getDate()}
                </span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    count > 0
                      ? isSelected
                        ? "bg-white"
                        : "bg-brand-400"
                      : "bg-transparent",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          aria-label="Nästa vecka"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted-foreground transition-colors active:bg-surface-muted"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Agenda för vald dag */}
      <div className="min-h-0 flex-1 overflow-y-auto pt-1">
        {totalDay === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CalendarRange className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">Inga arbetsordrar</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Det finns inga schemalagda ordrar den här dagen.
            </p>
          </div>
        ) : (
          <div className="space-y-5 pb-6">
            {dayGroups.map((g) => {
              const unassigned = g.key === UNASSIGNED_KEY;
              return (
                <section key={g.key}>
                  <div className="flex items-center gap-2 px-0.5 pb-2">
                    {unassigned ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-warning-soft text-warning">
                        <Layers className="size-3.5" />
                      </span>
                    ) : null}
                    <h3 className="text-sm font-bold text-ink">
                      {unassigned ? "Ej tilldelade" : g.mech!.name}
                    </h3>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {g.jobs.length}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {g.jobs.map((job) => (
                      <li key={job.id}>
                        <AgendaCard job={job} onOpen={onOpen} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AgendaCard({
  job,
  onOpen,
}: {
  job: ScheduleJob;
  onOpen: (job: ScheduleJob) => void;
}) {
  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const vehicle = job.vehicles[0]?.vehicle ?? null;
  const vehicleName = vehicle
    ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ")
    : "";

  return (
    <button
      type="button"
      onClick={() => onOpen(job)}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 text-left shadow-xs transition-colors active:bg-surface-muted"
    >
      {/* Tid */}
      <div className="flex w-14 shrink-0 flex-col items-start">
        {start ? (
          <>
            <span className="text-sm font-bold tabular-nums text-ink">
              {hm(start)}
            </span>
            {end ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {hm(end)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />—
          </span>
        )}
      </div>

      {/* Innehåll */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 truncate text-[0.95rem] font-bold text-ink">
            <Wrench className="size-3.5 shrink-0 text-muted-foreground" />
            {job.type}
          </span>
          <span
            className={cn(
              "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
              meta?.badge ?? "",
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-slate-400")}
            />
            {statusLabels[job.status] ?? job.status}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {vehicle ? (
            <LicensePlate value={vehicle.regNo} size="sm" className="shrink-0" />
          ) : (
            <span className="text-xs text-muted-foreground">Inget fordon</span>
          )}
          {vehicleName ? (
            <span className="min-w-0 truncate text-xs text-ink-soft">
              {vehicleName}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
