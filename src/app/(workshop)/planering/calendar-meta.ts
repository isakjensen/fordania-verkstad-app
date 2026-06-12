/** Delad styling och etiketter för arbetsorderstatus i kalendern och drawern. */

export const statusMeta: Record<
  string,
  { badge: string; dot: string; box: string; accent: string; tint: string }
> = {
  planned: {
    badge: "bg-surface-muted text-muted-foreground",
    dot: "bg-slate-400",
    box: "bg-surface-muted border-line text-ink-soft",
    accent: "bg-slate-400",
    tint: "bg-surface",
  },
  in_progress: {
    badge: "bg-info-soft text-info",
    dot: "bg-info",
    box: "bg-info-soft border-info text-info",
    accent: "bg-info",
    tint: "bg-info-soft/40",
  },
  waiting_parts: {
    badge: "bg-warning-soft text-warning",
    dot: "bg-warning",
    box: "bg-warning-soft border-warning text-warning",
    accent: "bg-warning",
    tint: "bg-warning-soft/40",
  },
  done: {
    badge: "bg-success-soft text-success",
    dot: "bg-success",
    box: "bg-success-soft border-success text-success",
    accent: "bg-success",
    tint: "bg-surface",
  },
  delayed: {
    badge: "bg-danger-soft text-danger",
    dot: "bg-danger",
    box: "bg-danger-soft border-danger text-danger",
    accent: "bg-danger",
    tint: "bg-danger-soft/40",
  },
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
