import type { Metadata } from "next";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import { getSession, getActiveOrganizationId } from "@/lib/session";
import { getJobsForUserOnDay } from "@/lib/data/schedule";
import { JobCard } from "./job-card";

export const metadata: Metadata = { title: "Dagens uppdrag" };

const df = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DagensUppdragPage() {
  const session = await getSession();
  const organizationId = await getActiveOrganizationId();

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);

  const jobs =
    session && organizationId
      ? await getJobsForUserOnDay(organizationId, session.user.id, from, to)
      : [];

  const done = jobs.filter((j) => j.status === "done").length;
  const left = jobs.length - done;
  const pct = jobs.length ? Math.round((done / jobs.length) * 100) : 0;

  // "Härnäst" = första inplanerade uppdraget. Det svarar på frågan man ställer
  // sig mellan två jobb: vad tar jag nu? Bara "planned" räknas – märkningen
  // ersätter statusbrickan, och en order som väntar på delar måste få behålla
  // sin egen status, annars döljer vi just det som hindrar arbetet.
  const nextId = jobs.find((j) => j.status === "planned")?.id;

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-4 sm:px-6 lg:px-8">
      {/* Dagens läge. En rad text och en stapel säger mer om läget än tre
          lösryckta siffror: man vill veta hur mycket som är kvar, inte hur
          många uppdrag som råkar ha en viss status. */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight text-ink">
            Dagens uppdrag
          </h1>
          {/* first-letter, inte capitalize: "tisdag 4 augusti" ska ha stor
              bokstav i början, inte i varje ord ("Tisdag 4 Augusti"). */}
          <p className="text-sm text-muted-foreground first-letter:uppercase">
            {df.format(now)}
            {session ? ` · ${session.user.name}` : ""}
          </p>
        </div>

        {jobs.length > 0 ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              <span className="text-2xl font-extrabold tabular-nums text-ink">
                {done}
              </span>
              <span className="text-2xl font-extrabold tabular-nums text-muted-foreground">
                /{jobs.length}
              </span>{" "}
              klara
              {left > 0 ? (
                <span className="text-muted-foreground">
                  {" · "}
                  {left} kvar
                </span>
              ) : null}
            </p>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-success transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        ) : null}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-16 text-center shadow-card">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:text-ink-soft">
            <ClipboardCheck className="size-6" />
          </span>
          <p className="mt-4 font-semibold text-ink">Inga uppdrag idag</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {organizationId
              ? "Du har inga arbetsordrar inplanerade för dagen."
              : "Välj en verkstad för att se dina uppdrag."}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} isNext={job.id === nextId} />
            ))}
          </ul>

          {/* Dagen är slut när allt är kvitterat – värt att säga rakt ut. */}
          {left === 0 ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4.5" />
              Alla uppdrag är klara för idag
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
