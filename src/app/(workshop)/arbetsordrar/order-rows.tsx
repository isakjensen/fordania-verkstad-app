import Link from "next/link";
import { ChevronRight, Wrench, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderTotals, formatOre } from "@/lib/pricing";
import type { WorkOrderListItem } from "@/lib/data/work-orders";
import { statusMeta, statusLabels } from "./meta";

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

const df = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Mobil/iPad-stående touch-kort + desktop-tabell för en lista av ordrar. */
export function OrderRows({
  orders,
  showMechanic,
}: {
  orders: WorkOrderListItem[];
  showMechanic: boolean;
}) {
  return (
    <>
      {/* Mobil / iPad-stående: touch-kort */}
      <ul className="divide-y divide-line lg:hidden">
        {orders.map((o) => {
          const meta = statusMeta[o.status];
          const totals = orderTotals(o.parts);
          const regNos = o.vehicles.map((v) => v.vehicle.regNo);
          const mechs = o.mechanics.map((m) => m.user.name);
          return (
            <li key={o.id}>
              <Link
                href={`/arbetsordrar/${o.id}`}
                className="flex flex-col gap-2 px-4 py-4 transition-colors active:bg-surface-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2 text-[0.95rem] font-bold text-ink">
                    <Wrench className="size-4 text-muted-foreground" />
                    {o.type}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta?.badge ?? ""}`}
                  >
                    <span className={`size-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
                    {statusLabels[o.status] ?? o.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span>{regNos.length ? regNos.join(", ") : "Inget fordon"}</span>
                  {o.scheduledStart ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {df.format(new Date(o.scheduledStart))}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground">
                    {mechs.length ? mechs.join(", ") : "Ej tilldelad"}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">
                    {o.parts.length ? formatOre(totals.inclOre) : ""}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop / liggande: tabell */}
      <Table className="hidden lg:table">
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-surface-muted [&_th]:bg-surface-muted hover:bg-surface-muted">
            <TableHead className={`${headClass} min-w-[140px]`}>Typ</TableHead>
            <TableHead className={headClass}>Status</TableHead>
            <TableHead className={`${headClass} hidden md:table-cell`}>
              Fordon
            </TableHead>
            {showMechanic ? (
              <TableHead className={`${headClass} hidden lg:table-cell`}>
                Mekaniker
              </TableHead>
            ) : null}
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
                {showMechanic ? (
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft lg:table-cell">
                    {mechs.length ? mechs.join(", ") : "—"}
                  </TableCell>
                ) : null}
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
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
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
    </>
  );
}
