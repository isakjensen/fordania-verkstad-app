import { LiveChip, Section } from "../_components/kit";

/* ------------------------------------------------------------------ *
 *  Facit: vilken design som faktiskt körs på de riktiga sidorna just nu.
 *  Listan är sammanställd genom att läsa koden – varje rad pekar ut filen
 *  designen bor i, så den går att kontrollera (och rätta när något ändras).
 * ------------------------------------------------------------------ */

interface Row {
  /** Elementet. */
  what: string;
  /** Vilken variant i labbet som är live – eller null när inget är det. */
  variant: string | null;
  /** Kort beskrivning av utseendet. */
  looks: string;
  /** Filen designen kommer ur. */
  file: string;
  /** Fliken i labbet där den ligger. */
  tab: string;
}

const rows: Row[] = [
  {
    what: "Primärknapp",
    variant: "Knappar · C",
    looks: "Upphöjd gradient: glansdager, varm kant och mjuk skugga",
    file: "components/ui/button.tsx",
    tab: "Knappar",
  },
  {
    what: "Sekundärknapp",
    variant: "Knappar · A",
    looks: "Kontur på canvasbakgrund",
    file: "components/ui/button.tsx · outline",
    tab: "Knappar",
  },
  {
    what: "Farlig åtgärd",
    variant: "Knappar · A",
    looks: "Mjuk röd fyllnad, röd text",
    file: "components/ui/button.tsx · destructive",
    tab: "Knappar",
  },
  {
    what: "Segmenterad kontroll",
    variant: "Knappar · A",
    looks: "Grått spår, aktivt läge som vitt kort med ring",
    file: "planering/schedule-calendar.tsx",
    tab: "Knappar",
  },
  {
    what: "Textfält",
    variant: "Fält · A",
    looks: "Kontur som byter färg vid fokus + ring",
    file: "components/ui/input.tsx",
    tab: "Fält",
  },
  {
    what: "Etikett",
    variant: "Fält · A",
    looks: "Ovanför fältet, 1.5-mellanrum",
    file: "components/ui/label.tsx",
    tab: "Fält",
  },
  {
    what: "Kryssruta",
    variant: "Fält · D",
    looks: "Rundad fyrkant, orange när ikryssad",
    file: "arbetsordrar/order-rows.tsx",
    tab: "Fält",
  },
  {
    what: "Reglage (av/på)",
    variant: null,
    looks: "Finns inte i appen än",
    file: "—",
    tab: "Fält",
  },
  {
    what: "Statusmärke",
    variant: "Status · A",
    looks: "Vit yta, färgad ring och prick",
    file: "planering/calendar-meta.ts",
    tab: "Status",
  },
  {
    what: "Nyckeltalskort",
    variant: "Status · A",
    looks: "Versal etikett, 2,5 rem siffra, dämpad ikon",
    file: "components/dashboard/stat-card.tsx",
    tab: "Status",
  },
  {
    what: "Kort",
    variant: "Kort & listor · A",
    looks: "Hårlinje, ingen skugga, avdelad rubrikrad",
    file: "components/ui/card.tsx",
    tab: "Kort & listor",
  },
  {
    what: "Listrad",
    variant: "Kort & listor · A",
    looks: "Delande hårlinjer, hover tonar raden",
    file: "arbetsordrar/order-rows.tsx",
    tab: "Kort & listor",
  },
  {
    what: "Sidomeny",
    variant: "Navigering · A",
    looks: "Varm gradient, aktivt läge vitt kort + orange stapel",
    file: "components/layout/sidebar.tsx",
    tab: "Navigering",
  },
  {
    what: "Flikar",
    variant: null,
    looks: "Finns inte i appen än",
    file: "—",
    tab: "Navigering",
  },
  {
    what: "Sidhuvud",
    variant: "Navigering · A",
    looks: "Versal överrubrik, extrafet rubrik, hårlinje under",
    file: "components/layout/page-header.tsx",
    tab: "Navigering",
  },
  {
    what: "Flikfält på mobil",
    variant: "Navigering · A",
    looks: "Ikon + etikett, upphöjd orange skanna-knapp i mitten",
    file: "components/layout/bottom-nav.tsx",
    tab: "Navigering",
  },
  {
    what: "Notiser",
    variant: null,
    looks: "Finns inte i appen än",
    file: "—",
    tab: "Återkoppling",
  },
  {
    what: "Banderoll",
    variant: "Återkoppling · A",
    looks: "Helbred gul bar med vit text (offline)",
    file: "components/pwa/pwa-manager.tsx",
    tab: "Återkoppling",
  },
  {
    what: "Tomt läge",
    variant: "Återkoppling · A",
    looks: "Ikon i rundad fyrkant, rubrik, hjälptext",
    file: "fordon/page.tsx",
    tab: "Återkoppling",
  },
  {
    what: "Laddning",
    variant: "Återkoppling · A",
    looks: "Skelett i samma mått som innehållet",
    file: "components/ui/skeleton.tsx",
    tab: "Återkoppling",
  },
  {
    what: "Dialogruta",
    variant: "Återkoppling · A",
    looks: "Bottenark på mobil, centrerad på desktop, avdelad sidfot",
    file: "components/ui/dialog.tsx",
    tab: "Återkoppling",
  },
  {
    what: "Registreringsskylt",
    variant: "Verkstaden · B",
    looks: "Matt vit platta, solid EU-blå, ingen gradient",
    file: "components/ui/license-plate.tsx",
    tab: "Verkstaden",
  },
  {
    what: "Fordonsrad",
    variant: "Verkstaden · D",
    looks: "Skylt först, namn, mätarställning, chevron",
    file: "fordon/vehicles-view.tsx",
    tab: "Verkstaden",
  },
  {
    what: "Kalenderns orderkort",
    variant: "Verkstaden · A",
    looks: "Ton efter ordertyp, typikon, liten statusprick",
    file: "planering/event-card.tsx",
    tab: "Verkstaden",
  },
  {
    what: "Mekaniker",
    variant: "Verkstaden · komponent",
    looks: "Avatar med initialer; i listor ren text",
    file: "components/ui/avatar.tsx",
    tab: "Verkstaden",
  },
];

