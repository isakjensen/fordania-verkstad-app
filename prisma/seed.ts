/**
 * Seed – skapar en superadmin, demo-tenants med var sin tenant-admin och lite
 * domändata per tenant så att inloggning och tenant-isolering kan testas.
 *
 * Användare skapas via Better Auth (auth.api.signUpEmail) så att lösenorden
 * hashas korrekt. Organizations/medlemmar/domändata skapas via Prisma.
 *
 * Kör: `npx prisma db seed`
 */
import { randomUUID } from "node:crypto";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";

const SUPERADMIN_PASSWORD = "Fordania2026!";
const TENANT_ADMIN_PASSWORD = "Verkstad2026!";

/** Skapar en användare via Better Auth (idempotent) och returnerar dess id. */
async function ensureUser(email: string, name: string, password: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return existing.id;
  const res = await auth.api.signUpEmail({ body: { email, name, password } });
  return res.user.id;
}

interface TenantSeed {
  name: string;
  slug: string;
  city: string;
  plan: string;
  status: string;
  adminName: string;
  adminEmail: string;
}

const tenants: TenantSeed[] = [
  {
    name: "Eriks Biluthyrning",
    slug: "eriks-biluthyrning",
    city: "Göteborg",
    plan: "Enterprise",
    status: "active",
    adminName: "Johan Sandberg",
    adminEmail: "johan@eriksbil.se",
  },
  {
    name: "Björksäter Travel",
    slug: "bjorksater-travel",
    city: "Stockholm",
    plan: "Plus",
    status: "active",
    adminName: "Petra Lund",
    adminEmail: "petra@bjorksater.se",
  },
  {
    name: "Tyresö Kommun",
    slug: "tyreso-kommun",
    city: "Tyresö",
    plan: "Enterprise",
    status: "active",
    adminName: "Sara Öberg",
    adminEmail: "sara@tyreso.se",
  },
];

async function seedDomainData(organizationId: string) {
  const mech = await db.mechanic.create({
    data: {
      id: randomUUID(),
      organizationId,
      name: "Amir Haddad",
      initials: "AH",
      role: "Fordonstekniker",
    },
  });
  const vehicle = await db.vehicle.create({
    data: {
      id: randomUUID(),
      organizationId,
      regNo: "FRD 421",
      brand: "Volvo",
      model: "XC60",
    },
  });
  await db.job.create({
    data: {
      id: randomUUID(),
      organizationId,
      vehicleId: vehicle.id,
      mechanicId: mech.id,
      type: "Service",
      status: "in_progress",
      start: "08:00",
      durationMin: 120,
      priority: "normal",
    },
  });
}

async function main() {
  // 1. Superadmins (Fordania)
  const superadmins = [
    { email: "philip@fordania.se", name: "Philip" },
    { email: "isak@fordania.se", name: "Isak" },
  ];
  for (const a of superadmins) {
    const id = await ensureUser(a.email, a.name, SUPERADMIN_PASSWORD);
    await db.user.update({
      where: { id },
      data: { role: "admin", name: a.name, emailVerified: true },
    });
    console.log(`✓ Superadmin: ${a.name} (${a.email})`);
  }

  // 2. Tenants med admin + domändata
  for (const t of tenants) {
    const existing = await db.organization.findUnique({
      where: { slug: t.slug },
    });
    if (existing) {
      console.log(`• Hoppar över ${t.name} (finns redan)`);
      continue;
    }

    const org = await db.organization.create({
      data: {
        id: randomUUID(),
        name: t.name,
        slug: t.slug,
        city: t.city,
        plan: t.plan,
        status: t.status,
        createdAt: new Date(),
      },
    });

    const adminId = await ensureUser(
      t.adminEmail,
      t.adminName,
      TENANT_ADMIN_PASSWORD,
    );
    await db.user.update({
      where: { id: adminId },
      data: { emailVerified: true },
    });
    await db.member.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        userId: adminId,
        role: "owner",
        createdAt: new Date(),
      },
    });

    await seedDomainData(org.id);
    console.log(`✓ Tenant: ${t.name} (admin: ${t.adminEmail})`);
  }

  console.log("\nKlart! Inloggningsuppgifter:");
  console.log(`  Superadmin:    isak@fordania.se / ${SUPERADMIN_PASSWORD}`);
  console.log(`  Tenant-admins: <adminEmail> / ${TENANT_ADMIN_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
