"use client";

import { motion } from "motion/react";
import { Building2, BadgeCheck, Users, Car } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { staggerContainer } from "@/components/dashboard/motion";
import type { PlatformStats as Stats } from "@/lib/data/platform";

const nf = new Intl.NumberFormat("sv-SE");

export function PlatformStats({ stats }: { stats: Stats }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        icon={Building2}
        label="Anslutna kunder"
        value={stats.totalTenants}
        hint="företag på plattformen"
        tone="brand"
      />
      <StatCard
        icon={BadgeCheck}
        label="Aktiva kunder"
        value={stats.activeTenants}
        hint={`av ${stats.totalTenants} anslutna`}
        tone="success"
      />
      <StatCard
        icon={Users}
        label="Användare totalt"
        value={stats.totalUsers}
        hint="över alla tenants"
        tone="violet"
      />
      <StatCard
        icon={Car}
        label="Fordon i plattformen"
        value={nf.format(stats.totalVehicles)}
        hint="under hantering"
        tone="warning"
      />
    </motion.div>
  );
}
