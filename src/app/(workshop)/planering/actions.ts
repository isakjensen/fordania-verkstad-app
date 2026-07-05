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
  data: {
    fromUserId?: string;
    toUserId?: string;
    unassign?: boolean;
    scheduledStart?: string;
    scheduledEnd?: string;
  },
): Promise<ActionResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_PERMISSION };

  const role = await getTenantRole(organizationId);
  if (!canManageUsers(role)) return { error: NO_PERMISSION };

  if (!jobId) return { error: "Arbetsorder saknas." };

  const job = await db.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return { error: "Arbetsordern hittades inte." };

  // Avtilldela: ta bara bort källmekanikern från jobbet (ordern blir
  // otilldelad och hamnar i "Ej tilldelade"-raden).
  if (data.unassign && data.fromUserId) {
    await db.jobMechanic.deleteMany({
      where: { jobId, userId: data.fromUserId },
    });
  }
  // Byt mekaniker: ta bort källan, lägg till målet (måste vara medlem).
  else if (data.toUserId && data.toUserId !== data.fromUserId) {
    const member = await db.member.findFirst({
      where: { organizationId, userId: data.toUserId },
    });
    if (!member) return { error: "Mekanikern tillhör inte verkstaden." };

    if (data.fromUserId) {
      await db.jobMechanic.deleteMany({
        where: { jobId, userId: data.fromUserId },
      });
    }
    await db.jobMechanic.upsert({
      where: { jobId_userId: { jobId, userId: data.toUserId } },
      create: { jobId, userId: data.toUserId },
      update: {},
    });
  }

  const start = data.scheduledStart ? new Date(data.scheduledStart) : job.scheduledStart;
  const end = data.scheduledEnd ? new Date(data.scheduledEnd) : job.scheduledEnd;
  if (start && Number.isNaN(start.getTime())) return { error: "Ogiltig starttid." };
  if (end && Number.isNaN(end.getTime())) return { error: "Ogiltig sluttid." };

  await db.job.update({
    where: { id: jobId },
    data: { scheduledStart: start, scheduledEnd: end },
  });

  revalidatePath("/planering");
  return { success: true };
}

const VALID_STATUS = [
  "planned",
  "in_progress",
  "waiting_parts",
  "done",
  "delayed",
];

/**
 * Säkerställer inloggad medlem i den aktiva verkstaden + att jobbet hör dit.
 * Returnerar ett fel, eller `null` om allt är ok.
 */
async function guardJob(jobId: string): Promise<{ error: string } | null> {
  const session = await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: "Du tillhör ingen verkstad." };
  const member = await db.member.findFirst({
    where: { organizationId, userId: session.user.id },
  });
  const role = await getTenantRole(organizationId);
  // Medlemmar och verkstadsadmin/superadmin får snabbändra.
  if (!member && !role) return { error: "Saknar behörighet." };
  const job = await db.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return { error: "Arbetsordern hittades inte." };
  return null;
}

function revalidateJob(jobId: string) {
  revalidatePath("/planering");
  revalidatePath("/arbetsordrar");
  revalidatePath(`/arbetsordrar/${jobId}`);
  revalidatePath("/dagens-uppdrag");
  revalidatePath("/");
}

/** Snabbändra status på en arbetsorder (tillgängligt för mekaniker). */
export async function setJobStatus(
  jobId: string,
  status: string,
): Promise<ActionResult> {
  if (!VALID_STATUS.includes(status)) return { error: "Ogiltig status." };
  const err = await guardJob(jobId);
  if (err) return err;
  await db.job.update({ where: { id: jobId }, data: { status } });
  revalidateJob(jobId);
  return { success: true };
}

/** Sparar arbetsorderns anteckning (beskrivning). */
export async function setJobNote(
  jobId: string,
  note: string,
): Promise<ActionResult> {
  const err = await guardJob(jobId);
  if (err) return err;
  const trimmed = note.trim();
  await db.job.update({
    where: { id: jobId },
    data: { description: trimmed.length ? trimmed : null },
  });
  revalidateJob(jobId);
  return { success: true };
}
