"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requireUser,
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";

export type ActionResult = { success: true } | { error: string };

const NO_PERMISSION =
  "Endast verkstadens administratörer kan flytta arbetsordrar.";

/**
 * Flyttar en arbetsorder till en annan mekaniker och/eller ny tid.
 * Endast tenant-admin/superadmin. Allt scopas på den aktiva verkstaden.
 */
export async function moveJob(
  jobId: string,
  data: { assignedUserId?: string | null; scheduledStart?: string; scheduledEnd?: string },
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_PERMISSION };

  const role = await getTenantRole(organizationId);
  if (!canManageUsers(role)) return { error: NO_PERMISSION };

  if (!jobId) return { error: "Arbetsorder saknas." };

  const job = await db.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return { error: "Arbetsordern hittades inte." };

  // Validera ny mekaniker – måste vara medlem i samma verkstad.
  let assignedUserId = job.assignedUserId;
  if (data.assignedUserId !== undefined) {
    if (data.assignedUserId === null) {
      assignedUserId = null;
    } else {
      const member = await db.member.findFirst({
        where: { organizationId, userId: data.assignedUserId },
      });
      if (!member) return { error: "Mekanikern tillhör inte verkstaden." };
      assignedUserId = data.assignedUserId;
    }
  }

  const start = data.scheduledStart ? new Date(data.scheduledStart) : job.scheduledStart;
  const end = data.scheduledEnd ? new Date(data.scheduledEnd) : job.scheduledEnd;
  if (start && Number.isNaN(start.getTime())) return { error: "Ogiltig starttid." };
  if (end && Number.isNaN(end.getTime())) return { error: "Ogiltig sluttid." };

  await db.job.update({
    where: { id: jobId },
    data: {
      assignedUserId,
      scheduledStart: start,
      scheduledEnd: end,
    },
  });

  revalidatePath("/planering");
  return { success: true };
}
