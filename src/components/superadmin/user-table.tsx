import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { platformUsers, tenants } from "@/lib/tenants";

const tenantName = (id: string) =>
  tenants.find((t) => t.id === id)?.name ?? "–";

const userStatusMeta: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Aktiv",
    className: "bg-success-soft text-success",
    dot: "bg-success",
  },
  invited: {
    label: "Inbjuden",
    className: "bg-info-soft text-info",
    dot: "bg-info",
  },
  inactive: {
    label: "Inaktiv",
    className: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
};

export function UserTable() {
  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Användare"
        subtitle={`${platformUsers.length} användare över alla tenants`}
        action={
          <Button size="sm" variant="success">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Bjud in användare</span>
          </Button>
        }
      />

      {/* Kolumnrubriker (desktop) */}
      <div className="hidden items-center gap-4 border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted lg:flex">
        <span className="flex-1">Användare</span>
        <span className="w-36">Roll</span>
        <span className="w-44">Företag</span>
        <span className="w-28">Status</span>
        <span className="w-28">Senast sedd</span>
        <span className="w-9" />
      </div>

      <ul className="divide-y divide-line">
        {platformUsers.map((u) => {
          const status = userStatusMeta[u.status];
          return (
            <li
              key={u.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:gap-4"
            >
              {/* Användare */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar initials={u.initials} size="size-9 text-sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{u.name}</p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                </div>
              </div>

              {/* Roll */}
              <span className="hidden w-36 text-sm font-medium text-ink-soft lg:block">
                {u.role}
              </span>

              {/* Företag */}
              <span className="hidden w-44 truncate text-sm text-ink-soft lg:block">
                {tenantName(u.tenantId)}
              </span>

              {/* Status */}
              <div className="hidden w-28 sm:block">
                <Badge className={status.className} dot={status.dot}>
                  {status.label}
                </Badge>
              </div>

              {/* Senast sedd */}
              <span className="hidden w-28 truncate text-sm text-muted lg:block">
                {u.lastSeen}
              </span>

              {/* Status (mobil) + åtgärd */}
              <div className="sm:hidden">
                <Badge className={cn(status.className)} dot={status.dot}>
                  {status.label}
                </Badge>
              </div>
              <button
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink"
                aria-label={`Hantera ${u.name}`}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
