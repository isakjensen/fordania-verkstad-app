"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { JobDetail } from "./job-detail";
import { TimeGrid, type MoveArgs } from "./time-grid";
import { Agenda } from "./agenda";
import { moveJob } from "./actions";
import {
  type View,
  WEEKDAYS_SHORT,
  MONTHS,
  toParam,
  addDays,
  isoDow,
} from "./calendar-utils";

export function ScheduleCalendar({
  view,
  anchorISO,
  fromISO,
  mechanics,
  jobs,
  canManage,
  hasOrg,
}: {
  view: View;
  anchorISO: string;
  fromISO: string;
  toISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  hasOrg: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ScheduleJob | null>(null);
  const [open, setOpen] = useState(false);
  const [localJobs, setLocalJobs] = useState(jobs);
  useEffect(() => setLocalJobs(jobs), [jobs]);

  // lg+ (liggande iPad / desktop) → tidsrutnät. Annars → agenda.
  const isWide = useMediaQuery("(min-width: 1024px)");

  const anchor = new Date(anchorISO);
  const from = new Date(fromISO);

  const openJob = useCallback((job: ScheduleJob) => {
    setSelected(job);
    setOpen(true);
  }, []);

  const handleMove = useCallback(
    ({ job, newStart, newEnd, fromUserId, toUserId }: MoveArgs) => {
      const targetMech = toUserId
        ? mechanics.find((m) => m.id === toUserId)
        : null;
      const optimistic: ScheduleJob = {
        ...job,
        mechanics:
          targetMech && toUserId
            ? [
                ...job.mechanics.filter((m) => m.userId !== fromUserId),
                {
                  id: `tmp-${toUserId}`,
                  jobId: job.id,
                  userId: toUserId,
                  createdAt: new Date(),
                  user: { id: targetMech.id, name: targetMech.name },
                },
              ]
            : job.mechanics,
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      };
      setLocalJobs((prev) => prev.map((j) => (j.id === job.id ? optimistic : j)));
      moveJob(job.id, {
        ...(toUserId ? { fromUserId: fromUserId!, toUserId } : {}),
        scheduledStart: newStart.toISOString(),
        scheduledEnd: newEnd.toISOString(),
      }).then((res) => {
        if ("error" in res) {
          setLocalJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
        }
      });
    },
    [mechanics],
  );

  function navigate(delta: number) {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + delta);
    else d.setDate(d.getDate() + delta * 7);
    router.push(`/planering?view=${view}&date=${toParam(d)}`);
  }
  function goToday() {
    router.push(`/planering?view=${view}&date=${toParam(new Date())}`);
  }
  function setView(v: View) {
    router.push(`/planering?view=${v}&date=${toParam(anchor)}`);
  }

  let rangeLabel: string;
  if (view === "day") {
    rangeLabel = `${WEEKDAYS_SHORT[isoDow(anchor)]} ${anchor.getDate()} ${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  } else {
    const last = addDays(from, 6);
    const sameMonth = from.getMonth() === last.getMonth();
    rangeLabel = sameMonth
      ? `${from.getDate()}–${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
      : `${from.getDate()} ${MONTHS[from.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;
  }

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
      {/* Sidhuvud */}
      <header className="flex shrink-0 flex-col gap-3 border-b border-line pb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Verkstad
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[1.9rem]">
              Arbetskalender
            </h1>
          </div>
          {hasOrg ? (
            <div className="shrink-0 rounded-2xl border border-line bg-surface px-3.5 py-2 text-right shadow-card">
              <p className="text-lg font-extrabold tabular-nums leading-none text-brand-600">
                {localJobs.length}
              </p>
              <p className="mt-1 text-[0.7rem] font-medium text-muted-foreground">
                {view === "day" ? "ordrar" : "ordrar/vecka"}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Vy-växel – endast tidsrutnät (lg+) */}
          <div className="hidden rounded-xl border border-line bg-surface-muted p-0.5 lg:inline-flex">
            {(["day", "week"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                  view === v
                    ? "bg-surface text-ink shadow-xs ring-1 ring-line"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                {v === "day" ? "Dag" : "Vecka"}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-between gap-2 lg:flex-none lg:justify-end">
            <button
              type="button"
              onClick={goToday}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors active:bg-surface-muted lg:py-1.5"
            >
              Idag
            </button>
            <div className="flex items-center rounded-xl border border-line bg-surface">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Föregående"
                className="flex size-11 items-center justify-center rounded-l-xl text-muted-foreground transition-colors active:bg-surface-muted lg:size-9"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-[10rem] px-1 text-center text-sm font-semibold capitalize text-ink sm:min-w-[12rem]">
                {rangeLabel}
              </span>
              <button
                type="button"
                onClick={() => navigate(1)}
                aria-label="Nästa"
                className="flex size-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors active:bg-surface-muted lg:size-9"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Kropp */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {!hasOrg ? (
          <EmptyState text="Välj en verkstad för att se dess arbetskalender." />
        ) : isWide === null ? (
          <CalendarSkeleton />
        ) : isWide ? (
          mechanics.length === 0 && view === "day" ? (
            <EmptyState text="Inga mekaniker i verkstaden ännu." />
          ) : (
            <TimeGrid
              view={view}
              anchorISO={anchorISO}
              fromISO={fromISO}
              mechanics={mechanics}
              jobs={localJobs}
              canManage={canManage}
              onOpen={openJob}
              onMove={handleMove}
            />
          )
        ) : (
          <Agenda anchorISO={anchorISO} jobs={localJobs} onOpen={openJob} />
        )}
      </div>

      <JobDetail
        job={selected}
        open={open}
        onOpenChange={setOpen}
        mechanics={mechanics}
        canManage={canManage}
      />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="min-h-0 flex-1 animate-pulse rounded-2xl border border-line bg-surface-muted/40" />
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-muted/40 px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <CalendarRange className="size-6" />
      </span>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
