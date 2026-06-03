"use client";

import Link from "next/link";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        className="flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-slate-100 lg:hidden"
        aria-label="Öppna meny"
      >
        <Menu className="size-5" />
      </button>

      {/* Sökfält */}
      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Sök fordon, reg.nr eller order…"
          className="h-10 rounded-lg bg-surface-muted pl-9"
        />
      </div>

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

        <button
          className="relative flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-slate-100"
          aria-label="Notiser"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        <div className="mx-1 hidden h-7 w-px bg-line sm:block" />

        <UserMenu subtitle="Verkstad" />
      </div>
    </header>
  );
}
