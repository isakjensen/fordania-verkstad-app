"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Wrench,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { QuickActions } from "./quick-actions";
import { TodaysJobs } from "./todays-jobs";
import { MechanicLoad } from "./mechanic-load";
import { FleetStatus } from "./fleet-status";
import { staggerContainer } from "./motion";
import type { DashboardData } from "@/lib/data/dashboard";

function todayLabel() {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Dashboard({
  data,
  hasOrg,
}: {
  data: DashboardData | null;
  hasOrg: boolean;
}) {
  // Formatera datumet efter mount för att undvika hydration-skillnader
  const [date, setDate] = useState("");
  useEffect(() => setDate(todayLabel()), []);

  const stats = data?.stats ?? {
    activeJobs: 0,
    plannedToday: 0,
    doneToday: 0,
    needsAttention: 0,
  };

  return (
    // Fyller hela ytan utan sidscroll på desktop (mus) – listorna scrollar internt.
    // På touch (iPad/mobil) får sidan i stället växa och scrolla naturligt, så
    // de större tryckytorna alltid får plats.
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:py-5 pointer-fine:lg:h-full pointer-fine:lg:overflow-hidden">
      {/* Sidhuvud */}
      <header className="flex shrink-0 items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {date || " "}
          </p>
          <h1 className="mt-1 text-[1.6rem] font-extrabold leading-none tracking-tight text-ink">
            Översikt
          </h1>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 shadow-soft sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-ink-soft">
            Uppdaterad just nu
          </span>
        </div>
      </header>

      {!hasOrg ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Välj en verkstad för att se översikten.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* KPI-kort */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
          >
            <StatCard
              icon={Wrench}
              label="Aktiva jobb just nu"
              value={stats.activeJobs}
              hint="Arbete pågår i verkstaden"
              tone="brand"
            />
            <StatCard
              icon={CalendarClock}
              label="Inplanerade idag"
              value={stats.plannedToday}
              hint="Hela dagens schema"
              tone="violet"
            />
            <StatCard
              icon={CheckCircle2}
              label="Klara idag"
              value={stats.doneToday}
              hint="Återlämnade till uthyrning"
              tone="success"
            />
            <StatCard
              icon={AlertTriangle}
              label="Kräver åtgärd"
              value={stats.needsAttention}
              hint="Försenade eller väntar på delar"
              tone="danger"
            />
          </motion.div>

          {/* Snabbåtgärder */}
          <QuickActions />

          {/* Innehåll – fyller resten av höjden */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="min-h-0 lg:col-span-2">
              <TodaysJobs jobs={data?.todaysJobs ?? []} />
            </div>
            <div className="flex min-h-0 flex-col gap-4">
              <FleetStatus
                fleet={
                  data?.fleet ?? {
                    total: 0,
                    available: 0,
                    inWorkshop: 0,
                    waitingParts: 0,
                    readyPct: 0,
                  }
                }
              />
              <MechanicLoad mechanics={data?.mechanicLoad ?? []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
