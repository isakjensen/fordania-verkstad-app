"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
  defaultDropAnimationSideEffects,
  type DropAnimation,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Car, CalendarRange } from "lucide-react";
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
const COL_WIDTH: Record<View, number> = { day: 82, week: 138, month: 48 };
const LABEL_W = 228;
const ROW_H = 56;
const EMPTY_JOBS: ScheduleJob[] = [];

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
function hm(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Innehållet i en arbetsorder-box (typ + tidsintervall). */
function JobBoxContent({ job }: { job: ScheduleJob }) {
  const s = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const e = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const meta = statusMeta[job.status];
  return (
    <>
      <span
        className={cn("w-1.5 shrink-0", meta?.accent ?? "bg-slate-400")}
        aria-hidden
      />
      <span
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2",
          meta?.tint ?? "bg-surface",
        )}
      >
        <span className="truncate text-xs font-semibold leading-tight text-ink">
          {job.type}
        </span>
        {s ? (
          <span className="truncate text-[0.65rem] leading-tight text-muted-foreground tabular-nums">
            {hm(s)}
            {e ? `–${hm(e)}` : ""}
          </span>
        ) : null}
      </span>
    </>
  );
}

const JobBox = memo(function JobBox({
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
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "absolute top-1 bottom-1 z-20 flex items-stretch overflow-hidden rounded-md bg-surface text-left shadow-soft ring-1 ring-line will-change-transform",
        isDragging
          ? "opacity-30"
          : "transition-[left,width,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-30 hover:-translate-y-px hover:shadow-lift hover:ring-brand-200",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      style={{ left: left + 2, width: Math.max(width - 4, 44) }}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <JobBoxContent job={job} />
    </button>
  );
});

/** Tunn vertikal "nu"-linje (endast dagvy, idag). */
function NowLine({ x }: { x: number | null }) {
  if (x === null) return null;
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-danger/60"
      style={{ left: x }}
      aria-hidden
    />
  );
}

