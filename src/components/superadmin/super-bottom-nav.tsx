"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { superadminNav } from "./nav";

/** Flikfält för superadmin på touch (mobil / iPad). Sidomenyn visas bara på
 *  desktop, precis som i verkstadsappen. */
export function SuperBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/superadmin"
      ? pathname === "/superadmin"
      : pathname.startsWith(href);

  const tabs: { label: string; href: string; icon: LucideIcon }[] = [
    ...superadminNav,
    { label: "Verkstad", href: "/", icon: Store },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pl-safe pr-safe pb-safe backdrop-blur-xl pointer-fine:lg:hidden"
      aria-label="Superadmin-navigation"
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {tabs.map((tab) => {
          const active = tab.href !== "/" && isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 select-none flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.66rem] font-semibold transition-colors",
                active
                  ? "text-brand-600"
                  : "text-muted-foreground active:bg-surface-muted",
              )}
            >
              <Icon
                className={cn("size-6 transition-transform", active && "scale-105")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
