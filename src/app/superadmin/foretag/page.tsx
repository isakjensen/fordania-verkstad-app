import type { Metadata } from "next";
import { TenantManager } from "@/components/superadmin/tenant-manager";
import { getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Företag · Superadmin" };

export default async function SuperadminCompaniesPage() {
  const tenants = await getTenants();

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <TenantManager tenants={tenants} />
    </div>
  );
}
