import { Gauge, User, ClipboardList, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { LicensePlate } from "@/components/ui/license-plate";
import { FleetTag } from "@/components/ui/fleet-tag";
import { ScanAgainButton } from "./scan-again-button";
import type { ScanVehicle } from "@/lib/data/scan";

const statusLabels: Record<string, string> = {
  planned: "Planerad",
  in_progress: "Pågår",
  waiting_parts: "Väntar på delar",
  done: "Klar",
  delayed: "Försenad",
};

const statusStyles: Record<string, string> = {
  planned: "bg-surface text-muted-foreground ring-1 ring-inset ring-line-strong",
  in_progress: "bg-surface text-brand-700 ring-1 ring-inset ring-brand-200",
  waiting_parts: "bg-surface text-warning ring-1 ring-inset ring-warning/35",
  done: "bg-surface text-success ring-1 ring-inset ring-success/35",
  delayed: "bg-surface text-danger ring-1 ring-inset ring-danger/35",
};

const priorityLabels: Record<string, string> = {
  low: "Låg",
  normal: "Normal",
  high: "Hög",
};

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ScanResult({ vehicle }: { vehicle: ScanVehicle }) {
  const title =
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Okänt fordon";
  const odo = vehicle.odometer[0]?.value ?? null;
  const customer = vehicle.customers[0]?.customer ?? null;
  const jobs = vehicle.jobs;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-4">
      <ScanAgainButton />

      {/* Fordonshuvud */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <LicensePlate value={vehicle.regNo} size="lg" />
          <FleetTag internal={vehicle.customers.length === 0} />
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {vehicle.year ? (
          <p className="text-sm text-muted-foreground">Årsmodell {vehicle.year}</p>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-3">
          {odo !== null ? (
            <Fact icon={Gauge} label="Mätarställning">
              {odo.toLocaleString("sv-SE")} km
            </Fact>
          ) : null}
          {customer ? (
            <Fact icon={User} label="Kund">
              {customer.name}
            </Fact>
          ) : null}
          {vehicle.fieldValues
            .filter((f) => f.value)
            .map((f) => (
              <Fact key={f.id} label={f.definition.label}>
                {f.value}
              </Fact>
            ))}
        </dl>
      </div>

      {/* Arbetsordrar */}
      <div className="mb-8 mt-5">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList className="size-4.5 text-muted-foreground" />
          <h2 className="text-[0.8rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Arbetsordrar
          </h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-soft tabular-nums">
            {jobs.length}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-10 text-center">
            <Wrench className="size-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Inga arbetsordrar på den här bilen.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-bold text-ink">{job.type}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      statusStyles[job.status] ?? "bg-surface-muted text-ink-soft",
                    )}
                  >
                    {statusLabels[job.status] ?? job.status}
                  </span>
                </div>

                {job.description ? (
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {job.description}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {job.scheduledStart ? (
                    <span>{dateFmt.format(job.scheduledStart)}</span>
                  ) : null}
                  {job.assignedUser?.name ? (
                    <span>{job.assignedUser.name}</span>
                  ) : null}
                  {job.priority && job.priority !== "normal" ? (
                    <span>Prioritet: {priorityLabels[job.priority] ?? job.priority}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Gauge;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}
