"use client";

import Link from "next/link";
import {
  Wrench,
  ClipboardCheck,
  Disc3,
  Sparkles,
  ScanSearch,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LicensePlate } from "@/components/ui/license-plate";
import { statusMeta, type JobStatus } from "@/lib/data";
import type { DashboardData } from "@/lib/data/dashboard";

const typeIcon: Record<string, LucideIcon> = {
  Service: Wrench,
  Reparation: Wrench,
  Besiktning: ClipboardCheck,
  Däckbyte: Disc3,
  Rekond: Sparkles,
  Felsökning: ScanSearch,
};

function duration(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function TodaysJobs({ jobs }: { jobs: DashboardData["todaysJobs"] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        tone="brand"
        title="Dagens jobb"
        subtitle={`${jobs.length} inplanerade arbetsordrar`}
        action={
          <Link
            href="/arbetsordrar"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Visa alla
            <ArrowRight className="size-4" />
          </Link>
        }
      />
      {jobs.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          Inga inplanerade arbetsordrar idag.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {jobs.map((job) => {
            const Icon = typeIcon[job.type] ?? Wrench;
            const status =
              statusMeta[job.status as JobStatus] ?? statusMeta.planned;
            const dur = duration(job.durationMin);
            return (
              <li
                key={job.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:gap-4"
              >
                {/* Fordon + typ-ikon */}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft ring-1 ring-line">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>

                {/* Reg.nr + modell */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LicensePlate value={job.regNo ?? "—"} />
                    {job.priority === "high" ? (
                      <span
                        className="size-1.5 rounded-full bg-danger"
                        title="Hög prioritet"
                        aria-label="Hög prioritet"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-ink-soft">
                    {job.vehicle ?? "Okänt fordon"}
                    <span className="text-muted-foreground md:hidden">
                      {" "}
                      · {job.type}
                    </span>
                  </p>
                </div>

                {/* Typ – från sm */}
                <span className="hidden w-28 shrink-0 text-sm font-medium text-ink-soft md:block">
                  {job.type}
                </span>

                {/* Mekaniker – från lg */}
                <div className="hidden w-44 shrink-0 items-center gap-2 lg:flex">
                  {job.mechanicName ? (
                    <>
                      <Avatar
                        initials={job.mechanicInitials ?? "?"}
                        size="size-7 text-xs"
                      />
                      <span className="truncate text-sm text-ink-soft">
                        {job.mechanicName}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Ej tilldelad
                    </span>
                  )}
                </div>

                {/* Tid – från sm */}
                <div className="hidden w-24 shrink-0 text-right sm:block">
                  <p className="text-sm font-medium text-ink tabular-nums">
                    {job.start ?? "—"}
                  </p>
                  {dur ? (
                    <p className="text-xs text-muted-foreground">{dur}</p>
                  ) : null}
                </div>

                {/* Status */}
                <Badge
                  className={cn("shrink-0", status.className)}
                  dot={status.dot}
                >
                  {status.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
