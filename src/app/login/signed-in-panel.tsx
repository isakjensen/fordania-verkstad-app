"use client";

import { motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";

/** Samma mjuka ease-out som resten av appen (se PageTransition). */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Kvittot som ersätter inloggningsformuläret när lösenordet stämmer.
 *
 * Ögonblicket ska kännas som en kvittering, inte som ett stillastående
 * meddelande: krysset ritas upp med pennan, hälsningen kommer efter i tur och
 * ordning, och en förloppslinje längst ner i kortet fylls i takt med att nästa
 * sida laddas. Linjen är avsiktligt lika lång som väntan – den lovar aldrig
 * mer tid än det faktiskt tar.
 *
 * `duration` är millisekunderna fram till att appen navigerar vidare, så
 * animeringen och den riktiga väntan alltid går i takt.
 */
export function SignedInPanel({
  greeting,
  duration,
}: {
  greeting: string;
  duration: number;
}) {
  const reduce = useReducedMotion();

  // Med reducerad rörelse tonar allt bara in: inga skalningar, ingen puls och
  // ingen ritad linje – men samma innehåll och samma tajming.
  const rise = (delay: number) =>
    reduce
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, delay },
        }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: EASE },
        };

  return (
    <div className="flex flex-col items-center py-4 text-center">
      {/* Kryssbrickan. Pulsringen fortsätter så länge man väntar, så kortet
          aldrig ser fruset ut om laddningen drar ut på tiden. */}
      <motion.span
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduce
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 420, damping: 22 }
        }
        className="relative flex size-16 items-center justify-center rounded-full bg-success-soft"
      >
        {!reduce ? (
          <motion.span
            aria-hidden
            initial={{ opacity: 0.55, scale: 1 }}
            animate={{ opacity: 0, scale: 1.75 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              repeatDelay: 0.2,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full border-2 border-success"
          />
        ) : null}

        <svg
          viewBox="0 0 24 24"
          className="size-8 text-success"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12.5 10 17.5 19 7"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          />
        </svg>
      </motion.span>

      <motion.h1
        {...rise(0.14)}
        className="mt-4 text-lg font-bold tracking-tight text-ink"
      >
        {greeting}
      </motion.h1>

      <motion.p {...rise(0.2)} className="mt-1 text-sm text-muted-foreground">
        Uppgifterna stämmer.
      </motion.p>

      <motion.p
        {...rise(0.28)}
        aria-live="polite"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-soft"
      >
        <Loader2 className="size-4 animate-spin text-brand-600" />
        Loggar in i systemet…
      </motion.p>

      {/* Förloppslinjen ligger i kortets underkant (kortet är `relative`), så
          den läser som en laddningslist för hela kortet och inte som ännu ett
          element i mitten. */}
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: duration / 1000, ease: "easeInOut" }}
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-linear-to-r from-brand-400 to-brand-600"
      />
    </div>
  );
}
