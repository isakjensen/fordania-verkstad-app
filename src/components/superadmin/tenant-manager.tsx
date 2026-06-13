"use client";

import { useMemo, useState } from "react";
import { Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FieldSelect } from "@/components/ui/field-select";
import { TenantLogo } from "@/components/ui/tenant-logo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tenantStatusMeta, type TenantStatus } from "@/lib/tenants";
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

const statusOptions = [
  { value: "all", label: "Alla status" },
  { value: "active", label: "Aktiv" },
  { value: "trial", label: "Testperiod" },
  { value: "paused", label: "Pausad" },
  { value: "invited", label: "Inbjuden" },
];

function StatusBadge({ status }: { status: string }) {
  const meta = tenantStatusMeta[status as TenantStatus] ?? defaultStatus;
  return (
    <Badge className={meta.className} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
}

export function TenantManager({ tenants }: { tenants: TenantRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (q && !`${t.name} ${t.city ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tenants, query, status]);

  return (
    <Card className="flex flex-col">
      <CardHeader
        tone="brand"
        title="Företag"
        subtitle={`${filtered.length} av ${tenants.length} företag`}
        action={<CreateTenantButton />}
      />

      {/* Verktygsrad – fungerande sök + filter */}
      <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök företag eller stad…"
            className="h-10 rounded-lg bg-surface-muted pl-9"
          />
        </div>
        <FieldSelect
          options={statusOptions}
          value={status}
          onValueChange={setStatus}
          className="sm:w-44"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Building2 className="size-6" />
          </span>
          <p className="mt-4 font-semibold text-ink">Inga företag matchar</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Justera sökningen eller statusfiltret – eller lägg till ett nytt
            företag.
          </p>
        </div>
      ) : (
        <>
          {/* Touch – kort */}
          <ul className="divide-y divide-line lg:hidden">
            {filtered.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-4 py-3.5">
                <TenantLogo tenant={t} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{t.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {t.city ?? "—"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-ink-soft tabular-nums">
                        {t.users}
                      </span>{" "}
                      användare
                    </span>
                    <span>
                      <span className="font-semibold text-ink-soft tabular-nums">
                        {t.vehicles}
                      </span>{" "}
                      fordon
                    </span>
                  </div>
                </div>
                <TenantRowActions tenant={t} />
              </li>
            ))}
          </ul>

          {/* Desktop – tabell */}
          <Table className="hidden lg:table">
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={cn(headClass, "min-w-[240px]")}>
                  Företag
                </TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  Användare
                </TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  Fordon
                </TableHead>
                <TableHead className={cn(headClass, "hidden xl:table-cell")}>
                  Skapad
                </TableHead>
                <TableHead className={cn(headClass, "w-12")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
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
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                    {t.users}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold text-ink tabular-nums">
                    {t.vehicles}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                    {df.format(t.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <TenantRowActions tenant={t} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  );
}
