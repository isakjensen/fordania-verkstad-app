import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenants";

interface TenantLogoProps {
  tenant: Pick<Tenant, "name" | "initials">;
  size?: "sm" | "md";
  className?: string;
}

/** Kurerad, dämpad palett – varje företag får en egen, lugn ton. */
const palettes = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

function paletteFor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return palettes[sum % palettes.length];
}

const sizes = {
  sm: "size-8 text-xs rounded-lg",
  md: "size-10 text-sm rounded-xl",
};

/**
 * Företagsmonogram – en rundad bricka med initialer i företagets egen ton.
 * Konsekvent och rent, utan externa logotypbilder.
 */
export function TenantLogo({ tenant, size = "md", className }: TenantLogoProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-bold tracking-wide",
        sizes[size],
        paletteFor(tenant.name),
        className,
      )}
    >
      {tenant.initials}
    </span>
  );
}
