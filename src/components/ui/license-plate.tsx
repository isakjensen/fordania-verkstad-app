import { cn } from "@/lib/utils";

/**
 * Svensk registreringsskylt – vit platta med svart text, mörk ram och det
 * blå EU-bandet med tolv gula stjärnor i ring och landskoden "S".
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

interface LicensePlateProps {
  value: string;
  className?: string;
}

export function LicensePlate({ value, className }: LicensePlateProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 select-none items-stretch overflow-hidden rounded-[5px]",
        "border border-slate-900/80 bg-white",
        "shadow-[0_1px_1.5px_rgba(15,23,41,0.25)] ring-1 ring-inset ring-white/60",
        className,
      )}
    >
      {/* EU-band */}
      <span className="relative flex w-[22px] flex-col items-center justify-center gap-[1px] bg-[#003399] shadow-[inset_-1px_0_0_rgba(0,0,0,0.18)]">
        <svg viewBox="0 0 22 15" className="h-[13px] w-[15px]" aria-hidden>
          {euStars.map((d, i) => (
            <path key={i} d={d} fill="#FFCC00" />
          ))}
        </svg>
        <span className="-mt-0.5 text-[7px] font-bold leading-none tracking-tight text-white">
          S
        </span>
      </span>

      {/* Registreringsnummer */}
      <span className="flex items-center bg-linear-to-b from-white to-slate-50 px-2 font-mono text-[0.95rem] font-bold tracking-[0.07em] text-slate-900">
        {value}
      </span>
    </span>
  );
}
