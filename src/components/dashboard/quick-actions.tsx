"use client";

import Link from "next/link";
import {
  ClipboardList,
  CalendarRange,
  Car,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  chip: string;
}

const actions: Action[] = [
  {
    label: "Ny arbetsorder",
    desc: "Skapa och planera jobb",
    href: "/arbetsordrar",
    icon: ClipboardList,
    chip: "bg-brand-50 text-brand-600",
  },
  {
    label: "Arbetskalender",
    desc: "Veckans planering",
    href: "/planering",
    icon: CalendarRange,
    chip: "bg-violet-100 text-violet-600",
  },
  {
    label: "Fordon",
    desc: "Register och historik",
    href: "/fordon",
    icon: Car,
    chip: "bg-success-soft text-success",
  },
];

/** Stora, ikon-ledda snabbåtgärder överst på översikten – tryckvänliga. */
export function QuickActions() {
  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card",
              "transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
              "pointer-coarse:gap-4 pointer-coarse:p-4",
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl pointer-coarse:size-12",
                a.chip,
              )}
            >
              <Icon className="size-5 pointer-coarse:size-6" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink pointer-coarse:text-lg">
                {a.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground pointer-coarse:text-sm">
                {a.desc}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
