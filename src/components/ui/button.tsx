import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "success"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 active:bg-brand-800",
  success:
    "bg-success text-white shadow-soft hover:brightness-[0.96] active:brightness-90",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200",
  outline:
    "border border-line-strong bg-surface text-ink-soft hover:bg-surface-muted hover:border-line-strong",
  ghost: "text-ink-soft hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-danger text-white hover:brightness-95 active:brightness-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[0.95rem] gap-2",
  icon: "h-10 w-10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold",
        "transition-[background-color,box-shadow,transform,border-color] duration-150",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "cursor-pointer select-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
