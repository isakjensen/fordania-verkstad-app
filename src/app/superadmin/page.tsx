import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OverviewKpis } from "@/components/superadmin/overview-kpis";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { TenantLogo } from "@/components/ui/tenant-logo";
import { cn } from "@/lib/utils";
import {
  getPlatformStats,
  getTenants,
  getPlatformUsers,
} from "@/lib/data/platform";
import { tenantStatusMeta, type TenantStatus } from "@/lib/tenants";

export const metadata: Metadata = { title: "Översikt · Superadmin" };

const STATUS_ORDER: TenantStatus[] = ["active", "trial", "paused", "invited"];

function Bar({
  label,
  value,
  total,
  dot,
}: {
  label: string;
  value: number;
  total: number;
  dot: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 text-ink-soft">
          <span className={cn("size-2 rounded-full", dot)} />
          {label}
        </span>
        <span className="font-semibold text-ink tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

export default async function SuperadminOverviewPage() {
  const [stats, recentTenants, allUsers] = await Promise.all([
    getPlatformStats(),
    getTenants(5),
    getPlatformUsers(),
  ]);
  const recentUsers = allUsers.slice(0, 5);

  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-6 lg:px-8">
      {/* KPI */}
      <OverviewKpis
        tenants={stats.tenants}
        activeTenants={stats.activeTenants}
        users={stats.users}
        vehicles={stats.vehicles}
        jobs={stats.jobs}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Senaste företag */}
        <Card className="lg:col-span-2">
          <CardHeader
            tone="brand"
            title="Senast tillagda företag"
            subtitle={`${stats.tenants} företag på plattformen`}
            action={
              <Link
                href="/superadmin/foretag"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                Visa alla <ArrowRight className="size-4" />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {recentTenants.map((t) => {
              const status =
                tenantStatusMeta[t.status as TenantStatus] ?? null;
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <TenantLogo tenant={t} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.city ?? "—"} · {t.users} användare · {t.vehicles} fordon
                    </p>
                  </div>
                  {status ? (
                    <Badge className={status.className} dot={status.dot}>
                      {status.label}
                    </Badge>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Företag per status */}
        <Card>
          <CardHeader
            tone="brand"
            title="Företag per status"
            subtitle="Fördelning över plattformen"
          />
          <div className="p-5">
            <ul className="space-y-4">
              {STATUS_ORDER.map((s) => {
                const meta = tenantStatusMeta[s];
                return (
                  <Bar
                    key={s}
                    label={meta.label}
                    value={stats.byStatus[s] ?? 0}
                    total={stats.tenants}
                    dot={meta.dot}
                  />
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      {/* Senaste användare */}
      <Card>
        <CardHeader
          tone="brand"
          title="Senast tillagda användare"
          subtitle={`${stats.users} användare totalt`}
          action={
            <Link
              href="/superadmin/anvandare"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Visa alla <ArrowRight className="size-4" />
            </Link>
          }
        />
        <ul className="divide-y divide-line">
          {recentUsers.map((u) => (
            <li key={u.memberId} className="flex items-center gap-3 px-5 py-3">
              <Avatar initials={u.initials} size="size-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                </p>
              </div>
              <span className="hidden truncate text-sm text-muted-foreground sm:block">
                {u.tenantName}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
