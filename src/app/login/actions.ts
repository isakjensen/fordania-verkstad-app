"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return h.get("x-real-ip") || null;
}

/** Loggar ett misslyckat inloggningsförsök i systemloggen. */
export async function logFailedLogin(email: string): Promise<void> {
  try {
    const h = await headers();
    const clean = email.trim().toLowerCase().slice(0, 200);
    await db.auditLog.create({
      data: {
        action: "auth.login_failed",
        category: "auth",
        summary: clean
          ? `Misslyckat inloggningsförsök för ${clean}`
          : "Misslyckat inloggningsförsök",
        userName: clean || "Okänd",
        userEmail: clean || null,
        entityType: "session",
        ipAddress: clientIp(h),
        userAgent: h.get("user-agent"),
      },
    });
  } catch (err) {
    console.error("Loggning av misslyckad inloggning misslyckades:", err);
  }
}
