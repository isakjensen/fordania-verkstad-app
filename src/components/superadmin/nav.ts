import {
  LayoutDashboard,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SuperNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Superadmins vyer – tre tydliga, faktiska sektioner. */
export const superadminNav: SuperNavItem[] = [
  { label: "Översikt", href: "/superadmin", icon: LayoutDashboard },
  { label: "Företag", href: "/superadmin/foretag", icon: Building2 },
  { label: "Användare", href: "/superadmin/anvandare", icon: Users },
];
