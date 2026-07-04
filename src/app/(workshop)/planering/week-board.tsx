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
import { Car, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusMeta, statusLabels } from "./calendar-meta";
import type { MoveArgs } from "./time-grid";
import {
  type CalGroup,
  type CalVehicleRow,
  WEEKDAYS_SHORT,
  hm,
  toParam,
  addDays,
  sameDay,
  groupByMechVehicle,
  UNASSIGNED_KEY,
} from "./calendar-utils";

const LABEL_W = 180;
const DAY_MIN = 104; // px – under detta scrollar veckan i sidled

interface DayHeader {
  key: string;
  date: Date;
  isToday: boolean;
}

/**
 * Veckovy som resurs-matris. Ordrarna grupperas mekaniker → fordon: varje
 * tilldelat fordon får en egen rad (mekanikern som grupprubrik) och veckans sju
 * dagar som kolumner. Ett fordon kan ha flera ordrar under veckan. Dra en order
 * till en annan dag för att omplanera, eller till en annan mekanikers grupp för
 * att byta mekaniker.
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

  const dayHeaders = useMemo<DayHeader[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(from, i);
        return { key: toParam(date), date, isToday: sameDay(date, today) };
      }),
    [from, today],
  );

  const groups = useMemo<CalGroup[]>(
    () => groupByMechVehicle(mechanics, jobs),
    [mechanics, jobs],
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
    // cell:<mechId>:<dayKey>:<vehicleKey>
    const parts = overId.slice(5).split(":");
    const toMech = parts[0];
    const toKey = parts[1];
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

    // Byt mekaniker (Ej tilldelade = tomt id är inte ett mål)
    let toUserId: string | undefined;
    if (
      toMech &&
      toMech !== fromMech &&
      !job.mechanics.some((m) => m.userId === toMech)
    ) {
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
              Fordon
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

          {/* Grupper: mekaniker → fordonsrader */}
          {groups.map((group) => (
            <div key={group.key}>
              <GroupBand group={group} dayHeaders={dayHeaders} />
              {group.rows.length === 0 ? (
                <EmptyRow
                  mechId={group.mech?.id ?? ""}
                  dayHeaders={dayHeaders}
                  canManage={canManage}
                />
              ) : (
                group.rows.map((row) => (
                  <VehicleRow
                    key={row.key}
                    row={row}
                    mechId={group.mech?.id ?? ""}
                    dayHeaders={dayHeaders}
                    canManage={canManage}
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

/**
 * Grupprubrik – mekanikern (eller "Ej tilldelade") som ett band över raderna.
 * Veckans dagar (veckodag + datumsiffra) upprepas på samma rad så de syns även
 * när man scrollat förbi den fastnaglade toppen.
 */
const GroupBand = memo(function GroupBand({
  group,
  dayHeaders,
}: {
  group: CalGroup;
  dayHeaders: DayHeader[];
}) {
  const unassigned = group.key === UNASSIGNED_KEY;
  const vehicleCount = group.rows.filter((r) => r.vehicle).length;
  return (
    <div className="flex border-b border-line bg-surface-muted/60">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center gap-2.5 bg-surface-muted/60 px-4 py-2"
        style={{ width: LABEL_W }}
      >
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
      <div className="grid flex-1 grid-cols-7">
        {dayHeaders.map((d) => {
          const dow = (d.date.getDay() + 6) % 7;
          return (
            <div
              key={d.key}
              className={cn(
                "flex items-center justify-center gap-1.5 border-l border-line/60",
                d.isToday && "bg-brand-50/40",
              )}
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {WEEKDAYS_SHORT[dow]}
              </span>
              <span
                className={cn(
                  "text-xs font-bold tabular-nums",
                  d.isToday ? "text-brand-600" : "text-ink",
                )}
              >
                {d.date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/** Tom mekaniker utan fordon – ändå droppzoner så man kan dra hit ordrar. */
const EmptyRow = memo(function EmptyRow({
  mechId,
  dayHeaders,
  canManage,
}: {
  mechId: string;
  dayHeaders: DayHeader[];
  canManage: boolean;
}) {
  return (
    <div className="flex min-h-[64px] border-b border-line last:border-b-0">
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-4 text-xs italic text-muted-foreground/60"
        style={{ width: LABEL_W }}
      >
        <Car className="size-4" />
        Inga fordon
      </div>
      <div className="grid flex-1 grid-cols-7">
        {dayHeaders.map((d) => (
          <DayCell
            key={d.key}
            mechId={mechId}
            dayKey={d.key}
            vehicleKey="empty"
            isToday={d.isToday}
            jobs={[]}
            canManage={canManage}
            onOpen={() => {}}
          />
        ))}
      </div>
    </div>
  );
});

const VehicleRow = memo(function VehicleRow({
  row,
  mechId,
  dayHeaders,
  canManage,
  onOpen,
}: {
  row: CalVehicleRow;
  mechId: string;
  dayHeaders: DayHeader[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const vehicle = row.vehicle;
  const subtitle = vehicle
    ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ")
    : "Utan fordon";

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleJob[]>();
    for (const job of row.jobs) {
      if (!job.scheduledStart) continue;
      const key = toParam(new Date(job.scheduledStart));
      const list = map.get(key);
      if (list) list.push(job);
      else map.set(key, [job]);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledStart as Date).getTime() -
          new Date(b.scheduledStart as Date).getTime(),
      );
    }
    return map;
  }, [row.jobs]);

  return (
    <div className="flex min-h-[72px] border-b border-line last:border-b-0">
      {/* Fordons-etikett (sticky vänster) */}
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-line bg-surface px-3 py-3"
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

      {/* Dagceller */}
      <div className="grid flex-1 grid-cols-7">
        {dayHeaders.map((d) => (
          <DayCell
            key={d.key}
            mechId={mechId}
            dayKey={d.key}
            vehicleKey={row.key}
            isToday={d.isToday}
            jobs={byDay.get(d.key) ?? []}
            canManage={canManage}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
});

const DayCell = memo(function DayCell({
  mechId,
  dayKey,
  vehicleKey,
  isToday,
  jobs,
  canManage,
  onOpen,
}: {
  mechId: string;
  dayKey: string;
  vehicleKey: string;
  isToday: boolean;
  jobs: ScheduleJob[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${mechId}:${dayKey}:${vehicleKey}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-1.5 border-l border-line p-1.5",
        isToday && "bg-brand-50/25",
        isOver && canManage && "bg-brand-50/70",
      )}
    >
      {jobs.length === 0 ? (
        <span className="m-auto text-[0.7rem] italic text-muted-foreground/40">
          —
        </span>
      ) : (
        jobs.map((job) => (
          <JobChip
            key={job.id}
            job={job}
            mechId={mechId}
            colKey={dayKey}
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
      </span>
    </button>
  );
});
