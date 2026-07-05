"use client";

import { Bell, BellOff } from "lucide-react";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { UserMenu } from "./user-menu";
import type { SwitcherData } from "@/lib/data/tenant-context";

export function Topbar({ switcher }: { switcher: SwitcherData }) {
  const active =
    switcher.tenants.find((t) => t.id === switcher.activeId) ??
    switcher.tenants[0] ??
    null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-surface/80 px-3 pt-safe backdrop-blur-md sm:gap-3 sm:px-4 md:px-6">
      {/* Aktiv verkstad som kontext – endast mobil/stående (sidomenyn visar
          detta på lg+). */}
      {active ? (
        <div className="flex min-w-0 items-center gap-2 pointer-fine:lg:hidden">
          <TenantLogo tenant={active} size="sm" />
          <span className="min-w-0 max-w-[8.5rem] truncate text-sm font-bold text-ink sm:max-w-[14rem]">
            {active.name}
          </span>
        </div>
      ) : null}

      {/* Global sök */}
      <GlobalSearch />

      {/* Spacer på mobil när söket är komprimerat */}
      <div className="flex-1 sm:hidden" />

      {/* Höger: åtgärder – förankrade i högra hörnet */}
      <div className="flex items-center gap-1.5 sm:ml-auto sm:gap-2">
        {/* Notiser */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted data-popup-open:bg-surface-muted pointer-coarse:size-12"
            aria-label="Notiser"
          >
            <Bell className="size-5 pointer-coarse:size-6" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notiser</DropdownMenuLabel>
              <div className="flex flex-col items-center gap-2 px-3 py-7 text-center">
                <BellOff className="size-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Inga nya notiser just nu.
                </p>
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Användarmeny – endast desktop (iPad/mobil har den i "Mer") */}
        <div className="mx-1 hidden h-7 w-px bg-line pointer-fine:lg:block" />
        <div className="hidden pointer-fine:lg:block">
          <UserMenu subtitle="Verkstad" />
        </div>
      </div>
    </header>
  );
}
