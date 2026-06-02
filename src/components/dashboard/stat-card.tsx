"use client";

import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUpItem } from "./motion";

type Tone = "brand" | "success" | "warning" | "danger" | "violet";

/** Tunn accentlinje upptill – enda färgmarkören, annars monokromt. */
const accent: Record<Tone, string> = {
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  violet: "bg-violet-500",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  trend?: { value: string; up: boolean };
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  trend,
}: StatCardProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-line bg-surface",
        "p-5 transition-colors duration-200 hover:border-line-strong",
      )}
    >
      {/* Hårfin accent upptill */}
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 opacity-70",
          accent[tone],
        )}
        aria-hidden
      />

      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
          {label}
        </p>
        <Icon className="size-4 text-muted/50" strokeWidth={2} />
      </div>

      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="text-[2.25rem] font-bold leading-none tracking-tight text-ink tabular-nums">
          {value}
        </span>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trend.up ? "text-success" : "text-danger",
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>

      {hint ? <p className="mt-2.5 text-xs text-muted">{hint}</p> : null}
    </motion.div>
  );
}
