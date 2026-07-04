import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, admin } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "./db";

/**
 * Better Auth – serverkonfiguration.
 *
 * - emailAndPassword: inloggning med e-post + lösenord (admin sätter
 *   tillfälligt lösenord när användare skapas).
 * - organization(): varje tenant (kundföretag) är en organization med
 *   medlemmar och roller (owner/admin/member).
 * - admin(): global superadmin (User.role = "admin") som hanterar alla
 *   tenants och användare.
 *
 * BETTER_AUTH_SECRET och BETTER_AUTH_URL läses från miljövariabler.
 */
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [organization(), admin()],
  hooks: {
    // Körs efter varje auth-anrop. Vi loggar ENDAST faktiska inloggningar
    // (sign-in-endpointen) – inte vanliga sidbesök eller sessionsförnyelser.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const newSession = ctx.context.newSession;
      if (!newSession) return;
      try {
        const { user, session } = newSession;
        await db.auditLog.create({
          data: {
            action: "auth.login",
            category: "auth",
            summary: `${user.name} loggade in`,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: (user as { role?: string }).role ?? null,
            organizationId:
              typeof session.activeOrganizationId === "string"
                ? session.activeOrganizationId
                : null,
            entityType: "session",
            entityId: session.id,
            ipAddress: session.ipAddress || null,
            userAgent: session.userAgent || null,
          },
        });
      } catch (err) {
        console.error("Inloggningslogg misslyckades:", err);
      }
    }),
  },
});

