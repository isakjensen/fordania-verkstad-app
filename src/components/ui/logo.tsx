import { cn } from "@/lib/utils";

interface LogoProps {
  /** Visa bara den kompakta symbolen (för hopfälld meny) */
  iconOnly?: boolean;
  /** "md" i sidomenyn, "lg" på t.ex. inloggningssidan */
  size?: "md" | "lg";
  className?: string;
}

const sizeStyles = {
  md: {
    container: "items-start",
    brand: "text-[1.2rem]",
    sub: "mt-1 text-[0.64rem] tracking-[0.22em] text-muted-foreground",
  },
  lg: {
    // Centrerad lockup: "VERKSTAD" centrerad under "Fordania".
    // pl kompenserar tracking-mellanrummet efter sista bokstaven så
    // ordet blir optiskt centrerat.
    container: "items-center text-center",
    brand: "text-[2.1rem]",
    sub: "mt-1.5 pl-[0.42em] text-[0.8rem] tracking-[0.42em] text-ink-soft",
  },
};

/**
 * Fordania-ordmärke. I linje med Fordanias egen logotyp är detta ren
 * typografi – "Fordania" i varumärkesblått med "Verkstad" som produktnamn.
 * Endast i hopfällt läge visas en kompakt monogram-symbol.
 */
export function Logo({ iconOnly = false, size = "md", className }: LogoProps) {
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

  const s = sizeStyles[size];
  return (
    <div className={cn("flex flex-col leading-none", s.container, className)}>
      <span
        className={cn(
          "font-extrabold tracking-[-0.02em] text-brand-600",
          s.brand,
        )}
      >
        Fordania
      </span>
      <span className={cn("font-semibold uppercase", s.sub)}>Verkstad</span>
    </div>
  );
}
