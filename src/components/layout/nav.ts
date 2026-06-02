import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  ClipboardCheck,
  Car,
  Users,
  Package,
  BarChart3,
  Contact,
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
      { label: "Dagens uppdrag", href: "/dagens-uppdrag", icon: ClipboardCheck },
      { label: "Arbetskalender", href: "/planering", icon: CalendarRange },
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
      { label: "Kunder", href: "/kunder", icon: Contact },
      { label: "Fordon", href: "/fordon", icon: Car },
      { label: "Användare", href: "/anvandare", icon: Users },
      { label: "Lager & delar", href: "/lager", icon: Package },
      { label: "Rapporter", href: "/rapporter", icon: BarChart3 },
    ],
  },
];

export const secondaryNav: NavItem[] = [
  { label: "Inställningar", href: "/installningar", icon: Settings },
  { label: "Hjälp", href: "/hjalp", icon: HelpCircle },
];
