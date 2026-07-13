"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  Car,
  Menu,
  ClipboardCheck,
  Contact,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Check,
  ChevronRight,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/avatar";
import { TenantLogo } from "@/components/ui/tenant-logo";
import { setActiveTenant } from "@/lib/tenant-actions";
import { clearOfflinePageCache } from "@/lib/offline-cache";
import type { SwitcherData } from "@/lib/data/tenant-context";

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Primära flikar – tre på var sida om den centrerade skanna-knappen.
 * Vänster: Översikt, Kalender, Uppdrag. Höger: Ordrar, Fordon, Mer. */
const TABS: Tab[] = [
  { label: "Översikt", href: "/", icon: LayoutDashboard },
  { label: "Kalender", href: "/planering", icon: CalendarRange },
  { label: "Uppdrag", href: "/dagens-uppdrag", icon: ClipboardCheck },
  { label: "Ordrar", href: "/arbetsordrar", icon: ClipboardList },
  { label: "Fordon", href: "/fordon", icon: Car },
];

/** Sekundära destinationer – nås via "Mer". */
const MORE_LINKS: Tab[] = [
  { label: "Kunder", href: "/kunder", icon: Contact },
  { label: "Användare", href: "/anvandare", icon: Users },
  { label: "Inställningar", href: "/installningar", icon: Settings },
];

const MORE_ROUTES = [...MORE_LINKS.map((l) => l.href), "/superadmin"];

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

export function BottomNav({ switcher }: { switcher: SwitcherData }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const moreActive = MORE_ROUTES.some((r) => pathname.startsWith(r));

  const renderTab = (tab: Tab) => {
    const active = isActive(tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex flex-1 select-none flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.66rem] font-semibold transition-colors",
          active ? "text-brand-600" : "text-muted-foreground active:bg-surface-muted",
        )}
      >
        <Icon
          className={cn("size-6 transition-transform", active && "scale-105")}
          strokeWidth={active ? 2.4 : 2}
        />
        <span className="truncate">{tab.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pl-safe pr-safe pb-safe backdrop-blur-xl pointer-fine:lg:hidden"
        aria-label="Huvudnavigation"
      >
        {/* Två lika breda halvor (flex-1) med den upphöjda skanna-knappen
            exakt i mitten. På sm+ (iPad) fälls halvorna ut till jämnt
            fördelade flikar via `sm:contents` och FAB:en döljs. */}
        <div className="relative mx-auto flex max-w-2xl items-stretch">
          <div className="flex flex-1 items-stretch justify-around sm:contents">
            {TABS.slice(0, 3).map(renderTab)}
          </div>

          {/* Upphöjd skanna-knapp – exakt i mitten. Endast telefon (iPad väntar
              vi med, sm:hidden). Kort etikett "Scanna"; full lydelse i aria. */}
          <Link
            href="/scanna"
            aria-label="Scanna reggplåt"
            className="group flex shrink-0 select-none flex-col items-center justify-end gap-1 px-3 pb-1.5 sm:hidden"
          >
            <span className="-mt-7 flex size-14 items-center justify-center rounded-full brand-fill shadow-[0_10px_22px_-6px_rgb(224_122_13/0.75)] ring-4 ring-surface transition active:brightness-95">
              <ScanLine className="size-7" strokeWidth={2.2} />
            </span>
            <span className="text-[0.66rem] font-semibold text-brand-700">Scanna</span>
          </Link>

          <div className="flex flex-1 items-stretch justify-around sm:contents">
            {TABS.slice(3).map(renderTab)}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "group flex flex-1 select-none flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[0.66rem] font-semibold transition-colors",
                moreActive || moreOpen
                  ? "text-brand-600"
                  : "text-muted-foreground active:bg-surface-muted",
              )}
            >
              <Menu className="size-6" strokeWidth={moreActive || moreOpen ? 2.4 : 2} />
              <span>Mer</span>
            </button>
          </div>
        </div>
      </nav>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        switcher={switcher}
        isActive={isActive}
      />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  switcher,
  isActive,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  switcher: SwitcherData;
  isActive: (href: string) => boolean;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [pending, startTransition] = useTransition();

  const name = session?.user.name ?? "—";
  const email = session?.user.email ?? "";
  const active =
    switcher.tenants.find((t) => t.id === switcher.activeId) ??
    switcher.tenants[0] ??
    null;

  function switchTenant(id: string) {
    if (id === active?.id) return;
    startTransition(async () => {
      await setActiveTenant(id);
      await clearOfflinePageCache();
      router.refresh();
      onOpenChange(false);
    });
  }

  async function logout() {
    try {
      await authClient.signOut();
    } finally {
      // Rensa offline-cachen och gör en HÅRD navigering till login, så ingen
      // kvarhängande klient-vy av den inloggade appen kan visas efteråt.
      await clearOfflinePageCache();
      window.location.href = "/login";
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
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

          <div
            className="overflow-y-auto pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] pb-4"
          >
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
                className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger active:bg-danger/15"
                aria-label="Logga ut"
              >
                <LogOut className="size-5" />
              </button>
            </div>

            {/* Verkstad. Superadmin (Fordania) kan byta verkstad; vanliga
                användare ser bara sin egen verkstad som statisk kontext. */}
            {active ? (
              <div className="mt-1">
                <SectionLabel>
                  {switcher.isSuperadmin ? "Verkstad (superadmin)" : "Verkstad"}
                </SectionLabel>
                {switcher.isSuperadmin ? (
                  <div className="flex flex-col gap-1.5">
                    {switcher.tenants.map((t) => {
                      const isCurrent = t.id === active.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => switchTenant(t.id)}
                          disabled={pending}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                            isCurrent
                              ? "border-brand-200 bg-brand-50"
                              : "border-line bg-surface active:bg-surface-muted",
                          )}
                        >
                          <TenantLogo tenant={t} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {t.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {t.city ?? "—"}
                            </span>
                          </span>
                          {isCurrent ? (
                            <Check className="size-5 shrink-0 text-brand-600" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3">
                    <TenantLogo tenant={active} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {active.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {active.city ?? "Verkstad"}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Navigering */}
            <div className="mt-4">
              <SectionLabel>Meny</SectionLabel>
              <div className="flex flex-col">
                {MORE_LINKS.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition-colors active:bg-surface-muted",
                        active && "bg-brand-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          active
                            ? "bg-brand-100 text-brand-700"
                            : "bg-surface-muted text-ink-soft",
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span
                        className={cn(
                          "flex-1 text-[0.95rem] font-semibold",
                          active ? "text-brand-700" : "text-ink",
                        )}
                      >
                        {link.label}
                      </span>
                      <ChevronRight className="size-5 text-muted-foreground/50" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Plattformsadministration – endast global superadmin (Fordania). */}
            {switcher.isSuperadmin ? (
              <div className="mt-4 border-t border-line pt-3">
                <Link
                  href="/superadmin"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition-colors active:bg-surface-muted"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
                    <ShieldCheck className="size-5" />
                  </span>
                  <span className="flex-1 text-[0.95rem] font-semibold text-ink">
                    Superadmin
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground/50" />
                </Link>
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/60">
      {children}
    </p>
  );
}
