import type { Metadata } from "next";
import { Users, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveOrganizationId, getTenantRole, canManageUsers } from "@/lib/session";
import { getTenantMembers } from "@/lib/data/users";
import { CreateUserButton } from "./create-user-button";
import { UserActions } from "./user-actions";
import { RoleBadge, StatusBadge } from "./badges";

export const metadata: Metadata = { title: "Användare" };

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default async function UsersPage() {
  const organizationId = await getActiveOrganizationId();
  const role = organizationId ? await getTenantRole(organizationId) : null;
  const canManage = canManageUsers(role);
  const members = organizationId ? await getTenantMembers(organizationId) : [];

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Verkstad
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Användare
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hantera verkstadens anställda, roller och inloggningar.
          </p>
        </div>
        {organizationId && canManage ? <CreateUserButton /> : null}
      </div>

      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Anställda"
          subtitle={`${members.length} användare i verkstaden`}
        />

        {!organizationId ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            Välj en verkstad för att se dess användare.
          </p>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Users className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">Inga användare ännu</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={`${headClass} min-w-[220px]`}>
                  Namn
                </TableHead>
                <TableHead className={`${headClass} hidden md:table-cell`}>
                  E-post
                </TableHead>
                <TableHead className={headClass}>Roll</TableHead>
                <TableHead className={`${headClass} hidden sm:table-cell`}>
                  Status
                </TableHead>
                {canManage ? (
                  <TableHead className={`${headClass} w-12`} />
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.memberId} className="group">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={initialsOf(m.name)}
                        size="size-9 text-xs"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                          {m.name}
                          {m.isSuperadmin ? (
                            <ShieldCheck
                              className="size-3.5 text-brand-600"
                              aria-label="Superadmin"
                            />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {m.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft md:table-cell">
                    {m.email}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <RoleBadge role={m.role} />
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge active={m.active} />
                  </TableCell>
                  {canManage ? (
                    <TableCell className="px-4 py-3 text-right">
                      {m.isSuperadmin ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <UserActions
                          member={{
                            memberId: m.memberId,
                            name: m.name,
                            email: m.email,
                            role: m.role,
                            active: m.active,
                          }}
                        />
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {!canManage && organizationId ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Endast verkstadens administratörer kan lägga till och ändra
          användare.
        </p>
      ) : null}
    </div>
  );
}
