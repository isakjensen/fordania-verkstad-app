import type { Metadata } from "next";
import { SuperBanner } from "@/components/superadmin/page-banner";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { PlatformStats } from "@/components/superadmin/platform-stats";
import { getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Företag · Superadmin" };

export default async function SuperadminCompaniesPage() {
  const tenants = await getTenants();

  const totalUsers = tenants.reduce((sum, t) => sum + t.users, 0);
  const totalVehicles = tenants.reduce((sum, t) => sum + t.vehicles, 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Företag"
        title="Hantera företag"
        description="Alla företag som är anslutna till plattformen. Lägg till nya, redigera uppgifter, byt plan eller ta bort konton."
      />
      <PlatformStats
        tenants={tenants.length}
        users={totalUsers}
        vehicles={totalVehicles}
      />
      <TenantTable tenants={tenants} title="Alla företag" />
    </div>
  );
}
