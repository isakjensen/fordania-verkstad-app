import "server-only";
import { db } from "@/lib/db";

/** Verkstadens fakturauppgifter (avsändare på arbetsorder/faktura). */
export async function getWorkshopBilling(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      city: true,
      orgNumber: true,
      vatNumber: true,
      address: true,
      postalCode: true,
      email: true,
      phone: true,
      bankgiro: true,
      paymentTermsDays: true,
    },
  });
}

export type WorkshopBilling = NonNullable<
  Awaited<ReturnType<typeof getWorkshopBilling>>
>;
