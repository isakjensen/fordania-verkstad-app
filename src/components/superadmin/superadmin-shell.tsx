"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { superadminNav } from "./nav";
import { SuperBottomNav } from "./super-bottom-nav";
import type { NavGroup } from "@/components/layout/nav";
import type { SwitcherData } from "@/lib/data/tenant-context";

// Samma kollaps-läge som verkstadens meny så preferensen delas.
const COLLAPSE_KEY = "fv-sidebar-collapsed";

const groups: NavGroup[] = [{ label: "Plattform", items: superadminNav }];

export function SuperAdminShell({
  children,
  switcher,
}: {
  children: React.ReactNode;
  switcher: SwitcherData;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-[calc(100svh-var(--fv-topgap,0px))] bg-canvas mt-[var(--fv-topgap,0px)] transition-[margin-top] duration-300 ease-out">
      {/* Sidomeny – exakt samma komponent/design som verkstaden (logga,
          gradient, animationer, collapse). Här bor även verkstadsväljaren. */}
      <aside
        className={cn(
          "sticky top-[var(--fv-topgap,0px)] hidden h-[calc(100svh-var(--fv-topgap,0px))] shrink-0 border-r border-line",
          "transition-[width] duration-300 ease-out pointer-fine:lg:block",
          collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <Sidebar
          groups={groups}
          homeHref="/superadmin"
          switcher={switcher}
          footer={{ label: "Till verkstaden", href: "/", icon: ArrowLeft }}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Innehållskolumn */}
      <div className="flex min-w-0 flex-1 flex-col pl-safe pr-safe">
        <header className="sticky top-[var(--fv-topgap,0px)] z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 pt-safe backdrop-blur-md md:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
            <ShieldCheck className="size-3.5 text-brand-300" />
            Plattform
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Fordania superadmin
          </span>
          <div className="flex-1" />
          <UserMenu subtitle="Plattform" />
        </header>
        <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] pointer-fine:lg:pb-0">
          {children}
        </main>
      </div>

      {/* Flikfält – touch (mobil / iPad) */}
      <SuperBottomNav />
    </div>
  );
}
