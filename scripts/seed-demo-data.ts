/**
 * Fyller en demo-tenant med mycket data: fordonspark, kundregister,
 * mekaniker, arbetsordrar med delar, mätarställningar och kommentarer.
 *
 * Tänkt för Eriks Biluthyrning, så att alla vyer (översikt, planering,
 * arbetsordrar, fordon, kunder) går att titta på med realistiska volymer.
 *
 * Kör:
 *   npx tsx scripts/seed-demo-data.ts
 *   DEMO_SLUG=annan-tenant DEMO_VEHICLES=120 npx tsx scripts/seed-demo-data.ts
 *
 * Skriptet skapar bara data, det raderar aldrig något. Kör det två gånger och
 * du får dubbelt så mycket: det avbryter därför om tenanten redan har minst
 * lika många fordon som målet, om du inte sätter FORCE=1.
 *
 * Slumpen är fröad (mulberry32) så samma körning ger samma data. Vill du ha
 * ett annat urval, sätt DEMO_SEED till ett annat tal.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/lib/db";

const SLUG = process.env.DEMO_SLUG ?? "eriks-biluthyrning";
const VEHICLE_TARGET = Number(process.env.DEMO_VEHICLES ?? 200);
const CUSTOMER_TARGET = Number(process.env.DEMO_CUSTOMERS ?? 70);
const JOB_TARGET = Number(process.env.DEMO_JOBS ?? 260);
/** Ordrar på dagens datum (morgondagen får 80 % av antalet). */
const TODAY_JOBS = Number(process.env.DEMO_TODAY_JOBS ?? 12);
const FORCE = process.env.FORCE === "1";
/** ONLY_DAYS=1 fyller bara på dagens och morgondagens schema. Praktiskt när
 *  tenanten redan har fordon och kunder men dagvyn står tom. */
const ONLY_DAYS = process.env.ONLY_DAYS === "1";

/* ---------------------------------------------------------------- *
 *  Fröad slump – samma körning ger samma data
 * ---------------------------------------------------------------- */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(Number(process.env.DEMO_SEED ?? 20260804));

const int = (min: number, max: number) =>
  min + Math.floor(rnd() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)];
const chance = (p: number) => rnd() < p;
/** Plockar `n` unika element ur listan. */
function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(int(0, copy.length - 1), 1)[0]);
  }
  return out;
}

/* ---------------------------------------------------------------- *
 *  Ordlistor
 * ---------------------------------------------------------------- */
const MODELS = [
  { brand: "Volvo", model: "V60", fuel: "Diesel" },
  { brand: "Volvo", model: "V90", fuel: "Diesel" },
  { brand: "Volvo", model: "XC40", fuel: "El" },
  { brand: "Volvo", model: "XC60", fuel: "Laddhybrid" },
  { brand: "Volkswagen", model: "Golf", fuel: "Bensin" },
  { brand: "Volkswagen", model: "Passat", fuel: "Diesel" },
  { brand: "Volkswagen", model: "Caddy", fuel: "Diesel" },
  { brand: "Volkswagen", model: "Transporter", fuel: "Diesel" },
  { brand: "Volkswagen", model: "ID.4", fuel: "El" },
  { brand: "Toyota", model: "Corolla", fuel: "Hybrid" },
  { brand: "Toyota", model: "Yaris", fuel: "Hybrid" },
  { brand: "Toyota", model: "RAV4", fuel: "Laddhybrid" },
  { brand: "Toyota", model: "Proace", fuel: "Diesel" },
  { brand: "Renault", model: "Clio", fuel: "Bensin" },
  { brand: "Renault", model: "Trafic", fuel: "Diesel" },
  { brand: "Renault", model: "Master", fuel: "Diesel" },
  { brand: "Mercedes-Benz", model: "Sprinter", fuel: "Diesel" },
  { brand: "Mercedes-Benz", model: "Vito", fuel: "Diesel" },
  { brand: "Mercedes-Benz", model: "C 220 d", fuel: "Diesel" },
  { brand: "Ford", model: "Transit Custom", fuel: "Diesel" },
  { brand: "Ford", model: "Kuga", fuel: "Laddhybrid" },
  { brand: "Kia", model: "Ceed", fuel: "Bensin" },
  { brand: "Kia", model: "Niro", fuel: "El" },
  { brand: "Skoda", model: "Octavia", fuel: "Diesel" },
  { brand: "Skoda", model: "Fabia", fuel: "Bensin" },
  { brand: "Skoda", model: "Kodiaq", fuel: "Diesel" },
  { brand: "Tesla", model: "Model 3", fuel: "El" },
  { brand: "Tesla", model: "Model Y", fuel: "El" },
  { brand: "Peugeot", model: "Partner", fuel: "Diesel" },
  { brand: "Peugeot", model: "2008", fuel: "Bensin" },
  { brand: "Nissan", model: "Qashqai", fuel: "Bensin" },
  { brand: "Nissan", model: "Leaf", fuel: "El" },
  { brand: "Hyundai", model: "i30", fuel: "Bensin" },
  { brand: "Hyundai", model: "Tucson", fuel: "Hybrid" },
  { brand: "Opel", model: "Vivaro", fuel: "Diesel" },
  { brand: "Opel", model: "Corsa", fuel: "Bensin" },
  { brand: "Polestar", model: "2", fuel: "El" },
  { brand: "Audi", model: "A4 Avant", fuel: "Diesel" },
  { brand: "Audi", model: "Q5", fuel: "Laddhybrid" },
  { brand: "BMW", model: "320d Touring", fuel: "Diesel" },
] as const;

