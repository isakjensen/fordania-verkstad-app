import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  className?: string;
  /** tailwind-storleksklasser, t.ex. "size-9 text-sm" */
  size?: string;
}

/* Avatarerna är byggda av samma material som knapparna: en mjuk fyllning
 * uppifrån-och-ned, en hårlinjekant i samma kulör och en glansdager upptill
 * (via `raised-soft`). Hue:n varierar deterministiskt utifrån initialerna så
 * personer går att skilja åt, men mättnad, ljushet och form är identiska –
 * det är det som gör att raden läses som en designad uppsättning i stället
 * för slumpade pastellprickar. */
const palettes = [
  "from-brand-100 to-brand-200 text-brand-800 border-brand-300/70 dark:from-brand-300/20 dark:to-brand-300/30 dark:text-brand-800 dark:border-brand-300/25",
  "from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300/70 dark:from-emerald-400/15 dark:to-emerald-400/25 dark:text-emerald-200 dark:border-emerald-400/25",
  "from-sky-100 to-sky-200 text-sky-800 border-sky-300/70 dark:from-sky-400/15 dark:to-sky-400/25 dark:text-sky-200 dark:border-sky-400/25",
  "from-violet-100 to-violet-200 text-violet-800 border-violet-300/70 dark:from-violet-400/15 dark:to-violet-400/25 dark:text-violet-200 dark:border-violet-400/25",
  "from-rose-100 to-rose-200 text-rose-800 border-rose-300/70 dark:from-rose-400/15 dark:to-rose-400/25 dark:text-rose-200 dark:border-rose-400/25",
  "from-slate-100 to-slate-200 text-slate-700 border-slate-300/70 dark:from-slate-400/15 dark:to-slate-400/25 dark:text-slate-200 dark:border-slate-400/25",
];

/** Summerar alla tecken så både initialerna räknas – "AH" och "AB" hamnar
 * inte på samma färg bara för att de börjar likadant. */
function paletteIndex(initials: string) {
  let sum = 0;
  for (let i = 0; i < initials.length; i++) sum += initials.charCodeAt(i);
  return sum % palettes.length;
}

export function Avatar({ initials, className, size = "size-9" }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        "border bg-linear-to-b bg-clip-padding raised-soft",
        "ring-2 ring-surface",
        palettes[paletteIndex(initials)],
        size,
        className,
      )}
    >
      {initials}
    </span>
  );
}
