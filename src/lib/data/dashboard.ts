import "server-only";
import { db } from "@/lib/db";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function hm(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const dtfShort = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
});

/** "Idag 09:00", "Igår 14:30" eller "12 juni 09:00". */
function whenLabel(start: Date | null, todayStart: Date) {
  if (!start) return "Ej schemalagd";
  const d0 = new Date(start);
  d0.setHours(0, 0, 0, 0);
  const diff = Math.round((d0.getTime() - todayStart.getTime()) / 86400000);
  const time = hm(new Date(start));
  if (diff === 0) return `Idag ${time}`;
  if (diff === -1) return `Igår ${time}`;
  if (diff === 1) return `Imorgon ${time}`;
  return `${dtfShort.format(new Date(start))} ${time}`;
}

/** Samlad, tenant-scopad data till Översikt-sidan (allt från riktiga DB-rader). */
export async function getDashboardData(organizationId: string) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    todaysJobsRaw,
    activeJobs,
    needsAttention,
    doneToday,
    plannedToday,
    vehiclesTotal,
    vehiclesInWorkshop,
    vehiclesWaitingParts,
    members,
    attentionRaw,
  ] = await Promise.all([
    db.job.findMany({
      where: {
        organizationId,
        scheduledStart: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { scheduledStart: "asc" },
      include: {
        mechanics: { include: { user: { select: { id: true, name: true } } } },
        vehicles: {
          include: {
            vehicle: { select: { id: true, regNo: true, brand: true, model: true } },
          },
        },
      },
    }),
    db.job.count({ where: { organizationId, status: "in_progress" } }),
    db.job.count({
      where: { organizationId, status: { in: ["waiting_parts", "delayed"] } },
    }),
    db.job.count({
      where: {
        organizationId,
        status: "done",
        scheduledStart: { gte: todayStart, lt: todayEnd },
      },
    }),
    db.job.count({
      where: { organizationId, scheduledStart: { gte: todayStart, lt: todayEnd } },
    }),
    db.vehicle.count({ where: { organizationId, deletedAt: null } }),
    db.vehicle.count({
      where: {
        organizationId,
        deletedAt: null,
        jobVehicles: {
          some: {
            job: { status: { in: ["in_progress", "waiting_parts", "delayed"] } },
          },
        },
      },
    }),
    db.vehicle.count({
      where: {
        organizationId,
        deletedAt: null,
        jobVehicles: {
          some: { job: { status: { in: ["waiting_parts", "delayed"] } } },
        },
      },
    }),
    db.member.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true } } },
    }),
    // Order som kräver åtgärd: försenade och de som väntar på delar.
    db.job.findMany({
      where: { organizationId, status: { in: ["delayed", "waiting_parts"] } },
      orderBy: [{ status: "asc" }, { scheduledStart: "asc" }],
      take: 6,
      include: {
        mechanics: { include: { user: { select: { id: true, name: true } } } },
        vehicles: {
          include: {
            vehicle: { select: { id: true, regNo: true, brand: true, model: true } },
          },
        },
      },
    }),
  ]);

  // Dagens arbetsordrar i visningsform
  const todaysJobs = todaysJobsRaw.map((j) => {
    const v = j.vehicles[0]?.vehicle ?? null;
    const m = j.mechanics[0]?.user ?? null;
    const durationMin =
      j.scheduledStart && j.scheduledEnd
        ? Math.round(
            (new Date(j.scheduledEnd).getTime() -
              new Date(j.scheduledStart).getTime()) /
              60000,
          )
        : j.durationMin;
    return {
      id: j.id,
      type: j.type,
      status: j.status,
      priority: j.priority,
      regNo: v?.regNo ?? null,
      vehicle: v ? [v.brand, v.model].filter(Boolean).join(" ") : null,
      mechanicName: m?.name ?? null,
      mechanicInitials: m ? initialsOf(m.name) : null,
      start: j.scheduledStart ? hm(new Date(j.scheduledStart)) : null,
      durationMin,
    };
  });

  // Mekaniker-beläggning för dagen
  const perUser = new Map<string, number>();
  for (const j of todaysJobsRaw) {
    for (const jm of j.mechanics) {
      perUser.set(jm.userId, (perUser.get(jm.userId) ?? 0) + 1);
    }
  }
  const mechanicLoad = members
    .map((m) => {
      const jobs = perUser.get(m.user.id) ?? 0;
      return {
        id: m.user.id,
        name: m.user.name,
        initials: initialsOf(m.user.name),
        jobs,
        load: Math.min(1, jobs / 4),
      };
    })
    .sort((a, b) => b.jobs - a.jobs);

  // Order som kräver åtgärd – i visningsform.
  const attention = attentionRaw.map((j) => {
    const v = j.vehicles[0]?.vehicle ?? null;
    const m = j.mechanics[0]?.user ?? null;
    return {
      id: j.id,
      type: j.type,
      status: j.status,
      priority: j.priority,
      regNo: v?.regNo ?? null,
      vehicle: v ? [v.brand, v.model].filter(Boolean).join(" ") : null,
      mechanicName: m?.name ?? null,
      when: whenLabel(j.scheduledStart, todayStart),
    };
  });

  const inWorkshopOnly = Math.max(0, vehiclesInWorkshop - vehiclesWaitingParts);
  const available = Math.max(0, vehiclesTotal - vehiclesInWorkshop);
  const fleet = {
    total: vehiclesTotal,
    available,
    inWorkshop: inWorkshopOnly,
    waitingParts: vehiclesWaitingParts,
    readyPct: vehiclesTotal ? Math.round((available / vehiclesTotal) * 100) : 0,
  };

  return {
    stats: { activeJobs, plannedToday, doneToday, needsAttention },
    todaysJobs,
    attention,
    mechanicLoad,
    fleet,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
