"use client";

import { motion } from "motion/react";
import { Building2, Users, Car } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { staggerContainer } from "@/components/dashboard/motion";

/** KPI-band överst på superadmins översikt – snabb plattformsöversikt. */
export function PlatformStats({
  tenants,
  users,
  vehicles,
}: {
  tenants: number;
  users: number;
  vehicles: number;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <StatCard
        icon={Building2}
        label="Anslutna företag"
        value={tenants}
        hint="Tenants på plattformen"
        tone="brand"
      />
      <StatCard
        icon={Users}
        label="Användare totalt"
        value={users}
        hint="Över alla företag"
        tone="violet"
      />
      <StatCard
        icon={Car}
        label="Fordon totalt"
        value={vehicles}
        hint="I alla fordonsregister"
        tone="success"
      />
    </motion.div>
  );
}
