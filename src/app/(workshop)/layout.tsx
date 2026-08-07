import { after } from "next/server";
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
  // Närvarostämpeln är en DB-skrivning som ingen väntar på. Awaitad här låg
  // den mitt i kedjan som måste bli klar innan skalet ens börjar streama, och
  // förlängde varje sidladdning. `after` kör den när svaret redan gått iväg.
  after(() => touchPresence(session.user.id));
  const switcher = await getSwitcherData();
  return (
    <>
      <PresencePing />
      <AppShell switcher={switcher}>{children}</AppShell>
    </>
  );
}
