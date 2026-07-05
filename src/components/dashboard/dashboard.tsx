"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Wrench,
  CalendarClock,
  AlertTriangle,
  Car,
  CalendarDays,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "./stat-card";
import { TodaysJobs } from "./todays-jobs";
import { AttentionList } from "./attention-list";
import { MechanicLoad } from "./mechanic-load";
import { FleetStatus } from "./fleet-status";
import { staggerContainer } from "./motion";
import type { DashboardData } from "@/lib/data/dashboard";

interface HeaderInfo {
  greeting: string;
  name: string | null;
  date: string;
}

export function Dashboard({
  data,
  hasOrg,
  header,
}: {
  data: DashboardData | null;
  hasOrg: boolean;
  header: HeaderInfo;
}) {
  const stats = data?.stats ?? {
    activeJobs: 0,
    plannedToday: 0,
    doneToday: 0,
    needsAttention: 0,
  };
  const fleet = data?.fleet ?? {
    total: 0,
    available: 0,
    inWorkshop: 0,
    waitingParts: 0,
    readyPct: 0,
  };

  if (!hasOrg) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Välj en verkstad för att se översikten.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:h-full lg:gap-5 lg:overflow-hidden lg:p-6">
      {/* Sidhuvud – hälsning, datum och snabbvägar in i appen */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
            {header.greeting}
            {header.name ? (
              <span className="text-brand-600">, {header.name}</span>
            ) : null}
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {header.date}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/arbetsordrar"
            className={cn(
              buttonVariants({ variant: "outline", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            <ClipboardList className="size-4" />
            Arbetsordrar
          </Link>
          <Link
            href="/planering"
            className={cn(
              buttonVariants({ variant: "default", size: "md" }),
              "flex-1 sm:flex-none",
            )}
          >
            <CalendarDays className="size-4" />
            Planering
          </Link>
        </div>
      </header>

      {/* KPI – tappbara genvägar */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        <StatCard
          icon={Wrench}
          label="Pågår nu"
          value={stats.activeJobs}
          hint="Arbete i verkstaden just nu"
          tone="brand"
          href="/planering?view=day"
        />
        <StatCard
          icon={CalendarClock}
          label="Inplanerat idag"
          value={stats.plannedToday}
          hint={`${stats.doneToday} klara hittills`}
          tone="violet"
          href="/planering?view=day"
        />
        <StatCard
          icon={AlertTriangle}
          label="Kräver åtgärd"
          value={stats.needsAttention}
          hint="Försenade / väntar på delar"
          tone="danger"
          href="/arbetsordrar"
        />
        <StatCard
          icon={Car}
          label="Tillgängliga fordon"
          value={fleet.available}
          hint={`av ${fleet.total} i flottan`}
          tone="success"
          href="/fordon"
        />
      </motion.div>

      {/* Övre rad – dagens jobb + fordonsstatus. Delar den lediga höjden så
          översikten fyller skärmen exakt utan sidscroll (interna listor
          scrollar i sina kort). */}
      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-5">
        <div className="min-h-0 lg:flex-[3]">
          <TodaysJobs jobs={data?.todaysJobs ?? []} />
        </div>
        <div className="min-h-0 lg:flex-[2]">
          <FleetStatus fleet={fleet} />
        </div>
      </div>

      {/* Nedre rad – det som kräver åtgärd + mekanikernas beläggning */}
      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-5">
        <div className="min-h-0 lg:flex-[3]">
          <AttentionList items={data?.attention ?? []} />
        </div>
        <div className="min-h-0 lg:flex-[2]">
          <MechanicLoad mechanics={data?.mechanicLoad ?? []} />
        </div>
      </div>
    </div>
  );
}
