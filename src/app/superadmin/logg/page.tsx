import type { Metadata } from "next";
import { Activity, Clock, UserCheck, LogIn } from "lucide-react";
import { getAuditLog, getAuditOverview } from "@/lib/data/audit";
import { getPresence } from "@/lib/data/platform";
import { AuditFilters } from "./audit-filters";
import { AuditTable } from "./audit-table";
import { AuditPagination } from "./audit-pagination";
import { LogTabs } from "./log-tabs";
import { ActiveUsers } from "./active-users";

export const metadata: Metadata = { title: "Systemlogg · Superadmin" };

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SuperadminLogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const view = one(sp.view) === "live" ? "live" : "log";

  if (view === "live") {
    const presence = await getPresence();
    return (
      <div className="w-full space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <LogTabs active="live" />
        <ActiveUsers users={presence} />
      </div>
    );
  }

  const daysRaw = one(sp.days);
  const pageRaw = one(sp.page);

  const filters = {
    q: one(sp.q),
    category: one(sp.category) ?? "all",
    organizationId: one(sp.tenant) ?? "all",
    days: daysRaw && daysRaw !== "all" ? Number(daysRaw) : undefined,
    page: pageRaw ? Number(pageRaw) : 1,
    pageSize: 50,
  };

  const [data, overview] = await Promise.all([
    getAuditLog(filters),
    getAuditOverview(),
  ]);

  return (
    <div className="w-full space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      <LogTabs active="log" />

      {/* Nyckeltal */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-4">
        <Metric icon={Activity} label="Totalt" value={overview.total} />
        <Metric icon={Clock} label="Senaste dygnet" value={overview.last24h} />
        <Metric
          icon={UserCheck}
          label="Aktiva (24h)"
          value={overview.activeUsers24h}
        />
        <Metric
          icon={LogIn}
          label="Inloggningar (24h)"
          value={overview.logins24h}
        />
      </div>

      <AuditFilters tenants={overview.tenants} />

      <AuditTable entries={data.entries} />

      <AuditPagination
        page={data.page}
        pageCount={data.pageCount}
        total={data.total}
        pageSize={data.pageSize}
      />
    </div>
  );
}

/** Kompakt inline-nyckeltal för sidhuvudet. */
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-base font-bold tabular-nums text-ink">{value}</p>
        <p className="text-[0.68rem] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