export function LiveOverviewSection() {
  const live = rows.filter((r) => r.variant);
  const missing = rows.filter((r) => !r.variant);

  return (
    <div className="space-y-8">
      <Section
        title="Vad som körs på de riktiga sidorna just nu"
        description="Varje rad är läst ur koden. Samma design är grönmarkerad med LIVE inne i respektive flik, så du ser den bredvid alternativen."
      >
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-muted">
                {["Element", "Live i labbet", "Så ser den ut", "Filen"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {live.map((r) => (
                <tr key={r.what}>
                  <td className="px-4 py-2.5 text-sm font-medium whitespace-nowrap text-ink">
                    {r.what}
                  </td>
                  <td className="px-4 py-2.5 text-sm whitespace-nowrap text-ink-soft">
                    {r.variant}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {r.looks}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[0.7rem] whitespace-nowrap text-muted-foreground">
                    {r.file}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Saknas i appen"
        description="Här finns förslag i labbet men ingen motsvarighet på de riktiga sidorna – inget är alltså markerat LIVE i de grupperna."
      >
        <ul className="flex flex-wrap gap-2">
          {missing.map((r) => (
            <li
              key={r.what}
              className="rounded-lg border border-dashed border-line-strong px-3 py-2 text-sm text-ink-soft"
            >
              {r.what}
              <span className="ml-2 text-xs text-muted-foreground">
                {r.tab}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Så läser du märkningen">
        <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <LiveChip />
            = designen som körs på de riktiga sidorna just nu. Kortet har grön
            ram och visar filen den kommer ur.
          </p>
          <p className="text-sm text-ink-soft">
            <span className="inline-flex size-5 items-center justify-center rounded-md bg-ink/[0.06] font-mono text-[0.7rem] font-bold text-ink-soft">
              B
            </span>{" "}
            = förslag som inte används. Säg bara bokstaven så vet jag vilken du
            menar.
          </p>
          <p className="text-xs text-muted-foreground">
            Live-korten är byggda med exakt samma klasser som appen, och där en
            riktig komponent finns (Button, Input, Card, Badge, LicensePlate,
            Avatar) renderas komponenten själv – då kan labbet inte glida isär
            från verkligheten.
          </p>
        </div>
      </Section>
    </div>
  );
}
