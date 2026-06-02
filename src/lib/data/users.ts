import "server-only";
import { db } from "@/lib/db";

/**
 * Alla användare (medlemmar) i en tenant, med kontouppgifter. Scopas på
 * organizationId – en verkstad ser bara sina egna användare.
 */
export async function getTenantMembers(organizationId: string) {
  const members = await db.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          banned: true,
          role: true,
        },
      },
    },
  });

  return members.map((m) => ({
    memberId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    active: !m.user.banned,
    isSuperadmin: m.user.role === "admin",
    joinedAt: m.createdAt,
  }));
}

export type TenantMember = Awaited<
  ReturnType<typeof getTenantMembers>
>[number];
