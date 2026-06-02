import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Planering" };

export default function Page() {
  return (
    <Placeholder
      icon={CalendarRange}
      title="Planering"
      description="Här planerar du in jobb på mekaniker och tidsluckor i en tidslinje med dra-och-släpp. Vyn byggs i nästa steg."
    />
  );
}
