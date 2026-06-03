"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  User as UserIcon,
  Wrench,
  Flag,
  Clock,
  AlignLeft,
  Users,
  Receipt,
  Loader2,
  Check,
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
import type { Mechanic, ScheduleJob } from "@/lib/data/schedule";
import { orderTotals, formatOre } from "@/lib/pricing";
import { statusMeta, statusLabels, priorityLabels } from "./calendar-meta";
import { moveJob } from "./actions";

const dtf = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const tf = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});

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

/** Redigera tid + mekaniker direkt i panelen – tap-baserat, utan att dra. */
function EditSection({
  job,
  mechanics,
  onDone,
}: {
  job: ScheduleJob;
  mechanics: Mechanic[];
  onDone: () => void;
}) {
  const router = useRouter();
  const baseDate = new Date(job.scheduledStart as Date);
  const currentMech = job.mechanics[0]?.userId ?? "";

  const [start, setStart] = useState(hhmm(new Date(job.scheduledStart as Date)));
  const [end, setEnd] = useState(hhmm(new Date(job.scheduledEnd as Date)));
  const [mech, setMech] = useState(currentMech);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Synka när en annan order väljs.
  useEffect(() => {
    setStart(hhmm(new Date(job.scheduledStart as Date)));
    setEnd(hhmm(new Date(job.scheduledEnd as Date)));
    setMech(job.mechanics[0]?.userId ?? "");
    setError("");
  }, [job]);

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
      onDone();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ändra planering
      </p>
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
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        Spara ändringar
      </Button>
    </div>
  );
}

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
  const canEdit = canManage && !!job?.scheduledStart && !!job?.scheduledEnd;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {job ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <LicensePlate
                  value={primary?.regNo ?? "—"}
                  className="shrink-0"
                />
                <div>
                  <SheetTitle>{job.type}</SheetTitle>
                  <SheetDescription>
                    {primary
                      ? [primary.brand, primary.model]
                          .filter(Boolean)
                          .join(" ") || primary.regNo
                      : "Inget fordon"}
                    {vehicles.length > 1 ? ` +${vehicles.length - 1} fordon` : ""}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta[job.status]?.badge ?? ""}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${statusMeta[job.status]?.dot ?? "bg-slate-400"}`}
                  />
                  {statusLabels[job.status] ?? job.status}
                </span>
              </div>
            </SheetHeader>

            <SheetBody className="space-y-4">
              {canEdit ? (
                <EditSection
                  job={job}
                  mechanics={mechanics}
                  onDone={() => onOpenChange(false)}
                />
              ) : null}

              <div className="divide-y divide-line">
                {!canEdit ? (
                  <>
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
                  </>
                ) : job.scheduledStart ? (
                  <Row icon={Clock} label="Datum">
                    {dtf.format(new Date(job.scheduledStart))}
                  </Row>
                ) : null}
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
                          <LicensePlate value={v.regNo} className="shrink-0" />
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
                      {job.parts.length}{" "}
                      {job.parts.length === 1 ? "rad" : "rader"} · totalt{" "}
                      <span className="font-semibold text-ink">
                        {formatOre(totals.inclOre)}
                      </span>{" "}
                      inkl. moms
                    </span>
                  </Row>
                ) : null}
                {job.description ? (
                  <Row icon={AlignLeft} label="Beskrivning">
                    <span className="font-normal text-ink-soft">
                      {job.description}
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
