"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Car } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LicensePlate } from "@/components/ui/license-plate";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { JobDetail } from "./job-detail";
import { statusMeta, statusLabels } from "./calendar-meta";
import { moveJob } from "./actions";

type View = "day" | "week" | "month";

const DAY_START = 7;
const WORK_HOURS = 11; // 07–18
const COL_WIDTH: Record<View, number> = { day: 78, week: 132, month: 46 };
const LABEL_W = 224;
const ROW_H = 56;

const WEEKDAYS = ["mån", "tis", "ons", "tors", "fre", "lör", "sön"];
const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toParam(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Innehållet i en arbetsorder-box (typ + starttid). */
function JobBoxContent({ job }: { job: ScheduleJob }) {
  const s = job.scheduledStart ? new Date(job.scheduledStart) : null;
  return (
    <>
      <span className="truncate text-xs font-semibold leading-tight">
        {job.type}
      </span>
      {s ? (
        <span className="truncate text-[0.65rem] leading-tight opacity-80">
          {pad(s.getHours())}:{pad(s.getMinutes())}
        </span>
      ) : null}
    </>
  );
}

/** Dragbar arbetsorder-box (drag avstängd för icke-admin). */
function JobBox({
  job,
  left,
  width,
  canManage,
  onOpen,
}: {
  job: ScheduleJob;
  left: number;
  width: number;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    disabled: !canManage,
  });
  const meta = statusMeta[job.status];
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "absolute top-1.5 bottom-1.5 flex flex-col justify-center overflow-hidden rounded-lg border-l-4 px-2 text-left transition-shadow hover:shadow-lift",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging && "opacity-40",
        meta?.box ?? "border-slate-300 bg-slate-50 text-slate-700",
      )}
      style={{ left: left + 2, width: width - 4 }}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <JobBoxContent job={job} />
    </button>
  );
}

