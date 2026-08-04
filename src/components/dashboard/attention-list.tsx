"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { LicensePlate } from "@/components/ui/license-plate";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/data/dashboard";

const meta: Record<string, { accent: string; label: string }> = {
  delayed: { accent: "bg-danger", label: "Försenad" },
  waiting_parts: { accent: "bg-warning", label: "Väntar på delar" },
};

/**
 * Lista över arbetsordrar som faktiskt behöver hanteras (försenade eller som
 * väntar på delar). Varje rad öppnar arbetsordern – så översikten blir ett
 * verktyg för att agera, inte bara en siffra.
 */
export function AttentionList({
  items,
}: {
  items: DashboardData["attention"];
}) {
  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader
        tone="brand"
        title="Kräver åtgärd"
        subtitle={
          items.length
            ? `${items.length} ${items.length === 1 ? "order behöver" : "ordrar behöver"} hanteras`
            : "Allt under kontroll"
        }
      />
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              Inget kräver åtgärd
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Inga försenade order eller order som väntar på delar.
            </p>
          </div>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          {items.map((j) => {
            const m = meta[j.status] ?? meta.delayed;
            return (
              <li key={j.id} className="relative">
                {/* Färgad kant i stället för en ikon i en ruta. Ikonen sa
                    samma sak som ordet "Försenad" en centimeter längre in,
                    och två varningstrianglar på rad blir bara buller. Kanten
                    ger listan samma anslag på ett ögonkast, utan dekor. */}
                <span
                  aria-hidden
                  className={cn("absolute inset-y-0 left-0 w-1", m.accent)}
                />
                <Link
                  href={`/arbetsordrar/${j.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted active:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <LicensePlate value={j.regNo ?? "—"} size="sm" />
                      <span className="truncate text-sm font-semibold text-ink">
                        {j.type}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "font-semibold",
                          j.status === "delayed" ? "text-danger" : "text-warning",
                        )}
                      >
                        {m.label}
                      </span>
                      {" · "}
                      {j.mechanicName ?? "Ej tilldelad"}
                      {" · "}
                      {j.when}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
