import type { Metadata } from "next";
import { SuperBanner } from "@/components/superadmin/page-banner";
import { UserTable } from "@/components/superadmin/user-table";

export const metadata: Metadata = { title: "Användare · Superadmin" };

export default function SuperadminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Användare"
        title="Alla användare"
        description="Användare över samtliga tenants. Varje tenant kan ha flera användare med olika roller och behörigheter."
      />
      <UserTable />
    </div>
  );
}
