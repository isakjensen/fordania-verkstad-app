"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicensePlate } from "@/components/ui/license-plate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  previewFordaniaSync,
  syncVehiclesFromFordania,
  type SyncResult,
} from "./actions";
import type { FordaniaSyncPreview } from "@/lib/data/vehicles";

export function SyncFordaniaButton() {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<FordaniaSyncPreview | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const newCount = preview?.newVehicles.length ?? 0;
  const hasNew = newCount > 0;
  const ok = result && "success" in result;

  // Öppnar dialogen och hämtar previewn från Fordania (först vid klick).
  function onOpen() {
    setOpen(true);
    setResult(null);
    setPreview(null);
    setLoadingPreview(true);
    startTransition(async () => {
      const p = await previewFordaniaSync();
      setPreview(p);
      setLoadingPreview(false);
    });
  }

  function onSync() {
    setResult(null);
    startTransition(async () => {
      const res = await syncVehiclesFromFordania();
      setResult(res);
      if ("success" in res) router.refresh();
    });
  }

  return (
    <>
      <Button variant="default" size="md" onClick={onOpen}>
        <RefreshCw className="size-4" />
        Synka från Fordania
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setResult(null);
            setPreview(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          {result ? (
            /* Efter synk: resultat */
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {ok ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <AlertTriangle className="size-5 text-danger" />
                  )}
                  {ok ? "Synk klar" : "Synk misslyckades"}
                </DialogTitle>
                <DialogDescription>
                  {result && "success" in result ? (
                    <>
                      Hämtade {result.total} fordon från Fordania.{" "}
                      <strong className="text-ink">{result.created}</strong> nya
                      och{" "}
                      <strong className="text-ink">{result.updated}</strong>{" "}
                      uppdaterade i registret.
                    </>
                  ) : (
                    (result && "error" in result && result.error) || null
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={
                    <Button type="button" variant={ok ? "success" : "outline"}>
                      Klart
                    </Button>
                  }
                />
              </DialogFooter>
            </>
          ) : loadingPreview || !preview ? (
            /* Laddar preview */
            <>
              <DialogHeader>
                <DialogTitle>Synka från Fordania</DialogTitle>
                <DialogDescription>
                  Kontrollerar vilka fordon som finns i Fordania…
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            </>
          ) : (
            /* Preview klar – visa vad som väntar */
            <>
              <DialogHeader>
                <DialogTitle>Synka från Fordania</DialogTitle>
                <DialogDescription>
                  {preview.error
                    ? preview.error
                    : hasNew
                      ? `${newCount} ${newCount === 1 ? "nytt fordon" : "nya fordon"} i Fordania finns inte i verkstaden ännu.`
                      : "Alla fordon i Fordania finns redan i verkstaden."}
                </DialogDescription>
              </DialogHeader>

              {hasNew ? (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {preview.newVehicles.map((v) => (
                    <li
                      key={v.plate}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <LicensePlate value={v.plate} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                        {v.model || (
                          <span className="text-muted-foreground">
                            Okänd modell
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <DialogFooter>
                <DialogClose
                  render={
                    <Button type="button" variant="outline">
                      Avbryt
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="success"
                  onClick={onSync}
                  disabled={pending || !!preview.error}
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {hasNew ? `Hämta ${newCount}` : "Hämta ändå"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
