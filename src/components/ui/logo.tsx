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
  md: "h-10", // sidomenyns sidhuvud
  lg: "h-20", // inloggnings-/offline-sidan
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
 * Fordania-loggan (`public/fordania-verkstad-logo-transparent.png`) – ordmärket
 * med bortnyckelad bakgrund, så det sitter rent på både sidomenyns gradient och
 * login-sidan. Originalet (`fordania-verkstad-logo.png`) ligger kvar orört.
 *
 * I hopfällt läge (`iconOnly`) visas i stället det kompakta F-monogrammet
 * eftersom det breda ordmärket inte får plats i den smala menyskenan.
 */
export function Logo({ iconOnly = false, size = "md", className }: LogoProps) {
  if (iconOnly) {
    return <Monogram className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/fordania-verkstad-logo-transparent.png"
      alt="Fordania Verkstad"
      width={1572}
      height={452}
      className={cn("w-auto select-none", heights[size], className)}
    />
  );
}
