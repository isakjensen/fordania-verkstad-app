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

// Lösenord läses ur miljövariabler (commitas aldrig). Fallback endast för
// lokal utveckling – sätt riktiga värden i .env / Railway-variabler.
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD ?? "dev-superadmin-change-me";
const TENANT_ADMIN_PASSWORD =
  process.env.SEED_TENANT_ADMIN_PASSWORD ?? "dev-admin-change-me";

/**
 * Skapar en användare via Better Auth, eller – om den redan finns – roterar
 * dess lösenord till det aktuella (env-styrda) värdet. Returnerar användar-id.
 */
async function ensureUser(email: string, name: string, password: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);
    await db.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: hash },
    });
    return existing.id;
  }
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

const MECHANIC_PASSWORD =
  process.env.SEED_MECHANIC_PASSWORD ?? "dev-mechanic-change-me";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Skapar ett medlemskap om det inte redan finns. */
async function ensureMember(
  organizationId: string,
  userId: string,
  role: string,
) {
  const existing = await db.member.findFirst({
    where: { organizationId, userId },
  });
  if (existing) return;
  await db.member.create({
    data: { id: randomUUID(), organizationId, userId, role, createdAt: new Date() },
  });
}

const MECHANIC_NAMES = ["Amir Haddad", "Petra Lund", "Niklas Berg"];

const VEHICLE_POOL = [
  { regNo: "FRD 421", brand: "Volvo", model: "XC60", chassis: "YV1DZ8256C2123456", odo: 4280 },
  { regNo: "MNX 902", brand: "Volkswagen", model: "Passat", chassis: "WVWZZZ3CZBE000111", odo: 8120 },
  { regNo: "KLP 338", brand: "Toyota", model: "Corolla", chassis: "JTDBR32E300000222", odo: 15240 },
  { regNo: "RTS 145", brand: "Audi", model: "A4", chassis: "WAUZZZ8K9BA000333", odo: 6750 },
  { regNo: "BHF 770", brand: "Kia", model: "Ceed", chassis: "U5YHN816ABL000444", odo: 21090 },
];

/**
 * Idempotent kalenderdata: mekaniker (members), fordon och arbetsordrar med
 * riktig tidsplacering över aktuell vecka. Kan köras på både nya och befintliga
 * tenants utan att skapa dubbletter.
 */
