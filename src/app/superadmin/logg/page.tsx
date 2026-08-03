import type { Metadata } from "next";
import { getAuditLog, getAuditOverview } from "@/lib/data/audit";
import { getPresence } from "@/lib/data/platform";
import { AuditFilters } from "./audit-filters";
import { AuditTable } from "./audit-table";
import { AuditPagination } from "./audit-pagination";
import { LogTabs } from "./log-tabs";
import { ActiveUsers } from "./active-users";
import { ViewSlide } from "./view-slide";

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
        <ViewSlide view="live">
          <ActiveUsers users={presence} />
        </ViewSlide>
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

      <ViewSlide view="log">
        <div className="space-y-4">
          {/* Nyckeltal. Ikonchipsen är borttagna: fyra kulörta rutor drog
              blicken till siffror man sällan agerar på. Nu bär talen sig
              själva, med en hårlinje mellan dem. */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line pb-4 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-8">
            <Metric label="Totalt" value={overview.total} />
            <Metric label="Senaste dygnet" value={overview.last24h} />
            <Metric label="Aktiva (24h)" value={overview.activeUsers24h} />
            <Metric label="Inloggningar (24h)" value={overview.logins24h} />
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
      </ViewSlide>
    </div>
  );
}

/** Kompakt inline-nyckeltal för sidhuvudet. */
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="leading-tight">
      <p className="text-lg font-bold text-ink tabular-nums">{value}</p>
      <p className="text-[0.68rem] text-muted-foreground">{label}</p>
    </div>
  );
}
