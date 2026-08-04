"use client";

import { motion } from "motion/react";
import { Wrench, CalendarClock, AlertTriangle, Car } from "lucide-react";
import { StatCard } from "./stat-card";
import { TodaysJobs } from "./todays-jobs";
import { AttentionList } from "./attention-list";
import { MechanicLoad } from "./mechanic-load";
import { FleetStatus } from "./fleet-status";
import { staggerContainer } from "./motion";
import type { DashboardData } from "@/lib/data/dashboard";

export function Dashboard({
  data,
  hasOrg,
}: {
  data: DashboardData | null;
  hasOrg: boolean;
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
    <div className="flex flex-col gap-4 p-4 sm:p-5 lg:gap-5 lg:p-6 roomy:h-full roomy:overflow-hidden">
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
          emphasize={stats.needsAttention > 0}
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

      {/* Övre rad – dagens jobb + fordonsstatus.
          På en tillräckligt stor skärm (roomy) delar raderna den lediga
          höjden så översikten fyller fönstret exakt utan sidscroll, och
          listorna scrollar inuti sina kort. På en låg laptopskärm blev de
          raderna så korta att korten klipptes mitt i innehållet – där får de
          i stället en rimlig minsta höjd och sidan scrollar.

          `min-w-0` på kolumnerna är inte kosmetiskt: utan det kan en flexbox
          inte krympa ett barn under innehållets naturliga bredd, och dagens
          jobb (med sina fasta kolumner) tryckte då ut fordonsstatus ur bild
          runt 1024–1280 px. */}
      <div className="flex flex-col gap-4 lg:min-h-[19rem] lg:flex-row lg:gap-5 roomy:min-h-0 roomy:flex-1">
        <div className="min-h-0 min-w-0 lg:flex-[3]">
          <TodaysJobs jobs={data?.todaysJobs ?? []} />
        </div>
        <div className="min-h-0 min-w-0 lg:flex-[2]">
          <FleetStatus fleet={fleet} />
        </div>
      </div>

      {/* Nedre rad – det som kräver åtgärd + mekanikernas beläggning */}
      <div className="flex flex-col gap-4 lg:min-h-[19rem] lg:flex-row lg:gap-5 roomy:min-h-0 roomy:flex-1">
        <div className="min-h-0 min-w-0 lg:flex-[3]">
          <AttentionList items={data?.attention ?? []} />
        </div>
        <div className="min-h-0 min-w-0 lg:flex-[2]">
          <MechanicLoad mechanics={data?.mechanicLoad ?? []} />
        </div>
      </div>
    </div>
  );
}
