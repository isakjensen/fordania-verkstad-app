"use client";

import { memo, useMemo, useState } from "react";
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
  WEEKDAYS_SHORT,
  hm,
  toParam,
  addDays,
  sameDay,
} from "./calendar-utils";

const LABEL_W = 156;
const DAY_MIN = 104; // px – under detta scrollar veckan i sidled

interface DayCell {
  key: string;
  date: Date;
  isToday: boolean;
  jobs: ScheduleJob[];
}
interface Row {
  mech: Mechanic;
  days: DayCell[];
  weekCount: number;
}

/**
 * Veckovy som resurs-matris: en rad per mekaniker (namn till vänster) och
 * veckans sju dagar som kolumner – samma upplägg som dagvyn, fast över en
 * vecka. Dra en order till en annan dag eller mekaniker för att omplanera.
 */
export function WeekBoard({
  fromISO,
  mechanics,
  jobs,
  canManage,
  onOpen,
  onMove,
}: {
  fromISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
  onMove: (args: MoveArgs) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const today = useMemo(() => new Date(), []);
  const from = useMemo(() => new Date(fromISO), [fromISO]);

  const dayHeaders = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(from, i);
        return { key: toParam(date), date, isToday: sameDay(date, today) };
      }),
    [from, today],
  );

  const rows = useMemo<Row[]>(
    () =>
      mechanics.map((mech) => {
        const mechJobs = jobs.filter((j) =>
          j.mechanics.some((m) => m.userId === mech.id),
        );
        const days = dayHeaders.map(({ key, date, isToday }) => {
          const dayJobs = mechJobs
            .filter(
              (j) =>
                j.scheduledStart &&
                toParam(new Date(j.scheduledStart)) === key,
            )
            .sort(
              (a, b) =>
                new Date(a.scheduledStart as Date).getTime() -
                new Date(b.scheduledStart as Date).getTime(),
            );
          return { key, date, isToday, jobs: dayJobs };
        });
        const weekCount = days.reduce((n, d) => n + d.jobs.length, 0);
        return { mech, days, weekCount };
      }),
    [mechanics, jobs, dayHeaders],
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!canManage) return;
    const [jobId, fromMech, fromKey] = String(e.active.id).split("|");
    const job = jobById.get(jobId);
    if (!job || !job.scheduledStart || !job.scheduledEnd) return;

    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("cell:")) return;
    const [, toMech, toKey] = overId.split(":");
    if (toMech === fromMech && toKey === fromKey) return;

    const oldStart = new Date(job.scheduledStart);
    const durMs = new Date(job.scheduledEnd).getTime() - oldStart.getTime();

    // Byt dag men behåll klockslag
    const newStart = new Date(oldStart);
    if (toKey !== fromKey) {
      const [y, mo, da] = toKey.split("-").map(Number);
      newStart.setFullYear(y, mo - 1, da);
    }
    const newEnd = new Date(newStart.getTime() + durMs);

    // Byt mekaniker
    let toUserId: string | undefined;
    if (toMech !== fromMech && !job.mechanics.some((m) => m.userId === toMech)) {
      toUserId = toMech;
    }

    onMove({
      job,
      newStart,
      newEnd,
      ...(toUserId ? { fromUserId: fromMech, toUserId } : {}),
    });
  }

  const activeJob = activeId ? jobById.get(activeId.split("|")[0]) : null;
  const minW = LABEL_W + 7 * DAY_MIN;

  return (
    <DndContext
      id="week-board"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-line bg-surface shadow-card">
        <div style={{ minWidth: minW }} className="flex flex-col">
          {/* Dagrubriker (sticky topp) */}
          <div className="sticky top-0 z-30 flex shrink-0 border-b border-line bg-surface/95 backdrop-blur">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center border-r border-line bg-surface/95 px-4 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground"
              style={{ width: LABEL_W }}
            >
              Mekaniker
            </div>
            <div className="grid flex-1 grid-cols-7">
              {dayHeaders.map((d) => {
                const dow = (d.date.getDay() + 6) % 7;
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex items-center justify-center gap-1.5 border-l border-line py-2.5",
                      d.isToday && "bg-brand-50/40",
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {WEEKDAYS_SHORT[dow]}
                    </span>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                        d.isToday ? "bg-brand-600 text-white" : "text-ink",
                      )}
                    >
                      {d.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mekanikerrader – prydliga, jämna radhöjder som växer med innehållet */}
          <div className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.mech.id}
              className="flex min-h-[108px] border-b border-line last:border-b-0"
            >
              {/* Namn-etikett (sticky vänster) */}
              <div
                className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-3 py-3"
                style={{ width: LABEL_W }}
              >
                <Avatar initials={row.mech.initials} size="size-8 text-[0.7rem]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {row.mech.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.weekCount > 0
                      ? `${row.weekCount} ${row.weekCount === 1 ? "order" : "ordrar"}`
                      : "Inga ordrar"}
                  </p>
                </div>
              </div>

              {/* Dagceller */}
              <div className="grid flex-1 grid-cols-7">
                {row.days.map((cell) => (
                  <DayColumn
                    key={cell.key}
                    mechId={row.mech.id}
                    cell={cell}
                    canManage={canManage}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeJob ? (
          <div
            className="flex items-stretch overflow-hidden rounded-lg bg-surface shadow-lift ring-2 ring-brand-400/50"
            style={{ width: 150, rotate: "1.5deg" }}
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

const DayColumn = memo(function DayColumn({
  mechId,
  cell,
  canManage,
  onOpen,
}: {
  mechId: string;
  cell: DayCell;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell:${mechId}:${cell.key}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-1.5 border-l border-line p-1.5",
        cell.isToday && "bg-brand-50/25",
        isOver && canManage && "bg-brand-50/70",
      )}
    >
      {cell.jobs.length === 0 ? (
        <span className="m-auto text-[0.7rem] italic text-muted-foreground/40">
          —
        </span>
      ) : (
        cell.jobs.map((job) => (
          <JobChip
            key={job.id}
            job={job}
            mechId={mechId}
            colKey={cell.key}
            canManage={canManage}
            onOpen={onOpen}
          />
        ))
      )}
    </div>
  );
});

const JobChip = memo(function JobChip({
  job,
  mechId,
  colKey,
  canManage,
  onOpen,
}: {
  job: ScheduleJob;
  mechId: string;
  colKey: string;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${job.id}|${mechId}|${colKey}`,
    disabled: !canManage,
  });
  const meta = statusMeta[job.status];
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const primary = job.vehicles[0]?.vehicle;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg text-left ring-1 ring-line",
        meta?.tint ?? "bg-surface",
        isDragging
          ? "opacity-30"
          : "shadow-soft transition-shadow hover:shadow-lift hover:ring-brand-200",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span
        className={cn("w-1.5 shrink-0", meta?.accent ?? "bg-slate-400")}
        aria-hidden
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-1.5">
        <span className="truncate text-xs font-bold leading-tight text-ink">
          {job.type}
        </span>
        {start ? (
          <span className="text-[0.65rem] leading-tight text-muted-foreground tabular-nums">
            {hm(start)}
            {end ? `–${hm(end)}` : ""}
          </span>
        ) : null}
        {primary ? (
          <LicensePlate value={primary.regNo} size="sm" className="mt-0.5" />
        ) : null}
      </span>
    </button>
  );
});
