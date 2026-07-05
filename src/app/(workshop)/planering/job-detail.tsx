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
  Pencil,
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
import {
  moveJob,
  setJobStatus,
  setJobNote,
  setJobType,
  setJobPriority,
  linkJobCustomer,
  unlinkJobCustomer,
} from "./actions";

const TYPE_OPTIONS = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
].map((t) => ({ value: t, label: t }));

const PRIORITY_OPTIONS = Object.entries(priorityLabels).map(
  ([value, label]) => ({ value, label }),
);

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

/** Inline-väljare för typ – sparar direkt vid val (optimistiskt). */
function TypePicker({
  jobId,
  type,
  onType,
}: {
  jobId: string;
  type: string;
  onType: (t: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function pick(next: string) {
    if (next === type) return;
    const prev = type;
    onType(next); // optimistiskt
    setPending(true);
    setJobType(jobId, next)
      .then((res) => {
        if ("error" in res) onType(prev);
        else router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="flex items-center gap-2">
      <FieldSelect
        value={type}
        onValueChange={pick}
        options={TYPE_OPTIONS}
        className="min-w-[9rem]"
      />
      {pending ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

/** Inline-väljare för prioritet – sparar direkt vid val (optimistiskt). */
function PriorityPicker({
  jobId,
  priority,
  onPriority,
}: {
  jobId: string;
  priority: string;
  onPriority: (p: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function pick(next: string) {
    if (next === priority) return;
    const prev = priority;
    onPriority(next); // optimistiskt
    setPending(true);
    setJobPriority(jobId, next)
      .then((res) => {
        if ("error" in res) onPriority(prev);
        else router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="flex items-center gap-2">
      <FieldSelect
        value={priority}
        onValueChange={pick}
        options={PRIORITY_OPTIONS}
        className="min-w-[7rem]"
      />
      {pending ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

/**
 * Inline-hantering av kunder på ordern. Kunder hör till fordonet i datamodellen,
 * så koppling görs mot orderns fordon. Saknar ordern fordon visas en ledtext.
 */
function CustomerEditor({
  jobId,
  current,
  options,
  hasVehicle,
}: {
  jobId: string;
  current: { id: string; name: string }[];
  options: { id: string; name: string }[];
  hasVehicle: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const currentIds = new Set(current.map((c) => c.id));
  const available = options.filter((o) => !currentIds.has(o.id));

  function add(customerId: string) {
    setError("");
    startTransition(async () => {
      const res = await linkJobCustomer(jobId, customerId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(customerId: string) {
    setError("");
    startTransition(async () => {
      const res = await unlinkJobCustomer(jobId, customerId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {current.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {current.map((c) => (
            <li
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-0.5 pl-2.5 pr-1 text-sm font-medium text-ink"
            >
              {c.name}
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={pending}
                aria-label={`Ta bort ${c.name}`}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-line-strong hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Inga kunder kopplade</p>
      )}

      {!hasVehicle ? (
        <p className="text-xs text-muted-foreground">
          Koppla ett fordon på ordern för att kunna lägga till kunder.
        </p>
      ) : available.length > 0 ? (
        <FieldSelect
          value=""
          onValueChange={add}
          placeholder="Lägg till kund…"
          disabled={pending}
          options={available.map((o) => ({ value: o.id, label: o.name }))}
        />
      ) : null}

      {error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
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
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

/**
 * Ett radvärde som kan klickas för att öppna en redigeringspanel. Visar en
 * diskret penn-ikon som antyder att det går att ändra. Ej redigerbart → ren text.
 */
function EditableValue({
  editable,
  onClick,
  children,
}: {
  editable: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (!editable) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/edit flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-brand-700"
    >
      <span className="min-w-0">{children}</span>
      <Pencil className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/edit:text-brand-600" />
    </button>
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
  customers = [],
  canManage = false,
}: {
  job: ScheduleJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanics?: Mechanic[];
  customers?: { id: string; name: string }[];
  canManage?: boolean;
}) {
  // Lokal status/typ/prioritet/anteckning för omedelbar återkoppling.
  const [status, setStatus] = useState(job?.status ?? "planned");
  const [type, setType] = useState(job?.type ?? "");
  const [priority, setPriority] = useState(job?.priority ?? "normal");
  const [note, setNote] = useState(job?.description ?? "");
  const [panel, setPanel] = useState<Panel>("none");

  useEffect(() => {
    setStatus(job?.status ?? "planned");
    setType(job?.type ?? "");
    setPriority(job?.priority ?? "normal");
    setNote(job?.description ?? "");
    setPanel("none");
  }, [job]);

  const vehicles = job?.vehicles.map((jv) => jv.vehicle) ?? [];
  const jobMechanics = job?.mechanics.map((jm) => jm.user) ?? [];
  const linkedCustomers = job
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
  const hasVehicle = vehicles.length > 0;
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
                  <EditableValue
                    editable={canReschedule}
                    onClick={() => setPanel("reschedule")}
                  >
                    {job.scheduledStart && job.scheduledEnd ? (
                      <>
                        {dtf.format(new Date(job.scheduledStart))} ·{" "}
                        {tf.format(new Date(job.scheduledStart))}–
                        {tf.format(new Date(job.scheduledEnd))}
                      </>
                    ) : (
                      "Ej tidsatt"
                    )}
                  </EditableValue>
                </Row>
                <Row icon={UserIcon} label="Mekaniker">
                  <EditableValue
                    editable={canReschedule}
                    onClick={() => setPanel("reschedule")}
                  >
                    {jobMechanics.length > 0
                      ? jobMechanics.map((m) => m.name).join(", ")
                      : "Ej tilldelad"}
                  </EditableValue>
                </Row>
                <Row icon={Wrench} label="Typ">
                  {canManage ? (
                    <TypePicker jobId={job.id} type={type} onType={setType} />
                  ) : (
                    type
                  )}
                </Row>
                <Row icon={Flag} label="Prioritet">
                  {canManage ? (
                    <PriorityPicker
                      jobId={job.id}
                      priority={priority}
                      onPriority={setPriority}
                    />
                  ) : (
                    priorityLabels[priority] ?? priority
                  )}
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
                <Row icon={Users} label="Kunder">
                  {canManage ? (
                    <CustomerEditor
                      jobId={job.id}
                      current={linkedCustomers}
                      options={customers}
                      hasVehicle={hasVehicle}
                    />
                  ) : linkedCustomers.length > 0 ? (
                    linkedCustomers.map((c) => c.name).join(", ")
                  ) : (
                    "—"
                  )}
                </Row>
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
                {canManage || note ? (
                  <Row icon={StickyNote} label="Anteckning">
                    <EditableValue
                      editable={canManage}
                      onClick={() => setPanel("note")}
                    >
                      {note ? (
                        <span className="font-normal whitespace-pre-wrap text-ink-soft">
                          {note}
                        </span>
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          Lägg till anteckning…
                        </span>
                      )}
                    </EditableValue>
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
