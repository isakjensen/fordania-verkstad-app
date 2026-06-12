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
        "inline-flex select-none items-stretch overflow-hidden",
        "border border-slate-900/80 bg-white",
        "shadow-[0_1px_1.5px_rgba(15,23,41,0.25)] ring-1 ring-inset ring-white/60",
        s.plate,
        className,
      )}
    >
      {/* EU-band */}
      <span
        className={cn(
          "relative flex flex-col items-center justify-center gap-[1px] bg-[#003399] shadow-[inset_-1px_0_0_rgba(0,0,0,0.18)]",
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
          "flex items-center bg-linear-to-b from-white to-slate-50 font-mono font-bold text-slate-900",
          s.text,
        )}
      >
        {value}
      </span>
    </span>
  );
}
