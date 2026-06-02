"use client";

import { motion } from "motion/react";
import { Card, CardHeader } from "@/components/ui/card";
import { stats } from "@/lib/data";

interface Segment {
  label: string;
  value: number;
  color: string;
  dot: string;
}

const segments: Segment[] = [
  {
    label: "Redo för uthyrning",
    value: 38,
    color: "var(--color-success)",
    dot: "bg-success",
  },
  {
    label: "Inne i verkstad",
    value: 10,
    color: "var(--color-brand-500)",
    dot: "bg-brand-500",
  },
  {
    label: "Tvätt & rekond",
    value: 4,
    color: "var(--color-warning)",
    dot: "bg-warning",
  },
];

const total = segments.reduce((sum, s) => sum + s.value, 0);
const R = 42;
const CIRC = 2 * Math.PI * R;

export function FleetStatus() {
  let acc = 0;

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Fordonsstatus"
        subtitle={`${total} fordon i flottan`}
      />
      <div className="flex flex-col items-center gap-6 px-5 pt-5 pb-5 sm:flex-row sm:items-center">
        {/* Donut */}
        <div className="relative size-40 shrink-0">
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
              const frac = seg.value / total;
              const len = frac * CIRC;
              const rotation = (acc / total) * 360;
              acc += seg.value;
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
              {Math.round((stats.fleetReady / total) * 100)}%
            </span>
            <span className="text-xs font-medium text-muted-foreground">tillgängliga</span>
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