const COLORS = [
  "Vit",
  "Svart",
  "Silver",
  "Mörkblå",
  "Grå",
  "Röd",
  "Mörkgrön",
  "Beige",
];
const GEARBOX = ["Automat", "Manuell"];
const TYRES = ["Sommardäck", "Vinterdäck (dubb)", "Vinterdäck (friktion)"];

const FIRST_NAMES = [
  "Anna",
  "Erik",
  "Maria",
  "Johan",
  "Karin",
  "Lars",
  "Sara",
  "Mikael",
  "Emma",
  "Anders",
  "Elin",
  "Peter",
  "Hanna",
  "Fredrik",
  "Linnea",
  "Daniel",
  "Sofia",
  "Gustav",
  "Malin",
  "Oskar",
  "Ida",
  "Henrik",
  "Julia",
  "Björn",
  "Amanda",
  "Nils",
  "Frida",
  "Simon",
  "Klara",
  "Robert",
  "Tove",
  "Patrik",
  "Ebba",
  "Jonas",
  "Moa",
  "Viktor",
  "Cecilia",
  "Martin",
  "Lovisa",
  "Alexander",
];
const LAST_NAMES = [
  "Andersson",
  "Johansson",
  "Karlsson",
  "Nilsson",
  "Eriksson",
  "Larsson",
  "Olsson",
  "Persson",
  "Svensson",
  "Gustafsson",
  "Pettersson",
  "Jonsson",
  "Jansson",
  "Hansson",
  "Bengtsson",
  "Lindberg",
  "Jakobsson",
  "Magnusson",
  "Lindström",
  "Lindqvist",
  "Berglund",
  "Fredriksson",
  "Sandberg",
  "Henriksson",
  "Forsberg",
  "Sjöberg",
  "Wallin",
  "Engström",
  "Eklund",
  "Danielsson",
  "Håkansson",
  "Lundin",
  "Björk",
  "Bergström",
  "Holm",
  "Nyström",
  "Öberg",
];
const COMPANY_PREFIX = [
  "Nordbygg",
  "Västtrafik Service",
  "Göteborgs El",
  "Hisingens Bud",
  "Mölndal Frakt",
  "Kungälv Anläggning",
  "Partille Måleri",
  "Landvetter Logistik",
  "Sisjöns Rör",
  "Backa Entreprenad",
  "Torslanda Bygg",
  "Askims Städ",
  "Lindholmen Tech",
  "Majornas Café",
  "Frölunda Fastigheter",
  "Angered Vård",
  "Lerum Transport",
  "Kärra Kyl",
  "Hjällbo Golv",
  "Billdals Trädgård",
  "Sävedalen Data",
  "Öckerö Marin",
  "Alingsås Livs",
  "Stenungsund Kemi",
  "Härryda Bygg",
];
const COMPANY_SUFFIX = ["AB", "AB", "AB", "& Söner AB", "Sverige AB", "HB"];

