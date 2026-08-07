"use client";

import { useState, useSyncExternalStore } from "react";
import { Select } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface FieldSelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Höjd: "md" (44px, standard – matchar knapparnas touch-höjd) eller "sm" (36px, kompakt). */
  size?: "sm" | "md";
}

/**
 * Enhetens primära pekdon är ett finger (telefon, iPad).
 *
 * Servern kan inte veta det, så den ritar alltid desktop-varianten och
 * klienten byter direkt vid hydrering. Bytet syns inte: den stängda kontrollen
 * ser likadan ut i båda fallen (se `triggerClasses`), det är bara vad som
 * händer vid tryck som skiljer.
 *
 * En iPad med trackpad rapporterar `fine` och får därmed desktop-varianten –
 * den används då också som en dator. Vill man i stället gå på skärmbredd är
 * det den här frågan som ska ändras.
 */
const TOUCH_QUERY = "(pointer: coarse)";

function subscribeToPointer(onChange: () => void) {
  const mql = window.matchMedia(TOUCH_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useTouchPrimary() {
  return useSyncExternalStore(
    subscribeToPointer,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );
}

/**
 * Fordania-stylad dropdown.
 *
 * På dator öppnas vår egen popup (Base UI Select) – den går att styla, får
 * bock på valt värde och beter sig likadant i alla webbläsare.
 *
 * På telefon och iPad renderas i stället en riktig <select>, så att systemets
 * eget väljar-UI öppnas: iOS hjulet längst ned, Android sin lista. Det är det
 * användarna redan kan, det går att svepa i, och det tar aldrig fel plats på
 * skärmen. Kontrollen är stylad med samma klasser som vår egen trigger, så
 * skillnaden syns först när man trycker.
 *
 * Alternativen är rena strängar (value/label), vilket en <select> visar lika
 * bra som vår popup – inget innehåll går förlorat i bytet.
 */
export function FieldSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder = "Välj…",
  disabled,
  className,
  size = "md",
}: FieldSelectProps) {
  const touch = useTouchPrimary();

  // Native-grenen körs alltid kontrollerad, även när anroparen bara skickat
  // defaultValue. Då vet vi om något är valt och kan gråa ut platshållaren –
  // och värdet följer med i formulärposten precis som förut.
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value ?? internal;

  const heightClass =
    size === "sm" ? "h-8 pointer-coarse:h-10" : "h-8 pointer-coarse:h-11";

  // Gemensamt utseende för den stängda kontrollen – identiskt i båda grenarna.
  const triggerClasses =
    "flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50";

  if (touch) {
    return (
      <div className={cn("relative w-full min-w-0", heightClass, className)}>
        <select
          id={id}
          name={name}
          disabled={disabled}
          value={current}
          onChange={(e) => {
            setInternal(e.target.value);
            onValueChange?.(e.target.value);
          }}
          className={cn(
            triggerClasses,
            heightClass,
            // Systemets egen pil bort – vi ritar vår egen nedanför så att
            // kontrollen ser exakt ut som på dator. Väljar-UI:t vid tryck
            // påverkas inte av det här.
            "appearance-none truncate pr-9",
            current === "" && "text-muted-foreground",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }

  // Mappning value→label så att Select.Value visar etiketten (inte råvärdet).
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));

  return (
    // Fast höjd så Base UI:s fokusvakter inte kan ändra radens layout.
    // min-w-0 låter select:en krympa i flex-rader så långa värden inte
    // knuffar ut intilliggande element.
    <div className={cn("relative w-full min-w-0", heightClass, className)}>
    <Select.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.(v as string)}
      name={name}
    >
      <Select.Trigger
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          triggerClasses,
          "data-[popup-open]:border-brand-500 data-[popup-open]:ring-2 data-[popup-open]:ring-brand-500/30 data-placeholder:text-muted-foreground",
          heightClass,
        )}
      >
        <Select.Value placeholder={placeholder} className="min-w-0 flex-1 truncate text-left" />
        <Select.Icon
          render={
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-popup-open]_&]:rotate-180" />
          }
        />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          side="bottom"
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup className="max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] min-w-[8rem] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg ring-1 ring-black/[0.04] transition-opacity duration-100 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer items-center rounded-lg py-2 pr-8 pl-3 text-sm text-ink outline-none transition-colors select-none focus:bg-brand-50 focus:text-brand-700 data-disabled:pointer-events-none data-disabled:opacity-50"
              >
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2.5 flex items-center">
                  <Check className="size-4 text-brand-600" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    </div>
  );
}
