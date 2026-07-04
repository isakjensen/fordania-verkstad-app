import { ScrollText, Globe } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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

export function AuditTable({ entries }: { entries: AuditEntry[] }) {
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
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key}>
          {/* Dagsrubrik */}
          <div className="mb-2 flex items-center gap-2.5 px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
              {group.label}
            </h2>
            <span className="h-px flex-1 bg-line" aria-hidden />
            <span className="text-[0.7rem] font-medium tabular-nums text-muted-foreground">
              {group.count} {group.count === 1 ? "händelse" : "händelser"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <ul className="divide-y divide-line">
              {group.items.map((e) => {
                const meta = entryMeta(e.action, e.category);
                const Icon = meta.icon;
                const ip = prettyIp(e.ipAddress);
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-muted/40 sm:px-4"
                  >
                    {/* Kategori-ikon */}
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        meta.chip,
                      )}
                      title={meta.label}
                    >
                      <Icon className="size-4" />
                    </span>

                    {/* Innehåll */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {e.summary}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar
                            initials={initialsOf(e.userName)}
                            size="size-[18px] text-[0.5rem]"
                          />
                          <span className="font-medium text-ink-soft">
                            {e.userName}
                          </span>
                          {e.userRole === "admin" ? (
                            <span className="rounded bg-navy/10 px-1 py-px text-[0.58rem] font-semibold uppercase tracking-wide text-navy">
                              Superadmin
                            </span>
                          ) : null}
                        </span>
                        {e.organizationName ? (
                          <>
                            <span className="text-line-strong">·</span>
                            <span className="truncate">{e.organizationName}</span>
                          </>
                        ) : null}
                        {ip ? (
                          <>
                            <span className="text-line-strong">·</span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Globe className="size-3" />
                              {ip}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Klockslag */}
                    <time
                      dateTime={new Date(e.createdAt).toISOString()}
                      title={fullFmt.format(new Date(e.createdAt))}
                      className="shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-muted-foreground"
                    >
                      {timeFmt.format(new Date(e.createdAt))}
                    </time>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
