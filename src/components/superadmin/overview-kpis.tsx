"use client";

import { Building2, Users, Car, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

/** KPI-band på superadmins översikt – tappbara genvägar. */
export function OverviewKpis({
  tenants,
  activeTenants,
  users,
  vehicles,
  jobs,
}: {
  tenants: number;
  activeTenants: number;
  users: number;
  vehicles: number;
  jobs: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <StatCard
        icon={Building2}
        label="Anslutna företag"
        value={tenants}
        hint={`${activeTenants} aktiva`}
        tone="brand"
        href="/superadmin/foretag"
      />
      <StatCard
        icon={Users}
        label="Användare totalt"
        value={users}
        hint="Över alla företag"
        tone="violet"
        href="/superadmin/anvandare"
      />
      <StatCard
        icon={Car}
        label="Fordon totalt"
        value={vehicles}
        hint="I alla fordonsregister"
        tone="success"
      />
      <StatCard
        icon={ClipboardList}
        label="Arbetsordrar"
        value={jobs}
        hint="Totalt på plattformen"
        tone="warning"
      />
    </div>
  );
}
