import type { Metadata } from "next";
import { SuperBanner } from "@/components/superadmin/page-banner";
import { UserManager } from "@/components/superadmin/user-manager";
import { getPlatformUsers, getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Användare · Superadmin" };

export default async function SuperadminUsersPage() {
  const [users, tenants] = await Promise.all([
    getPlatformUsers(),
    getTenants(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Plattform"
        title="Användare"
        description="Alla användare över samtliga företag. Sök, filtrera per företag, lägg till, ändra roll/status eller ta bort."
      />
      <UserManager
        users={users}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
