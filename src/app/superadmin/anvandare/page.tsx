import type { Metadata } from "next";
import { UserManager } from "@/components/superadmin/user-manager";
import { getPlatformUsers, getTenants } from "@/lib/data/platform";

export const metadata: Metadata = { title: "Användare · Superadmin" };

export default async function SuperadminUsersPage() {
  const [users, tenants] = await Promise.all([
    getPlatformUsers(),
    getTenants(),
  ]);

  return (
    <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
      <UserManager
        users={users}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
