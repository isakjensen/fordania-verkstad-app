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
import { Car, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusLabels } from "./calendar-meta";
import { cardStyleFor } from "./card-style";
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
import { MovedProvider, useJustMoved } from "./moved-context";

const LABEL_W = 208;
const TRACK_MIN = 1152; // px – 24 timmar; under detta scrollar tidslinjen i sidled
const BLOCK_H = 44;
const GAP = 5;
const ROW_PAD = 6;

function rowHeight(sublanes: number) {
  return Math.max(52, sublanes * (BLOCK_H + GAP) - GAP + ROW_PAD * 2);
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
  movedId,
  onOpen,
  onMove,
}: {
  anchorISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  movedId?: string | null;
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
  const activeCs = activeJob ? cardStyleFor(activeJob.status) : null;

  return (
    <MovedProvider value={movedId ?? null}>
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

          {/* Grupper: mekaniker → fordonsrader. Mekaniker utan ordrar får ingen
              rad – man släpper istället en order direkt på namnbandet. */}
          {groups.map((g) => (
            <div key={g.group.key}>
              <GroupBand
                group={g.group}
                mechId={g.mechId}
                dateLabel={dateLabel}
                canManage={canManage}
              />
              {g.rows.map((r) => (
                <VehicleRow
                  key={r.row.key}
                  laid={r}
                  mechId={g.mechId}
                  canManage={canManage}
                  nowOffset={nowOffset}
                  onOpen={onOpen}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeJob && activeCs ? (
          <div
            className={cn(
              "relative flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg px-2.5 shadow-lift ring-1 ring-line-strong",
              activeCs.tint,
            )}
            style={{ width: 178, height: BLOCK_H, rotate: "2.5deg" }}
          >
            <span className="truncate text-[0.82rem] font-semibold leading-tight tracking-tight text-ink">
              {activeJob.type}
            </span>
            {activeJob.scheduledStart ? (
              <span className="truncate text-[0.66rem] font-medium leading-none text-muted-foreground tabular-nums">
                {hm(new Date(activeJob.scheduledStart))}
                {activeJob.scheduledEnd
                  ? `–${hm(new Date(activeJob.scheduledEnd))}`
                  : ""}
              </span>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </MovedProvider>
  );
}

/**
 * Grupprubrik – mekanikern (eller "Ej tilldelade") med dagens datum. Hela
 * bandet är en droppzon: släpp en order på mekanikerns namn för att tilldela
 * den (tiden behålls). Ej tilldelade är inget mål.
 */
const GroupBand = memo(function GroupBand({
  group,
  mechId,
  dateLabel,
  canManage,
}: {
  group: CalGroup;
  mechId: string;
  dateLabel: string;
  canManage: boolean;
}) {
  const unassigned = group.key === UNASSIGNED_KEY;
  const { setNodeRef, isOver } = useDroppable({
    id: `row:${mechId}::band`,
    disabled: unassigned,
  });
  const active = isOver && canManage && !unassigned;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-between border-b border-line",
        active ? "bg-brand-50/70" : "bg-surface-muted/60",
      )}
    >
      <div
        className={cn(
          "sticky left-0 z-20 flex items-center gap-2.5 px-4 py-1.5",
          active ? "bg-brand-50" : "bg-surface-muted/60",
        )}
      >
        {unassigned ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Layers className="size-3.5" />
          </span>
        ) : null}
        <p className="truncate text-[0.82rem] font-bold text-ink">
          {unassigned ? "Ej tilldelade" : group.mech!.name}
        </p>
      </div>
      <span className="shrink-0 px-4 text-xs font-semibold capitalize tabular-nums text-muted-foreground">
        {dateLabel}
      </span>
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
  const vehicleName = vehicle
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
          "sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-line px-4",
          isOver && canManage ? "bg-brand-50" : "bg-surface",
        )}
        style={{ width: LABEL_W }}
      >
        {vehicle ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold uppercase leading-tight tracking-wide text-ink">
              {vehicle.regNo}
            </p>
            {vehicleName ? (
              <p className="truncate text-[0.7rem] font-medium leading-tight text-ink-soft">
                {vehicleName}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground">
              <Car className="size-3.5" />
            </span>
            <p className="min-w-0 flex-1 truncate text-[0.7rem] text-muted-foreground">
              {vehicleName}
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
  const justMoved = useJustMoved(job.id);
  const cs = cardStyleFor(job.status);
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
        "absolute z-20 flex flex-col justify-center gap-0.5 overflow-hidden rounded-lg px-2.5 py-1 text-left ring-1 ring-line transition duration-150",
        cs.tint,
        justMoved && "animate-card-drop-in",
        isDragging ? "opacity-40" : "shadow-chip hover:z-30",
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
      <span className="truncate text-[0.82rem] font-semibold leading-tight tracking-tight text-ink">
        {job.type}
      </span>
      {start ? (
        <span className="truncate text-[0.66rem] font-medium leading-tight text-muted-foreground tabular-nums">
          {hm(start)}
          {end ? `–${hm(end)}` : ""}
        </span>
      ) : null}
    </button>
  );
});
