import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Markerar fordon som tillhör en EXTERN kund – alltså någon som bokat in sig
 * i verkstaden, till skillnad från den egna uthyrningsflottan.
 *
 * Interna fordon får ingen markering alls. De är normalfallet, och en etikett
 * på varje rad i en lista som mest består av egna fordon säger ingenting –
 * det är avvikelsen som är värd bläck. Därför en liten ikon i stället för en
 * textetikett: den läses på ett ögonkast bredvid registreringsskylten utan
 * att konkurrera med den.
 */
export function FleetTag({
  internal,
  className,
}: {
  internal: boolean;
  className?: string;
}) {
  if (internal) return null;

  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset",
        className,
      )}
      title="Externt fordon – kund som bokat verkstaden"
    >
      <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden />
      <span className="sr-only">Externt fordon</span>
    </span>
  );
}
