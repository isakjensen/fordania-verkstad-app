import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { PlatformUserRow } from "@/lib/data/platform";
import { CreateUserButton } from "./create-user-button";

const roleLabels: Record<string, string> = {
  owner: "Ägare",
  admin: "Admin",
  member: "Användare",
};

const userStatusMeta: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Aktiv",
    className: "bg-success-soft text-success",
    dot: "bg-success",
  },
  inactive: {
    label: "Inaktiv",
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
};

interface UserTableProps {
  users: PlatformUserRow[];
  tenants: { id: string; name: string }[];
}

export function UserTable({ users, tenants }: UserTableProps) {
  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Användare"
        subtitle={`${users.length} användare över alla tenants`}
        action={<CreateUserButton tenants={tenants} />}
      />

      {/* Kolumnrubriker (desktop) */}
      <div className="hidden items-center gap-4 border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
        <span className="flex-1">Användare</span>
        <span className="w-36">Roll</span>
        <span className="w-48">Företag</span>
        <span className="w-28">Status</span>
        <span className="w-9" />
      </div>

      {users.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Inga användare ännu.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {users.map((u) => {
            const status = userStatusMeta[u.status] ?? userStatusMeta.active;
            return (
              <li
                key={u.id + u.tenantName}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:gap-4"
              >
                {/* Användare */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar initials={u.initials} size="size-9 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                </div>

                {/* Roll */}
                <span className="hidden w-36 text-sm font-medium text-ink-soft lg:block">
                  {roleLabels[u.role] ?? u.role}
                </span>

                {/* Företag */}
                <span className="hidden w-48 truncate text-sm text-ink-soft lg:block">
                  {u.tenantName}
                </span>

                {/* Status */}
                <div className="hidden w-28 sm:block">
                  <Badge className={status.className} dot={status.dot}>
                    {status.label}
                  </Badge>
                </div>

                {/* Status (mobil) + åtgärd */}
                <div className="sm:hidden">
                  <Badge className={cn(status.className)} dot={status.dot}>
                    {status.label}
                  </Badge>
                </div>
                <button
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink"
                  aria-label={`Hantera ${u.name}`}
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
