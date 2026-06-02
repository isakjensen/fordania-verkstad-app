import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Arbetsordrar" };

export default function Page() {
  return (
    <Placeholder
      icon={ClipboardList}
      title="Arbetsordrar"
      description="Skapa, följ och hantera arbetsordrar för varje fordon – från inlämning till klar bil."
    />
  );
}
