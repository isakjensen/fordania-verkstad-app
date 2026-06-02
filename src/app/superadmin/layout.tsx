import type { Metadata } from "next";
import { SuperAdminShell } from "@/components/superadmin/superadmin-shell";
import { requireSuperadmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Superadmin",
};

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Endast global superadmin släpps in – övriga skickas till verkstaden
  await requireSuperadmin();
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