/** Mekanikergrupp = drop-zon för omtilldelning. */
function MechanicGroup({
  mech,
  jobs,
  columns,
  colWidth,
  trackWidth,
  canManage,
  position,
  onOpen,
}: {
  mech: Mechanic;
  jobs: ScheduleJob[];
  columns: { key: string; today?: boolean }[];
  colWidth: number;
  trackWidth: number;
  canManage: boolean;
  position: (job: ScheduleJob) => { left: number; width: number } | null;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `mech:${mech.id}` });

  // Distinkta fordon för mekanikern
  const vehicleMap = new Map<
    string,
    { vehicle: ScheduleJob["vehicle"]; jobs: ScheduleJob[] }
  >();
  for (const j of jobs) {
    const key = j.vehicle?.id ?? "none";
    const entry = vehicleMap.get(key) ?? { vehicle: j.vehicle, jobs: [] };
    entry.jobs.push(j);
    vehicleMap.set(key, entry);
  }
  const vehicleRows = [...vehicleMap.values()];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-line last:border-b-0",
        isOver && canManage && "bg-brand-50/40",
      )}
    >
      {/* Mekaniker-header */}
      <div className="flex items-center bg-surface">
        <div
          className="sticky left-0 z-10 flex shrink-0 items-center gap-2.5 border-r border-line bg-surface px-4 py-2.5"
          style={{ width: LABEL_W }}
        >
          <Avatar initials={mech.initials} size="size-8 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{mech.name}</p>
            <p className="text-xs text-muted-foreground">
              {vehicleRows.length} fordon · {jobs.length} ordrar
            </p>
          </div>
        </div>
        <div className="bg-surface-muted/30" style={{ width: trackWidth }} />
      </div>

      {/* Fordonsrader */}
      {vehicleRows.length === 0 ? (
        <div className="flex">
          <div
            className="sticky left-0 z-10 shrink-0 border-r border-line bg-surface px-4 py-3 text-xs text-muted-foreground"
            style={{ width: LABEL_W }}
          >
            Inga arbetsordrar
          </div>
          <div style={{ width: trackWidth }} />
        </div>
      ) : (
        vehicleRows.map((row, ri) => (
          <div
            key={(row.vehicle?.id ?? "none") + ri}
            className="flex border-t border-line/70"
          >
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-4 py-3"
              style={{ width: LABEL_W }}
            >
              {row.vehicle ? (
                <>
                  <LicensePlate value={row.vehicle.regNo} className="shrink-0" />
                  <span className="min-w-0 truncate text-xs text-ink-soft">
                    {[row.vehicle.brand, row.vehicle.model]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Car className="size-3.5" /> Inget fordon
                </span>
              )}
            </div>
            <div className="relative" style={{ width: trackWidth, height: ROW_H }}>
              <div className="absolute inset-0 flex">
                {columns.map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "shrink-0 border-r border-line/60",
                      c.today ? "bg-brand-50/40" : "",
                    )}
                    style={{ width: colWidth }}
                  />
                ))}
              </div>
              {row.jobs.map((job) => {
                const pos = position(job);
                if (!pos) return null;
                return (
                  <JobBox
                    key={job.id}
                    job={job}
                    left={pos.left}
                    width={pos.width}
                    canManage={canManage}
                    onOpen={onOpen}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function ScheduleCalendar({
  view,
  anchorISO,
  fromISO,
  toISO,
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const from = new Date(fromISO);
  const to = new Date(toISO);
  const anchor = new Date(anchorISO);

  const jobById = new Map(jobs.map((j) => [j.id, j]));

  // X-axel-kolumner
  const dayCount = Math.round((to.getTime() - from.getTime()) / 86400000);
  const columns: { key: string; label: string; sub?: string; today?: boolean }[] = [];
  const todayKey = toParam(new Date());
  if (view === "day") {
    for (let h = 0; h < WORK_HOURS; h++) {
      columns.push({ key: `h${h}`, label: `${pad(DAY_START + h)}:00` });
    }
  } else {
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      columns.push({
        key: toParam(d),
        label: view === "week" ? WEEKDAYS[i] : String(d.getDate()),
        sub: view === "week" ? String(d.getDate()) : undefined,
        today: toParam(d) === todayKey,
      });
    }
  }
  const colWidth = COL_WIDTH[view];
  const trackWidth = columns.length * colWidth;

  function position(job: ScheduleJob) {
    if (!job.scheduledStart || !job.scheduledEnd) return null;
    const start = new Date(job.scheduledStart);
    const end = new Date(job.scheduledEnd);
    const startHour = start.getHours() + start.getMinutes() / 60;
    let durH = (end.getTime() - start.getTime()) / 3600000;
    if (durH <= 0) durH = 0.5;
    if (view === "day") {
      const left = clamp01((startHour - DAY_START) / WORK_HOURS);
      const width = clamp01(durH / WORK_HOURS);
      return { left: left * trackWidth, width: Math.max(width * trackWidth, 56) };
    }
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const dayIndex = Math.round((startOfDay.getTime() - from.getTime()) / 86400000);
    if (dayIndex < 0 || dayIndex >= columns.length) return null;
    const within = clamp01((startHour - DAY_START) / WORK_HOURS);
    const left = (dayIndex + within * 0.9) * colWidth;
    const width = Math.max((durH / WORK_HOURS) * colWidth, colWidth * 0.7);
    return { left, width: Math.min(width, trackWidth - left) };
  }

  const jobsByMechanic = new Map<string, ScheduleJob[]>();
  for (const job of jobs) {
    const mid = job.assignedUser?.id;
    if (!mid) continue;
    const arr = jobsByMechanic.get(mid) ?? [];
    arr.push(job);
    jobsByMechanic.set(mid, arr);
  }

  function navigate(deltaUnits: number) {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + deltaUnits);
    else if (view === "week") d.setDate(d.getDate() + deltaUnits * 7);
    else d.setMonth(d.getMonth() + deltaUnits);
    router.push(`/planering?view=${view}&date=${toParam(d)}`);
  }
  function goToday() {
    router.push(`/planering?view=${view}&date=${toParam(new Date())}`);
  }
  function setView(v: View) {
    router.push(`/planering?view=${v}&date=${toParam(anchor)}`);
  }

  let rangeLabel = "";
  if (view === "day") {
    rangeLabel = `${WEEKDAYS[(anchor.getDay() + 6) % 7]} ${anchor.getDate()} ${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  } else if (view === "week") {
    const last = new Date(from);
    last.setDate(from.getDate() + 6);
    rangeLabel = `${from.getDate()}–${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
  } else {
    rangeLabel = `${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
  }

  function openJob(job: ScheduleJob) {
    setSelected(job);
    setOpen(true);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!canManage) return;
    const job = jobById.get(String(e.active.id));
    if (!job || !job.scheduledStart || !job.scheduledEnd) return;

    const oldStart = new Date(job.scheduledStart);
    const durMs = new Date(job.scheduledEnd).getTime() - oldStart.getTime();

    // Ny tid utifrån horisontell förflyttning.
    const newStart = new Date(oldStart);
    if (view === "day") {
      const hoursShift = Math.round((e.delta.x / colWidth) * 2) / 2; // 30-min-snäpp
      newStart.setTime(oldStart.getTime() + hoursShift * 3600 * 1000);
    } else {
      const daysShift = Math.round(e.delta.x / colWidth);
      newStart.setDate(newStart.getDate() + daysShift);
    }
    const newEnd = new Date(newStart.getTime() + durMs);

    // Ny mekaniker utifrån drop-zon.
    let assignedUserId: string | undefined;
    const overId = e.over ? String(e.over.id) : null;
    if (overId?.startsWith("mech:")) {
      const target = overId.slice(5);
      if (target !== job.assignedUser?.id) assignedUserId = target;
    }

    const movedTime = newStart.getTime() !== oldStart.getTime();
    if (!movedTime && assignedUserId === undefined) return;

    moveJob(job.id, {
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      scheduledStart: newStart.toISOString(),
      scheduledEnd: newEnd.toISOString(),
    }).then(() => router.refresh());
  }

  const activeJob = activeId ? jobById.get(activeId) : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Sidhuvud */}
      <div className="flex flex-col gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Verkstad
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Arbetskalender
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mekaniker, fordon och arbetsordrar över tid.
            {canManage
              ? " Dra en arbetsorder för att flytta den i tid eller till en annan mekaniker."
              : " Du kan se schemat men inte ändra det."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === v
                    ? "bg-surface text-ink shadow-xs"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                {v === "day" ? "Dag" : v === "week" ? "Vecka" : "Månad"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Idag
            </button>
            <div className="flex items-center rounded-lg border border-line bg-surface">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Föregående"
                className="flex size-9 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[11rem] px-2 text-center text-sm font-semibold text-ink">
                {rangeLabel}
              </span>
              <button
                type="button"
                onClick={() => navigate(1)}
                aria-label="Nästa"
                className="flex size-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kalender */}
      {!hasOrg ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Välj en verkstad för att se dess arbetskalender.
        </p>
      ) : mechanics.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Inga mekaniker i verkstaden ännu.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
            <div style={{ minWidth: LABEL_W + trackWidth }}>
              {/* Axel-header */}
              <div className="flex border-b border-line bg-surface-muted/50">
                <div
                  className="sticky left-0 z-20 shrink-0 border-r border-line bg-surface-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ width: LABEL_W }}
                >
                  Mekaniker / fordon
                </div>
                <div className="flex" style={{ width: trackWidth }}>
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      className={cn(
                        "shrink-0 border-r border-line py-2 text-center text-xs font-medium",
                        c.today ? "bg-brand-50 text-brand-700" : "text-muted-foreground",
                      )}
                      style={{ width: colWidth }}
                    >
                      <span className="capitalize">{c.label}</span>
                      {c.sub ? <span className="ml-1 text-ink">{c.sub}</span> : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mekanikergrupper */}
              {mechanics.map((mech) => (
                <MechanicGroup
                  key={mech.id}
                  mech={mech}
                  jobs={jobsByMechanic.get(mech.id) ?? []}
                  columns={columns}
                  colWidth={colWidth}
                  trackWidth={trackWidth}
                  canManage={canManage}
                  position={position}
                  onOpen={openJob}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeJob ? (
              <div
                className={cn(
                  "flex h-11 flex-col justify-center rounded-lg border-l-4 px-2 shadow-lift",
                  statusMeta[activeJob.status]?.box ??
                    "border-slate-300 bg-slate-50 text-slate-700",
                )}
                style={{ width: 140 }}
              >
                <JobBoxContent job={activeJob} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <JobDetail job={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
