"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUpItem } from "./motion";

type Tone = "brand" | "success" | "warning" | "danger" | "violet";

/* Nordisk Precision: monokromt som grund. Ikonen är dämpad, siffran är i
 * bläck – tonfärgen visas bara när något faktiskt kräver uppmärksamhet
 * (emphasize), så det som är viktigt läses på ett ögonkast. */
const toneColor: Record<Tone, string> = {
  brand: "text-brand-600",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  violet: "text-violet-500",
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  /** Färga siffran i tonfärgen (t.ex. röd när något faktiskt kräver åtgärd). */
  emphasize?: boolean;
  /** Gör hela kortet till en genväg. */
  href?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  emphasize,
  href,
}: StatCardProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      className={cn(
        "group relative rounded-xl border border-line bg-surface p-5 sm:p-6",
        "transition-colors duration-200",
        href && "hover:border-line-strong",
      )}
    >
      {href ? (
        <Link
          href={href}
          aria-label={label}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none"
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <Icon
          className="size-[1.1rem] shrink-0 text-muted-foreground/70"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      <div className="mt-4 flex items-baseline">
        <span
          className={cn(
            "text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums",
            emphasize ? toneColor[tone] : "text-ink",
          )}
        >
          {value}
        </span>
      </div>

      {hint ? (
        <p className="mt-2.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </motion.div>
  );
}
