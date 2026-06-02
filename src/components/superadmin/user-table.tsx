import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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
  owner: "Ägare",
  admin: "Admin",
  member: "Användare",
};

const roleClass: Record<string, string> = {
  owner: "bg-violet-100 text-violet-700",
  admin: "bg-brand-50 text-brand-700",
  member: "bg-slate-100 text-slate-600",
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

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

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

      {users.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          Inga användare ännu.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
              <TableHead className={cn(headClass, "min-w-[240px]")}>
                Användare
              </TableHead>
              <TableHead className={cn(headClass, "hidden sm:table-cell")}>
                Roll
              </TableHead>
              <TableHead className={cn(headClass, "hidden lg:table-cell")}>
                Företag
              </TableHead>
              <TableHead className={headClass}>Status</TableHead>
              <TableHead className={cn(headClass, "w-12")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const status = userStatusMeta[u.status] ?? userStatusMeta.active;
              return (
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
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <Badge
                      className={cn(
                        "justify-center",
                        roleClass[u.role] ?? "bg-slate-100 text-slate-600",
                      )}
                    >
                      {roleLabels[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft lg:table-cell">
                    {u.tenantName}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={status.className} dot={status.dot}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <UserRowActions user={u} />
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
