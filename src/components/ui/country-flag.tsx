import { cn } from "@/lib/utils";
import type { PlateCountry } from "@/lib/plate-ocr";

/** Ena halvan av örnen: huvud, näbb, hals och vinge. Speglas för andra sidan. */
function EagleHalf() {
  return (
    <>
      <circle cx="8.1" cy="5.3" r="1.8" />
      {/* Näbben pekar utåt – det är den som gör fågeln till en örn */}
      <path d="M6.9 4.1 L3.4 3.0 L6.4 6.0 Z" />
      {/* Halsen ner mot kroppen. Den stannar strax före mitten, så det blir
          en tydlig V-glipa mellan de två huvudena i stället för en klump. */}
      <path d="M9.4 6.7 L11.3 11.4 L9.9 11.9 L7.6 7.7 Z" />
      {/* Vingen i tre fjädersteg, bred och nästan vågrät – det är bredden som
          gör att silhuetten läses som en örn och inte som en fladdermus. */}
      <path
        d="M11.3 10.9 C8.4 9.7 4.9 9.9 1.5 11.0 C3.9 11.5 5.3 12.0 6.3 12.7
           C4.9 12.9 3.7 13.3 2.5 14.1 C4.9 14.3 6.4 14.7 7.4 15.5
           C6.3 15.9 5.4 16.5 4.6 17.4 C7.0 16.8 8.9 16.9 10.3 17.6
           L11.3 14.3 Z"
      />
    </>
  );
}

/**
 * Den albanska dubbelörnen som en enkel silhuett.
 *
 * Riksvapnets örn är full av fjäderdetaljer som blir gyttja i 12 px. Den här
 * är nedkokad till det som bär igenkänningen: två huvuden med näbbar utåt,
 * halsar med en glipa emellan, vingar i tre fjädersteg och en kluven stjärt.
 * Ritad symmetriskt kring x = 12 i en 24×24-ruta, så den kan användas både
 * svart på rött (flaggan) och vit på blått (skyltens landsband).
 */
export function AlbanianEagle({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <EagleHalf />
      <g transform="translate(24,0) scale(-1,1)">
        <EagleHalf />
      </g>
      {/* Kropp och kluven stjärt */}
      <path d="M10.85 12.6 H13.15 L12.7 19.2 L12 20.8 L11.3 19.2 Z" />
    </g>
  );
}

/** Läsbart namn – används som etikett för skärmläsare. */
export const COUNTRY_NAME: Record<PlateCountry, string> = {
  SE: "Svensk skylt",
  AL: "Albansk skylt",
  DK: "Dansk skylt",
  DE: "Tysk skylt",
};

/** Det nordiska korset: samma geometri för Sverige och Danmark. */
function NordicCross({ field, cross }: { field: string; cross: string }) {
  return (
    <>
      <rect width="24" height="16" fill={field} />
      <rect x="8" y="0" width="3.5" height="16" fill={cross} />
      <rect x="0" y="6.25" width="24" height="3.5" fill={cross} />
    </>
  );
}

/**
 * Liten flagga för de länder vars skyltar skannern läser. Ritad som SVG i
 * stället för flagg-emoji: emojin ser helt olika ut på iOS, Android och
 * Windows – och på Windows blir den bara två bokstäver.
 */
export function CountryFlag({
  country,
  className,
}: {
  country: PlateCountry;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 16"
      role="img"
      aria-label={COUNTRY_NAME[country]}
      className={cn(
        // Hårlinjen gör att vita fält (danska korset, tyska guldet) inte
        // flyter ut i ljusa underlag.
        "h-3 w-[1.125rem] shrink-0 rounded-[2px] ring-1 ring-black/20",
        className,
      )}
    >
      {country === "SE" ? (
        <NordicCross field="#006AA7" cross="#FECC02" />
      ) : country === "DK" ? (
        <NordicCross field="#C8102E" cross="#FFFFFF" />
      ) : country === "DE" ? (
        <>
          <rect width="24" height="5.34" fill="#000000" />
          <rect y="5.34" width="24" height="5.33" fill="#DD0000" />
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </>
      ) : (
        <>
          <rect width="24" height="16" fill="#E41E20" />
          {/* Örnen ritas i 24×24-rymden – skala ner och centrera i 24×16. */}
          <g transform="translate(3.6 0.4) scale(0.7)">
            <AlbanianEagle fill="#000000" />
          </g>
        </>
      )}
    </svg>
  );
}
