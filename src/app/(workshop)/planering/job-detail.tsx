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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {job ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <LicensePlate
                  value={job.vehicle?.regNo ?? "—"}
                  className="shrink-0"
                />
                <div>
                  <SheetTitle>{job.type}</SheetTitle>
                  <SheetDescription>
                    {job.vehicle
                      ? [job.vehicle.brand, job.vehicle.model]
                          .filter(Boolean)
                          .join(" ") || job.vehicle.regNo
                      : "Inget fordon"}
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
              <Row icon={UserIcon} label="Mekaniker">
                {job.assignedUser?.name ?? "Ej tilldelad"}
              </Row>
              <Row icon={Wrench} label="Typ">
                {job.type}
              </Row>
              <Row icon={Flag} label="Prioritet">
                {priorityLabels[job.priority] ?? job.priority}
              </Row>
              <Row icon={Car} label="Fordon">
                {job.vehicle
                  ? `${job.vehicle.regNo}${
                      job.vehicle.brand || job.vehicle.model
                        ? ` · ${[job.vehicle.brand, job.vehicle.model].filter(Boolean).join(" ")}`
                        : ""
                    }`
                  : "—"}
              </Row>
              {job.vehicle && job.vehicle.customers.length > 0 ? (
                <Row icon={Users} label="Kunder">
                  {job.vehicle.customers.map((c) => c.customer.name).join(", ")}
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
