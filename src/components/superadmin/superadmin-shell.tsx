"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { superadminGroups } from "./nav";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/superadmin"
      ? pathname === "/superadmin"
      : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-navy text-slate-300">
      {/* Ordmärke + plattformsmärkning */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="flex flex-col leading-none">
          <span className="text-[1.2rem] font-extrabold tracking-[-0.02em] text-white">
            Fordania
          </span>
          <span className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-brand-300">
            Superadmin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        {superadminGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-slate-500">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[0.875rem] transition-colors",
                    active
                      ? "bg-white/10 font-semibold text-white"
                      : "font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400 transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0 transition-colors",
                      active
                        ? "text-brand-300"
                        : "text-slate-400 group-hover:text-slate-200",
                    )}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Tillbaka till verkstadsappen */}
        <div className="mt-auto border-t border-white/10 pt-3">
          <Link
            href="/"
            onClick={onNavigate}
            className="group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[0.875rem] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <ArrowLeft className="size-[18px] shrink-0 text-slate-400 group-hover:text-slate-200" />
            <span>Till verkstaden</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-svh bg-canvas">
      {/* Desktop-meny */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Innehållskolumn */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Öppna meny"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
              <ShieldCheck className="size-3.5 text-brand-300" />
              Plattform
            </span>
            <span className="hidden text-sm text-muted sm:inline">
              Fordania superadmin
            </span>
          </div>
          <div className="flex-1" />
          <button className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-100">
            <Avatar initials="P" size="size-9" />
            <span className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-sm font-semibold text-ink">Philip</span>
              <span className="text-xs text-muted">Plattformsägare</span>
            </span>
          </button>
        </header>
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobil off-canvas-meny */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-[270px] max-w-[85vw] shadow-lift lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <SidebarContent onNavigate={closeMobile} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
