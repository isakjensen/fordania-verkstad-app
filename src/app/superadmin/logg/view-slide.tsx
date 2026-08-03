"use client";

import { motion } from "motion/react";

/**
 * Glider innehållet i sidled när man byter mellan Systemlogg och Aktiva nu.
 *
 * Riktningen kommer ur vyns plats i flikraden i stället för ur ett minne av
 * var man kom ifrån: Aktiva nu ligger till höger och glider in från höger,
 * Systemlogg ligger till vänster och glider in från vänster. Resultatet blir
 * detsamma åt båda hållen – fram och tillbaka känns som samma rörelse
 * spegelvänd – men utan tillstånd som kan hamna i otakt.
 */
export function ViewSlide({
  view,
  children,
}: {
  view: "log" | "live";
  children: React.ReactNode;
}) {
  return (
    // overflow-x-hidden: den infarande vyn ska inte kunna skapa en vågrät
    // rullningslist under rörelsen.
    <div className="overflow-x-hidden">
      <motion.div
        key={view}
        initial={{ x: view === "live" ? 40 : -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
