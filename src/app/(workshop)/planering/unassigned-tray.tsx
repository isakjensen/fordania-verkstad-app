"use client";

import type { ReactElement } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleJob } from "@/lib/data/schedule";
import { toParam, hm } from "./calendar-utils";
import { statusLabels } from "./calendar-meta";
import { cardStyleFor } from "./card-style";
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
          "w-fit max-w-full min-w-[340px] rounded-2xl p-2 ring-1 transition-colors",
          active
            ? "bg-brand-50 ring-2 ring-brand-300"
            : "bg-surface-muted/80 ring-line",
        )}
      >
        {withStart.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-muted-foreground/70">
            <Inbox className="size-4" />
            Dra hit en order för att avtilldela den
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
  const cs = cardStyleFor(job.status);
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
        "relative flex h-[62px] w-[196px] shrink-0 min-w-0 flex-col justify-center gap-1 overflow-hidden rounded-lg py-2 pr-3 pl-4 text-left ring-1 ring-line transition duration-150",
        cs.tint,
        justMoved && "animate-card-drop-in",
        isDragging
          ? "opacity-40"
          : "shadow-chip hover:-translate-y-0.5 hover:shadow-lift hover:ring-line-strong",
        canManage ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      {...(canManage ? listeners : {})}
      {...(canManage ? attributes : {})}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", cs.bar)}
        aria-hidden
      />
      <span className="truncate text-[0.82rem] font-semibold leading-tight tracking-tight text-ink">
        {job.type}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 leading-none">
        {start ? (
          <span className="shrink-0 text-[0.68rem] font-medium text-muted-foreground tabular-nums">
            {hm(start)}
            {end ? `–${hm(end)}` : ""}
          </span>
        ) : null}
        {regNo ? (
          <span className="min-w-0 truncate border-l border-line pl-1.5 text-[0.66rem] font-bold uppercase tracking-wide text-ink-soft">
            {regNo}
          </span>
        ) : null}
      </span>
    </button>
  );
}
