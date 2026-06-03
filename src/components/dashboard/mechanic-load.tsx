"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import type { DashboardData } from "@/lib/data/dashboard";

function loadColor(load: number) {
  if (load >= 0.85) return "bg-danger";
  if (load >= 0.65) return "bg-warning";
  return "bg-brand-500";
}

export function MechanicLoad({
  mechanics,
}: {
  mechanics: DashboardData["mechanicLoad"];
}) {
  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Beläggning"
        subtitle="Mekanikernas kapacitet idag"
      />
      {mechanics.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Inga mekaniker i verkstaden.
        </p>
      ) : (
        <ul className="space-y-4 px-5 pt-4 pb-5">
          {mechanics.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar initials={m.initials} size="size-9 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">
                    {m.name}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-ink-soft tabular-nums">
                    {Math.round(m.load * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <motion.div
                      className={cn("h-full rounded-full", loadColor(m.load))}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.load * 100}%` }}
                      transition={{
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.1,
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {m.jobs} jobb
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
