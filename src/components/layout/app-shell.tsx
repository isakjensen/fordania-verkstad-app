"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { PageTransition } from "./page-transition";
import { navGroups, secondaryNav } from "./nav";
import { ScannerOverlay } from "@/components/scan/scanner-overlay";
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
  // Skanner-overlayn öppnas via ett fönster-event ("fv:open-scanner") som
  // flikfältets skanna-knapp (och "skanna igen") skickar – så den kan triggas
  // från vilken sida som helst utan att navigera.
  const [scanOpen, setScanOpen] = useState(false);

  // Läs in sparat kollaps-läge efter mount (undviker hydration-mismatch)
  useEffect(() => {
    const saved = window.localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    const open = () => setScanOpen(true);
    window.addEventListener("fv:open-scanner", open);
    return () => window.removeEventListener("fv:open-scanner", open);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <div className="flex h-[calc(100svh-var(--fv-topgap,0px))] overflow-hidden bg-canvas mt-[var(--fv-topgap,0px)] transition-[margin-top,height] duration-300 ease-out">
      {/* Sidomeny – endast på desktop (mus/fine pointer + bredd). På iPad
          (touch) och mobil används i stället flikfältet längst ner, oavsett
          om iPaden hålls i stående eller liggande läge. */}
      <aside
        className={cn(
          "sticky top-0 hidden h-full shrink-0 border-r border-line",
          "transition-[width] duration-300 ease-out pointer-fine:lg:block",
          collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <Sidebar
          groups={navGroups}
          secondary={secondaryNav}
          homeHref="/"
          footer={
            switcher.isSuperadmin
              ? { label: "Superadmin", href: "/superadmin", icon: ShieldCheck }
              : undefined
          }
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Innehållskolumn. På mobil/iPad saknas topbaren, så kolumnen bär
          själv notch-skyddet (krymper till 0 när offline-baren redan gör det). */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-safe-gap pl-safe pr-safe pointer-fine:lg:pt-0">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Flikfält – iPad-stående / mobil */}
      <BottomNav switcher={switcher} />

      {/* Skanner-overlay – öppnas ovanpå sidan man är på */}
      <ScannerOverlay open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  );
}
