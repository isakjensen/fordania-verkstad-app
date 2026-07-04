import type { ReactNode } from "react";

interface SuperBannerProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Slankt sidhuvud för superadmin-vyerna. Håller höjden nere; superadmin-
 * identiteten bärs av den mörka sidomenyn och "Plattform"-märkningen i topbaren.
 */
export function SuperBanner({
  eyebrow,
  title,
  description,
  action,
}: SuperBannerProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
          {eyebrow}
        </p>
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
