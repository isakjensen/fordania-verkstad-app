import { cn } from "@/lib/utils";
import { formatPlate, plateCountry, type PlateCountry } from "@/lib/plate-ocr";
import { AlbanianEagle } from "./country-flag";

/** Landskoden längst ner i skyltens band. */
const COUNTRY_CODE: Record<PlateCountry, string> = {
  SE: "S",
  AL: "AL",
  DK: "DK",
  DE: "D",
};

/**
 * Svensk registreringsskylt – vit platta med svart text, mörk ram och det
 * blå EU-bandet med tolv gula stjärnor i ring och landskoden "S".
 * Skalas konsekvent via `size` (sm/md/lg) så den ser skarp ut överallt.
 */

// En femuddig stjärna som SVG-path, centrerad på (cx, cy).
function star(cx: number, cy: number, outer: number, inner: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)},${(
      cy +
      r * Math.sin(a)
    ).toFixed(2)}`;
  }
  return `${d}Z`;
}

// Tolv stjärnor jämnt fördelade i en cirkel (EU-emblemet).
const euStars = Array.from({ length: 12 }).map((_, i) => {
  const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
  return star(11 + 5.4 * Math.cos(a), 7 + 5.4 * Math.sin(a), 1.5, 0.62);
});

type PlateSize = "sm" | "md" | "lg";

const sizes: Record<
  PlateSize,
  {
    plate: string;
    band: string;
    svg: string;
    code: string;
    text: string;
  }
> = {
  sm: {
    plate: "h-6 rounded-[4px]",
    band: "w-[18px]",
    svg: "h-[11px] w-[13px]",
    code: "text-[6px]",
    text: "px-1.5 text-[0.78rem] tracking-[0.06em]",
  },
  md: {
    plate: "h-7 rounded-[5px]",
    band: "w-[22px]",
    svg: "h-[13px] w-[15px]",
    code: "text-[7px]",
    text: "px-2 text-[0.95rem] tracking-[0.07em]",
  },
  lg: {
    plate: "h-9 rounded-md",
    band: "w-[27px]",
    svg: "h-[16px] w-[19px]",
    code: "text-[8px]",
    text: "px-2.5 text-[1.1rem] tracking-[0.08em]",
  },
};

interface LicensePlateProps {
  value: string;
  size?: PlateSize;
  /** Tvinga ett land. Utelämnas det läses landet ur skyltens format. */
  country?: PlateCountry;
  className?: string;
}

export function LicensePlate({
  value,
  size = "md",
  country,
  className,
}: LicensePlateProps) {
  const s = sizes[size];
  // Landet läses ur skyltens format (AA 123 BB kontra ABC 12A kontra
  // AB 12 345), så skylten ser rätt ut överallt utan att fordonet behöver
  // bära ett extra fält i databasen.
  const land = country ?? plateCountry(value) ?? "SE";
  const albanian = land === "AL";
  return (
    <span
      className={cn(
        // shrink-0 → skylten trycks aldrig ihop av sin flex-container, så hela
        // registreringsnumret syns alltid (siblings får trunkeras i stället).
        // w-fit → skylten storleksanpassas efter innehållet och tänjs aldrig ut
        // till full bredd (t.ex. i en flex-kolumn med align-items: stretch).
        // Plattan har varken bakgrund eller kant: de två delarna målar hela
        // ytan själva. En bakgrund här sköt annars fram en hårfin ljus rand
        // utanför delarnas kanter i rundningarna – de smutsiga hörnen.
        "inline-flex w-fit shrink-0 select-none items-stretch",
        // Bara djupet ligger kvar på plattan. Skuggan följer hörnradien.
        "shadow-[0_1px_1px_rgba(15,23,41,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)]",
        s.plate,
        className,
      )}
    >
      {/* Landsbandet. Alla fyra länderna har samma blå band med ett märke
          överst och landskoden under – det är bara märket och koden som
          skiljer. Albanien har dubbelörnen i vitt i stället för EU:s
          stjärnkrans (deras skyltar är blå på samma sätt, inte röda). */}
      <span
        className={cn(
          // En enda solid blå i stället för gradient. I mörkt läge en aning
          // ljusare blå, annars sjunker bandet ihop till en mörk klump.
          "relative flex flex-col items-center justify-center gap-[1px] bg-[#0b4ecb] dark:bg-[#1559d8]",
          // Riktig kant i stället för en inre ring: en border följer
          // hörnradien exakt och fogas rent i hörnen, medan en box-shadow
          // ritas som en rät rektangel och måste klippas.
          "border border-[#073a9c] dark:border-[#0a3f9e]",
          "rounded-l-[inherit]",
          s.band,
        )}
      >
        {albanian ? (
          <svg viewBox="0 0 24 24" className={s.svg} aria-hidden>
            <AlbanianEagle fill="#FFFFFF" />
          </svg>
        ) : (
          <svg viewBox="0 0 22 15" className={s.svg} aria-hidden>
            {euStars.map((d, i) => (
              <path key={i} d={d} fill="#FFCC00" />
            ))}
          </svg>
        )}
        <span
          className={cn(
            "-mt-0.5 font-bold leading-none tracking-tight text-white",
            s.code,
          )}
        >
          {COUNTRY_CODE[land]}
        </span>
      </span>

      {/* Registreringsnummer */}
      <span
        className={cn(
          // Helt jämn yta – ingen toning uppifrån och ned.
          // FE-Schrift med mono som fallback. Skrivs som family-name så
          // tailwind-merge inte förväxlar den med en font-vikt.
          "flex items-center whitespace-nowrap bg-white font-[family-name:var(--font-plate)] font-bold text-[#181818] dark:bg-[#e4e4e6]",
          // Grå kant på tre sidor – vänsterkanten hoppas över, där möter
          // textytan bandets mörkblå kant och två linjer hade blivit dubbelt.
          "border border-l-0 border-[rgba(15,23,41,0.3)] dark:border-[rgba(0,0,0,0.22)]",
          "rounded-r-[inherit]",
          s.text,
        )}
      >
        {formatPlate(value)}
      </span>
    </span>
  );
}
