"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import {
  type View,
  type Placed,
  DAY_START,
  DAY_END,
  WORK_HOURS,
  HOUR_H,
  WEEKDAYS_SHORT,
  pad,
  hm,
  toParam,
  clamp,
  addDays,
  sameDay,
  initialsOf,
  layoutColumn,
  durationHoursOf,
} from "./calendar-utils";

const GUTTER = 56;

export interface MoveArgs {
  job: ScheduleJob;
  newStart: Date;
  newEnd: Date;
  fromUserId?: string;
  toUserId?: string;
}

interface Column {
  key: string;
  isToday: boolean;
  // week
  date?: Date;
  // day
  mech?: Mechanic;
  placed: Placed[];
}

export function TimeGrid({
  view,
  anchorISO,
  fromISO,
  mechanics,
  jobs,
  canManage,
  onOpen,
  onMove,
}: {
  view: View;
  anchorISO: string;
  fromISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
  onMove: (args: MoveArgs) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const today = useMemo(() => new Date(), []);

  const columns = useMemo<Column[]>(() => {
    if (view === "week") {
      const from = new Date(fromISO);
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(from, i);
        const key = toParam(date);
        const dayJobs = jobs.filter(
          (j) => j.scheduledStart && toParam(new Date(j.scheduledStart)) === key,
        );
        return { key, date, isToday: sameDay(date, today), placed: layoutColumn(dayJobs, "") };
      });
    }
    return mechanics.map((mech) => {
      const mechJobs = jobs.filter((j) =>
        j.mechanics.some((m) => m.userId === mech.id),
      );
      return {
        key: mech.id,
        mech,
        isToday: sameDay(new Date(anchorISO), today),
        placed: layoutColumn(mechJobs, mech.id),
      };
    });
  }, [view, fromISO, anchorISO, jobs, mechanics, today]);

  const hours = Array.from({ length: WORK_HOURS + 1 }, (_, i) => DAY_START + i);
  const bodyHeight = WORK_HOURS * HOUR_H;

  // Nu-linje
  const nowTop = useMemo(() => {
    if (!mounted) return null;
    const n = new Date();
    const h = n.getHours() + n.getMinutes() / 60;
    if (h < DAY_START || h > DAY_END) return null;
    return (h - DAY_START) * HOUR_H;
  }, [mounted]);

  const minColWidth = view === "day" ? 168 : 96;
  const gridCols = `${GUTTER}px repeat(${columns.length}, minmax(${minColWidth}px, 1fr))`;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!canManage) return;
    const [jobId, fromMech, colKey] = String(e.active.id).split("|");
    const job = jobById.get(jobId);
    if (!job || !job.scheduledStart || !job.scheduledEnd) return;

    const oldStart = new Date(job.scheduledStart);
    const durMs = new Date(job.scheduledEnd).getTime() - oldStart.getTime();
    const durH = durationHoursOf(job);

    const newStart = new Date(oldStart);
    // Vertikal förflyttning → tid (15-min-snäpp)
    const minutesShift = Math.round((e.delta.y / HOUR_H) * 60 / 15) * 15;
    newStart.setTime(oldStart.getTime() + minutesShift * 60000);

    const overId = e.over ? String(e.over.id) : null;
    const target = overId?.startsWith("col:") ? overId.slice(4) : null;

    let toUserId: string | undefined;
    if (view === "week") {
      // Sidled → byt dag (behåll klockslag)
      if (target && target !== colKey) {
        const [y, mo, da] = target.split("-").map(Number);
        newStart.setFullYear(y, mo - 1, da);
      }
    } else if (target && target !== colKey) {
      // Dagvy: sidled → byt mekaniker
      const already = job.mechanics.some((m) => m.userId === target);
      if (!already) toUserId = target;
    }

    // Klampa in i arbetsdagen
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
      id="time-grid"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-surface shadow-card">
        <div style={{ minWidth: GUTTER + columns.length * minColWidth }}>
          {/* Kolumnrubriker */}
          <div
            className="sticky top-0 z-30 grid border-b border-line bg-surface/95 backdrop-blur"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="sticky left-0 z-10 bg-surface/95" style={{ width: GUTTER }} />
            {columns.map((c) => (
              <ColumnHeader key={c.key} col={c} />
            ))}
          </div>

          {/* Rutnät */}
          <div className="grid" style={{ gridTemplateColumns: gridCols }}>
            {/* Tidsgutter */}
            <div
              className="sticky left-0 z-20 bg-surface"
              style={{ width: GUTTER, height: bodyHeight }}
            >
              <div className="relative h-full">
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[0.7rem] font-medium tabular-nums text-muted-foreground"
                    style={{ top: i * HOUR_H + 3 }}
                  >
                    {i < WORK_HOURS ? `${pad(h)}:00` : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Kolumner */}
            {columns.map((c) => (
              <GridColumn
                key={c.key}
                col={c}
                view={view}
                canManage={canManage}
                bodyHeight={bodyHeight}
                nowTop={c.isToday ? nowTop : null}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeJob ? (
          <div
            className="flex items-stretch overflow-hidden rounded-lg bg-surface shadow-lift ring-2 ring-brand-400/50"
            style={{ width: 150, height: 52, rotate: "1.5deg" }}
          >
            <span
              className={cn(
                "w-1.5 shrink-0",
                statusMeta[activeJob.status]?.accent ?? "bg-slate-400",
              )}
            />
            <span className="flex min-w-0 flex-col justify-center px-2 py-1">
              <span className="truncate text-xs font-semibold text-ink">
                {activeJob.type}
              </span>
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function ColumnHeader({ col }: { col: Column }) {
  if (col.date) {
    const dow = (col.date.getDay() + 6) % 7;
    return (
      <div className="flex items-center justify-center gap-2 border-l border-line py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS_SHORT[dow]}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
            col.isToday ? "bg-brand-600 text-white" : "text-ink",
          )}
        >
          {col.date.getDate()}
        </span>
      </div>
    );
  }
  const mech = col.mech!;
  return (
    <div className="flex items-center justify-center gap-2 border-l border-line px-2 py-2.5">
      <Avatar initials={mech.initials} size="size-7 text-[0.7rem]" />
      <span className="min-w-0 truncate text-sm font-semibold text-ink">
        {mech.name}
      </span>
      {col.placed.length > 0 ? (
        <span className="shrink-0 rounded-full bg-brand-50 px-1.5 text-xs font-semibold text-brand-700">
          {new Set(col.placed.map((p) => p.job.id)).size}
        </span>
      ) : null}
    </div>
  );
}

const GridColumn = memo(function GridColumn({
  col,
  view,
  canManage,
  bodyHeight,
  nowTop,
  onOpen,
}: {
  col: Column;
  view: View;
  canManage: boolean;
  bodyHeight: number;
  nowTop: number | null;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.key}` });
  const hours = Array.from({ length: WORK_HOURS }, (_, i) => i);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border-l border-line",
        col.isToday && "bg-brand-50/25",
        isOver && canManage && "bg-brand-50/60",
      )}
      style={{ height: bodyHeight }}
    >
      {/* Timlinjer */}
      {hours.map((i) => (
        <div
          key={i}
          className="absolute inset-x-0 border-t border-line/60"
          style={{ top: i * HOUR_H }}
          aria-hidden
        />
      ))}

      {/* Nu-linje */}
      {nowTop !== null ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
          style={{ top: nowTop }}
        >
          <span className="size-2 shrink-0 -translate-x-1/2 rounded-full bg-danger" />
          <span className="h-px flex-1 bg-danger/60" />
        </div>
      ) : null}

      {/* Order-block */}
      {col.placed.map((p) => (
        <JobBlock
          key={`${p.job.id}:${col.key}`}
          placed={p}
          colKey={col.key}
          view={view}
          canManage={canManage}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
});

const JobBlock = memo(function JobBlock({
  placed,
  colKey,
  view,
  canManage,
  onOpen,
}: {
  placed: Placed;
  colKey: string;
  view: View;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { job, mechId, top, height, lane, lanes } = placed;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${job.id}|${mechId}|${colKey}`,
    disabled: !canManage,
  });
  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const primary = job.vehicles[0]?.vehicle;
  const compact = height < 46;

  const widthPct = 100 / lanes;
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "absolute z-20 flex items-stretch overflow-hidden rounded-lg text-left ring-1 ring-line",
        meta?.tint ?? "bg-surface",
        isDragging
          ? "opacity-30"
          : "shadow-soft transition-shadow hover:z-30 hover:shadow-lift hover:ring-brand-200",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      style={{
        top: top + 2,
        height,
        left: `calc(${lane * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span className={cn("w-1.5 shrink-0", meta?.accent ?? "bg-slate-400")} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold leading-tight text-ink">
            {job.type}
          </span>
        </span>
        {start ? (
          <span className="truncate text-[0.65rem] leading-tight text-muted-foreground tabular-nums">
            {hm(start)}
            {end ? `–${hm(end)}` : ""}
          </span>
        ) : null}
        {!compact ? (
          <span className="mt-auto flex items-center gap-1.5 pt-0.5">
            {primary ? <LicensePlate value={primary.regNo} size="sm" /> : null}
            {view === "week" && job.mechanics[0] ? (
              <Avatar
                initials={initialsOf(job.mechanics[0].user.name)}
                size="size-5 text-[0.55rem]"
                className="ml-auto"
              />
            ) : null}
          </span>
        ) : null}
      </span>
    </button>
  );
});
