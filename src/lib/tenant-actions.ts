"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession } from "./session";

export type ActionResult = { success: true } | { error: string };

/**
 * Byter aktiv verkstad för den inloggade användaren.
 * - Superadmin får byta till vilken verkstad som helst.
 * - Vanlig användare bara till en verkstad hen är medlem i.
 */
export async function setActiveTenant(
  organizationId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Inte inloggad." };

  if (session.user.role !== "admin") {
    const member = await db.member.findFirst({
      where: { userId: session.user.id, organizationId },
    });
    if (!member) return { error: "Du har inte tillgång till den verkstaden." };
  } else {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) return { error: "Verkstaden hittades inte." };
  }

  await db.session.update({
    where: { id: session.session.id },
    data: { activeOrganizationId: organizationId },
  });

  // Uppdatera hela appen så den nya verkstadens data visas överallt
  revalidatePath("/", "layout");
  return { success: true };
}
