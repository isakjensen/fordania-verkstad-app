import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Placeholder } from "@/components/layout/placeholder";

export const metadata: Metadata = { title: "Rapporter" };

export default function Page() {
  return (
    <Placeholder
      icon={BarChart3}
      title="Rapporter"
      description="Nyckeltal, ledtider och uppföljning av verkstadens arbete över tid."
    />
  );
}
