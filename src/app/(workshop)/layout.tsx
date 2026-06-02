import { AppShell } from "@/components/layout/app-shell";

/**
 * Layout för verkstadsappen – det skal som en inloggad tenant-användare ser.
 * Superadmin-delen (/superadmin) har ett eget, separat skal.
 */
export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
