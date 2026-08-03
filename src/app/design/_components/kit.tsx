import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ *
 *  Byggblock för designlabbet. Bara labbet använder dem – inget här
 *  får importeras av appens riktiga sidor.
 * ------------------------------------------------------------------ */

/** En rubricerad sektion i labbet, t.ex. "Knappar". */
export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Underrubrik inuti en sektion, t.ex. "Primärknapp". */
export function Group({
  title,
  hint,
  children,
  cols = 2,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  /** Antal kolumner på breda skärmar. */
  cols?: 1 | 2 | 3;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-[0.8rem] font-semibold tracking-[0.08em] text-ink-soft uppercase">
          {title}
        </h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div
        className={cn(
          "grid gap-3",
          cols === 1 && "grid-cols-1",
          cols === 2 && "sm:grid-cols-2",
          cols === 3 && "sm:grid-cols-2 2xl:grid-cols-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Ett designförslag. Etiketten (A, B, C …) gör att man kan säga
 * "kör B" i stället för att beskriva utseendet.
 *
 * `source` sätts på den variant som faktiskt körs på de riktiga sidorna just
 * nu – då ramas kortet in i grönt, får en LIVE-flagga och pekar ut filen
 * designen bor i.
 */
export function Variant({
  label,
  name,
  note,
  source,
  children,
  className,
}: {
  label: string;
  name: string;
  note?: string;
  /** Filen designen kommer ur. Satt = den här varianten är live i appen. */
  source?: string;
  children: ReactNode;
  className?: string;
}) {
  const live = Boolean(source);
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface",
        live
          ? "border-success/45 ring-1 ring-success/20"
          : "border-line",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-2",
          live ? "border-success/25 bg-success/[0.07]" : "border-line",
        )}
      >
        <span
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[0.7rem] font-bold",
            live
              ? "bg-success/15 text-success"
              : "bg-ink/[0.06] text-ink-soft",
          )}
        >
          {label}
        </span>
        <span className="truncate text-[0.8rem] font-medium text-ink">
          {name}
        </span>
        {live ? <LiveChip /> : null}
        {note ? (
          <span className="ml-auto truncate text-[0.7rem] text-muted-foreground">
            {note}
          </span>
        ) : null}
        {source ? (
          <span className="ml-auto truncate font-mono text-[0.65rem] text-muted-foreground">
            {source}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "flex min-h-20 flex-wrap items-center gap-3 p-4",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Grön flagga: "det här är designen som körs på riktigt just nu". */
export function LiveChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-[0.08em] text-success uppercase">
      <span className="size-1.5 rounded-full bg-success" />
      Live
    </span>
  );
}

/**
 * Live-kort som renderar den RIKTIGA komponenten (Button, Input, Card …).
 * Kan aldrig glida isär från appen, eftersom det är samma kod.
 */
export function Live({
  name = "Komponenten som körs i appen",
  source,
  children,
  className,
}: {
  name?: string;
  source: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-success/45 bg-surface ring-1 ring-success/20">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-success/25 bg-success/[0.07] px-3 py-2">
        <LiveChip />
        <span className="truncate text-[0.8rem] font-medium text-ink">
          {name}
        </span>
        <span className="ml-auto truncate font-mono text-[0.65rem] text-muted-foreground">
          {source}
        </span>
      </div>
      <div
        className={cn(
          "flex min-h-20 flex-wrap items-center gap-3 p-4",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Liten etikett under ett enskilt prov inuti en variant. */
export function Tile({
  caption,
  children,
  className,
}: {
  caption?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      {children}
      {caption ? (
        <span className="font-mono text-[0.65rem] text-muted-foreground">{caption}</span>
      ) : null}
    </div>
  );
}
