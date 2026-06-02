import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  Car,
  Users,
  Package,
  BarChart3,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Liten räknare/notis-badge i menyn */
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Navigationen grupperad i logiska sektioner för tydligare struktur. */
export const navGroups: NavGroup[] = [
  {
    label: "Verkstad",
    items: [
      { label: "Översikt", href: "/", icon: LayoutDashboard },
      { label: "Planering", href: "/planering", icon: CalendarRange },
      {
        label: "Arbetsordrar",
        href: "/arbetsordrar",
        icon: ClipboardList,
        badge: 6,
      },
    ],
  },
  {
    label: "Register",
    items: [
      { label: "Fordon", href: "/fordon", icon: Car },
      { label: "Mekaniker", href: "/mekaniker", icon: Users },
      { label: "Lager & delar", href: "/lager", icon: Package },
      { label: "Rapporter", href: "/rapporter", icon: BarChart3 },
    ],
  },
];

export const secondaryNav: NavItem[] = [
  { label: "Inställningar", href: "/installningar", icon: Settings },
  { label: "Hjälp", href: "/hjalp", icon: HelpCircle },
];
