"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  KeyRound,
  Trash2,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
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
import {
  updateTenantUser,
  setTenantUserPassword,
  removeTenantUser,
} from "./actions";

interface Member {
  memberId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const ROLE_OPTIONS = [
  { value: "member", label: "Användare" },
  { value: "admin", label: "Administratör" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Aktiv" },
  { value: "false", label: "Inaktiv" },
];

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

export function UserActions({ member }: { member: Member }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateTenantUser(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEditOpen(false);
      router.refresh();
    });
  }

  function onSetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await setTenantUserPassword(member.memberId, password);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setPwOpen(false);
      setPassword("");
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await removeTenantUser(member.memberId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function openPw(next: boolean) {
    setPwOpen(next);
    if (next) {
      setError("");
      setPassword(generatePassword());
      setCopied(false);
    }
  }

  function copy() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Redigera */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Redigera användare">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redigera användare</DialogTitle>
            <DialogDescription>{member.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <input type="hidden" name="memberId" value={member.memberId} />
            <div className="space-y-1.5">
              <Label htmlFor={`eu-name-${member.memberId}`}>Namn</Label>
              <Input
                id={`eu-name-${member.memberId}`}
                name="name"
                required
                defaultValue={member.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`eu-role-${member.memberId}`}>Roll</Label>
                <FieldSelect
                  id={`eu-role-${member.memberId}`}
                  name="role"
                  defaultValue={member.role}
                  options={ROLE_OPTIONS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`eu-active-${member.memberId}`}>Status</Label>
                <FieldSelect
                  id={`eu-active-${member.memberId}`}
                  name="active"
                  defaultValue={member.active ? "true" : "false"}
                  options={STATUS_OPTIONS}
                />
              </div>
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
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Spara
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Byt lösenord */}
      <Dialog open={pwOpen} onOpenChange={openPw}>
        <DialogTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Byt lösenord">
              <KeyRound className="size-4" />
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Byt lösenord</DialogTitle>
            <DialogDescription>
              Sätt ett nytt lösenord för {member.name}. Dela det med personen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`pw-${member.memberId}`}>Nytt lösenord</Label>
              <div className="flex gap-2">
                <Input
                  id={`pw-${member.memberId}`}
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
                  onClick={() => {
                    setPassword(generatePassword());
                    setCopied(false);
                  }}
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
              <p className="text-xs text-muted-foreground">
                Minst 8 tecken.
              </p>
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
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Spara lösenord
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ta bort */}
      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ta bort användare"
            >
              <Trash2 className="size-4 text-danger" />
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort användare?</DialogTitle>
            <DialogDescription>
              {member.name} tas bort från verkstaden och kan inte längre logga
              in. Detta går inte att ångra.
            </DialogDescription>
          </DialogHeader>
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
            <Button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
