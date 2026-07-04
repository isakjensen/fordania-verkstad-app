"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  ImageOff,
  Car,
  CalendarDays,
  UserRound,
  Wrench,
  ExternalLink,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AttachmentImage {
  id: string;
  caption: string | null;
  fileName: string;
  createdAt: string;
  uploadedByName: string | null;
  workOrderId: string;
  workOrderRef: string;
  workOrderType: string;
  vehicleLabels: string[];
}

const dtf = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Responsivt bildgalleri med drawer-visare. Miniatyrer i ett rutnät; klick
 * öppnar bilden i en drawer. På dator/stor skärm glider drawern in från höger;
 * på stående iPad och telefon (< lg) tar den full bredd.
 *
 * Bilderna serveras tenant-auktoriserat via /api/images/[id]. `onDelete` är
 * valfritt – anges det visas en ta-bort-knapp i visaren.
 */
export function AttachmentGallery({
  images,
  emptyText = "Inga bilder ännu.",
  showWorkOrderLink = true,
  onDelete,
}: {
  images: AttachmentImage[];
  emptyText?: string;
  showWorkOrderLink?: boolean;
  onDelete?: (id: string) => Promise<{ error?: string } | void>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const active = openIndex !== null ? images[openIndex] ?? null : null;

  function close() {
    setOpenIndex(null);
    setError("");
  }

  function step(delta: number) {
    setOpenIndex((i) => {
      if (i === null) return i;
      const next = i + delta;
      if (next < 0 || next >= images.length) return i;
      return next;
    });
    setError("");
  }

  function handleDelete() {
    if (!active || !onDelete) return;
    setError("");
    startTransition(async () => {
      const res = await onDelete(active.id);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      close();
    });
  }

  if (images.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-surface-muted/50 px-3 py-4 text-sm text-muted-foreground">
        <ImageOff className="size-4" />
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-surface-muted transition-shadow hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              aria-label={`Öppna bild från ${img.workOrderType} ${img.workOrderRef}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${img.id}`}
                alt={img.caption ?? img.fileName}
                loading="lazy"
                className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-left text-[0.65rem] font-medium text-white">
                {img.workOrderRef}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={openIndex !== null} onOpenChange={(o) => (!o ? close() : null)}>
        <SheetContent className="max-w-none lg:max-w-2xl">
          {active ? (
            <>
              <SheetHeader className="pr-12">
                <SheetTitle className="flex items-center gap-2">
                  <Wrench className="size-4 text-brand-600" />
                  {active.workOrderType}
                  <span className="font-mono text-sm font-normal text-muted-foreground">
                    {active.workOrderRef}
                  </span>
                </SheetTitle>
              </SheetHeader>

              <SheetBody className="flex flex-col gap-4">
                {/* Bild */}
                <div className="relative flex items-center justify-center rounded-xl bg-black/90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${active.id}`}
                    alt={active.caption ?? active.fileName}
                    className="max-h-[60svh] w-full rounded-xl object-contain"
                  />
                  {images.length > 1 ? (
                    <>
                      <NavButton
                        side="left"
                        disabled={openIndex === 0}
                        onClick={() => step(-1)}
                      />
                      <NavButton
                        side="right"
                        disabled={openIndex === images.length - 1}
                        onClick={() => step(1)}
                      />
                      <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
                        {(openIndex ?? 0) + 1} / {images.length}
                      </span>
                    </>
                  ) : null}
                </div>

                {active.caption ? (
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {active.caption}
                  </p>
                ) : null}

                {/* Metadata */}
                <dl className="divide-y divide-line rounded-xl border border-line">
                  {active.vehicleLabels.length ? (
                    <MetaRow icon={Car} label="Fordon">
                      <span className="flex flex-wrap gap-1.5">
                        {active.vehicleLabels.map((v) => (
                          <span
                            key={v}
                            className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-ink"
                          >
                            {v}
                          </span>
                        ))}
                      </span>
                    </MetaRow>
                  ) : null}
                  {showWorkOrderLink ? (
                    <MetaRow icon={Wrench} label="Arbetsorder">
                      <Link
                        href={`/arbetsordrar/${active.workOrderId}`}
                        className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                      >
                        {active.workOrderType} {active.workOrderRef}
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </MetaRow>
                  ) : null}
                  {active.uploadedByName ? (
                    <MetaRow icon={UserRound} label="Uppladdad av">
                      {active.uploadedByName}
                    </MetaRow>
                  ) : null}
                  <MetaRow icon={CalendarDays} label="Datum">
                    {dtf.format(new Date(active.createdAt))}
                  </MetaRow>
                </dl>

                {error ? (
                  <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                    {error}
                  </p>
                ) : null}

                {onDelete ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDelete}
                      disabled={pending}
                      className="text-danger hover:bg-danger-soft"
                    >
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Ta bort bild
                    </Button>
                  </div>
                ) : null}
              </SheetBody>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Car;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-right text-sm text-ink">{children}</span>
    </div>
  );
}

function NavButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Föregående bild" : "Nästa bild"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-0",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="size-5" />
      ) : (
        <ChevronRight className="size-5" />
      )}
    </button>
  );
}
