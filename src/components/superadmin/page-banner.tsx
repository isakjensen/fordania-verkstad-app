import type { ReactNode } from "react";

interface SuperBannerProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Mörk navy-banner som binder ihop superadmin-vyerna. */
export function SuperBanner({
  eyebrow,
  title,
  description,
  action,
}: SuperBannerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy/20 bg-linear-to-r from-navy to-[#12314e] p-5 text-white sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className="mt-1 hidden h-10 w-1 shrink-0 rounded-full bg-brand-400 sm:block"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[1.9rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-xl text-sm text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
