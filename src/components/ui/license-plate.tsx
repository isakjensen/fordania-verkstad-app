import { cn } from "@/lib/utils";

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
  { plate: string; band: string; svg: string; code: string; text: string }
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
  className?: string;
}

export function LicensePlate({ value, size = "md", className }: LicensePlateProps) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        // shrink-0 → skylten trycks aldrig ihop av sin flex-container, så hela
        // registreringsnumret syns alltid (siblings får trunkeras i stället).
        // w-fit → skylten storleksanpassas efter innehållet och tänjs aldrig ut
        // till full bredd (t.ex. i en flex-kolumn med align-items: stretch).
        // Ljust läge: ren vit platta. Mörkt läge: en aning dämpad off-white så
        // den inte glarar mot det svarta – men fortfarande en trovärdig skylt.
        "inline-flex w-fit shrink-0 select-none items-stretch overflow-hidden bg-white dark:bg-[#ebebec]",
        // Kant + topp-gloss + upphöjning byggt med box-shadow så den kan
        // anpassas per läge: mörk hårlinje mot ljus yta, ljus hårlinje mot
        // mörk yta – så plattan alltid får en skarp, definierad kant.
        "shadow-[0_0_0_1px_rgba(15,23,41,0.35),inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(15,23,41,0.22)]",
        "dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.55),0_1px_3px_rgba(0,0,0,0.45)]",
        s.plate,
        className,
      )}
    >
      {/* EU-band */}
      <span
        className={cn(
          // Vivid, ren EU-blå med lodrät gradient + topp-glansdager, i stället
          // för en platt, tung mörkblå – ger djup och en fräschare känsla.
          "relative flex flex-col items-center justify-center gap-[1px] bg-linear-to-b from-[#0d54cc] to-[#00347f] shadow-[inset_-1px_0_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]",
          s.band,
        )}
      >
        <svg viewBox="0 0 22 15" className={s.svg} aria-hidden>
          {euStars.map((d, i) => (
            <path key={i} d={d} fill="#FFCC00" />
          ))}
        </svg>
        <span
          className={cn(
            "-mt-0.5 font-bold leading-none tracking-tight text-white",
            s.code,
          )}
        >
          S
        </span>
      </span>

      {/* Registreringsnummer */}
      <span
        className={cn(
          "flex items-center whitespace-nowrap bg-linear-to-b from-white to-[#efefef] font-mono font-bold text-[#181818] dark:from-[#f1f1f2] dark:to-[#dbdbdd]",
          s.text,
        )}
      >
        {value}
      </span>
    </span>
  );
}
