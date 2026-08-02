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
export function PageTransition({
  children,
  // Verkstadsskalet klipper i <main> och låter wrappern vara scroll-yta.
  // Superadmin scrollar i stället hela sidan och skickar därför egna klasser.
  className = "h-full overflow-y-auto pb-[calc(4.25rem+env(safe-area-inset-bottom))] pointer-fine:lg:pb-0",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
