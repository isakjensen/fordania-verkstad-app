"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Car,
  User as UserIcon,
  Wrench,
  Flag,
  Clock,
  Users,
  Receipt,
  Loader2,
  StickyNote,
  CircleDot,
  Pencil,
  X,
} from "lucide-react";
import { LicensePlate } from "@/components/ui/license-plate";
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
import { cn } from "@/lib/utils";
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

/** Unika kunder kopplade via orderns fordon. */
function customersOf(job: ScheduleJob | null): { id: string; name: string }[] {
  if (!job) return [];
  return [
    ...new Map(
      job.vehicles
        .flatMap((jv) => jv.vehicle.customers)
        .map((c) => [c.customer.id, c.customer]),
    ).values(),
  ];
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
 * Tid – tryck på värdet så fälls dag/start/slut fram sömlöst på plats (inga
 * boxar). Varje giltig ändring sparas automatiskt; visar tiden från lokalt
 * state så nya värden syns direkt.
 */
function TimeField({
  jobId,
  start,
  end,
  editable,
  onCommit,
}: {
  jobId: string;
  start: Date | null;
  end: Date | null;
  editable: boolean;
  onCommit: (start: Date, end: Date) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function open() {
    if (!editable || !start || !end) return;
    setDate(isoDate(start));
    setFrom(hhmm(start));
    setTo(hhmm(end));
    setError("");
    setEditing(true);
  }

  // Sparar direkt när ett fält ändras (om tiderna är giltiga).
  function persist(d: string, f: string, t: string) {
    const ns = combine(d, f);
    const ne = combine(d, t);
    if (ne.getTime() <= ns.getTime()) {
      setError("Sluttiden måste vara efter starttiden.");
      return;
    }
    setError("");
    onCommit(ns, ne); // optimistiskt – syns direkt på raden
    setSaving(true);
    moveJob(jobId, {
      scheduledStart: ns.toISOString(),
      scheduledEnd: ne.toISOString(),
    })
      .then((res) => {
        if (!("error" in res)) router.refresh();
      })
      .finally(() => setSaving(false));
  }

  if (!editing) {
    return (
      <EditableValue editable={editable && !!start && !!end} onClick={open}>
        {start && end ? (
          <>
            {dtf.format(start)} · {tf.format(start)}–{tf.format(end)}
          </>
        ) : (
          "Ej tidsatt"
        )}
      </EditableValue>
    );
  }

  return (
    <motion.div {...inlineReveal} className="overflow-hidden">
      <div className="space-y-2 pt-1">
          <DatePicker
            value={date}
            onChange={(v) => {
              setDate(v);
              persist(v, from, to);
            }}
            size="sm"
            clearable={false}
          />
          <div className="grid grid-cols-2 gap-2">
            <TimePicker
              value={from}
              onChange={(v) => {
                setFrom(v);
                persist(date, v, to);
              }}
            />
            <TimePicker
              value={to}
              onChange={(v) => {
                setTo(v);
                persist(date, from, v);
              }}
            />
          </div>
          <div className="flex min-h-5 items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {error ? (
                <span className="font-medium text-danger">{error}</span>
              ) : saving ? (
                "Sparar…"
              ) : (
                "Sparas automatiskt"
              )}
            </span>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              Klar
            </button>
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
 * Anteckning – tryck på texten och skriv direkt på plats (inga boxar/knappar).
 * Sparas när fältet lämnas; Escape ångrar. Visar värdet från lokalt state.
 */
function NoteField({
  jobId,
  value,
  editable,
  onChange,
}: {
  jobId: string;
  value: string;
  editable: boolean;
  onChange: (note: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Autofokus + markör sist när man börjar redigera.
  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  function begin() {
    if (!editable) return;
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next === value) return;
    const prev = value;
    onChange(next); // optimistiskt
    setSaving(true);
    setJobNote(jobId, next)
      .then((res) => {
        if ("error" in res) onChange(prev);
        else router.refresh();
      })
      .finally(() => setSaving(false));
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={Math.max(2, draft.split("\n").length)}
        placeholder="Skriv en anteckning…"
        className="w-full resize-none border-0 bg-transparent p-0 text-sm text-ink-soft outline-none placeholder:text-muted-foreground"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={begin}
      disabled={!editable}
      className="group/edit flex w-full items-start justify-between gap-2 text-left transition-colors enabled:hover:text-brand-700"
    >
      <span
        className={cn(
          "min-w-0 whitespace-pre-wrap",
          value ? "text-ink-soft" : "text-muted-foreground",
        )}
      >
        {value || "Lägg till anteckning…"}
      </span>
      {saving ? (
        <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : editable ? (
        <Pencil className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/edit:opacity-100" />
      ) : null}
    </button>
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
  onChange,
}: {
  jobId: string;
  current: { id: string; name: string }[];
  options: { id: string; name: string }[];
  hasVehicle: boolean;
  onChange: (next: { id: string; name: string }[]) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const currentIds = new Set(current.map((c) => c.id));
  const available = options.filter((o) => !currentIds.has(o.id));

  function add(customerId: string) {
    setError("");
    const cust = options.find((o) => o.id === customerId);
    if (!cust) return;
    const prev = current;
    onChange([...current, cust]); // optimistiskt – syns direkt i drawern
    startTransition(async () => {
      const res = await linkJobCustomer(jobId, customerId);
      if ("error" in res) {
        setError(res.error);
        onChange(prev); // återställ vid fel
        return;
      }
      router.refresh();
    });
  }

  function remove(customerId: string) {
    setError("");
    const prev = current;
    onChange(current.filter((c) => c.id !== customerId)); // optimistiskt
    startTransition(async () => {
      const res = await unlinkJobCustomer(jobId, customerId);
      if ("error" in res) {
        setError(res.error);
        onChange(prev); // återställ vid fel
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
  // Kopplade kunder hålls lokalt så tillägg/borttag syns direkt (optimistiskt).
  const [linkedCustomers, setLinkedCustomers] = useState(() => customersOf(job));
  // Tider hålls lokalt så nya värden syns direkt efter sparning.
  const [schedStart, setSchedStart] = useState<Date | null>(
    job?.scheduledStart ? new Date(job.scheduledStart) : null,
  );
  const [schedEnd, setSchedEnd] = useState<Date | null>(
    job?.scheduledEnd ? new Date(job.scheduledEnd) : null,
  );

  useEffect(() => {
    setStatus(job?.status ?? "planned");
    setType(job?.type ?? "");
    setPriority(job?.priority ?? "normal");
    setNote(job?.description ?? "");
    setMechId(job?.mechanics[0]?.userId ?? "");
    setLinkedCustomers(customersOf(job));
    setSchedStart(job?.scheduledStart ? new Date(job.scheduledStart) : null);
    setSchedEnd(job?.scheduledEnd ? new Date(job.scheduledEnd) : null);
  }, [job]);

  const vehicles = job?.vehicles.map((jv) => jv.vehicle) ?? [];
  const jobMechanics = job?.mechanics.map((jm) => jm.user) ?? [];
  const totals = job ? orderTotals(job.parts) : null;
  const hasVehicle = vehicles.length > 0;
  const canReschedule = canManage && !!job?.scheduledStart && !!job?.scheduledEnd;

  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        // Stäng inte med Escape – bara via Stäng-knappen eller klick utanför.
        if (!next && details?.reason === "escape-key") return;
        onOpenChange(next);
      }}
    >
      <SheetContent className="w-full sm:max-w-md" showCloseButton={false}>
        {job ? (
          <>
            {/* Rubrik dold visuellt – behålls för skärmläsare (dialogen kräver en titel) */}
            <SheetTitle className="sr-only">{job.type}</SheetTitle>

            <SheetBody className="space-y-4">
              {/* Detaljer */}
              <div className="divide-y divide-line">
                <Row icon={Clock} label="Tid">
                  <TimeField
                    jobId={job.id}
                    start={schedStart}
                    end={schedEnd}
                    editable={canReschedule}
                    onCommit={(s, e) => {
                      setSchedStart(s);
                      setSchedEnd(e);
                    }}
                  />
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
                      onChange={setLinkedCustomers}
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
                    <NoteField
                      jobId={job.id}
                      value={note}
                      editable={canManage}
                      onChange={setNote}
                    />
                  </Row>
                ) : null}
              </div>
            </SheetBody>

            {/* Tydlig stäng-knapp fastnaglad längst ner – funkar för alla vyer
                (touch och mus). Utöver den stänger man genom att klicka utanför. */}
            <div className="sticky bottom-0 z-10 mt-auto border-t border-line bg-surface/95 px-5 pt-3 pb-3 backdrop-blur-sm">
              <SheetClose className="flex h-12 w-full items-center justify-center rounded-xl bg-surface-muted text-sm font-semibold text-ink transition-colors hover:bg-line-strong active:bg-line-strong">
                Stäng
              </SheetClose>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
