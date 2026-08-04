import { cn } from "@/lib/utils";
import type { PlateCountry } from "@/lib/plate-ocr";

/** Läsbart namn – används som etikett för skärmläsare. */
export const COUNTRY_NAME: Record<PlateCountry, string> = {
  SE: "Svensk skylt",
  AL: "Albansk skylt",
  DK: "Dansk skylt",
  DE: "Tysk skylt",
};

/**
 * Flaggan för de länder vars skyltar skannern läser.
 *
 * Riktiga flaggfiler (`public/flags/`), inte handritade: den albanska örnen
 * och det svenska korsets proportioner går inte att teckna av på fri hand utan
 * att det syns. Filerna kommer från flag-icons (MIT) – se public/flags/KALLA.md.
 *
 * `img` i stället för inline-SVG: filerna cachas av webbläsaren och ligger
 * utanför JS-paketet. Örnen ensam är 3 kB.
 */
export function CountryFlag({
  country,
  className,
}: {
  country: PlateCountry;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country.toLowerCase()}.svg`}
      alt={COUNTRY_NAME[country]}
      width={24}
      height={18}
      className={cn(
        // Hårlinjen gör att vita fält (danska korset, tyska guldet) inte
        // flyter ut i ljusa underlag.
        "h-3 w-4 shrink-0 rounded-[2px] object-cover ring-1 ring-black/20",
        className,
      )}
    />
  );
}
