"use client";

import { Bell, BellOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { UserMenu } from "./user-menu";

/**
 * Topbar – endast på desktop (mus/fine pointer + lg-bredd). På iPad och mobil
 * används i stället flikfältet längst ner (BottomNav) med verkstad, sök och
 * konto i "Mer", så toppen kan hållas ren och ge mer plats åt innehållet.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 hidden h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 pt-safe backdrop-blur-md pointer-fine:lg:flex md:px-6">
      {/* Global sök */}
      <GlobalSearch />

      {/* Höger: åtgärder – förankrade i högra hörnet */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notiser */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-11 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted data-popup-open:bg-surface-muted pointer-coarse:size-12"
            aria-label="Notiser"
          >
            <Bell className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notiser</DropdownMenuLabel>
              <div className="flex flex-col items-center gap-2 px-3 py-7 text-center">
                <BellOff className="size-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Inga nya notiser just nu.
                </p>
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Användarmeny */}
        <div className="mx-1 h-7 w-px bg-line" />
        <UserMenu subtitle="Verkstad" />
      </div>
    </header>
  );
}
