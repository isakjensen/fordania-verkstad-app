import type { Metadata } from "next";
import {
  getActiveOrganizationId,
  getTenantRole,
  canManageUsers,
} from "@/lib/session";
import { getMechanics, getScheduleJobs } from "@/lib/data/schedule";
import { getVehicleOptions } from "@/lib/data/vehicles";
import { getCustomerOptions } from "@/lib/data/customers";
import { ScheduleCalendar } from "./schedule-calendar";

export const metadata: Metadata = { title: "Arbetskalender" };

type View = "day" | "week" | "sheet";

/**
 * Synligt intervall [from, to) – alltid hela veckan, oavsett vy.
 *
 * Alla tre vyerna ligger monterade samtidigt (de glider i sidled vid byte), så
 * de måste ha samma data att rita. Hämtade vi bara ett dygn i dagvyn skulle
 * vecko- och tabellvyn stå tomma bakom kanten och fyllas i efter bytet – ett
 * synligt hopp mitt i övergången. Dagvyn filtrerar i stället fram sitt dygn
 * ur veckan.
 */
function weekRange(anchor: Date) {
  const from = new Date(anchor);
  from.setHours(0, 0, 0, 0);
  const dow = (from.getDay() + 6) % 7; // 0 = måndag
  from.setDate(from.getDate() - dow);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  return { from, to };
}

function parseAnchor(value?: string) {
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export default async function PlaneringPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view: View =
    sp.view === "day" ? "day" : sp.view === "sheet" ? "sheet" : "week";
  const anchor = parseAnchor(sp.date);
  const { from, to } = weekRange(anchor);

  const organizationId = await getActiveOrganizationId();
  const role = organizationId ? await getTenantRole(organizationId) : null;

  const [mechanics, jobs, vehicles, customers] = organizationId
    ? await Promise.all([
        getMechanics(organizationId),
        getScheduleJobs(organizationId, from, to),
        getVehicleOptions(organizationId),
        getCustomerOptions(organizationId),
      ])
    : [[], [], [], []];

  return (
    <ScheduleCalendar
      view={view}
      anchorISO={anchor.toISOString()}
      fromISO={from.toISOString()}
      toISO={to.toISOString()}
      mechanics={mechanics}
      jobs={jobs}
      vehicles={vehicles}
      customers={customers}
      canManage={canManageUsers(role)}
      hasOrg={!!organizationId}
    />
  );
}
