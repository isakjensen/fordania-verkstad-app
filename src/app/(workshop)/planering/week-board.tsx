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
import { Car, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { statusLabels } from "./calendar-meta";
import { cardStyleFor } from "./card-style";
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
import { UnassignedTray, UNASSIGNED_DROP_ID } from "./unassigned-tray";
import { MovedProvider, useJustMoved, useMovedId } from "./moved-context";
import { motion } from "motion/react";

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
  movedId,
  onOpen,
  onMove,
}: {
  fromISO: string;
  mechanics: Mechanic[];
  jobs: ScheduleJob[];
  canManage: boolean;
  movedId?: string | null;
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

  // Otilldelade ordrar visas i en egen rad ovanför rutnätet (UnassignedTray),
  // inte som en grupp i själva matrisen.
  const assignedGroups = useMemo(
    () => groups.filter((g) => g.key !== UNASSIGNED_KEY),
    [groups],
  );
  const unassignedJobs = useMemo(
    () =>
      groups.find((g) => g.key === UNASSIGNED_KEY)?.rows.flatMap((r) => r.jobs) ??
      [],
    [groups],
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
    if (!overId) return;

    const oldStart = new Date(job.scheduledStart);
    const durMs = new Date(job.scheduledEnd).getTime() - oldStart.getTime();

    // Släpp på "Ej tilldelade"-raden: avtilldela (ta bort mekanikern man drog
    // ifrån). Redan otilldelade kort (tom fromMech) är en no-op.
    if (overId === UNASSIGNED_DROP_ID) {
      if (!fromMech) return;
      onMove({
        job,
        newStart: oldStart,
        newEnd: new Date(oldStart.getTime() + durMs),
        fromUserId: fromMech,
        unassign: true,
      });
      return;
    }

    // Släpp på en mekanikers namnband: byt bara mekaniker, behåll dag/tid.
    if (overId.startsWith("band:")) {
      const toMech = overId.slice(5);
      if (!toMech || toMech === fromMech) return;
      if (job.mechanics.some((m) => m.userId === toMech)) return;
      onMove({
        job,
        newStart: oldStart,
        newEnd: new Date(oldStart.getTime() + durMs),
        fromUserId: fromMech,
        toUserId: toMech,
      });
      return;
    }

    if (!overId.startsWith("cell:")) return;
    // cell:<mechId>:<dayKey>:<vehicleKey>
    const parts = overId.slice(5).split(":");
    const toMech = parts[0];
    const toKey = parts[1];
    if (toMech === fromMech && toKey === fromKey) return;

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
  const activeCs = activeJob ? cardStyleFor(activeJob.status) : null;
  const minW = LABEL_W + 7 * DAY_MIN;

  return (
    <MovedProvider value={movedId ?? null}>
    <DndContext
      id="week-board"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <UnassignedTray jobs={unassignedJobs} canManage={canManage} onOpen={onOpen} />
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

            {/* Grupper: mekaniker → fordonsrader. Mekaniker utan ordrar får ingen
                rad – man släpper istället en order direkt på namnbandet. Otilldelade
                ordrar visas i UnassignedTray ovanför, inte här. */}
            {assignedGroups.map((group) => (
              <div key={group.key}>
                <GroupBand
                  group={group}
                  dayHeaders={dayHeaders}
                  canManage={canManage}
                />
                {group.rows.map((row) => (
                  <VehicleRow
                    key={row.key}
                    row={row}
                    mechId={group.mech?.id ?? ""}
                    dayHeaders={dayHeaders}
                    canManage={canManage}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeJob && activeCs ? (
          <div
            className={cn(
              "relative flex flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-2 shadow-lift ring-1 ring-line-strong",
              activeCs.tint,
            )}
            style={{ width: 178, rotate: "2.5deg" }}
          >
            <span className="truncate text-[0.8rem] font-semibold leading-tight tracking-tight text-ink">
              {activeJob.type}
            </span>
            {activeJob.scheduledStart ? (
              <span className="truncate text-[0.68rem] font-medium leading-none text-muted-foreground tabular-nums">
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
 * Grupprubrik – mekanikern (eller "Ej tilldelade") som ett band över raderna.
 * Dagrubrikerna visas bara i den fastnaglade toppen, inte per grupp.
 */
const GroupBand = memo(function GroupBand({
  group,
  dayHeaders,
  canManage,
}: {
  group: CalGroup;
  dayHeaders: DayHeader[];
  canManage: boolean;
}) {
  const unassigned = group.key === UNASSIGNED_KEY;
  const mechId = group.mech?.id ?? "";
  // Hela bandet är en droppzon: släpp en order på mekanikerns namn för att
  // tilldela den (dagen/tiden behålls). Ej tilldelade är inget mål.
  const { setNodeRef, isOver } = useDroppable({
    id: `band:${mechId}`,
    disabled: unassigned,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex border-b border-line bg-surface-muted/60",
        isOver && canManage && !unassigned && "bg-brand-50/70",
      )}
    >
      <div
        className={cn(
          "sticky left-0 z-20 flex shrink-0 items-center gap-2.5 px-4 py-1.5",
          isOver && canManage && !unassigned ? "bg-brand-50" : "bg-surface-muted/60",
        )}
        style={{ width: LABEL_W }}
      >
        {unassigned ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Layers className="size-3.5" />
          </span>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-[0.82rem] font-bold text-ink">
          {unassigned ? "Ej tilldelade" : group.mech!.name}
        </p>
      </div>
      <div className="grid flex-1 grid-cols-7">
        {dayHeaders.map((d) => (
          <div
            key={d.key}
            className={cn(
              "border-l border-line/60",
              d.isToday && "bg-brand-50/40",
            )}
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
  const vehicleName = vehicle
    ? [vehicle.brand, vehicle.model].filter(Boolean).join(" ")
    : "Utan fordon";

  // En rad som just kommit fram p.g.a. ett släpp växer fram (höjd 0 → auto) så
  // raderna under gör plats mjukt. overflow-hidden bara under animationen –
  // annars slutar den sticky vänster-etiketten att fastna vid sidoscroll.
  const movedId = useMovedId();
  const shouldGrow = movedId != null && row.jobs.some((j) => j.id === movedId);
  const [growing, setGrowing] = useState(shouldGrow);

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
    <motion.div
      className="border-b border-line last:border-b-0"
      initial={shouldGrow ? { height: 0, opacity: 0 } : false}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: growing ? "hidden" : "visible" }}
      onAnimationComplete={() => setGrowing(false)}
    >
    <div className="flex min-h-[44px]">
      {/* Fordons-etikett (sticky vänster) */}
      <div
        className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-line bg-surface px-3 py-1.5"
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
    </motion.div>
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
  const justMoved = useJustMoved(job.id);
  const cs = cardStyleFor(job.status);
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "group/chip relative flex min-w-0 flex-col gap-0.5 overflow-hidden rounded-lg px-2.5 py-2 text-left ring-1 ring-line transition duration-150",
        cs.tint,
        justMoved && "animate-card-drop-in",
        isDragging ? "opacity-40" : "shadow-chip",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span className="truncate text-[0.8rem] font-semibold leading-tight tracking-tight text-ink">
        {job.type}
      </span>
      {start ? (
        <span className="truncate text-[0.68rem] font-medium leading-tight text-muted-foreground tabular-nums">
          {hm(start)}
          {end ? `–${hm(end)}` : ""}
        </span>
      ) : null}
    </button>
  );
});
