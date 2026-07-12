/**
 * Prisberäkningar för arbetsorderns inköp/delar. Allt räknas i öre (heltal)
 * för att undvika flyttalsfel; konverteras till kronor först vid visning.
 */

export interface PartLike {
  quantity: number;
  unitPriceExclOre: number;
  vatRate: number;
}

export interface Totals {
  exclOre: number;
  vatOre: number;
  inclOre: number;
}

/** Summor (exkl. moms, moms, inkl. moms) för en enskild rad – i öre. */
export function partTotals(part: PartLike): Totals {
  const exclOre = Math.round(part.unitPriceExclOre * part.quantity);
  const vatOre = Math.round((exclOre * part.vatRate) / 100);
  return { exclOre, vatOre, inclOre: exclOre + vatOre };
}

/** En mekanikers arbetskostnad på en order (timlön × timmar). */
export interface LaborLike {
  hours: number | null;
  hourlyRateOreExcl: number | null;
  vatRate: number;
}

/**
 * Gör mekanikers timlön till prisrader (samma form som delar), så de kan
 * summeras och visas med exakt samma logik. Rader utan både timpris och
 * timmar hoppas över (ingen arbetskostnad angiven ännu).
 */
export function laborLines(mechanics: LaborLike[]): PartLike[] {
  return mechanics
    .filter(
      (m) =>
        m.hourlyRateOreExcl != null &&
        m.hourlyRateOreExcl > 0 &&
        m.hours != null &&
        m.hours > 0,
    )
    .map((m) => ({
      quantity: m.hours as number,
      unitPriceExclOre: m.hourlyRateOreExcl as number,
      vatRate: m.vatRate,
    }));
}

/** Summerar flera rader till en total – i öre. */
export function orderTotals(parts: PartLike[]): Totals {
  return parts.reduce<Totals>(
    (acc, p) => {
      const t = partTotals(p);
      return {
        exclOre: acc.exclOre + t.exclOre,
        vatOre: acc.vatOre + t.vatOre,
        inclOre: acc.inclOre + t.inclOre,
      };
    },
    { exclOre: 0, vatOre: 0, inclOre: 0 },
  );
}

const sek = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  minimumFractionDigits: 2,
});

/** Formaterar ett belopp i öre till svensk valuta, t.ex. 45000 → "450,00 kr". */
export function formatOre(ore: number): string {
  return sek.format(ore / 100);
}

export const VAT_RATES = [25, 12, 6];
