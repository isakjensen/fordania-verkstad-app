"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { PresenceUser } from "@/lib/data/platform";

const relFmt = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
function lastSeenLabel(date: Date | null): string {
  if (!date) return "Aldrig inloggad";
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  if (min < 1) return "nyss";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d === 1) return "igår";
  if (d < 7) return `${d} dagar sedan`;
  return relFmt.format(new Date(date));
}

function Row({ u }: { u: PresenceUser }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <span className="relative shrink-0">
        <Avatar initials={u.initials} size="size-9 text-sm" />
        {u.online ? (
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-success" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
          {u.name}
          {u.isSuperadmin ? (
            <span className="rounded bg-navy/10 px-1 py-px text-[0.58rem] font-semibold uppercase tracking-wide text-navy">
              Superadmin
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {u.email}
          {u.tenantName ? ` · ${u.tenantName}` : ""}
        </p>
      </div>
      {u.online ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Aktiv nu
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">
          {lastSeenLabel(u.lastSeenAt)}
        </span>
      )}
    </li>
  );
}

function GroupHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 px-1">
      <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </h2>
      <span className="h-px flex-1 bg-line" aria-hidden />
      {count !== undefined ? (
        <span className="text-[0.7rem] font-medium tabular-nums text-muted-foreground">
          {count} {count === 1 ? "person" : "personer"}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Live-vy över vilka som är inne just nu. Uppdateras tyst var 20:e sekund.
 */
export function ActiveUsers({ users }: { users: PresenceUser[] }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(id);
  }, [router]);

  const online = users.filter((u) => u.online);
  const recent = users.filter((u) => !u.online && u.lastSeenAt).slice(0, 30);

  return (
    <div className="space-y-4">
      <section>
        <GroupHeader label="Inne nu" count={online.length} />
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          {online.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
                <UserRound className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">
                Ingen är inne just nu
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Uppdateras automatiskt när någon blir aktiv.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {online.map((u) => (
                <Row key={u.id} u={u} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {recent.length > 0 ? (
        <section>
          <GroupHeader label="Nyligen aktiva" />
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <ul className="divide-y divide-line">
              {recent.map((u) => (
                <Row key={u.id} u={u} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