const STREETS = [
  "Kungsgatan",
  "Storgatan",
  "Vasagatan",
  "Linnégatan",
  "Aschebergsgatan",
  "Redbergsvägen",
  "Hisingsgatan",
  "Karl Johansgatan",
  "Övre Husargatan",
  "Danska Vägen",
  "Doktor Fries Torg",
  "Munkebäcksgatan",
  "Slottsskogsgatan",
  "Backaplan",
  "Ringögatan",
  "Marieholmsgatan",
  "Bögatan",
  "Södra Vägen",
];
const CITIES = [
  "411 18 Göteborg",
  "414 51 Göteborg",
  "417 05 Göteborg",
  "421 32 Västra Frölunda",
  "431 30 Mölndal",
  "442 31 Kungälv",
  "433 30 Partille",
  "438 32 Landvetter",
];

const JOB_TYPES = [
  "Service",
  "Reparation",
  "Besiktning",
  "Däckbyte",
  "Rekond",
  "Felsökning",
] as const;

const DESCRIPTIONS: Record<string, string[]> = {
  Service: [
    "Ordinarie service enligt tillverkarens schema, oljebyte och filter.",
    "Stor service 30 000 km. Kontroll av bromsar och bussningar.",
    "Liten service, oljebyte samt kontroll av vätskenivåer.",
    "Serviceintervall passerat. Byte av olja, luftfilter och kupéfilter.",
  ],
  Reparation: [
    "Byte av bromsskivor och belägg fram.",
    "Läckage från servostyrningen, byte av slang.",
    "Byte av kamrem och vattenpump.",
    "Missljud från framvagn, byte av länkarmsbussningar.",
    "Byte av startbatteri och kontroll av laddning.",
    "Avgassystem rostskadat, byte av mellandel.",
  ],
  Besiktning: [
    "Föra fram till kontrollbesiktning.",
    "Ombesiktning efter anmärkning på bromsverkan.",
    "Besiktning inför avlämning till kund.",
  ],
  Däckbyte: [
    "Skifte till sommardäck, balansering och kontroll av mönsterdjup.",
    "Skifte till vinterdäck samt däckförvaring.",
    "Punktering bak höger, lagning och montering.",
    "Fyra nya däck monteras och balanseras.",
  ],
  Rekond: [
    "Invändig och utvändig rekond inför uthyrning.",
    "Sanering av rök i kupé, tvätt och vaxning.",
    "Utvändig tvätt, lackrengöring och fälgtvätt.",
  ],
  Felsökning: [
    "Intermittent fel i elsystemet, felkod läses av.",
    "Motorlampa tänd, felsökning av lambdasond.",
    "Kunden upplever vibration vid inbromsning, felsökning.",
    "Fel på backkamera, felsökning av kablage.",
  ],
};

const PARTS: { title: string; ore: number }[] = [
  { title: "Motorolja 5W-30 (5 l)", ore: 39000 },
  { title: "Oljefilter", ore: 14900 },
  { title: "Kupéfilter", ore: 24900 },
  { title: "Luftfilter", ore: 19900 },
  { title: "Bromsskivor fram (par)", ore: 89000 },
  { title: "Bromsbelägg fram", ore: 45000 },
  { title: "Bromsskivor bak (par)", ore: 76000 },
  { title: "Torkarblad (par)", ore: 29900 },
  { title: "Startbatteri 70 Ah", ore: 149000 },
  { title: "Kamremskit", ore: 219000 },
  { title: "Vattenpump", ore: 128000 },
  { title: "Tändstift (4 st)", ore: 42000 },
  { title: "Däck 205/55 R16", ore: 98000 },
  { title: "Ventilsats TPMS", ore: 18000 },
  { title: "Spolarvätska", ore: 8900 },
  { title: "Glödlampa H7", ore: 7900 },
  { title: "Länkarmsbussning", ore: 62000 },
  { title: "Lambdasond", ore: 176000 },
];

const MECHANICS = [
  { name: "Amir Haddad", role: "Verkmästare" },
  { name: "Petra Lund", role: "Bilmekaniker" },
  { name: "Niklas Berg", role: "Bilmekaniker" },
  { name: "Sanna Ek", role: "Däckspecialist" },
  { name: "Tomas Ivarsson", role: "Elektronikspecialist" },
  { name: "Leila Karimi", role: "Rekond" },
];

const COMMENTS = [
  "Vill alltid ha sms när bilen är klar.",
  "Fakturaadress skiljer sig från besöksadressen.",
  "Hämtar bilar efter 17:00, ring i förväg.",
  "Har avtal om fast timpris, se pärmen.",
  "Godkänner inte reservdelar från annat märke.",
  "Föredrar att lämna nyckel i tuben.",
  "Kör mycket långdistans, tätare oljebyten önskas.",
  "Ska ha samlingsfaktura en gång i månaden.",
];

