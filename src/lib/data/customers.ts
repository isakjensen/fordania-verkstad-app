import "server-only";
import { db } from "@/lib/db";

/**
 * Alla kunder för en tenant. Listan scopas alltid på organizationId så att
 * en tenant aldrig kan se en annan tenants kunder (row-level isolation).
 */
export async function getCustomers(organizationId: string) {
  return db.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { comments: true, vehicles: true } },
    },
  });
}

/**
 * En enskild kund med kommentarer och kopplade fordon. Filtrerar på BÅDE id och
 * organizationId – så en användare inte kan öppna en annan tenants kund via
 * gissad URL.
 */
export async function getCustomer(id: string, organizationId: string) {
  return db.customer.findFirst({
    where: { id, organizationId },
    include: {
      comments: { orderBy: { createdAt: "desc" } },
      // Primär kontaktperson (företagets kontaktperson) först, sedan äldst först.
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      vehicles: {
        include: {
          vehicle: {
            include: {
              odometer: { orderBy: { readingDate: "desc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Enkel lista över tenantens kunder (id + namn) för kopplingsväljare. */
export async function getCustomerOptions(organizationId: string) {
  return db.customer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export type CustomerWithCount = Awaited<
  ReturnType<typeof getCustomers>
>[number];

export type CustomerWithComments = NonNullable<
  Awaited<ReturnType<typeof getCustomer>>
>;
