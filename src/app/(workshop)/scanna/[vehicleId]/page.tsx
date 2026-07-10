import { notFound } from "next/navigation";
import { getActiveOrganizationId } from "@/lib/session";
import { getScanVehicle } from "@/lib/data/scan";
import { ScanResult } from "@/components/scan/scan-result";

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const organizationId = await getActiveOrganizationId();
  const vehicle = organizationId
    ? await getScanVehicle(vehicleId, organizationId)
    : null;

  if (!vehicle) notFound();

  return <ScanResult vehicle={vehicle} />;
}
