import type { Metadata } from "next";
import { SuperBanner } from "@/components/superadmin/page-banner";
import { TenantManager } from "@/components/superadmin/tenant-manager";
import { getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Företag · Superadmin" };

export default async function SuperadminCompaniesPage() {
  const tenants = await getTenants();

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Plattform"
        title="Företag"
        description="Alla företag som är anslutna till plattformen. Sök, filtrera, lägg till, ändra status eller ta bort konton."
      />
      <TenantManager tenants={tenants} />
    </div>
  );
}
