import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * Platshållare som visas medan en sida hämtar sin data. Ska ha samma mått som
 * innehållet den ersätter, annars hoppar layouten när datan landar.
 *
 * Färgen är en genomskinlig ink-ton, INTE surface-muted: den ytan (#f3f5f8)
 * är i praktiken samma färg som sidbakgrunden canvas (#f5f7fa), så block som
 * ligger utanför ett kort blev osynliga. Eftersom ink vänder mellan ljust och
 * mörkt läge syns tonen mot alla fyra bakgrunder.
 *
 * Pulsen stängs av för den som valt "minska rörelse" i systeminställningarna.
 * aria-hidden: skelettet är ren dekor, skärmläsaren ska läsa upp det riktiga
 * innehållet när det kommer.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-ink/[0.08] motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ *
 *  Byggblock – speglar de riktiga komponenternas mått. Sidornas egna
 *  loading.tsx sätter ihop dem så varje skelett matchar just sin vy.
 * ------------------------------------------------------------------ */

/** Motsvarar CardHeader: rubrik, underrubrik och ev. knapp till höger. */
export function SkeletonCardHeader({ action = true }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-[0.95rem] w-32" />
        <Skeleton className="mt-1.5 h-3.5 w-44" />
      </div>
      {action ? (
        <Skeleton className="h-10 w-36 shrink-0 rounded-lg pointer-coarse:h-11" />
      ) : null}
    </div>
  );
}

/** Motsvarar StatCard i KPI-band. */
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="size-[1.1rem] rounded" />
      </div>
      <Skeleton className="mt-4 h-10 w-16" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

/** Fyra StatCard i responsivt rutnät – samma grid som de riktiga KPI-banden. */
export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

/**
 * En listrad: ikon/avatar till vänster, två textrader, något litet till höger.
 * Täcker fordons-, kund-, order- och användarrader.
 */
export function SkeletonListRow({
  avatar = "square",
  trailing = "badge",
  className,
}: {
  avatar?: "square" | "round" | "plate" | "none";
  trailing?: "badge" | "text" | "action" | "none";
  className?: string;
}) {
  return (
    <li className={cn("flex items-center gap-3 px-5 py-3", className)}>
      {avatar === "plate" ? (
        <Skeleton className="h-6 w-[4.5rem] shrink-0 rounded-[4px]" />
      ) : avatar === "none" ? null : (
        <Skeleton
          className={cn(
            "size-9 shrink-0",
            avatar === "round" ? "rounded-full" : "rounded-lg",
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-40 max-w-full" />
        <Skeleton className="mt-1.5 h-3 w-56 max-w-full" />
      </div>
      {trailing === "badge" ? (
        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      ) : trailing === "text" ? (
        <Skeleton className="hidden h-3 w-24 shrink-0 sm:block" />
      ) : trailing === "action" ? (
        <Skeleton className="size-8 shrink-0 rounded-lg pointer-coarse:size-11" />
      ) : null}
    </li>
  );
}

/** Sök + filter ovanför en lista. */
export function SkeletonToolbar({
  filterWidth = "sm:w-44",
  className,
}: {
  filterWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 border-b border-line px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
      <Skeleton
        className={cn("h-10 w-full rounded-lg pointer-coarse:h-11", filterWidth)}
      />
    </div>
  );
}

/** Ett helt listkort: rubrik, ev. verktygsrad och n rader. */
export function SkeletonListCard({
  rows = 5,
  toolbar = false,
  filterWidth,
  action = true,
  avatar = "square",
  trailing = "badge",
  className,
}: {
  rows?: number;
  toolbar?: boolean;
  filterWidth?: string;
  action?: boolean;
  avatar?: "square" | "round" | "plate" | "none";
  trailing?: "badge" | "text" | "action" | "none";
  className?: string;
}) {
  return (
    <Card className={className}>
      <SkeletonCardHeader action={action} />
      {toolbar ? <SkeletonToolbar filterWidth={filterWidth} /> : null}
      <ul className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonListRow key={i} avatar={avatar} trailing={trailing} />
        ))}
      </ul>
    </Card>
  );
}
