import { AppShell } from "@/components/layout/app-shell";
import { PresencePing } from "@/components/layout/presence-ping";
import { requireUser } from "@/lib/session";
import { touchPresence } from "@/lib/presence";
import { getSwitcherData } from "@/lib/data/tenant-context";

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
  const session = await requireUser();
  await touchPresence(session.user.id);
  const switcher = await getSwitcherData();
  return (
    <>
      <PresencePing />
      <AppShell switcher={switcher}>{children}</AppShell>
    </>
  );
}
