import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Hjälp & support" };

export default function Page() {
  return (
    <Placeholder
      icon={HelpCircle}
      title="Hjälp & support"
      description="Guider, vanliga frågor och kontakt till Fordanias support."
    />
  );
}
