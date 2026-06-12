"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  User as UserIcon,
  Wrench,
  Flag,
  Clock,
  Users,
  Receipt,
  Loader2,
  Check,
  CalendarClock,
  StickyNote,
  ArrowUpRight,
  X,
} from "lucide-react";
import { LicensePlate } from "@/components/ui/license-plate";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";
import { FieldSelect } from "@/components/ui/field-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { orderTotals, formatOre } from "@/lib/pricing";
import { statusMeta, statusLabels, priorityLabels } from "./calendar-meta";
import { moveJob, setJobStatus, setJobNote } from "./actions";

const dtf = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const tf = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_ORDER = [
  "planned",
  "in_progress",
  "waiting_parts",
  "done",
  "delayed",
] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function hhmm(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function withTime(base: Date, value: string) {
  const [h, m] = value.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ *
 *  Snabbåtgärder
 * ------------------------------------------------------------------ */

/** Statusväljare – ett tryck byter status direkt. */
function StatusPicker({
  jobId,
  status,
  onStatus,
}: {
  jobId: string;
  status: string;
  onStatus: (s: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  function pick(s: string) {
    if (s === status || pending) return;
    const prev = status;
    onStatus(s); // optimistiskt
    setPending(s);
    setJobStatus(jobId, s)
      .then((res) => {
        if ("error" in res) onStatus(prev);
        else router.refresh();
      })
      .finally(() => setPending(null));
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Status
      </p>
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => {
          const meta = statusMeta[s];
          const active = s === status;
          const loading = pending === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              disabled={!!pending}
              aria-pressed={active}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors pointer-coarse:h-10",
                active
                  ? `${meta?.badge ?? ""} border-transparent ring-1 ring-inset ring-ink/10`
                  : "border-line bg-surface text-ink-soft active:bg-surface-muted hover:bg-surface-muted",
              )}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-slate-400")} />
              )}
              {statusLabels[s] ?? s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Omboka – ändra tid och mekaniker. */
function ReschedulePanel({
  job,
  mechanics,
  onClose,
}: {
  job: ScheduleJob;
  mechanics: Mechanic[];
  onClose: () => void;
}) {
  const router = useRouter();
  const baseDate = new Date(job.scheduledStart as Date);
  const currentMech = job.mechanics[0]?.userId ?? "";

  const [start, setStart] = useState(hhmm(new Date(job.scheduledStart as Date)));
  const [end, setEnd] = useState(hhmm(new Date(job.scheduledEnd as Date)));
  const [mech, setMech] = useState(currentMech);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const changed =
    start !== hhmm(new Date(job.scheduledStart as Date)) ||
    end !== hhmm(new Date(job.scheduledEnd as Date)) ||
    mech !== currentMech;

  function save() {
    setError("");
    const newStart = withTime(baseDate, start);
    const newEnd = withTime(baseDate, end);
    if (newEnd.getTime() <= newStart.getTime()) {
      setError("Sluttiden måste vara efter starttiden.");
      return;
    }
    const toUserId = mech && mech !== currentMech ? mech : undefined;
    startTransition(async () => {
      const res = await moveJob(job.id, {
        ...(toUserId ? { fromUserId: currentMech, toUserId } : {}),
        scheduledStart: newStart.toISOString(),
        scheduledEnd: newEnd.toISOString(),
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface-muted/50 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Omboka
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted"
          aria-label="Stäng"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-soft">Start</label>
          <TimePicker value={start} onChange={setStart} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-soft">Slut</label>
          <TimePicker value={end} onChange={setEnd} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-soft">Mekaniker</label>
        <FieldSelect
          value={mech}
          onValueChange={setMech}
          placeholder="Välj mekaniker…"
          options={mechanics.map((m) => ({ value: m.id, label: m.name }))}
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="success"
        className="w-full"
        disabled={pending || !changed}
        onClick={save}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Spara ny tid
      </Button>
    </div>
  );
}

/** Anteckning – fritt textfält som sparas på arbetsordern. */
function NotePanel({
  job,
  onClose,
  onSaved,
}: {
  job: ScheduleJob;
  onClose: () => void;
  onSaved: (note: string) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(job.description ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    startTransition(async () => {
      const res = await setJobNote(job.id, value);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      onSaved(value.trim());
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface-muted/50 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Anteckning
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted"
          aria-label="Stäng"
        >
          <X className="size-4" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        autoFocus
        placeholder="Skriv en anteckning om jobbet…"
        className="w-full resize-none rounded-xl border border-input bg-surface px-3 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
      {error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="success"
        className="w-full"
        disabled={pending}
        onClick={save}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Spara anteckning
      </Button>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  href,
  active,
}: {
  icon: typeof Clock;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const cls = cn(
    "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition-colors",
    active
      ? "border-brand-300 bg-brand-50 text-brand-700"
      : "border-line bg-surface text-ink-soft active:bg-surface-muted hover:bg-surface-muted",
  );
  const inner = (
    <>
      <Icon className="size-5" />
      <span className="text-center leading-tight">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Car;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Detaljpanel
 * ------------------------------------------------------------------ */

type Panel = "none" | "reschedule" | "note";

export function JobDetail({
  job,
  open,
  onOpenChange,
  mechanics = [],
  canManage = false,
}: {
  job: ScheduleJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanics?: Mechanic[];
  canManage?: boolean;
}) {
  // Lokal status/anteckning för omedelbar återkoppling i öppen panel.
  const [status, setStatus] = useState(job?.status ?? "planned");
  const [note, setNote] = useState(job?.description ?? "");
  const [panel, setPanel] = useState<Panel>("none");

  useEffect(() => {
    setStatus(job?.status ?? "planned");
    setNote(job?.description ?? "");
    setPanel("none");
  }, [job]);

  const vehicles = job?.vehicles.map((jv) => jv.vehicle) ?? [];
  const jobMechanics = job?.mechanics.map((jm) => jm.user) ?? [];
  const customers = job
    ? [
        ...new Map(
          job.vehicles
            .flatMap((jv) => jv.vehicle.customers)
            .map((c) => [c.customer.id, c.customer]),
        ).values(),
      ]
    : [];
  const totals = job ? orderTotals(job.parts) : null;
  const primary = vehicles[0];
  const canReschedule = canManage && !!job?.scheduledStart && !!job?.scheduledEnd;
  const meta = statusMeta[status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {job ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 pr-8">
                <LicensePlate
                  value={primary?.regNo ?? "—"}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <SheetTitle>{job.type}</SheetTitle>
                  <SheetDescription>
                    {primary
                      ? [primary.brand, primary.model].filter(Boolean).join(" ") ||
                        primary.regNo
                      : "Inget fordon"}
                    {vehicles.length > 1 ? ` +${vehicles.length - 1} fordon` : ""}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    meta?.badge ?? "",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", meta?.dot ?? "bg-slate-400")} />
                  {statusLabels[status] ?? status}
                </span>
                {job.scheduledStart ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                    <Clock className="size-3.5" />
                    {tf.format(new Date(job.scheduledStart))}
                    {job.scheduledEnd ? `–${tf.format(new Date(job.scheduledEnd))}` : ""}
                  </span>
                ) : null}
              </div>
            </SheetHeader>

            <SheetBody className="space-y-5">
              {/* Snabb status */}
              <StatusPicker jobId={job.id} status={status} onStatus={setStatus} />

              {/* Snabbåtgärder */}
              <div className="flex gap-2">
                {canReschedule ? (
                  <QuickAction
                    icon={CalendarClock}
                    label="Omboka"
                    active={panel === "reschedule"}
                    onClick={() =>
                      setPanel((p) => (p === "reschedule" ? "none" : "reschedule"))
                    }
                  />
                ) : null}
                <QuickAction
                  icon={StickyNote}
                  label="Anteckning"
                  active={panel === "note"}
                  onClick={() => setPanel((p) => (p === "note" ? "none" : "note"))}
                />
                <QuickAction
                  icon={ArrowUpRight}
                  label="Arbetsorder"
                  href={`/arbetsordrar/${job.id}`}
                  onClick={() => onOpenChange(false)}
                />
              </div>

              {panel === "reschedule" && canReschedule ? (
                <ReschedulePanel
                  job={job}
                  mechanics={mechanics}
                  onClose={() => setPanel("none")}
                />
              ) : null}
              {panel === "note" ? (
                <NotePanel
                  job={job}
                  onClose={() => setPanel("none")}
                  onSaved={setNote}
                />
              ) : null}

              {/* Detaljer */}
              <div className="divide-y divide-line border-t border-line">
                <Row icon={Clock} label="Tid">
                  {job.scheduledStart && job.scheduledEnd ? (
                    <>
                      {dtf.format(new Date(job.scheduledStart))} ·{" "}
                      {tf.format(new Date(job.scheduledStart))}–
                      {tf.format(new Date(job.scheduledEnd))}
                    </>
                  ) : (
                    "Ej tidsatt"
                  )}
                </Row>
                <Row icon={UserIcon} label="Mekaniker">
                  {jobMechanics.length > 0
                    ? jobMechanics.map((m) => m.name).join(", ")
                    : "Ej tilldelad"}
                </Row>
                <Row icon={Wrench} label="Typ">
                  {job.type}
                </Row>
                <Row icon={Flag} label="Prioritet">
                  {priorityLabels[job.priority] ?? job.priority}
                </Row>
                <Row icon={Car} label="Fordon">
                  {vehicles.length > 0 ? (
                    <ul className="space-y-1">
                      {vehicles.map((v) => (
                        <li key={v.id} className="flex items-center gap-2">
                          <LicensePlate value={v.regNo} size="sm" className="shrink-0" />
                          <span className="text-ink-soft">
                            {[v.brand, v.model].filter(Boolean).join(" ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </Row>
                {customers.length > 0 ? (
                  <Row icon={Users} label="Kunder">
                    {customers.map((c) => c.name).join(", ")}
                  </Row>
                ) : null}
                {totals && job.parts.length > 0 ? (
                  <Row icon={Receipt} label="Delar / inköp">
                    <span className="text-ink-soft">
                      {job.parts.length} {job.parts.length === 1 ? "rad" : "rader"} ·
                      totalt{" "}
                      <span className="font-semibold text-ink">
                        {formatOre(totals.inclOre)}
                      </span>{" "}
                      inkl. moms
                    </span>
                  </Row>
                ) : null}
                {note ? (
                  <Row icon={StickyNote} label="Anteckning">
                    <span className="font-normal whitespace-pre-wrap text-ink-soft">
                      {note}
                    </span>
                  </Row>
                ) : null}
              </div>
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
