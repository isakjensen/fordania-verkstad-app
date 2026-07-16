"use client";

import { AnimatePresence } from "motion/react";
import { PlateScanner } from "./plate-scanner";

/**
 * Skanner-overlay som ligger ovanpå sidan man är på. AnimatePresence spelar
 * upp-/nedglidningen (via PlateScannerns motion-rot) och avmonterar sedan – så
 * öppning sker direkt utan route-navigering och stängning avslöjar sidan under
 * utan vit blink.
 */
export function ScannerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? <PlateScanner key="scanner" onClose={onClose} /> : null}
    </AnimatePresence>
  );
}
