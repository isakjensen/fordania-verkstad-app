import type { Metadata } from "next";
import { SuperAdminShell } from "@/components/superadmin/superadmin-shell";
import { PresencePing } from "@/components/layout/presence-ping";
import { requireSuperadmin } from "@/lib/session";
import { touchPresence } from "@/lib/presence";
import { getSwitcherData } from "@/lib/data/tenant-context";

export const metadata: Metadata = {
  title: "Superadmin",
};

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Endast global superadmin släpps in – övriga skickas till verkstaden
  const session = await requireSuperadmin();
  await touchPresence(session.user.id);
  const switcher = await getSwitcherData();
  return (
    <>
      <PresencePing />
      <SuperAdminShell switcher={switcher}>{children}</SuperAdminShell>
    </>
  );
}
