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
import { TodaysJobs } from "./todays-jobs";
import { MechanicLoad } from "./mechanic-load";
import { FleetStatus } from "./fleet-status";
import { staggerContainer, fadeUpItem } from "./motion";
import { stats } from "@/lib/data";

function todayLabel() {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Dashboard() {
  // Formatera datumet efter mount för att undvika hydration-skillnader
  const [date, setDate] = useState("");
  useEffect(() => setDate(todayLabel()), []);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Sidhuvud */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted first-letter:uppercase">
            {date || " "}
          </p>
          <h1 className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]">
            Översikt
          </h1>
          <p className="mt-1 text-sm text-muted">
            Här är läget i verkstaden just nu.
          </p>
        </div>
        <p className="hidden text-sm text-muted sm:block">
          Uppdaterad{" "}
          <span className="font-semibold text-ink-soft">just nu</span>
        </p>
      </div>

      {/* KPI-kort */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={Wrench}
          label="Aktiva jobb just nu"
          value={stats.activeJobs}
          hint="Arbete pågår i verkstaden"
          tone="brand"
          trend={{ value: "+2", up: true }}
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
          trend={{ value: "+1", up: true }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Kräver åtgärd"
          value={stats.needsAttention}
          hint="Försenade eller väntar på delar"
          tone="danger"
        />
      </motion.div>

      {/* Innehåll */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <motion.div variants={fadeUpItem} className="lg:col-span-2">
          <TodaysJobs />
        </motion.div>
        <motion.div variants={fadeUpItem} className="space-y-6">
          <FleetStatus />
          <MechanicLoad />
        </motion.div>
      </motion.div>
    </div>
  );
}
