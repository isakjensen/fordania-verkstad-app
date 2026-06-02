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
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Sidhuvud */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Register
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Kunder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kundregister för verkstaden – kontaktuppgifter och kommentarer.
          </p>
        </div>
        {organizationId ? <CreateCustomerButton /> : null}
      </div>

      <Card className="mt-6">
        <CardHeader
          tone="brand"
          title="Alla kunder"
          subtitle={`${customers.length} ${
            customers.length === 1 ? "kund" : "kunder"
          } i registret`}
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
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted/40 hover:bg-surface-muted/40">
                <TableHead className={`${headClass} min-w-[220px]`}>
                  Kund
                </TableHead>
                <TableHead className={`${headClass} hidden md:table-cell`}>
                  Personnummer
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
                      <Avatar initials={initialsOf(c.name)} size="size-9 text-sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink group-hover:text-brand-700">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {c.phone ?? c.email ?? "—"}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 text-sm text-ink-soft tabular-nums md:table-cell">
                    {c.personalNumber ?? "—"}
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
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-ink"
                      aria-label={`Öppna ${c.name}`}
                    >
                      <ChevronRight className="size-5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
