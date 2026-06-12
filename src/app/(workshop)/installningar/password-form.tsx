"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Check, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (next.length < 8) {
      setError("Det nya lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (next !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    startTransition(async () => {
      const res = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (res.error) {
        setError(res.error.message ?? "Kunde inte byta lösenord. Kontrollera nuvarande lösenord.");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
          <Label htmlFor="pw-current">Nuvarande lösenord</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">Nytt lösenord</Label>
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Minst 8 tecken"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Bekräfta nytt lösenord</Label>
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
          <Check className="size-4" /> Lösenordet har uppdaterats.
        </p>
      ) : null}

      <Button type="submit" variant="default" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        Uppdatera lösenord
      </Button>
    </form>
  );
}
