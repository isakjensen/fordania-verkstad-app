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

/** Verkstadens mekaniker = dess medlemmar (Y-axeln i kalendern). */
export async function getMechanics(organizationId: string) {
  const members = await db.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    initials: initialsOf(m.user.name),
    role: m.role,
  }));
}

/**
 * Arbetsordrar med schemalagd tid i intervallet [from, to). Scopas på
 * organizationId. Inkluderar fordon och tilldelad mekaniker för kalenderraderna.
 */
export async function getScheduleJobs(
  organizationId: string,
  from: Date,
  to: Date,
) {
  return db.job.findMany({
    where: {
      organizationId,
      scheduledStart: { gte: from, lt: to },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      mechanics: { include: { user: { select: { id: true, name: true } } } },
      vehicles: {
        include: {
          vehicle: {
            select: {
              id: true,
              regNo: true,
              brand: true,
              model: true,
              customers: {
                select: { customer: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
      parts: {
        select: { quantity: true, unitPriceExclOre: true, vatRate: true },
      },
    },
  });
}

/** En enskild arbetsorder med full detalj för drawern. */
export async function getJob(id: string, organizationId: string) {
  return db.job.findFirst({
    where: { id, organizationId },
    include: {
      mechanics: { include: { user: { select: { id: true, name: true } } } },
      vehicles: {
        include: {
          vehicle: {
            include: {
              customers: { include: { customer: true } },
              odometer: { orderBy: { readingDate: "desc" }, take: 1 },
            },
          },
        },
      },
      parts: { orderBy: { purchaseDate: "asc" } },
    },
  });
}

/** Inloggad mekanikers arbetsordrar för ett dygn (Dagens uppdrag). */
export async function getJobsForUserOnDay(
  organizationId: string,
  userId: string,
  from: Date,
  to: Date,
) {
  return db.job.findMany({
    where: {
      organizationId,
      mechanics: { some: { userId } },
      scheduledStart: { gte: from, lt: to },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      vehicles: {
        include: {
          vehicle: {
            select: { id: true, regNo: true, brand: true, model: true },
          },
        },
      },
    },
  });
}

export type Mechanic = Awaited<ReturnType<typeof getMechanics>>[number];
export type ScheduleJob = Awaited<ReturnType<typeof getScheduleJobs>>[number];
export type JobDetail = NonNullable<Awaited<ReturnType<typeof getJob>>>;
