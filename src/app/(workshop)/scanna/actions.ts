"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, getActiveOrganizationId } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { normalizePlate } from "@/lib/plate-ocr";
import { getFleetForScan, type ScanFleetVehicle } from "@/lib/data/scan";

/**
 * Hämtar den lätta fordonslistan som skannern matchar mot. Anropas från
 * klienten när skanner-overlayn öppnas, så kameran kan starta direkt medan
 * flottan laddas i bakgrunden.
 */
export async function getScanFleet(): Promise<ScanFleetVehicle[]> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) return [];
  return getFleetForScan(organizationId);
}

export type AddScannedResult =
  | { success: true; vehicleId: string; created: boolean }
  | { error: string };

/**
 * Skapar ett fordon utifrån en avläst registreringsskylt (från skannern) och
 * returnerar dess id så klienten kan öppna det direkt. Övriga uppgifter
 * (märke, modell m.m.) fylls i efteråt på fordonssidan.
 *
 * Finns redan ett aktivt fordon med samma reg.nr återanvänds det i stället
 * för att skapa en dubblett.
 */
export async function addScannedVehicle(
  rawRegNo: string,
): Promise<AddScannedResult> {
  await requireUser();
  const organizationId = await getActiveOrganizationId();
  if (!organizationId) {
    return { error: "Du tillhör ingen verkstad – välj en verkstad först." };
  }

  const regNo = normalizePlate(rawRegNo);
  if (!regNo) return { error: "Ogiltigt registreringsnummer." };

  // Redan i registret? Öppna det befintliga i stället för att dubblera.
  const existing = await db.vehicle.findFirst({
    where: { organizationId, regNo, deletedAt: null },
    select: { id: true },
  });
  if (existing) {
    return { success: true, vehicleId: existing.id, created: false };
  }

  const created = await db.vehicle.create({
    data: { organizationId, regNo },
    select: { id: true },
  });

  await recordAudit({
    action: "vehicle.create",
    category: "vehicle",
    summary: `Lade till fordonet ${regNo} via skanning`,
    organizationId,
    entityType: "vehicle",
    entityId: created.id,
  });

  revalidatePath("/fordon");
  return { success: true, vehicleId: created.id, created: true };
}
