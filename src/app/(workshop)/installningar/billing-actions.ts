"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";

/**
 * Sparar verkstadens fakturauppgifter. Endast administratörer. Tomma fält
 * lagras som null. Betalningsvillkor faller tillbaka till 30 dagar.
 */
export async function updateWorkshopBilling(
  formData: FormData,
): Promise<{ ok: true } | { error: string }> {
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: "Ingen aktiv verkstad." };

  const role = await getTenantRole(organizationId);
  if (!canManageUsers(role)) {
    return { error: "Endast administratörer kan ändra fakturauppgifter." };
  }

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };
  const days = Number(formData.get("paymentTermsDays"));

  await db.organization.update({
    where: { id: organizationId },
    data: {
      orgNumber: str("orgNumber"),
      vatNumber: str("vatNumber"),
      address: str("address"),
      postalCode: str("postalCode"),
      city: str("city"),
      email: str("email"),
      phone: str("phone"),
      bankgiro: str("bankgiro"),
      paymentTermsDays:
        Number.isFinite(days) && days > 0 ? Math.round(days) : 30,
    },
  });

  revalidatePath("/installningar");
  return { ok: true };
}
