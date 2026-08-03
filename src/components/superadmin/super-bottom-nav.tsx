"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, Store, LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/avatar";
import { clearOfflinePageCache } from "@/lib/offline-cache";
import { superadminNav } from "./nav";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// Kortare etiketter än sidomenyn – fem flikar ska rymmas på en smal telefon
// utan att texten kapas.
const shortLabels: Record<string, string> = { Systemlogg: "Logg" };

const tabs: { label: string; href: string; icon: LucideIcon }[] =
  superadminNav.map((item) => ({
    ...item,
    label: shortLabels[item.label] ?? item.label,
  }));

/** Flikfält för superadmin på touch (mobil / iPad). Sidomenyn och topbaren
 *  visas bara på desktop, precis som i verkstadsappen – konto och utloggning
 *  nås därför via "Mer". */
export function SuperBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/superadmin"
      ? pathname === "/superadmin"
      : pathname.startsWith(href);

  const tabClass = (active: boolean) =>
    cn(
      "flex min-h-14 flex-1 select-none flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[0.66rem] font-semibold transition-colors",
      active ? "text-brand-600" : "text-muted-foreground active:bg-surface-muted",
    );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pl-safe pr-safe pb-safe backdrop-blur-xl pointer-fine:lg:hidden"
        aria-label="Superadmin-navigation"
      >
        <div className="mx-auto flex max-w-xl items-stretch justify-around">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={tabClass(active)}
              >
                <Icon
                  className={cn("size-6 transition-transform", active && "scale-105")}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className="truncate">{tab.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={tabClass(moreOpen)}
          >
            <Menu className="size-6" strokeWidth={moreOpen ? 2.4 : 2} />
            <span>Mer</span>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: session } = authClient.useSession();
  const name = session?.user.name ?? "—";
  const email = session?.user.email ?? "";

  async function logout() {
    try {
      await authClient.signOut();
    } finally {
      // Samma hårda navigering som i verkstaden – ingen kvarhängande
      // klient-vy av den inloggade appen efteråt.
      await clearOfflinePageCache();
      window.location.href = "/login";
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Se kommentaren i verkstadens bottom-nav: CSS-transition i takt med
            popupens 300 ms, annars blinkar backdroppen till efter stängning. */}
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ease-out data-starting-style:opacity-0 data-closed:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col rounded-t-3xl bg-surface shadow-lift outline-none",
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-closed:translate-y-full data-starting-style:translate-y-full",
          )}
        >
          {/* Grabb-handtag */}
          <div className="flex justify-center pt-3 pb-1">
            <span className="h-1.5 w-10 rounded-full bg-line-strong" aria-hidden />
          </div>

          <div className="overflow-y-auto pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] pb-[max(1rem,calc(env(safe-area-inset-bottom)-0.5rem))]">
            <DialogPrimitive.Title className="sr-only">Meny</DialogPrimitive.Title>

            {/* Användare */}
            <div className="flex items-center gap-3 py-3">
              <Avatar initials={initialsOf(name)} size="size-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{name}</p>
                {email ? (
                  <p className="truncate text-sm text-muted-foreground">{email}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={logout}
                className="raised raised-press flex size-11 items-center justify-center rounded-xl border border-danger/25 bg-danger-soft text-danger active:bg-danger/15"
                aria-label="Logga ut"
              >
                <LogOut className="size-5" />
              </button>
            </div>

            {/* Tillbaka till verkstaden */}
            <div className="mt-1 border-t border-line pt-3">
              <Link
                href="/"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition-colors active:bg-surface-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
                  <Store className="size-5" />
                </span>
                <span className="flex-1 text-[0.95rem] font-semibold text-ink">
                  Till verkstaden
                </span>
                <ChevronRight className="size-5 text-muted-foreground/50" />
              </Link>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
