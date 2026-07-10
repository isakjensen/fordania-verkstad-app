import { cn } from "@/lib/utils";

interface LogoProps {
  /** Visa bara den kompakta symbolen (för hopfälld meny) */
  iconOnly?: boolean;
  /** "md" i sidomenyn, "lg" på t.ex. inloggningssidan */
  size?: "md" | "lg";
  /** "brand" (mörkt ordmärke på ljus botten) eller "light" (för mörk skena) */
  tone?: "brand" | "light";
  /** Visa F-monogrammet bredvid ordmärket (för sidomenyns sidhuvud) */
  showMark?: boolean;
  className?: string;
}

const sizeStyles = {
  md: {
    container: "items-start",
    brand: "text-[1.2rem]",
    sub: "mt-1 text-[0.62rem] tracking-[0.24em]",
  },
  lg: {
    // Centrerad lockup: "VERKSTAD" centrerad under "Fordania".
    // pl kompenserar tracking-mellanrummet efter sista bokstaven så
    // ordet blir optiskt centrerat.
    container: "items-center text-center",
    brand: "text-[2.1rem]",
    sub: "mt-1.5 pl-[0.42em] text-[0.8rem] tracking-[0.42em]",
  },
};

/** Fordanias F-monogram – rundad varumärkesblå bricka med vitt "F". */
function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-600 shadow-[0_2px_6px_-1px_rgb(26_100_189/0.45)]",
        className,
      )}
    >
      <span className="text-base font-extrabold tracking-tight text-white">
        F
      </span>
    </span>
  );
}

/**
 * Fordania-ordmärke. I linje med Fordanias egen logotyp är detta ren
 * typografi – "Fordania" i varumärkesblått med "Verkstad" som produktnamn.
 * Med `showMark` visas F-monogrammet bredvid; i hopfällt läge visas bara det.
 */
export function Logo({
  iconOnly = false,
  size = "md",
  tone = "brand",
  showMark = false,
  className,
}: LogoProps) {
  if (iconOnly) {
    return <Monogram className={className} />;
  }

  const s = sizeStyles[size];
  const light = tone === "light";

  const wordmark = (extra?: string) => (
    <div className={cn("flex flex-col leading-none", s.container, extra)}>
      <span
        className={cn(
          "font-extrabold tracking-[-0.02em]",
          s.brand,
          light ? "text-white" : "text-brand-600",
        )}
      >
        Fordania
      </span>
      <span
        className={cn(
          "font-semibold uppercase",
          s.sub,
          light ? "text-brand-300/90" : "text-ink-soft/70",
        )}
      >
        Verkstad
      </span>
    </div>
  );

  if (showMark) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <Monogram />
        {wordmark()}
      </div>
    );
  }

  return wordmark(className);
}
