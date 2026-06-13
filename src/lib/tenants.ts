/**
 * Delade typer och etiketter för företag (tenants) i superadmin-vyn.
 * Faktisk data hämtas från databasen via `@/lib/data/platform`.
 */

export type TenantStatus = "active" | "trial" | "paused" | "invited";

/** Minimal företagsform för delade UI-komponenter (t.ex. TenantLogo). */
export interface Tenant {
  name: string;
  initials: string;
}

export interface TenantStatusMeta {
  label: string;
  className: string;
  dot: string;
}

export const tenantStatusMeta: Record<TenantStatus, TenantStatusMeta> = {
  active: {
    label: "Aktiv",
    className: "bg-success-soft text-success",
    dot: "bg-success",
  },
  trial: {
    label: "Testperiod",
    className: "bg-info-soft text-info",
    dot: "bg-info",
  },
  paused: {
    label: "Pausad",
    className: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  invited: {
    label: "Inbjuden",
    className: "bg-surface-muted text-muted-foreground",
    dot: "bg-slate-400",
  },
};
