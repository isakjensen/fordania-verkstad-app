"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession } from "./session";

export type ActionResult = { success: true } | { error: string };

/**
 * Byter aktiv verkstad för den inloggade användaren.
 *
 * ENDAST global superadmin (Fordania) får byta verkstad – det är ett
 * plattforms-privilegium. Vanliga verkstadsanvändare hör hemma i sin egen
 * verkstad; deras aktiva verkstad härleds automatiskt från medlemskapet
 * (se getActiveOrganizationId) och de kan varken se eller anropa detta.
 */
export async function setActiveTenant(
  organizationId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Inte inloggad." };

  if (session.user.role !== "admin") {
    return { error: "Endast superadmin kan byta verkstad." };
  }

  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) return { error: "Verkstaden hittades inte." };

  await db.session.update({
    where: { id: session.session.id },
    data: { activeOrganizationId: organizationId },
  });

  // Uppdatera hela appen så den nya verkstadens data visas överallt
  revalidatePath("/", "layout");
  return { success: true };
}
