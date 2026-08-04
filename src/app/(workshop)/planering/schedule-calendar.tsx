"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarRange, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { JobDetail } from "./job-detail";
import { type MoveArgs } from "./time-grid";
import { DayBoard } from "./day-board";
import { WeekBoard } from "./week-board";
import { MobileAgenda } from "./mobile-agenda";
import { SheetView } from "./sheet-view";
import { moveJob } from "./actions";
import { CreateWorkOrderButton } from "../arbetsordrar/create-work-order-button";
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
  toISO,
  mechanics,
  jobs,
  vehicles,
  customers,
  canManage,
  hasOrg,
}: {
  view: View;
  anchorISO: string;
  fromISO: string;
  toISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  vehicles: { id: string; regNo: string; chassisNumber: string | null }[];
  customers: { id: string; name: string }[];
  canManage: boolean;
  hasOrg: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ScheduleJob | null>(null);
  const [open, setOpen] = useState(false);
  const [localJobs, setLocalJobs] = useState(jobs);
  useEffect(() => setLocalJobs(jobs), [jobs]);
  // Id på ordern som just släppts – kortet på sin nya plats får en "glid in"-
  // animation i stället för att hoppa dit. Nollas strax efter.
  const [movedId, setMovedId] = useState<string | null>(null);

  const anchor = new Date(anchorISO);
  const from = new Date(fromISO);

  // Dagvyn får sitt dygn ur veckan. Servern hämtar alltid hela veckan, så att
  // alla tre vyerna har data att rita medan de glider förbi (se page.tsx).
  const dayJobs = useMemo(() => {
    // anchorISO, inte anchor: datumobjektet skapas om vid varje render och
    // hade gjort memon meningslös.
    const a = new Date(anchorISO);
    return localJobs.filter(
      (j) =>
        j.scheduledStart &&
        j.scheduledStart.getFullYear() === a.getFullYear() &&
        j.scheduledStart.getMonth() === a.getMonth() &&
        j.scheduledStart.getDate() === a.getDate(),
    );
  }, [localJobs, anchorISO]);

  const openJob = useCallback((job: ScheduleJob) => {
    setSelected(job);
    setOpen(true);
  }, []);

  const handleMove = useCallback(
    ({ job, newStart, newEnd, fromUserId, toUserId, unassign }: MoveArgs) => {
      const targetMech = toUserId
        ? mechanics.find((m) => m.id === toUserId)
        : null;
      const optimistic: ScheduleJob = {
        ...job,
        mechanics: unassign
          ? job.mechanics.filter((m) => m.userId !== fromUserId)
          : targetMech && toUserId
            ? [
                ...job.mechanics.filter((m) => m.userId !== fromUserId),
                {
                  id: `tmp-${toUserId}`,
                  jobId: job.id,
                  userId: toUserId,
                  createdAt: new Date(),
                  hourlyRateOreExcl: null,
                  hours: null,
                  vatRate: 25,
                  user: { id: targetMech.id, name: targetMech.name },
                },
              ]
            : job.mechanics,
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      };
      setLocalJobs((prev) =>
        prev.map((j) => (j.id === job.id ? optimistic : j)),
      );
      setMovedId(job.id);
      window.setTimeout(
        () => setMovedId((id) => (id === job.id ? null : id)),
        400,
      );
      moveJob(job.id, {
        ...(unassign && fromUserId
          ? { fromUserId, unassign: true }
          : toUserId
            ? { fromUserId: fromUserId!, toUserId }
            : {}),
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
      {/* Verktygsrad – desktop/iPad-liggande (rutnätet). På mobil/iPad-stående
          har agendan sin egen kompakta rubrik + veckoremsa i stället. */}
      <header className="hidden shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line pb-3 lg:flex">
        {/* Vy-växel – dag/vecka/tabell. Samma höjd som knapparna (h-10/coarse
            h-12). Tabellen är kalkylbladsvyn: samma vecka, men som ett rutnät
            man kan skriva i. Kalendern finns kvar orörd bredvid den. */}
        <div className="inset-track inline-flex h-10 rounded-xl border border-line bg-surface-muted p-0.5 pointer-coarse:h-12">
          {(["day", "week", "sheet"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-all",
                view === v
                  ? "raised bg-surface text-ink ring-1 ring-line-strong"
                  : "text-muted-foreground hover:text-ink",
              )}
            >
              {v === "sheet" ? <Table2 className="size-4" /> : null}
              {v === "day" ? "Dag" : v === "week" ? "Vecka" : "Tabell"}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button variant="outline" size="md" onClick={goToday}>
            Idag
          </Button>
          {/* Nav-grupp – varje pil lika hög som knapparna (40/48px). */}
          <div className="raised flex h-10 items-center rounded-xl border border-line-strong bg-surface pointer-coarse:h-12">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Föregående"
              className="flex h-full w-10 items-center justify-center rounded-l-xl text-muted-foreground transition-colors active:bg-surface-muted pointer-coarse:w-12"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-[8.5rem] px-1 text-center text-sm font-semibold capitalize text-ink sm:min-w-[12rem]">
              {rangeLabel}
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Nästa"
              className="flex h-full w-10 items-center justify-center rounded-r-xl text-muted-foreground transition-colors active:bg-surface-muted pointer-coarse:w-12"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          {hasOrg ? (
            <CreateWorkOrderButton mechanics={mechanics} vehicles={vehicles} />
          ) : null}
        </div>
      </header>

      {/* Kropp – desktop/iPad-liggande.
          De tre vyerna ligger sida vid sida på ett spår som är tre gånger så
          brett som ytan. Vid byte flyttas spåret ett steg, så den gamla vyn
          glider ut medan den nya glider in – samma rörelse som växlingen i
          systemloggen. Alla tre är monterade hela tiden; det är det som gör
          att båda sidor av rörelsen faktiskt syns. */}
      <div className="mt-4 hidden min-h-0 flex-1 overflow-x-hidden lg:flex">
        {!hasOrg ? (
          <EmptyState text="Välj en verkstad för att se dess arbetskalender." />
        ) : mechanics.length === 0 ? (
          <EmptyState text="Inga mekaniker i verkstaden ännu." />
        ) : (
          <div
            className={cn(
              "flex h-full w-[300%] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              // Exakta tredjedelar som beräknade värden – en avrundad procent
              // hade lämnat en glipa av föregående vy synlig i kanten.
              view === "week" && "-translate-x-[calc(100%/3)]",
              view === "sheet" && "-translate-x-[calc(200%/3)]",
            )}
          >
            <Pane hidden={view !== "day"}>
              <DayBoard
                anchorISO={anchorISO}
                mechanics={mechanics}
                jobs={dayJobs}
                canManage={canManage}
                movedId={movedId}
                onOpen={openJob}
                onMove={handleMove}
              />
            </Pane>
            <Pane hidden={view !== "week"}>
              <WeekBoard
                fromISO={fromISO}
                mechanics={mechanics}
                jobs={localJobs}
                canManage={canManage}
                movedId={movedId}
                onOpen={openJob}
                onMove={handleMove}
              />
            </Pane>
            <Pane hidden={view !== "sheet"}>
              <SheetView
                jobs={localJobs}
                mechanics={mechanics}
                canManage={canManage}
                rangeLabel={rangeLabel}
              />
            </Pane>
          </div>
        )}
      </div>

      {/* Kropp – mobil/iPad-stående: touch-först dag-agenda med veckoremsa */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {!hasOrg ? (
          <EmptyState text="Välj en verkstad för att se dess arbetskalender." />
        ) : (
          <MobileAgenda
            key={anchorISO}
            fromISO={fromISO}
            toISO={toISO}
            anchorISO={anchorISO}
            mechanics={mechanics}
            jobs={localJobs}
            onOpen={openJob}
            createButton={
              <CreateWorkOrderButton
                mechanics={mechanics}
                vehicles={vehicles}
              />
            }
          />
        )}
      </div>

      <JobDetail
        job={selected}
        open={open}
        onOpenChange={setOpen}
        mechanics={mechanics}
        customers={customers}
        canManage={canManage}
      />
    </div>
  );
}

/**
 * En vy i spåret. Den som inte visas göms för skärmläsare och tangentbord –
 * annars går det att tabba in i innehåll som ligger utanför skärmkanten.
 */
function Pane({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-0 w-1/3 shrink-0 flex-col"
      aria-hidden={hidden}
      inert={hidden}
    >
      {children}
    </div>
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
