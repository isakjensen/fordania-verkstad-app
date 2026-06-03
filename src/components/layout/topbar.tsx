"use client";

import Link from "next/link";
import { Menu, Bell, BellOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  onOpenMobile: () => void;
}

export function Topbar({ onOpenMobile }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-md md:px-6">
      {/* Hamburger – endast mobil/tablet */}
      <button
        onClick={onOpenMobile}
        className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted pointer-coarse:size-12 lg:hidden"
        aria-label="Öppna meny"
      >
        <Menu className="size-5 pointer-coarse:size-6" />
      </button>

      {/* Global sök */}
      <GlobalSearch />

      {/* Spacer för mobil */}
      <div className="flex-1 sm:hidden" />

      {/* Höger: åtgärder */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          size="md"
          variant="success"
          className="hidden sm:inline-flex"
          nativeButton={false}
          render={<Link href="/arbetsordrar" />}
        >
          <Plus className="size-4" />
          Ny arbetsorder
        </Button>
        <Button
          size="icon"
          variant="success"
          className="sm:hidden"
          aria-label="Ny arbetsorder"
          nativeButton={false}
          render={<Link href="/arbetsordrar" />}
        >
          <Plus className="size-5" />
        </Button>

        {/* Notiser */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface-muted data-popup-open:bg-surface-muted pointer-coarse:size-12"
            aria-label="Notiser"
          >
            <Bell className="size-5 pointer-coarse:size-6" />
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

        <div className="mx-1 hidden h-7 w-px bg-line sm:block" />

        <UserMenu subtitle="Verkstad" />
      </div>
    </header>
  );
}
