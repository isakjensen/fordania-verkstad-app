"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { logFailedLogin } from "./actions";
import { Logo } from "@/components/ui/logo";
import { WorkshopBackdrop } from "./workshop-backdrop";
import { SignedInPanel } from "./signed-in-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * "idle" = formuläret, "loading" = uppgifterna kontrolleras, "success" =
 * rätt lösenord, kvitto visas medan nästa sida laddas.
 */
type Status = "idle" | "loading" | "success";

/**
 * Felet visas som rubrik + en rad som säger vad man gör åt saken.
 *
 * Rubriken pekar aldrig ut om det var e-posten eller lösenordet som var fel.
 * Det är avsiktligt: gör den det går det att prova sig fram till vilka
 * e-postadresser som finns i systemet.
 */
type LoginError = { title: string; hint: string };

/**
 * Hur länge kvittot får synas innan appen navigerar vidare. Utan pausen
 * hinner man aldrig se att inloggningen lyckades på en snabb uppkoppling –
 * sidan bara hoppar. Samma värde driver förloppslinjen i kvittot.
 */
const SUCCESS_MS = 1400;

/** Samma mjuka ease-out som resten av appen (se PageTransition). */
const EASE = [0.22, 1, 0.36, 1] as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginError | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [greeting, setGreeting] = useState("Välkommen tillbaka!");

  const busy = status !== "idle";
  const reduce = useReducedMotion();

  // Så fort man rättar något släcks felet: de röda fälten ska inte ligga kvar
  // och peka ut en text som redan är ändrad.
  function clearError() {
    if (error) setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const { data, error } = await authClient.signIn.email({ email, password });

    if (error || !data) {
      // 429 = spärr för många försök, inte fel uppgifter. Att visa "fel
      // lösenord" här fick det att se ut som att kontot slutat fungera.
      if (error?.status === 429) {
        setError({
          title: "För många försök",
          hint: "Vänta en minut och försök igen.",
        });
      } else {
        void logFailedLogin(email);
        setError({
          title: "Inloggningen gick inte igenom",
          hint: "Kontrollera e-post och lösenord och försök igen.",
        });
      }
      setStatus("idle");
      return;
    }

    // Hälsa med förnamnet när kontot har ett namn – "Välkommen tillbaka,
    // Philip!" säger tydligare än ett grönt kryss att rätt konto loggades in.
    const firstName = data.user.name?.trim().split(/\s+/)[0];
    setGreeting(
      firstName ? `Välkommen tillbaka, ${firstName}!` : "Välkommen tillbaka!",
    );
    setStatus("success");

    // Superadmin → plattformsvyn, övriga → verkstaden.
    //
    // Hård sidladdning, inte router.push: iOS återställer bara zoomnivån vid
    // en riktig navigering. Har man zoomat in i inloggningsfälten låg zoomen
    // annars kvar inne i appen efteråt. Sidan laddas dessutom rent med den
    // nya sessionen, precis som vid utloggning.
    //
    // Kort paus först: utan den hinner kvittot aldrig synas på en snabb
    // uppkoppling, och inloggningen ser ut att hänga sig i stället för att
    // lyckas. Laddningsindikatorn ligger kvar tills nya sidan tar över.
    const role = (data.user as { role?: string }).role;
    const target = role === "admin" ? "/superadmin" : "/";
    setTimeout(() => window.location.assign(target), SUCCESS_MS);
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <WorkshopBackdrop />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" onDark />
        </div>

        {/* Kortet vilar på den mörka bakgrunden: ljus yta, tydlig hårlinje och
            en djup skugga, så det ser ut att ligga ovanpå verkstadsgolvet.
            `layout` gör att höjden växlar mjukt mellan formuläret och kvittot
            i stället för att hoppa – kortet krymper ihop runt kvittot.
            `relative overflow-hidden` håller kvittots förloppslinje innanför
            de rundade hörnen. */}
        <motion.div
          layout={!reduce}
          transition={{ duration: 0.35, ease: EASE }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 shadow-[0_1px_2px_rgb(0_0_0/0.3),0_18px_50px_-12px_rgb(0_0_0/0.65)] sm:p-8"
        >
          {/* mode="wait": formuläret tonar ut färdigt innan kvittot kommer in,
              annars ligger de på varandra under övergången. */}
          <AnimatePresence mode="wait" initial={false}>
            {status === "success" ? (
              /* Kvittot efter rätt lösenord. Formuläret byts ut helt – står de
                 tomma fälten kvar bakom ser det ut som att något gick fel. */
              <motion.div
                key="success"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <SignedInPanel greeting={greeting} duration={SUCCESS_MS} />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={false}
                exit={
                  reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }
                }
                transition={{ duration: 0.18, ease: "easeIn" }}
              >
                <div className="mb-6">
                  <h1 className="text-xl font-bold tracking-tight text-ink">
                    Logga in
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ange dina uppgifter för att fortsätta.
                  </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-ink-soft"
                    >
                      E-post
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={busy}
                      aria-invalid={error ? true : undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError();
                      }}
                      placeholder="namn@foretag.se"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-ink-soft"
                    >
                      Lösenord
                    </label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      disabled={busy}
                      aria-invalid={error ? true : undefined}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError();
                      }}
                      placeholder="••••••••"
                      className="h-10"
                    />
                  </div>

                  {/* role="alert" läser upp felet för skärmläsare; ikonen gör
                      att rutan syns som ett fel även för den som inte skiljer
                      rött från grått. Den korta skakningen är det som gör att
                      man märker felet utan att först behöva läsa det. */}
                  <AnimatePresence initial={false}>
                    {error ? (
                      <motion.div
                        key={error.title}
                        role="alert"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                        animate={
                          reduce
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0, x: [0, -7, 6, -4, 3, 0] }
                        }
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          x: { duration: 0.42, ease: "easeInOut" },
                        }}
                        className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-3"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                          <AlertCircle className="size-[1.1rem]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-danger">
                            {error.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-danger/85">
                            {error.hint}
                          </p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    size="md"
                    disabled={busy}
                    className="w-full"
                  >
                    {status === "loading" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LogIn className="size-4" />
                    )}
                    {status === "loading" ? "Kontrollerar…" : "Logga in"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Fast ljus färg, inte text-muted-foreground: raden ligger på den
            mörka bakgrunden och inte på en temastyrd yta. */}
        <p className="mt-6 text-center text-xs text-white/45">
          Fordania Verkstad · Verkstadsplanering för biluthyrning
        </p>
      </div>
    </main>
  );
}