/* ---------------------------------------------------------------- *
 *  Generatorer
 * ---------------------------------------------------------------- */
const LETTERS = "ABCDEFGHJKLMNPRSTUWXYZ"; // utan I, O, Q, V – som på riktiga skyltar
const usedPlates = new Set<string>();

/** Modern svensk skylt: tre bokstäver, två siffror, siffra eller bokstav. */
function plate(): string {
  for (;;) {
    const last = chance(0.35)
      ? LETTERS[int(0, LETTERS.length - 1)]
      : String(int(0, 9));
    const p =
      LETTERS[int(0, LETTERS.length - 1)] +
      LETTERS[int(0, LETTERS.length - 1)] +
      LETTERS[int(0, LETTERS.length - 1)] +
      String(int(0, 9)) +
      String(int(0, 9)) +
      last;
    if (!usedPlates.has(p)) {
      usedPlates.add(p);
      return p;
    }
  }
}

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
function vin(): string {
  let s = "";
  for (let i = 0; i < 17; i++) s += VIN_CHARS[int(0, VIN_CHARS.length - 1)];
  return s;
}

function personalNumber(): string {
  const year = int(1955, 2004);
  const month = String(int(1, 12)).padStart(2, "0");
  const day = String(int(1, 28)).padStart(2, "0");
  return `${year}${month}${day}-${String(int(0, 9999)).padStart(4, "0")}`;
}

function orgNumber(): string {
  return `${int(551000, 559999)}-${String(int(1000, 9999))}`;
}

