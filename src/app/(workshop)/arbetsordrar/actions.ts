"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requireUser,
  getActiveOrganizationId,
  getSession,
} from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { storage } from "@/lib/storage";

export type ActionResult = { success: true; id?: string } | { error: string };

const NO_ORG =
  "Du tillhör ingen verkstad – logga in som en verkstadsanvändare.";

const VALID_TYPES = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
];
const VALID_STATUS = ["planned", "in_progress", "waiting_parts", "done", "delayed"];
const VALID_PRIORITY = ["low", "normal", "high"];
const VALID_VAT = [25, 12, 6];

/** Säkerställer inloggad användare med aktiv verkstad. */
async function requireOrg(): Promise<{ organizationId: string } | { error: string }> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return { error: NO_ORG };
  return { organizationId };
}

/** Säkerställer att en arbetsorder tillhör tenanten. */
async function jobInOrg(jobId: string, organizationId: string) {
  return db.job.findFirst({ where: { id: jobId, organizationId } });
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

/** "450,50" eller "450.5" → 45050 (öre). */
function krToOre(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

/** Bygger ett DateTime av datum (YYYY-MM-DD) + tid (HH:MM). */
function combine(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const t = time && /^\d{1,2}:\d{2}$/.test(time) ? time : "08:00";
  const d = new Date(`${date}T${t.padStart(5, "0")}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createWorkOrder(formData: FormData): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;

  const type = String(formData.get("type") ?? "");
  if (!VALID_TYPES.includes(type)) return { error: "Välj en giltig typ." };
  const status = String(formData.get("status") ?? "planned");
  const priority = String(formData.get("priority") ?? "normal");

  const date = str(formData.get("date"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const scheduledStart = combine(date, startTime);
  let scheduledEnd = combine(date, endTime);
  if (scheduledStart && (!scheduledEnd || scheduledEnd <= scheduledStart)) {
    scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
  }
  const durationMin = scheduledStart && scheduledEnd
    ? Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000)
    : 60;

  const job = await db.job.create({
    data: {
      organizationId: guard.organizationId,
      type,
      status: VALID_STATUS.includes(status) ? status : "planned",
      priority: VALID_PRIORITY.includes(priority) ? priority : "normal",
      description: str(formData.get("description")),
      start: scheduledStart
        ? `${String(scheduledStart.getHours()).padStart(2, "0")}:${String(scheduledStart.getMinutes()).padStart(2, "0")}`
        : "08:00",
      durationMin,
      scheduledStart,
      scheduledEnd,
    },
  });

  // Valfri första mekaniker/fordon.
  const userId = str(formData.get("userId"));
  if (userId) {
    const member = await db.member.findFirst({
      where: { organizationId: guard.organizationId, userId },
    });
    if (member) await db.jobMechanic.create({ data: { jobId: job.id, userId } });
  }
  const vehicleId = str(formData.get("vehicleId"));
  if (vehicleId) {
    const v = await db.vehicle.findFirst({
      where: { id: vehicleId, organizationId: guard.organizationId },
    });
    if (v) await db.jobVehicle.create({ data: { jobId: job.id, vehicleId } });
  }

  await recordAudit({
    action: "job.create",
    category: "job",
    summary: `Skapade arbetsordern ${type}`,
    organizationId: guard.organizationId,
    entityType: "job",
    entityId: job.id,
  });

  revalidatePath("/arbetsordrar");
  revalidatePath("/planering");
  return { success: true, id: job.id };
}

export async function updateWorkOrder(formData: FormData): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;

  const id = String(formData.get("id") ?? "");
  const job = await jobInOrg(id, guard.organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };

  const type = String(formData.get("type") ?? job.type);
  const status = String(formData.get("status") ?? job.status);
  const priority = String(formData.get("priority") ?? job.priority);

  const date = str(formData.get("date"));
  const startTime = str(formData.get("startTime"));
  const endTime = str(formData.get("endTime"));
  const scheduledStart = combine(date, startTime);
  let scheduledEnd = combine(date, endTime);
  if (scheduledStart && (!scheduledEnd || scheduledEnd <= scheduledStart)) {
    scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
  }

  await db.job.update({
    where: { id },
    data: {
      type: VALID_TYPES.includes(type) ? type : job.type,
      status: VALID_STATUS.includes(status) ? status : job.status,
      priority: VALID_PRIORITY.includes(priority) ? priority : job.priority,
      description: str(formData.get("description")),
      scheduledStart,
      scheduledEnd,
      ...(scheduledStart && scheduledEnd
        ? {
            start: `${String(scheduledStart.getHours()).padStart(2, "0")}:${String(scheduledStart.getMinutes()).padStart(2, "0")}`,
            durationMin: Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000),
          }
        : {}),
    },
  });

  const nextStatus = VALID_STATUS.includes(status) ? status : job.status;
  await recordAudit({
    action: nextStatus !== job.status ? "job.status" : "job.update",
    category: "job",
    summary:
      nextStatus !== job.status
        ? `Ändrade status på arbetsordern ${job.type} (${job.status} → ${nextStatus})`
        : `Uppdaterade arbetsordern ${job.type}`,
    organizationId: guard.organizationId,
    entityType: "job",
    entityId: id,
  });

  revalidatePath("/arbetsordrar");
  revalidatePath(`/arbetsordrar/${id}`);
  revalidatePath("/planering");
  return { success: true };
}

export async function deleteWorkOrder(id: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const job = await jobInOrg(id, guard.organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };
  await db.job.delete({ where: { id } });

  await recordAudit({
    action: "job.delete",
    category: "job",
    summary: `Tog bort arbetsordern ${job.type}`,
    organizationId: guard.organizationId,
    entityType: "job",
    entityId: id,
  });

  revalidatePath("/arbetsordrar");
  revalidatePath("/planering");
  return { success: true };
}

export async function linkMechanic(jobId: string, userId: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const [job, member] = await Promise.all([
    jobInOrg(jobId, guard.organizationId),
    db.member.findFirst({ where: { organizationId: guard.organizationId, userId } }),
  ]);
  if (!job) return { error: "Arbetsordern hittades inte." };
  if (!member) return { error: "Mekanikern tillhör inte verkstaden." };
  await db.jobMechanic.upsert({
    where: { jobId_userId: { jobId, userId } },
    create: { jobId, userId },
    update: {},
  });
  revalidatePath(`/arbetsordrar/${jobId}`);
  revalidatePath("/planering");
  return { success: true };
}

export async function unlinkMechanic(jobId: string, userId: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const job = await jobInOrg(jobId, guard.organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };
  await db.jobMechanic.deleteMany({ where: { jobId, userId } });
  revalidatePath(`/arbetsordrar/${jobId}`);
  revalidatePath("/planering");
  return { success: true };
}

export async function linkVehicle(jobId: string, vehicleId: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const [job, vehicle] = await Promise.all([
    jobInOrg(jobId, guard.organizationId),
    db.vehicle.findFirst({ where: { id: vehicleId, organizationId: guard.organizationId } }),
  ]);
  if (!job) return { error: "Arbetsordern hittades inte." };
  if (!vehicle) return { error: "Fordonet hittades inte." };
  await db.jobVehicle.upsert({
    where: { jobId_vehicleId: { jobId, vehicleId } },
    create: { jobId, vehicleId },
    update: {},
  });
  revalidatePath(`/arbetsordrar/${jobId}`);
  revalidatePath("/planering");
  return { success: true };
}

export async function unlinkVehicle(jobId: string, vehicleId: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const job = await jobInOrg(jobId, guard.organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };
  await db.jobVehicle.deleteMany({ where: { jobId, vehicleId } });
  revalidatePath(`/arbetsordrar/${jobId}`);
  revalidatePath("/planering");
  return { success: true };
}

export async function addPart(formData: FormData): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;

  const jobId = String(formData.get("jobId") ?? "");
  const job = await jobInOrg(jobId, guard.organizationId);
  if (!job) return { error: "Arbetsordern hittades inte." };

  const title = str(formData.get("title"));
  if (!title) return { error: "Titel krävs." };

  const ore = krToOre(String(formData.get("priceExcl") ?? ""));
  if (ore === null) return { error: "Ange ett giltigt pris." };

  const quantity = Math.max(1, Number.parseInt(String(formData.get("quantity") ?? "1"), 10) || 1);
  const vatRate = Number.parseInt(String(formData.get("vatRate") ?? "25"), 10);
  const dateRaw = str(formData.get("purchaseDate"));
  const purchaseDate = dateRaw ? new Date(dateRaw) : new Date();

  await db.jobPart.create({
    data: {
      jobId,
      title,
      quantity,
      unitPriceExclOre: ore,
      vatRate: VALID_VAT.includes(vatRate) ? vatRate : 25,
      purchaseDate: Number.isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate,
    },
  });

  revalidatePath(`/arbetsordrar/${jobId}`);
  return { success: true };
}

export async function removePart(partId: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const part = await db.jobPart.findFirst({
    where: { id: partId, job: { organizationId: guard.organizationId } },
  });
  if (!part) return { error: "Raden hittades inte." };
  await db.jobPart.delete({ where: { id: partId } });
  revalidatePath(`/arbetsordrar/${part.jobId}`);
  return { success: true };
}

// ------------------------------------------------------------------ //
//  Bilder (bilagor) på arbetsordrar
// ------------------------------------------------------------------ //

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
// Serversidig säkerhetsmarginal; body-gränsen i next.config gör grovsållningen.
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Revaliderar profilsidorna som påverkas av en arbetsorderbild: de kopplade
 * fordonen och de kunder som äger dem (bilden är en bilaga på båda).
 */
async function revalidateImageTargets(vehicleIds: string[]) {
  for (const vehicleId of vehicleIds) {
    revalidatePath(`/fordon/${vehicleId}`);
  }
  if (vehicleIds.length) {
    const links = await db.customerVehicle.findMany({
      where: { vehicleId: { in: vehicleIds } },
      select: { customerId: true },
    });
    for (const customerId of new Set(links.map((l) => l.customerId))) {
      revalidatePath(`/kunder/${customerId}`);
    }
  }
}

/**
 * Laddar upp en bild på en arbetsorder. Bilden länkas till valda fordon på
 * ordern (förvalt alla) och blir därigenom synlig som bilaga på både fordons-
 * och kundprofilen. Filen sparas via lagringsabstraktionen; endast metadata och
 * lagringsnyckeln hamnar i databasen.
 */
export async function uploadWorkOrderImage(
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;
  const session = await getSession();

  const jobId = String(formData.get("jobId") ?? "");
  const job = await db.job.findFirst({
    where: { id: jobId, organizationId: guard.organizationId },
    include: { vehicles: { select: { vehicleId: true } } },
  });
  if (!job) return { error: "Arbetsordern hittades inte." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Ingen bild vald." };
  }
  if (!IMAGE_EXT[file.type]) {
    return { error: "Filtypen stöds inte. Ladda upp en bild (JPEG, PNG eller WebP)." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Bilden är för stor. Max 15 MB." };
  }

  // Vilka fordon bilden avser: valda som tillhör ordern, annars alla på ordern.
  const orderVehicleIds = new Set(job.vehicles.map((v) => v.vehicleId));
  const requested = formData
    .getAll("vehicleIds")
    .map((v) => String(v))
    .filter((v) => orderVehicleIds.has(v));
  const vehicleIds = requested.length
    ? requested
    : [...orderVehicleIds];

  const bytes = new Uint8Array(await file.arrayBuffer());
  const storageKey = await storage.save(bytes, { ext: IMAGE_EXT[file.type] });

  const image = await db.workOrderImage.create({
    data: {
      organizationId: guard.organizationId,
      jobId,
      storageKey,
      fileName: str(formData.get("fileName")) ?? file.name ?? "bild.jpg",
      mimeType: file.type,
      sizeBytes: file.size,
      caption: str(formData.get("caption")),
      uploadedByName: session?.user.name ?? null,
      vehicles: {
        create: vehicleIds.map((vehicleId) => ({ vehicleId })),
      },
    },
  });

  await recordAudit({
    action: "job.image.upload",
    category: "job",
    summary: `Laddade upp en bild på arbetsordern ${job.type}`,
    organizationId: guard.organizationId,
    entityType: "job",
    entityId: jobId,
  });

  revalidatePath(`/arbetsordrar/${jobId}`);
  await revalidateImageTargets(vehicleIds);
  return { success: true, id: image.id };
}

/** Tar bort en arbetsorderbild (både databaspost och lagrad fil). */
export async function deleteWorkOrderImage(id: string): Promise<ActionResult> {
  const guard = await requireOrg();
  if ("error" in guard) return guard;

  const image = await db.workOrderImage.findFirst({
    where: { id, organizationId: guard.organizationId },
    include: { vehicles: { select: { vehicleId: true } } },
  });
  if (!image) return { error: "Bilden hittades inte." };

  await db.workOrderImage.delete({ where: { id } });
  await storage.delete(image.storageKey);

  await recordAudit({
    action: "job.image.delete",
    category: "job",
    summary: "Tog bort en bild från en arbetsorder",
    organizationId: guard.organizationId,
    entityType: "job",
    entityId: image.jobId,
  });

  revalidatePath(`/arbetsordrar/${image.jobId}`);
  await revalidateImageTargets(image.vehicles.map((v) => v.vehicleId));
  return { success: true };
}
