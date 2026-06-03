"use client";

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
 * Fordania-stylad dropdown byggd på Base UI Select. Ersätter native <select>
 * i hela appen – samma utseende som Input (h-10, lugn brand-fokus).
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
  // Mappning value→label så att Select.Value visar etiketten (inte råvärdet).
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));
  const heightClass =
    size === "sm" ? "h-8 pointer-coarse:h-10" : "h-8 pointer-coarse:h-11";

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
          "flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs outline-none transition-colors hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50 data-[popup-open]:border-brand-500 data-[popup-open]:ring-2 data-[popup-open]:ring-brand-500/30 data-placeholder:text-muted-foreground",
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
          <Select.Popup className="max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] min-w-[8rem] origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-lg ring-1 ring-black/[0.04] transition-[transform,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
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
