import { SuperBanner } from "@/components/superadmin/page-banner";
import { PlatformStats } from "@/components/superadmin/platform-stats";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { getTenants, getPlatformStats } from "@/lib/data/platform";

export default async function SuperadminOverviewPage() {
  const [tenants, stats] = await Promise.all([
    getTenants(5),
    getPlatformStats(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Plattform"
        title="Översikt"
        description="Status för alla kunder som använder Fordania Verkstad – företag, användare och fordon."
      />
      <PlatformStats stats={stats} />
      <TenantTable
        tenants={tenants}
        title="Senaste kunder"
        subtitle="De senast skapade företagen"
        showToolbar={false}
      />
    </div>
  );
}
