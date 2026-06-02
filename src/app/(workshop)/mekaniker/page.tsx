import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Mekaniker" };

export default function Page() {
  return (
    <Placeholder
      icon={Users}
      title="Mekaniker"
      description="Hantera teamet, scheman och beläggning för verkstadens mekaniker."
    />
  );
}
