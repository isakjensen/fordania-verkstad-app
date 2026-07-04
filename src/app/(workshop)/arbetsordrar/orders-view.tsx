"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkOrderListItem } from "@/lib/data/work-orders";
import { OrderRows } from "./order-rows";
import { statusLabels, statusMeta } from "./meta";

/** Ordning på statusflikarna – pågående jobb först, klara sist. */
const STATUS_ORDER = [
  "in_progress",
  "planned",
  "waiting_parts",
  "delayed",
  "done",
] as const;

export function OrdersView({
  orders,
  userId,
  createButton,
}: {
  orders: WorkOrderListItem[];
  userId: string | null;
  createButton?: ReactNode;
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

  return (
    <>
      {/* Kortets huvud: titel + växlare + skapa-knapp, och statusfilter */}
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex items-center gap-2">
            <div className="inline-flex gap-0.5 rounded-xl bg-surface-muted p-1">
              {scopeTabs.map((s) => {
                const active = scope === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => changeScope(s.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
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
            {createButton}
          </div>
        </div>

        {/* Statusfilter – flikar under titeln, fyller raden från vänster */}
        {scoped.length > 0 ? (
          <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
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

      {scoped.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
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
            <OrderRows orders={shown} showMechanic={scope === "all"} />
          )}
        </div>
      )}
    </>
  );
}
