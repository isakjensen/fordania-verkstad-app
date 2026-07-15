"use client";

import type { ReactElement } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlate } from "@/lib/plate-ocr";
import type { ScheduleJob } from "@/lib/data/schedule";
import { toParam, hm } from "./calendar-utils";
import { statusLabels } from "./calendar-meta";
import { eventCardClass, EventCardBody } from "./event-card";
import { useJustMoved } from "./moved-context";

/** Droppzon-id: släpp en tilldelad order här för att avtilldela den. */
export const UNASSIGNED_DROP_ID = "unassigned";

/**
 * Vågrät rad högst upp i veckovyn med arbetsordrar som saknar mekaniker.
 * Korten ligger sida vid sida och kan dras in i kalenderrutnätet för att
 * tilldelas en mekaniker/dag. Blir raden för bred scrollar den i sidled.
 * Raden är alltid synlig och fungerar som droppzon: drar man en tilldelad
 * order hit avtilldelas den och hamnar här igen.
 */
export function UnassignedTray({
  jobs,
  canManage,
  onOpen,
}: {
  jobs: ScheduleJob[];
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}): ReactElement {
  const withStart = jobs.filter((job) => job.scheduledStart);
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_DROP_ID });
  const active = isOver && canManage;

  return (
    <div className="shrink-0">
      <div className="mb-1.5 flex items-center gap-2 pl-0.5">
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
          Ej tilldelade
        </span>
        {withStart.length > 0 ? (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning px-1.5 text-[0.65rem] font-bold tabular-nums text-white shadow-soft">
            {withStart.length}
          </span>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "w-fit max-w-full min-w-[340px] rounded-2xl transition-colors",
          withStart.length === 0 ? "p-0" : "p-2",
          active ? "bg-brand-50 ring-2 ring-brand-300" : "",
        )}
      >
        {withStart.length === 0 ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3 transition-colors",
              active
                ? "border-brand-300 bg-brand-50/60"
                : "border-line-strong/70 bg-surface-muted/30",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                active
                  ? "bg-brand-100 text-brand-600 ring-brand-200"
                  : "bg-surface text-muted-foreground ring-line",
              )}
            >
              <Inbox className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-soft">
                Inga otilldelade ordrar
              </p>
              <p className="text-[0.7rem] leading-tight text-muted-foreground">
                Dra en order hit för att ta bort dess mekaniker
              </p>
            </div>
          </div>
        ) : (
          <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto">
            {withStart.map((job) => (
              <TrayCard
                key={job.id}
                job={job}
                canManage={canManage}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrayCard({
  job,
  canManage,
  onOpen,
}: {
  job: ScheduleJob;
  canManage: boolean;
  onOpen: (job: ScheduleJob) => void;
}) {
  const dayKey = toParam(new Date(job.scheduledStart as Date));
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${job.id}||${dayKey}`,
    disabled: !canManage,
  });
  const justMoved = useJustMoved(job.id);
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;
  const regNo = job.vehicles[0]?.vehicle?.regNo;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(job)}
      title={`${job.type} · ${statusLabels[job.status] ?? job.status}`}
      className={cn(
        "relative flex min-h-[46px] w-[196px] shrink-0 items-stretch text-left transition duration-150",
        eventCardClass(job.type),
        justMoved && "animate-card-drop-in",
        isDragging ? "opacity-40" : "shadow-chip",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <EventCardBody
        job={job}
        showTime={false}
        extra={
          <span className="flex min-w-0 items-center gap-1.5 leading-none">
            {start ? (
              <span className="shrink-0 text-[0.68rem] font-medium text-muted-foreground tabular-nums">
                {hm(start)}
                {end ? `–${hm(end)}` : ""}
              </span>
            ) : null}
            {regNo ? (
              <span className="min-w-0 truncate border-l border-line pl-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-ink-soft">
                {formatPlate(regNo)}
              </span>
            ) : null}
          </span>
        }
      />
    </button>
  );
}
