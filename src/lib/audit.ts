import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/** Kategorier i systemloggen – styr färg/ikon i superadmin-vyn. */
export type AuditCategory =
  | "auth"
  | "job"
  | "vehicle"
  | "customer"
  | "user"
  | "tenant"
  | "settings";

interface AuditInput {
  /** Punktnoterad handling, t.ex. "job.create". */
  action: string;
  category: AuditCategory;
  /** Människoläsbar sammanfattning på svenska. */
  summary: string;
  /** Vilket företag handlingen gäller (annars sessionens aktiva). */
  organizationId?: string | null;
  entityType?: string;
  entityId?: string;
}

/** Plockar klientens IP ur proxy-headers (Railway sätter x-forwarded-for). */
function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return h.get("x-real-ip") || null;
}

/**
 * Skriver en rad i systemloggen. Läser aktör ur sessionen och härkomst ur
 * request-headers. Får aldrig kasta – en misslyckad loggning ska inte stoppa
 * själva handlingen.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const [session, h] = await Promise.all([getSession(), headers()]);
    const activeOrg =
      typeof session?.session.activeOrganizationId === "string"
        ? session.session.activeOrganizationId
        : null;
    const orgId = input.organizationId ?? activeOrg;

    let organizationName: string | null = null;
    if (orgId) {
      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });
      organizationName = org?.name ?? null;
    }

    await db.auditLog.create({
      data: {
        action: input.action,
        category: input.category,
        summary: input.summary,
        userId: session?.user.id ?? null,
        userName: session?.user.name ?? "System",
        userEmail: session?.user.email ?? null,
        userRole: session?.user.role ?? null,
        organizationId: orgId,
        organizationName,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        ipAddress: clientIp(h),
        userAgent: h.get("user-agent"),
      },
    });
  } catch (err) {
    console.error("recordAudit misslyckades:", err);
  }
}