async function seedCalendar(organizationId: string, slug: string) {
  // Dynamiskt fordonsfält (Färg) om inget finns ännu.
  const fieldCount = await db.vehicleFieldDefinition.count({
    where: { organizationId },
  });
  if (fieldCount === 0) {
    await db.vehicleFieldDefinition.create({
      data: { organizationId, label: "Färg", type: "text", sortOrder: 1 },
    });
  }

  // Mekaniker = member-användare.
  const mechanicIds: string[] = [];
  for (const name of MECHANIC_NAMES) {
    const first = name.split(" ")[0].toLowerCase();
    const email = `${first}.${slug}@verkstad.se`;
    const userId = await ensureUser(email, name, MECHANIC_PASSWORD);
    await db.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await ensureMember(organizationId, userId, "member");
    mechanicIds.push(userId);
  }

  // Fordon – skapa de ur poolen som inte redan finns (per regnr).
  for (const v of VEHICLE_POOL) {
    const exists = await db.vehicle.findFirst({
      where: { organizationId, regNo: v.regNo },
    });
    if (!exists) {
      await db.vehicle.create({
        data: {
          id: randomUUID(),
          organizationId,
          regNo: v.regNo,
          brand: v.brand,
          model: v.model,
          chassisNumber: v.chassis,
          odometer: { create: { value: v.odo } },
        },
      });
    }
  }
  const vehicles = await db.vehicle.findMany({
    where: { organizationId, regNo: { in: VEHICLE_POOL.map((v) => v.regNo) } },
    orderBy: { regNo: "asc" },
  });

  // Arbetsordrar – bara om inga schemalagda finns ännu.
  const scheduledCount = await db.job.count({
    where: { organizationId, NOT: { scheduledStart: null } },
  });
  if (scheduledCount > 0 || mechanicIds.length === 0 || vehicles.length === 0) {
    return;
  }

  // Måndag denna vecka som ankare.
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = måndag
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  const at = (dayOffset: number, hour: number, min = 0) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    d.setHours(hour, min, 0, 0);
    return d;
  };

  const m = (i: number) => mechanicIds[i % mechanicIds.length];
  const v = (i: number) => vehicles[i % vehicles.length].id;
  const today = dow;
  const next = (today + 1) % 5;
  const later = (today + 2) % 5;

  const specs = [
    { m: 0, v: 0, day: today, h: 8, dur: 2, type: "Service", status: "in_progress", prio: "normal", desc: "Ordinarie service, oljebyte och filter." },
    { m: 0, v: 1, day: today, h: 13, dur: 1.5, type: "Däckbyte", status: "planned", prio: "low", desc: "Skifte till sommardäck, balansering." },
    { m: 1, v: 2, day: today, h: 9, dur: 3, type: "Reparation", status: "waiting_parts", prio: "high", desc: "Byte av bromsskivor fram – väntar på delar." },
    { m: 1, v: 3, day: today, h: 14, dur: 1, type: "Besiktning", status: "planned", prio: "normal", desc: "Föra fram till kontrollbesiktning." },
    { m: 2, v: 4, day: today, h: 8, dur: 2.5, type: "Felsökning", status: "delayed", prio: "high", desc: "Felsökning elsystem, intermittent fel." },
    { m: 2, v: 0, day: next, h: 10, dur: 2, type: "Rekond", status: "planned", prio: "low", desc: "Invändig och utvändig rekond." },
    { m: 0, v: 2, day: later, h: 9, dur: 2, type: "Service", status: "planned", prio: "normal", desc: "Stor service, 30 000 km." },
    { m: 1, v: 4, day: next, h: 13, dur: 1.5, type: "Däckbyte", status: "planned", prio: "normal", desc: "Hjulskifte och däckförvaring." },
  ];

  for (const s of specs) {
    const start = at(s.day, Math.floor(s.h), Math.round((s.h % 1) * 60));
    const end = new Date(start.getTime() + s.dur * 3600 * 1000);
    const hh = String(start.getHours()).padStart(2, "0");
    const mm = String(start.getMinutes()).padStart(2, "0");
    const jobId = randomUUID();
    await db.job.create({
      data: {
        id: jobId,
        organizationId,
        // Legacy enkel-relationer (behålls), samt m2m-länkar för nya modellen.
        vehicleId: v(s.v),
        assignedUserId: m(s.m),
        mechanics: { create: { userId: m(s.m) } },
        vehicles: { create: { vehicleId: v(s.v) } },
        type: s.type,
        status: s.status,
        priority: s.prio,
        description: s.desc,
        start: `${hh}:${mm}`,
        durationMin: Math.round(s.dur * 60),
        scheduledStart: start,
        scheduledEnd: end,
        // Demo: ett par delar på reparations-/serviceordrar.
        ...(s.type === "Reparation"
          ? {
              parts: {
                create: [
                  { title: "Bromsskivor fram (par)", quantity: 1, unitPriceExclOre: 89000, vatRate: 25 },
                  { title: "Bromsbelägg fram", quantity: 1, unitPriceExclOre: 45000, vatRate: 25 },
                  { title: "Arbetstid", quantity: 3, unitPriceExclOre: 79500, vatRate: 25 },
                ],
              },
            }
          : s.type === "Service"
            ? {
                parts: {
                  create: [
                    { title: "Motorolja 5W-30 (5 l)", quantity: 1, unitPriceExclOre: 39000, vatRate: 25 },
                    { title: "Oljefilter", quantity: 1, unitPriceExclOre: 14900, vatRate: 25 },
                    { title: "Arbetstid", quantity: 2, unitPriceExclOre: 79500, vatRate: 25 },
                  ],
                },
              }
            : {}),
      },
    });
  }
}

/** Lägger demo-delar på befintliga ordrar (idempotent – om inga delar finns). */
async function topUpParts(organizationId: string) {
  const partCount = await db.jobPart.count({
    where: { job: { organizationId } },
  });
  if (partCount > 0) return;
  const reparation = await db.job.findFirst({
    where: { organizationId, type: "Reparation" },
  });
  if (reparation) {
    await db.jobPart.createMany({
      data: [
        { jobId: reparation.id, title: "Bromsskivor fram (par)", quantity: 1, unitPriceExclOre: 89000, vatRate: 25 },
        { jobId: reparation.id, title: "Bromsbelägg fram", quantity: 1, unitPriceExclOre: 45000, vatRate: 25 },
        { jobId: reparation.id, title: "Arbetstid", quantity: 3, unitPriceExclOre: 79500, vatRate: 25 },
      ],
    });
  }
  const service = await db.job.findFirst({
    where: { organizationId, type: "Service" },
  });
  if (service) {
    await db.jobPart.createMany({
      data: [
        { jobId: service.id, title: "Motorolja 5W-30 (5 l)", quantity: 1, unitPriceExclOre: 39000, vatRate: 25 },
        { jobId: service.id, title: "Oljefilter", quantity: 1, unitPriceExclOre: 14900, vatRate: 25 },
        { jobId: service.id, title: "Arbetstid", quantity: 2, unitPriceExclOre: 79500, vatRate: 25 },
      ],
    });
  }
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

  // 2. Tenants med admin + domändata (idempotent – fyller på kalenderdata även
  //    på befintliga tenants utan att skapa dubbletter).
  for (const t of tenants) {
    let org = await db.organization.findUnique({ where: { slug: t.slug } });
    if (!org) {
      org = await db.organization.create({
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
    }

    const adminId = await ensureUser(
      t.adminEmail,
      t.adminName,
      TENANT_ADMIN_PASSWORD,
    );
    await db.user.update({
      where: { id: adminId },
      data: { emailVerified: true },
    });
    await ensureMember(org.id, adminId, "admin");

    await seedCalendar(org.id, t.slug);
    await topUpParts(org.id);
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
