import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ChevronRight, Wrench, Clock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveOrganizationId } from "@/lib/session";
import { getWorkOrders } from "@/lib/data/work-orders";
import { getMechanics } from "@/lib/data/schedule";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { orderTotals, formatOre } from "@/lib/pricing";
import { CreateWorkOrderButton } from "./create-work-order-button";
import { statusMeta, statusLabels } from "./meta";

export const metadata: Metadata = { title: "Arbetsordrar" };

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

const df = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ArbetsordrarPage() {
  const organizationId = await getActiveOrganizationId();
  const [orders, mechanics, vehicles] = organizationId
    ? await Promise.all([
        getWorkOrders(organizationId),
        getMechanics(organizationId),
        getVehicleOptions(organizationId),
      ])
    : [[], [], []];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Verkstad
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Arbetsordrar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Skapa och följ arbetsordrar – mekaniker, fordon och delar.
          </p>
        </div>
        {organizationId ? (
          <CreateWorkOrderButton mechanics={mechanics} vehicles={vehicles} />
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Alla arbetsordrar"
          subtitle={`${orders.length} arbetsordrar`}
        />

        {!organizationId ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Välj en verkstad för att se dess arbetsordrar.
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <ClipboardList className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">Inga arbetsordrar ännu</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Klicka på &quot;Ny arbetsorder&quot; för att skapa din första.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={`${headClass} min-w-[140px]`}>Typ</TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className={`${headClass} hidden md:table-cell`}>
                  Fordon
                </TableHead>
                <TableHead className={`${headClass} hidden lg:table-cell`}>
                  Mekaniker
                </TableHead>
                <TableHead className={`${headClass} hidden sm:table-cell`}>
                  Tid
                </TableHead>
                <TableHead className={`${headClass} text-right`}>Totalt</TableHead>
                <TableHead className={`${headClass} w-12`} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const meta = statusMeta[o.status];
                const totals = orderTotals(o.parts);
                const regNos = o.vehicles.map((v) => v.vehicle.regNo);
                const mechs = o.mechanics.map((m) => m.user.name);
                return (
                  <TableRow key={o.id} className="group">
                    <TableCell className="px-4 py-3">
                      <Link
                        href={`/arbetsordrar/${o.id}`}
                        className="flex items-center gap-2 font-semibold text-ink hover:text-brand-600"
                      >
                        <Wrench className="size-4 text-muted-foreground" />
                        {o.type}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta?.badge ?? ""}`}
                      >
                        <span className={`size-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
                        {statusLabels[o.status] ?? o.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-ink-soft md:table-cell">
                      {regNos.length ? regNos.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-ink-soft lg:table-cell">
                      {mechs.length ? mechs.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {o.scheduledStart ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {df.format(new Date(o.scheduledStart))}
                        </span>
                      ) : (
                        "Ej schemalagd"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-semibold text-ink tabular-nums">
                      {o.parts.length ? formatOre(totals.inclOre) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Link
                        href={`/arbetsordrar/${o.id}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink"
                        aria-label={`Öppna ${o.type}`}
                      >
                        <ChevronRight className="size-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
