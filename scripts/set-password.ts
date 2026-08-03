/**
 * Sätter ett nytt lösenord på ett BEFINTLIGT konto.
 *
 * Lösenordet hashas av Better Auth självt (samma väg som prisma/seed.ts
 * använder), så inloggningen fungerar exakt som för konton skapade via
 * appen. Inga hemligheter ligger i filen – e-post och lösenord skickas in
 * som miljövariabler:
 *
 *   TARGET_EMAIL="namn@fordania.se" TARGET_PASSWORD="…" npx tsx scripts/set-password.ts
 *
 * OBS: skriptet skriver till den databas DATABASE_URL pekar på.
 */
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";

async function main() {
  const email = process.env.TARGET_EMAIL;
  const password = process.env.TARGET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Sätt TARGET_EMAIL och TARGET_PASSWORD som miljövariabler.",
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Hittar ingen användare med ${email}`);

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const res = await db.account.updateMany({
    where: { userId: user.id, providerId: "credential" },
    data: { password: hash },
  });

  // Kontrollera att hashen matchar lösenordet – utan att logga in, eftersom
  // en riktig inloggning hade skapat en session och en rad i systemloggen.
  const saved = await db.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { password: true },
  });
  const verifierat = saved?.password
    ? await ctx.password.verify({ hash: saved.password, password })
    : false;

  console.log({
    epost: email,
    namn: user.name,
    roll: user.role,
    emailVerified: user.emailVerified,
    avstängd: user.banned,
    uppdateradeKonton: res.count,
    losenordVerifierat: verifierat,
  });
}

main().finally(() => db.$disconnect());
