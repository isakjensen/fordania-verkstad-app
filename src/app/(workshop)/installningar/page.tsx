import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Inställningar" };

export default function SettingsPage() {
  return (
    <Placeholder
      icon={Settings}
      title="Inställningar"
      description="Anpassa verkstadens uppgifter, behörigheter och hur registren fungerar."
    />
  );
}
