"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { WorkOrderListItem } from "@/lib/data/work-orders";
import { OrderRows } from "./order-rows";
import { statusLabels, statusMeta } from "./meta";
import { deleteWorkOrders } from "./actions";

/** Ordning på statusflikarna – pågående jobb först, klara sist. */
const STATUS_ORDER = [
  "in_progress",
  "planned",
  "waiting_parts",
  "delayed",
  "done",
] as const;

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

export function OrdersView({
  orders,
  userId,
  createButton,
  removedButton,
}: {
  orders: WorkOrderListItem[];
  userId: string | null;
  createButton?: ReactNode;
  removedButton?: ReactNode;
}) {
  const myOrders = useMemo(
    () =>
      userId == null
        ? []
        : orders.filter((o) => o.mechanics.some((m) => m.user.id === userId)),
    [orders, userId],
  );

  // "Mina" är alltid standard; "Alla" väljs bara aktivt. Valet minns mellan
  // besök via localStorage (läses efter mount för att undvika hydration-mismatch).
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [filter, setFilter] = useState<string>("all");

  // Markeringsläge för massradering.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("fv-orders-scope");
    if (saved === "mine" || saved === "all") setScope(saved);
  }, []);

  const changeScope = useCallback((value: "mine" | "all") => {
    setScope(value);
    setFilter("all");
    localStorage.setItem("fv-orders-scope", value);
  }, []);

  const scoped = scope === "mine" ? myOrders : orders;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of scoped) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [scoped]);

  // Bara statusar som faktiskt förekommer i den valda vyn blir flikar.
  const tabs = useMemo(
    () => [
      { value: "all", label: "Alla", count: scoped.length, dot: "bg-slate-400" },
      ...STATUS_ORDER.filter((s) => counts[s]).map((s) => ({
        value: s,
        label: statusLabels[s] ?? s,
        count: counts[s],
        dot: statusMeta[s]?.dot ?? "bg-slate-400",
      })),
    ],
    [counts, scoped.length],
  );

  const shown =
    filter === "all" ? scoped : scoped.filter((o) => o.status === filter);

  const scopeTabs: { value: "mine" | "all"; label: string; count: number }[] = [
    { value: "mine", label: "Mina", count: myOrders.length },
    { value: "all", label: "Alla", count: orders.length },
  ];

  const selCount = selected.size;
  const allShownSelected =
    shown.length > 0 && shown.every((o) => selected.has(o.id));

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function toggleAll() {
    setSelected(
      allShownSelected ? new Set() : new Set(shown.map((o) => o.id)),
    );
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
    setError("");
  }

  function onDelete() {
    setError("");
    startTransition(async () => {
      const res = await deleteWorkOrders([...selected]);
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
      {/* Kortets huvud: titel + växlare + skapa-knapp, och statusfilter */}
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-ink">
              {scope === "mine" ? "Mina arbetsordrar" : "Alla arbetsordrar"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {scope === "mine"
                ? `${myOrders.length} tilldelade dig`
                : `${orders.length} i verkstaden`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Mina/Alla – full bredd och jämnt delad på mobil, kompakt på desktop */}
            <div className="inline-flex w-full gap-0.5 rounded-xl bg-surface-muted p-1 sm:w-auto">
              {scopeTabs.map((s) => {
                const active = scope === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => changeScope(s.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5",
                      active
                        ? "bg-surface text-ink shadow-sm"
                        : "text-muted-foreground hover:text-ink",
                    )}
                  >
                    {s.label}
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        active ? "text-brand-600" : "text-muted-foreground/70",
                      )}
                    >
                      {s.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Åtgärder – en jämn rad; "Ny arbetsorder" fyller ut på mobil.
                Explicita keys eftersom en villkorlig (Välj) gör React:s
                dev-nyckelkontroll aktiv för syskonen. */}
            <div className="flex items-center gap-2">
              <Fragment key="removed">{removedButton}</Fragment>
              {shown.length > 0 || selectMode ? (
                <Button
                  key="select"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectMode(true)}
                >
                  Välj
                </Button>
              ) : null}
              <div
                key="create"
                className="flex-1 sm:flex-none [&_button]:w-full sm:[&_button]:w-auto"
              >
                {createButton}
              </div>
            </div>
          </div>
        </div>

        {/* Statusfilter – dras i sidled på mobil (dold scrollbar), wrappar på desktop */}
        {scoped.length > 0 ? (
          <div className="no-scrollbar -mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 sm:flex-wrap sm:overflow-visible">
            {tabs.map((t) => {
              const active = filter === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFilter(t.value)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <span className={cn("size-2 rounded-full", t.dot)} />
                  {t.label}
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      active ? "text-brand-600" : "text-muted-foreground/60",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Markeringsrad – syns bara i markeringsläge */}
      {selectMode ? (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-muted/40 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2.5 text-left"
          >
            <Checkbox checked={allShownSelected} />
            <span className="text-sm font-semibold text-ink">
              {selCount > 0 ? `${selCount} valda` : "Markera alla"}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={exitSelect}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={selCount === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              Ta bort{selCount > 0 ? ` (${selCount})` : ""}
            </Button>
          </div>
        </div>
      ) : null}

      {scoped.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:text-ink-soft">
            <ClipboardList className="size-6" />
          </span>
          <p className="mt-4 font-semibold text-ink">
            {scope === "mine"
              ? "Inga arbetsordrar tilldelade dig"
              : "Inga arbetsordrar ännu"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {scope === "mine"
              ? "Byt till Alla för att se verkstadens övriga arbetsordrar."
              : "Klicka på Ny arbetsorder för att skapa din första."}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          {shown.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Inga arbetsordrar med den statusen.
            </p>
          ) : (
            <OrderRows
              orders={shown}
              showMechanic={scope === "all"}
              selectMode={selectMode}
              selected={selected}
              onToggle={toggle}
            />
          )}
        </div>
      )}

      {/* Bekräfta borttagning */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ta bort {selCount} arbetsordrar?</DialogTitle>
            <DialogDescription>
              {selCount === 1 ? "Arbetsordern" : "Arbetsordrarna"} döljs från
              listan och kalendern men raderas inte helt. Du kan återställa{" "}
              {selCount === 1 ? "den" : "dem"} under &quot;Borttagna&quot; på
              arbetsordersidan.
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
