import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  className?: string;
  /** tailwind-storleksklasser, t.ex. "size-9 text-sm" */
  size?: string;
}

/** Färgsätter avataren deterministiskt utifrån initialerna. */
const palettes = [
  "bg-brand-100 text-brand-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

export function Avatar({ initials, className, size = "size-9" }: AvatarProps) {
  const idx =
    initials.charCodeAt(0) % palettes.length || 0;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        "ring-2 ring-white",
        palettes[idx],
        size,
        className,
      )}
    >
      {initials}
    </span>
  );
}
