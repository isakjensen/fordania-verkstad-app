import "server-only";
import { db } from "@/lib/db";
import type { AttachmentImage } from "@/components/attachments/attachment-gallery";

const imageInclude = {
  job: { select: { id: true, type: true } },
  vehicles: { include: { vehicle: { select: { regNo: true } } } },
} as const;

type ImageRow = Awaited<
  ReturnType<
    typeof db.workOrderImage.findMany<{ include: typeof imageInclude }>
  >
>[number];

function toAttachment(img: ImageRow): AttachmentImage {
  return {
    id: img.id,
    caption: img.caption,
    fileName: img.fileName,
    createdAt: img.createdAt.toISOString(),
    uploadedByName: img.uploadedByName,
    workOrderId: img.job.id,
    workOrderRef: `#${img.job.id.slice(-6).toUpperCase()}`,
    workOrderType: img.job.type,
    vehicleLabels: img.vehicles.map((v) => v.vehicle.regNo),
  };
}

/**
 * Alla arbetsorderbilder som är kopplade till ett fordon som kunden äger.
 * Bilden länkas till fordon på arbetsordern; via fordonet syns den på kunden.
 * Scopas på organizationId (tenant-isolering).
 */
export async function getCustomerImages(
  customerId: string,
  organizationId: string,
): Promise<AttachmentImage[]> {
  const rows = await db.workOrderImage.findMany({
    where: {
      organizationId,
      vehicles: {
        some: { vehicle: { customers: { some: { customerId } } } },
      },
    },
    orderBy: { createdAt: "desc" },
    include: imageInclude,
  });
  return rows.map(toAttachment);
}

/** Alla arbetsorderbilder som avser ett specifikt fordon. */
export async function getVehicleImages(
  vehicleId: string,
  organizationId: string,
): Promise<AttachmentImage[]> {
  const rows = await db.workOrderImage.findMany({
    where: {
      organizationId,
      vehicles: { some: { vehicleId } },
    },
    orderBy: { createdAt: "desc" },
    include: imageInclude,
  });
  return rows.map(toAttachment);
}