function phone(): string {
  return `07${int(0, 9)}-${int(100, 999)} ${int(10, 99)} ${int(10, 99)}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "");
}

const DAY = 86400000;
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Kvittofilen är listan över vad skriptet skapat, så clear-demo-data.ts kan
 *  ta bort exakt det igen. Påfyllningar läggs till i den befintliga filen. */
function appendToReceipt(
  slug: string,
  add: { vehicleIds?: string[]; customerIds?: string[]; jobIds?: string[] },
) {
  const path = join(process.cwd(), "scripts", `demo-seed-${slug}.json`);
  let current: {
    vehicleIds: string[];
    customerIds: string[];
    jobIds: string[];
    [key: string]: unknown;
  };
  try {
    current = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return;
  }
  current.vehicleIds = [...current.vehicleIds, ...(add.vehicleIds ?? [])];
  current.customerIds = [...current.customerIds, ...(add.customerIds ?? [])];
  current.jobIds = [...current.jobIds, ...(add.jobIds ?? [])];
  writeFileSync(path, JSON.stringify(current, null, 2), "utf8");
}

interface JobSpec {
  id: string;
  vehicleIds: string[];
  userIds: string[];
  type: string;
  status: string;
  priority: string;
  description: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  durationMin: number;
  deletedAt: Date | null;
}

/** Skriver ordrarna med fordon, mekaniker och inköpsrader. Returnerar antal
 *  inköpsrader, så anroparen kan skriva ut en sammanfattning. */
async function persistJobs(
  organizationId: string,
  jobs: JobSpec[],
  now: Date,
): Promise<number> {
  await db.job.createMany({
    data: jobs.map((j) => ({
      id: j.id,
      organizationId,
      vehicleId: j.vehicleIds[0],
      assignedUserId: j.userIds[0],
      type: j.type,
      status: j.status,
      priority: j.priority,
      description: j.description,
      start: j.scheduledStart
        ? `${String(j.scheduledStart.getHours()).padStart(2, "0")}:${String(
            j.scheduledStart.getMinutes(),
          ).padStart(2, "0")}`
        : "--:--",
      durationMin: j.durationMin,
      scheduledStart: j.scheduledStart,
      scheduledEnd: j.scheduledEnd,
      deletedAt: j.deletedAt,
      createdAt: new Date(
        (j.scheduledStart ?? now).getTime() - int(1, 21) * DAY,
      ),
    })),
  });

  await db.jobVehicle.createMany({
    data: jobs.flatMap((j) =>
      j.vehicleIds.map((vehicleId) => ({ jobId: j.id, vehicleId })),
    ),
    skipDuplicates: true,
  });
  await db.jobMechanic.createMany({
    data: jobs.flatMap((j) =>
      j.userIds.map((userId) => ({
        jobId: j.id,
        userId,
        // Timpris och timmar så att arbetsordern går att summera.
        hourlyRateOreExcl: pick([79500, 84500, 89500]),
        hours: Math.round((j.durationMin / 60) * 2) / 2,
        vatRate: 25,
      })),
    ),
    skipDuplicates: true,
  });

  const parts = jobs
    .filter((j) => j.type !== "Rekond" && chance(0.75))
    .flatMap((j) =>
      sample(PARTS, int(1, 4)).map((p) => ({
        jobId: j.id,
        title: p.title,
        quantity: chance(0.2) ? int(2, 4) : 1,
        unitPriceExclOre: p.ore,
        vatRate: 25,
        purchaseDate: j.scheduledStart ?? now,
      })),
    );
  await db.jobPart.createMany({ data: parts });
  return parts.length;
}

/**
 * En dags schema: ordrar utspridda över öppettiderna, en per mekaniker och
 * tidslucka. Dagens datum får aldrig bli tomt av slumpen – översikten och
 * dagvyn ska ha något att visa – därför byggs dagen explicit i stället för
 * att hoppas på att intervallslumpen träffar rätt.
 */
function buildDayJobs(
  day: Date,
  count: number,
  pool: string[],
  memberIds: string[],
  now: Date,
): JobSpec[] {
  const isToday = startOfDay(day).getTime() === startOfDay(now).getTime();
  const jobs: JobSpec[] = [];
  for (let i = 0; i < count; i++) {
    const type = pick(JOB_TYPES);
    const durationMin = pick([30, 45, 60, 90, 120, 150, 180]);
    const start = new Date(day);
    start.setHours(7 + Math.floor(i / 2), i % 2 ? 30 : 0, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60000);
    const passed = isToday && start.getTime() < now.getTime();
    jobs.push({
      id: randomUUID(),
      vehicleIds: sample(pool, chance(0.12) ? 2 : 1),
      userIds: [memberIds[i % memberIds.length]],
      type,
      status: isToday
        ? passed
          ? pick(["in_progress", "in_progress", "done", "waiting_parts"])
          : pick(["planned", "planned", "planned", "delayed"])
        : "planned",
      priority: chance(0.2) ? "high" : chance(0.2) ? "low" : "normal",
      description: pick(DESCRIPTIONS[type]),
      scheduledStart: start,
      scheduledEnd: end,
      durationMin,
      deletedAt: null,
    });
  }
  return jobs;
}

/* ---------------------------------------------------------------- *
 *  Körning
 * ---------------------------------------------------------------- */
async function main() {
  const org = await db.organization.findUnique({ where: { slug: SLUG } });
  if (!org) {
    console.error(
      `Hittade ingen tenant med slug "${SLUG}". Kör prisma db seed först, eller sätt DEMO_SLUG.`,
    );
    process.exit(1);
  }

  if (ONLY_DAYS) {
    const now = new Date();
    const memberIds = (
      await db.member.findMany({
        where: { organizationId: org.id },
        select: { userId: true },
      })
    ).map((m) => m.userId);
    const pool = (
      await db.vehicle.findMany({
        where: { organizationId: org.id, deletedAt: null },
        select: { id: true },
      })
    ).map((v) => v.id);
    const tomorrow = startOfDay(now);
    tomorrow.setDate(tomorrow.getDate() + (now.getDay() === 5 ? 3 : 1));
    const jobs = [
      ...buildDayJobs(startOfDay(now), TODAY_JOBS, pool, memberIds, now),
      ...buildDayJobs(
        tomorrow,
        Math.round(TODAY_JOBS * 0.8),
        pool,
        memberIds,
        now,
      ),
    ];
    const parts = await persistJobs(org.id, jobs, now);
    appendToReceipt(org.slug, { jobIds: jobs.map((j) => j.id) });
    console.log(
      `Lade till ${jobs.length} ordrar på idag och imorgon (${parts} inköpsrader) i ${org.name}.`,
    );
    return;
  }

  const existingVehicles = await db.vehicle.count({
    where: { organizationId: org.id },
  });
  if (existingVehicles >= VEHICLE_TARGET && !FORCE) {
    console.log(
      `${org.name} har redan ${existingVehicles} fordon (målet är ${VEHICLE_TARGET}). Sätt FORCE=1 för att fylla på ändå.`,
    );
    process.exit(0);
  }

  console.log(`Fyller "${org.name}" (${org.id}) med demodata …`);

  // Faktura-/avsändaruppgifter, om de saknas.
  if (!org.orgNumber) {
    await db.organization.update({
      where: { id: org.id },
      data: {
        orgNumber: "556734-1298",
        vatNumber: "SE556734129801",
        address: "Exportgatan 47",
        postalCode: "422 46 Hisings Backa",
        email: "verkstad@eriksbil.se",
        phone: "031-742 18 00",
        bankgiro: "5402-9187",
        paymentTermsDays: 30,
      },
    });
  }

  /* --- Dynamiska fordonsfält ------------------------------------- */
  const wantedFields = [
    { label: "Färg", type: "text", sortOrder: 1 },
    { label: "Drivmedel", type: "text", sortOrder: 2 },
    { label: "Växellåda", type: "text", sortOrder: 3 },
    { label: "Däck", type: "text", sortOrder: 4 },
  ];
  const fieldIds = new Map<string, string>();
  for (const f of wantedFields) {
    const existing = await db.vehicleFieldDefinition.findFirst({
      where: { organizationId: org.id, label: f.label },
    });
    const def =
      existing ??
      (await db.vehicleFieldDefinition.create({
        data: { organizationId: org.id, ...f },
      }));
    fieldIds.set(f.label, def.id);
  }

  /* --- Mekaniker -------------------------------------------------- */
  for (const m of MECHANICS) {
    const exists = await db.mechanic.findFirst({
      where: { organizationId: org.id, name: m.name },
    });
    if (!exists) {
      await db.mechanic.create({
        data: {
          organizationId: org.id,
          name: m.name,
          initials: m.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase(),
          role: m.role,
        },
      });
    }
  }

  // Arbetsordrar tilldelas inloggningsbara användare (members). De som redan
  // finns i tenanten räcker – skriptet skapar inga nya konton.
  const members = await db.member.findMany({
    where: { organizationId: org.id },
    include: { user: { select: { id: true, name: true } } },
  });
  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) {
    console.error(
      "Tenanten saknar medlemmar. Kör prisma db seed först så att det finns användare att tilldela ordrar till.",
    );
    process.exit(1);
  }

  /* --- Fordon ------------------------------------------------------ */
  const toCreate = Math.max(0, VEHICLE_TARGET - existingVehicles);
  const now = new Date();
  const vehicleRows = Array.from({ length: toCreate }, () => {
    const spec = pick(MODELS);
    const year = int(2018, 2025);
    // Äldre bilar har rullat längre; el- och hybridbilar något mindre.
    const age = Math.max(0, now.getFullYear() - year);
    const km = int(1500, 26000) + age * int(9000, 24000);
    return {
      id: randomUUID(),
      organizationId: org.id,
      regNo: plate(),
      chassisNumber: vin(),
      brand: spec.brand,
      model: spec.model,
      year,
      fuel: spec.fuel,
      km,
      createdAt: new Date(now.getTime() - int(30, 900) * DAY),
    };
  });

  await db.vehicle.createMany({
    data: vehicleRows.map(({ fuel: _fuel, km: _km, ...v }) => v),
  });

  // Dynamiska fältvärden
  const fieldValues = vehicleRows.flatMap((v) => [
    {
      vehicleId: v.id,
      definitionId: fieldIds.get("Färg")!,
      value: pick(COLORS),
    },
    {
      vehicleId: v.id,
      definitionId: fieldIds.get("Drivmedel")!,
      value: v.fuel,
    },
    {
      vehicleId: v.id,
      definitionId: fieldIds.get("Växellåda")!,
      value: pick(GEARBOX),
    },
    {
      vehicleId: v.id,
      definitionId: fieldIds.get("Däck")!,
      value: pick(TYRES),
    },
  ]);
  await db.vehicleFieldValue.createMany({ data: fieldValues });

  // Mätarställningar: en historik som växer fram mot dagens värde.
  const readings = vehicleRows.flatMap((v) => {
    const count = int(2, 5);
    return Array.from({ length: count }, (_, i) => {
      const backDays = (count - 1 - i) * int(60, 150);
      return {
        vehicleId: v.id,
        value: Math.max(
          100,
          Math.round(v.km - (backDays / 365) * int(9000, 22000)),
        ),
        readingDate: new Date(now.getTime() - backDays * DAY),
      };
    });
  });
  await db.odometerReading.createMany({ data: readings });
  console.log(`  ${vehicleRows.length} fordon`);

  /* --- Kunder ------------------------------------------------------ */
  const existingCustomers = await db.customer.count({
    where: { organizationId: org.id },
  });
  const customersToCreate = Math.max(0, CUSTOMER_TARGET - existingCustomers);
  const companyCount = Math.round(customersToCreate * 0.35);

  const customerRows = Array.from({ length: customersToCreate }, (_, i) => {
    const isCompany = i < companyCount;
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = isCompany
      ? `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}`
      : `${first} ${last}`;
    const domain = isCompany
      ? `${slugify(name).slice(0, 14)}.se`
      : pick(["gmail.com", "hotmail.com", "outlook.com", "telia.com"]);
    return {
      id: randomUUID(),
      organizationId: org.id,
      type: isCompany ? "company" : "private",
      name,
      personalNumber: isCompany ? null : personalNumber(),
      orgNumber: isCompany ? orgNumber() : null,
      email: isCompany
        ? `info@${domain}`
        : `${slugify(first)}.${slugify(last)}@${domain}`,
      phone: phone(),
      address: `${pick(STREETS)} ${int(1, 89)}, ${pick(CITIES)}`,
      createdAt: new Date(now.getTime() - int(20, 800) * DAY),
      // Ett par borttagna kunder så papperskorgen har innehåll.
      deletedAt: chance(0.04)
        ? new Date(now.getTime() - int(1, 60) * DAY)
        : null,
    };
  });
  await db.customer.createMany({ data: customerRows });

  // Kontaktpersoner: företag får en primär plus någon extra, privatpersoner
  // ibland en anhörig som får hämta bilen.
  const contacts = customerRows.flatMap((c) => {
    const rows: {
      customerId: string;
      name: string;
      role: string | null;
      phone: string;
      email: string | null;
      isPrimary: boolean;
    }[] = [];
    if (c.type === "company") {
      const primary = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      rows.push({
        customerId: c.id,
        name: primary,
        role: "Kontaktperson",
        phone: phone(),
        email: `${slugify(primary.split(" ")[0])}@${(c.email ?? "info@exempel.se").split("@")[1]}`,
        isPrimary: true,
      });
      for (let i = 0; i < int(0, 2); i++) {
        rows.push({
          customerId: c.id,
          name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
          role: pick([
            "Hämtar bil",
            "Verkstadsansvarig",
            "Chaufför",
            "Ekonomi",
          ]),
          phone: phone(),
          email: null,
          isPrimary: false,
        });
      }
    } else if (chance(0.25)) {
      rows.push({
        customerId: c.id,
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        role: "Hämtar bil",
        phone: phone(),
        email: null,
        isPrimary: false,
      });
    }
    return rows;
  });
  await db.customerContact.createMany({ data: contacts });

  const comments = customerRows
    .filter(() => chance(0.3))
    .flatMap((c) =>
      sample(COMMENTS, int(1, 2)).map((text) => ({
        customerId: c.id,
        text,
        authorName: pick(members.map((m) => m.user.name)),
        createdAt: new Date(now.getTime() - int(1, 400) * DAY),
      })),
    );
  await db.customerComment.createMany({ data: comments });
  console.log(
    `  ${customerRows.length} kunder, ${contacts.length} kontaktpersoner`,
  );

  /* --- Kund ↔ fordon ----------------------------------------------- */
  // Företagen tar de stora bilparkerna, privatpersonerna en eller två bilar.
  const allVehicles = await db.vehicle.findMany({
    where: { organizationId: org.id, deletedAt: null },
    select: { id: true },
  });
  const pool = allVehicles.map((v) => v.id);
  let cursor = 0;
  const links: { customerId: string; vehicleId: string }[] = [];
  for (const c of customerRows) {
    if (cursor >= pool.length) break;
    const count =
      c.type === "company" ? int(3, 14) : chance(0.75) ? 1 : int(1, 2);
    for (let i = 0; i < count && cursor < pool.length; i++) {
      links.push({ customerId: c.id, vehicleId: pool[cursor++] });
    }
  }
  await db.customerVehicle.createMany({ data: links, skipDuplicates: true });
  console.log(`  ${links.length} fordon kopplade till kunder`);

  /* --- Arbetsordrar ------------------------------------------------- */
  const monday = startOfDay(now);
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));

  const jobs: JobSpec[] = [];

  for (let i = 0; i < JOB_TARGET; i++) {
    const type = pick(JOB_TYPES);
    // Från tio veckor bakåt till tre veckor framåt, tyngdpunkt på nuet.
    const dayOffset = int(-70, 21);
    const day = new Date(monday);
    day.setDate(monday.getDate() + ((now.getDay() + 6) % 7) + dayOffset);
    // Hoppa över helger – verkstaden har öppet måndag till fredag.
    if (day.getDay() === 0 || day.getDay() === 6) {
      day.setDate(day.getDate() + (day.getDay() === 0 ? 1 : 2));
    }

    const durationMin = pick([30, 45, 60, 90, 120, 150, 180, 240, 300]);
    const start = new Date(day);
    start.setHours(int(7, 15), pick([0, 0, 15, 30, 45]), 0, 0);
    const end = new Date(start.getTime() + durationMin * 60000);

    const past = start.getTime() < now.getTime() - DAY;
    const today = startOfDay(start).getTime() === startOfDay(now).getTime();
    const status = past
      ? chance(0.85)
        ? "done"
        : pick(["delayed", "waiting_parts"])
      : today
        ? pick([
            "in_progress",
            "in_progress",
            "planned",
            "waiting_parts",
            "done",
          ])
        : chance(0.9)
          ? "planned"
          : "waiting_parts";

    // Några ordrar saknar tid (ligger som "ej schemalagd") och några är
    // mjukraderade, så papperskorgen och obokade listor har innehåll.
    const unscheduled = chance(0.05);
    const deleted = chance(0.03);

    jobs.push({
      id: randomUUID(),
      vehicleIds: sample(pool, chance(0.12) ? 2 : 1),
      userIds: sample(memberIds, chance(0.25) && memberIds.length > 1 ? 2 : 1),
      type,
      status,
      priority: chance(0.18) ? "high" : chance(0.25) ? "low" : "normal",
      description: pick(DESCRIPTIONS[type]),
      scheduledStart: unscheduled ? null : start,
      scheduledEnd: unscheduled ? null : end,
      durationMin,
      deletedAt: deleted ? new Date(now.getTime() - int(1, 40) * DAY) : null,
    });
  }

  // Dagens och morgondagens schema byggs explicit, så översikten och dagvyn
  // aldrig står tomma bara för att slumpen missade just de datumen.
  const tomorrow = new Date(startOfDay(now));
  tomorrow.setDate(tomorrow.getDate() + (now.getDay() === 5 ? 3 : 1));
  jobs.push(
    ...buildDayJobs(startOfDay(now), TODAY_JOBS, pool, memberIds, now),
    ...buildDayJobs(
      tomorrow,
      Math.round(TODAY_JOBS * 0.8),
      pool,
      memberIds,
      now,
    ),
  );

  const partCount = await persistJobs(org.id, jobs, now);
  console.log(`  ${jobs.length} arbetsordrar, ${partCount} inköpsrader`);

  /* --- Kvitto för ångra ---------------------------------------------- *
   * Alla id:n som skapats skrivs till en fil. `clear-demo-data.ts` läser den
   * och tar bort exakt de raderna – inget annat. Utan kvittot går demodatan
   * inte att skilja från riktig data i efterhand. */
  const receiptPath = join(
    process.cwd(),
    "scripts",
    `demo-seed-${org.slug}.json`,
  );
  writeFileSync(
    receiptPath,
    JSON.stringify(
      {
        organizationId: org.id,
        organizationName: org.name,
        createdAt: new Date().toISOString(),
        vehicleIds: vehicleRows.map((v) => v.id),
        customerIds: customerRows.map((c) => c.id),
        jobIds: jobs.map((j) => j.id),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`  kvitto för borttagning: ${receiptPath}`);

  /* --- Sammanfattning ---------------------------------------------- */
  const [v, c, j, p] = await Promise.all([
    db.vehicle.count({ where: { organizationId: org.id } }),
    db.customer.count({ where: { organizationId: org.id } }),
    db.job.count({ where: { organizationId: org.id } }),
    db.jobPart.count({ where: { job: { organizationId: org.id } } }),
  ]);
  console.log(
    `\nKlart. ${org.name} har nu ${v} fordon, ${c} kunder, ${j} arbetsordrar och ${p} inköpsrader.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
