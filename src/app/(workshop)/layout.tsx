import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/session";

/**
 * Layout för verkstadsappen – det skal som en inloggad tenant-användare ser.
 * Superadmin-delen (/superadmin) har ett eget, separat skal.
 */
export default async function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kräver inloggad användare
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
