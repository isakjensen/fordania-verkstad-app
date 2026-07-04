"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Avatar } from "@/components/ui/avatar";
import { Car, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusMeta, statusLabels } from "./calendar-meta";
import type { MoveArgs } from "./time-grid";
import {
  type PlacedH,
  type CalGroup,
  type CalVehicleRow,
  DAY_START,
  DAY_END,
  WORK_HOURS,
  WEEKDAYS_SHORT,
  MONTHS,
  isoDow,
  pad,
  hm,
  clamp,
  sameDay,
  durationHoursOf,
  layoutRow,
  groupByMechVehicle,
  UNASSIGNED_KEY,
} from "./calendar-utils";

const LABEL_W = 208;
const TRACK_MIN = 1152; // px – 24 timmar; under detta scrollar tidslinjen i sidled
const BLOCK_H = 50;
const GAP = 6;
const ROW_PAD = 8;

function rowHeight(sublanes: number) {
  return Math.max(64, sublanes * (BLOCK_H + GAP) - GAP + ROW_PAD * 2);
}
const pct = (hours: number) => `${(hours / WORK_HOURS) * 100}%`;

interface LaidRow {
  row: CalVehicleRow;
  placed: PlacedH[];
  height: number;
}
interface LaidGroup {
  group: CalGroup;
  /** mekaniker-id för drag-mål ("" = Ej tilldelade). */
  mechId: string;
  rows: LaidRow[];
}

/**
 * Dagvy som resurs-tidslinje. Ordrarna grupperas mekaniker → fordon: varje
 * tilldelat fordon får en egen rad (namnet på mekanikern som grupprubrik) och
 * tiden ligger som vågrät axel högst upp. Ett fordon kan ha flera ordrar under
 * dagen. Dra en order i sidled för att flytta tid, eller ner till en annan
 * mekanikers grupp för att byta mekaniker.
 */
