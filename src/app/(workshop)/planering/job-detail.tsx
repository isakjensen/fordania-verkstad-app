"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
  StickyNote,
  CircleDot,
  Pencil,
  X,
} from "lucide-react";
import { LicensePlate } from "@/components/ui/license-plate";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldSelect } from "@/components/ui/field-select";
import {
  Sheet,
  SheetContent,
  SheetBody,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { orderTotals, formatOre } from "@/lib/pricing";
import { statusLabels, priorityLabels } from "./calendar-meta";
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
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Kombinerar datum ("YYYY-MM-DD") och tid ("HH:MM") till ett Date. */
function combine(date: string, time: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, m || 0, 0, 0);
}

/* ------------------------------------------------------------------ *
 *  Snabbåtgärder
 * ------------------------------------------------------------------ */

/**
 * Mjuk in-/utglidning för inline-editorerna (tid/anteckning). Höjden animeras
 * så att raderna nedanför flyttar sig lugnt istället för att bara poppa.
 */
const inlineReveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" as const },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
};

/** Statusväljare – dropdown som byter status direkt vid val (optimistiskt). */
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
  const [pending, setPending] = useState(false);

  function pick(next: string) {
    if (next === status) return;
    const prev = status;
    onStatus(next); // optimistiskt
    setPending(true);
    setJobStatus(jobId, next)
      .then((res) => {
        if ("error" in res) onStatus(prev);
        else router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="flex items-center gap-2">
      <FieldSelect
        value={status}
        onValueChange={pick}
        options={STATUS_ORDER.map((s) => ({
          value: s,
          label: statusLabels[s] ?? s,
        }))}
        className="min-w-[9rem]"
      />
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

/**
 * Inline-redigering av tid direkt på Tid-raden: dag (DatePicker) + start/slut
 * (custom TimePicker). Öppnas på plats vid tidsblocket – ingen panel högst upp.
 */
function InlineTimeEditor({
  job,
  onClose,
}: {
  job: ScheduleJob;
  onClose: () => void;
}) {
  const router = useRouter();
  const startD = new Date(job.scheduledStart as Date);
  const endD = new Date(job.scheduledEnd as Date);

  const [date, setDate] = useState(isoDate(startD));
  const [start, setStart] = useState(hhmm(startD));
  const [end, setEnd] = useState(hhmm(endD));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const changed =
    date !== isoDate(startD) || start !== hhmm(startD) || end !== hhmm(endD);

  function save() {
    setError("");
    const newStart = combine(date, start);
    const newEnd = combine(date, end);
    if (newEnd.getTime() <= newStart.getTime()) {
      setError("Sluttiden måste vara efter starttiden.");
      return;
    }
    startTransition(async () => {
      const res = await moveJob(job.id, {
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
    <motion.div {...inlineReveal} className="overflow-hidden">
      <div className="mt-1 space-y-3 rounded-2xl border border-line bg-surface-muted/40 p-3 shadow-sm ring-1 ring-black/[0.02]">
        <div className="space-y-1.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Dag
          </p>
          <DatePicker value={date} onChange={setDate} size="sm" clearable={false} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Start
            </p>
            <TimePicker value={start} onChange={setStart} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Slut
            </p>
            <TimePicker value={end} onChange={setEnd} />
          </div>
        </div>
        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="success"
            size="sm"
            className="flex-1"
            disabled={pending || !changed}
            onClick={save}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Spara
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Inline-dropdown för mekaniker direkt på raden – sparar vid val (optimistiskt),
 * precis som Typ/Prioritet.
 */
function MechanicPicker({
  jobId,
  mechanics,
  value,
  onChange,
}: {
  jobId: string;
  mechanics: Mechanic[];
  value: string;
  onChange: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function pick(next: string) {
    if (next === value) return;
    const prev = value;
    onChange(next); // optimistiskt
    setPending(true);
    moveJob(jobId, {
      fromUserId: prev || undefined,
      toUserId: next || undefined,
    })
      .then((res) => {
        if ("error" in res) onChange(prev);
        else router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="flex items-center gap-2">
      <FieldSelect
        value={value}
        onValueChange={pick}
        placeholder="Välj mekaniker…"
        options={mechanics.map((m) => ({ value: m.id, label: m.name }))}
        className="min-w-[9rem]"
      />
      {pending ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

/**
 * Inline-redigering av anteckning direkt på raden – öppnas på plats vid
 * anteckningsblocket, ingen panel högst upp.
 */
function InlineNoteEditor({
  job,
  initial,
  onClose,
  onSaved,
}: {
  job: ScheduleJob;
  initial: string;
  onClose: () => void;
  onSaved: (note: string) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
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
    <motion.div {...inlineReveal} className="overflow-hidden">
      <div className="mt-1 space-y-3 rounded-2xl border border-line bg-surface-muted/40 p-3 shadow-sm ring-1 ring-black/[0.02]">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Anteckning
        </p>
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant="success"
            size="sm"
            className="flex-1"
            disabled={pending}
            onClick={save}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Spara
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Avbryt
          </Button>
        </div>
      </div>
    </motion.div>
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
  const [mechId, setMechId] = useState(job?.mechanics[0]?.userId ?? "");
  // Vilken rad som redigeras inline (bara en i taget).
  const [editingTime, setEditingTime] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  useEffect(() => {
    setStatus(job?.status ?? "planned");
    setType(job?.type ?? "");
    setPriority(job?.priority ?? "normal");
    setNote(job?.description ?? "");
    setMechId(job?.mechanics[0]?.userId ?? "");
    setEditingTime(false);
    setEditingNote(false);
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
  const hasVehicle = vehicles.length > 0;
  const canReschedule = canManage && !!job?.scheduledStart && !!job?.scheduledEnd;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md" showCloseButton={false}>
        {job ? (
          <>
            {/* Rubrik dold visuellt – behålls för skärmläsare (dialogen kräver en titel) */}
            <SheetTitle className="sr-only">{job.type}</SheetTitle>

            {/* Diskret, touchvänlig stäng-knapp som flyter i hörnet (ingen egen rad) */}
            <SheetClose className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-surface-muted text-muted-foreground transition-colors hover:bg-line-strong hover:text-ink pointer-coarse:size-9">
              <X className="size-4" />
              <span className="sr-only">Stäng</span>
            </SheetClose>

            <SheetBody className="space-y-4">
              {/* Detaljer */}
              <div className="divide-y divide-line border-t border-line">
                <Row icon={Clock} label="Tid">
                  {!editingTime ? (
                    <EditableValue
                      editable={canReschedule}
                      onClick={() => setEditingTime(true)}
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
                  ) : null}
                  <AnimatePresence initial={false}>
                    {editingTime && canReschedule ? (
                      <InlineTimeEditor
                        key="time-edit"
                        job={job}
                        onClose={() => setEditingTime(false)}
                      />
                    ) : null}
                  </AnimatePresence>
                </Row>
                <Row icon={CircleDot} label="Status">
                  <StatusPicker
                    jobId={job.id}
                    status={status}
                    onStatus={setStatus}
                  />
                </Row>
                <Row icon={UserIcon} label="Mekaniker">
                  {canManage ? (
                    <MechanicPicker
                      jobId={job.id}
                      mechanics={mechanics}
                      value={mechId}
                      onChange={setMechId}
                    />
                  ) : jobMechanics.length > 0 ? (
                    jobMechanics.map((m) => m.name).join(", ")
                  ) : (
                    "Ej tilldelad"
                  )}
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
                    {!editingNote ? (
                      <EditableValue
                        editable={canManage}
                        onClick={() => setEditingNote(true)}
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
                    ) : null}
                    <AnimatePresence initial={false}>
                      {editingNote && canManage ? (
                        <InlineNoteEditor
                          key="note-edit"
                          job={job}
                          initial={note}
                          onClose={() => setEditingNote(false)}
                          onSaved={setNote}
                        />
                      ) : null}
                    </AnimatePresence>
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
