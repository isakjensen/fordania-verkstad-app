import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = {
  title: "Offline",
};

/**
 * Fallback-sida som service workern visar när en sida efterfrågas offline
 * och ingen sparad kopia finns. Fristående (utan app-skalet) så den kan
 * förhandscachas och renderas utan inloggning.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-canvas px-6 py-16 text-center">
      <Logo size="lg" />
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-8 shadow-card">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <CloudOff className="size-7" />
        </span>
        <h1 className="text-lg font-bold text-ink">Ingen anslutning</h1>
        <p className="text-sm text-muted-foreground">
          Den här sidan är inte sparad för offline-läge. Öppna en vy du redan
          har besökt för att se sparad data, eller anslut till internet igen.
        </p>
      </div>
    </main>
  );
}
