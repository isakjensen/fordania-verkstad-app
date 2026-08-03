"use client";

import { useState } from "react";
import { Check, ChevronRight, Copy, ScrollText } from "lucide-react";
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

/**
 * Ett faktapar i händelsevyns referensblock. Etiketterna ligger i en smal
 * kolumn och värdena i en gemensam kolumn direkt efter: alla etiketter
 * linjerar, alla värden linjerar, och raden får varken ett tomrum i mitten
 * (som en högerställd kolumn ger) eller egna ramar.
 */
function Fact({
  label,
  children,
  copy,
}: {
  label: string;
  children: React.ReactNode;
  /** Värde som går att kopiera; ikonen visas vid hover och alltid på touch. */
  copy?: string;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="group flex min-w-0 items-center gap-1.5 text-ink">
        <span className="min-w-0 truncate">{children}</span>
        {copy ? <CopyButton value={copy} /> : null}
      </dd>
    </>
  );
}

/** Diskret kopiering – det man oftast vill ta med sig från en loggpost. */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      aria-label={`Kopiera ${value}`}
      title="Kopiera"
      className="-m-1 shrink-0 p-1 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink-soft focus-visible:opacity-100 pointer-coarse:opacity-100"
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
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
  const ip = entry ? prettyIp(entry.ipAddress) : null;

  return (
    <Dialog open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton className="gap-0 p-0 sm:max-w-md">
        {entry && meta ? (
          <>
            {/* Läsordningen följer frågorna man ställer: vad hände, vem gjorde
             * det och när – och först därefter referensdatan. Kategorin är en
             * liten prick i stället för en färgad banner: kulören hör hemma i
             * listan där man skannar, inte här där man redan valt. */}
            {/* gap-0: DialogHeader har en egen gap-2 som annars läggs ovanpå
             * marginalerna nedan, så varje mellanrum blir dubbelt och ojämnt. */}
            <DialogHeader className="gap-0 px-5 pt-5 pb-4">
              <p className="mr-8 flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn("size-1.5 rounded-full", meta.dot)}
                  aria-hidden
                />
                {meta.label}
              </p>

              <DialogTitle className="mt-2 text-[1.15rem] leading-snug font-semibold tracking-[-0.015em] text-balance text-ink">
                {entry.summary}
              </DialogTitle>

              {/* Vem och när hör ihop och står som ett stycke: namnet bär
               * raden, e-post och tidpunkt är underrad. Förut låg e-post och
               * behörighet nere bland referensdatan och splittrade identiteten
               * på två ställen. */}
              <div className="mt-4 flex items-center gap-2.5">
                <Avatar
                  initials={initialsOf(entry.userName)}
                  size="size-8 text-[0.7rem]"
                />
                <div className="min-w-0">
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className="truncate font-medium text-ink">
                      {entry.userName}
                    </span>
                    {entry.userRole === "admin" ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Superadmin
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.userEmail ? `${entry.userEmail} · ` : ""}
                    <time dateTime={new Date(entry.createdAt).toISOString()}>
                      {fullFmt.format(new Date(entry.createdAt))}
                    </time>
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Referensdata – ett lugnt block, inte fem egna rader med ramar
             * runt. Etikettkolumnen är smal så värdena börjar tidigt. */}
            {/* Referensdatan är nu tre rader. Objekt är borttaget: det är bara
             * prefixet ur åtgärden (vehicle av vehicle.create) och fyllde en
             * rad utan att tillföra något. */}
            <dl className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-2 border-t border-line px-5 py-4 text-sm">
              {entry.organizationName ? (
                <Fact label="Verkstad">{entry.organizationName}</Fact>
              ) : null}

              {ip ? (
                <Fact label="IP-adress" copy={ip}>
                  <span className="font-mono text-[0.8rem] tabular-nums">
                    {ip}
                  </span>
                </Fact>
              ) : null}

              <Fact label="Åtgärd" copy={entry.action}>
                <span className="font-mono text-[0.8rem]">{entry.action}</span>
              </Fact>
            </dl>
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
