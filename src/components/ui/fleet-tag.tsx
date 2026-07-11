import { cn } from "@/lib/utils";

/**
 * Markerar om ett fordon tillhör den egna uthyrningsflottan (Intern) eller
 * en extern kund som bokat in sig i verkstaden (Extern). Härleds från om
 * fordonet är kopplat till en kund eller inte.
 */
export function FleetTag({
  internal,
  className,
}: {
  internal: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.07em] ring-1 ring-inset",
        internal
          ? "bg-surface text-muted-foreground ring-line-strong"
          : "bg-brand-50 text-brand-700 ring-brand-200",
        className,
      )}
      title={
        internal
          ? "Internt fordon – egen uthyrningsflotta"
          : "Externt fordon – kund som bokat verkstaden"
      }
    >
      {internal ? "Intern" : "Extern"}
    </span>
  );
}
