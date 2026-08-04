/**
 * Tar bort demodatan som `seed-demo-data.ts` skapade – och bara den.
 *
 * Skriptet läser kvittot (scripts/demo-seed-<slug>.json) och raderar exakt de
 * id:n som står där. Rader som fanns i tenanten innan seedningen rörs inte.
 * Kopplingstabeller (delar, mätarställningar, kund-fordon, order-fordon)
 * försvinner med sina föräldrar via onDelete: Cascade i schemat.
 *
 * Kör: npx tsx scripts/clear-demo-data.ts [slug]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/lib/db";

const slug = process.argv[2] ?? process.env.DEMO_SLUG ?? "eriks-biluthyrning";

async function main() {
  const path = join(process.cwd(), "scripts", `demo-seed-${slug}.json`);
  let receipt: {
    organizationId: string;
    organizationName: string;
    vehicleIds: string[];
    customerIds: string[];
    jobIds: string[];
  };
  try {
    receipt = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    console.error(`Hittade inget kvitto på ${path}. Inget raderas.`);
    process.exit(1);
  }

  const jobs = await db.job.deleteMany({
    where: {
      id: { in: receipt.jobIds },
      organizationId: receipt.organizationId,
    },
  });
  const customers = await db.customer.deleteMany({
    where: {
      id: { in: receipt.customerIds },
      organizationId: receipt.organizationId,
    },
  });
  const vehicles = await db.vehicle.deleteMany({
    where: {
      id: { in: receipt.vehicleIds },
      organizationId: receipt.organizationId,
    },
  });

  console.log(
    `Raderade ur ${receipt.organizationName}: ${jobs.count} arbetsordrar, ${customers.count} kunder, ${vehicles.count} fordon.`,
  );
}

main().then(() => process.exit(0));
