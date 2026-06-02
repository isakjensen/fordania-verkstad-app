import type { Metadata } from "next";
import { Package } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Lager & delar" };

export default function Page() {
  return (
    <Placeholder
      icon={Package}
      title="Lager & delar"
      description="Håll koll på reservdelar, lagersaldo och beställningar kopplade till arbetsordrarna."
    />
  );
}
