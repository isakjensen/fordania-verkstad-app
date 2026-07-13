"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Mjuk sidövergång – innehållet tonar in och glider upp med en lätt
 * skalning när rutten byts. Använder samma mjuka ease-out som resten av
 * appen så det känns smooth och medvetet utan att bli segt. Wrappern är
 * även sidans scroll-yta (skalets <main> klipper), så fullhöjds-vyer som
 * översikten kan ligga utan sidscroll medan längre sidor scrollar.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      // Bottenutrymme så innehållet aldrig hamnar bakom flikfältet. Endast
      // desktop (fine pointer + bredd) saknar flikfält och behöver ingen padding.
      className="h-full overflow-y-auto pb-[calc(4.75rem+env(safe-area-inset-bottom))] pointer-fine:lg:pb-0"
    >
      {children}
    </motion.div>
  );
}
