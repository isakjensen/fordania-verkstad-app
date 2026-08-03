"use client";

import { cn } from "@/lib/utils";

/**
 * Flikväxlingen mellan Systemlogg och Aktiva nu: hela sidan glider i sidled.
 *
 * Båda vyerna renderas hela tiden och ligger sida vid sida på ett spår som är
 * dubbelt så brett som fönstret. Bytet flyttar spåret ett halvt varv, så den
 * gamla vyn glider ut åt ena hållet medan den nya glider in – i stället för
 * att den gamla försvinner i ett hopp och bara den nya animeras.
 *
 * Spåret ligger kvar monterat över navigeringen, så CSS-övergången hinner
 * köra även när adressen byts (?view=live).
 */
export function ViewSlide({
  view,
  children,
  live,
}: {
  view: "log" | "live";
  /** Systemloggen – vänstra rutan. */
  children: React.ReactNode;
  /** Aktiva nu – högra rutan. */
  live: React.ReactNode;
}) {
  const showingLive = view === "live";

  return (
    // items-start: rutorna ska behålla sin egen höjd, den kortare av dem ska
    // inte sträckas ut till den längres.
    <div className="overflow-x-hidden">
      <div
        className={cn(
          "flex w-[200%] items-start transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          showingLive && "-translate-x-1/2",
        )}
      >
        <Pane hidden={showingLive}>{children}</Pane>
        <Pane hidden={!showingLive}>{live}</Pane>
      </div>
    </div>
  );
}

/**
 * En ruta i spåret. Den som inte visas göms för skärmläsare och tangentbord –
 * annars kan man tabba in i osynligt innehåll utanför skärmkanten.
 */
function Pane({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-1/2 shrink-0" aria-hidden={hidden} inert={hidden}>
      {children}
    </div>
  );
}
