"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { TenantSwitcher } from "./tenant-switcher";
import { navGroups, secondaryNav, type NavItem } from "./nav";
import type { SwitcherData } from "@/lib/data/tenant-context";

interface SidebarProps {
  switcher: SwitcherData;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Anropas när en länk klickas – används för att stänga mobil-drawern */
  onNavigate?: () => void;
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[0.875rem] outline-none",
        "transition-colors duration-150",
        collapsed ? "h-9 w-9 justify-center" : "h-9 gap-3 px-2.5",
        active
          ? "bg-surface-muted font-semibold text-ink"
          : "font-medium text-ink-soft hover:bg-surface-muted/70 hover:text-ink",
      )}
    >
      {/* Blå accentstapel för aktiv vy */}
      {!collapsed ? (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity duration-200",
            active ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-brand-600" : "text-muted-foreground group-hover:text-ink-soft",
        )}
        strokeWidth={active ? 2.25 : 2}
      />
      {!collapsed ? (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge ? (
            <span
              className={cn(
                "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[0.7rem] font-semibold tabular-nums",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-soft",
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      ) : item.badge ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand-600 ring-2 ring-surface" />
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/55">
      {children}
    </p>
  );
}

export function Sidebar({
  switcher,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Toppsektion med logga */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-line",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Logo iconOnly={collapsed} />
      </div>

      {/* Aktiv tenant / byt verkstad */}
      <div className="border-b border-line">
        <TenantSwitcher data={switcher} collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex flex-1 flex-col overflow-y-auto py-3",
          collapsed ? "items-center gap-1 px-2" : "gap-4 px-3",
        )}
      >
        {navGroups.map((group, gi) => (
          <div
            key={group.label}
            className={cn(
              "flex flex-col gap-0.5",
              collapsed && "w-full items-center",
            )}
          >
            {!collapsed ? (
              <SectionLabel>{group.label}</SectionLabel>
            ) : gi > 0 ? (
              <div className="mx-auto mb-1 h-px w-5 bg-line" />
            ) : null}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}

        {/* Sekundär navigation – förankrad nederst */}
        <div
          className={cn(
            "mt-auto flex flex-col gap-0.5 border-t border-line pt-3",
            collapsed && "w-full items-center",
          )}
        >
          {secondaryNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
          {/* Plattformsadministration (Fordania superadmin) */}
          <Link
            href="/superadmin"
            onClick={onNavigate}
            title={collapsed ? "Superadmin" : undefined}
            className={cn(
              "group flex items-center rounded-lg text-[0.875rem] font-medium",
              "text-ink-soft transition-colors hover:bg-surface-muted/70 hover:text-ink",
              collapsed ? "h-9 w-9 justify-center" : "h-9 gap-3 px-2.5",
            )}
          >
            <ShieldCheck className="size-[18px] shrink-0 text-muted-foreground group-hover:text-ink-soft" />
            {!collapsed ? <span>Superadmin</span> : null}
          </Link>
        </div>
      </nav>

      {/* Bottensektion: kollaps-knapp (endast desktop) */}
      {onToggleCollapse ? (
        <div className="border-t border-line p-2.5">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden h-9 items-center rounded-lg text-[0.875rem] font-medium text-muted-foreground lg:flex",
              "transition-colors hover:bg-surface-muted hover:text-ink",
              collapsed ? "w-full justify-center" : "w-full gap-2 px-2.5",
            )}
            title={collapsed ? "Expandera meny" : "Fäll ihop meny"}
          >
            <ChevronsLeft
              className={cn(
                "size-5 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed ? <span>Fäll ihop</span> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
