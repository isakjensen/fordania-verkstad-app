"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import { superadminNav } from "./nav";
import { SuperBottomNav } from "./super-bottom-nav";

function Sidebar() {
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

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-slate-500">
          Plattform
        </p>
        {superadminNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
                  active ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200",
                )}
                strokeWidth={active ? 2.25 : 2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-auto border-t border-white/10 pt-3">
          <Link
            href="/"
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
  return (
    <div className="flex min-h-svh bg-canvas">
      {/* Sidomeny – endast desktop (mus). På touch används flikfältet. */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 pointer-fine:lg:block">
        <Sidebar />
      </aside>

      {/* Innehållskolumn */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 pt-safe backdrop-blur-md md:px-6">
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
