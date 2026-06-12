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
import { LicensePlate } from "@/components/ui/license-plate";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusMeta, statusLabels } from "./calendar-meta";
import type { MoveArgs } from "./time-grid";
import {
  type PlacedH,
  DAY_START,
  DAY_END,
  WORK_HOURS,
  pad,
  hm,
  clamp,
  sameDay,
  durationHoursOf,
  layoutRow,
} from "./calendar-utils";

const LABEL_W = 184;
const TRACK_MIN = 760; // px – under detta scrollar tidslinjen i sidled
const BLOCK_H = 50;
const GAP = 6;
const ROW_PAD = 8;

function rowHeight(sublanes: number) {
  return Math.max(72, sublanes * (BLOCK_H + GAP) - GAP + ROW_PAD * 2);
}
const pct = (hours: number) => `${(hours / WORK_HOURS) * 100}%`;

interface Row {
  mech: Mechanic;
  placed: PlacedH[];
  sublanes: number;
  height: number;
}

/**
 * Dagvy som resurs-tidslinje: en rad per mekaniker (namn till vänster) och
 * tiden som vågrät axel högst upp. Tidsaxeln fyller bredden och blir därmed bra
 * på alla skärmstorlekar. Dra en order i sidled för att flytta tid, eller
 * upp/ner till en annan mekaniker.
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

  const rows = useMemo<Row[]>(
    () =>
      mechanics.map((mech) => {
        const mechJobs = jobs.filter((j) =>
          j.mechanics.some((m) => m.userId === mech.id),
        );
        const { placed, sublanes } = layoutRow(mechJobs);
        return { mech, placed, sublanes, height: rowHeight(sublanes) };
      }),
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

    // Upp/ner → byt mekaniker
    const overId = e.over ? String(e.over.id) : null;
    const target = overId?.startsWith("row:") ? overId.slice(4) : null;
    let toUserId: string | undefined;
    if (target && target !== fromMech) {
      const already = job.mechanics.some((m) => m.userId === target);
      if (!already) toUserId = target;
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
              Mekaniker
            </div>
            <div
              ref={trackRef}
              className="flex h-[38px]"
              style={{ width: `calc(100% - ${LABEL_W}px)`, minWidth: TRACK_MIN }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex flex-1 items-center border-l border-line/70 pl-1.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground"
                >
                  {pad(h)}:00
                </div>
              ))}
            </div>
          </div>

          {/* Mekanikerrader */}
          {rows.map((row) => (
            <MechRow
              key={row.mech.id}
              row={row}
              canManage={canManage}
              nowOffset={nowOffset}
              trackPx={trackPx}
              onOpen={onOpen}
            />
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

const MechRow = memo(function MechRow({
  row,
  canManage,
  nowOffset,
  trackPx,
  onOpen,
}: {
  row: Row;
  canManage: boolean;
  nowOffset: number | null;
  trackPx: number;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `row:${row.mech.id}` });
  const hours = Array.from({ length: WORK_HOURS }, (_, i) => i);
  const orderCount = new Set(row.placed.map((p) => p.job.id)).size;

  return (
    <div
      className={cn(
        "flex border-b border-line last:border-b-0",
        isOver && canManage && "bg-brand-50/50",
      )}
      style={{ height: row.height }}
    >
      {/* Namn-etikett (sticky vänster) */}
      <div
        className={cn(
          "sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-line px-4",
          isOver && canManage ? "bg-brand-50" : "bg-surface",
        )}
        style={{ width: LABEL_W }}
      >
        <Avatar initials={row.mech.initials} size="size-9 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {row.mech.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {orderCount > 0
              ? `${orderCount} ${orderCount === 1 ? "order" : "ordrar"}`
              : "Inga ordrar"}
          </p>
        </div>
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
        {/* Tom-läge */}
        {row.placed.length === 0 ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs italic text-muted-foreground/60">
            Inga inplanerade ordrar
          </span>
        ) : null}
        {/* Order-block */}
        {row.placed.map((p) => (
          <JobBlock
            key={p.job.id}
            placed={p}
            mechId={row.mech.id}
            canManage={canManage}
            trackPx={trackPx}
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
  trackPx,
  onOpen,
}: {
  placed: PlacedH;
  mechId: string;
  canManage: boolean;
  trackPx: number;
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
  const primary = job.vehicles[0]?.vehicle;
  const top = ROW_PAD + sublane * (BLOCK_H + GAP);
  // Faktisk bredd i px styr hur mycket innehåll som ryms i blocket.
  const blockPx = (durH / WORK_HOURS) * trackPx;

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
        minWidth: 50,
        top,
        height: BLOCK_H,
      }}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span className={cn("w-1.5 shrink-0", meta?.accent ?? "bg-slate-400")} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.8rem] font-bold leading-tight text-ink">
            {job.type}
          </span>
          {start && blockPx >= 104 ? (
            <span className="shrink-0 text-[0.65rem] font-medium leading-tight text-muted-foreground tabular-nums">
              {hm(start)}
              {end ? `–${hm(end)}` : ""}
            </span>
          ) : null}
        </span>
        {primary && blockPx >= 140 ? (
          <LicensePlate value={primary.regNo} size="sm" />
        ) : null}
      </span>
    </button>
  );
});
