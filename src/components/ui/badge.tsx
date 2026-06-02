import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  /** Visa en liten färgad prick före texten */
  dot?: string;
}

export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
