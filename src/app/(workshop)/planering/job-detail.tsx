"use client";

import {
  Car,
  User as UserIcon,
  Wrench,
  Flag,
  Clock,
  AlignLeft,
  Users,
} from "lucide-react";
import { Receipt } from "lucide-react";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ScheduleJob } from "@/lib/data/schedule";
import { orderTotals, formatOre } from "@/lib/pricing";
import { statusMeta, statusLabels, priorityLabels } from "./calendar-meta";

const dtf = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const tf = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});

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

export function JobDetail({
  job,
  open,
  onOpenChange,
}: {
  job: ScheduleJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const vehicles = job?.vehicles.map((jv) => jv.vehicle) ?? [];
  const mechanics = job?.mechanics.map((jm) => jm.user) ?? [];
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

            <SheetBody className="divide-y divide-line">
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
              <Row
                icon={UserIcon}
                label={mechanics.length > 1 ? "Mekaniker" : "Mekaniker"}
              >
                {mechanics.length > 0
                  ? mechanics.map((m) => m.name).join(", ")
                  : "Ej tilldelad"}
              </Row>
              <Row icon={Wrench} label="Typ">
                {job.type}
              </Row>
              <Row icon={Flag} label="Prioritet">
                {priorityLabels[job.priority] ?? job.priority}
              </Row>
              <Row icon={Car} label={vehicles.length > 1 ? "Fordon" : "Fordon"}>
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
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
