import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export interface AuditFilters {
  q?: string;
  category?: string;
  organizationId?: string;
  days?: number;
  page?: number;
  pageSize?: number;
}

export interface AuditEntry {
  id: string;
  createdAt: Date;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  userRole: string | null;
  organizationName: string | null;
  action: string;
  category: string;
  entityType: string | null;
  summary: string;
  ipAddress: string | null;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function buildWhere(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.category && filters.category !== "all") {
    where.category = filters.category;
  }
  if (filters.organizationId && filters.organizationId !== "all") {
    where.organizationId = filters.organizationId;
  }
  if (filters.days && filters.days > 0) {
    where.createdAt = { gte: new Date(Date.now() - filters.days * 86_400_000) };
  }
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { summary: { contains: q, mode: "insensitive" } },
      { userName: { contains: q, mode: "insensitive" } },
      { userEmail: { contains: q, mode: "insensitive" } },
      { organizationName: { contains: q, mode: "insensitive" } },
      { ipAddress: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

/** Paginerad systemlogg med filter. Nyaste först. */
export async function getAuditLog(filters: AuditFilters): Promise<AuditPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(10, filters.pageSize ?? 50));
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userRole: r.userRole,
      organizationName: r.organizationName,
      action: r.action,
      category: r.category,
      entityType: r.entityType,
      summary: r.summary,
      ipAddress: r.ipAddress,
    })),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface AuditOverview {
  total: number;
  last24h: number;
  activeUsers24h: number;
  logins24h: number;
  tenants: { id: string; name: string }[];
}

/** Nyckeltal för loggens topp + företagslistan för filtret. */
export async function getAuditOverview(): Promise<AuditOverview> {
  const since = new Date(Date.now() - 86_400_000);
  const [total, last24h, logins24h, recent, orgs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.count({ where: { createdAt: { gte: since } } }),
    db.auditLog.count({ where: { createdAt: { gte: since }, category: "auth" } }),
    db.auditLog.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return {
    total,
    last24h,
    activeUsers24h: recent.length,
    logins24h,
    tenants: orgs,
  };
}
