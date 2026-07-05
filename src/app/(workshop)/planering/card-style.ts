/**
 * Stil för kalenderns orderkort: en tjock statusfärgad vänsterkant + en mjuk
 * ton i samma kulör. Färgen är accent – ytorna hålls lugna ("lagom").
 *   bar  = solid färg på vänsterkanten (flush, klipps av kortets rundning)
 *   tint = mjuk bakgrundston i samma kulör
 */
export interface CardStyle {
  bar: string;
  tint: string;
}

export const cardStyle: Record<string, CardStyle> = {
  planned: { bar: "bg-slate-400", tint: "bg-surface-muted/70" },
  in_progress: { bar: "bg-info", tint: "bg-info-soft/55" },
  waiting_parts: { bar: "bg-warning", tint: "bg-warning-soft/55" },
  done: { bar: "bg-success", tint: "bg-success-soft/50" },
  delayed: { bar: "bg-danger", tint: "bg-danger-soft/50" },
};

export const cardFallback: CardStyle = {
  bar: "bg-slate-400",
  tint: "bg-surface-muted/70",
};

export function cardStyleFor(status: string): CardStyle {
  return cardStyle[status] ?? cardFallback;
}
