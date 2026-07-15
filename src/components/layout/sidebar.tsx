"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { TenantSwitcher } from "./tenant-switcher";
import { type NavItem, type NavGroup } from "./nav";
import type { SwitcherData } from "@/lib/data/tenant-context";

interface SidebarProps {
  /** Navigationsgrupper (verkstad eller superadmin). */
  groups: NavGroup[];
  /** Sekundära länkar längst ner (t.ex. Inställningar). */
  secondary?: NavItem[];
  /** Bas-route för aktiv-detektion ("/" för verkstad, "/superadmin" för super). */
  homeHref: string;
  /** Om satt renderas verkstadsväljaren under loggan (bara där vi vill ha den). */
  switcher?: SwitcherData;
  /** Extra länk längst ner (t.ex. "Superadmin" eller "Till verkstaden"). */
  footer?: NavItem;
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
        "group relative flex items-center rounded-lg text-[0.85rem] outline-none",
        "transition-colors duration-150 pointer-coarse:text-[0.95rem]",
        collapsed
          ? "h-9 w-9 justify-center pointer-coarse:h-11 pointer-coarse:w-11"
          : "h-9 gap-2.5 px-2.5 pointer-coarse:h-12 pointer-coarse:px-3",
        active
          ? "bg-white font-semibold text-brand-700 shadow-[0_1px_2px_rgb(15_42_67/0.08)] ring-1 ring-brand-100 dark:bg-white/[0.07] dark:shadow-none dark:ring-white/10"
          : "font-medium text-ink-soft hover:bg-white/70 hover:text-ink dark:hover:bg-white/[0.04]",
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
          active
            ? "text-brand-600"
            : "text-muted-foreground group-hover:text-ink-soft",
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
                  : "bg-white/80 text-ink-soft",
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      ) : item.badge ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand-600 ring-2 ring-white" />
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
      {children}
    </p>
  );
}

export function Sidebar({
  groups,
  secondary,
  homeHref,
  switcher,
  footer,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === homeHref ? pathname === homeHref : pathname.startsWith(href);

  const hasBottom = (secondary && secondary.length > 0) || !!footer;

  return (
    <div className="flex h-full flex-col bg-linear-to-b from-[#fff1e4] via-[#fff9f4] to-white dark:from-[#1c1813] dark:via-[#151311] dark:to-[#100f0d]">
      {/* Toppsektion med logga */}
      <div
        className={cn(
          "flex h-16 items-center justify-center border-b border-line/70",
          collapsed ? "px-2" : "px-4",
        )}
      >
        <Logo iconOnly={collapsed} />
      </div>

      {/* Aktiv tenant / byt verkstad – renderas bara där väljaren ska finnas
          (superadmin). Verkstadens meny visar den inte längre. */}
      {switcher ? (
        <div className="border-b border-line/70">
          <TenantSwitcher data={switcher} collapsed={collapsed} />
        </div>
      ) : null}

      {/* Navigation */}
      <nav
        className={cn(
          "flex flex-1 flex-col overflow-y-auto py-3",
          collapsed ? "items-center gap-1 px-2" : "gap-4 px-3",
        )}
      >
        {groups.map((group, gi) => (
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

        {/* Sekundär navigation + ev. extra länk – förankrad nederst */}
        {hasBottom ? (
          <div
            className={cn(
              "mt-auto flex flex-col gap-0.5 border-t border-line/70 pt-3",
              collapsed && "w-full items-center",
            )}
          >
            {secondary?.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
            {footer ? (
              <NavLink
                item={footer}
                active={false}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
          </div>
        ) : null}
      </nav>

      {/* Bottensektion: kollaps-knapp (endast desktop) */}
      {onToggleCollapse ? (
        <div className="border-t border-line/70 p-2.5">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden h-9 items-center rounded-lg text-[0.85rem] font-medium text-muted-foreground lg:flex",
              "transition-colors hover:bg-white/70 hover:text-ink",
              collapsed ? "w-full justify-center" : "w-full gap-2 px-2.5",
            )}
            title={collapsed ? "Expandera meny" : "Fäll ihop meny"}
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform duration-300",
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
