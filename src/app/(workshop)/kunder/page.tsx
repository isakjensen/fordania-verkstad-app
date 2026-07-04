import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageSquare, Users, Building2 } from "lucide-react";
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
import { getActiveOrganizationId } from "@/lib/session";
import { getCustomers } from "@/lib/data/customers";
import { CreateCustomerButton } from "./create-customer-button";

export const metadata: Metadata = { title: "Kunder" };

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

const headClass =
  "h-11 px-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

export default async function CustomersPage() {
  const organizationId = await getActiveOrganizationId();
  const customers = organizationId ? await getCustomers(organizationId) : [];

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader
          title="Kunder"
          subtitle={`${customers.length} ${
            customers.length === 1 ? "kund" : "kunder"
          } i registret`}
          action={organizationId ? <CreateCustomerButton /> : null}
        />

        {!organizationId ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
              <Building2 className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">
              Du tillhör ingen verkstad
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Kunder hanteras inne i varje verkstad. Logga in som en
              verkstadsanvändare (t.ex. en tenant-admin) för att se och hantera
              kunder. Superadmin hanterar plattformen via /superadmin.
            </p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Users className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-ink">Inga kunder ännu</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Klicka på &quot;Lägg till kund&quot; för att registrera din första
              kund.
            </p>
          </div>
        ) : (
          <>
          {/* Mobil / iPad-stående: touch-kort */}
          <ul className="divide-y divide-line lg:hidden">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kunder/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-surface-muted"
                >
                  {c.type === "company" ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <Building2 className="size-5" />
                    </span>
                  ) : (
                    <Avatar initials={initialsOf(c.name)} size="size-10 text-sm" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.95rem] font-semibold text-ink">
                      {c.name}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {c.type === "company"
                        ? c.orgNumber ?? c.phone ?? "Företag"
                        : c.phone ?? c.email ?? "—"}
                    </span>
                  </span>
                  {c._count.comments > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="size-3.5" />
                      {c._count.comments}
                    </span>
                  ) : null}
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop / liggande: tabell */}
          <Table className="hidden lg:table">
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={`${headClass} min-w-[220px]`}>
                  Kund
                </TableHead>
                <TableHead className={`${headClass} hidden md:table-cell`}>
                  Person-/Org.nr
                </TableHead>
                <TableHead className={`${headClass} hidden lg:table-cell`}>
                  Telefon
                </TableHead>
                <TableHead className={`${headClass} hidden lg:table-cell`}>
                  E-post
                </TableHead>
                <TableHead className={`${headClass} hidden text-center sm:table-cell`}>
                  Komm.
                </TableHead>
                <TableHead className={`${headClass} w-12`} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/kunder/${c.id}`}
                      className="flex items-center gap-3"
                    >
                      {c.type === "company" ? (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                          <Building2 className="size-4.5" />
                        </span>
                      ) : (
                        <Avatar initials={initialsOf(c.name)} size="size-9 text-sm" />
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-ink group-hover:text-brand-700">
                          {c.name}
                          {c.type === "company" ? (
                            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-700">
                              Företag
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {c.phone ?? c.email ?? "—"}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums md:table-cell">
                    {(c.type === "company" ? c.orgNumber : c.personalNumber) ??
                      "—"}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums lg:table-cell">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft lg:table-cell">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-center sm:table-cell">
                    {c._count.comments > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        {c._count.comments}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Link
                      href={`/kunder/${c.id}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
                      aria-label={`Öppna ${c.name}`}
                    >
                      <ChevronRight className="size-5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
        )}
      </Card>
    </div>
  );
}
