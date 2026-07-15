import { cn } from "@/lib/utils";
import type { ScheduleJob } from "@/lib/data/schedule";
import { hm } from "./calendar-utils";
import { typeMetaFor, statusMeta } from "./calendar-meta";

/**
 * Gemensam look för kalenderns orderkort (vecko-, dag- och otilldelade-korten):
 * färgsatta efter ordertyp (Service, Reparation, …) med en solid vänsterkant,
 * en typ-ikon och en mjuk ton – och en liten statusprick för ordrar som inte är
 * "planerad" så pågående/väntar/klar/försenad syns direkt.
 */

/** Klasserna för själva kort-knappen: mjuk typton + tunn ring i samma kulör. */
export function eventCardClass(type: string) {
  const t = typeMetaFor(type);
  return cn("overflow-hidden rounded-lg ring-1", t.tint, t.ring);
}

export function EventCardBody({
  job,
  showTime = true,
  extra,
}: {
  job: ScheduleJob;
  /** Visa tidsraden (av för kort som visar tiden på egen rad via `extra`). */
  showTime?: boolean;
  /** Extra innehåll under rubriken (t.ex. tid + regskylt på otilldelade-kort). */
  extra?: React.ReactNode;
}) {
  const t = typeMetaFor(job.type);
  const Icon = t.icon;
  const meta = statusMeta[job.status];
  const showStatus = job.status !== "planned";
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const end = job.scheduledEnd ? new Date(job.scheduledEnd) : null;

  return (
    <span className="flex min-w-0 flex-1 items-stretch">
      {/* Typfärgad vänsterkant */}
      <span className={cn("w-1.5 shrink-0", t.bar)} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2 py-1">
        <span className="flex items-center gap-1">
          <Icon className={cn("size-3 shrink-0", t.iconColor)} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[0.8rem] font-semibold leading-tight tracking-tight text-ink">
            {job.type}
          </span>
          {showStatus ? (
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                meta?.dot ?? "bg-slate-400",
              )}
              aria-hidden
            />
          ) : null}
        </span>
        {showTime && start ? (
          <span className="truncate text-[0.66rem] font-medium leading-tight text-muted-foreground tabular-nums">
            {hm(start)}
            {end ? `–${hm(end)}` : ""}
          </span>
        ) : null}
        {extra}
      </span>
    </span>
  );
}
