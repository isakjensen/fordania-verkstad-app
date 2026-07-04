"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { PageTransition } from "./page-transition";
import type { SwitcherData } from "@/lib/data/tenant-context";

const COLLAPSE_KEY = "fv-sidebar-collapsed";

export function AppShell({
  children,
  switcher,
}: {
  children: React.ReactNode;
  switcher: SwitcherData;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Läs in sparat kollaps-läge efter mount (undviker hydration-mismatch)
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
    <div className="flex h-svh overflow-hidden bg-canvas">
      {/* Sidomeny – endast på desktop (mus/fine pointer + bredd). På iPad
          (touch) och mobil används i stället flikfältet längst ner, oavsett
          om iPaden hålls i stående eller liggande läge. */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 border-r border-line",
          "transition-[width] duration-300 ease-out pointer-fine:lg:block",
          collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <Sidebar
          switcher={switcher}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Innehållskolumn */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar switcher={switcher} />
        <main className="min-h-0 flex-1 overflow-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Flikfält – iPad-stående / mobil */}
      <BottomNav switcher={switcher} />
    </div>
  );
}
