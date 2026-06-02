import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, admin } from "better-auth/plugins";
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
});

