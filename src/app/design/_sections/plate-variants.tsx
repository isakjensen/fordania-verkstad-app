import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 *  Förslag på omgjord registreringsskylt.
 *
 *  Den skylt som körs i dag har gradient på TRE ställen: EU-bandet
 *  (ljusblå → mörkblå), textytan (vit → #efefef) och en inre glansdager
 *  i box-shadow. Förslagen nedan skruvar ned eller bort dem ett i taget.
 *
 *  Stjärnorna ritas med samma matematik som den riktiga komponenten –
 *  labbet ska visa en trovärdig skylt, inte en förenkling.
 * ------------------------------------------------------------------ */

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

const euStars = Array.from({ length: 12 }).map((_, i) => {
  const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
  return star(11 + 5.4 * Math.cos(a), 7 + 5.4 * Math.sin(a), 1.5, 0.62);
});

type Size = "sm" | "md" | "lg";

const sizes: Record<
  Size,
  { plate: string; band: string; svg: string; code: string; text: string }
> = {
  sm: {
    plate: "h-6",
    band: "w-[18px]",
    svg: "h-[11px] w-[13px]",
    code: "text-[6px]",
    text: "px-1.5 text-[0.78rem] tracking-[0.06em]",
  },
  md: {
    plate: "h-7",
    band: "w-[22px]",
    svg: "h-[13px] w-[15px]",
    code: "text-[7px]",
    text: "px-2 text-[0.95rem] tracking-[0.07em]",
  },
  lg: {
    plate: "h-9",
    band: "w-[27px]",
    svg: "h-[16px] w-[19px]",
    code: "text-[8px]",
    text: "px-2.5 text-[1.1rem] tracking-[0.08em]",
  },
};

interface PlateStyle {
  /** Ytterkant, radie och ev. upphöjning. */
  frame: string;
  /** EU-bandets fyllning. */
  band: string;
  /** Textytans fyllning. */
  face: string;
  /** Registreringsnumrets färg och vikt. */
  text: string;
}

export function DesignPlate({
  style,
  size = "md",
  value = "ABC 123",
}: {
  style: PlateStyle;
  size?: Size;
  value?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-stretch overflow-hidden",
        s.plate,
        style.frame,
      )}
    >
      <span
        className={cn(
          // rounded-l-[inherit]: kantlinjen måste följa plattans hörnradie,
          // annars kapas den av overflow-hidden och hörnet ser avhugget ut.
          "relative flex flex-col items-center justify-center gap-[1px] rounded-l-[inherit]",
          s.band,
          style.band,
        )}
      >
        <svg viewBox="0 0 22 15" className={s.svg} aria-hidden>
          {euStars.map((d, i) => (
            <path key={i} d={d} fill="#FFCC00" />
          ))}
        </svg>
        <span
          className={cn(
            "-mt-0.5 leading-none font-bold tracking-tight text-white",
            s.code,
          )}
        >
          S
        </span>
      </span>
      <span
        className={cn(
          "flex items-center rounded-r-[inherit] font-mono whitespace-nowrap",
          s.text,
          style.face,
          style.text,
        )}
      >
        {value}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 *  Stilarna
 * ------------------------------------------------------------------ */

/** Nuvarande: gradient i band, gradient i ytan, inre glans + upphöjning. */
export const plateCurrent: PlateStyle = {
  frame:
    "rounded-[5px] bg-white dark:bg-[#ebebec] shadow-[0_0_0_1px_rgba(15,23,41,0.35),inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(15,23,41,0.22)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.55),0_1px_3px_rgba(0,0,0,0.45)]",
  band: "bg-linear-to-b from-[#0d54cc] to-[#00347f] shadow-[inset_-1px_0_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]",
  face: "bg-linear-to-b from-white to-[#efefef] dark:from-[#f1f1f2] dark:to-[#dbdbdd]",
  text: "font-bold text-[#181818]",
};

/**
 * Nedtonad gradient: EU-bandet är en enda solid blå och textytan helt vit.
 * Kvar finns bara en hårfin kant och en mycket svag skugga, så skylten
 * fortfarande sitter på ytan i stället för att flyta.
 */
export const plateFlat: PlateStyle = {
  frame:
    "rounded-[5px] bg-white dark:bg-[#e4e4e6] shadow-[0_1px_1px_rgba(15,23,41,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)]",
  band: "bg-[#0b4ecb] shadow-[inset_0_0_0_1px_#073a9c] dark:bg-[#1559d8] dark:shadow-[inset_0_0_0_1px_#0a3f9e]",
  face: "bg-white dark:bg-[#e4e4e6] shadow-[inset_0_1px_0_rgba(15,23,41,0.3),inset_0_-1px_0_rgba(15,23,41,0.3),inset_-1px_0_0_rgba(15,23,41,0.3)] dark:shadow-[inset_0_1px_0_rgba(0,0,0,0.22),inset_0_-1px_0_rgba(0,0,0,0.22),inset_-1px_0_0_rgba(0,0,0,0.22)]",
  text: "font-bold text-[#181818]",
};

/** Helt matt: inga gradienter, ingen skugga – bara en ren kontur. */
export const plateMatte: PlateStyle = {
  frame:
    "rounded-[5px] bg-white ring-1 ring-[#1f2937]/45 dark:bg-[#ececed] dark:ring-black/50",
  band: "bg-[#0b4ecb]",
  face: "bg-white dark:bg-[#ececed]",
  text: "font-bold text-[#181818]",
};

/** Platt yta men en kvarvarande topp-glans – kompromissen mellan A och B. */
export const plateSoftGloss: PlateStyle = {
  frame:
    "rounded-[5px] bg-white dark:bg-[#ececed] shadow-[0_0_0_1px_rgba(15,23,41,0.32),inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,41,0.14)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.35)]",
  band: "bg-[#0b4ecb]",
  face: "bg-white dark:bg-[#ececed]",
  text: "font-bold text-[#181818]",
};

/** Präglad: platt yta, men tecknen får en lätt upphöjning som på riktigt. */
export const plateEmbossed: PlateStyle = {
  frame:
    "rounded-[5px] bg-white dark:bg-[#ececed] shadow-[0_0_0_1px_rgba(15,23,41,0.32),0_1px_2px_rgba(15,23,41,0.16)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.35)]",
  band: "bg-[#0b4ecb]",
  face: "bg-white dark:bg-[#ececed]",
  text: "font-bold text-[#141414] [text-shadow:0_1px_0_rgba(255,255,255,0.95),0_-0.5px_0_rgba(0,0,0,0.28)]",
};

/** Kantigare och tightare – mindre radie, smalare band, mer verktygslåda. */
export const plateSquare: PlateStyle = {
  frame:
    "rounded-[2px] bg-white dark:bg-[#ececed] shadow-[0_0_0_1px_rgba(15,23,41,0.38)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5)]",
  band: "bg-[#0b4ecb]",
  face: "bg-white dark:bg-[#ececed]",
  text: "font-bold text-[#181818]",
};

/** Mörk skylt – för mörkt läge, i stället för att lysa vitt. */
export const plateDark: PlateStyle = {
  frame:
    "rounded-[5px] bg-[#1c1b19] shadow-[0_0_0_1px_rgba(255,255,255,0.22)]",
  band: "bg-[#0b4ecb]",
  face: "bg-[#1c1b19]",
  text: "font-bold text-[#f3f1ee]",
};
