"use client";

import { motion } from "motion/react";
import { Building2, Users, Car, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { staggerContainer } from "@/components/dashboard/motion";
import { platformStats } from "@/lib/tenants";

const nf = new Intl.NumberFormat("sv-SE");

export function PlatformStats() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        icon={Building2}
        label="Aktiva kunder"
        value={platformStats.activeTenants}
        hint={`av ${platformStats.totalTenants} anslutna företag`}
        tone="brand"
        trend={{ value: "+2", up: true }}
      />
      <StatCard
        icon={Users}
        label="Användare totalt"
        value={platformStats.totalUsers}
        hint="över alla tenants"
        tone="violet"
      />
      <StatCard
        icon={Car}
        label="Fordon i plattformen"
        value={nf.format(platformStats.totalVehicles)}
        hint="under hantering"
        tone="success"
      />
      <StatCard
        icon={Wallet}
        label="Intäkt per månad"
        value={`${nf.format(platformStats.mrr)} kr`}
        hint={`${platformStats.trialTenants} i testperiod`}
        tone="success"
        trend={{ value: "+8%", up: true }}
      />
    </motion.div>
  );
}
