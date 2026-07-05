"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, Loader2, Car, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { restoreVehicle } from "./actions";

export interface RemovedVehicle {
  id: string;
  regNo: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  deletedAt: Date | string | null;
}

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDeleted(value: Date | string | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function RemovedVehiclesButton({
  removed,
}: {
  removed: RemovedVehicle[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const count = removed.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return removed;
    return removed.filter((v) =>
      [v.regNo, v.brand, v.model, v.year != null ? String(v.year) : ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [removed, query]);

  function onRestore(id: string) {
    setError("");
    setRestoringId(id);
    startTransition(async () => {
      const res = await restoreVehicle(id);
      setRestoringId(null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery("");
          setError("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="md">
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Borttagna</span>
            {count > 0 ? (
              <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-line-strong px-1.5 text-xs font-bold tabular-nums text-ink-soft">
                {count}
              </span>
            ) : null}
          </Button>
        }
      />
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Borttagna fordon</DialogTitle>
          <DialogDescription>
            Borttagna fordon raderas inte helt – de ligger inaktiva och kan
            återställas. Historik (arbetsordrar, mätarställning) finns kvar.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
              <Car className="size-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">
              Inga borttagna fordon
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fordon du tar bort hamnar här tills de återställs.
            </p>
          </div>
        ) : (
          <>
            {/* Sök – gör listan hanterbar även med hundratals fordon */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök reg.nr, märke eller modell…"
                className="pl-9"
                aria-label="Sök bland borttagna fordon"
              />
            </div>

            {/* Tabell med scrollande kropp och fastnaglad rubrik */}
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-line">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-surface-muted [&_th]:bg-surface-muted hover:bg-surface-muted">
                    <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Reg.nr
                    </TableHead>
                    <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fordon
                    </TableHead>
                    <TableHead className="hidden px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                      Borttaget
                    </TableHead>
                    <TableHead className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Åtgärd
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="px-3 py-10 text-center text-sm text-muted-foreground"
                      >
                        Inga fordon matchar “{query}”.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((v) => {
                      const desc =
                        [v.brand, v.model, v.year].filter(Boolean).join(" · ") ||
                        "Uppgifter saknas";
                      const busy = pending && restoringId === v.id;
                      return (
                        <TableRow key={v.id} className="group">
                          <TableCell className="px-3 py-2">
                            <LicensePlate value={v.regNo} className="shrink-0" />
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm text-ink-soft">
                            {desc}
                          </TableCell>
                          <TableCell className="hidden px-3 py-2 text-sm tabular-nums text-muted-foreground sm:table-cell">
                            {formatDeleted(v.deletedAt)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => onRestore(v.id)}
                              disabled={pending}
                            >
                              {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RotateCcw className="size-4" />
                              )}
                              Återställ
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="shrink-0 text-xs text-muted-foreground">
              Visar {filtered.length} av {count}{" "}
              {count === 1 ? "borttaget fordon" : "borttagna fordon"}.
            </p>
          </>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Stäng
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
