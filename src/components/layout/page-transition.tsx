"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Snabb, subtil sidövergång – en kort fade + lätt glid när rutten byts.
 * Medvetet kort (160 ms) så den känns smooth utan att kännas seg. Wrappern
 * är även sidans scroll-yta (skalets <main> klipper), så fullhöjds-vyer som
 * översikten kan ligga utan sidscroll medan längre sidor scrollar.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="h-full overflow-y-auto"
    >
      {children}
    </motion.div>
  );
}
