import {
  Building2,
  Users,
  CreditCard,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export interface SuperNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SuperNavGroup {
  label: string;
  items: SuperNavItem[];
}

export const superadminGroups: SuperNavGroup[] = [
  {
    label: "Plattform",
    items: [
      { label: "Företag", href: "/superadmin", icon: Building2 },
      { label: "Användare", href: "/superadmin/anvandare", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Fakturering", href: "/superadmin/fakturering", icon: CreditCard },
      {
        label: "Inställningar",
        href: "/superadmin/installningar",
        icon: Settings2,
      },
    ],
  },
];
