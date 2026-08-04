"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setJobStatus } from "../planering/actions";

/**
 * Klarmarkering direkt i listan över dagens uppdrag.
 *
 * Mekanikern ska kunna kvittera ett jobb utan att först öppna arbetsordern –
 * det är den vanligaste handlingen på den här sidan. Knappen ligger ovanpå
 * radens länk (z-20) så ett tryck på den inte navigerar vidare.
 *
 * Är uppdraget redan klart byts knappen mot en ångra-knapp: fel tryck ska
 * kunna backas på samma ställe som det gjordes.
 */
export function DoneToggle({ jobId, done }: { jobId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    setError("");
    startTransition(async () => {
      // Tillbaka till "pågår" vid ångra: uppdraget var påbörjat, annars hade
      // det inte kunnat bli klart.
      const res = await setJobStatus(jobId, done ? "in_progress" : "done");
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div className="relative z-20 flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={done ? "outline" : "success"}
        size="sm"
        disabled={pending}
        onClick={toggle}
        aria-label={done ? "Ångra klarmarkering" : "Markera som klar"}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : done ? (
          <RotateCcw />
        ) : (
          <Check />
        )}
        {done ? "Ångra" : "Klar"}
      </Button>
      {error ? (
        <p className="text-right text-xs font-medium text-danger">{error}</p>
      ) : null}
    </div>
  );
}