export function DayBoard({
  anchorISO,
  mechanics,
  jobs,
  canManage,
  onOpen,
  onMove,
}: {
  anchorISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
  onMove: (args: MoveArgs) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Faktisk pixelbredd på tidslinjen (mäts) – behövs för att översätta
  // drag-avstånd i px till tid när bredden är flexibel.
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackPx, setTrackPx] = useState(TRACK_MIN);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackPx(el.clientWidth || TRACK_MIN);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const isToday = useMemo(
    () => sameDay(new Date(anchorISO), new Date()),
    [anchorISO],
  );
  const dateLabel = useMemo(() => {
    const d = new Date(anchorISO);
    return `${WEEKDAYS_SHORT[isoDow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }, [anchorISO]);

  const groups = useMemo<LaidGroup[]>(
    () =>
      groupByMechVehicle(mechanics, jobs).map((group) => ({
        group,
        mechId: group.mech?.id ?? "",
        rows: group.rows.map((row) => {
          const { placed, sublanes } = layoutRow(row.jobs);
          return { row, placed, height: rowHeight(sublanes) };
        }),
      })),
    [mechanics, jobs],
  );

  const hours = Array.from({ length: WORK_HOURS }, (_, i) => DAY_START + i);

  const nowOffset = useMemo(() => {
    if (!mounted || !isToday) return null;
    const n = new Date();
    const h = n.getHours() + n.getMinutes() / 60;
    if (h < DAY_START || h > DAY_END) return null;
    return h - DAY_START;
  }, [mounted, isToday]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!canManage) return;
    const [jobId, fromMech] = String(e.active.id).split("|");
    const job = jobById.get(jobId);
    if (!job || !job.scheduledStart || !job.scheduledEnd) return;

    const oldStart = new Date(job.scheduledStart);
    const durMs = new Date(job.scheduledEnd).getTime() - oldStart.getTime();
    const durH = durationHoursOf(job);

    // Sidled → tid (15-min-snäpp). px → timmar via uppmätt bredd.
    const hourW = trackPx / WORK_HOURS;
    const minutesShift = Math.round((e.delta.x / hourW) * 60 / 15) * 15;
    const newStart = new Date(oldStart.getTime() + minutesShift * 60000);

    // Upp/ner → byt mekaniker (fordonets rad följer med). Mål-mekanikern läses
    // ur droppzonens id `row:<mechId>::<vehicleKey>`. Ej tilldelade (tomt id)
    // är inte ett mål för mekanikerbyte.
    const overId = e.over ? String(e.over.id) : null;
    const targetMech = overId?.startsWith("row:")
      ? overId.slice(4).split("::")[0]
      : null;
    let toUserId: string | undefined;
    if (targetMech && targetMech !== fromMech) {
      const already = job.mechanics.some((m) => m.userId === targetMech);
      if (!already) toUserId = targetMech;
    }

    let h = newStart.getHours() + newStart.getMinutes() / 60;
    h = clamp(h, DAY_START, Math.max(DAY_START, DAY_END - durH));
    newStart.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    const newEnd = new Date(newStart.getTime() + durMs);

    const moved = newStart.getTime() !== oldStart.getTime();
    if (!moved && toUserId === undefined) return;

    onMove({
      job,
      newStart,
      newEnd,
      ...(toUserId ? { fromUserId: fromMech, toUserId } : {}),
    });
  }

  const activeJob = activeId ? jobById.get(activeId.split("|")[0]) : null;

  return (
    <DndContext
      id="day-board"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-surface shadow-card">
        <div className="min-w-fit">
          {/* Tidsaxel (sticky topp) */}
          <div className="sticky top-0 z-30 flex border-b border-line bg-surface/95 backdrop-blur">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center border-r border-line bg-surface/95 px-4 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: LABEL_W }}
            >
              Fordon
            </div>
            <div
              ref={trackRef}
              className="flex h-[38px]"
              style={{ width: `calc(100% - ${LABEL_W}px)`, minWidth: TRACK_MIN }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex flex-1 items-center border-l border-line/70 pl-1 text-[0.68rem] font-medium tabular-nums text-muted-foreground"
                >
                  {pad(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Grupper: mekaniker → fordonsrader */}
          {groups.map((g) => (
            <div key={g.group.key}>
              <GroupBand group={g.group} dateLabel={dateLabel} />
              {g.rows.length === 0 ? (
                <EmptyRow mechId={g.mechId} canManage={canManage} />
              ) : (
                g.rows.map((r) => (
                  <VehicleRow
                    key={r.row.key}
                    laid={r}
                    mechId={g.mechId}
                    canManage={canManage}
                    nowOffset={nowOffset}
                    onOpen={onOpen}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeJob ? (
          <div
            className="flex items-stretch overflow-hidden rounded-lg bg-surface shadow-lift ring-2 ring-brand-400/50"
            style={{ width: 170, height: BLOCK_H, rotate: "1deg" }}
          >
            <span
              className={cn(
                "w-1.5 shrink-0",
                statusMeta[activeJob.status]?.accent ?? "bg-slate-400",
              )}
            />
            <span className="flex min-w-0 flex-col justify-center px-2.5 py-1">
              <span className="truncate text-xs font-bold text-ink">
                {activeJob.type}
              </span>
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Grupprubrik – mekanikern (eller "Ej tilldelade") med dagens datum på samma rad. */
const GroupBand = memo(function GroupBand({
  group,
  dateLabel,
}: {
  group: CalGroup;
  dateLabel: string;
}) {
  const unassigned = group.key === UNASSIGNED_KEY;
  const vehicleCount = group.rows.filter((r) => r.vehicle).length;
  return (
    <div className="flex items-center justify-between border-b border-line bg-surface-muted/60">
      <div className="sticky left-0 z-20 flex items-center gap-2.5 bg-surface-muted/60 px-4 py-2">
        {unassigned ? (
          <span className="flex size-8 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Layers className="size-4" />
          </span>
        ) : (
          <Avatar initials={group.mech!.initials} size="size-8 text-[0.7rem]" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {unassigned ? "Ej tilldelade" : group.mech!.name}
          </p>
          <p className="text-[0.7rem] text-muted-foreground">
            {vehicleCount > 0
              ? `${vehicleCount} fordon · ${group.orderCount} ${group.orderCount === 1 ? "order" : "ordrar"}`
              : "Inga fordon"}
          </p>
        </div>
      </div>
      <span className="shrink-0 px-4 text-xs font-semibold capitalize tabular-nums text-muted-foreground">
        {dateLabel}
      </span>
    </div>
  );
});

/** Tom mekaniker utan fordon – ändå en droppzon så man kan dra hit ordrar. */
const EmptyRow = memo(function EmptyRow({
  mechId,
  canManage,
}: {
  mechId: string;
  canManage: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `row:${mechId}::empty` });
  return (
    <div
      className={cn(
        "flex border-b border-line last:border-b-0",
        isOver && canManage && "bg-brand-50/50",
      )}
      style={{ height: 56 }}
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-4 text-xs italic text-muted-foreground/60"
        style={{ width: LABEL_W }}
      >
        <Car className="size-4" />
        Inga fordon
      </div>
      <div
        ref={setNodeRef}
        className="flex items-center px-3 text-xs italic text-muted-foreground/50"
        style={{ width: `calc(100% - ${LABEL_W}px)`, minWidth: TRACK_MIN }}
      >
        Dra hit en order för att tilldela
      </div>
    </div>
  );
});

const VehicleRow = memo(function VehicleRow({
  laid,
  mechId,
  canManage,
  nowOffset,
  onOpen,
}: {
  laid: LaidRow;
  mechId: string;
  canManage: boolean;
  nowOffset: number | null;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { row, placed, height } = laid;
  const { setNodeRef, isOver } = useDroppable({
    id: `row:${mechId}::${row.key}`,
  });
  const hours = Array.from({ length: WORK_HOURS }, (_, i) => i);
  const vehicle = row.vehicle;
  const subtitle = vehicle
    ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ")
    : "Utan fordon";

  return (
    <div
      className={cn(
        "flex border-b border-line last:border-b-0",
        isOver && canManage && "bg-brand-50/50",
      )}
      style={{ height }}
    >
      {/* Fordons-etikett (sticky vänster) */}
      <div
        className={cn(
          "sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-line px-4",
          isOver && canManage ? "bg-brand-50" : "bg-surface",
        )}
        style={{ width: LABEL_W }}
      >
        {vehicle ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-ink">
              {vehicle.regNo}
            </p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
              <Car className="size-4" />
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Tidslinje */}
      <div
        ref={setNodeRef}
        className="relative"
        style={{ width: `calc(100% - ${LABEL_W}px)`, minWidth: TRACK_MIN }}
      >
        {/* Timlinjer */}
        <div className="absolute inset-0 flex" aria-hidden>
          {hours.map((i) => (
            <div key={i} className="flex-1 border-l border-line/50" />
          ))}
        </div>
        {/* Nu-linje */}
        {nowOffset !== null ? (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-danger/70"
            style={{ left: pct(nowOffset) }}
            aria-hidden
          >
            <span className="absolute -top-0.5 -left-[3px] size-1.5 rounded-full bg-danger" />
          </div>
        ) : null}
        {/* Order-block */}
        {placed.map((p) => (
          <JobBlock
            key={p.job.id}
            placed={p}
            mechId={mechId}
            canManage={canManage}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
});

const JobBlock = memo(function JobBlock({
  placed,
  mechId,
  canManage,
  onOpen,
}: {
  placed: PlacedH;
  mechId: string;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { job, startOffset, durH, sublane } = placed;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${job.id}|${mechId}`,
    disabled: !canManage,
  });
  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const top = ROW_PAD + sublane * (BLOCK_H + GAP);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "absolute z-20 flex items-stretch overflow-hidden rounded-xl text-left ring-1 ring-line",
        meta?.tint ?? "bg-surface",
        isDragging
          ? "opacity-30"
          : "shadow-soft transition-shadow hover:z-30 hover:shadow-lift hover:ring-brand-200",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      style={{
        left: `calc(${pct(startOffset)} + 2px)`,
        width: `calc(${pct(durH)} - 4px)`,
        minWidth: 138,
        top,
        height: BLOCK_H,
      }}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span className={cn("w-1.5 shrink-0", meta?.accent ?? "bg-slate-400")} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5">
        <span className="truncate text-[0.82rem] font-bold leading-tight text-ink">
          {job.type}
        </span>
        {start ? (
          <span className="truncate text-[0.68rem] font-medium leading-tight text-muted-foreground tabular-nums">
            {hm(start)}
            {end ? `–${hm(end)}` : ""}
          </span>
        ) : null}
      </span>
    </button>
  );
});
