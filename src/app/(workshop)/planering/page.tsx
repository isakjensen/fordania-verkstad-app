import type { Metadata } from "next";
import { getActiveOrganizationId, getTenantRole, canManageUsers } from "@/lib/session";
import { getMechanics, getScheduleJobs } from "@/lib/data/schedule";
import { ScheduleCalendar } from "./schedule-calendar";

export const metadata: Metadata = { title: "Arbetskalender" };

type View = "day" | "week";

/** Räknar ut synligt intervall [from, to) utifrån vy och ankardatum. */
function rangeFor(view: View, anchor: Date) {
  const from = new Date(anchor);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  if (view === "day") {
    to.setDate(to.getDate() + 1);
  } else {
    const dow = (from.getDay() + 6) % 7; // 0 = måndag
    from.setDate(from.getDate() - dow);
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 7);
  }
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
  const view: View = sp.view === "day" ? "day" : "week";
  const anchor = parseAnchor(sp.date);
  const { from, to } = rangeFor(view, anchor);

  const organizationId = await getActiveOrganizationId();
  const role = organizationId ? await getTenantRole(organizationId) : null;

  const [mechanics, jobs] = organizationId
    ? await Promise.all([
        getMechanics(organizationId),
        getScheduleJobs(organizationId, from, to),
      ])
    : [[], []];

  return (
    <ScheduleCalendar
      view={view}
      anchorISO={anchor.toISOString()}
      fromISO={from.toISOString()}
      toISO={to.toISOString()}
      mechanics={mechanics}
      jobs={jobs}
      canManage={canManageUsers(role)}
      hasOrg={!!organizationId}
    />
  );
}
