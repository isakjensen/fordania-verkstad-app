import { cn } from "@/lib/utils";

interface LogoProps {
  /** Visa bara den kompakta symbolen (för hopfälld meny) */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Fordania-ordmärke. I linje med Fordanias egen logotyp är detta ren
 * typografi – "Fordania" i varumärkesblått med "Verkstad" som produktnamn.
 * Endast i hopfällt läge visas en kompakt monogram-symbol.
 */
export function Logo({ iconOnly = false, className }: LogoProps) {
  if (iconOnly) {
    return (
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-[10px] bg-brand-600",
          className,
        )}
      >
        <span className="text-base font-extrabold tracking-tight text-white">
          F
        </span>
      </span>
    );
  }

  return (
    <div className={cn("flex flex-col leading-none", className)}>
      <span className="text-[1.2rem] font-extrabold tracking-[-0.02em] text-brand-600">
        Fordania
      </span>
      <span className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-muted">
        Verkstad
      </span>
    </div>
  );
}
