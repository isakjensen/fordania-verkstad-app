"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Wrench, Clock, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors pointer-coarse:size-6",
        checked
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line bg-surface",
      )}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );
}

/** Kryssruta som glider in/ut mjukt (utan att rycka i övrigt innehåll). */
function AnimatedCheckbox({
  show,
  checked,
}: {
  show: boolean;
  checked: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.span
          initial={{ width: 0, opacity: 0, marginRight: 0 }}
          animate={{ width: "auto", opacity: 1, marginRight: 12 }}
          exit={{ width: 0, opacity: 0, marginRight: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex shrink-0 items-center overflow-hidden"
        >
          <Checkbox checked={checked} />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

/** Mobil/iPad-stående touch-kort + desktop-tabell för en lista av ordrar. */
export function OrderRows({
  orders,
  showMechanic,
  selectMode = false,
  selected,
  onToggle,
}: {
  orders: WorkOrderListItem[];
  showMechanic: boolean;
  selectMode?: boolean;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  const isSel = (id: string) => selected?.has(id) ?? false;
  const handleClick = (e: React.MouseEvent, id: string) => {
    if (selectMode) {
      e.preventDefault();
      onToggle?.(id);
    }
  };

  return (
    <>
      {/* Mobil / iPad-stående: touch-kort */}
      <ul className="divide-y divide-line lg:hidden">
        {orders.map((o) => {
          const meta = statusMeta[o.status];
          const totals = orderTotals(o.parts);
          const regNos = o.vehicles.map((v) => v.vehicle.regNo);
          const mechs = o.mechanics.map((m) => m.user.name);
          const sel = isSel(o.id);
          return (
            <li key={o.id}>
              <Link
                href={`/arbetsordrar/${o.id}`}
                onClick={(e) => handleClick(e, o.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 transition-colors active:bg-surface-muted",
                  selectMode && sel && "bg-brand-50",
                )}
              >
                <AnimatedCheckbox show={selectMode} checked={sel} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
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
            const sel = isSel(o.id);
            return (
              <TableRow
                key={o.id}
                className={cn(
                  "group transition-colors",
                  selectMode && "cursor-pointer",
                  sel && "bg-brand-50",
                )}
                onClick={selectMode ? () => onToggle?.(o.id) : undefined}
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center">
                    <AnimatedCheckbox show={selectMode} checked={sel} />
                    <Link
                      href={`/arbetsordrar/${o.id}`}
                      onClick={(e) => handleClick(e, o.id)}
                      className="flex items-center gap-2 font-semibold text-ink hover:text-brand-600"
                    >
                      <Wrench className="size-4 text-muted-foreground" />
                      {o.type}
                    </Link>
                  </div>
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
                  {selectMode ? null : (
                    <Link
                      href={`/arbetsordrar/${o.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
                      aria-label={`Öppna ${o.type}`}
                    >
                      <ChevronRight className="size-5" />
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
