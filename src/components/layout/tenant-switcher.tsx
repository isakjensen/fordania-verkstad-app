"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { setActiveTenant } from "@/lib/tenant-actions";
import type { SwitcherData } from "@/lib/data/tenant-context";

export function TenantSwitcher({
  data,
  collapsed = false,
  dark = false,
}: {
  data: SwitcherData;
  collapsed?: boolean;
  /** Mörk skena – ljusa texter och genomskinliga ytor */
  dark?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active =
    data.tenants.find((t) => t.id === data.activeId) ?? data.tenants[0] ?? null;

  function select(id: string) {
    if (id === active?.id) return;
    startTransition(async () => {
      await setActiveTenant(id);
      router.refresh();
    });
  }

  if (!active) {
    if (collapsed) return null;
    return (
      <div className="px-3 py-3">
        <p
          className={cn(
            "rounded-lg border border-dashed px-2.5 py-2 text-xs",
            dark
              ? "border-white/15 text-white/50"
              : "border-line text-muted-foreground",
          )}
        >
          Ingen verkstad
        </p>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white",
            dark ? "bg-white/10" : "bg-ink",
          )}
        >
          {active.initials}
        </span>
      </div>
    );
  }

  // Vanliga användare: bara sin egen verkstad, som statisk etikett – ingen
  // växlare, ingen "byt verkstad". Att byta/välja verkstad är ett
  // superadmin-privilegium.
  if (!data.isSuperadmin) {
    return (
      <div className="px-3 py-3">
        <div className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left">
          <TenantLogo tenant={active} size="sm" />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-sm font-semibold",
                dark ? "text-white" : "text-ink",
              )}
            >
              {active.name}
            </span>
            <span
              className={cn(
                "block truncate text-xs",
                dark ? "text-white/55" : "text-muted-foreground",
              )}
            >
              {active.city ?? "Verkstad"}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
            dark
              ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] data-popup-open:border-white/20 data-popup-open:bg-white/[0.08]"
              : "border-line bg-surface hover:bg-surface-muted data-popup-open:border-brand-300 data-popup-open:bg-surface-muted",
          )}
        >
          <TenantLogo tenant={active} size="sm" />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-sm font-semibold",
                dark ? "text-white" : "text-ink",
              )}
            >
              {active.name}
            </span>
            <span
              className={cn(
                "block truncate text-xs",
                dark ? "text-white/55" : "text-muted-foreground",
              )}
            >
              {data.isSuperadmin ? "Superadmin · " : ""}
              {active.city ?? "Verkstad"}
            </span>
          </span>
          {pending ? (
            <Loader2
              className={cn(
                "size-4 shrink-0 animate-spin",
                dark ? "text-white/50" : "text-muted-foreground",
              )}
            />
          ) : (
            <ChevronsUpDown
              className={cn(
                "size-4 shrink-0",
                dark ? "text-white/50" : "text-muted-foreground",
              )}
            />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={6} className="min-w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/60">
              {data.isSuperadmin ? "Välj verkstad (superadmin)" : "Byt verkstad"}
            </DropdownMenuLabel>
            {data.tenants.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => select(t.id)}
                className="gap-2.5 py-2"
              >
                <TenantLogo tenant={t} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {t.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.city ?? "—"}
                  </span>
                </span>
                {t.id === active.id ? (
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
