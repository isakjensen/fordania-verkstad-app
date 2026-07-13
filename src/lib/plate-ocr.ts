/**
 * Matchning av svenska registreringsskyltar mot verkstadens KÄNDA flotta.
 * Själva avläsningen görs av ALPR-motorn i `plate-alpr.ts`; den här modulen
 * städar och matchar resultatet. Matchningen mot flottan gör flödet robust:
 * även en halvbra avläsning kan landa rätt fordon.
 */

export interface ScanFleetVehicle {
  id: string;
  regNo: string;
  brand: string | null;
  model: string | null;
}

/** Tecken som OCR ofta blandar ihop – behandlas som likvärdiga vid matchning. */
const CONFUSABLE: Record<string, string[]> = {
  "0": ["O", "D", "Q"],
  O: ["0", "D", "Q"],
  "1": ["I", "L", "T"],
  I: ["1", "L", "T"],
  "5": ["S"],
  S: ["5"],
  "8": ["B"],
  B: ["8"],
  "2": ["Z"],
  Z: ["2"],
  "6": ["G"],
  G: ["6"],
};

/** Versaler, bara A–Z och 0–9 (svenska skyltar saknar Å/Ä/Ö och specialtecken). */
export function normalizePlate(input: string): string {
  return input
    .toUpperCase()
    .replace(/[ÅÄ]/g, "A")
    .replace(/Ö/g, "O")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Formaterar en svensk skylt för VISNING: "ABC 123" / "ABC 12A" med mellanslag
 * mellan bokstavsdelen och den avslutande delen. Databasen lagrar skylten
 * kompakt (ABC123); mellanslaget läggs bara till vid visning. Okända/utländska
 * format lämnas oförändrade (bara trimmade).
 */
export function formatPlate(value: string | null | undefined): string {
  if (!value) return "";
  const compact = value.replace(/[\s-]/g, "").toUpperCase();
  if (/^[A-Z]{3}[0-9]{2}[0-9A-Z]$/.test(compact)) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  return value.trim();
}

/**
 * Sant om texten är en giltig svensk personbilsskylt: tre bokstäver följt av
 * två siffror och ett sista tecken som är antingen en siffra (ABC123) eller
 * en bokstav (ABC12A, formatet sedan 2019). Skannern agerar BARA på skyltar
 * som klarar detta – utländska skyltar ignoreras.
 */
export function isSwedishPlate(input: string): boolean {
  return /^[A-Z]{3}[0-9]{2}[0-9A-Z]$/.test(normalizePlate(input));
}

/**
 * Plockar ut skylt-lika tokens ur rå OCR-text. Svenska format:
 * ABC 123 (3 bokstäver + 3 siffror) och ABC 12A (3 + 2 siffror + tecken).
 */
export function extractPlateCandidates(rawText: string): string[] {
  const upper = rawText.toUpperCase();
  const found = new Set<string>();
  const pattern = /[A-Z]{3}[\s-]?\d{2}[\s-]?[A-Z0-9]/g;

  for (const source of [upper, upper.replace(/[^A-Z0-9]/g, "")]) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, "g");
    while ((m = re.exec(source)) !== null) {
      found.add(normalizePlate(m[0]));
    }
  }

  // Reserv: hela den rensade strängen (om inget mönster hittades men det
  // finns tillräckligt med tecken att fuzzy-matcha mot).
  const compact = normalizePlate(upper);
  if (found.size === 0 && compact.length >= 5) {
    found.add(compact.slice(0, 6));
  }

  return [...found];
}

/** Klassiskt Levenshtein-avstånd. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Avstånd som räknar OCR-förväxlade tecken (0/O, 1/I …) som lika. */
function confusionDistance(a: string, b: string): number {
  if (a.length !== b.length) return levenshtein(a, b);
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (CONFUSABLE[a[i]]?.includes(b[i])) continue;
    d++;
  }
  return d;
}

export interface PlateMatch {
  vehicle: ScanFleetVehicle;
  distance: number;
}

/**
 * Rangordnar flottan efter hur nära den bäst matchande kandidaten ligger.
 * Lägst avstånd först. `distance === 0` = exakt träff.
 */
export function matchPlate(
  candidates: string[],
  fleet: ScanFleetVehicle[],
): PlateMatch[] {
  const cands = candidates.length ? candidates : [""];
  const scored = fleet.map((vehicle) => {
    const target = normalizePlate(vehicle.regNo);
    let best = Infinity;
    for (const c of cands) {
      const d = Math.min(
        levenshtein(c, target),
        confusionDistance(c, target),
      );
      if (d < best) best = d;
    }
    return { vehicle, distance: best };
  });
  scored.sort((a, b) => a.distance - b.distance);
  return scored;
}
