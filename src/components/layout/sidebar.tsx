"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useAnimate } from "motion/react";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { TenantSwitcher } from "./tenant-switcher";
import { type NavItem, type NavGroup } from "./nav";
import type { SwitcherData } from "@/lib/data/tenant-context";

interface SidebarProps {
  /** Navigationsgrupper (verkstad eller superadmin). */
  groups: NavGroup[];
  /** Sekundära länkar längst ner (t.ex. Inställningar). */
  secondary?: NavItem[];
  /** Bas-route för aktiv-detektion ("/" för verkstad, "/superadmin" för super). */
  homeHref: string;
  /** Om satt renderas verkstadsväljaren under loggan (bara där vi vill ha den). */
  switcher?: SwitcherData;
  /** Extra länk längst ner (t.ex. "Superadmin" eller "Till verkstaden"). */
  footer?: NavItem;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Anropas när en länk klickas – används för att stänga mobil-drawern */
  onNavigate?: () => void;
}

/* ------------------------------------------------------------------ *
 *  Markören (den ljusa brickan bakom aktiv vy)
 *
 *  Den är EN ruta som mäts fram ur länkarna och flyttas mellan dem.
 *
 *  Viktigt: den landar ALLTID exakt på en rad. Ett tidigare försök lät
 *  den krypa mot målet så länge sidan laddade, men blev laddningen lång
 *  stod brickan kvar mitt emellan två rader och såg trasig ut.
 *
 *  Att sidan fortfarande laddar visas i stället av att den orangea
 *  stapeln pulserar – samma puls som sidans skelett – så menyn och
 *  innehållet börjar och slutar röra sig samtidigt.
 * ------------------------------------------------------------------ */

