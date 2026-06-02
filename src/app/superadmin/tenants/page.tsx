import type { Metadata } from "next";
import { SuperBanner } from "@/components/superadmin/page-banner";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Kunder · Superadmin" };

export default async function SuperadminTenantsPage() {
  const tenants = await getTenants();

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Kunder"
        title="Hantera kunder"
        description="Alla företag (tenants) som är anslutna till plattformen. Lägg till nya, byt plan eller pausa konton."
      />
      <TenantTable tenants={tenants} title="Alla kunder" />
    </div>
  );
}
