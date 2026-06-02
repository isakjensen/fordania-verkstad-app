import type { Metadata } from "next";
import { Car } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Fordon" };

export default function Page() {
  return (
    <Placeholder
      icon={Car}
      title="Fordon"
      description="Översikt över hela uthyrningsflottan med status, servicehistorik och kommande underhåll."
    />
  );
}
