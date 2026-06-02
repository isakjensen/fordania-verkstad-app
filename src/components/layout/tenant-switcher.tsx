"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { tenants, currentTenant } from "@/lib/tenants";

export function TenantSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-white">
          {currentTenant.initials}
        </span>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:bg-surface-muted data-popup-open:border-brand-300 data-popup-open:bg-surface-muted">
          <TenantLogo tenant={currentTenant} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {currentTenant.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {currentTenant.plan} · {currentTenant.city}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={6} className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/60">
              Byt verkstad
            </DropdownMenuLabel>
            {tenants.map((t) => (
              <DropdownMenuItem key={t.id} className="gap-2.5 py-2">
                <TenantLogo tenant={t} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {t.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.city}
                  </span>
                </span>
                {t.id === currentTenant.id ? (
                  <Check className="size-4 shrink-0 text-brand-600" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
