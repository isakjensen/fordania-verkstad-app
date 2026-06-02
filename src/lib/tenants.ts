/**
 * Multi-tenant-data för Fordania Verkstad.
 *
 * En **tenant** är ett kundföretag (en biluthyrning/bussbolag) som använder
 * Fordania Verkstad. Varje tenant har sina egna användare, fordon och jobb.
 * **Superadmin** (Fordania) hanterar alla tenants via en egen vy.
 *
 * All data är statisk mockdata för att bygga upp designen.
 */

export type TenantStatus = "active" | "trial" | "paused" | "invited";
export type TenantPlan = "Bas" | "Plus" | "Enterprise";
export type UserRole =
  | "Ägare"
  | "Verkstadschef"
  | "Mekaniker"
  | "Reception"
  | "Läsbehörig";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  initials: string;
  /** Sökväg till företagets logotyp (om sådan finns) */
  logo?: string;
  city: string;
  status: TenantStatus;
  plan: TenantPlan;
  users: number;
  vehicles: number;
  mechanics: number;
  /** Månadsintäkt i SEK */
  mrr: number;
  /** Datum då tenanten skapades (ISO) */
  createdAt: string;
  /** Senaste aktivitet, människovänlig text */
  lastActive: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  tenantId: string;
  status: "active" | "invited" | "inactive";
  lastSeen: string;
}

export const tenants: Tenant[] = [
  {
    id: "t1",
    name: "Eriks Biluthyrning",
    slug: "eriks-biluthyrning",
    initials: "EB",
    logo: "/tenants/eriks-biluthyrning.png",
    city: "Göteborg",
    status: "active",
    plan: "Enterprise",
    users: 18,
    vehicles: 142,
    mechanics: 6,
    mrr: 7900,
    createdAt: "2024-03-12",
    lastActive: "2 min sedan",
  },
  {
    id: "t2",
    name: "Björksäter Travel",
    slug: "bjorksater-travel",
    initials: "BT",
    logo: "/tenants/bjorksater-travel.png",
    city: "Stockholm",
    status: "active",
    plan: "Plus",
    users: 11,
    vehicles: 64,
    mechanics: 4,
    mrr: 3900,
    createdAt: "2024-06-01",
    lastActive: "12 min sedan",
  },
  {
    id: "t3",
    name: "Tyresö Kommun",
    slug: "tyreso-kommun",
    initials: "TK",
    logo: "/tenants/tyreso-kommun.png",
    city: "Tyresö",
    status: "active",
    plan: "Enterprise",
    users: 24,
    vehicles: 210,
    mechanics: 9,
    mrr: 9900,
    createdAt: "2023-11-20",
    lastActive: "1 timme sedan",
  },
];

export const platformUsers: PlatformUser[] = [
  {
    id: "u1",
    name: "Philip",
    email: "philip@fordania.se",
    initials: "P",
    role: "Verkstadschef",
    tenantId: "t1",
    status: "active",
    lastSeen: "Online",
  },
  {
    id: "u2",
    name: "Johan Sandberg",
    email: "johan@eriksbil.se",
    initials: "JS",
    role: "Verkstadschef",
    tenantId: "t1",
    status: "active",
    lastSeen: "5 min sedan",
  },
  {
    id: "u3",
    name: "Amir Haddad",
    email: "amir@eriksbil.se",
    initials: "AH",
    role: "Mekaniker",
    tenantId: "t1",
    status: "active",
    lastSeen: "20 min sedan",
  },
  {
    id: "u4",
    name: "Petra Lund",
    email: "petra@bjorksater.se",
    initials: "PL",
    role: "Mekaniker",
    tenantId: "t2",
    status: "active",
    lastSeen: "1 timme sedan",
  },
  {
    id: "u5",
    name: "Sara Öberg",
    email: "sara@tyreso.se",
    initials: "SÖ",
    role: "Reception",
    tenantId: "t3",
    status: "invited",
    lastSeen: "Ej inloggad",
  },
];

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
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
};

export const planMeta: Record<TenantPlan, string> = {
  Bas: "bg-slate-100 text-slate-600",
  Plus: "bg-brand-50 text-brand-700",
  Enterprise: "bg-violet-100 text-violet-700",
};

/** Den tenant som den inloggade användaren just nu arbetar i. */
export const currentTenant = tenants[0];

/** Härledda nyckeltal till superadmin-översikten. */
export const platformStats = {
  totalTenants: tenants.length,
  activeTenants: tenants.filter((t) => t.status === "active").length,
  trialTenants: tenants.filter((t) => t.status === "trial").length,
  totalUsers: tenants.reduce((sum, t) => sum + t.users, 0),
  totalVehicles: tenants.reduce((sum, t) => sum + t.vehicles, 0),
  mrr: tenants.reduce((sum, t) => sum + t.mrr, 0),
};
