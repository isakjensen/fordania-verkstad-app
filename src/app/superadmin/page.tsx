import { SuperBanner } from "@/components/superadmin/page-banner";
import { PlatformStats } from "@/components/superadmin/platform-stats";
import { TenantTable } from "@/components/superadmin/tenant-table";

export default function SuperadminOverviewPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Plattform"
        title="Översikt"
        description="Status för alla kunder som använder Fordania Verkstad – intäkter, användare och aktivitet."
      />
      <PlatformStats />
      <TenantTable
        title="Senaste kunder"
        subtitle="De senast aktiva företagen"
        limit={5}
        showToolbar={false}
      />
    </div>
  );
}
