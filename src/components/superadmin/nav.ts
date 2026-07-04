import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface SuperNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Superadmins vyer. */
export const superadminNav: SuperNavItem[] = [
  { label: "Översikt", href: "/superadmin", icon: LayoutDashboard },
  { label: "Företag", href: "/superadmin/foretag", icon: Building2 },
  { label: "Användare", href: "/superadmin/anvandare", icon: Users },
  { label: "Systemlogg", href: "/superadmin/logg", icon: ScrollText },
];
