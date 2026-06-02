import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Inställningar" };

export default function Page() {
  return (
    <Placeholder
      icon={Settings}
      title="Inställningar"
      description="Anpassa verkstaden, användare, roller och systeminställningar."
    />
  );
}
