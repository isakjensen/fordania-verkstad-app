"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Wrench,
  CalendarClock,
  AlertTriangle,
  Car,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { TodaysJobs } from "./todays-jobs";
import { AttentionList } from "./attention-list";
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
  const [date, setDate] = useState("");
  useEffect(() => setDate(todayLabel()), []);

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

  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:py-5">
      {/* Sidhuvud med kontext-sammanfattning */}
      <header className="flex flex-col gap-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {date || " "}
        </p>
        <h1 className="text-[1.7rem] font-extrabold leading-none tracking-tight text-ink sm:text-[2rem]">
          Översikt
        </h1>
        {hasOrg ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats.plannedToday > 0
              ? `${stats.plannedToday} jobb inplanerade idag`
              : "Inga jobb inplanerade idag"}
            {stats.doneToday > 0 ? ` · ${stats.doneToday} klara` : ""}
            {stats.needsAttention > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-danger">
                  {stats.needsAttention} kräver åtgärd
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      {!hasOrg ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">
            Välj en verkstad för att se översikten.
          </p>
        </div>
      ) : (
        <>
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

          {/* Dagens jobb + det som kräver åtgärd */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TodaysJobs jobs={data?.todaysJobs ?? []} />
            </div>
            <AttentionList items={data?.attention ?? []} />
          </div>

          {/* Verkstadens tillstånd */}
          <div className="grid gap-4 lg:grid-cols-2">
            <FleetStatus fleet={fleet} />
            <MechanicLoad mechanics={data?.mechanicLoad ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
