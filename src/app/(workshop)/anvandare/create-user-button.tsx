"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldSelect } from "@/components/ui/field-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createTenantUser } from "./actions";

const ROLE_OPTIONS = [
  { value: "member", label: "Användare" },
  { value: "admin", label: "Administratör" },
];

/** Genererar ett läsbart men slumpmässigt tillfälligt lösenord. */
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function regenerate() {
    setPassword(generatePassword());
    setCopied(false);
  }

  function copy() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setError("");
      setPassword(generatePassword());
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTenantUser(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button size="md" variant="success">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Lägg till användare</span>
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ny användare</DialogTitle>
          <DialogDescription>
            Skapa en anställd med ett tillfälligt lösenord. Dela lösenordet med
            personen – de kan byta det senare.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Namn</Label>
            <Input id="u-name" name="name" required placeholder="För- och efternamn" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-post</Label>
            <Input
              id="u-email"
              name="email"
              type="email"
              required
              placeholder="namn@verkstad.se"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-password">Tillfälligt lösenord</Label>
            <div className="flex gap-2">
              <Input
                id="u-password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono tracking-tight"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Generera nytt lösenord"
                onClick={regenerate}
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Kopiera lösenord"
                onClick={copy}
              >
                {copied ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-role">Roll</Label>
            <FieldSelect
              id="u-role"
              name="role"
              defaultValue="member"
              options={ROLE_OPTIONS}
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Avbryt
                </Button>
              }
            />
            <Button type="submit" variant="success" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Skapa användare
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
