import type { Metadata } from "next";
import { SuperAdminShell } from "@/components/superadmin/superadmin-shell";

export const metadata: Metadata = {
  title: "Superadmin",
};

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
