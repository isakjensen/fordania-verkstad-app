"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import { superadminNav } from "./nav";
import { SuperBottomNav } from "./super-bottom-nav";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[0.85rem] outline-none",
        "h-9 gap-2.5 px-2.5 transition-colors duration-150",
        "pointer-coarse:h-12 pointer-coarse:px-3 pointer-coarse:text-[0.95rem]",
        active
          ? "bg-brand-50 font-semibold text-brand-700"
          : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink",
      )}
    >
      {/* Blå accentstapel för aktiv vy */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active
            ? "text-brand-600"
            : "text-muted-foreground group-hover:text-ink-soft",
        )}
        strokeWidth={active ? 2.25 : 2}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/superadmin"
      ? pathname === "/superadmin"
      : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Ordmärke + plattformsmärkning – samma lockup som vanliga menyn */}
      <div className="flex h-16 items-center border-b border-line px-4">
        <div className="flex flex-col leading-none">
          <span className="text-[1.2rem] font-extrabold tracking-[-0.02em] text-brand-600">
            Fordania
          </span>
          <span className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Superadmin
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/55">
            Plattform
          </p>
          {superadminNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </div>

        <div className="mt-auto border-t border-line pt-3">
          <NavLink
            href="/"
            label="Till verkstaden"
            icon={ArrowLeft}
            active={false}
          />
        </div>
      </nav>
    </div>
  );
}

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100svh-var(--fv-topgap,0px))] bg-canvas mt-[var(--fv-topgap,0px)] transition-[margin-top] duration-300 ease-out">
      {/* Sidomeny – endast desktop (mus). På touch används flikfältet. */}
      <aside className="sticky top-[var(--fv-topgap,0px)] hidden h-[calc(100svh-var(--fv-topgap,0px))] w-60 shrink-0 border-r border-line pointer-fine:lg:block">
        <Sidebar />
      </aside>

      {/* Innehållskolumn */}
      <div className="flex min-w-0 flex-1 flex-col">
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
