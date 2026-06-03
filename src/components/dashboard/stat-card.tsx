"use client";

import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUpItem } from "./motion";

type Tone = "brand" | "success" | "warning" | "danger" | "violet";

/** Mjukt tonat ikon-chip per ton – bär färgmarkören, annars svalt och rent. */
const chip: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  violet: "bg-violet-100 text-violet-600",
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
        "p-4 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            chip[tone],
          )}
          aria-hidden
        >
          <Icon className="size-[1.1rem]" strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2.5">
        <span className="text-[1.9rem] font-bold leading-none tracking-tight text-ink tabular-nums">
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

      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </motion.div>
  );
}
