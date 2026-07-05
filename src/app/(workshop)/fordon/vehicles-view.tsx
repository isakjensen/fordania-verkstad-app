"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Gauge, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { VehicleListItem } from "@/lib/data/vehicles";
import { deleteVehicles } from "./actions";

const nf = new Intl.NumberFormat("sv-SE");

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

/** Namn + ev. årsmodell i samma kolumn, t.ex. "BMW M3, 2023". */
function vehicleLabel(v: VehicleListItem): string {
  const name = [v.brand, v.model].filter(Boolean).join(" ");
  const year = v.fieldValues.find((fv) =>
    /år(smod|tal)?/i.test(fv.definition.label),
  )?.value;
  return [name, year?.trim()].filter(Boolean).join(", ");
}

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

export function VehiclesView({
  vehicles,
  action,
}: {
  vehicles: VehicleListItem[];
  action?: ReactNode;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const count = selected.size;
  const allSelected = vehicles.length > 0 && count === vehicles.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(vehicles.map((v) => v.id)));
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
    setError("");
  }

  function onDelete() {
    setError("");
    startTransition(async () => {
      const res = await deleteVehicles([...selected]);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setConfirmOpen(false);
      exitSelect();
      router.refresh();
    });
  }

  return (
    <>
      {/* Kortets huvud – cross-fade mellan normalt läge och markeringsläge.
          Båda lägena ligger i samma grid-cell så höjden alltid blir den
          högsta av dem → kortet byter aldrig höjd (ingen hoppande layout).
          På mobil staplas titel och knappar; sida vid sida från sm och upp. */}
      <div className="grid border-b border-line">
        <div
          className={cn(
            "col-start-1 row-start-1 flex flex-col gap-3 px-5 py-4 transition-opacity duration-200",
            "sm:flex-row sm:items-center sm:justify-between",
            selectMode && "pointer-events-none opacity-0",
          )}
        >
          <div className="min-w-0">
            <h3 className="text-[0.95rem] font-bold tracking-tight text-ink">
              Fordon
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {vehicles.length} fordon i registret
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Fragment key="action">{action}</Fragment>
            <Button
              key="select"
              variant="outline"
              size="md"
              onClick={() => setSelectMode(true)}
            >
              Välj
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-between gap-3 px-5 py-4 transition-opacity duration-200",
            selectMode ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!selectMode}
        >
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2.5 text-left"
          >
            <Checkbox checked={allSelected} />
            <span className="text-[0.95rem] font-bold tracking-tight text-ink">
              {count > 0 ? `${count} valda` : "Markera fordon"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={exitSelect}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={count === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              Ta bort{count > 0 ? ` (${count})` : ""}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobil / iPad-stående: touch-kort */}
      <ul className="divide-y divide-line lg:hidden">
        {vehicles.map((v) => {
          const latest = v.odometer[0];
          const label = vehicleLabel(v);
          const isSel = selected.has(v.id);
          return (
            <li key={v.id}>
              <Link
                href={`/fordon/${v.id}`}
                onClick={(e) => {
                  if (selectMode) {
                    e.preventDefault();
                    toggle(v.id);
                  }
                }}
                className={cn(
                  "flex items-center px-4 py-3.5 transition-colors active:bg-surface-muted",
                  selectMode && isSel && "bg-brand-50",
                )}
              >
                <AnimatedCheckbox show={selectMode} checked={isSel} />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <LicensePlate value={v.regNo} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] font-semibold text-ink">
                      {label || "Okänt fordon"}
                    </span>
                    {latest ? (
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                        <Gauge className="size-3.5" />
                        {nf.format(latest.value)} km
                      </span>
                    ) : null}
                  </span>
                  {selectMode ? null : (
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop / liggande: tabell */}
      <Table className="hidden lg:table">
        <TableHeader>
          <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
            <TableHead className={`${headClass} min-w-[160px]`}>Reg.nr</TableHead>
            <TableHead className={`${headClass}`}>Fordon</TableHead>
            <TableHead className={`${headClass} hidden lg:table-cell`}>
              Chassinummer
            </TableHead>
            <TableHead className={`${headClass} hidden text-right sm:table-cell`}>
              Mätarställning
            </TableHead>
            <TableHead className={`${headClass} w-12`} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => {
            const latest = v.odometer[0];
            const label = vehicleLabel(v);
            const isSel = selected.has(v.id);
            return (
              <TableRow
                key={v.id}
                className={cn(
                  "group transition-colors",
                  selectMode && "cursor-pointer",
                  isSel && "bg-brand-50",
                )}
                onClick={selectMode ? () => toggle(v.id) : undefined}
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center">
                    <AnimatedCheckbox show={selectMode} checked={isSel} />
                    <Link
                      href={`/fordon/${v.id}`}
                      onClick={(e) => {
                        if (selectMode) {
                          e.preventDefault();
                          toggle(v.id);
                        }
                      }}
                      className="inline-flex"
                    >
                      <LicensePlate value={v.regNo} />
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {label ? (
                    <span className="text-sm font-medium text-ink">{label}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums lg:table-cell">
                  {v.chassisNumber ?? "—"}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-right sm:table-cell">
                  {latest ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink tabular-nums">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      {nf.format(latest.value)} km
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {selectMode ? null : (
                    <Link
                      href={`/fordon/${v.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
                      aria-label={`Öppna ${v.regNo}`}
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

      {/* Bekräfta borttagning */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ta bort {count} fordon?</DialogTitle>
            <DialogDescription>
              {count === 1 ? "Fordonet" : "Fordonen"} döljs från registret men
              raderas inte helt. Du kan återställa {count === 1 ? "det" : "dem"}{" "}
              under &quot;Borttagna&quot; på fordonssidan.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Avbryt
                </Button>
              }
            />
            <Button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
