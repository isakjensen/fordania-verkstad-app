"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sheet, byggd på Base UI Dialog. Används bl.a. för arbetsorderdetaljer i
 * arbetskalendern.
 *
 * Presentationen följer enheten, precis som Dialog:
 *  - telefon: bottensark som glider upp nerifrån (tummen når stänglisten)
 *  - sm och uppåt: drawer som glider in från höger kant
 */
function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      {/* CSS-transition (inte keyframe-animation) så backdroppen hålls kvar i
          sitt stängda läge tills Base UI avmonterar den. Keyframe-varianten
          reverterade till fullt blur de sista bildrutorna innan avmontering
          (popupen glider 300ms, backdroppen animerade bara 200ms) → ett blink.
          Nu fade:as opacitet i takt med popupen utan revert. */}
      <DialogPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-black/25 supports-backdrop-filter:backdrop-blur-[1px] transition-opacity duration-300 ease-out data-starting-style:opacity-0 data-closed:opacity-0"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex w-full max-w-md flex-col overflow-y-auto bg-surface shadow-lift ring-1 ring-line outline-none",
          // Telefon: förankrad i underkanten, rundad topp och aldrig högre än
          // skärmen (svh, inte vh – annars hamnar botten bakom adressfältet).
          "inset-x-0 bottom-0 max-h-[92svh] rounded-t-3xl max-sm:max-w-none",
          // sm och uppåt: tillbaka till drawer längs högerkanten.
          "sm:inset-y-0 sm:right-0 sm:bottom-auto sm:left-auto sm:max-h-none sm:rounded-none",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Stängt läge: nedskjuten under skärmkanten på telefon, utskjuten åt
          // höger på större skärmar.
          "data-closed:translate-y-full data-starting-style:translate-y-full",
          "sm:data-closed:translate-y-0 sm:data-closed:translate-x-full",
          "sm:data-starting-style:translate-y-0 sm:data-starting-style:translate-x-full",
          className,
        )}
        {...props}
      >
        {/* Grabb-handtag – signalerar att arket hör till underkanten. Samma
            handtag som mobilmenyn använder. */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <span
            className="h-1.5 w-10 rounded-full bg-line-strong"
            aria-hidden
          />
        </div>
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Stäng</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("border-b border-line px-5 py-4", className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 px-5 py-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-bold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("mt-0.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
};
