"use client";

import { Fragment, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  MessageSquare,
  Building2,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
import type { CustomerWithCount } from "@/lib/data/customers";
import { deleteCustomers } from "./actions";

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
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

export function CustomersView({
  customers,
  action,
}: {
  customers: CustomerWithCount[];
  action?: ReactNode;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const count = selected.size;
  const allSelected = customers.length > 0 && count === customers.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)));
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
    setError("");
  }

  function onDelete() {
    setError("");
    startTransition(async () => {
      const res = await deleteCustomers([...selected]);
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
          högsta av dem → kortet byter aldrig höjd (ingen hoppande layout). */}
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
              Kunder
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {customers.length}{" "}
              {customers.length === 1 ? "kund" : "kunder"} i registret
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
              {count > 0 ? `${count} valda` : "Markera kunder"}
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
        {customers.map((c) => {
          const isSel = selected.has(c.id);
          return (
            <li key={c.id}>
              <Link
                href={`/kunder/${c.id}`}
                onClick={(e) => {
                  if (selectMode) {
                    e.preventDefault();
                    toggle(c.id);
                  }
                }}
                className={cn(
                  "flex items-center px-4 py-3.5 transition-colors active:bg-surface-muted",
                  selectMode && isSel && "bg-brand-50",
                )}
              >
                <AnimatedCheckbox show={selectMode} checked={isSel} />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {c.type === "company" ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <Building2 className="size-5" />
                    </span>
                  ) : (
                    <Avatar initials={initialsOf(c.name)} size="size-10 text-sm" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] font-semibold text-ink">
                      {c.name}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {c.type === "company"
                        ? c.orgNumber ?? c.phone ?? "Företag"
                        : c.phone ?? c.email ?? "—"}
                    </span>
                  </span>
                  {selectMode ? null : (
                    <>
                      {c._count.comments > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageSquare className="size-3.5" />
                          {c._count.comments}
                        </span>
                      ) : null}
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
                    </>
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
            <TableHead className={`${headClass} min-w-[220px]`}>Kund</TableHead>
            <TableHead className={`${headClass} hidden md:table-cell`}>
              Person-/Org.nr
            </TableHead>
            <TableHead className={`${headClass} hidden lg:table-cell`}>
              Telefon
            </TableHead>
            <TableHead className={`${headClass} hidden lg:table-cell`}>
              E-post
            </TableHead>
            <TableHead
              className={`${headClass} hidden text-center sm:table-cell`}
            >
              Komm.
            </TableHead>
            <TableHead className={`${headClass} w-12`} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => {
            const isSel = selected.has(c.id);
            return (
              <TableRow
                key={c.id}
                className={cn(
                  "group transition-colors",
                  selectMode && "cursor-pointer",
                  isSel && "bg-brand-50",
                )}
                onClick={selectMode ? () => toggle(c.id) : undefined}
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center">
                    <AnimatedCheckbox show={selectMode} checked={isSel} />
                    <Link
                      href={`/kunder/${c.id}`}
                      onClick={(e) => {
                        if (selectMode) {
                          e.preventDefault();
                          toggle(c.id);
                        }
                      }}
                      className="flex items-center gap-3"
                    >
                      {c.type === "company" ? (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                          <Building2 className="size-4.5" />
                        </span>
                      ) : (
                        <Avatar
                          initials={initialsOf(c.name)}
                          size="size-9 text-sm"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-ink group-hover:text-brand-700">
                          {c.name}
                          {c.type === "company" ? (
                            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-700">
                              Företag
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {c.phone ?? c.email ?? "—"}
                        </p>
                      </div>
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums md:table-cell">
                  {(c.type === "company" ? c.orgNumber : c.personalNumber) ??
                    "—"}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums lg:table-cell">
                  {c.phone ?? "—"}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-sm text-ink-soft lg:table-cell">
                  {c.email ?? "—"}
                </TableCell>
                <TableCell className="hidden px-4 py-3 text-center sm:table-cell">
                  {c._count.comments > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="size-3.5" />
                      {c._count.comments}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {selectMode ? null : (
                    <Link
                      href={`/kunder/${c.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
                      aria-label={`Öppna ${c.name}`}
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
            <DialogTitle>Ta bort {count} kunder?</DialogTitle>
            <DialogDescription>
              {count === 1 ? "Kunden" : "Kunderna"} döljs från registret men
              raderas inte helt. Du kan återställa {count === 1 ? "den" : "dem"}{" "}
              under &quot;Borttagna&quot; på kundsidan.
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
