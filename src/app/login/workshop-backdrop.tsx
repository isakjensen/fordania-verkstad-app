/**
 * Bakgrunden på inloggningssidan: ett riktigt verkstadsfoto.
 *
 * Ett första försök hade ritade verktygsikoner i ett mönster – de såg billiga
 * ut, som clipart, hur svaga de än gjordes. Ett verkstadsmotiv kräver ett
 * foto. Bilden (`public/verkstad-bakgrund.webp`) är en verkstadshall med
 * skåpbilar och personbilar på rad – hämtad från Unsplash under
 * Unsplash-licensen (fri kommersiell användning), källa:
 * https://images.unsplash.com/photo-1727893294198-e85137574f5b
 *
 * Motivet är valt för att det är just den verkstad appen planerar: en hel
 * fordonspark inne för service, inte en enskild bil eller en verktygsvägg.
 * Filen är beskuren nedtill i källan (`crop=bottom`) för att få bort en skylt
 * i taket – den blev den enda läsbara texten i bakgrunden.
 *
 * Lagren, nedifrån och upp:
 *  1. Djup stålblå botten – syns innan fotot laddat, så sidan aldrig blinkar
 *     vit, och lyser igenom fotots nedtonade svärta.
 *  2. Fotot, nedtonat och lätt avmättat.
 *  3. Mörkt svep snett över ytan som lyfter övre vänstra hörnet och sänker
 *     nedre högra – ger djup och håller ner detaljerna längst ner.
 *  4. Varm glöd i loggans orange bakom kortet.
 *  5. Filmkorn (feTurbulence) i overlay – binder ihop foto och gradienter så
 *     att skarvarna inte banderar på stora skärmar.
 *  6. Vinjett som mörkar kanterna och drar blicken mot mitten.
 */
export function WorkshopBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b111b]"
    >
      {/* 2. Fotot. På smal skärm beskär object-cover bort allt utom en lodrät
             remsa; centrerad blir den remsan bara golvgången. Därför ligger
             fokus åt vänster på telefon, där skåpbilarna står, och centrerat
             först från sm och uppåt. Lätt blur och skala håller kanterna rena
             och lägger motivet på djupet, så att inloggningskortet blir det
             enda skarpa på sidan. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/verkstad-bakgrund.webp"
        alt=""
        width={2000}
        height={980}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full scale-105 object-cover object-left blur-[1px] brightness-[0.55] saturate-[0.85] sm:object-center"
      />

      {/* 3. Mörkt svep – ljusare uppe till vänster, tyngre nere till höger */}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgb(14_22_35/0.3)_0%,rgb(9_15_25/0.5)_45%,rgb(4_8_14/0.72)_100%)]" />

      {/* 4. Varm glöd bakom kortet, i loggans orange */}
      <div className="absolute inset-0 bg-[radial-gradient(55rem_38rem_at_50%_42%,rgb(245_144_26/0.16),transparent_68%)]" />

      {/* 5. Filmkorn. baseFrequency runt 0.75 ger ett finkornigt brus – lägre
             värden blir stora moln, högre blir platt grått. mix-blend-overlay
             låter kornet ljusna och mörkna ytan i stället för att lägga en
             grå slöja över den. */}
      <svg className="absolute inset-0 size-full opacity-[0.12] mix-blend-overlay">
        <filter id="verkstadskorn">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#verkstadskorn)" />
      </svg>

      {/* 6. Vinjett */}
      <div className="absolute inset-0 bg-[radial-gradient(75rem_55rem_at_50%_45%,transparent_38%,rgb(3_6_11/0.55)_100%)]" />
    </div>
  );
}
