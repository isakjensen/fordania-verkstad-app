import type { Metadata } from "next";
import { ClipboardCheck, Clock, Car, Gauge, AlignLeft } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { LicensePlate } from "@/components/ui/license-plate";
import { getSession, getActiveOrganizationId } from "@/lib/session";
import { getJobsForUserOnDay } from "@/lib/data/schedule";
import { statusMeta, statusLabels, priorityLabels } from "../planering/calendar-meta";

export const metadata: Metadata = { title: "Dagens uppdrag" };

const tf = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit" });
const df = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DagensUppdragPage() {
  const session = await getSession();
  const organizationId = await getActiveOrganizationId();

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);

  const jobs =
    session && organizationId
      ? await getJobsForUserOnDay(organizationId, session.user.id, from, to)
      : [];

  const done = jobs.filter((j) => j.status === "done").length;
  const ongoing = jobs.filter((j) => j.status === "in_progress").length;
  const upcoming = jobs.length - done - ongoing;

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Mekaniker"
        title="Dagens uppdrag"
        description={
          <span className="capitalize">
            {df.format(now)}
            {session ? ` · ${session.user.name}` : ""}
          </span>
        }
      />

      {/* Sammanfattning */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <SummaryStat label="Uppdrag idag" value={jobs.length} tone="brand" />
        <SummaryStat label="Pågår" value={ongoing} tone="info" />
        <SummaryStat label="Klara" value={done} tone="success" />
      </div>

      {/* Lista */}
      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Att göra"
          subtitle={
            jobs.length === 0
              ? "Inga inplanerade uppdrag"
              : `${upcoming} kvar att påbörja`
          }
        />
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <ClipboardCheck className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">Inga uppdrag idag</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {organizationId
                ? "Du har inga arbetsordrar inplanerade för dagen."
                : "Välj en verkstad för att se dina uppdrag."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {jobs.map((job) => {
              const meta = statusMeta[job.status];
              return (
                <li key={job.id} className="flex gap-4 px-5 py-4">
                  {/* Tid */}
                  <div className="w-16 shrink-0 pt-0.5">
                    <p className="flex items-center gap-1 text-sm font-semibold tabular-nums text-ink">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {job.scheduledStart
                        ? tf.format(new Date(job.scheduledStart))
                        : "—"}
                    </p>
                    {job.scheduledEnd ? (
                      <p className="ml-5 text-xs text-muted-foreground tabular-nums">
                        {tf.format(new Date(job.scheduledEnd))}
                      </p>
                    ) : null}
                  </div>

                  {/* Innehåll */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{job.type}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta?.badge ?? ""}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`}
                        />
                        {statusLabels[job.status] ?? job.status}
                      </span>
                      {job.priority === "high" ? (
                        <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                          {priorityLabels[job.priority]} prioritet
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                      {job.vehicles.length > 0 ? (
                        job.vehicles.map((jv) => (
                          <span
                            key={jv.vehicle.id}
                            className="inline-flex items-center gap-2"
                          >
                            <LicensePlate
                              value={jv.vehicle.regNo}
                              className="shrink-0"
                            />
                            <span>
                              {[jv.vehicle.brand, jv.vehicle.model]
                                .filter(Boolean)
                                .join(" ")}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Car className="size-4" /> Inget fordon
                        </span>
                      )}
                    </div>

                    {job.description ? (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <AlignLeft className="mt-0.5 size-3.5 shrink-0" />
                        {job.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "info" | "success";
}) {
  const toneClass = {
    brand: "text-brand-600",
    info: "text-info",
    success: "text-success",
  }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className={`text-2xl font-extrabold tabular-nums ${toneClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
