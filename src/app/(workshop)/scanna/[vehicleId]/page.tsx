import { notFound } from "next/navigation";
import { requireActiveOrganizationId } from "@/lib/session";
import { getScanVehicle } from "@/lib/data/scan";
import { ScanResult } from "@/components/scan/scan-result";

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  // Saknad session/verkstad är inte samma sak som "fordonet finns inte" –
  // då ska man till inloggningen, inte mötas av en 404 på ett fordon man
  // just skapat.
  const organizationId = await requireActiveOrganizationId();
  const vehicle = await getScanVehicle(vehicleId, organizationId);

  if (!vehicle) notFound();

  return <ScanResult vehicle={vehicle} />;
}