/** Markörens förflyttning mellan två rader. */
const glide = { duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Länkens mått i förhållande till menyns scrollyta. */
function boxOf(el: HTMLElement, nav: HTMLElement): Box {
  const a = el.getBoundingClientRect();
  const b = nav.getBoundingClientRect();
  return {
    top: a.top - b.top + nav.scrollTop,
    left: a.left - b.left,
    width: a.width,
    height: a.height,
  };
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
  onPick,
  itemRef,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  /** Startar markörens resa direkt vid klick, utan att vänta på laddningen. */
  onPick: (href: string) => void;
  /** Registrerar elementet så markören kan mätas fram. */
  itemRef: (href: string, el: HTMLAnchorElement | null) => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      ref={(el) => itemRef(item.href, el)}
      onClick={() => {
        onPick(item.href);
        onNavigate?.();
      }}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[0.85rem] outline-none",
        "transition-colors duration-150 pointer-coarse:text-[0.95rem]",
        collapsed
          ? "h-9 w-9 justify-center pointer-coarse:h-11 pointer-coarse:w-11"
          : "h-9 gap-2.5 px-2.5 pointer-coarse:h-12 pointer-coarse:px-3",
        active
          ? "font-semibold text-brand-700"
          : "font-medium text-ink-soft hover:bg-white/70 hover:text-ink dark:hover:bg-white/[0.04]",
      )}
    >
      {/* Ingen egen bakgrund här – markören ritas en gång i <nav> och
       * flyttas mellan länkarna. relative håller innehållet ovanpå den. */}
      <Icon
        className={cn(
          "relative size-[18px] shrink-0 transition-colors",
          active
            ? "text-brand-600"
            : "text-muted-foreground group-hover:text-ink-soft",
        )}
        strokeWidth={active ? 2.25 : 2}
      />
      {!collapsed ? (
        <>
          <span className="relative truncate">{item.label}</span>
          {item.badge ? (
            <span
              className={cn(
                "relative ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[0.7rem] font-semibold tabular-nums",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white/80 text-ink-soft",
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      ) : item.badge ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand-600 ring-2 ring-white" />
      ) : null}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
      {children}
    </p>
  );
}

export function Sidebar({
  groups,
  secondary,
  homeHref,
  switcher,
  footer,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const items = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, animateIndicator] = useAnimate();
  const mounted = useRef(false);

  /**
   * usePathname byter först när den nya sidan committats, och eftersom vyerna
   * hämtar data på servern dröjer det. Textfärgen ska däremot följa fingret
   * direkt. Vi kommer därför ihåg vad som klickades tillsammans med adressen
   * det klickades från: så fort adressen ändras (navigeringen landade, eller
   * användaren gick bakåt) faller vi tillbaka på den riktiga adressen igen.
   */
  const [picked, setPicked] = useState<{ href: string; from: string } | null>(
    null,
  );
  const current = picked && picked.from === pathname ? picked.href : pathname;

  /** Sant medan den klickade sidan hämtas – adressen har inte hunnit byta än. */
  const loading = Boolean(picked && picked.from === pathname);

  const matches = (href: string, path: string) =>
    href === homeHref ? path === homeHref : path.startsWith(href);

  const isActive = (href: string) => matches(href, current);

  const hasBottom = (secondary && secondary.length > 0) || !!footer;

  /** Länken som hör till adressen vi faktiskt står på. */
  const settledHref = [
    ...groups.flatMap((g) => g.items),
    ...(secondary ?? []),
  ].find((i) => matches(i.href, pathname))?.href;

  const registerItem = useCallback(
    (href: string, el: HTMLAnchorElement | null) => {
      if (el) items.current.set(href, el);
      else items.current.delete(href);
    },
    [],
  );

  /**
   * Klick: flytta markören direkt och tänd pulsen – men bara om vi faktiskt
   * navigerar någonstans. Klickar man på raden man redan står på sker ingen
   * laddning, och då ska ingenting pulsa.
   */
  function pick(href: string) {
    moveTo(href);
    if (matches(href, pathname)) return;
    setPicked({ href, from: pathname });
  }

  /** Flyttar markören hela vägen till en rad. Aldrig någon mellanposition. */
  function moveTo(href: string) {
    const nav = navRef.current;
    const el = items.current.get(href);
    const box = indicator.current;
    if (!nav || !el || !box) return;
    void animateIndicator(box, { ...boxOf(el, nav), opacity: 1 }, glide);
  }

  /* Rättar markören när sidan landat, och vid hopfällning, fönsterändring
   * eller navigering utanför menyn (bakåtknapp, flikfältet på mobilen). Är
   * den redan på plats blir det ingen synlig rörelse. */
  useLayoutEffect(() => {
    const nav = navRef.current;
    const box = indicator.current;
    const el = settledHref ? items.current.get(settledHref) : null;
    if (!nav || !box) return;

    if (!el) {
      // Ingen meny-post matchar adressen – tona bort markören.
      void animateIndicator(box, { opacity: 0 }, { duration: 0.15 });
      return;
    }

    const to = boxOf(el, nav);
    const first = !mounted.current;
    mounted.current = true;
    void animateIndicator(
      box,
      { ...to, opacity: 1 },
      first ? { duration: 0 } : glide,
    );

    const onResize = () => {
      const el2 = settledHref ? items.current.get(settledHref) : null;
      if (el2 && navRef.current) {
        void animateIndicator(box, boxOf(el2, navRef.current), {
          duration: 0,
        });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [settledHref, collapsed, animateIndicator, indicator]);

  return (
    <div className="flex h-full flex-col bg-linear-to-b from-[#fff1e4] via-[#fff9f4] to-white dark:from-[#1c1813] dark:via-[#151311] dark:to-[#100f0d]">
      {/* Toppsektion med logga */}
      <div
        className={cn(
          "flex h-16 items-center justify-center border-b border-line/70",
          collapsed ? "px-2" : "px-4",
        )}
      >
        <Logo iconOnly={collapsed} />
      </div>

      {/* Aktiv tenant / byt verkstad – renderas bara där väljaren ska finnas
          (superadmin). Verkstadens meny visar den inte längre. */}
      {switcher ? (
        <div className="border-b border-line/70">
          <TenantSwitcher data={switcher} collapsed={collapsed} />
        </div>
      ) : null}

      {/* Navigation */}
      <nav
        ref={navRef}
        className={cn(
          "relative flex flex-1 flex-col overflow-y-auto py-3",
          collapsed ? "items-center gap-1 px-2" : "gap-4 px-3",
        )}
      >
        {/* Markören – ligger bakom länkarna och flyttas mellan dem. */}
        <div
          ref={indicator}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-9 w-0 rounded-lg bg-white opacity-0 shadow-[0_1px_2px_rgb(15_42_67/0.08)] ring-1 ring-brand-100 dark:bg-white/[0.07] dark:shadow-none dark:ring-white/10"
        >
          {!collapsed ? (
            <span
              className={cn(
                "absolute top-1/2 left-0 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600 transition-all duration-200",
                // Medan sidan hämtas sträcker sig stapeln och pulserar i takt
                // med skelettet på sidan – samma språk, samma tempo.
                loading ? "h-7 animate-pulse" : "h-4",
              )}
            />
          ) : null}
        </div>

        {groups.map((group, gi) => (
          <div
            key={group.label}
            className={cn(
              "flex flex-col gap-0.5",
              collapsed && "w-full items-center",
            )}
          >
            {!collapsed ? (
              <SectionLabel>{group.label}</SectionLabel>
            ) : gi > 0 ? (
              <div className="mx-auto mb-1 h-px w-5 bg-line" />
            ) : null}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
                onPick={pick}
                itemRef={registerItem}
              />
            ))}
          </div>
        ))}

        {/* Sekundär navigation + ev. extra länk – förankrad nederst */}
        {hasBottom ? (
          <div
            className={cn(
              "mt-auto flex flex-col gap-0.5 border-t border-line/70 pt-3",
              collapsed && "w-full items-center",
            )}
          >
            {secondary?.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
                onPick={pick}
                itemRef={registerItem}
              />
            ))}
            {footer ? (
              <NavLink
                item={footer}
                active={false}
                collapsed={collapsed}
                onNavigate={onNavigate}
                onPick={pick}
                itemRef={registerItem}
              />
            ) : null}
          </div>
        ) : null}
      </nav>

      {/* Bottensektion: kollaps-knapp (endast desktop) */}
      {onToggleCollapse ? (
        <div className="border-t border-line/70 p-2.5">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden h-9 items-center rounded-lg text-[0.85rem] font-medium text-muted-foreground lg:flex",
              "transition-colors hover:bg-white/70 hover:text-ink",
              collapsed ? "w-full justify-center" : "w-full gap-2 px-2.5",
            )}
            title={collapsed ? "Expandera meny" : "Fäll ihop meny"}
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed ? <span>Fäll ihop</span> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
