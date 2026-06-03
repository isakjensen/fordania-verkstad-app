import { getActiveOrganizationId } from "@/lib/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { Dashboard } from "@/components/dashboard/dashboard";

export default async function Home() {
  const organizationId = await getActiveOrganizationId();
  const data = organizationId ? await getDashboardData(organizationId) : null;
  return <Dashboard data={data} hasOrg={!!organizationId} />;
}
