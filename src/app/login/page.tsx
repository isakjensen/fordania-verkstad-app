"use client";

import { useState, type FormEvent } from "react";
import { Loader2, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { logFailedLogin } from "./actions";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await authClient.signIn.email({ email, password });

    if (error || !data) {
      void logFailedLogin(email);
      setError("Fel e-post eller lösenord.");
      setLoading(false);
      return;
    }

    // Superadmin → plattformsvyn, övriga → verkstaden.
    //
    // Hård sidladdning, inte router.push: iOS återställer bara zoomnivån vid
    // en riktig navigering. Har man zoomat in i inloggningsfälten låg zoomen
    // annars kvar inne i appen efteråt. Sidan laddas dessutom rent med den
    // nya sessionen, precis som vid utloggning.
    const role = (data.user as { role?: string }).role;
    window.location.assign(role === "admin" ? "/superadmin" : "/");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Logga in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Välkommen tillbaka – ange dina uppgifter för att fortsätta.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="md"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Logga in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Fordania Verkstad · Verkstadsplanering för biluthyrning
        </p>
      </div>
    </main>
  );
}
