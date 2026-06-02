import { ArrowLeft, Hammer, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface PlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Snygg "under uppbyggnad"-vy som används för de delar av appen som
 * ännu inte är byggda, så att navigationen känns komplett.
 */
export function Placeholder({ icon: Icon, title, description }: PlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex min-h-[60vh] animate-fade-up flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-7" strokeWidth={1.75} />
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-warning text-white ring-4 ring-canvas">
            <Hammer className="size-3.5" />
          </span>
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-4" />
            Till översikten
          </Link>
        </div>
        <p className="mt-8 text-xs font-medium uppercase tracking-wider text-muted/70">
          Under uppbyggnad
        </p>
      </div>
    </div>
  );
}
