import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  tenantStatusMeta,
  planMeta,
  type TenantStatus,
  type TenantPlan,
} from "@/lib/tenants";
import type { TenantRow } from "@/lib/data/platform";
import { CreateTenantButton } from "./create-tenant-button";
import { TenantRowActions } from "./tenant-row-actions";

const df = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const defaultStatus = {
  label: "Okänd",
  className: "bg-surface-muted text-muted-foreground",
  dot: "bg-slate-400",
};

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

interface TenantTableProps {
  tenants: TenantRow[];
  title?: string;
  subtitle?: string;
  showToolbar?: boolean;
}

export function TenantTable({
  tenants,
  title = "Företag",
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

      {tenants.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          Inga företag ännu. Klicka på &quot;Lägg till företag&quot; för att
          skapa det första.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
              <TableHead className={cn(headClass, "min-w-[220px]")}>
                Företag
              </TableHead>
              <TableHead className={cn(headClass, "hidden md:table-cell")}>
                Plan
              </TableHead>
              <TableHead className={headClass}>Status</TableHead>
              <TableHead
                className={cn(headClass, "hidden text-right lg:table-cell")}
              >
                Användare
              </TableHead>
              <TableHead
                className={cn(headClass, "hidden text-right lg:table-cell")}
              >
                Fordon
              </TableHead>
              <TableHead className={cn(headClass, "hidden xl:table-cell")}>
                Skapad
              </TableHead>
              <TableHead className={cn(headClass, "w-12")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => {
              const status =
                tenantStatusMeta[t.status as TenantStatus] ?? defaultStatus;
              return (
                <TableRow key={t.id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TenantLogo tenant={t} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {t.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.city ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    <Badge
                      className={cn(
                        "justify-center",
                        planMeta[t.plan as TenantPlan] ??
                          "bg-surface-muted text-muted-foreground",
                      )}
                    >
                      {t.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={status.className} dot={status.dot}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-right font-semibold text-ink tabular-nums lg:table-cell">
                    {t.users}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-right font-semibold text-ink tabular-nums lg:table-cell">
                    {t.vehicles}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                    {df.format(t.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <TenantRowActions tenant={t} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
