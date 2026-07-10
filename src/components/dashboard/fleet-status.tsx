"use client";

import { motion } from "motion/react";
import { Card, CardHeader } from "@/components/ui/card";
import type { DashboardData } from "@/lib/data/dashboard";

interface Segment {
  label: string;
  value: number;
  color: string;
  dot: string;
}

export function FleetStatus({ fleet }: { fleet: DashboardData["fleet"] }) {
  const segments: Segment[] = [
    {
      label: "Tillgängliga",
      value: fleet.available,
      color: "var(--color-success)",
      dot: "bg-success",
    },
    {
      label: "Inne i verkstad",
      value: fleet.inWorkshop,
      color: "var(--color-brand-500)",
      dot: "bg-brand-500",
    },
    {
      label: "Väntar på delar",
      value: fleet.waitingParts,
      color: "var(--color-warning)",
      dot: "bg-warning",
    },
  ];

  // Undvik division med noll om flottan är tom
  const denom = fleet.total > 0 ? fleet.total : 1;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader
        tone="brand"
        title="Fordonsstatus"
        subtitle={`${fleet.total} fordon i flottan`}
      />
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 px-5 py-6">
        {/* Stort tal – hur många som faktiskt är tillgängliga */}
        <div className="flex items-end gap-3">
          <span className="text-[3rem] font-semibold leading-[0.9] tracking-[-0.03em] text-ink tabular-nums">
            {fleet.available}
          </span>
          <span className="pb-1 text-sm leading-snug text-muted-foreground">
            av {fleet.total} fordon
            <br />
            tillgängliga just nu
          </span>
        </div>

        {/* Segmenterad stapel – ersätter donuten, samma info men lugnare */}
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface-muted">
          {segments.map((seg) =>
            seg.value > 0 ? (
              <motion.div
                key={seg.label}
                className="h-full first:rounded-l-full last:rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${(seg.value / denom) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                style={{ backgroundColor: seg.color }}
              />
            ) : null,
          )}
        </div>

        {/* Legend med antal */}
        <ul className="space-y-2.5">
          {segments.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2.5">
              <span className={`size-2.5 rounded-full ${seg.dot}`} aria-hidden />
              <span className="flex-1 text-sm text-ink-soft">{seg.label}</span>
              <span className="text-sm font-semibold text-ink tabular-nums">
                {seg.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
