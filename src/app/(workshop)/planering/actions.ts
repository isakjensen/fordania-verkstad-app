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

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId, deletedAt: null },
  });
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

const VALID_TYPES = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
];

const VALID_PRIORITY = ["low", "normal", "high"];

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
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId, deletedAt: null },
  });
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

/** Snabbändra arbetsorderns typ (Service, Reparation, …). */
export async function setJobType(
  jobId: string,
  type: string,
): Promise<ActionResult> {
  if (!VALID_TYPES.includes(type)) return { error: "Ogiltig typ." };
  const err = await guardJob(jobId);
  if (err) return err;
  await db.job.update({ where: { id: jobId }, data: { type } });
  revalidateJob(jobId);
  return { success: true };
}

/** Snabbändra arbetsorderns prioritet (low | normal | high). */
export async function setJobPriority(
  jobId: string,
  priority: string,
): Promise<ActionResult> {
  if (!VALID_PRIORITY.includes(priority)) return { error: "Ogiltig prioritet." };
  const err = await guardJob(jobId);
  if (err) return err;
  await db.job.update({ where: { id: jobId }, data: { priority } });
  revalidateJob(jobId);
  return { success: true };
}

/**
 * Kopplar en kund till arbetsordern. Kunder hör i datamodellen till fordon, så
 * kopplingen görs mot orderns fordon (kunden blir ägare) – då dyker den upp som
 * kund på ordern, fordonet och kundkortet, precis som i resten av appen.
 * Kräver att ordern har minst ett fordon.
 */
export async function linkJobCustomer(
  jobId: string,
  customerId: string,
): Promise<ActionResult> {
  const err = await guardJob(jobId);
  if (err) return err;
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: "Du tillhör ingen verkstad." };

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId, deletedAt: null },
    include: { vehicles: { select: { vehicleId: true } } },
  });
  if (!job) return { error: "Arbetsordern hittades inte." };
  const vehicleId = job.vehicles[0]?.vehicleId;
  if (!vehicleId) return { error: "Koppla ett fordon på ordern först." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, organizationId, deletedAt: null },
  });
  if (!customer) return { error: "Kunden hittades inte." };

  await db.customerVehicle.upsert({
    where: { customerId_vehicleId: { customerId, vehicleId } },
    create: { customerId, vehicleId },
    update: {},
  });
  revalidateJob(jobId);
  revalidatePath(`/kunder/${customerId}`);
  revalidatePath(`/fordon/${vehicleId}`);
  return { success: true };
}

/** Tar bort en kund från arbetsordern (kopplingen mot orderns fordon). */
export async function unlinkJobCustomer(
  jobId: string,
  customerId: string,
): Promise<ActionResult> {
  const err = await guardJob(jobId);
  if (err) return err;
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: "Du tillhör ingen verkstad." };

  const job = await db.job.findFirst({
    where: { id: jobId, organizationId, deletedAt: null },
    include: { vehicles: { select: { vehicleId: true } } },
  });
  if (!job) return { error: "Arbetsordern hittades inte." };
  const vehicleIds = job.vehicles.map((v) => v.vehicleId);
  if (vehicleIds.length === 0) return { success: true };

  await db.customerVehicle.deleteMany({
    where: { customerId, vehicleId: { in: vehicleIds } },
  });
  revalidateJob(jobId);
  revalidatePath(`/kunder/${customerId}`);
  for (const vehicleId of vehicleIds) revalidatePath(`/fordon/${vehicleId}`);
  return { success: true };
}
