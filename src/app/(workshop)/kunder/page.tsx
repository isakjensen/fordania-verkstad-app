import type { Metadata } from "next";
import { Users, Building2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { getActiveOrganizationId } from "@/lib/session";
import { getCustomers, getRemovedCustomers } from "@/lib/data/customers";
import { CreateCustomerButton } from "./create-customer-button";
import { RemovedCustomersButton } from "./removed-customers-button";
import { CustomersView } from "./customers-view";

export const metadata: Metadata = { title: "Kunder" };

export default async function CustomersPage() {
  const organizationId = await getActiveOrganizationId();
  const [customers, removedCustomers] = organizationId
    ? await Promise.all([
        getCustomers(organizationId),
        getRemovedCustomers(organizationId),
      ])
    : [[], []];

  const removedButton = <RemovedCustomersButton removed={removedCustomers} />;
  const createButton = <CreateCustomerButton />;

  // Samlad knapprad för tomt-läget (CardHeader).
  const action = organizationId ? (
    <div className="flex items-center gap-2">
      {removedButton}
      {createButton}
    </div>
  ) : null;

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <Card>
        {!organizationId ? (
          <>
            <CardHeader title="Kunder" />
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
          </>
        ) : customers.length === 0 ? (
          <>
            <CardHeader
              title="Kunder"
              subtitle="0 kunder i registret"
              action={action}
            />
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
          </>
        ) : (
          <CustomersView
            customers={customers}
            removedButton={removedButton}
            createButton={createButton}
          />
        )}
      </Card>
    </div>
  );
}
