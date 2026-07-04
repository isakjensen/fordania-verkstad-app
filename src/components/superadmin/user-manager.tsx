"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FieldSelect } from "@/components/ui/field-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlatformUserRow } from "@/lib/data/platform";
import { CreateUserButton } from "./create-user-button";
import { UserRowActions } from "./user-row-actions";

const roleLabels: Record<string, string> = {
  owner: "Admin",
  admin: "Admin",
  member: "Användare",
};
const roleClass: Record<string, string> = {
  owner: "bg-brand-50 text-brand-700",
  admin: "bg-brand-50 text-brand-700",
  member: "bg-surface-muted text-muted-foreground",
};
const userStatusMeta: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  active: { label: "Aktiv", className: "bg-success-soft text-success", dot: "bg-success" },
  inactive: {
    label: "Inaktiv",
    className: "bg-surface-muted text-muted-foreground",
    dot: "bg-slate-400",
  },
};

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      className={cn(
        "justify-center",
        roleClass[role] ?? "bg-surface-muted text-muted-foreground",
      )}
    >
      {roleLabels[role] ?? role}
    </Badge>
  );
}
function StatusBadge({ status }: { status: string }) {
  const meta = userStatusMeta[status] ?? userStatusMeta.active;
  return (
    <Badge className={meta.className} dot={meta.dot}>
      {meta.label}
    </Badge>
  );
}

export function UserManager({
  users,
  tenants,
}: {
  users: PlatformUserRow[];
  tenants: { id: string; name: string }[];
}) {
  const [tenant, setTenant] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (tenant !== "all" && u.tenantId !== tenant) return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, tenant, query]);

  const tenantOptions = [
    { value: "all", label: "Alla företag" },
    ...tenants.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader
        tone="brand"
        title="Användare"
        subtitle={`${filtered.length} av ${users.length} användare`}
        action={<CreateUserButton tenants={tenants} />}
      />

      <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök namn eller e-post…"
            className="h-10 rounded-lg bg-surface-muted pl-9"
          />
        </div>
        <FieldSelect
          options={tenantOptions}
          value={tenant}
          onValueChange={setTenant}
          className="sm:w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Users className="size-6" />
          </span>
          <p className="mt-4 font-semibold text-ink">Inga användare matchar</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Justera sökningen eller välj ett annat företag.
          </p>
        </div>
      ) : (
        <>
          {/* Touch – kort */}
          <ul className="divide-y divide-line lg:hidden">
            {filtered.map((u) => (
              <li key={u.memberId} className="flex items-center gap-3 px-4 py-3">
                <Avatar initials={u.initials} size="size-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{u.name}</p>
                    <RoleBadge role={u.role} />
                    {u.status !== "active" ? (
                      <StatusBadge status={u.status} />
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.email}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {u.tenantName}
                  </p>
                </div>
                <UserRowActions user={u} />
              </li>
            ))}
          </ul>

          {/* Desktop – tabell */}
          <Table className="hidden lg:table">
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={cn(headClass, "min-w-[240px]")}>
                  Användare
                </TableHead>
                <TableHead className={headClass}>Roll</TableHead>
                <TableHead className={headClass}>Företag</TableHead>
                <TableHead className={headClass}>Status</TableHead>
                <TableHead className={cn(headClass, "w-12")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.memberId}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={u.initials} size="size-9 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">
                          {u.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-ink-soft">
                    {u.tenantName}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <UserRowActions user={u} />
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
