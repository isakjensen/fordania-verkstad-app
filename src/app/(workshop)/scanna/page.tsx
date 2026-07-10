import { getActiveOrganizationId } from "@/lib/session";
import { getFleetForScan } from "@/lib/data/scan";
import { PlateScanner } from "@/components/scan/plate-scanner";

export default async function ScanPage() {
  const organizationId = await getActiveOrganizationId();
  const fleet = organizationId ? await getFleetForScan(organizationId) : [];

  return <PlateScanner fleet={fleet} />;
}
