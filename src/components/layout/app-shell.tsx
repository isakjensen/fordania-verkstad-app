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
      {/* Sidomeny – endast liggande iPad / desktop (lg+). På iPad-stående och
          mobil ersätts den av flikfältet längst ner. */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 border-r border-line",
          "transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-20" : "w-64",
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
