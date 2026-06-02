import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { SuperBanner } from "@/components/superadmin/page-banner";

export const metadata: Metadata = { title: "Inställningar · Superadmin" };

export default function SuperadminSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <SuperBanner
        eyebrow="Inställningar"
        title="Plattformsinställningar"
        description="Global konfiguration för Fordania-plattformen. Byggs i nästa steg."
      />
      <div className="flex animate-fade-up flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Settings2 className="size-6" />
        </span>
        <p className="mt-5 text-lg font-bold text-ink">Inställningar kommer snart</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          Global konfiguration, roller och säkerhet för hela plattformen.
        </p>
      </div>
    </div>
  );
}
