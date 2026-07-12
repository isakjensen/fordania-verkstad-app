import { cn } from "@/lib/utils";

interface LogoProps {
  /** Visa bara den kompakta symbolen (för hopfälld meny) */
  iconOnly?: boolean;
  /** "md" i sidomenyn, "lg" på t.ex. inloggningssidan */
  size?: "md" | "lg";
  className?: string;
}

// Höjd per storlek – bredden följer bildens förhållande (~3:1) automatiskt.
const heights = {
  md: "h-12", // sidomenyns sidhuvud (lite större)
  lg: "h-20", // inloggnings-/offline-sidan
};

/** Fordanias F-monogram – rundad orange-guld bricka (loggans gradient) med
 *  marinblått "F", precis som loggans färgpar. */
function Monogram({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] brand-fill shadow-[0_2px_6px_-1px_rgb(224_122_13/0.45)]",
        className,
      )}
    >
      <span className="text-base font-extrabold tracking-tight">F</span>
    </span>
  );
}

/**
 * Fordania-loggan (`public/fordania-verkstad-logo.png`) – det nya ordmärket med
 * orange "VERKSTAD" och transparent bakgrund, så det sitter rent på både
 * sidomenyns gradient och login-sidan.
 *
 * I hopfällt läge (`iconOnly`) visas i stället det kompakta F-monogrammet
 * eftersom det breda ordmärket inte får plats i den smala menyskenan.
 */
export function Logo({ iconOnly = false, size = "md", className }: LogoProps) {
  if (iconOnly) {
    return <Monogram className={className} />;
  }

  // Två varianter: ordinarie (marinblå FORDANIA) för ljust läge, och en
  // ljus variant (varmvit FORDANIA) för mörkt läge – annars försvinner det
  // mörka ordmärket mot den svarta sidomenyn. Växlas via `.dark`-klassen.
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fordania-verkstad-logo.png"
        alt="Fordania Verkstad"
        width={1641}
        height={559}
        className={cn("w-auto select-none dark:hidden", heights[size], className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fordania-verkstad-logo-dark.png"
        alt="Fordania Verkstad"
        width={1641}
        height={559}
        className={cn("hidden w-auto select-none dark:block", heights[size], className)}
      />
    </>
  );
}