const MechanicGroup = memo(function MechanicGroup({
  mech,
  jobs,
  columns,
  colWidth,
  trackWidth,
  canManage,
  nowX,
  position,
  onOpen,
}: {
  mech: Mechanic;
  jobs: ScheduleJob[];
  columns: { key: string; today?: boolean }[];
  colWidth: number;
  trackWidth: number;
  canManage: boolean;
  nowX: number | null;
  position: (job: ScheduleJob) => { left: number; width: number } | null;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `mech:${mech.id}` });

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
  // Stabil radordning på regnummer – så raderna aldrig hoppar om när en
  // arbetsorders tid ändras.
  const vehicleRows = [...vehicleMap.values()].sort((a, b) =>
    (a.vehicle?.regNo ?? "~").localeCompare(b.vehicle?.regNo ?? "~", "sv"),
  );

  function GridLines() {
    return (
      <div className="absolute inset-0 flex">
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn(
              "shrink-0 border-r border-line/50",
              c.today ? "bg-brand-50/30" : "",
            )}
            style={{ width: colWidth }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-b border-line transition-colors duration-150 last:border-b-0",
        isOver && canManage && "ring-2 ring-inset ring-brand-400",
      )}
    >
      {/* Mekaniker-grupphuvud */}
      <div
        className={cn(
          "flex items-stretch",
          isOver && canManage ? "bg-brand-50" : "bg-surface-muted/50",
        )}
      >
        <div
          className={cn(
            "sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-line px-4 py-2.5",
            isOver && canManage ? "bg-brand-50" : "bg-surface-muted/50",
          )}
          style={{ width: LABEL_W }}
        >
          <Avatar initials={mech.initials} size="size-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{mech.name}</p>
            <p className="text-xs text-muted-foreground">
              {vehicleRows.length > 0
                ? `${vehicleRows.length} fordon · ${jobs.length} ${jobs.length === 1 ? "order" : "ordrar"}`
                : "Inga ordrar"}
            </p>
          </div>
          {jobs.length > 0 ? (
            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {jobs.length}
            </span>
          ) : null}
        </div>
        <div className="relative" style={{ width: trackWidth, height: vehicleRows.length === 0 ? 44 : undefined }}>
          <NowLine x={nowX} />
          {vehicleRows.length === 0 ? (
            <span className="absolute inset-y-0 left-3 flex items-center text-xs italic text-muted-foreground/70">
              Inga inplanerade arbetsordrar
            </span>
          ) : null}
        </div>
      </div>

      {/* Fordonsrader */}
      {vehicleRows.map((row, ri) => (
        <div
          key={(row.vehicle?.id ?? "none") + ri}
          className="flex items-stretch border-t border-line/70"
        >
          <div
            className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-4 py-3"
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
            <GridLines />
            <NowLine x={nowX} />
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
      ))}
    </div>
  );
});

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
  const [localJobs, setLocalJobs] = useState(jobs);
  useEffect(() => setLocalJobs(jobs), [jobs]);
  // Realtidsberoende UI (nu-linjen) renderas först efter montering för att
  // undvika hydreringsskillnad mellan server och klient.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const from = new Date(fromISO);
  const anchor = new Date(anchorISO);
  const colWidth = COL_WIDTH[view];

  const jobById = useMemo(
    () => new Map(localJobs.map((j) => [j.id, j])),
    [localJobs],
  );

  // X-axel-kolumner (memoiserade så dragstart inte renderar om allt)
  const { columns, trackWidth, todayKey } = useMemo(() => {
    const f = new Date(fromISO);
    const t = new Date(toISO);
    const tKey = toParam(new Date());
    const cols: { key: string; label: string; sub?: string; today?: boolean }[] = [];
    if (view === "day") {
      for (let h = 0; h < WORK_HOURS; h++) {
        cols.push({ key: `h${h}`, label: `${pad(DAY_START + h)}` });
      }
    } else {
      const dayCount = Math.round((t.getTime() - f.getTime()) / 86400000);
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(f);
        d.setDate(f.getDate() + i);
        cols.push({
          key: toParam(d),
          label: view === "week" ? WEEKDAYS[i] : String(d.getDate()),
          sub: view === "week" ? String(d.getDate()) : undefined,
          today: toParam(d) === tKey,
        });
      }
    }
    return { columns: cols, trackWidth: cols.length * colWidth, todayKey: tKey };
  }, [view, fromISO, toISO, colWidth]);

  // "Nu"-linje (dagvy + idag)
  let nowX: number | null = null;
  if (mounted && view === "day" && toParam(anchor) === todayKey) {
    const n = new Date();
    const hour = n.getHours() + n.getMinutes() / 60;
    if (hour >= DAY_START && hour <= DAY_START + WORK_HOURS) {
      nowX = ((hour - DAY_START) / WORK_HOURS) * trackWidth;
    }
  }

  const position = useCallback(
    (job: ScheduleJob) => {
      if (!job.scheduledStart || !job.scheduledEnd) return null;
      const start = new Date(job.scheduledStart);
      const end = new Date(job.scheduledEnd);
      const startHour = start.getHours() + start.getMinutes() / 60;
      let durH = (end.getTime() - start.getTime()) / 3600000;
      if (durH <= 0) durH = 0.5;
      if (view === "day") {
        const left = clamp01((startHour - DAY_START) / WORK_HOURS);
        const width = clamp01(durH / WORK_HOURS);
        return { left: left * trackWidth, width: Math.max(width * trackWidth, 60) };
      }
      const f = new Date(fromISO);
      f.setHours(0, 0, 0, 0);
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      const dayIndex = Math.round((startOfDay.getTime() - f.getTime()) / 86400000);
      if (dayIndex < 0 || dayIndex >= columns.length) return null;
      const within = clamp01((startHour - DAY_START) / WORK_HOURS);
      const left = (dayIndex + within * 0.85) * colWidth;
      const width = Math.max((durH / WORK_HOURS) * colWidth, colWidth * 0.72);
      return { left, width: Math.min(width, trackWidth - left) };
    },
    [view, fromISO, colWidth, trackWidth, columns.length],
  );

  const jobsByMechanic = useMemo(() => {
    const map = new Map<string, ScheduleJob[]>();
    for (const job of localJobs) {
      const mid = job.assignedUser?.id;
      if (!mid) continue;
      const arr = map.get(mid) ?? [];
      arr.push(job);
      map.set(mid, arr);
    }
    return map;
  }, [localJobs]);

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

  const openJob = useCallback((job: ScheduleJob) => {
    setSelected(job);
    setOpen(true);
  }, []);

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
    const durH = durMs / 3600000;

    const newStart = new Date(oldStart);
    if (view === "day") {
      const hoursShift = Math.round((e.delta.x / colWidth) * 4) / 4; // 15-min-snäpp
      newStart.setTime(oldStart.getTime() + hoursShift * 3600 * 1000);
    } else {
      const daysShift = Math.round(e.delta.x / colWidth);
      newStart.setDate(newStart.getDate() + daysShift);
    }

    const DAY_END = DAY_START + WORK_HOURS;
    let h = newStart.getHours() + newStart.getMinutes() / 60;
    h = Math.max(DAY_START, Math.min(h, Math.max(DAY_START, DAY_END - durH)));
    newStart.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    const newEnd = new Date(newStart.getTime() + durMs);

    let assignedUserId: string | undefined;
    const overId = e.over ? String(e.over.id) : null;
    if (overId?.startsWith("mech:")) {
      const target = overId.slice(5);
      if (target !== job.assignedUser?.id) assignedUserId = target;
    }

    const movedTime = newStart.getTime() !== oldStart.getTime();
    if (!movedTime && assignedUserId === undefined) return;

    const targetMech =
      assignedUserId !== undefined
        ? mechanics.find((m) => m.id === assignedUserId)
        : null;
    const optimistic: ScheduleJob = {
      ...job,
      assignedUserId: assignedUserId ?? job.assignedUserId,
      assignedUser: targetMech
        ? { id: targetMech.id, name: targetMech.name }
        : job.assignedUser,
      scheduledStart: newStart,
      scheduledEnd: newEnd,
    };
    setLocalJobs((prev) => prev.map((j) => (j.id === job.id ? optimistic : j)));

    moveJob(job.id, {
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      scheduledStart: newStart.toISOString(),
      scheduledEnd: newEnd.toISOString(),
    }).then((res) => {
      if ("error" in res) {
        setLocalJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
      }
    });
  }

  const activeJob = activeId ? jobById.get(activeId) : null;
  const totalOrders = localJobs.length;

  const dropAnimation: DropAnimation = {
    duration: 220,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.3" } },
    }),
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-8">
      {/* Sidhuvud */}
      <div className="flex shrink-0 flex-col gap-4 border-b border-line pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Verkstad
            </p>
            <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
              Arbetskalender
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {canManage
                ? "Dra en arbetsorder för att flytta den i tid eller till en annan mekaniker."
                : "Översikt över verkstadens planerade arbete."}
            </p>
          </div>
          {hasOrg && mechanics.length > 0 ? (
            <div className="hidden shrink-0 rounded-xl border border-line bg-surface px-4 py-2.5 text-right shadow-card sm:block">
              <p className="text-xl font-extrabold tabular-nums text-brand-600">
                {totalOrders}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {view === "day" ? "ordrar idag" : view === "week" ? "ordrar denna vecka" : "ordrar denna månad"}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-line bg-surface-muted p-0.5">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-sm font-medium transition-all",
                  view === v
                    ? "bg-surface text-ink shadow-xs ring-1 ring-line"
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
              <span className="min-w-[12rem] px-2 text-center text-sm font-semibold capitalize text-ink">
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
        <EmptyState text="Välj en verkstad för att se dess arbetskalender." />
      ) : mechanics.length === 0 ? (
        <EmptyState text="Inga mekaniker i verkstaden ännu." />
      ) : (
        <DndContext
          id="schedule-calendar"
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-surface shadow-card">
            <div style={{ minWidth: LABEL_W + trackWidth }}>
              {/* Axel-header (sticky topp) */}
              <div className="sticky top-0 z-30 flex border-b border-line bg-surface">
                <div
                  className="sticky left-0 z-40 flex shrink-0 items-center border-r border-line bg-surface px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ width: LABEL_W }}
                >
                  Mekaniker / fordon
                </div>
                <div className="flex" style={{ width: trackWidth }}>
                  {columns.map((c) => (
                    <div
                      key={c.key}
                      className="flex shrink-0 items-center justify-center gap-1.5 border-r border-line py-2.5 text-xs font-medium"
                      style={{ width: colWidth }}
                    >
                      {view === "day" ? (
                        <span className="text-muted-foreground tabular-nums">
                          {c.label}
                        </span>
                      ) : (
                        <>
                          <span className="capitalize text-muted-foreground">
                            {c.label}
                          </span>
                          {c.sub ? (
                            <span
                              className={cn(
                                "inline-flex size-5 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                                c.today
                                  ? "bg-brand-600 text-white"
                                  : "text-ink",
                              )}
                            >
                              {c.sub}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mekanikergrupper */}
              {mechanics.map((mech) => (
                <MechanicGroup
                  key={mech.id}
                  mech={mech}
                  jobs={jobsByMechanic.get(mech.id) ?? EMPTY_JOBS}
                  columns={columns}
                  colWidth={colWidth}
                  trackWidth={trackWidth}
                  canManage={canManage}
                  nowX={nowX}
                  position={position}
                  onOpen={openJob}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeJob ? (
              <div
                className="flex h-11 items-stretch overflow-hidden rounded-md bg-surface shadow-lift ring-2 ring-brand-400/50"
                style={{ width: 150, rotate: "1.5deg" }}
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted/40 px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <CalendarRange className="size-6" />
      </span>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
