"use client";

import { useState } from "react";
import { ChevronRight, ScrollText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AuditEntry } from "@/lib/data/audit";
import { entryMeta } from "./audit-meta";

/** Döljer loopback/okända adresser (t.ex. localhost ::1 eller all-nollor). */
function prettyIp(ip: string | null): string | null {
  if (!ip) return null;
  const bare = ip.replace(/[0:]/g, "");
  if (bare === "" || ip === "127.0.0.1" || ip === "::1") return null;
  return ip;
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

const timeFmt = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const fullFmt = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "long",
  timeStyle: "short",
});

function dayLabel(date: Date, now: Date) {
  const d = new Date(date);
  if (d.toDateString() === now.toDateString()) return "Idag";
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Igår";
  return dayFmt.format(d);
}

interface DayGroup {
  key: string;
  label: string;
  count: number;
  items: AuditEntry[];
}

function groupByDay(entries: AuditEntry[], now: Date): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const e of entries) {
    const key = new Date(e.createdAt).toDateString();
    if (!current || current.key !== key) {
      current = {
        key,
        label: dayLabel(e.createdAt, now),
        count: 0,
        items: [],
      };
      groups.push(current);
    }
    current.items.push(e);
    current.count += 1;
  }
  return groups;
}

/** En rad i händelsevyn: etikett till vänster, värde till höger. */
function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-right text-sm text-ink">{children}</span>
    </div>
  );
}

/**
 * Hela händelsen. Listan visar bara vad som hände och när – allt annat
 * (vem, vilken verkstad, IP, teknisk åtgärd) bor här, ett tryck bort.
 */
function EntryDetail({
  entry,
  onClose,
}: {
  entry: AuditEntry | null;
  onClose: () => void;
}) {
  const meta = entry ? entryMeta(entry.action, entry.category) : null;
  const Icon = meta?.icon;
  const ip = entry ? prettyIp(entry.ipAddress) : null;

  return (
    <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton>
        {entry && meta && Icon ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    meta.chip,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    {meta.label}
                  </p>
                  <DialogTitle className="text-base leading-snug">
                    {entry.summary}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="divide-y divide-line">
              <DetailRow label="Tidpunkt">
                <time dateTime={new Date(entry.createdAt).toISOString()}>
                  {fullFmt.format(new Date(entry.createdAt))}
                </time>
              </DetailRow>

              <DetailRow label="Användare">
                <span className="inline-flex items-center gap-2">
                  <Avatar
                    initials={initialsOf(entry.userName)}
                    size="size-6 text-[0.6rem]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {entry.userName}
                    </span>
                    {entry.userEmail ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.userEmail}
                      </span>
                    ) : null}
                  </span>
                </span>
              </DetailRow>

              {entry.userRole === "admin" ? (
                <DetailRow label="Behörighet">
                  <span className="rounded bg-ink/[0.08] px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-ink-soft uppercase">
                    Superadmin
                  </span>
                </DetailRow>
              ) : null}

              {entry.organizationName ? (
                <DetailRow label="Verkstad">
                  {entry.organizationName}
                </DetailRow>
              ) : null}

              {ip ? (
                <DetailRow label="IP-adress">
                  <span className="font-mono text-xs tabular-nums">{ip}</span>
                </DetailRow>
              ) : null}

              <DetailRow label="Åtgärd">
                <span className="font-mono text-xs break-all">
                  {entry.action}
                </span>
              </DetailRow>

              {entry.entityType ? (
                <DetailRow label="Objekt">
                  <span className="font-mono text-xs">{entry.entityType}</span>
                </DetailRow>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
          <ScrollText className="size-6" />
        </span>
        <p className="mt-4 font-semibold text-ink">Inga händelser</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Inga loggposter matchar filtret. Justera sökningen eller tidsperioden.
        </p>
      </div>
    );
  }

  const now = new Date();
  const groups = groupByDay(entries, now);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key}>
          {/* Dagsrubrik – fastnar i toppen så man alltid vet vilken dag man
           * läser, även långt ner i en lång dag. */}
          <div className="sticky top-0 z-20 -mx-1 mb-1 flex items-center gap-2.5 bg-canvas/90 px-1 py-2 backdrop-blur-sm">
            <h2 className="text-xs font-bold tracking-[0.08em] text-ink-soft uppercase">
              {group.label}
            </h2>
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="text-[0.7rem] font-medium text-muted-foreground tabular-nums">
              {group.count} {group.count === 1 ? "händelse" : "händelser"}
            </span>
          </div>

          {/* Tidslinje: klockslagen i en egen kolumn längst till vänster och
           * en skena genom ikonerna, så dygnets förlopp läses rakt nedför en
           * linje i stället för i sicksack mellan text och tid. */}
          <ol className="relative">
            <span
              className="absolute top-3 bottom-3 left-[4.625rem] w-px bg-line"
              aria-hidden
            />
            {group.items.map((e) => {
                const meta = entryMeta(e.action, e.category);
                const Icon = meta.icon;
              return (
                <li key={e.id}>
                  {/* Raden bär vad som hände, när och av vem. Verkstad, IP,
                   * behörighet och teknisk åtgärd ligger i händelsevyn – i en
                   * logg med hundratals rader är det brus tills man söker just
                   * den detaljen. */}
                  <button
                    type="button"
                    onClick={() => setSelected(e)}
                    className="group -mx-2 grid w-[calc(100%+1rem)] grid-cols-[3rem_1.75rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-muted/60"
                  >
                    <time
                      dateTime={new Date(e.createdAt).toISOString()}
                      className="text-right text-xs text-muted-foreground tabular-nums"
                    >
                      {timeFmt.format(new Date(e.createdAt))}
                    </time>

                    <span
                      className={cn(
                        "relative flex size-7 items-center justify-center rounded-lg",
                        meta.chip,
                      )}
                      title={meta.label}
                    >
                      <Icon className="size-3.5" />
                    </span>

                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-sm text-ink">
                        {e.summary}
                      </span>
                      <span className="hidden shrink-0 truncate text-xs text-muted-foreground sm:inline">
                        {e.userName}
                      </span>
                    </span>

                    <ChevronRight className="size-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <EntryDetail entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
