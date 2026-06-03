"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Tillbaka-knapp för detaljsidor. Går tillbaka dit användaren faktiskt kom
 * ifrån (t.ex. en kund man öppnade fordonet från) i stället för att alltid
 * tvinga tillbaka till listan. Landar man direkt på sidan – utan historik
 * inom appen – används `fallbackHref` (listan) i stället.
 */
export function BackButton({
  fallbackHref,
  label = "Tillbaka",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  function onClick() {
    // Finns det historik att gå tillbaka till går vi dit användaren faktiskt
    // kom ifrån; annars (t.ex. direktladdad sida) till listan.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
