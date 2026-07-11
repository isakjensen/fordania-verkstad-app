import { docModel } from "@/lib/documents";
import { partTotals, formatOre } from "@/lib/pricing";
import { LicensePlate } from "@/components/ui/license-plate";
import { FleetTag } from "@/components/ui/fleet-tag";
import { PrintActions } from "./print-actions";
import type { WorkOrderDocument as WOD } from "@/lib/data/work-orders";

const statusLabels: Record<string, string> = {
  planned: "Planerad",
  in_progress: "Pågår",
  waiting_parts: "Väntar på delar",
  done: "Klar",
  delayed: "Försenad",
};
const priorityLabels: Record<string, string> = {
  low: "Låg",
  normal: "Normal",
  high: "Hög",
};

const dfLong = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dtf = new Intl.DateTimeFormat("sv-SE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function WorkOrderDocument({
  job,
  kind,
}: {
  job: WOD;
  kind: "order" | "invoice";
}) {
  const { ref, primaryVehicle, customer, totals, mechanics } = docModel(job);
  const org = job.organization;
  const workshop = org?.name ?? "Verkstaden";
  const isInvoice = kind === "invoice";
  const today = new Date();
  const termsDays = org?.paymentTermsDays ?? 30;
  const dueDate = new Date(today.getTime() + termsDays * 24 * 60 * 60 * 1000);
  const start = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const vehName = primaryVehicle
    ? [primaryVehicle.brand, primaryVehicle.model].filter(Boolean).join(" ")
    : "";

  return (
    <div className="min-h-screen bg-canvas py-6 print:bg-white print:py-0">
      <PrintActions
        jobId={job.id}
        kind={kind}
        hasCustomerEmail={Boolean(customer?.email)}
      />

      <article className="mx-auto w-full max-w-[820px] bg-surface p-8 text-ink shadow-lift ring-1 ring-line sm:p-10 print:shadow-none print:ring-0">
        {/* Sidhuvud */}
        <header className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <div className="text-[1.4rem] font-extrabold tracking-[-0.02em] text-brand-600">
              {workshop}
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {org?.address ? <div>{org.address}</div> : null}
              {org?.postalCode || org?.city ? (
                <div>{[org.postalCode, org.city].filter(Boolean).join(" ")}</div>
              ) : null}
              {org?.orgNumber ? <div>Org.nr {org.orgNumber}</div> : null}
              {org?.vatNumber ? <div>Moms {org.vatNumber}</div> : null}
              {org?.phone || org?.email ? (
                <div>{[org.phone, org.email].filter(Boolean).join(" · ")}</div>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[1.15rem] font-bold uppercase tracking-[0.08em] text-ink">
              {isInvoice ? "Faktura" : "Arbetsorder"}
            </div>
            <div className="mt-1 font-mono text-sm text-ink-soft">{ref}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {dfLong.format(today)}
            </div>
          </div>
        </header>

        {/* Parter: fordon + (faktura → kund | order → mekaniker/tid) */}
        <div className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Fordon
            </p>
            {primaryVehicle ? (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <LicensePlate value={primaryVehicle.regNo} size="md" />
                  <FleetTag
                    internal={(primaryVehicle.customers?.length ?? 0) === 0}
                  />
                </div>
                {vehName ? (
                  <div className="mt-1.5 text-sm font-semibold text-ink">
                    {vehName}
                  </div>
                ) : null}
                {primaryVehicle.chassisNumber ? (
                  <div className="text-xs text-muted-foreground">
                    Chassinr {primaryVehicle.chassisNumber}
                  </div>
                ) : null}
                {primaryVehicle.odometer?.[0] ? (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {primaryVehicle.odometer[0].value.toLocaleString("sv-SE")} km
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Inget fordon</p>
            )}
          </div>

          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {isInvoice ? "Faktureras" : "Utfört av"}
            </p>
            {isInvoice ? (
              customer ? (
                <div className="mt-2 text-sm">
                  <div className="font-semibold text-ink">{customer.name}</div>
                  {customer.address ? (
                    <div className="text-ink-soft">{customer.address}</div>
                  ) : null}
                  {customer.orgNumber ? (
                    <div className="text-xs text-muted-foreground">
                      Org.nr {customer.orgNumber}
                    </div>
                  ) : null}
                  {customer.email ? (
                    <div className="text-xs text-muted-foreground">
                      {customer.email}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-warning">
                  Ingen kund kopplad – internt fordon.
                </p>
              )
            ) : (
              <div className="mt-2 text-sm">
                <div className="font-semibold text-ink">
                  {mechanics.length ? mechanics.join(", ") : "Ej tilldelad"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {start ? dtf.format(start) : "Ej schemalagd"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arbete */}
        <div className="border-b border-line py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="font-bold text-ink">{job.type}</span>
            <span className="text-muted-foreground">
              Status: {statusLabels[job.status] ?? job.status}
            </span>
            <span className="text-muted-foreground">
              Prioritet: {priorityLabels[job.priority] ?? job.priority}
            </span>
          </div>
          {job.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">
              {job.description}
            </p>
          ) : null}
        </div>

        {/* Rader / delar */}
        <div className="py-6">
          <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {isInvoice ? "Fakturarader" : "Delar & arbete"}
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-[0.66rem] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="py-2 pr-2 text-left font-semibold">Beskrivning</th>
                <th className="py-2 px-2 text-right font-semibold">Antal</th>
                <th className="py-2 px-2 text-right font-semibold">À-pris</th>
                <th className="py-2 px-2 text-right font-semibold">Moms</th>
                <th className="py-2 pl-2 text-right font-semibold">Summa</th>
              </tr>
            </thead>
            <tbody>
              {job.parts.length > 0 ? (
                job.parts.map((p) => {
                  const t = partTotals(p);
                  return (
                    <tr key={p.id} className="border-b border-line/70">
                      <td className="py-2.5 pr-2 text-ink">{p.title}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-ink-soft">
                        {p.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-ink-soft">
                        {formatOre(p.unitPriceExclOre)}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-ink-soft">
                        {p.vatRate}%
                      </td>
                      <td className="py-2.5 pl-2 text-right font-semibold tabular-nums text-ink">
                        {formatOre(t.inclOre)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Inga rader angivna ännu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summering */}
          <div className="mt-5 flex justify-end">
            <dl className="w-full max-w-[260px] space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Netto</dt>
                <dd className="tabular-nums">{formatOre(totals.exclOre)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Moms</dt>
                <dd className="tabular-nums">{formatOre(totals.vatOre)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-line pt-2.5 text-[1.05rem] font-bold">
                <dt>{isInvoice ? "Att betala" : "Totalt"}</dt>
                <dd className="tabular-nums">{formatOre(totals.inclOre)}</dd>
              </div>
            </dl>
          </div>

          {isInvoice ? (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 rounded-xl border border-line bg-surface-muted/40 px-4 py-3 text-sm text-ink-soft">
              <span>
                <span className="font-semibold text-ink">Betalningsvillkor:</span>{" "}
                {termsDays} dagar
              </span>
              <span>
                <span className="font-semibold text-ink">Förfaller:</span>{" "}
                {dfLong.format(dueDate)}
              </span>
              {org?.bankgiro ? (
                <span>
                  <span className="font-semibold text-ink">Bankgiro:</span>{" "}
                  {org.bankgiro}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-line pt-5 text-center text-xs text-muted-foreground">
          {workshop} · {isInvoice ? "Faktura" : "Arbetsorder"} {ref} · Genererad
          via Fordania Verkstad
        </footer>
      </article>
    </div>
  );
}
