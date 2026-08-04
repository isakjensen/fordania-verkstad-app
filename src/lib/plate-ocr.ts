/**
 * Matchning av registreringsskyltar (svenska och albanska) mot verkstadens
 * KÄNDA flotta.
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

/**
 * Versaler, bara A–Z och 0–9. Å/Ä/Ö/Ü översätts i stället för att strykas:
 * svenska skyltar saknar dem, men tyska ortskoder har dem (MÜ, LÖ, WÜ) och en
 * struken bokstav hade gjort skylten obegriplig.
 */
export function normalizePlate(input: string): string {
  return input
    .toUpperCase()
    .replace(/[ÅÄ]/g, "A")
    .replace(/Ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/[^A-Z0-9]/g, "");
}

/** Länder vars skyltformat skannern känner igen. */
export type PlateCountry = "SE" | "AL" | "DK" | "DE";

/** Delar upp en kompakt skylt i grupper: ("ABC123", [3,3]) → "ABC 123". */
function group(compact: string, sizes: number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of sizes) {
    parts.push(compact.slice(at, at + size));
    at += size;
  }
  return parts.filter(Boolean).join(" ");
}

/**
 * Skyltformaten vi litar på, i den ordning de provas. Först det format som
 * matchar vinner, och ordningen är därför inte godtycklig: ett svenskt
 * "ABC 123" skulle också kunna läsas som en tysk skylt (ortskod AB, bokstav C,
 * siffror 123). Sverige är verkstadens hemmaplan och går först.
 *
 * Svenskt: tre bokstäver, två siffror och ett sista tecken som är en siffra
 * (ABC 123) eller en bokstav (ABC 12A, formatet sedan 2019).
 *
 * Albanskt: nuvarande format sedan 2011 är två bokstäver, tre siffror och två
 * bokstäver (AA 123 BB). Äldre skyltar från 1993 har distriktskod, fyra
 * siffror och en bokstav (TR 1234 A) och rullar fortfarande, så båda finns med.
 *
 * Danskt: två bokstäver och fem siffror (AB 12 345).
 *
 * Tyskt: ortskod (1–3 bokstäver), 1–2 igenkänningsbokstäver och 1–4 siffror
 * (HH AB 123, B AB 1234). Ett avslutande E (elbil) eller H (veteranbil) är
 * tillåtet. Var ortskoden slutar går inte att läsa ur en hopskriven sträng, så
 * visningen antar två igenkänningsbokstäver – det vanligaste – och lägger
 * resten på ortskoden.
 *
 * Det tyska mönstret är löst nog att svälja mycket: bokstäver följt av siffror
 * beskriver också halva världens dekaler och skyltar. Därför kräver det minst
 * fem tecken. Priset är att mycket korta tyska skyltar (M A 1) inte känns
 * igen; vinsten är att skannern slutar agera på skräpavläsningar, som annars
 * hade kunnat öppna fel fordon eller lägga upp ett påhittat i registret.
 *
 * Två format delas med länder vi inte har med: norska skyltar ser likadana ut
 * som danska (AB 12345) och finska som svenska (ABC 123). En norsk bil visas
 * alltså med dansk flagga och en finsk med svensk. Det går inte att skilja på
 * dem utan att läsa av landsbandet på skylten, vilket OCR:en inte gör.
 */
const PLATE_FORMATS: {
  country: PlateCountry;
  re: RegExp;
  display: (compact: string) => string;
}[] = [
  {
    country: "SE",
    re: /^[A-Z]{3}[0-9]{2}[0-9A-Z]$/,
    display: (c) => group(c, [3, 3]),
  },
  {
    country: "AL",
    re: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/,
    display: (c) => group(c, [2, 3, 2]),
  },
  {
    country: "AL",
    re: /^[A-Z]{2}[0-9]{4}[A-Z]$/,
    display: (c) => group(c, [2, 4, 1]),
  },
  {
    country: "DK",
    re: /^[A-Z]{2}[0-9]{5}$/,
    // Grupperingen 2-3-2 (AA 123 45) enligt hur skyltarna faktiskt ser ut.
    // Wikipedia och flera danska sidor anger 2-2-3, men den som sett skylten
    // vinner över den som läst om den.
    display: (c) => group(c, [2, 3, 2]),
  },
  {
    country: "DE",
    // (?=.{5,}) = minst fem tecken totalt, se kommentaren ovan.
    re: /^(?=.{5,})[A-Z]{2,5}[0-9]{1,4}[EH]?$/,
    display: (c) => {
      const letters = c.match(/^[A-Z]+/)![0];
      const rest = c.slice(letters.length);
      const city = Math.max(1, letters.length - 2);
      return `${letters.slice(0, city)} ${letters.slice(city)} ${rest}`;
    },
  },
];

/**
 * Vilket lands skylt texten ser ut att vara, eller null om den inte matchar
 * något känt format. Skannern agerar bara på skyltar som får ett svar här.
 */
export function plateCountry(
  input: string | null | undefined,
): PlateCountry | null {
  if (!input) return null;
  const compact = normalizePlate(input);
  return PLATE_FORMATS.find((f) => f.re.test(compact))?.country ?? null;
}

/** Sant om texten är en skylt i något av de format vi känner igen. */
export function isKnownPlate(input: string): boolean {
  return plateCountry(input) !== null;
}

/**
 * Formaterar en skylt för VISNING med mellanslag mellan grupperna: "ABC 123"
 * (svenskt), "AA 123 BB" (albanskt), "AB 12 345" (danskt) och "HH AB 123"
 * (tyskt). Databasen lagrar skylten kompakt; mellanslagen läggs bara till vid
 * visning. Format vi inte känner igen lämnas oförändrade (bara trimmade).
 */
export function formatPlate(value: string | null | undefined): string {
  if (!value) return "";
  const compact = normalizePlate(value);
  const format = PLATE_FORMATS.find((f) => f.re.test(compact));
  return format ? format.display(compact) : value.trim();
}

/**
 * Plockar ut skylt-lika tokens ur rå OCR-text – alla format vi känner igen,
 * med eller utan avskiljare mellan grupperna.
 */
export function extractPlateCandidates(rawText: string): string[] {
  const upper = rawText.toUpperCase();
  const found = new Set<string>();
  const patterns = [
    /[A-Z]{3}[\s-]?\d{2}[\s-]?[A-Z0-9]/g, // ABC 123 / ABC 12A (SE)
    /[A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}/g, // AA 123 BB (AL)
    /[A-Z]{2}[\s-]?\d{4}[\s-]?[A-Z]/g, // TR 1234 A (AL, äldre)
    /[A-Z]{2}[\s-]?\d{2}[\s-]?\d{3}/g, // AB 12 345 (DK)
    /[A-Z]{1,3}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}[EH]?/g, // HH AB 123 (DE)
  ];

  for (const source of [upper, upper.replace(/[^A-Z0-9]/g, "")]) {
    for (const pattern of patterns) {
      let m: RegExpExecArray | null;
      const re = new RegExp(pattern.source, "g");
      while ((m = re.exec(source)) !== null) {
        found.add(normalizePlate(m[0]));
      }
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
