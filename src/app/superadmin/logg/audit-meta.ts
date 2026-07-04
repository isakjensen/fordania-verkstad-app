import {
  LogIn,
  ShieldAlert,
  ClipboardList,
  Car,
  Contact,
  Users,
  Building2,
  Settings,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Chip runt ikonen (bakgrund + text). */
  chip: string;
  /** Liten prick i filter/legend. */
  dot: string;
}

/** Utseende per loggkategori. Ljust tema (superadmin-innehållsytan). */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  auth: { label: "Inloggning", icon: LogIn, chip: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  job: { label: "Arbetsorder", icon: ClipboardList, chip: "bg-brand-100 text-brand-700", dot: "bg-brand-500" },
  vehicle: { label: "Fordon", icon: Car, chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  customer: { label: "Kund", icon: Contact, chip: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  user: { label: "Användare", icon: Users, chip: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  tenant: { label: "Företag", icon: Building2, chip: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  settings: { label: "Inställningar", icon: Settings, chip: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

export const FALLBACK_META: CategoryMeta = {
  label: "Händelse",
  icon: Activity,
  chip: "bg-slate-100 text-slate-600",
  dot: "bg-slate-400",
};

/** Vissa handlingar har eget utseende oavsett kategori (t.ex. misslyckad inloggning). */
export const ACTION_META: Record<string, CategoryMeta> = {
  "auth.login_failed": {
    label: "Misslyckad inloggning",
    icon: ShieldAlert,
    chip: "bg-danger-soft text-danger",
    dot: "bg-danger",
  },
};

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK_META;
}

/** Utseende för en loggpost – handling först, annars kategori. */
export function entryMeta(action: string, category: string): CategoryMeta {
  return ACTION_META[action] ?? CATEGORY_META[category] ?? FALLBACK_META;
}

/** Ordning + etiketter för kategori-filtret. */
export const CATEGORY_FILTER: { value: string; label: string }[] = [
  { value: "all", label: "Alla kategorier" },
  { value: "auth", label: "Inloggningar" },
  { value: "job", label: "Arbetsordrar" },
  { value: "vehicle", label: "Fordon" },
  { value: "customer", label: "Kunder" },
  { value: "user", label: "Användare" },
  { value: "tenant", label: "Företag" },
];

export const TIMEFRAME_FILTER: { value: string; label: string }[] = [
  { value: "all", label: "Hela historiken" },
  { value: "1", label: "Senaste dygnet" },
  { value: "7", label: "Senaste 7 dagarna" },
  { value: "30", label: "Senaste 30 dagarna" },
];
