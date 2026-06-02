import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** "brand" ger Fordanias ljusblå gradient-header */
  tone?: "default" | "brand";
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  tone = "default",
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {tone === "brand" ? (
          <span
            className="h-4 w-1 shrink-0 rounded-full bg-brand-500"
            aria-hidden
          />
        ) : null}
        <div className="min-w-0">
          <h3 className="text-[0.95rem] font-bold tracking-tight text-ink">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
