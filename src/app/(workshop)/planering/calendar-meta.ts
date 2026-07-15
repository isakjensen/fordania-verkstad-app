/** Delad styling och etiketter för arbetsorderstatus i kalendern och drawern. */

import {
  Wrench,
  Hammer,
  ClipboardCheck,
  Disc3,
  Sparkles,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";

export const statusMeta: Record<
  string,
  {
    badge: string;
    dot: string;
    box: string;
    accent: string;
    tint: string;
    /** Kalenderkort: statusfärgad vänsterkant + mjuk botten. */
    chip: string;
  }
> = {
  planned: {
    badge: "bg-surface text-muted-foreground ring-1 ring-inset ring-line-strong dark:bg-surface-muted",
    dot: "bg-slate-400",
    box: "bg-surface-muted border-line text-ink-soft",
    accent: "bg-slate-400",
    tint: "bg-surface",
    chip: "border-slate-300 bg-surface",
  },
  in_progress: {
    badge: "bg-surface text-info ring-1 ring-inset ring-info/40 dark:bg-info-soft/50",
    dot: "bg-info",
    box: "bg-info-soft border-info text-info",
    accent: "bg-info",
    tint: "bg-info-soft/40",
    chip: "border-info bg-info-soft",
  },
  waiting_parts: {
    badge: "bg-surface text-warning ring-1 ring-inset ring-warning/40 dark:bg-warning-soft/50",
    dot: "bg-warning",
    box: "bg-warning-soft border-warning text-warning",
    accent: "bg-warning",
    tint: "bg-warning-soft/40",
    chip: "border-warning bg-warning-soft",
  },
  done: {
    badge: "bg-surface text-success ring-1 ring-inset ring-success/40 dark:bg-success-soft/50",
    dot: "bg-success",
    box: "bg-success-soft border-success text-success",
    accent: "bg-success",
    tint: "bg-surface",
    chip: "border-success bg-success-soft",
  },
  delayed: {
    badge: "bg-surface text-danger ring-1 ring-inset ring-danger/40 dark:bg-danger-soft/50",
    dot: "bg-danger",
    box: "bg-danger-soft border-danger text-danger",
    accent: "bg-danger",
    tint: "bg-danger-soft/40",
    chip: "border-danger bg-danger-soft",
  },
};

/**
 * Kalenderns order-block. Ren, proffsig look: mjuk statusfärgad yta, en tunn
 * ring i samma kulör och en pillformad statusstapel längst till vänster.
 */
export const eventStyles: Record<
  string,
  { bar: string; surface: string; ring: string }
> = {
  planned: { bar: "bg-slate-400", surface: "bg-surface", ring: "ring-line" },
  in_progress: { bar: "bg-info", surface: "bg-info-soft/50", ring: "ring-info/25" },
  waiting_parts: {
    bar: "bg-warning",
    surface: "bg-warning-soft/50",
    ring: "ring-warning/25",
  },
  done: { bar: "bg-success", surface: "bg-success-soft/50", ring: "ring-success/25" },
  delayed: { bar: "bg-danger", surface: "bg-danger-soft/50", ring: "ring-danger/25" },
};

export const eventFallback = {
  bar: "bg-slate-400",
  surface: "bg-surface",
  ring: "ring-line",
};

export const statusLabels: Record<string, string> = {
  planned: "Planerad",
  in_progress: "Pågår",
  waiting_parts: "Väntar på delar",
  done: "Klar",
  delayed: "Försenad",
};

export const priorityLabels: Record<string, string> = {
  low: "Låg",
  normal: "Normal",
  high: "Hög",
};

/**
 * Färg + ikon per ordertyp. Kalenderkorten färgas efter typ (Service,
 * Reparation, …) så veckan blir lätt att skanna. Kulören hålls "lagom": den
 * bär i vänsterkanten, ikonen och en tunn ring, medan ytan är en mjuk ton.
 * Mörkt läge tonas ned via låg opacitet.
 */
export interface TypeMeta {
  icon: LucideIcon;
  /** Solid vänsterkant. */
  bar: string;
  /** Mjuk bakgrundston. */
  tint: string;
  /** Tunn ring i samma kulör. */
  ring: string;
  /** Ikonens färg. */
  iconColor: string;
}

export const typeMeta: Record<string, TypeMeta> = {
  Service: {
    icon: Wrench,
    bar: "bg-sky-500",
    tint: "bg-sky-50 dark:bg-sky-500/10",
    ring: "ring-sky-200/70 dark:ring-sky-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  Reparation: {
    icon: Hammer,
    bar: "bg-amber-500",
    tint: "bg-amber-50 dark:bg-amber-500/10",
    ring: "ring-amber-200/70 dark:ring-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  Besiktning: {
    icon: ClipboardCheck,
    bar: "bg-violet-500",
    tint: "bg-violet-50 dark:bg-violet-500/10",
    ring: "ring-violet-200/70 dark:ring-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  Däckbyte: {
    icon: Disc3,
    bar: "bg-teal-500",
    tint: "bg-teal-50 dark:bg-teal-500/10",
    ring: "ring-teal-200/70 dark:ring-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  Rekond: {
    icon: Sparkles,
    bar: "bg-emerald-500",
    tint: "bg-emerald-50 dark:bg-emerald-500/10",
    ring: "ring-emerald-200/70 dark:ring-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  Felsökning: {
    icon: ScanSearch,
    bar: "bg-rose-500",
    tint: "bg-rose-50 dark:bg-rose-500/10",
    ring: "ring-rose-200/70 dark:ring-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
};

export const typeFallback: TypeMeta = {
  icon: Wrench,
  bar: "bg-slate-400",
  tint: "bg-surface-muted/70",
  ring: "ring-line",
  iconColor: "text-muted-foreground",
};

export function typeMetaFor(type: string): TypeMeta {
  return typeMeta[type] ?? typeFallback;
}
