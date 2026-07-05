"use client";

/**
 * Inline-script som körs synkront medan webbläsaren parsar HTML:en – innan
 * första paint. Används för att t.ex. sätta temat före hydrering och undvika
 * blink (FOUC).
 *
 * React varnar annars när en komponent renderar en `<script>`. Knepet (enligt
 * Next-guiden "preventing flash before hydration"): sätt `type="text/javascript"`
 * på servern så scriptet körs, och `type="text/plain"` på klienten så det blir
 * inert och React slutar varna. `suppressHydrationWarning` sväljer type-skillnaden.
 *
 * MÅSTE vara en klientkomponent ("use client") – annars körs bara server-grenen
 * (window === undefined) och type förblir "text/javascript" även i klientens
 * hydrering, vilket gör att varningen kvarstår.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
