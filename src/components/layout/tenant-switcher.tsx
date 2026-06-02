"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TenantLogo } from "@/components/ui/tenant-logo";
import { tenants, currentTenant } from "@/lib/tenants";

export function TenantSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Stäng vid klick utanför
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-ink text-xs font-bold text-white">
          {currentTenant.initials}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative px-3 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2",
          "text-left transition-colors hover:bg-surface-muted",
          open && "border-brand-300 bg-surface-muted",
        )}
      >
        <TenantLogo tenant={currentTenant} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-muted">
            {currentTenant.plan} · {currentTenant.city}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted" />
      </button>

      {open ? (
        <div className="absolute inset-x-3 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-lift">
          <p className="px-2.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted/60">
            Byt verkstad
          </p>
          {tenants.map((t) => {
            const active = t.id === currentTenant.id;
            return (
              <button
                key={t.id}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  active ? "bg-surface-muted" : "hover:bg-surface-muted/70",
                )}
              >
                <TenantLogo tenant={t} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-muted">
                    {t.city}
                  </span>
                </span>
                {active ? (
                  <Check className="size-4 shrink-0 text-brand-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
