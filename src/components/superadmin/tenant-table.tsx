import { Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  tenantStatusMeta,
  planMeta,
  type TenantStatus,
  type TenantPlan,
} from "@/lib/tenants";
import type { TenantRow } from "@/lib/data/platform";
import { CreateTenantButton } from "./create-tenant-button";

const df = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const defaultStatus = { label: "Okänd", className: "bg-slate-100 text-slate-500", dot: "bg-slate-400" };

interface TenantTableProps {
  tenants: TenantRow[];
  title?: string;
  subtitle?: string;
  showToolbar?: boolean;
}

export function TenantTable({
  tenants,
  title = "Kunder",
  subtitle,
  showToolbar = true,
}: TenantTableProps) {
  return (
    <Card>
      <CardHeader
        tone="brand"
        title={title}
        subtitle={subtitle ?? `${tenants.length} anslutna företag`}
        action={<CreateTenantButton />}
      />

      {showToolbar ? (
        <div className="flex flex-col gap-2 border-b border-line px-5 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Sök företag eller stad…"
              className="h-9 rounded-lg bg-surface-muted pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Filter:</span>
            <span className="rounded-md bg-surface-muted px-2 py-1 font-medium text-ink-soft">
              Alla status
            </span>
            <span className="rounded-md bg-surface-muted px-2 py-1 font-medium text-ink-soft">
              Alla planer
            </span>
          </div>
        </div>
      ) : null}

      {/* Kolumnrubriker (desktop) */}
      <div className="hidden items-center gap-4 border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
        <span className="flex-1">Företag</span>
        <span className="w-24">Plan</span>
        <span className="w-28">Status</span>
        <span className="w-32 text-right">Användare / fordon</span>
        <span className="w-28">Skapad</span>
        <span className="w-9" />
      </div>

      {tenants.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Inga kunder ännu. Klicka på "Lägg till kund" för att skapa den första.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {tenants.map((t) => {
            const status = tenantStatusMeta[t.status as TenantStatus] ?? defaultStatus;
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:gap-4"
              >
                {/* Företag */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TenantLogo tenant={t} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{t.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t.city ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Plan */}
                <Badge
                  className={cn(
                    "hidden w-24 justify-center lg:inline-flex",
                    planMeta[t.plan as TenantPlan] ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {t.plan}
                </Badge>

                {/* Status */}
                <div className="hidden w-28 sm:block">
                  <Badge className={status.className} dot={status.dot}>
                    {status.label}
                  </Badge>
                </div>

                {/* Användare / fordon */}
                <div className="hidden w-32 text-right lg:block">
                  <p className="text-sm font-semibold text-ink tabular-nums">
                    {t.users} / {t.vehicles}
                  </p>
                  <p className="text-xs text-muted-foreground">anv. / fordon</p>
                </div>

                {/* Skapad */}
                <p className="hidden w-28 truncate text-sm text-muted-foreground lg:block">
                  {df.format(t.createdAt)}
                </p>

                {/* Status (mobil) + åtgärd */}
                <div className="sm:hidden">
                  <Badge className={status.className} dot={status.dot}>
                    {status.label}
                  </Badge>
                </div>
                <button
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink"
                  aria-label={`Hantera ${t.name}`}
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
