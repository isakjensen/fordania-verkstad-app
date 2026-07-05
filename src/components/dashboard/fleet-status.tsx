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

const R = 42;
const CIRC = 2 * Math.PI * R;

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
  let acc = 0;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader
        tone="brand"
        title="Fordonsstatus"
        subtitle={`${fleet.total} fordon i flottan`}
      />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-5 py-5 sm:flex-row sm:items-center">
        {/* Donut */}
        <div className="relative size-36 shrink-0 lg:size-40">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="9"
            />
            {segments.map((seg) => {
              const frac = seg.value / denom;
              const len = frac * CIRC;
              const rotation = (acc / denom) * 360;
              acc += seg.value;
              if (seg.value <= 0) return null;
              return (
                <motion.circle
                  key={seg.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${len} ${CIRC}`}
                  initial={{ strokeDashoffset: len }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.15,
                  }}
                  style={{ transformOrigin: "50px 50px", rotate: rotation }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight text-ink tabular-nums">
              {fleet.readyPct}%
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              tillgängliga
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full space-y-3">
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
