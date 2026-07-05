/** Delad styling och etiketter för arbetsorderstatus i kalendern och drawern. */

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
    badge: "bg-surface-muted text-muted-foreground",
    dot: "bg-slate-400",
    box: "bg-surface-muted border-line text-ink-soft",
    accent: "bg-slate-400",
    tint: "bg-surface",
    chip: "border-slate-300 bg-surface",
  },
  in_progress: {
    badge: "bg-info-soft text-info",
    dot: "bg-info",
    box: "bg-info-soft border-info text-info",
    accent: "bg-info",
    tint: "bg-info-soft/40",
    chip: "border-info bg-info-soft",
  },
  waiting_parts: {
    badge: "bg-warning-soft text-warning",
    dot: "bg-warning",
    box: "bg-warning-soft border-warning text-warning",
    accent: "bg-warning",
    tint: "bg-warning-soft/40",
    chip: "border-warning bg-warning-soft",
  },
  done: {
    badge: "bg-success-soft text-success",
    dot: "bg-success",
    box: "bg-success-soft border-success text-success",
    accent: "bg-success",
    tint: "bg-surface",
    chip: "border-success bg-success-soft",
  },
  delayed: {
    badge: "bg-danger-soft text-danger",
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
