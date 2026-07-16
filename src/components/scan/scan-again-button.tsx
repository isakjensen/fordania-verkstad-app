"use client";

import { ArrowLeft } from "lucide-react";

/** Öppnar skanner-overlayn igen från fordonsvyn efter en träff. */
export function ScanAgainButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("fv:open-scanner"))}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground active:text-ink"
    >
      <ArrowLeft className="size-4.5" />
      Skanna igen
    </button>
  );
}
